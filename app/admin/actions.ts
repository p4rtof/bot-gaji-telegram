"use server";

import { supabase } from "@/lib/supabase";
import { sendTelegram } from "@/lib/telegram";
import { sendTelegramPhoto } from "@/lib/telegram-photo";
import { generatePayslipImage } from "@/lib/payslip-image";
import { revalidatePath } from "next/cache";


export async function updateRequestStatus(
  requestId: number,
  status: "approved" | "rejected",
): Promise<void> {
  const { data: updated } = await supabase
    .from("requests")
    .update({ status, updated_at: new Date() })
    .eq("id", requestId)
    .select("*, users(*)")
    .single();

  if (!updated) return;

  if (updated.users?.telegram_chat_id) {
    const statusText = status === "approved" ? "SETUJUI ✅" : "TOLAK ❌";
    await sendTelegram(
      updated.users.telegram_chat_id,
      `Pengajuan ${updated.type} kamu sebesar Rp${updated.amount.toLocaleString("id-ID")} telah di-${statusText} oleh admin.`,
    );
  }

  revalidatePath("/admin");
}

// Dipakai saat admin ACC kasbon sambil kirim foto bukti transfer lewat Telegram
// (foto + caption "ACC {id}" dalam satu pesan).
export async function approveKasbonWithProof(
  requestId: number,
  proofBuffer: Buffer,
  contentType: string,
): Promise<{ success: boolean; message?: string }> {
  const { data: existing } = await supabase
    .from("requests")
    .select("*, users(*)")
    .eq("id", requestId)
    .single();

  if (!existing) {
    return { success: false, message: `Pengajuan #${requestId} tidak ditemukan.` };
  }

  const ext = contentType === "image/png" ? "png" : "jpg";
  const proofPath = `kasbon/${requestId}.${ext}`;

  const { error: uploadError } = await supabase.storage
    .from("payroll-proofs")
    .upload(proofPath, proofBuffer, { contentType, upsert: true });

  if (uploadError) {
    console.error("Gagal upload bukti transfer kasbon:", uploadError);
    return { success: false, message: "Gagal upload foto bukti transfer, coba kirim ulang." };
  }

  const { data: publicUrlData } = supabase.storage.from("payroll-proofs").getPublicUrl(proofPath);

  const { data: updated } = await supabase
    .from("requests")
    .update({ status: "approved", proof_url: publicUrlData.publicUrl, updated_at: new Date() })
    .eq("id", requestId)
    .select("*, users(*)")
    .single();

  if (!updated) {
    return { success: false, message: "Gagal menyimpan status pengajuan." };
  }

  if (updated.users?.telegram_chat_id) {
    const caption = `Pengajuan ${updated.type} kamu sebesar Rp${Number(updated.amount).toLocaleString("id-ID")} telah di-SETUJUI ✅\n\nIni bukti transfernya:`;
    await sendTelegramPhoto(updated.users.telegram_chat_id, proofBuffer, caption);
  }

  revalidatePath("/admin");
  return { success: true };
}

// Dipakai saat admin TOLAK kasbon sambil kasih alasan lewat Telegram
// (format: "TOLAK {id} {alasan}").
export async function rejectRequestWithReason(
  requestId: number,
  reason: string,
): Promise<{ success: boolean; message?: string }> {
  const { data: updated } = await supabase
    .from("requests")
    .update({ status: "rejected", reject_reason: reason, updated_at: new Date() })
    .eq("id", requestId)
    .select("*, users(*)")
    .single();

  if (!updated) {
    return { success: false, message: `Pengajuan #${requestId} tidak ditemukan.` };
  }

  if (updated.users?.telegram_chat_id) {
    await sendTelegram(
      updated.users.telegram_chat_id,
      `Pengajuan ${updated.type} kamu sebesar Rp${Number(updated.amount).toLocaleString("id-ID")} telah di-TOLAK ❌\n\nAlasan: ${reason}`,
    );
  }

  revalidatePath("/admin");
  return { success: true };
}

export async function updateUserStatus(
  userId: string,
  status: "active" | "rejected",
): Promise<void> {
  const { data: updated } = await supabase
    .from("users")
    .update({ status })
    .eq("id", userId)
    .select()
    .single();

  if (!updated) return;

  if (updated.telegram_chat_id) {
    const message =
      status === "active"
        ? `Halo ${updated.name}, akun kamu sudah disetujui admin ✅. Sekarang kamu bisa login menggunakan username "${updated.username}".`
        : `Halo ${updated.name}, pendaftaran akun kamu ditolak oleh admin ❌. Silakan hubungi admin untuk info lebih lanjut.`;

    await sendTelegram(updated.telegram_chat_id, message);
  }

  revalidatePath("/admin");
}

