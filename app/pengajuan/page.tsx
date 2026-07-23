import { cookies } from 'next/headers';
import { redirect } from 'next/navigation';
import { supabase } from '@/lib/supabase';
import PengajuanForm from './PengajuanForm';
import RiwayatPengajuan from './RiwayatPengajuan';
import LogoutButton from '@/components/LogoutButton';

export const dynamic = 'force-dynamic';

export default async function PengajuanPage() {
  const cookieStore = await cookies();
  const uid = cookieStore.get('uid')?.value;

  if (!uid) {
    redirect('/login');
  }

  const { data: user } = await supabase
    .from('users')
    .select('id, name, telegram_chat_id, username')
    .eq('id', uid)
    .single();

  if (!user) {
    redirect('/login');
  }

  const { data: myRequests } = await supabase
    .from('requests')
    .select('id, type, amount, status, created_at')
    .eq('user_id', user.id)
    .order('created_at', { ascending: false });

  const initials = user.name
    .split(' ')
    .map((w: string) => w[0])
    .slice(0, 2)
    .join('')
    .toUpperCase();

  return (
    <main className="flex flex-1 flex-col px-4 py-8 bg-zinc-50 sm:items-center sm:px-6 sm:py-16">
      <div className="w-full sm:max-w-md flex flex-col gap-6">
        <div className="flex items-center gap-3 bg-white border border-zinc-200 rounded-xl px-4 py-3">
          <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full bg-zinc-900 text-white font-medium">
            {initials}
          </div>
          <div className="min-w-0 flex-1">
            <p className="font-medium text-zinc-900 truncate">{user.name}</p>
            <p className="text-sm text-zinc-500 truncate">{user.telegram_chat_id}</p>
          </div>
          <LogoutButton />
        </div>

        <div>
          <h1 className="text-2xl font-semibold text-zinc-900 mb-1">
            Ajukan Kasbon 
          </h1>
          <p className="text-sm text-zinc-500 mb-6">
            Isi form di bawah. Admin akan otomatis dapat notifikasi Telegram.
          </p>
          <PengajuanForm userId={user.id} />
        </div>

        <RiwayatPengajuan requests={myRequests ?? []} />
      </div>
    </main>
  );
}