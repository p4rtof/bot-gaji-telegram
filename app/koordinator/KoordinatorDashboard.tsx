'use client';

import { useState } from 'react';
import EmployeeAttendanceCard from './EmployeeAttendanceCard';

export default function KoordinatorDashboard({
  employees,
  overtimeEntries,
  attendanceEntries,
}: {
  employees: any[];
  overtimeEntries: any[];
  attendanceEntries: any[];
}) {
  const [selectedEmployeeId, setSelectedEmployeeId] = useState<string>('');
  const selectedEmployee = employees.find((e) => e.id === selectedEmployeeId);

  if (!selectedEmployeeId) {
    return (
      <section className="flex flex-col gap-3">
        {employees.length === 0 && (
          <p className="text-sm text-zinc-400">Belum ada karyawan aktif.</p>
        )}
        {employees.map((emp) => {
          const presentCount = attendanceEntries.filter(
            (a) => a.user_id === emp.id && a.status === 'present',
          ).length;
          const overtimeCount = overtimeEntries.filter((o) => o.user_id === emp.id).length;
          return (
            <button
              key={emp.id}
              onClick={() => setSelectedEmployeeId(emp.id)}
              className="flex items-center justify-between rounded-xl border border-zinc-200 bg-white px-4 py-3 text-left hover:border-zinc-400 transition-colors"
            >
              <div>
                <p className="font-medium text-zinc-900">{emp.name}</p>
                <p className="text-xs text-zinc-500">
                  @{emp.username} · {presentCount} hari masuk · {overtimeCount} lembur
                </p>
              </div>
              <span className="text-zinc-400 text-sm">›</span>
            </button>
          );
        })}
      </section>
    );
  }

  return (
    <div className="flex flex-col gap-3">
      <button
        onClick={() => setSelectedEmployeeId('')}
        className="self-start text-sm text-zinc-500 hover:text-zinc-800 flex items-center gap-1"
      >
        ‹ Kembali ke daftar karyawan
      </button>
      {selectedEmployee && (
        <EmployeeAttendanceCard
          user={selectedEmployee}
          overtimeEntries={overtimeEntries.filter((o) => o.user_id === selectedEmployeeId)}
          attendanceEntries={attendanceEntries.filter((a) => a.user_id === selectedEmployeeId)}
        />
      )}
    </div>
  );
}