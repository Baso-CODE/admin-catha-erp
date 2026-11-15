"use client";

import { useEffect, useState } from "react";
import { toast } from "sonner";

import {
  Activity,
  AlertTriangle,
  BarChart3,
  Database,
  RefreshCw,
} from "lucide-react";

import {
  clientPortalPerformanceService,
  type ClientPerformanceResponse,
  type PerformancePlatform,
} from "@/app/services/client-portal-performance.service";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";

import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";

import { Input } from "@/components/ui/input";
import { Skeleton } from "@/components/ui/skeleton";

import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";

const PLATFORM_NAMES: Record<PerformancePlatform, string> = {
  GOOGLE_ADS: "Google Ads",
  META_ADS: "Meta Ads",
  GA4: "Google Analytics 4",
  SEARCH_CONSOLE: "Search Console",
  TIKTOK_ADS: "TikTok Ads",
};

function formatNumber(value: string) {
  return new Intl.NumberFormat("id-ID", {
    maximumFractionDigits: 2,
  }).format(Number(value));
}

function formatMoney(value: string, currency: string | null) {
  const numeric = Number(value);

  if (!Number.isFinite(numeric)) return value;

  if (!currency) {
    return formatNumber(value);
  }

  try {
    return new Intl.NumberFormat("id-ID", {
      style: "currency",
      currency,
      maximumFractionDigits: 2,
    }).format(numeric);
  } catch {
    return `${currency} ${formatNumber(value)}`;
  }
}

function errorMessage(error: unknown) {
  return error instanceof Error
    ? error.message
    : "Gagal mengambil data performance.";
}

