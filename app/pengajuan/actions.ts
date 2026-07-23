"use server";

import { supabase } from "@/lib/supabase";
import { sendTelegram } from "@/lib/telegram";
import { revalidatePath } from "next/cache";

export async function submitPengajuan(formData: FormData) {
  const userId = formData.get("userId") as string;
  const type = formData.get("type") as string;
  const amount = parseInt(formData.get("amount") as string, 10);
  const reason = (formData.get("reason") as string)?.trim() || "-";

  if (!userId || !amount || isNaN(amount)) {
    return { success: false, message: "Lengkapi semua data dengan benar." };
  }

  const { data: user } = await supabase
    .from("users")
    .select("*")
    .eq("id", userId)
    .single();
  if (!user) {
    return { success: false, message: "Pegawai tidak ditemukan." };
  }

  const { data: newRequest, error } = await supabase
    .from("requests")
    .insert({ user_id: user.id, type, amount, reason, status: "pending" })
    .select()
    .single();

  if (error || !newRequest) {
    return { success: false, message: "Gagal menyimpan pengajuan, coba lagi." };
  }

  const adminMsg = `🔔 Pengajuan baru!\nDari: ${user.name}\nJenis: ${type}\nJumlah: Rp${amount.toLocaleString("id-ID")}\nAlasan: ${reason}\n\nID: #${newRequest.id}\n\nBalas pesan ini untuk proses cepat:\nACC ${newRequest.id} → setujui\nTOLAK ${newRequest.id} → tolak\n\nAtau cek & proses di dashboard:\nhttps://bot-gaji.vercel.app/admin`;
  await sendTelegram(process.env.ADMIN_TELEGRAM_CHAT_ID as string, adminMsg);

  revalidatePath("/admin");
  return {
    success: true,
    message: "Pengajuan berhasil dikirim! Admin akan segera memproses.",
  };
}
