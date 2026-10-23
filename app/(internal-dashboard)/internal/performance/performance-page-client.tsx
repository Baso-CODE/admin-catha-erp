"use client";

import { ClientItem, clientService } from "@/app/services/client.service";
import { performanceService } from "@/app/services/performance.service";
import { ProjectItem, projectService } from "@/app/services/project.service";
import {
  PerformanceAccount,
  PerformanceConnection,
  PerformanceMapping,
  PerformancePlatform,
  SyncJob,
} from "@/app/types/performance.type";
import { useCallback, useEffect, useMemo, useState } from "react";
import { toast } from "sonner";

const PLATFORMS: PerformancePlatform[] = [
  "GOOGLE_ADS",
  "META_ADS",
  "GA4",
  "SEARCH_CONSOLE",
  "TIKTOK_ADS",
];

const LABELS: Record<PerformancePlatform, string> = {
  GOOGLE_ADS: "Google Ads",
  META_ADS: "Meta Ads",
  GA4: "Google Analytics 4",
  SEARCH_CONSOLE: "Google Search Console",
  TIKTOK_ADS: "TikTok Ads",
};

type Tab = "overview" | "accounts" | "mappings" | "logs";

function dateInput(offset = 0): string {
  const date = new Date();
  date.setDate(date.getDate() + offset);
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
}

function formatDate(value?: string | null): string {
  if (!value) return "—";
  const date = new Date(value);
  return Number.isNaN(date.getTime()) ? "—" : date.toLocaleString("id-ID");
}

function errorMessage(error: unknown): string {
  return error instanceof Error ? error.message : "Terjadi kesalahan.";
}

function statusClass(status: string): string {
  switch (status) {
    case "CONNECTED":
    case "SUCCESS":
    case "ACTIVE":
      return "bg-green-500/10 text-green-700 dark:text-green-400";
    case "RUNNING":
    case "PENDING":
      return "bg-blue-500/10 text-blue-700 dark:text-blue-400";
    case "PARTIAL":
      return "bg-amber-500/10 text-amber-700 dark:text-amber-400";
    case "FAILED":
    case "ERROR":
    case "EXPIRED":
      return "bg-red-500/10 text-red-700 dark:text-red-400";
    default:
      return "bg-muted text-muted-foreground";
  }
}

function Status({ value }: { value: string }) {
  return (
    <span
      className={`inline-flex rounded-full px-2.5 py-1 text-xs font-medium ${statusClass(value)}`}>
      {value.replaceAll("_", " ")}
    </span>
  );
}