export default function PerformanceClient() {
  const [result, setResult] = useState<ClientPerformanceResponse | null>(null);

  const [loading, setLoading] = useState(true);

  const [platform, setPlatform] = useState("ALL");

  const [dateFrom, setDateFrom] = useState("");
  const [dateTo, setDateTo] = useState("");

  const [appliedFrom, setAppliedFrom] = useState("");
  const [appliedTo, setAppliedTo] = useState("");

  const [page, setPage] = useState(1);
  const [refreshKey, setRefreshKey] = useState(0);

  useEffect(() => {
    let active = true;

    async function load() {
      setLoading(true);

      try {
        const data = await clientPortalPerformanceService.getReport({
          ...(platform !== "ALL" && {
            platform: platform as PerformancePlatform,
          }),
          ...(appliedFrom && { dateFrom: appliedFrom }),
          ...(appliedTo && { dateTo: appliedTo }),
          page,
          limit: 20,
        });

        if (active) {
          setResult(data);
        }
      } catch (error) {
        if (active) {
          setResult(null);
          toast.error(errorMessage(error));
        }
      } finally {
        if (active) {
          setLoading(false);
        }
      }
    }

    void load();

    return () => {
      active = false;
    };
  }, [platform, appliedFrom, appliedTo, page, refreshKey]);

  function applyFilter(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();

    if (dateFrom && dateTo && dateFrom > dateTo) {
      toast.error("Tanggal mulai tidak boleh melebihi tanggal akhir.");
      return;
    }

    setPage(1);
    setAppliedFrom(dateFrom);
    setAppliedTo(dateTo);
  }

  const metrics = result?.data ?? [];
  const accounts = result?.accounts ?? [];
  const meta = result?.meta;

  return (
    <div className="space-y-6 p-4 md:p-6">
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div className="space-y-1">
          <h1 className="flex items-center gap-2 text-2xl font-semibold">
            <BarChart3 className="size-6" />
            Performance Report
          </h1>

          <p className="text-sm text-muted-foreground">
            Data performance digital marketing perusahaan Anda.
          </p>
        </div>

        <Button
          variant="outline"
          disabled={loading}
          onClick={() => setRefreshKey((current) => current + 1)}>
          <RefreshCw className={loading ? "animate-spin" : ""} />
          Refresh
        </Button>
      </div>

      <div className="grid gap-4 md:grid-cols-3">
        <Card>
          <CardHeader>
            <CardDescription>Connected Accounts</CardDescription>
            <CardTitle className="flex items-center gap-2 text-3xl">
              <Database className="size-6 text-primary" />
              {loading ? "—" : accounts.length}
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-xs text-muted-foreground">
              Akun dengan mapping yang dapat diakses portal.
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardDescription>Performance Records</CardDescription>
            <CardTitle className="flex items-center gap-2 text-3xl">
              <Activity className="size-6 text-primary" />
              {loading ? "—" : (meta?.total ?? 0)}
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-xs text-muted-foreground">
              Jumlah baris data pada filter terpilih.
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardDescription>Restricted Shared Accounts</CardDescription>
            <CardTitle className="flex items-center gap-2 text-3xl">
              <AlertTriangle className="size-6 text-amber-500" />
              {loading ? "—" : (result?.excludedSharedAccounts ?? 0)}
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-xs text-muted-foreground">
              Akun bersama tidak ditampilkan untuk menjaga privasi.
            </p>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Filter Report</CardTitle>
          <CardDescription>Pilih platform dan rentang waktu.</CardDescription>
        </CardHeader>

        <CardContent>
          <form
            onSubmit={applyFilter}
            className="flex flex-wrap items-end gap-3">
            <div className="space-y-2">
              <p className="text-sm font-medium">Platform</p>

              <Select
                value={platform}
                onValueChange={(value) => {
                  setPlatform(value);
                  setPage(1);
                }}>
                <SelectTrigger className="w-[210px]">
                  <SelectValue placeholder="Pilih platform" />
                </SelectTrigger>

                <SelectContent>
                  <SelectItem value="ALL">Semua Platform</SelectItem>
                  {Object.entries(PLATFORM_NAMES).map(([value, label]) => (
                    <SelectItem key={value} value={value}>
                      {label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <p className="text-sm font-medium">Dari Tanggal</p>
              <Input
                type="date"
                value={dateFrom}
                onChange={(event) => setDateFrom(event.target.value)}
              />
            </div>

            <div className="space-y-2">
              <p className="text-sm font-medium">Sampai Tanggal</p>
              <Input
                type="date"
                value={dateTo}
                onChange={(event) => setDateTo(event.target.value)}
              />
            </div>

            <Button type="submit" disabled={loading}>
              Terapkan Filter
            </Button>
          </form>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Data Performance</CardTitle>
          <CardDescription>
            Metrik hasil sinkronisasi platform. Satu baris mewakili satu entity
            pada satu tanggal.
          </CardDescription>
        </CardHeader>

        <CardContent className="space-y-4">
          {loading ? (
            <div className="space-y-3">
              {Array.from({ length: 5 }, (_, index) => (
                <Skeleton key={index} className="h-12 w-full" />
              ))}
            </div>
          ) : metrics.length === 0 ? (
            <div className="flex flex-col items-center gap-3 py-12 text-center">
              <Database className="size-10 text-muted-foreground" />

              <p className="font-medium">Belum ada data performance</p>

              <p className="max-w-md text-sm text-muted-foreground">
                {accounts.length === 0
                  ? "Belum ada akun yang dapat menampilkan data untuk client ini."
                  : "Akun tersedia, tetapi belum memiliki data untuk filter yang dipilih."}
              </p>
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Tanggal</TableHead>
                  <TableHead>Platform</TableHead>
                  <TableHead>Account</TableHead>
                  <TableHead>Entity</TableHead>
                  <TableHead className="text-right">Impressions</TableHead>
                  <TableHead className="text-right">Clicks</TableHead>
                  <TableHead className="text-right">Conversions</TableHead>
                  <TableHead className="text-right">Spend</TableHead>
                  <TableHead className="text-right">Conversion Value</TableHead>
                </TableRow>
              </TableHeader>

              <TableBody>
                {metrics.map((metric) => (
                  <TableRow key={metric.id}>
                    <TableCell>{metric.metricDate}</TableCell>

                    <TableCell>
                      <Badge variant="secondary">
                        {PLATFORM_NAMES[metric.platform]}
                      </Badge>
                    </TableCell>

                    <TableCell>{metric.accountName}</TableCell>

                    <TableCell>
                      <div>
                        <p>{metric.entityType}</p>
                        <p className="max-w-36 truncate text-xs text-muted-foreground">
                          {metric.externalEntityId}
                        </p>
                      </div>
                    </TableCell>

                    <TableCell className="text-right">
                      {formatNumber(metric.impressions)}
                    </TableCell>

                    <TableCell className="text-right">
                      {formatNumber(metric.clicks)}
                    </TableCell>

                    <TableCell className="text-right">
                      {formatNumber(metric.conversions)}
                    </TableCell>

                    <TableCell className="text-right">
                      {formatMoney(metric.spend, metric.currency)}
                    </TableCell>

                    <TableCell className="text-right">
                      {formatMoney(metric.conversionValue, metric.currency)}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}

          <div className="flex flex-wrap items-center justify-between gap-3 border-t pt-4">
            <p className="text-sm text-muted-foreground">
              {meta?.total ?? 0} records · Halaman {page} dari{" "}
              {Math.max(meta?.totalPages ?? 0, 1)}
            </p>

            <div className="flex gap-2">
              <Button
                variant="outline"
                size="sm"
                disabled={loading || page <= 1}
                onClick={() => setPage((current) => current - 1)}>
                Sebelumnya
              </Button>

              <Button
                variant="outline"
                size="sm"
                disabled={loading || !meta || page >= meta.totalPages}
                onClick={() => setPage((current) => current + 1)}>
                Berikutnya
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>

      {accounts.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle>Account Connection Status</CardTitle>
            <CardDescription>
              Status koneksi dan pembaruan data akun.
            </CardDescription>
          </CardHeader>

          <CardContent className="space-y-3">
            {accounts.map((account) => (
              <div
                key={account.id}
                className="flex flex-wrap items-center justify-between gap-3 rounded-lg border p-3">
                <div>
                  <p className="font-medium">{account.name}</p>
                  <p className="text-xs text-muted-foreground">
                    {PLATFORM_NAMES[account.platform]}
                  </p>
                  <p className="text-xs text-muted-foreground">
                    Data through:{" "}
                    {account.dataThrough
                      ? new Date(account.dataThrough).toISOString().slice(0, 10)
                      : "Belum tersedia"}
                  </p>
                </div>

                <Badge
                  variant={
                    account.connectionStatus === "CONNECTED"
                      ? "default"
                      : "secondary"
                  }>
                  {account.connectionStatus}
                </Badge>
              </div>
            ))}
          </CardContent>
        </Card>
      )}
    </div>
  );
}
