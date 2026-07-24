'use server';

import { supabase } from '@/lib/supabase';
import { revalidatePath } from 'next/cache';

export async function addAttendanceEntryKoordinator(
  userId: string,
  date: string,
  status: 'present' | 'absent',
  note?: string,
): Promise<void> {
  await supabase
    .from('attendance_entries')
    .upsert(
      { user_id: userId, date, status, note },
      { onConflict: 'user_id,date' },
    );

  revalidatePath('/koordinator');
}

export async function deleteAttendanceEntryKoordinator(id: number): Promise<void> {
  await supabase.from('attendance_entries').delete().eq('id', id);
  revalidatePath('/koordinator');
}

export async function addOvertimeEntryKoordinator(
  userId: string,
  date: string,
  note?: string,
): Promise<void> {
  await supabase
    .from('overtime_entries')
    .upsert({ user_id: userId, date, note }, { onConflict: 'user_id,date' });

  revalidatePath('/koordinator');
}

export async function deleteOvertimeEntryKoordinator(id: number): Promise<void> {
  await supabase.from('overtime_entries').delete().eq('id', id);
  revalidatePath('/koordinator');
}