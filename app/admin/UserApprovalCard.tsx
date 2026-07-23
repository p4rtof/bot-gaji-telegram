'use client';

import { useTransition } from 'react';
import { approveUser, rejectUser } from './actions';

export default function UserApprovalCard({ user }: { user: any }) {
  const [isPending, startTransition] = useTransition();

  return (
    <div className="rounded-lg border border-zinc-200 bg-white p-4 flex items-center justify-between">
      <div>
        <p className="font-medium text-zinc-900">{user.name}</p>
        <p className="text-sm text-zinc-500">
          @{user.username} · {user.telegram_chat_id}
        </p>
      </div>
      <div className="flex gap-2">
        <button
          disabled={isPending}
          onClick={() => startTransition(() => approveUser(user.id))}
          className="rounded-lg bg-zinc-900 text-white px-3 py-1.5 text-sm font-medium hover:bg-zinc-800 disabled:opacity-50"
        >
          Setujui
        </button>
        <button
          disabled={isPending}
          onClick={() => startTransition(() => rejectUser(user.id))}
          className="rounded-lg border border-zinc-300 px-3 py-1.5 text-sm font-medium hover:bg-zinc-100 disabled:opacity-50"
        >
          Tolak
        </button>
      </div>
    </div>
  );
}