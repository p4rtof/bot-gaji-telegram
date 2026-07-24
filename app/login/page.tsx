"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

export default function LoginPage() {
  const router = useRouter();
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError("");

    try {
      const res = await fetch("/api/auth/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ username, password }),
      });

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data?.message || "Username atau password salah");
      }

      if (data?.role === "admin") router.push("/admin");
      else if (data?.role === "koordinator") router.push("/koordinator");
      else router.push("/pengajuan");
      router.refresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Terjadi kesalahan");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="flex flex-1 flex-col items-center justify-center bg-zinc-50 px-4 py-8">
      <div className="w-full sm:max-w-sm">
        <div className="text-center mb-8">
          <span className="inline-block text-xs font-medium tracking-wide text-zinc-500 uppercase bg-white border border-zinc-200 rounded-full px-3 py-1 mb-6">
            Manajemen Gaji
          </span>
          <h1 className="text-3xl font-semibold text-zinc-900 tracking-tight mb-3">
            Masuk ke Akun
          </h1>
          <p className="text-zinc-500 leading-relaxed">
            Masuk untuk mengajukan kasbon atau mengelola persetujuan.
          </p>
        </div>

        <form onSubmit={handleSubmit}>
          {error && (
            <div className="mb-4 rounded-lg bg-red-50 border border-red-200 text-red-600 text-sm px-4 py-3">
              {error}
            </div>
          )}

          <div className="mb-4">
            <label
              htmlFor="username"
              className="block text-sm font-medium text-zinc-700 mb-1.5"
            >
              Username
            </label>
            <input
              id="username"
              type="text"
              required
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              placeholder="username"
              className="w-full rounded-lg border border-zinc-300 px-4 py-3 text-base text-zinc-900 placeholder:text-zinc-400 focus:outline-none focus:ring-2 focus:ring-zinc-900 focus:border-transparent transition-shadow"
            />
          </div>

          <div className="mb-6">
            <label
              htmlFor="password"
              className="block text-sm font-medium text-zinc-700 mb-1.5"
            >
              Password
            </label>
            <input
              id="password"
              type="password"
              required
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="password"
              className="w-full rounded-lg border border-zinc-300 px-4 py-3 text-base text-zinc-900 placeholder:text-zinc-400 focus:outline-none focus:ring-2 focus:ring-zinc-900 focus:border-transparent transition-shadow"
            />
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full rounded-lg bg-zinc-900 text-white px-6 py-3.5 font-medium hover:bg-zinc-800 active:bg-zinc-950 transition-colors disabled:opacity-60 disabled:cursor-not-allowed"
          >
            {loading ? "Memproses..." : "Masuk"}
          </button>
        </form>

        <p className="text-center text-sm text-zinc-500 mt-4">
          <a href="/forgot-password" className="hover:underline">
            Lupa password?
          </a>
        </p>

        <p className="text-center text-sm text-zinc-500 mt-2">
          Belum punya akun?{" "}
          <a
            href="/daftar"
            className="text-zinc-900 font-medium hover:underline"
          >
            Daftar di sini
          </a>
        </p>
      </div>
    </div>
  );
}
