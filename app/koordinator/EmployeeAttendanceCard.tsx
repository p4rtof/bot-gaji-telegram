'use client';

import { useState, useTransition } from 'react';
import MonthCalendar from '@/components/MonthCalendar';
import {
  addAttendanceEntryKoordinator,
  deleteAttendanceEntryKoordinator,
  addOvertimeEntryKoordinator,
  deleteOvertimeEntryKoordinator,
} from './actions';

type AttendanceEntry = { id: number; date: string; status: 'present' | 'absent' };
type OvertimeEntry = { id: number; date: string };

function attendanceColor(status?: string) {
  switch (status) {
    case 'present':
      return 'bg-green-100 text-green-700';
    case 'absent':
      return 'bg-red-100 text-red-700';
    default:
      return 'bg-zinc-50 text-zinc-400';
  }
}

function overtimeColor(status?: string) {
  return status ? 'bg-purple-100 text-purple-700' : 'bg-zinc-50 text-zinc-400';
}

export default function EmployeeAttendanceCard({
  user,
  overtimeEntries,
  attendanceEntries,
}: {
  user: any;
  overtimeEntries: OvertimeEntry[];
  attendanceEntries: AttendanceEntry[];
}) {
  const [isPending, startTransition] = useTransition();

  // date -> status (untuk warna kalender)
  const [attendanceStatus, setAttendanceStatus] = useState<Record<string, string>>(
    Object.fromEntries(attendanceEntries.map((a) => [a.date, a.status])),
  );
  // date -> id (untuk keperluan delete)
  const [attendanceIds, setAttendanceIds] = useState<Record<string, number>>(
    Object.fromEntries(attendanceEntries.map((a) => [a.date, a.id])),
  );

  const [overtimeMap, setOvertimeMap] = useState<Record<string, string>>(
    Object.fromEntries(overtimeEntries.map((o) => [o.date, 'present'])),
  );
  const [overtimeIds, setOvertimeIds] = useState<Record<string, number>>(
    Object.fromEntries(overtimeEntries.map((o) => [o.date, o.id])),
  );

  // Klik tanggal absensi: kosong -> present -> absent -> kosong (hapus)
  const cycleAttendance = (dateStr: string) => {
    const current = attendanceStatus[dateStr];

    startTransition(async () => {
      if (!current) {
        await addAttendanceEntryKoordinator(user.id, dateStr, 'present');
        setAttendanceStatus((prev) => ({ ...prev, [dateStr]: 'present' }));
      } else if (current === 'present') {
        await addAttendanceEntryKoordinator(user.id, dateStr, 'absent');
        setAttendanceStatus((prev) => ({ ...prev, [dateStr]: 'absent' }));
      } else {
        const id = attendanceIds[dateStr];
        if (id) await deleteAttendanceEntryKoordinator(id);
        setAttendanceStatus((prev) => {
          const copy = { ...prev };
          delete copy[dateStr];
          return copy;
        });
        setAttendanceIds((prev) => {
          const copy = { ...prev };
          delete copy[dateStr];
          return copy;
        });
      }
    });
  };

  // Klik tanggal lembur: toggle ada/tidak ada
  const toggleOvertime = (dateStr: string) => {
    const exists = overtimeMap[dateStr];

    startTransition(async () => {
      if (!exists) {
        await addOvertimeEntryKoordinator(user.id, dateStr);
        setOvertimeMap((prev) => ({ ...prev, [dateStr]: 'present' }));
      } else {
        const id = overtimeIds[dateStr];
        if (id) await deleteOvertimeEntryKoordinator(id);
        setOvertimeMap((prev) => {
          const copy = { ...prev };
          delete copy[dateStr];
          return copy;
        });
        setOvertimeIds((prev) => {
          const copy = { ...prev };
          delete copy[dateStr];
          return copy;
        });
      }
    });
  };

  return (
    <div className="flex flex-col gap-4 rounded-xl border border-zinc-200 bg-white p-4">
      <div>
        <h2 className="text-lg font-semibold text-zinc-900">{user.name}</h2>
        <p className="text-sm text-zinc-500">@{user.username}</p>
      </div>

      <div>
        <h3 className="mb-2 text-sm font-medium text-zinc-700">
          Absensi <span className="text-xs text-zinc-400">(klik: hadir → absen → hapus)</span>
        </h3>
        <MonthCalendar
          markedDates={attendanceStatus}
          onDayClick={cycleAttendance}
          colorFor={attendanceColor}
          disabled={isPending}
        />
      </div>

      <div>
        <h3 className="mb-2 text-sm font-medium text-zinc-700">
          Lembur <span className="text-xs text-zinc-400">(klik: tandai / hapus)</span>
        </h3>
        <MonthCalendar
          markedDates={overtimeMap}
          onDayClick={toggleOvertime}
          colorFor={overtimeColor}
          disabled={isPending}
        />
      </div>
    </div>
  );
}