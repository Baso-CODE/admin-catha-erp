"use client";
import { performanceDataService } from "@/app/services/performance-data.service";
import type { PerformanceDataRow } from "@/app/types/performance-data.type";
import type { PerformancePlatform } from "@/app/types/performance.type";
import Link from "next/link";
import { useCallback, useEffect, useState } from "react";
const platforms: Array<PerformancePlatform> = [
  "GOOGLE_ADS",
  "META_ADS",
  "GA4",
  "SEARCH_CONSOLE",
  "TIKTOK_ADS",
];
export default function PerformanceDataClient() {
  const [rows, setRows] = useState<PerformanceDataRow[]>([]);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(0);
  const [platform, setPlatform] = useState<PerformancePlatform | "">("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(true);
  const load = useCallback(async () => {
    setLoading(true);
    setError("");
    try {
      const response = await performanceDataService.getAll({
        page,
        limit: 25,
        ...(platform && { platform }),
      });
      setRows(response.data.data);
      setTotalPages(response.data.meta.totalPages);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Gagal memuat data.");
      setRows([]);
    } finally {
      setLoading(false);
    }
  }, [page, platform]);
  useEffect(() => {
    void load();
  }, [load]);
  return (
    <div className="space-y-5">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl font-semibold">Performance Data</h1>
          <p className="text-sm text-muted-foreground">
            Data harian yang telah berhasil disinkronisasi dan memiliki mapping
            ERP.
          </p>
        </div>
        <Link
          href="/internal/performance"
          className="rounded-md border px-3 py-2 text-sm">
          Kembali ke Integration
        </Link>
      </div>
      <div className="flex items-center gap-2">
        <label htmlFor="platform" className="text-sm">
          Platform
        </label>
        <select
          id="platform"
          className="rounded-md border bg-background px-3 py-2 text-sm"
          value={platform}
          onChange={(e) => {
            setPlatform(e.target.value as PerformancePlatform | "");
            setPage(1);
          }}>
          <option value="">Semua platform</option>
          {platforms.map((value) => (
            <option key={value} value={value}>
              {value.replaceAll("_", " ")}
            </option>
          ))}
        </select>
        <button
          className="rounded-md border px-3 py-2 text-sm"
          onClick={() => void load()}>
          Refresh
        </button>
      </div>
      {error && (
        <p
          role="alert"
          className="rounded-md border border-destructive p-3 text-sm text-destructive">
          {error}
        </p>
      )}
      <div className="overflow-x-auto rounded-xl border">
        <table className="w-full min-w-[860px] text-sm">
          <thead className="bg-muted/50 text-left">
            <tr>
              {[
                "Tanggal",
                "Platform",
                "Account",
                "Entity",
                "Impressions",
                "Clicks",
                "Conversions",
                "Spend",
                "Currency",
              ].map((x) => (
                <th key={x} className="px-3 py-3">
                  {x}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {rows.map((row) => (
              <tr key={row.id} className="border-t">
                <td className="px-3 py-3">{row.metricDate.slice(0, 10)}</td>
                <td className="px-3 py-3">{row.account.connection.platform}</td>
                <td className="px-3 py-3">{row.account.name}</td>
                <td className="px-3 py-3">{row.entityType}</td>
                <td className="px-3 py-3 text-right">{row.impressions}</td>
                <td className="px-3 py-3 text-right">{row.clicks}</td>
                <td className="px-3 py-3 text-right">{row.conversions}</td>
                <td className="px-3 py-3 text-right">{row.spend}</td>
                <td className="px-3 py-3">{row.currency ?? "—"}</td>
              </tr>
            ))}
            {!loading && rows.length === 0 && (
              <tr>
                <td
                  colSpan={9}
                  className="p-6 text-center text-muted-foreground">
                  Belum ada data tersinkronisasi yang dapat ditampilkan.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
      <div className="flex items-center justify-end gap-2 text-sm">
        <button
          disabled={page <= 1 || loading}
          className="rounded-md border px-3 py-2 disabled:opacity-40"
          onClick={() => setPage((p) => p - 1)}>
          Sebelumnya
        </button>
        <span>
          Halaman {page} / {Math.max(1, totalPages)}
        </span>
        <button
          disabled={page >= totalPages || loading}
          className="rounded-md border px-3 py-2 disabled:opacity-40"
          onClick={() => setPage((p) => p + 1)}>
          Berikutnya
        </button>
      </div>
    </div>
  );
}
