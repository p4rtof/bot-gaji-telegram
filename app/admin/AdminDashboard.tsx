"use client";

import { useMemo, useState } from "react";
import UserApprovalCard from "./UserApprovalCard";
import RequestCard from "./RequestCard";
import EmployeeSalaryCard from "./EmployeeSalaryCard";
import PayrollHistory from "./PayrollHistory";

type Tab = "approval" | "kasbon" | "gaji" | "riwayat";

export default function AdminDashboard({
  requests,
  pendingUsers,
  employees,
  overtimeEntries,
  attendanceEntries,
  unpaidKasbon,
  payrollHistory,
}: {
  requests: any[];
  pendingUsers: any[];
  employees: any[];
  overtimeEntries: any[];
  attendanceEntries: any[];
  unpaidKasbon: any[];
  payrollHistory: any[];
}) {
  const [riwayatSubTab, setRiwayatSubTab] = useState<"kasbon" | "gaji">(
    "kasbon",
  );
  const [tab, setTab] = useState<Tab>("approval");
  const [selectedEmployeeId, setSelectedEmployeeId] = useState<string>("");

  const pending = requests.filter((r) => r.status === "pending");
  const processed = requests.filter((r) => r.status !== "pending");
  const employeeKasbon = requests.filter(
    (r) => r.user_id === selectedEmployeeId && r.type === "kasbon",
  );
  const selectedEmployee = employees.find((e) => e.id === selectedEmployeeId);

  const kasbonTotalsByUser = useMemo(() => {
    const map = new Map<string, number>();
    for (const r of unpaidKasbon) {
      map.set(r.user_id, (map.get(r.user_id) ?? 0) + Number(r.amount));
    }
    return map;
  }, [unpaidKasbon]);

  const kasbonPendingCountByUser = useMemo(() => {
    const map = new Map<string, number>();
    for (const r of pending) {
      if (r.type === "kasbon") {
        map.set(r.user_id, (map.get(r.user_id) ?? 0) + 1);
      }
    }
    return map;
  }, [pending]);

  const tabs: { key: Tab; label: string; badge?: number }[] = [
    { key: "approval", label: "Pendaftaran Baru", badge: pendingUsers.length },
    {
      key: "kasbon",
      label: "Kasbon Karyawan",
      badge: pending.filter((r) => r.type === "kasbon").length,
    },
    { key: "gaji", label: "Gaji Karyawan" },
    { key: "riwayat", label: "Riwayat" },
  ];

  const switchTab = (t: Tab) => {
    setTab(t);
    setSelectedEmployeeId("");
  };

  return (
    <div className="flex flex-col gap-6">
      <div className="flex gap-1 border-b border-zinc-200 overflow-x-auto">
        {tabs.map((t) => (
          <button
            key={t.key}
            onClick={() => switchTab(t.key)}
            className={`px-4 py-2 text-sm font-medium whitespace-nowrap border-b-2 transition-colors ${
              tab === t.key
                ? "border-zinc-900 text-zinc-900"
                : "border-transparent text-zinc-400 hover:text-zinc-600"
            }`}
          >
            {t.label}
            {!!t.badge && (
              <span className="ml-2 inline-flex items-center justify-center rounded-full bg-zinc-900 text-white text-xs w-5 h-5">
                {t.badge}
              </span>
            )}
          </button>
        ))}
      </div>

      {tab === "approval" && (
        <section className="flex flex-col gap-3">
          {pendingUsers.length === 0 && (
            <p className="text-sm text-zinc-400">Tidak ada pendaftaran baru.</p>
          )}
          {pendingUsers.map((u) => (
            <UserApprovalCard key={u.id} user={u} />
          ))}
        </section>
      )}

      {tab === "kasbon" && (
        <section className="flex flex-col gap-3">
          {!selectedEmployeeId ? (
            <>
              {employees.length === 0 && (
                <p className="text-sm text-zinc-400">
                  Belum ada karyawan aktif.
                </p>
              )}
              {employees.map((emp) => {
                const badge = kasbonPendingCountByUser.get(emp.id) ?? 0;
                return (
                  <button
                    key={emp.id}
                    onClick={() => setSelectedEmployeeId(emp.id)}
                    className="flex items-center justify-between rounded-xl border border-zinc-200 bg-white px-4 py-3 text-left hover:border-zinc-400 transition-colors"
                  >
                    <div>
                      <p className="font-medium text-zinc-900">{emp.name}</p>
                      <p className="text-xs text-zinc-500">@{emp.username}</p>
                    </div>
                    <div className="flex items-center gap-2">
                      {badge > 0 && (
                        <span className="inline-flex items-center justify-center rounded-full bg-amber-500 text-white text-xs w-5 h-5">
                          {badge}
                        </span>
                      )}
                      <span className="text-zinc-400 text-sm">›</span>
                    </div>
                  </button>
                );
              })}
            </>
          ) : (
            <div className="flex flex-col gap-3">
              <button
                onClick={() => setSelectedEmployeeId("")}
                className="self-start text-sm text-zinc-500 hover:text-zinc-800 flex items-center gap-1"
              >
                ‹ Kembali ke daftar karyawan
              </button>
              <h3 className="text-sm font-medium text-zinc-700">
                Kasbon — {selectedEmployee?.name}
              </h3>
              {employeeKasbon.length === 0 && (
                <p className="text-sm text-zinc-400">
                  Belum ada pengajuan kasbon.
                </p>
              )}
              {employeeKasbon.map((r) => (
                <RequestCard
                  key={r.id}
                  request={r}
                  readOnly={r.status !== "pending"}
                />
              ))}
            </div>
          )}
        </section>
      )}

      {tab === "gaji" && (
        <section className="flex flex-col gap-3">
          {!selectedEmployeeId ? (
            <>
              {employees.length === 0 && (
                <p className="text-sm text-zinc-400">
                  Belum ada karyawan aktif.
                </p>
              )}
              {employees.map((emp) => (
                <button
                  key={emp.id}
                  onClick={() => setSelectedEmployeeId(emp.id)}
                  className="flex items-center justify-between rounded-xl border border-zinc-200 bg-white px-4 py-3 text-left hover:border-zinc-400 transition-colors"
                >
                  <div>
                    <p className="font-medium text-zinc-900">{emp.name}</p>
                    <p className="text-xs text-zinc-500">
                      @{emp.username} ·{" "}
                      {emp.salary_type
                        ? emp.salary_type === "weekly"
                          ? "Mingguan"
                          : "Harian"
                        : "Belum diatur"}
                    </p>
                  </div>
                  <span className="text-zinc-400 text-sm">›</span>
                </button>
              ))}
            </>
          ) : (
            <div className="flex flex-col gap-3">
              <button
                onClick={() => setSelectedEmployeeId("")}
                className="self-start text-sm text-zinc-500 hover:text-zinc-800 flex items-center gap-1"
              >
                ‹ Kembali ke daftar karyawan
              </button>
              {selectedEmployee && (
                <EmployeeSalaryCard
                  user={selectedEmployee}
                  overtimeEntries={overtimeEntries.filter(
                    (o) => o.user_id === selectedEmployeeId,
                  )}
                  attendanceEntries={attendanceEntries.filter(
                    (a) => a.user_id === selectedEmployeeId,
                  )}
                  pendingKasbonTotal={
                    kasbonTotalsByUser.get(selectedEmployeeId) ?? 0
                  }
                  defaultOpen
                />
              )}
            </div>
          )}
        </section>
      )}

      {tab === "riwayat" && (
        <section className="flex flex-col gap-4">
          <div className="flex gap-1 rounded-lg bg-zinc-100 p-1 w-fit">
            <button
              onClick={() => setRiwayatSubTab("kasbon")}
              className={`px-3 py-1.5 rounded-md text-sm font-medium transition-colors ${
                riwayatSubTab === "kasbon"
                  ? "bg-white text-zinc-900 shadow-sm"
                  : "text-zinc-500"
              }`}
            >
              Riwayat Kasbon
            </button>
            <button
              onClick={() => setRiwayatSubTab("gaji")}
              className={`px-3 py-1.5 rounded-md text-sm font-medium transition-colors ${
                riwayatSubTab === "gaji"
                  ? "bg-white text-zinc-900 shadow-sm"
                  : "text-zinc-500"
              }`}
            >
              Riwayat Gaji
            </button>
          </div>

          {riwayatSubTab === "kasbon" && (
            <div className="flex flex-col gap-3">
              {processed.length === 0 && (
                <p className="text-sm text-zinc-400">Belum ada riwayat.</p>
              )}
              {processed.map((r) => (
                <RequestCard key={r.id} request={r} readOnly />
              ))}
            </div>
          )}

          {riwayatSubTab === "gaji" && (
            <PayrollHistory payrollHistory={payrollHistory} />
          )}
        </section>
      )}
    </div>
  );
}
