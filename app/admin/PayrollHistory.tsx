'use client';

interface PayrollRun {
  id: number;
  user_id: string;
  period_start: string;
  period_end: string;
  salary_type: string;
  base_amount: number;
  work_days_count: number;
  overtime_count: number;
  overtime_amount: number;
  kasbon_deduction: number;
  total_amount: number;
  transfer_proof_url: string | null;
  sent_at: string | null;
  users: { name: string; username: string } | null;
}

function formatRupiah(n: number): string {
  return `Rp${Math.round(n).toLocaleString('id-ID')}`;
}

function formatTanggal(dateStr: string): string {
  return new Date(dateStr).toLocaleDateString('id-ID', {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
  });
}

export default function PayrollHistory({ payrollHistory }: { payrollHistory: PayrollRun[] }) {
  if (payrollHistory.length === 0) {
    return (
      <p className="text-sm text-zinc-400 text-center py-8">
        Belum ada riwayat pembayaran gaji.
      </p>
    );
  }

  return (
    <div className="flex flex-col gap-3">
      {payrollHistory.map((p) => (
        <div key={p.id} className="rounded-xl border border-zinc-200 bg-white p-4 flex flex-col gap-3">
          <div className="flex items-center justify-between">
            <div>
              <p className="font-medium text-zinc-900">{p.users?.name ?? 'Karyawan'}</p>
              <p className="text-xs text-zinc-500">
                @{p.users?.username} · Periode {formatTanggal(p.period_start)} – {formatTanggal(p.period_end)}
              </p>
            </div>
            <span className="text-lg font-semibold text-emerald-700">
              {formatRupiah(p.total_amount)}
            </span>
          </div>

          <div className="text-sm text-zinc-600 flex flex-col gap-1 bg-zinc-50 rounded-lg p-3">
            <div className="flex justify-between">
              <span>Gaji pokok ({p.work_days_count} hari masuk)</span>
              <span>{formatRupiah(p.base_amount)}</span>
            </div>
            <div className="flex justify-between">
              <span>Lembur ({p.overtime_count}x)</span>
              <span>{formatRupiah(p.overtime_amount)}</span>
            </div>
            {p.kasbon_deduction > 0 && (
              <div className="flex justify-between text-red-600">
                <span>Potongan kasbon</span>
                <span>-{formatRupiah(p.kasbon_deduction)}</span>
              </div>
            )}
          </div>

          <div className="flex items-center justify-between text-xs text-zinc-400">
            <span>{p.sent_at ? `Dikirim ${formatTanggal(p.sent_at)}` : 'Belum terkirim ke Telegram'}</span>
            {p.transfer_proof_url && (
            <a 
                href={p.transfer_proof_url}
                target="_blank"
                rel="noopener noreferrer"
                className="text-zinc-600 underline hover:text-zinc-900"
              >
                Lihat bukti transfer
              </a>
            )}
          </div>
        </div>
      ))}
    </div>
  );
}