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

  const statusText = status === "approved" ? "SETUJUI ✅" : "TOLAK ❌";
  await sendTelegram(
    updated.users.telegram_chat_id,
    `Pengajuan ${updated.type} kamu sebesar Rp${updated.amount.toLocaleString("id-ID")} telah di-${statusText} oleh admin.`,
  );

  revalidatePath("/admin");
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

  const message =
    status === "active"
      ? `Halo ${updated.name}, akun kamu sudah disetujui admin ✅. Sekarang kamu bisa login menggunakan username "${updated.username}".`
      : `Halo ${updated.name}, pendaftaran akun kamu ditolak oleh admin ❌. Silakan hubungi admin untuk info lebih lanjut.`;

  await sendTelegram(updated.telegram_chat_id, message);

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
): Promise<{ success: boolean; message?: string }> {
  const { data: user } = await supabase
    .from("users")
    .select("*")
    .eq("id", userId)
    .single();

  if (!user) {
    return { success: false, message: "Karyawan tidak ditemukan." };
  }
  if (!user.salary_type) {
    return {
      success: false,
      message: "Karyawan ini belum diatur tipe gajinya.",
    };
  }

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

  const presentDays = (attendance ?? []).filter(
    (a) => a.status === "present",
  ).length;

  let baseAmount = 0;
  let workDaysCount: number | null = null;

  if (user.salary_type === "weekly") {
    const dailyEquivalent = Number(user.weekly_salary ?? 0) / 6; // 6 hari kerja/minggu
    workDaysCount = presentDays;
    baseAmount = presentDays * dailyEquivalent;
  } else {
    workDaysCount = presentDays;
    baseAmount = presentDays * Number(user.daily_rate ?? 0);
  }

  // kasbon yang sudah disetujui tapi belum pernah dipotong dari gaji manapun
  const { data: kasbonRequests } = await supabase
    .from("requests")
    .select("*")
    .eq("user_id", userId)
    .eq("type", "kasbon")
    .eq("status", "approved")
    .is("deducted_payroll_id", null);

  const kasbonDeduction = (kasbonRequests ?? []).reduce(
    (sum, r) => sum + Number(r.amount),
    0,
  );

  const totalAmount = baseAmount + overtimeAmount - kasbonDeduction;

  const { data: payroll, error } = await supabase
    .from("payroll_runs")
    .insert({
      user_id: userId,
      period_start: periodStart,
      period_end: periodEnd,
      salary_type: user.salary_type,
      base_amount: baseAmount,
      work_days_count: workDaysCount,
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

  if (kasbonRequests && kasbonRequests.length > 0) {
    await supabase
      .from("requests")
      .update({ deducted_payroll_id: payroll.id })
      .in(
        "id",
        kasbonRequests.map((r) => r.id),
      );
  }

  try {
    const imageBuffer = await generatePayslipImage({
      name: user.name,
      periodStart,
      periodEnd,
      salaryType: user.salary_type,
      baseAmount,
      workDaysCount,
      overtimeCount,
      overtimeAmount,
      kasbonDeduction,
      totalAmount,
    });

    const caption = `Slip gaji ${user.name}\nPeriode ${periodStart} s/d ${periodEnd}\nTotal diterima: Rp${totalAmount.toLocaleString("id-ID")}`;

    await sendTelegramPhoto(user.telegram_chat_id, imageBuffer, caption);

    await supabase
      .from("payroll_runs")
      .update({ sent_at: new Date() })
      .eq("id", payroll.id);
  } catch (err) {
    console.error("Gagal mengirim slip gaji ke Telegram:", err);
    revalidatePath("/admin");
    return {
      success: true,
      message:
        "Gaji tersimpan, tapi gagal mengirim slip ke Telegram. Cek koneksi/bot token.",
    };
  }

  revalidatePath("/admin");
  return { success: true };
}