export async function approveUser(userId: string): Promise<void> {
  return updateUserStatus(userId, "active");
}

export async function rejectUser(userId: string): Promise<void> {
  return updateUserStatus(userId, "rejected");
}

// ================= PAYROLL =================

export async function setEmployeeSalary(
  userId: string,
  data: {
    salaryType: "weekly" | "daily";
    weeklySalary?: number | null;
    dailyRate?: number | null;
    overtimeRate?: number | null;
  },
): Promise<void> {
  await supabase
    .from("users")
    .update({
      salary_type: data.salaryType,
      weekly_salary: data.weeklySalary ?? null,
      daily_rate: data.dailyRate ?? null,
      overtime_rate: data.overtimeRate ?? null,
    })
    .eq("id", userId);

  revalidatePath("/admin");
}

export async function addAttendanceEntry(
  userId: string,
  date: string,
  status: "present" | "absent",
  note?: string,
): Promise<void> {
  await supabase
    .from("attendance_entries")
    .upsert(
      { user_id: userId, date, status, note },
      { onConflict: "user_id,date" },
    );

  revalidatePath("/admin");
}

export async function previewPayroll(
  userId: string,
  periodStart: string,
  periodEnd: string,
): Promise<
  | { error: string }
  | {
      baseAmount: number;
      workDaysCount: number;
      overtimeCount: number;
      overtimeAmount: number;
      kasbonList: { id: number; amount: number; reason: string | null; created_at: string }[];
    }
> {
  const { data: user } = await supabase.from("users").select("*").eq("short_id", userId).single();
  if (!user) return { error: "Karyawan tidak ditemukan." };
  if (!user.salary_type) return { error: "Karyawan ini belum diatur tipe gajinya." };

  const { data: attendance } = await supabase
    .from("attendance_entries")
    .select("*")
    .eq("user_id", userId)
    .gte("date", periodStart)
    .lte("date", periodEnd);

  const { data: overtime } = await supabase
    .from("overtime_entries")
    .select("*")
    .eq("user_id", userId)
    .gte("date", periodStart)
    .lte("date", periodEnd);

  const overtimeCount = overtime?.length ?? 0;
  const overtimeAmount = overtimeCount * Number(user.overtime_rate ?? 0);
  const presentDays = (attendance ?? []).filter((a) => a.status === "present").length;

  const baseAmount =
    user.salary_type === "weekly"
      ? presentDays * (Number(user.weekly_salary ?? 0) / 6)
      : presentDays * Number(user.daily_rate ?? 0);

  const { data: kasbonRequests } = await supabase
    .from("requests")
    .select("*")
    .eq("user_id", userId)
    .eq("type", "kasbon")
    .eq("status", "approved")
    .is("deducted_payroll_id", null)
    .order("created_at", { ascending: false });

  return {
    baseAmount,
    workDaysCount: presentDays,
    overtimeCount,
    overtimeAmount,
    kasbonList: (kasbonRequests ?? []).map((r) => ({
      id: r.id,
      amount: Number(r.amount),
      reason: r.reason ?? null,
      created_at: r.created_at,
    })),
  };
}

export async function deleteAttendanceEntry(id: number): Promise<void> {
  await supabase.from("attendance_entries").delete().eq("id", id);
  revalidatePath("/admin");
}

export async function addOvertimeEntry(
  userId: string,
  date: string,
  note?: string,
): Promise<void> {
  await supabase
    .from("overtime_entries")
    .upsert({ user_id: userId, date, note }, { onConflict: "user_id,date" });

  revalidatePath("/admin");
}

export async function deleteOvertimeEntry(id: number): Promise<void> {
  await supabase.from("overtime_entries").delete().eq("id", id);
  revalidatePath("/admin");
}

