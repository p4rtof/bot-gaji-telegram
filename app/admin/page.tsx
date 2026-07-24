import { supabase } from '@/lib/supabase';
import LogoutButton from '@/components/LogoutButton';
import AdminDashboard from './AdminDashboard';

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

  const { data: employees } = await supabase
    .from('users')
    .select('*')
    .eq('status', 'active')
    .order('name', { ascending: true });

  const { data: overtimeEntries } = await supabase
    .from('overtime_entries')
    .select('*')
    .order('date', { ascending: false });

  const { data: attendanceEntries } = await supabase
    .from('attendance_entries')
    .select('*')
    .order('date', { ascending: false });

  const { data: unpaidKasbon } = await supabase
    .from('requests')
    .select('*')
    .eq('type', 'kasbon')
    .eq('status', 'approved')
    .is('deducted_payroll_id', null);

  return (
    <main className="flex flex-1 flex-col px-6 py-12 bg-zinc-50 items-center">
      <div className="w-full max-w-3xl flex flex-col gap-6">
        <div className="flex items-center justify-between">
          <h1 className="text-2xl font-semibold text-zinc-900">Dashboard Admin</h1>
          <LogoutButton />
        </div>
        <AdminDashboard
          requests={requests ?? []}
          pendingUsers={pendingUsers ?? []}
          employees={employees ?? []}
          overtimeEntries={overtimeEntries ?? []}
          attendanceEntries={attendanceEntries ?? []}
          unpaidKasbon={unpaidKasbon ?? []}
        />
      </div>
    </main>
  );
}