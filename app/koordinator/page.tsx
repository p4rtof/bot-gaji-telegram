import { supabase } from "@/lib/supabase";
import LogoutButton from "@/components/LogoutButton";
import KoordinatorDashboard from "./KoordinatorDashboard";

export const dynamic = "force-dynamic";

export default async function KoordinatorPage() {
  const { data: employees } = await supabase
    .from("users")
    .select("*")
    .eq("status", "active")
    .order("name", { ascending: true });

  const { data: overtimeEntries } = await supabase
    .from("overtime_entries")
    .select("*")
    .order("date", { ascending: false });

  const { data: attendanceEntries } = await supabase
    .from("attendance_entries")
    .select("*")
    .order("date", { ascending: false });

  return (
    <main className="flex flex-1 flex-col px-6 py-12 bg-zinc-50 items-center">
      <div className="w-full max-w-2xl flex flex-col gap-6">
        <div className="flex items-center justify-between">
          <h1 className="text-2xl font-semibold text-zinc-900">
            Kelola Absensi &amp; Lembur
          </h1>
          <div className="flex items-center gap-3">
            <a
              href="/pengajuan"
              className="text-sm font-medium text-zinc-600 hover:text-zinc-900 underline"
            >
              Ajukan Kasbon Saya
            </a>
            <LogoutButton />
          </div>
        </div>
        <KoordinatorDashboard
          employees={employees ?? []}
          overtimeEntries={overtimeEntries ?? []}
          attendanceEntries={attendanceEntries ?? []}
        />
      </div>
    </main>
  );
}