export async function generatePayroll(
  userId: string,
  periodStart: string,
  periodEnd: string,
  kasbonIds: number[],
  proofFormData: FormData,
): Promise<{ success: boolean; message?: string }> {
  const proofFile = proofFormData.get("proof") as File | null;
  if (!proofFile || proofFile.size === 0) {
    return { success: false, message: "Bukti transfer wajib diupload." };
  }

  const { data: user } = await supabase.from("users").select("*").eq("short_id", userId).single();
  if (!user) return { success: false, message: "Karyawan tidak ditemukan." };
  if (!user.salary_type) return { success: false, message: "Karyawan ini belum diatur tipe gajinya." };

  const { data: attendance } = await supabase
    .from("attendance_entries")
    .select("*")
    .eq("user_id", userId)
    .gte("date", periodStart)
    .lte("date", periodEnd);

  const { data: overtime } = await supabase
    .from("overtime_entries")
    .select("*")
    .eq("user_id", userId)
    .gte("date", periodStart)
    .lte("date", periodEnd);

  const overtimeCount = overtime?.length ?? 0;
  const overtimeRate = Number(user.overtime_rate ?? 0);
  const overtimeAmount = overtimeCount * overtimeRate;
  const presentDays = (attendance ?? []).filter((a) => a.status === "present").length;

  const baseAmount =
    user.salary_type === "weekly"
      ? presentDays * (Number(user.weekly_salary ?? 0) / 6)
      : presentDays * Number(user.daily_rate ?? 0);

  // Hanya kasbon yang dipilih admin, dan divalidasi ulang di server (approved, milik user ini, belum dipotong)
  let kasbonDeduction = 0;
  let kasbonRequests: any[] = [];
  if (kasbonIds.length > 0) {
    const { data } = await supabase
      .from("requests")
      .select("*")
      .in("id", kasbonIds)
      .eq("user_id", userId)
      .eq("type", "kasbon")
      .eq("status", "approved")
      .is("deducted_payroll_id", null);
    kasbonRequests = data ?? [];
    kasbonDeduction = kasbonRequests.reduce((sum, r) => sum + Number(r.amount), 0);
  }

  const totalAmount = baseAmount + overtimeAmount - kasbonDeduction;

  const { data: payroll, error } = await supabase
    .from("payroll_runs")
    .insert({
      user_id: userId,
      period_start: periodStart,
      period_end: periodEnd,
      salary_type: user.salary_type,
      base_amount: baseAmount,
      work_days_count: presentDays,
      overtime_count: overtimeCount,
      overtime_amount: overtimeAmount,
      kasbon_deduction: kasbonDeduction,
      total_amount: totalAmount,
    })
    .select()
    .single();

  if (error || !payroll) {
    return { success: false, message: "Gagal menyimpan data gaji." };
  }

  if (kasbonRequests.length > 0) {
    await supabase
      .from("requests")
      .update({ deducted_payroll_id: payroll.id })
      .in("id", kasbonRequests.map((r) => r.id));
  }

  const proofBuffer = Buffer.from(await proofFile.arrayBuffer());
  const proofPath = `${userId}/${payroll.id}.png`;

  const { error: uploadError } = await supabase.storage
    .from("payroll-proofs")
    .upload(proofPath, proofBuffer, {
      contentType: proofFile.type || "image/png",
      upsert: true,
    });

  if (!uploadError) {
    const { data: publicUrlData } = supabase.storage.from("payroll-proofs").getPublicUrl(proofPath);
    await supabase
      .from("payroll_runs")
      .update({ transfer_proof_url: publicUrlData.publicUrl })
      .eq("id", payroll.id);
  } else {
    console.error("Gagal upload bukti transfer:", uploadError);
  }

  if (user.telegram_chat_id) {
    try {
      const imageBuffer = await generatePayslipImage({
        name: user.name,
        periodStart,
        periodEnd,
        salaryType: user.salary_type,
        baseAmount,
        workDaysCount: presentDays,
        overtimeCount,
        overtimeAmount,
        kasbonDeduction,
        totalAmount,
      });

      const caption = `Slip gaji ${user.name}\nPeriode ${periodStart} s/d ${periodEnd}\nTotal diterima: Rp${totalAmount.toLocaleString("id-ID")}`;

      await sendTelegramPhoto(user.telegram_chat_id, imageBuffer, caption);
      await sendTelegramPhoto(user.telegram_chat_id, proofBuffer, "Bukti transfer gaji 💸");

      await supabase.from("payroll_runs").update({ sent_at: new Date() }).eq("id", payroll.id);
    } catch (err) {
      console.error("Gagal mengirim slip/bukti gaji ke Telegram:", err);
      revalidatePath("/admin");
      return {
        success: true,
        message: "Gaji tersimpan, tapi gagal mengirim ke Telegram. Cek koneksi/bot token.",
      };
    }
  } else {
    revalidatePath("/admin");
    return {
      success: true,
      message: "Gaji tersimpan. Karyawan ini tidak punya Telegram terdaftar, jadi slip & bukti transfer tidak dikirim otomatis.",
    };
  }

  revalidatePath("/admin");
  return { success: true };
}