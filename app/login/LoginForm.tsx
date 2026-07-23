'use client';

import { useState, useTransition } from 'react';
import { login } from './actions';

export default function LoginForm() {
  const [error, setError] = useState('');
  const [isPending, startTransition] = useTransition();

  function handleSubmit(formData: FormData) {
    setError('');
    startTransition(async () => {
      const result = await login(formData);
      if (result?.error) setError(result.error);
    });
  }

  return (
    <form action={handleSubmit} className="flex flex-col gap-4">
      <div>
        <label className="text-sm font-medium text-zinc-700">Username</label>
        <input name="username" required className="mt-1 w-full rounded-lg border border-zinc-300 px-3 py-2" />
      </div>
      <div>
        <label className="text-sm font-medium text-zinc-700">Password</label>
        <input name="password" type="password" required className="mt-1 w-full rounded-lg border border-zinc-300 px-3 py-2" />
      </div>
      <button
        type="submit"
        disabled={isPending}
        className="rounded-lg bg-zinc-900 text-white py-2.5 font-medium hover:bg-zinc-800 disabled:opacity-50"
      >
        {isPending ? 'Memproses...' : 'Masuk'}
      </button>
      {error && <p className="text-sm text-red-600">{error}</p>}
    </form>
  );
}