export default function PerformancePageClient({
  permissions,
}: {
  permissions: string[];
}) {
  const canCreate = permissions.includes("performance.connection.create");
  const canUpdate = permissions.includes("performance.connection.update");
  const canReadMap = permissions.includes("performance.mapping.read");
  const canMap = permissions.includes("performance.mapping.create");
  const canUpdateMap = permissions.includes("performance.mapping.update");
  const canSync = permissions.includes("performance.sync.execute");
  const canLogs = permissions.includes("performance.sync.read");

  const [connections, setConnections] = useState<PerformanceConnection[]>([]);
  const [selected, setSelected] = useState("");
  const [accounts, setAccounts] = useState<PerformanceAccount[]>([]);
  const [mappings, setMappings] = useState<PerformanceMapping[]>([]);
  const [logs, setLogs] = useState<SyncJob[]>([]);
  const [clients, setClients] = useState<ClientItem[]>([]);
  const [projects, setProjects] = useState<ProjectItem[]>([]);

  const [loading, setLoading] = useState(true);
  const [detailLoading, setDetailLoading] = useState(false);
  const [busy, setBusy] = useState("");
  const [tab, setTab] = useState<Tab>("overview");

  const [name, setName] = useState("");
  const [platform, setPlatform] = useState<PerformancePlatform>("GOOGLE_ADS");
  const [accountId, setAccountId] = useState("");
  const [clientId, setClientId] = useState("");
  const [projectId, setProjectId] = useState("");
  const [projectServiceId, setProjectServiceId] = useState("");
  const [start, setStart] = useState(() => dateInput(-7));
  const [end, setEnd] = useState(() => dateInput());

  const connection = connections.find((item) => item.id === selected);

  const filteredProjects = useMemo(
    () => projects.filter((item) => item.clientId === clientId),
    [projects, clientId],
  );

  const connectionMappings = useMemo(
    () =>
      mappings.filter((item) =>
        accounts.some((account) => account.id === item.accountId),
      ),
    [mappings, accounts],
  );

  const loadConnections = useCallback(async () => {
    try {
      const response = await performanceService.connections();
      const items = response.data.data;

      setConnections(items);
      setSelected((current) =>
        items.some((item) => item.id === current)
          ? current
          : (items[0]?.id ?? ""),
      );
    } catch (error) {
      toast.error(errorMessage(error));
    } finally {
      setLoading(false);
    }
  }, []);

  const loadLookups = useCallback(async () => {
    if (!canMap) return;

    const results = await Promise.allSettled([
      clientService.getClients({ page: 1, limit: 100 }),
      projectService.getAll({ page: 1, limit: 100 }),
    ]);

    if (results[0].status === "fulfilled") {
      setClients(results[0].value.data);
    } else {
      toast.error("Gagal memuat daftar Client.");
    }

    if (results[1].status === "fulfilled") {
      setProjects(results[1].value.data);
    } else {
      toast.error("Gagal memuat daftar Project.");
    }
  }, [canMap]);

  const loadDetail = useCallback(async () => {
    if (!connection) {
      setAccounts([]);
      setMappings([]);
      setLogs([]);
      return;
    }

    setDetailLoading(true);

    const tasks: Promise<unknown>[] = [
      performanceService
        .accounts(connection.id, connection.platform)
        .then((response) => setAccounts(response.data)),
    ];

    if (canReadMap) {
      tasks.push(
        performanceService
          .mappings()
          .then((response) => setMappings(response.data)),
      );
    }

    if (canLogs) {
      tasks.push(
        performanceService
          .logs(connection.id)
          .then((response) => setLogs(response.data.data)),
      );
    }

    const results = await Promise.allSettled(tasks);

    for (const result of results) {
      if (result.status === "rejected") {
        toast.error(errorMessage(result.reason));
      }
    }

    setDetailLoading(false);
  }, [connection?.id, connection?.platform, canReadMap, canLogs]);

  useEffect(() => {
    void loadConnections();
  }, [loadConnections]);

  useEffect(() => {
    void loadLookups();
  }, [loadLookups]);

  useEffect(() => {
    void loadDetail();
  }, [loadDetail]);

  useEffect(() => {
    setAccountId("");
    setTab("overview");
  }, [selected]);

  useEffect(() => {
    setProjectId("");
    setProjectServiceId("");
  }, [clientId]);

  async function run(
    key: string,
    action: () => Promise<unknown>,
    successMessage = "Operasi berhasil.",
  ) {
    setBusy(key);

    try {
      await action();
      toast.success(successMessage);
      await loadConnections();
      await loadDetail();
    } catch (error) {
      toast.error(errorMessage(error));
    } finally {
      setBusy("");
    }
  }

  function connectOAuth() {
    if (!connection || !canUpdate) return;

    const url = performanceService.oauthStartUrl(
      connection.platform,
      connection.id,
    );

    window.location.assign(url);
  }

  const buttonClass =
    "rounded-md border px-3 py-2 text-sm font-medium transition hover:bg-muted disabled:cursor-not-allowed disabled:opacity-50";

  const primaryClass =
    "rounded-md bg-primary px-4 py-2 text-sm font-medium text-primary-foreground disabled:cursor-not-allowed disabled:opacity-50";

  const inputClass = "w-full rounded-md border bg-background px-3 py-2 text-sm";

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-semibold">Performance Integration</h1>
        <p className="mt-1 text-sm text-muted-foreground">
          Kelola koneksi platform marketing, account discovery, client mapping,
          sinkronisasi metrik, dan histori pekerjaan.
        </p>
      </div>

      <div className="grid gap-3 sm:grid-cols-3">
        <div className="rounded-xl border bg-card p-4">
          <p className="text-xs text-muted-foreground">Total Connections</p>
          <p className="mt-2 text-2xl font-semibold">{connections.length}</p>
        </div>
        <div className="rounded-xl border bg-card p-4">
          <p className="text-xs text-muted-foreground">Connected</p>
          <p className="mt-2 text-2xl font-semibold">
            {connections.filter((item) => item.status === "CONNECTED").length}
          </p>
        </div>
        <div className="rounded-xl border bg-card p-4">
          <p className="text-xs text-muted-foreground">Need Attention</p>
          <p className="mt-2 text-2xl font-semibold">
            {connections.filter((item) => item.status !== "CONNECTED").length}
          </p>
        </div>
      </div>

      {canCreate && (
        <form
          className="flex flex-wrap gap-2 rounded-xl border bg-card p-4"
          onSubmit={(event) => {
            event.preventDefault();
            if (name.trim().length < 2) {
              toast.error("Nama connection minimal 2 karakter.");
              return;
            }

            void run(
              "create",
              async () => {
                await performanceService.createConnection({
                  name: name.trim(),
                  platform,
                });
                setName("");
              },
              "Connection berhasil dibuat.",
            );
          }}>
          <input
            aria-label="Nama Connection"
            className={`${inputClass} min-w-52 flex-1`}
            placeholder="Contoh: Meta Ads - Client A"
            value={name}
            onChange={(event) => setName(event.target.value)}
            minLength={2}
            required
          />
          <select
            aria-label="Platform"
            className={`${inputClass} w-auto`}
            value={platform}
            onChange={(event) =>
              setPlatform(event.target.value as PerformancePlatform)
            }>
            {PLATFORMS.map((item) => (
              <option key={item} value={item}>
                {LABELS[item]}
              </option>
            ))}
          </select>
          <button className={primaryClass} disabled={!!busy}>
            {busy === "create" ? "Menyimpan..." : "+ Add Connection"}
          </button>
        </form>
      )}

      <div className="grid gap-5 lg:grid-cols-[280px_minmax(0,1fr)]">
        <aside className="space-y-2 rounded-xl border bg-card p-3">
          <div className="flex items-center justify-between px-2 py-1">
            <h2 className="text-sm font-semibold">Connections</h2>
            {loading && (
              <span className="text-xs text-muted-foreground">Loading...</span>
            )}
          </div>

          {connections.length === 0 && (
            <p className="px-2 py-4 text-sm text-muted-foreground">
              Belum ada connection.
            </p>
          )}

          {connections.map((item) => (
            <button
              type="button"
              key={item.id}
              onClick={() => setSelected(item.id)}
              className={`w-full space-y-2 rounded-lg border p-3 text-left transition ${
                selected === item.id
                  ? "border-primary bg-primary/5"
                  : "border-transparent hover:bg-muted"
              }`}>
              <p className="text-sm font-semibold">{item.name}</p>
              <p className="text-xs text-muted-foreground">
                {LABELS[item.platform]}
              </p>
              <Status value={item.status} />
            </button>
          ))}
        </aside>

        <section className="min-w-0 space-y-5 rounded-xl border bg-card p-4">
          {!connection ? (
            <p className="py-8 text-center text-sm text-muted-foreground">
              Pilih connection untuk melihat detail.
            </p>
          ) : (
            <>
              <div className="flex flex-wrap items-start justify-between gap-3">
                <div className="space-y-2">
                  <h2 className="text-lg font-semibold">{connection.name}</h2>
                  <div className="flex flex-wrap items-center gap-2">
                    <span className="text-sm text-muted-foreground">
                      {LABELS[connection.platform]}
                    </span>
                    <Status value={connection.status} />
                  </div>
                  <p className="text-xs text-muted-foreground">
                    Last successful sync:{" "}
                    {formatDate(connection.lastSuccessfulSyncAt)}
                  </p>
                </div>

                <div className="flex flex-wrap gap-2">
                  {canUpdate && (
                    <button
                      type="button"
                      className={primaryClass}
                      onClick={connectOAuth}
                      disabled={!!busy}>
                      {connection.status === "CONNECTED"
                        ? "Reconnect"
                        : "Connect Account"}
                    </button>
                  )}

                  {canUpdate && (
                    <button
                      type="button"
                      className={buttonClass}
                      disabled={!!busy}
                      onClick={() => {
                        if (!window.confirm("Nonaktifkan connection ini?")) {
                          return;
                        }

                        void run(
                          "disable",
                          () =>
                            performanceService.disableConnection(connection.id),
                          "Connection dinonaktifkan.",
                        );
                      }}>
                      Disable
                    </button>
                  )}
                </div>
              </div>

              <div className="flex flex-wrap gap-2 border-b pb-3">
                {(
                  [
                    ["overview", "Overview"],
                    ["accounts", "Accounts"],
                    ["mappings", "Mappings"],
                    ["logs", "Sync History"],
                  ] as const
                )
                  .filter(
                    ([value]) =>
                      (value !== "mappings" || canReadMap) &&
                      (value !== "logs" || canLogs),
                  )
                  .map(([value, title]) => (
                    <button
                      type="button"
                      key={value}
                      onClick={() => setTab(value)}
                      className={`rounded-md px-3 py-2 text-sm ${
                        tab === value
                          ? "bg-primary text-primary-foreground"
                          : "bg-muted"
                      }`}>
                      {title}
                    </button>
                  ))}
              </div>

              {detailLoading && (
                <p className="text-xs text-muted-foreground">
                  Memuat data connection...
                </p>
              )}

              {tab === "overview" && (
                <div className="space-y-4 text-sm">
                  <div className="grid gap-3 sm:grid-cols-2">
                    <div className="rounded-lg border p-3">
                      <p className="text-xs text-muted-foreground">
                        Data Available Through
                      </p>
                      <p className="mt-1 font-medium">
                        {formatDate(connection.dataThrough)}
                      </p>
                    </div>
                    <div className="rounded-lg border p-3">
                      <p className="text-xs text-muted-foreground">
                        Discovered Accounts
                      </p>
                      <p className="mt-1 font-medium">{accounts.length}</p>
                    </div>
                  </div>

                  {canUpdate && (
                    <label className="flex items-center gap-3 rounded-lg border p-3">
                      <input
                        type="checkbox"
                        checked={connection.syncEnabled}
                        disabled={!!busy || connection.status !== "CONNECTED"}
                        onChange={(event) =>
                          void run("toggle", () =>
                            performanceService.updateConnection(connection.id, {
                              syncEnabled: event.target.checked,
                            }),
                          )
                        }
                      />
                      <span>
                        <strong>Enable automatic sync</strong>
                        <span className="block text-xs text-muted-foreground">
                          Mengizinkan scheduler memproses connection ini setelah
                          scheduler backend tersedia.
                        </span>
                      </span>
                    </label>
                  )}

                  <p className="text-xs text-muted-foreground">
                    Status Connected menunjukkan credential tersimpan.
                    Keberhasilan mengambil metrik harus diperiksa melalui Sync
                    History.
                  </p>
                </div>
              )}

              {tab === "accounts" && (
                <div className="space-y-4">
                  {canUpdate && (
                    <button
                      type="button"
                      className={buttonClass}
                      disabled={!!busy || connection.status !== "CONNECTED"}
                      onClick={() =>
                        void run(
                          "discover",
                          () =>
                            performanceService.discover(
                              connection.id,
                              connection.platform,
                            ),
                          "Account discovery selesai.",
                        )
                      }>
                      {busy === "discover"
                        ? "Discovering..."
                        : "Discover Accounts"}
                    </button>
                  )}

                  {accounts.length === 0 ? (
                    <p className="rounded-lg border p-4 text-sm text-muted-foreground">
                      Belum ada account. Hubungkan platform dan jalankan
                      discovery terlebih dahulu.
                    </p>
                  ) : (
                    <div className="overflow-x-auto">
                      <table className="w-full text-left text-sm">
                        <thead className="bg-muted/60">
                          <tr>
                            <th className="p-3">Account</th>
                            <th className="p-3">Type</th>
                            <th className="p-3">External ID</th>
                            <th className="p-3">Currency</th>
                            <th className="p-3">Status</th>
                          </tr>
                        </thead>
                        <tbody>
                          {accounts.map((item) => (
                            <tr key={item.id} className="border-t">
                              <td className="p-3 font-medium">{item.name}</td>
                              <td className="p-3">{item.accountType}</td>
                              <td className="p-3">{item.externalId}</td>
                              <td className="p-3">{item.currency || "—"}</td>
                              <td className="p-3">
                                <Status value={item.status} />
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  )}
                </div>
              )}

              {tab === "mappings" && canReadMap && (
                <div className="space-y-4">
                  {canMap && (
                    <form
                      className="grid gap-3 rounded-lg border p-4 sm:grid-cols-2"
                      onSubmit={(event) => {
                        event.preventDefault();

                        if (!accountId || !clientId || !projectId) {
                          toast.error(
                            "Account, Client, dan Project wajib dipilih.",
                          );
                          return;
                        }

                        void run(
                          "mapping",
                          async () => {
                            await performanceService.createMapping({
                              accountId,
                              clientId,
                              projectId,
                              ...(projectServiceId && {
                                projectServiceId,
                              }),
                            });
                            setAccountId("");
                            setProjectServiceId("");
                          },
                          "Performance Mapping berhasil dibuat.",
                        );
                      }}>
                      <label className="space-y-1">
                        <span className="text-xs font-medium">
                          Performance Account
                        </span>
                        <select
                          className={inputClass}
                          value={accountId}
                          required
                          onChange={(event) =>
                            setAccountId(event.target.value)
                          }>
                          <option value="">Pilih Account</option>
                          {accounts.map((item) => (
                            <option key={item.id} value={item.id}>
                              {item.name}
                            </option>
                          ))}
                        </select>
                      </label>

                      <label className="space-y-1">
                        <span className="text-xs font-medium">Client</span>
                        <select
                          className={inputClass}
                          value={clientId}
                          required
                          onChange={(event) => setClientId(event.target.value)}>
                          <option value="">Pilih Client</option>
                          {clients.map((item) => (
                            <option key={item.id} value={item.id}>
                              {item.companyName}
                            </option>
                          ))}
                        </select>
                      </label>

                      <label className="space-y-1">
                        <span className="text-xs font-medium">Project</span>
                        <select
                          className={inputClass}
                          value={projectId}
                          disabled={!clientId}
                          required
                          onChange={(event) =>
                            setProjectId(event.target.value)
                          }>
                          <option value="">Pilih Project</option>
                          {filteredProjects.map((item) => (
                            <option key={item.id} value={item.id}>
                              {item.name}
                            </option>
                          ))}
                        </select>
                      </label>

                      <label className="space-y-1">
                        <span className="text-xs font-medium">
                          Project Service UUID (Opsional)
                        </span>
                        <input
                          className={inputClass}
                          value={projectServiceId}
                          onChange={(event) =>
                            setProjectServiceId(event.target.value)
                          }
                          placeholder="Kosongkan jika tidak diperlukan"
                        />
                      </label>

                      <div className="sm:col-span-2">
                        <button
                          className={primaryClass}
                          disabled={!!busy || accounts.length === 0}>
                          {busy === "mapping" ? "Menyimpan..." : "Save Mapping"}
                        </button>
                      </div>
                    </form>
                  )}

                  {connectionMappings.length === 0 ? (
                    <p className="rounded-lg border p-4 text-sm text-muted-foreground">
                      Belum ada mapping untuk connection ini.
                    </p>
                  ) : (
                    <div className="space-y-2">
                      {connectionMappings.map((item) => (
                        <div
                          key={item.id}
                          className="flex flex-wrap items-center justify-between gap-3 rounded-lg border p-3">
                          <div className="text-sm">
                            <p className="font-medium">
                              {item.account?.name || item.accountId}
                            </p>
                            <p className="text-muted-foreground">
                              {item.client?.companyName || item.clientId}
                              {" → "}
                              {item.project?.name || item.projectId}
                            </p>
                          </div>
                          <div className="flex items-center gap-2">
                            <Status
                              value={item.isActive ? "ACTIVE" : "INACTIVE"}
                            />
                            {canUpdateMap && item.isActive && (
                              <button
                                type="button"
                                className={buttonClass}
                                disabled={!!busy}
                                onClick={() => {
                                  if (
                                    !window.confirm("Nonaktifkan mapping ini?")
                                  ) {
                                    return;
                                  }

                                  void run(
                                    "mapping-update",
                                    () =>
                                      performanceService.updateMapping(
                                        item.id,
                                        {
                                          clientId: item.clientId,
                                          projectId: item.projectId,
                                          ...(item.projectServiceId && {
                                            projectServiceId:
                                              item.projectServiceId,
                                          }),
                                          isActive: false,
                                        },
                                      ),
                                    "Mapping berhasil dinonaktifkan.",
                                  );
                                }}>
                                Deactivate
                              </button>
                            )}
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              )}

              {tab === "logs" && canLogs && (
                <div className="space-y-4">
                  {canSync && (
                    <form
                      className="flex flex-wrap items-end gap-3 rounded-lg border p-4"
                      onSubmit={(event) => {
                        event.preventDefault();

                        if (start > end) {
                          toast.error("Tanggal awal melebihi tanggal akhir.");
                          return;
                        }

                        void run(
                          "sync",
                          () =>
                            performanceService.sync(connection.id, {
                              periodStart: start,
                              periodEnd: end,
                            }),
                          "Sinkronisasi selesai diproses.",
                        );
                      }}>
                      <label className="space-y-1 text-xs">
                        <span>Start Date</span>
                        <input
                          className={inputClass}
                          type="date"
                          required
                          value={start}
                          onChange={(event) => setStart(event.target.value)}
                        />
                      </label>
                      <label className="space-y-1 text-xs">
                        <span>End Date</span>
                        <input
                          className={inputClass}
                          type="date"
                          required
                          value={end}
                          onChange={(event) => setEnd(event.target.value)}
                        />
                      </label>
                      <button
                        className={primaryClass}
                        disabled={!!busy || connection.status !== "CONNECTED"}>
                        {busy === "sync" ? "Syncing..." : "Run Manual Sync"}
                      </button>
                    </form>
                  )}

                  {logs.length === 0 ? (
                    <p className="rounded-lg border p-4 text-sm text-muted-foreground">
                      Belum ada sync history.
                    </p>
                  ) : (
                    <div className="overflow-x-auto">
                      <table className="w-full text-left text-sm">
                        <thead className="bg-muted/60">
                          <tr>
                            <th className="p-3">Created</th>
                            <th className="p-3">Status</th>
                            <th className="p-3">Fetched</th>
                            <th className="p-3">Inserted</th>
                            <th className="p-3">Updated</th>
                            <th className="p-3">Failed</th>
                          </tr>
                        </thead>
                        <tbody>
                          {logs.map((item) => (
                            <tr key={item.id} className="border-t">
                              <td className="p-3">
                                {formatDate(item.createdAt)}
                              </td>
                              <td className="p-3">
                                <Status value={item.status} />
                              </td>
                              <td className="p-3">{item.recordsFetched}</td>
                              <td className="p-3">{item.recordsInserted}</td>
                              <td className="p-3">{item.recordsUpdated}</td>
                              <td className="p-3">{item.recordsFailed}</td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
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
