"use client";

import { performanceService } from "@/app/services/performance.service";
import {
  PerformanceAccount,
  PerformanceConnection,
  PerformanceMapping,
  PerformancePlatform,
  SyncJob,
} from "@/app/types/performance.type";
import { useCallback, useEffect, useState } from "react";
import { toast } from "sonner";

const PLATFORMS: PerformancePlatform[] = [
  "GOOGLE_ADS",
  "META_ADS",
  "GA4",
  "SEARCH_CONSOLE",
  "TIKTOK_ADS",
];
const label = (s: string) => s.replaceAll("_", " ");
const today = () => new Date().toISOString().slice(0, 10);
const weekAgo = () =>
  new Date(Date.now() - 7 * 86400000).toISOString().slice(0, 10);
const fmt = (s?: string | null) =>
  s ? new Date(s).toLocaleString("id-ID") : "—";

export default function PerformancePageClient({
  permissions,
}: {
  permissions: string[];
}) {
  const canManage = permissions.includes("performance.connection.create");
  const canUpdate = permissions.includes("performance.connection.update");
  const canMap = permissions.includes("performance.mapping.create");
  const canReadMap = permissions.includes("performance.mapping.read");
  const canSync = permissions.includes("performance.sync.execute");
  const canLogs = permissions.includes("performance.sync.read");
  const [connections, setConnections] = useState<PerformanceConnection[]>([]);
  const [selected, setSelected] = useState<string>("");
  const [accounts, setAccounts] = useState<PerformanceAccount[]>([]);
  const [mappings, setMappings] = useState<PerformanceMapping[]>([]);
  const [logs, setLogs] = useState<SyncJob[]>([]);
  const [loading, setLoading] = useState(false);
  const [busy, setBusy] = useState("");
  const [name, setName] = useState("");
  const [platform, setPlatform] = useState<PerformancePlatform>("GOOGLE_ADS");
  const [accountId, setAccountId] = useState("");
  const [clientId, setClientId] = useState("");
  const [projectId, setProjectId] = useState("");
  const [projectServiceId, setProjectServiceId] = useState("");
  const [start, setStart] = useState(weekAgo);
  const [end, setEnd] = useState(today);
  const [tab, setTab] = useState<
    "connections" | "accounts" | "mappings" | "logs"
  >("connections");
  const connection = connections.find((c) => c.id === selected);

  const loadConnections = useCallback(async () => {
    setLoading(true);
    try {
      const r = await performanceService.connections();
      setConnections(r.data.data);
      setSelected((v) => v || r.data.data[0]?.id || "");
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Gagal memuat Connection");
    } finally {
      setLoading(false);
    }
  }, []);
  const loadDetail = useCallback(async () => {
    if (!selected) {
      setAccounts([]);
      setLogs([]);
      return;
    }
    const tasks: Promise<unknown>[] = [
      performanceService.accounts(selected).then((r) => setAccounts(r.data)),
    ];
    if (canLogs)
      tasks.push(
        performanceService.logs(selected).then((r) => setLogs(r.data.data)),
      );
    if (canReadMap)
      tasks.push(
        performanceService.mappings().then((r) => setMappings(r.data)),
      );
    const results = await Promise.allSettled(tasks);
    results.forEach((r) => {
      if (r.status === "rejected")
        toast.error(
          r.reason instanceof Error ? r.reason.message : "Gagal memuat data",
        );
    });
  }, [selected, canLogs, canReadMap]);
  useEffect(() => {
    void loadConnections();
  }, [loadConnections]);
  useEffect(() => {
    void loadDetail();
  }, [loadDetail]);
  async function run(key: string, action: () => Promise<unknown>) {
    setBusy(key);
    try {
      await action();
      toast.success("Operasi berhasil");
      await loadConnections();
      await loadDetail();
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Operasi gagal");
    } finally {
      setBusy("");
    }
  }
  function connectGoogle() {
    if (
      !connection ||
      !["GOOGLE_ADS", "GA4", "SEARCH_CONSOLE"].includes(connection.platform)
    )
      return;
    const origin = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000";
    window.location.assign(
      `${origin}/performance/oauth/google/${encodeURIComponent(connection.id)}/start`,
    );
  }
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-semibold">Performance Integration</h1>
        <p className="text-sm text-muted-foreground">
          Koneksi platform, mapping, sinkronisasi, dan histori. Data live
          tersedia setelah credential API dikonfigurasi.
        </p>
      </div>
      <div className="grid gap-3 sm:grid-cols-3">
        {[
          ["Connections", connections.length],
          [
            "Connected",
            connections.filter((c) => c.status === "CONNECTED").length,
          ],
          [
            "Need setup",
            connections.filter((c) => c.status !== "CONNECTED").length,
          ],
        ].map(([label, value]) => (
          <div key={String(label)} className="rounded-xl border bg-card p-4">
            <p className="text-xs text-muted-foreground">{label}</p>
            <p className="text-2xl font-semibold">{value}</p>
          </div>
        ))}
      </div>
      {canManage && (
        <form
          className="flex flex-wrap gap-2 rounded-xl border p-4"
          onSubmit={(e) => {
            e.preventDefault();
            void run("create", () =>
              performanceService
                .createConnection({ name: name.trim(), platform })
                .then(() => setName("")),
            );
          }}>
          <input
            aria-label="Connection name"
            className="min-w-48 flex-1 rounded-md border bg-background px-3 py-2"
            placeholder="Nama connection"
            value={name}
            onChange={(e) => setName(e.target.value)}
            required
            minLength={2}
          />
          <select
            className="rounded-md border bg-background px-3"
            value={platform}
            onChange={(e) =>
              setPlatform(e.target.value as PerformancePlatform)
            }>
            {PLATFORMS.map((p) => (
              <option key={p} value={p}>
                {label(p)}
              </option>
            ))}
          </select>
          <button
            disabled={!!busy}
            className="rounded-md bg-primary px-4 py-2 text-primary-foreground">
            {busy === "create" ? "Menyimpan..." : "+ Connection"}
          </button>
        </form>
      )}
      <div className="grid gap-5 lg:grid-cols-[280px_1fr]">
        <section className="space-y-2 rounded-xl border bg-card p-3">
          <p className="px-2 text-sm font-semibold">
            Connections {loading ? "(Loading...)" : ""}
          </p>
          {connections.length === 0 && (
            <p className="px-2 text-sm text-muted-foreground">
              Belum ada connection.
            </p>
          )}
          {connections.map((c) => (
            <button
              type="button"
              key={c.id}
              onClick={() => setSelected(c.id)}
              className={`w-full rounded-lg border p-3 text-left ${selected === c.id ? "border-primary bg-primary/5" : "border-transparent hover:bg-muted"}`}>
              <p className="font-medium">{c.name}</p>
              <p className="text-xs text-muted-foreground">
                {label(c.platform)} · {c.status}
              </p>
            </button>
          ))}
        </section>
        <section className="min-w-0 space-y-4 rounded-xl border bg-card p-4">
          {!connection ? (
            <p className="text-sm text-muted-foreground">Pilih Connection.</p>
          ) : (
            <>
              <div className="flex flex-wrap items-start justify-between gap-3">
                <div>
                  <h2 className="text-lg font-semibold">{connection.name}</h2>
                  <p className="text-sm text-muted-foreground">
                    {label(connection.platform)} · {connection.status} · Last
                    sync: {fmt(connection.lastSuccessfulSyncAt)}
                  </p>
                </div>
                <div className="flex flex-wrap gap-2">
                  {canUpdate &&
                    ["GOOGLE_ADS", "GA4", "SEARCH_CONSOLE"].includes(
                      connection.platform,
                    ) && (
                      <button
                        className="rounded-md border px-3 py-2 text-sm"
                        onClick={connectGoogle}>
                        Connect Google
                      </button>
                    )}
                  {canUpdate && (
                    <button
                      disabled={!!busy}
                      className="rounded-md border px-3 py-2 text-sm"
                      onClick={() => {
                        if (window.confirm("Nonaktifkan connection ini?"))
                          void run("disable", () =>
                            performanceService.disableConnection(connection.id),
                          );
                      }}>
                      Disable
                    </button>
                  )}
                </div>
              </div>
              <div className="flex flex-wrap gap-2 border-b pb-3">
                {(["connections", "accounts", "mappings", "logs"] as const)
                  .filter(
                    (t) =>
                      (t !== "mappings" || canReadMap) &&
                      (t !== "logs" || canLogs),
                  )
                  .map((t) => (
                    <button
                      key={t}
                      className={`rounded-md px-3 py-2 text-sm ${tab === t ? "bg-primary text-primary-foreground" : "bg-muted"}`}
                      onClick={() => setTab(t)}>
                      {label(t)}
                    </button>
                  ))}
              </div>
              {tab === "connections" && (
                <div className="space-y-3 text-sm">
                  <p>
                    Status: <strong>{connection.status}</strong>
                  </p>
                  <p>Data through: {fmt(connection.dataThrough)}</p>
                  {canUpdate && (
                    <label className="flex items-center gap-2">
                      <input
                        type="checkbox"
                        checked={connection.syncEnabled}
                        disabled={!!busy || connection.status !== "CONNECTED"}
                        onChange={(e) =>
                          void run("toggle", () =>
                            performanceService.updateConnection(connection.id, {
                              syncEnabled: e.target.checked,
                            }),
                          )
                        }
                      />
                      Automatic sync enabled
                    </label>
                  )}
                  <p className="text-muted-foreground">
                    Meta dan TikTok memerlukan OAuth adapter masing-masing.
                    Tidak ada data contoh yang ditampilkan sebagai hasil API.
                  </p>
                </div>
              )}
              {tab === "accounts" && (
                <div className="space-y-3">
                  {canUpdate &&
                    ["GOOGLE_ADS", "GA4", "SEARCH_CONSOLE"].includes(
                      connection.platform,
                    ) && (
                      <button
                        disabled={!!busy || connection.status !== "CONNECTED"}
                        className="rounded-md border px-3 py-2 text-sm"
                        onClick={() =>
                          void run("discover", () =>
                            performanceService.discover(connection.id),
                          )
                        }>
                        Discover Accounts
                      </button>
                    )}
                  {accounts.length === 0 ? (
                    <p className="text-sm text-muted-foreground">
                      Belum ada account. Hubungkan platform lalu Discover.
                    </p>
                  ) : (
                    <div className="overflow-x-auto">
                      <table className="w-full text-left text-sm">
                        <thead>
                          <tr>
                            <th className="p-2">Name</th>
                            <th className="p-2">Type</th>
                            <th className="p-2">ID</th>
                            <th className="p-2">Currency</th>
                          </tr>
                        </thead>
                        <tbody>
                          {accounts.map((a) => (
                            <tr key={a.id} className="border-t">
                              <td className="p-2">{a.name}</td>
                              <td className="p-2">{a.accountType}</td>
                              <td className="p-2">{a.externalId}</td>
                              <td className="p-2">{a.currency || "—"}</td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  )}
                </div>
              )}
              {tab === "mappings" && (
                <div className="space-y-4">
                  {canMap && (
                    <form
                      className="grid gap-2 sm:grid-cols-2"
                      onSubmit={(e) => {
                        e.preventDefault();
                        void run("mapping", () =>
                          performanceService.createMapping({
                            accountId,
                            clientId,
                            projectId,
                            ...(projectServiceId && { projectServiceId }),
                          }),
                        );
                      }}>
                      <select
                        required
                        className="rounded-md border bg-background p-2"
                        value={accountId}
                        onChange={(e) => setAccountId(e.target.value)}>
                        <option value="">Pilih Account</option>
                        {accounts.map((a) => (
                          <option key={a.id} value={a.id}>
                            {a.name}
                          </option>
                        ))}
                      </select>
                      <input
                        required
                        className="rounded-md border bg-background p-2"
                        placeholder="Client UUID"
                        value={clientId}
                        onChange={(e) => setClientId(e.target.value)}
                      />
                      <input
                        required
                        className="rounded-md border bg-background p-2"
                        placeholder="Project UUID"
                        value={projectId}
                        onChange={(e) => setProjectId(e.target.value)}
                      />
                      <input
                        className="rounded-md border bg-background p-2"
                        placeholder="Project Service UUID (opsional)"
                        value={projectServiceId}
                        onChange={(e) => setProjectServiceId(e.target.value)}
                      />
                      <button
                        className="rounded-md bg-primary p-2 text-primary-foreground"
                        disabled={!!busy}>
                        Save Mapping
                      </button>
                    </form>
                  )}
                  <div className="space-y-2">
                    {mappings
                      .filter((m) => accounts.some((a) => a.id === m.accountId))
                      .map((m) => (
                        <div
                          key={m.id}
                          className="rounded-md border p-3 text-sm">
                          {m.account?.name || m.accountId} →{" "}
                          {m.client?.companyName || m.clientId} →{" "}
                          {m.project?.name || m.projectId}{" "}
                          {m.isActive ? "· Active" : "· Inactive"}
                        </div>
                      ))}
                    {!mappings.length && (
                      <p className="text-sm text-muted-foreground">
                        Belum ada mapping.
                      </p>
                    )}
                  </div>
                </div>
              )}
              {tab === "logs" && (
                <div className="space-y-4">
                  {canSync && (
                    <form
                      className="flex flex-wrap items-end gap-2"
                      onSubmit={(e) => {
                        e.preventDefault();
                        void run("sync", () =>
                          performanceService.sync(connection.id, {
                            periodStart: start,
                            periodEnd: end,
                          }),
                        );
                      }}>
                      <label className="text-xs">
                        Start
                        <input
                          type="date"
                          required
                          className="block rounded-md border bg-background p-2"
                          value={start}
                          onChange={(e) => setStart(e.target.value)}
                        />
                      </label>
                      <label className="text-xs">
                        End
                        <input
                          type="date"
                          required
                          className="block rounded-md border bg-background p-2"
                          value={end}
                          onChange={(e) => setEnd(e.target.value)}
                        />
                      </label>
                      <button
                        disabled={!!busy || connection.status !== "CONNECTED"}
                        className="rounded-md bg-primary px-4 py-2 text-primary-foreground">
                        Sync Now
                      </button>
                    </form>
                  )}
                  {logs.length ? (
                    <div className="overflow-x-auto">
                      <table className="w-full text-left text-sm">
                        <thead>
                          <tr>
                            <th className="p-2">Waktu</th>
                            <th className="p-2">Status</th>
                            <th className="p-2">Fetched</th>
                            <th className="p-2">Failed</th>
                          </tr>
                        </thead>
                        <tbody>
                          {logs.map((l) => (
                            <tr key={l.id} className="border-t">
                              <td className="p-2">{fmt(l.createdAt)}</td>
                              <td className="p-2">{l.status}</td>
                              <td className="p-2">{l.recordsFetched}</td>
                              <td className="p-2">{l.recordsFailed}</td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  ) : (
                    <p className="text-sm text-muted-foreground">
                      Belum ada sync history.
                    </p>
                  )}
                </div>
              )}
            </>
          )}
        </section>
      </div>
    </div>
  );
}
