'use server';

import { supabase } from '@/lib/supabase';
import { hashPassword } from '@/lib/auth';

export async function register(formData: FormData) {
  const name = (formData.get('name') as string)?.trim();
  const telegramChatId = (formData.get('telegramChatId') as string)?.trim();
  const username = (formData.get('username') as string)?.trim();
  const password = formData.get('password') as string;

  if (!name || !telegramChatId || !username || !password || password.length < 6) {
    return { success: false, message: 'Lengkapi semua data. Password minimal 6 karakter.' };
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

  const { error } = await supabase.from('users').insert({
    name,
    telegram_chat_id: telegramChatId,
    username,
    password_hash,
    role: 'pegawai',
    status: 'pending',
  });

  if (error) {
    return { success: false, message: 'Gagal mendaftar, coba lagi.' };
  }

  return { success: true, message: 'Pendaftaran berhasil! Tunggu persetujuan admin sebelum bisa login.' };
}