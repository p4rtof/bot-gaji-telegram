'use server';

import { supabase } from '@/lib/supabase';
import { hashPassword } from '@/lib/auth';
import { sendTelegram } from '@/lib/telegram';

export async function register(formData: FormData) {
  const name = (formData.get('name') as string)?.trim();
  const telegramChatId = (formData.get('telegramChatId') as string)?.trim();
  const username = (formData.get('username') as string)?.trim();
  const password = formData.get('password') as string;

  if (!name || !username || !password || password.length < 6) {
    return { success: false, message: 'Lengkapi nama, username, dan password (min. 6 karakter).' };
  }

  const { data: existing } = await supabase
    .from('users')
    .select('id')
    .eq('username', username)
    .maybeSingle();

  if (existing) {
    return { success: false, message: 'Username sudah dipakai, pilih yang lain.' };
  }

  const password_hash = await hashPassword(password);

  const { data: newUser, error } = await supabase
    .from('users')
    .insert({
      name,
      telegram_chat_id: telegramChatId || null,
      username,
      password_hash,
      role: 'pegawai',
      status: 'pending',
    })
    .select()
    .single();

  if (error || !newUser) {
    console.error('Supabase insert error (register):', error);
    return { success: false, message: `Gagal mendaftar: ${error?.message}` };
  }

  const adminMsg = `🆕 Pendaftaran akun baru!\nNama: ${name}\nUsername: ${username}\nTelegram: ${telegramChatId || '(tidak ada)'}\n\nID: #${newUser.short_id}\n\nBalas pesan ini untuk proses cepat:\nACC U${newUser.short_id} → setujui akun\nTOLAK U${newUser.short_id} → tolak akun\n\nAtau cek & proses di dashboard:\nhttps://bot-gaji-telegram.vercel.app/admin`;

  await sendTelegram(process.env.ADMIN_TELEGRAM_CHAT_ID as string, adminMsg);

  return {
    success: true,
    message: telegramChatId
      ? 'Pendaftaran berhasil! Tunggu persetujuan admin sebelum bisa login.'
      : 'Pendaftaran berhasil! Tunggu persetujuan admin. Karena kamu tidak mengisi Telegram, kamu tidak akan menerima notifikasi otomatis — cek status langsung lewat aplikasi.',
  };
}
