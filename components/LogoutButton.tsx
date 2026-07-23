'use client';

import { useTransition } from 'react';
import { logout } from '@/lib/auth-actions';

export default function LogoutButton() {
  const [isPending, startTransition] = useTransition();

  return (
    <button
      onClick={() => startTransition(() => logout())}
      disabled={isPending}
      className="rounded-lg border border-zinc-300 bg-white px-4 py-2 text-sm font-medium text-zinc-700 hover:bg-zinc-100 disabled:opacity-50 transition-colors"
    >
      {isPending ? 'Keluar...' : 'Keluar'}
    </button>
  );
}