'use client';

import { useState, useTransition } from 'react';
import { useRouter } from 'next/navigation';
import { requestReset, confirmReset } from './actions';

export default function ForgotPasswordPage() {
  const router = useRouter();
  const [step, setStep] = useState<'request' | 'confirm'>('request');
  const [username, setUsername] = useState('');
  const [message, setMessage] = useState<{ ok: boolean; text: string } | null>(null);
  const [isPending, startTransition] = useTransition();

  function handleRequest(formData: FormData) {
    const u = formData.get('username') as string;
    startTransition(async () => {
      const result = await requestReset(formData);
      setMessage({ ok: result.success, text: result.message });
      if (result.success) {
        setUsername(u);
        setStep('confirm');
      }
    });
  }

  function handleConfirm(formData: FormData) {
    formData.set('username', username);
    startTransition(async () => {
      const result = await confirmReset(formData);
      setMessage({ ok: result.success, text: result.message });
      if (result.success) {
        setTimeout(() => router.push('/login'), 1500);
      }
    });
  }

  return (
    <div className="flex flex-1 flex-col items-center justify-center bg-zinc-50 px-4 py-8">
      <div className="w-full sm:max-w-md">
        <div className="text-center mb-8">
          <span className="inline-block text-xs font-medium tracking-wide text-zinc-500 uppercase bg-white border border-zinc-200 rounded-full px-3 py-1 mb-6">
            Sistem Kasbon & Reimburse
          </span>
          <h1 className="text-3xl font-semibold text-zinc-900 tracking-tight mb-3">
            Lupa Password
          </h1>
          <p className="text-zinc-500 leading-relaxed">
            {step === 'request'
              ? 'Masukkan username kamu, kode reset akan dikirim lewat Telegram.'
              : 'Masukkan kode yang dikirim ke Telegram kamu dan password baru.'}
          </p>
        </div>

        <div className="bg-white border border-zinc-200 rounded-xl p-6 sm:p-8 shadow-sm">
          {message && (
            <div
              className={`mb-4 rounded-lg border text-sm px-4 py-3 ${
                message.ok
                  ? 'bg-emerald-50 border-emerald-200 text-emerald-700'
                  : 'bg-red-50 border-red-200 text-red-600'
              }`}
            >
              {message.text}
            </div>
          )}

          {step === 'request' ? (
            <form action={handleRequest} className="flex flex-col gap-4">
              <div>
                <label className="text-sm font-medium text-zinc-700">Username</label>
                <input
                  name="username"
                  required
                  className="mt-1 w-full rounded-lg border border-zinc-300 px-3 py-3 text-base"
                  placeholder="username kamu"
                />
              </div>
              <button
                type="submit"
                disabled={isPending}
                className="rounded-lg bg-zinc-900 text-white py-3.5 font-medium hover:bg-zinc-800 active:bg-zinc-950 disabled:opacity-50 transition-colors"
              >
                {isPending ? 'Mengirim...' : 'Kirim Kode Reset'}
              </button>
            </form>
          ) : (
            <form action={handleConfirm} className="flex flex-col gap-4">
              <div>
                <label className="text-sm font-medium text-zinc-700">Kode Reset</label>
                <input
                  name="code"
                  required
                  inputMode="numeric"
                  maxLength={6}
                  className="mt-1 w-full rounded-lg border border-zinc-300 px-3 py-3 text-base tracking-widest"
                  placeholder="123456"
                />
              </div>
              <div>
                <label className="text-sm font-medium text-zinc-700">Password Baru</label>
                <input
                  name="password"
                  type="password"
                  required
                  minLength={6}
                  className="mt-1 w-full rounded-lg border border-zinc-300 px-3 py-3 text-base"
                  placeholder="Minimal 6 karakter"
                />
              </div>
              <button
                type="submit"
                disabled={isPending}
                className="rounded-lg bg-zinc-900 text-white py-3.5 font-medium hover:bg-zinc-800 active:bg-zinc-950 disabled:opacity-50 transition-colors"
              >
                {isPending ? 'Memproses...' : 'Ubah Password'}
              </button>
              <button
                type="button"
                onClick={() => setStep('request')}
                className="text-sm text-zinc-500 hover:text-zinc-700"
              >
                Belum dapat kode? Kirim ulang
              </button>
            </form>
          )}
        </div>

        <p className="text-center text-sm text-zinc-500 mt-6">
          Sudah ingat password?{' '}
          <a href="/login" className="text-zinc-900 font-medium hover:underline">
            Kembali ke login
          </a>
        </p>
      </div>
    </div>
  );
}