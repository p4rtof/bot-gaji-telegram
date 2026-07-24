'use client';

import { useMemo, useState } from 'react';
import UserApprovalCard from './UserApprovalCard';
import RequestCard from './RequestCard';
import EmployeeSalaryCard from './EmployeeSalaryCard';

type Tab = 'approval' | 'kasbon' | 'gaji' | 'riwayat';

export default function AdminDashboard({
  requests,
  pendingUsers,
  employees,
  overtimeEntries,
  attendanceEntries,
  unpaidKasbon,
}: {
  requests: any[];
  pendingUsers: any[];
  employees: any[];
  overtimeEntries: any[];
  attendanceEntries: any[];
  unpaidKasbon: any[];
}) {
  const [tab, setTab] = useState<Tab>('approval');
  const [selectedEmployeeId, setSelectedEmployeeId] = useState<string>('');

  const pending = requests.filter((r) => r.status === 'pending');
  const processed = requests.filter((r) => r.status !== 'pending');
  const employeeKasbon = requests.filter(
    (r) => r.user_id === selectedEmployeeId && r.type === 'kasbon',
  );
  const selectedEmployee = employees.find((e) => e.id === selectedEmployeeId);

  const kasbonTotalsByUser = useMemo(() => {
    const map = new Map<string, number>();
    for (const r of unpaidKasbon) {
      map.set(r.user_id, (map.get(r.user_id) ?? 0) + Number(r.amount));
    }
    return map;
  }, [unpaidKasbon]);

  const tabs: { key: Tab; label: string; badge?: number }[] = [
    { key: 'approval', label: 'Pendaftaran Baru', badge: pendingUsers.length },
    { key: 'kasbon', label: 'Kasbon Karyawan', badge: pending.length },
    { key: 'gaji', label: 'Gaji Karyawan' },
    { key: 'riwayat', label: 'Riwayat' },
  ];

  return (
    <div className="flex flex-col gap-6">
      <div className="flex gap-1 border-b border-zinc-200 overflow-x-auto">
        {tabs.map((t) => (
          <button
            key={t.key}
            onClick={() => setTab(t.key)}
            className={`px-4 py-2 text-sm font-medium whitespace-nowrap border-b-2 transition-colors ${
              tab === t.key
                ? 'border-zinc-900 text-zinc-900'
                : 'border-transparent text-zinc-400 hover:text-zinc-600'
            }`}
          >
            {t.label}
            {!!t.badge && (
              <span className="ml-2 inline-flex items-center justify-center rounded-full bg-zinc-900 text-white text-xs w-5 h-5">
                {t.badge}
              </span>
            )}
          </button>
        ))}
      </div>

      {tab === 'approval' && (
        <section className="flex flex-col gap-3">
          {pendingUsers.length === 0 && (
            <p className="text-sm text-zinc-400">Tidak ada pendaftaran baru.</p>
          )}
          {pendingUsers.map((u) => (
            <UserApprovalCard key={u.id} user={u} />
          ))}
        </section>
      )}

      {tab === 'kasbon' && (
        <section className="flex flex-col gap-4">
          <EmployeePicker employees={employees} selectedId={selectedEmployeeId} onSelect={setSelectedEmployeeId} />
          {!selectedEmployeeId && (
            <p className="text-sm text-zinc-400">Pilih karyawan untuk melihat kasbonnya.</p>
          )}
          {selectedEmployeeId && (
            <div className="flex flex-col gap-3">
              <h3 className="text-sm font-medium text-zinc-700">Kasbon — {selectedEmployee?.name}</h3>
              {employeeKasbon.length === 0 && (
                <p className="text-sm text-zinc-400">Belum ada pengajuan kasbon.</p>
              )}
              {employeeKasbon.map((r) => (
                <RequestCard key={r.id} request={r} readOnly={r.status !== 'pending'} />
              ))}
            </div>
          )}
        </section>
      )}

      {tab === 'gaji' && (
        <section className="flex flex-col gap-4">
          <EmployeePicker employees={employees} selectedId={selectedEmployeeId} onSelect={setSelectedEmployeeId} />
          {!selectedEmployeeId && (
            <p className="text-sm text-zinc-400">Pilih karyawan untuk kelola gajinya.</p>
          )}
          {selectedEmployeeId && selectedEmployee && (
            <EmployeeSalaryCard
              user={selectedEmployee}
              overtimeEntries={overtimeEntries.filter((o) => o.user_id === selectedEmployeeId)}
              attendanceEntries={attendanceEntries.filter((a) => a.user_id === selectedEmployeeId)}
              pendingKasbonTotal={kasbonTotalsByUser.get(selectedEmployeeId) ?? 0}
              defaultOpen
            />
          )}
        </section>
      )}

      {tab === 'riwayat' && (
        <section className="flex flex-col gap-3">
          {processed.length === 0 && <p className="text-sm text-zinc-400">Belum ada riwayat.</p>}
          {processed.map((r) => (
            <RequestCard key={r.id} request={r} readOnly />
          ))}
        </section>
      )}
    </div>
  );
}

function EmployeePicker({
  employees,
  selectedId,
  onSelect,
}: {
  employees: any[];
  selectedId: string;
  onSelect: (id: string) => void;
}) {
  return (
    <select
      value={selectedId}
      onChange={(e) => onSelect(e.target.value)}
      className="w-full rounded-lg border border-zinc-300 px-3 py-2 text-sm bg-white"
    >
      <option value="" disabled>
        Pilih karyawan...
      </option>
      {employees.map((emp) => (
        <option key={emp.id} value={emp.id}>
          {emp.name}
        </option>
      ))}
    </select>
  );
}