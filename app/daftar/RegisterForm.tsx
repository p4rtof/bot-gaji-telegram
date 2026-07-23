"use client";

import { useState, useTransition } from "react";
import { register } from "./actions";

export default function RegisterForm() {
  const [message, setMessage] = useState<{ ok: boolean; text: string } | null>(
    null,
  );
  const [isPending, startTransition] = useTransition();

  function handleSubmit(formData: FormData) {
    startTransition(async () => {
      const result = await register(formData);
      setMessage({ ok: result.success, text: result.message });
    });
  }

  return (
    <form action={handleSubmit} className="flex flex-col gap-4">
      <div>
        <label className="text-sm font-medium text-zinc-700">
          Nama Lengkap
        </label>
        <input
          name="name"
          required
          className="mt-1 w-full rounded-lg border border-zinc-300 px-3 py-2"
        />
      </div>
      <div>
        <label className="text-sm font-medium text-zinc-700">
          Telegram Chat ID
        </label>
        <input
          name="telegramChatId"
          required
          placeholder="Contoh: 123456789"
          className="mt-1 w-full rounded-lg border border-zinc-300 px-3 py-2"
        />
        <p className="mt-1 text-xs text-zinc-400">
          Chat dulu bot Telegram kami{" "}
          <a
            href="https://t.me/management_gaji_bot"
            target="_blank"
            rel="noopener noreferrer"
            className="text-blue-500 font-medium hover:underline"
          >
            @management_gaji_bot
          </a>{" "}
          dan ketik /start untuk dapat Chat ID kamu.
        </p>
      </div>
      <div>
        <label className="text-sm font-medium text-zinc-700">Username</label>
        <input
          name="username"
          required
          className="mt-1 w-full rounded-lg border border-zinc-300 px-3 py-2"
        />
      </div>
      <div>
        <label className="text-sm font-medium text-zinc-700">Password</label>
        <input
          name="password"
          type="password"
          required
          minLength={6}
          className="mt-1 w-full rounded-lg border border-zinc-300 px-3 py-2"
        />
      </div>
      <button
        type="submit"
        disabled={isPending}
        className="rounded-lg bg-zinc-900 text-white py-2.5 font-medium hover:bg-zinc-800 disabled:opacity-50"
      >
        {isPending ? "Mendaftar..." : "Daftar"}
      </button>
      {message && (
        <p
          className={`text-sm ${message.ok ? "text-emerald-600" : "text-red-600"}`}
        >
          {message.text}
        </p>
      )}
    </form>
  );
}
