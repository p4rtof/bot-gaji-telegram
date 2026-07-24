'use client';

import { useState, useTransition } from 'react';
import {
  setEmployeeSalary,
  addAttendanceEntry,
  deleteAttendanceEntry,
  addOvertimeEntry,
  deleteOvertimeEntry,
  generatePayroll,
} from './actions';
import MonthCalendar from './MonthCalendar';

type SalaryType = 'weekly' | 'daily';
type AttendanceStatus = 'present' | 'absent';

interface OvertimeRow {
  id: number;
  date: string;
  note: string | null;
}

interface AttendanceRow {
  id: number;
  date: string;
  status: AttendanceStatus;
  note: string | null;
}

interface EmployeeSalaryCardProps {
  user: {
    id: string;
    name: string;
    username: string;
    telegram_chat_id: string;
    salary_type: SalaryType | null;
    weekly_salary: number | null;
    daily_rate: number | null;
    overtime_rate: number | null;
  };
  overtimeEntries: OvertimeRow[];
  attendanceEntries: AttendanceRow[];
  pendingKasbonTotal: number;
  defaultOpen?: boolean;
}

function formatRupiah(n: number): string {
  return `Rp${Math.round(n).toLocaleString('id-ID')}`;
}

export default function EmployeeSalaryCard({
  user,
  overtimeEntries,
  attendanceEntries,
  pendingKasbonTotal,
  defaultOpen = false,
}: EmployeeSalaryCardProps) {
  const [open, setOpen] = useState(defaultOpen);
  const [isPending, startTransition] = useTransition();

  const hasSalaryConfig = !!user.salary_type;
  const [editingSalary, setEditingSalary] = useState(!hasSalaryConfig);

  const [salaryType, setSalaryType] = useState<SalaryType>(user.salary_type ?? 'weekly');
  const [weeklySalary, setWeeklySalary] = useState(user.weekly_salary?.toString() ?? '');
  const [dailyRate, setDailyRate] = useState(user.daily_rate?.toString() ?? '');
  const [overtimeRate, setOvertimeRate] = useState(user.overtime_rate?.toString() ?? '');

  const [periodStart, setPeriodStart] = useState('');
  const [periodEnd, setPeriodEnd] = useState('');
  const [payrollMessage, setPayrollMessage] = useState<string | null>(null);

  const presentCount = attendanceEntries.filter((a) => a.status === 'present').length;
  const absentCount = attendanceEntries.filter((a) => a.status === 'absent').length;

  const saveSalary = () => {
    startTransition(async () => {
      await setEmployeeSalary(user.id, {
        salaryType,
        weeklySalary: salaryType === 'weekly' ? Number(weeklySalary || 0) : null,
        dailyRate: salaryType === 'daily' ? Number(dailyRate || 0) : null,
        overtimeRate: Number(overtimeRate || 0),
      });
      setEditingSalary(false);
    });
  };

  // ---- Attendance calendar: klik siklus none -> present -> absent -> none ----
  const attendanceByDate = new Map(attendanceEntries.map((e) => [e.date, e]));
  const attendanceMarked = Object.fromEntries(
    attendanceEntries.map((e) => [e.date, e.status]),
  );

  const handleAttendanceClick = (dateStr: string) => {
    const existing = attendanceByDate.get(dateStr);
    startTransition(async () => {
      if (!existing) {
        await addAttendanceEntry(user.id, dateStr, 'present');
      } else if (existing.status === 'present') {
        await addAttendanceEntry(user.id, dateStr, 'absent');
      } else {
        await deleteAttendanceEntry(existing.id);
      }
    });
  };

  const attendanceColor = (status?: string) => {
    if (status === 'present') return 'bg-emerald-500 text-white hover:bg-emerald-600';
    if (status === 'absent') return 'bg-red-400 text-white hover:bg-red-500';
    return 'bg-zinc-100 text-zinc-500 hover:bg-zinc-200';
  };

  // ---- Overtime calendar: klik toggle none <-> overtime ----
  const overtimeByDate = new Map(overtimeEntries.map((e) => [e.date, e]));
  const overtimeMarked = Object.fromEntries(
    overtimeEntries.map((e) => [e.date, 'overtime']),
  );

  const handleOvertimeClick = (dateStr: string) => {
    const existing = overtimeByDate.get(dateStr);
    startTransition(async () => {
      if (existing) {
        await deleteOvertimeEntry(existing.id);
      } else {
        await addOvertimeEntry(user.id, dateStr);
      }
    });
  };

  const overtimeColor = (status?: string) =>
    status === 'overtime'
      ? 'bg-amber-500 text-white hover:bg-amber-600'
      : 'bg-zinc-100 text-zinc-500 hover:bg-zinc-200';

  const runPayroll = () => {
    if (!periodStart || !periodEnd) {
      setPayrollMessage('Pilih tanggal mulai dan selesai periode dulu.');
      return;
    }
    setPayrollMessage(null);
    startTransition(async () => {
      const result = await generatePayroll(user.id, periodStart, periodEnd);
      if (result.success) {
        setPayrollMessage(
          result.message ?? 'Slip gaji berhasil dibuat dan dikirim ke Telegram karyawan ✅',
        );
      } else {
        setPayrollMessage(result.message ?? 'Gagal membuat slip gaji.');
      }
    });
  };

  return (
    <div className="rounded-xl border border-zinc-200 bg-white p-4 flex flex-col gap-3">
      <button
        onClick={() => setOpen((o) => !o)}
        className="flex items-center justify-between text-left"
      >
        <div>
          <p className="font-medium text-zinc-900">{user.name}</p>
          <p className="text-xs text-zinc-500">
            @{user.username} ·{' '}
            {hasSalaryConfig
              ? user.salary_type === 'weekly'
                ? `Mingguan · ${formatRupiah(user.weekly_salary ?? 0)}`
                : `Harian · ${formatRupiah(user.daily_rate ?? 0)}/hari`
              : 'Belum diatur'}
          </p>
        </div>
        <span className="text-zinc-400 text-sm">{open ? '▲' : '▼'}</span>
      </button>

      {open && (
        <div className="flex flex-col gap-5 border-t border-zinc-100 pt-4">
          {/* Salary config */}
          <div className="flex flex-col gap-2">
            <div className="flex items-center justify-between">
              <h3 className="text-xs font-medium text-zinc-500 uppercase tracking-wide">
                Pengaturan Gaji
              </h3>
              {hasSalaryConfig && !editingSalary && (
                <button
                  onClick={() => setEditingSalary(true)}
                  className="text-xs text-zinc-500 underline hover:text-zinc-800"
                >
                  Ubah
                </button>
              )}
            </div>

            {!editingSalary && hasSalaryConfig ? (
              <div className="text-sm text-zinc-700 bg-zinc-50 rounded-lg px-3 py-2 flex flex-col gap-1">
                <span>
                  Tipe: <strong>{user.salary_type === 'weekly' ? 'Mingguan' : 'Harian'}</strong>
                </span>
                <span>
                  {user.salary_type === 'weekly'
                    ? `Gaji per minggu: ${formatRupiah(user.weekly_salary ?? 0)}`
                    : `Gaji per hari: ${formatRupiah(user.daily_rate ?? 0)}`}
                </span>
                <span>Lembur: {formatRupiah(user.overtime_rate ?? 0)} / kali</span>
              </div>
            ) : (
              <>
                <div className="flex gap-2">
                  <button
                    onClick={() => setSalaryType('weekly')}
                    className={`px-3 py-1.5 rounded-lg text-sm border ${
                      salaryType === 'weekly'
                        ? 'bg-zinc-900 text-white border-zinc-900'
                        : 'border-zinc-300 text-zinc-600'
                    }`}
                  >
                    Mingguan
                  </button>
                  <button
                    onClick={() => setSalaryType('daily')}
                    className={`px-3 py-1.5 rounded-lg text-sm border ${
                      salaryType === 'daily'
                        ? 'bg-zinc-900 text-white border-zinc-900'
                        : 'border-zinc-300 text-zinc-600'
                    }`}
                  >
                    Harian
                  </button>
                </div>

                {salaryType === 'weekly' ? (
                  <input
                    type="number"
                    placeholder="Gaji mingguan (Rp)"
                    value={weeklySalary}
                    onChange={(e) => setWeeklySalary(e.target.value)}
                    className="rounded-lg border border-zinc-300 px-3 py-1.5 text-sm"
                  />
                ) : (
                  <input
                    type="number"
                    placeholder="Gaji per hari (Rp)"
                    value={dailyRate}
                    onChange={(e) => setDailyRate(e.target.value)}
                    className="rounded-lg border border-zinc-300 px-3 py-1.5 text-sm"
                  />
                )}

                <input
                  type="number"
                  placeholder="Bayaran per 1x lembur (Rp)"
                  value={overtimeRate}
                  onChange={(e) => setOvertimeRate(e.target.value)}
                  className="rounded-lg border border-zinc-300 px-3 py-1.5 text-sm"
                />

                <div className="flex gap-2">
                  <button
                    disabled={isPending}
                    onClick={saveSalary}
                    className="self-start px-3 py-1.5 rounded-lg bg-zinc-900 text-white text-sm hover:bg-zinc-800 disabled:opacity-50"
                  >
                    Simpan
                  </button>
                  {hasSalaryConfig && (
                    <button
                      onClick={() => setEditingSalary(false)}
                      className="self-start px-3 py-1.5 rounded-lg border border-zinc-300 text-zinc-600 text-sm"
                    >
                      Batal
                    </button>
                  )}
                </div>
              </>
            )}
          </div>

          {/* Overtime calendar */}
          <div className="flex flex-col gap-2">
            <h3 className="text-xs font-medium text-zinc-500 uppercase tracking-wide">
              Lembur — klik tanggal untuk tandai
            </h3>
            <MonthCalendar
              markedDates={overtimeMarked}
              onDayClick={handleOvertimeClick}
              colorFor={overtimeColor}
              disabled={isPending}
            />
            <div className="flex items-center gap-3 text-xs text-zinc-500">
              <span className="flex items-center gap-1">
                <span className="w-3 h-3 rounded bg-amber-500 inline-block" /> Lembur
              </span>
              <span>{overtimeEntries.length} hari lembur tercatat</span>
            </div>
          </div>

          {/* Attendance calendar */}
          <div className="flex flex-col gap-2">
            <h3 className="text-xs font-medium text-zinc-500 uppercase tracking-wide">
              Absensi — klik tanggal untuk ubah status
            </h3>
            <MonthCalendar
              markedDates={attendanceMarked}
              onDayClick={handleAttendanceClick}
              colorFor={attendanceColor}
              disabled={isPending}
            />
            <div className="flex items-center gap-3 text-xs text-zinc-500 flex-wrap">
              <span className="flex items-center gap-1">
                <span className="w-3 h-3 rounded bg-emerald-500 inline-block" /> Masuk
              </span>
              <span className="flex items-center gap-1">
                <span className="w-3 h-3 rounded bg-red-400 inline-block" /> Tidak masuk
              </span>
              <span>
                {presentCount} hari masuk · {absentCount} hari tidak masuk
              </span>
            </div>
          </div>

          {/* Payroll generation */}
          <div className="flex flex-col gap-2 border-t border-zinc-100 pt-4">
            <h3 className="text-xs font-medium text-zinc-500 uppercase tracking-wide">
              Buat &amp; Kirim Slip Gaji
            </h3>
            {pendingKasbonTotal > 0 && (
              <p className="text-xs text-amber-700 bg-amber-50 border border-amber-200 rounded-lg px-3 py-1.5">
                Ada kasbon disetujui yang belum dipotong: {formatRupiah(pendingKasbonTotal)}
              </p>
            )}
            <div className="flex gap-2 flex-wrap items-center">
              <input
                type="date"
                value={periodStart}
                onChange={(e) => setPeriodStart(e.target.value)}
                className="rounded-lg border border-zinc-300 px-2 py-1.5 text-sm"
              />
              <span className="text-zinc-400 text-sm">s/d</span>
              <input
                type="date"
                value={periodEnd}
                onChange={(e) => setPeriodEnd(e.target.value)}
                className="rounded-lg border border-zinc-300 px-2 py-1.5 text-sm"
              />
              <button
                disabled={isPending || !hasSalaryConfig}
                onClick={runPayroll}
                className="px-3 py-1.5 rounded-lg bg-emerald-600 text-white text-sm hover:bg-emerald-700 disabled:opacity-50"
              >
                {isPending ? 'Memproses...' : 'Buat & Kirim'}
              </button>
            </div>
            {!hasSalaryConfig && (
              <p className="text-xs text-zinc-400">
                Simpan pengaturan gaji dulu sebelum bisa generate slip.
              </p>
            )}
            {payrollMessage && (
              <p className="text-sm text-zinc-700 bg-zinc-50 border border-zinc-200 rounded-lg px-3 py-1.5">
                {payrollMessage}
              </p>
            )}
          </div>
        </div>
      )}
    </div>
  );
}