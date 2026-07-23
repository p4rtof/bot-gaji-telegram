'use server';

import { supabase } from '@/lib/supabase';
import { verifyPassword, createSession } from '@/lib/auth';
import { redirect } from 'next/navigation';

export async function login(formData: FormData) {
  const username = formData.get('username') as string;
  const password = formData.get('password') as string;

  const { data: user } = await supabase
    .from('users')
    .select('*')
    .eq('username', username)
    .single();

  if (!user || !user.password_hash) {
    return { error: 'Username atau password salah.' };
  }

  if (user.status === 'pending') {
    return { error: 'Akun kamu masih menunggu persetujuan admin.' };
  }

  if (user.status === 'rejected') {
    return { error: 'Pendaftaran kamu ditolak. Hubungi admin.' };
  }

  const valid = await verifyPassword(password, user.password_hash);
  if (!valid) {
    return { error: 'Username atau password salah.' };
  }

  await createSession(user);
  redirect(user.role === 'admin' ? '/admin' : '/pengajuan');
}