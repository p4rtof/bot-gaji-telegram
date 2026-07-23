"use server";

import { supabase } from "@/lib/supabase";
import { sendTelegram } from "@/lib/telegram";
import bcrypt from "bcryptjs";

function generateOtp(): string {
  return Math.floor(100000 + Math.random() * 900000).toString();
}

export async function requestReset(
  formData: FormData,
): Promise<{ success: boolean; message: string }> {
  const username = formData.get("username") as string;

  if (!username) {
    return { success: false, message: "Username wajib diisi" };
  }

  const { data: user } = await supabase
    .from("users")
    .select("id, name, telegram_chat_id, status")
    .eq("username", username)
    .single();

  if (!user) {
    // Jangan kasih tahu username gak ketemu, biar gak bisa dipakai buat nebak-nebak username valid
    return {
      success: true,
      message: "Kalau username terdaftar, kode reset sudah dikirim ke Telegram kamu.",
    };
  }

  if (user.status !== "active") {
    return {
      success: false,
      message: "Akun kamu belum aktif, hubungi admin terlebih dahulu.",
    };
  }

  const otp = generateOtp();
  const expires = new Date(Date.now() + 10 * 60 * 1000); // 10 menit

  await supabase
    .from("users")
    .update({ reset_token: otp, reset_token_expires: expires })
    .eq("id", user.id);

  await sendTelegram(
    user.telegram_chat_id,
    `Halo ${user.name}, kode reset password kamu adalah *${otp}*. Kode berlaku 10 menit. Jangan bagikan kode ini ke siapa pun.`,
  );

  return {
    success: true,
    message: "Kalau username terdaftar, kode reset sudah dikirim ke Telegram kamu.",
  };
}

export async function confirmReset(
  formData: FormData,
): Promise<{ success: boolean; message: string }> {
  const username = formData.get("username") as string;
  const code = formData.get("code") as string;
  const password = formData.get("password") as string;

  if (!username || !code || !password) {
    return { success: false, message: "Semua field wajib diisi" };
  }

  if (password.length < 6) {
    return { success: false, message: "Password minimal 6 karakter" };
  }

  const { data: user } = await supabase
    .from("users")
    .select("id, reset_token, reset_token_expires")
    .eq("username", username)
    .single();

  if (!user || !user.reset_token || user.reset_token !== code) {
    return { success: false, message: "Kode reset salah atau tidak valid" };
  }

  if (!user.reset_token_expires || new Date(user.reset_token_expires) < new Date()) {
    return { success: false, message: "Kode reset sudah kedaluwarsa, minta kode baru" };
  }

  const passwordHash = await bcrypt.hash(password, 10);

  await supabase
    .from("users")
    .update({
      password_hash: passwordHash,
      reset_token: null,
      reset_token_expires: null,
    })
    .eq("id", user.id);

  return { success: true, message: "Password berhasil diubah, silakan login" };
}