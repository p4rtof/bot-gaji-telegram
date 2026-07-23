import RegisterForm from './RegisterForm';

export default function DaftarPage() {
  return (
    <main className="flex flex-1 flex-col text-black items-center justify-center bg-zinc-50 px-6">
      <div className="w-full max-w-sm">
        <h1 className="text-2xl font-semibold text-zinc-900 mb-1">Daftar Akun Pegawai</h1>
        <p className="text-sm text-zinc-500 mb-6">Akun kamu perlu disetujui admin sebelum bisa login.</p>
        <RegisterForm />
      </div>
    </main>
  );
}