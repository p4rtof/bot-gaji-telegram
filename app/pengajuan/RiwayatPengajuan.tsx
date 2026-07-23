'use client';

import { useMemo, useState } from 'react';

type Request = {
  id: number;
  type: string;
  amount: number;
  status: string;
  created_at: string;
};

const statusConfig: Record<string, { label: string; className: string }> = {
  approved: { label: 'Disetujui', className: 'bg-emerald-50 text-emerald-700 border-emerald-200' },
  rejected: { label: 'Ditolak', className: 'bg-red-50 text-red-600 border-red-200' },
  pending: { label: 'Menunggu', className: 'bg-amber-50 text-amber-700 border-amber-200' },
};

function startOfWeek(d: Date) {
  const date = new Date(d);
  const day = date.getDay();
  const diff = (day === 0 ? -6 : 1) - day; // mulai Senin
  date.setDate(date.getDate() + diff);
  date.setHours(0, 0, 0, 0);
  return date;
}

function startOfMonth(d: Date) {
  const date = new Date(d.getFullYear(), d.getMonth(), 1);
  date.setHours(0, 0, 0, 0);
  return date;
}

export default function RiwayatPengajuan({ requests }: { requests: Request[] }) {
  const [period, setPeriod] = useState<'week' | 'month'>('week');

  const filtered = useMemo(() => {
    const now = new Date();
    const cutoff = period === 'week' ? startOfWeek(now) : startOfMonth(now);
    return requests.filter((r) => new Date(r.created_at) >= cutoff);
  }, [requests, period]);

  const total = filtered.reduce((sum, r) => sum + Number(r.amount), 0);
  const totalApproved = filtered
    .filter((r) => r.status === 'approved')
    .reduce((sum, r) => sum + Number(r.amount), 0);

  return (
    <div className="flex flex-col gap-3">
      <div className="flex items-center justify-between">
        <h2 className="text-sm font-medium text-zinc-500 uppercase tracking-wide">
          Riwayat Pengajuan
        </h2>
        <div className="flex rounded-lg border border-zinc-200 bg-white p-0.5">
          <button
            onClick={() => setPeriod('week')}
            className={`rounded-md px-3 py-1.5 text-sm font-medium transition-colors ${
              period === 'week' ? 'bg-zinc-900 text-white' : 'text-zinc-600'
            }`}
          >
            Minggu ini
          </button>
          <button
            onClick={() => setPeriod('month')}
            className={`rounded-md px-3 py-1.5 text-sm font-medium transition-colors ${
              period === 'month' ? 'bg-zinc-900 text-white' : 'text-zinc-600'
            }`}
          >
            Bulan ini
          </button>
        </div>
      </div>

      <div className="rounded-xl border border-zinc-200 bg-white p-4">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-xs text-zinc-500">Total diajukan</p>
            <p className="text-lg font-semibold text-zinc-900">
              Rp{total.toLocaleString('id-ID')}
            </p>
          </div>
          <div className="text-right">
            <p className="text-xs text-zinc-500">Sudah disetujui</p>
            <p className="text-lg font-semibold text-emerald-600">
              Rp{totalApproved.toLocaleString('id-ID')}
            </p>
          </div>
        </div>
      </div>

      {filtered.length === 0 ? (
        <p className="text-sm text-zinc-400 py-4 text-center">
          Belum ada pengajuan {period === 'week' ? 'minggu ini' : 'bulan ini'}.
        </p>
      ) : (
        <div className="flex flex-col gap-2">
          {filtered.map((r) => {
            const status = statusConfig[r.status] ?? statusConfig.pending;
            return (
              <div
                key={r.id}
                className="flex items-center justify-between rounded-lg border border-zinc-200 bg-white px-4 py-3"
              >
                <div className="min-w-0">
                  <p className="font-medium text-zinc-900 capitalize">{r.type}</p>
                  <p className="text-xs text-zinc-500">
                    {new Date(r.created_at).toLocaleDateString('id-ID', {
                      day: 'numeric',
                      month: 'short',
                      year: 'numeric',
                    })}
                  </p>
                </div>
                <div className="flex flex-col items-end gap-1">
                  <p className="font-medium text-zinc-900">
                    Rp{Number(r.amount).toLocaleString('id-ID')}
                  </p>
                  <span
                    className={`inline-block rounded-full border px-2 py-0.5 text-xs font-medium ${status.className}`}
                  >
                    {status.label}
                  </span>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}