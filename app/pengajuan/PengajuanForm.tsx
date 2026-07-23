'use client';

import { useState, useTransition } from 'react';
import { submitPengajuan } from './actions';

export default function PengajuanForm({ userId }: { userId: string }) {
  const [message, setMessage] = useState<{ ok: boolean; text: string } | null>(null);
  const [isPending, startTransition] = useTransition();

  function handleSubmit(formData: FormData) {
    startTransition(async () => {
      const result = await submitPengajuan(formData);
      setMessage({ ok: result.success, text: result.message });
    });
  }

  return (
    <form action={handleSubmit} className="flex flex-col text-black gap-4">
      <input type="hidden" name="userId" value={userId} />
      <input type="hidden" name="type" value="kasbon" />

      <div>
        <label className="text-sm font-medium text-zinc-700">Jumlah Kasbon (Rp)</label>
        <input
          name="amount"
          type="number"
          inputMode="numeric"
          required
          min={1}
          placeholder="500000"
          className="mt-1 w-full rounded-lg border border-zinc-300 px-3 py-3 text-base"
        />
      </div>

      <div>
        <label className="text-sm font-medium text-zinc-700">Alasan</label>
        <textarea
          name="reason"
          rows={3}
          placeholder="Kebutuhan mendesak, dll"
          className="mt-1 w-full rounded-lg border border-zinc-300 px-3 py-3 text-base"
        />
      </div>

      <button
        type="submit"
        disabled={isPending}
        className="rounded-lg bg-zinc-900 text-white py-3.5 font-medium hover:bg-zinc-800 active:bg-zinc-950 disabled:opacity-50 transition-colors"
      >
        {isPending ? 'Mengirim...' : 'Kirim Pengajuan'}
      </button>

      {message && (
        <p className={`text-sm ${message.ok ? 'text-emerald-600' : 'text-red-600'}`}>
          {message.text}
        </p>
      )}
    </form>
  );
}