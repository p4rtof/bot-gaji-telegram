import { supabase } from '@/lib/supabase';
import RequestCard from './RequestCard';
import UserApprovalCard from './UserApprovalCard';
import LogoutButton from '@/components/LogoutButton';

export const dynamic = 'force-dynamic';

export default async function AdminPage() {
  const { data: requests } = await supabase
    .from('requests')
    .select('*, users(*)')
    .order('created_at', { ascending: false });

  const { data: pendingUsers } = await supabase
    .from('users')
    .select('*')
    .eq('status', 'pending')
    .order('created_at', { ascending: false });

  const pending = requests?.filter((r) => r.status === 'pending') ?? [];
  const processed = requests?.filter((r) => r.status !== 'pending') ?? [];

  return (
    <main className="flex flex-1 flex-col px-6 py-12 bg-zinc-50 items-center">
      <div className="w-full max-w-2xl flex flex-col gap-8">
        <h1 className="text-2xl font-semibold text-zinc-900">Dashboard Admin</h1>
        <LogoutButton></LogoutButton>
        <section className="flex flex-col gap-3">
          <h2 className="text-sm font-medium text-zinc-500 uppercase tracking-wide">
            Pendaftaran Baru ({pendingUsers?.length ?? 0})
          </h2>
          {(!pendingUsers || pendingUsers.length === 0) && (
            <p className="text-sm text-zinc-400">Tidak ada pendaftaran baru.</p>
          )}
          {pendingUsers?.map((u) => (
            <UserApprovalCard key={u.id} user={u} />
          ))}
        </section>

        <section className="flex flex-col gap-3">
          <h2 className="text-sm font-medium text-zinc-500 uppercase tracking-wide">
            Menunggu persetujuan ({pending.length})
          </h2>
          {pending.length === 0 && (
            <p className="text-sm text-zinc-400">Tidak ada pengajuan yang menunggu.</p>
          )}
          {pending.map((r) => (
            <RequestCard key={r.id} request={r} />
          ))}
        </section>

        <section className="flex flex-col gap-3">
          <h2 className="text-sm font-medium text-zinc-500 uppercase tracking-wide">Riwayat</h2>
          {processed.map((r) => (
            <RequestCard key={r.id} request={r} readOnly />
          ))}
        </section>
      </div>
    </main>
  );
}