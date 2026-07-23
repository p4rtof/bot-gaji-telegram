"use server";

import { supabase } from "@/lib/supabase";
import { sendTelegram } from "@/lib/telegram";
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