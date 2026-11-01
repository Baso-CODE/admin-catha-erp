"use client";

import {
  contractRenewalService,
  CreateRenewalPayload,
  RenewalContract,
  RenewalFilter,
  RenewalHistoryResponse,
  RenewalOverviewResponse,
} from "@/app/services/contract-renewal.service";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  AlertCircle,
  ArrowRight,
  CalendarClock,
  CheckCircle2,
  ChevronLeft,
  ChevronRight,
  CreditCard,
  ExternalLink,
  FileClock,
  History,
  Loader2,
  Plus,
  RefreshCw,
} from "lucide-react";
import Link from "next/link";
import { useCallback, useEffect, useState } from "react";
import { toast } from "sonner";
import ContractRenewalBillingDialog from "./components/contract-renewal-billing-dialog";

const PAGE_SIZE = 20;

function formatDate(value: string): string {
  const date = new Date(value);

  if (Number.isNaN(date.getTime())) return "—";

  return date.toLocaleDateString("id-ID", {
    day: "2-digit",
    month: "short",
    year: "numeric",
    timeZone: "UTC",
  });
}

function formatMoney(value: string, currency: string): string {
  const amount = Number(value);

  if (!Number.isFinite(amount)) return `${currency} ${value}`;

  return new Intl.NumberFormat("id-ID", {
    style: "currency",
    currency,
    maximumFractionDigits: 2,
  }).format(amount);
}

function getError(error: unknown): string {
  return error instanceof Error ? error.message : "Operasi gagal.";
}

function dateOnly(value: string): string {
  return value.slice(0, 10);
}

function nextDay(value: string): string {
  const date = new Date(`${dateOnly(value)}T00:00:00.000Z`);
  date.setUTCDate(date.getUTCDate() + 1);
  return date.toISOString().slice(0, 10);
}

function contractHref(id: string): string {
  return `/internal/contracts/${encodeURIComponent(id)}`;
}

export default function ContractRenewalsClient({
  permissions,
}: {
  permissions: string[];
}) {
  const canCreate = permissions.includes("contract.create");

  const [overview, setOverview] = useState<RenewalOverviewResponse | null>(
    null,
  );
  const [billingDialogOpen, setBillingDialogOpen] = useState(false);
  const [billingRenewalId, setBillingRenewalId] = useState<string | null>(null);
  const canActivate = permissions.includes("contract.update");
  const [activating, setActivating] = useState(false);

  const [loading, setLoading] = useState(true);
  const [refreshKey, setRefreshKey] = useState(0);
  const [filter, setFilter] = useState<RenewalFilter>("ALL");
  const [days, setDays] = useState("30");
  const [page, setPage] = useState(1);

  const [selected, setSelected] = useState<RenewalContract | null>(null);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [historyLoading, setHistoryLoading] = useState(false);
  const [history, setHistory] = useState<RenewalHistoryResponse["data"] | null>(
    null,
  );

  const [form, setForm] = useState<CreateRenewalPayload>({
    startDate: "",
    endDate: "",
    title: "",
    value: "",
  });

  const reload = useCallback(() => {
    setRefreshKey((current) => current + 1);
  }, []);

  useEffect(() => {
    let active = true;

    async function fetchOverview() {
      setLoading(true);

      try {
        const result = await contractRenewalService.getOverview({
          filter,
          days: Number(days),
          page,
          limit: PAGE_SIZE,
        });

        if (active) setOverview(result);
      } catch (error) {
        if (active) {
          setOverview(null);
          toast.error(getError(error));
        }
      } finally {
        if (active) setLoading(false);
      }
    }

    void fetchOverview();

    return () => {
      active = false;
    };
  }, [days, filter, page, refreshKey]);

  useEffect(() => {
    if (!selected || !dialogOpen) {
      setHistory(null);
      return;
    }

    let active = true;
    setHistory(null);
    setHistoryLoading(true);

    void contractRenewalService
      .getHistory(selected.id)
      .then((result) => {
        if (active) setHistory(result.data);
      })
      .catch((error) => {
        if (active) toast.error(getError(error));
      })
      .finally(() => {
        if (active) setHistoryLoading(false);
      });

    return () => {
      active = false;
    };
  }, [selected, dialogOpen]);

  async function activateRenewal(renewalId: string) {
    if (!canActivate || activating) return;

    if (
      !window.confirm(
        "Aktifkan kontrak renewal ini? Pastikan billing kontrak lama sudah dinonaktifkan.",
      )
    ) {
      return;
    }

    setActivating(true);

    try {
      const response = await contractRenewalService.activateRenewal(renewalId);

      toast.success(response.message);
      setDialogOpen(false);
      setSelected(null);
      reload();
    } catch (error) {
      toast.error(getError(error));
    } finally {
      setActivating(false);
    }
  }

  function openRenewal(contract: RenewalContract) {
    setSelected(contract);
    setForm({
      startDate: nextDay(contract.endDate),
      endDate: "",
      title: `${contract.title} - Renewal`,
      value: contract.value,
    });
    setDialogOpen(true);
  }

  function openBillingHandoff(renewalId: string) {
    setBillingRenewalId(renewalId);
    setBillingDialogOpen(true);
  }

  async function submitRenewal(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!selected || !canCreate || submitting) return;

    if (!form.startDate || !form.endDate || form.endDate <= form.startDate) {
      toast.error("Tanggal akhir harus lebih besar dari tanggal mulai.");
      return;
    }

    if (
      form.value &&
      (!/^\d{1,13}(\.\d{1,2})?$/.test(form.value) || Number(form.value) < 0)
    ) {
      toast.error("Nilai kontrak tidak valid.");
      return;
    }

    setSubmitting(true);

    try {
      const result = await contractRenewalService.createDraft(selected.id, {
        startDate: `${form.startDate}T00:00:00.000Z`,
        endDate: `${form.endDate}T00:00:00.000Z`,
        ...(form.title?.trim() && { title: form.title.trim() }),
        ...(form.value && { value: form.value }),
      });

      toast.success(`Draft ${result.data.contractNo} berhasil dibuat.`);
      setDialogOpen(false);
      setSelected(null);
      reload();
    } catch (error) {
      toast.error(getError(error));
    } finally {
      setSubmitting(false);
    }
  }

  const summary = overview?.summary;
  const rows = overview?.data ?? [];
  const meta = overview?.meta;

  return (
    <div className="space-y-6 p-4 md:p-6">
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div className="space-y-1">
          <h1 className="text-2xl font-semibold tracking-tight">
            Contract Renewal
          </h1>
          <p className="text-sm text-muted-foreground">
            Pantau kontrak yang mendekati akhir periode dan buat draft
            perpanjangan tanpa mengubah kontrak sebelumnya.
          </p>
        </div>

        <Button
          type="button"
          variant="outline"
          disabled={loading}
          onClick={reload}>
          <RefreshCw className={loading ? "animate-spin" : ""} />
          Refresh
        </Button>
      </div>

      <div className="grid gap-4 md:grid-cols-3">
        <Card>
          <CardHeader>
            <CardDescription>Perlu perhatian</CardDescription>
            <CardTitle className="flex items-center gap-2 text-3xl">
              <FileClock className="size-6 text-primary" />
              {loading ? "—" : (summary?.requiresAttention ?? 0)}
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-xs text-muted-foreground">
              Kontrak kedaluwarsa dan segera berakhir.
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardDescription>Segera berakhir</CardDescription>
            <CardTitle className="flex items-center gap-2 text-3xl">
              <CalendarClock className="size-6 text-amber-500" />
              {loading ? "—" : (summary?.upcoming ?? 0)}
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-xs text-muted-foreground">
              Dalam {summary?.windowDays ?? Number(days)} hari ke depan.
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardDescription>Sudah kedaluwarsa</CardDescription>
            <CardTitle className="flex items-center gap-2 text-3xl">
              <AlertCircle className="size-6 text-destructive" />
              {loading ? "—" : (summary?.expired ?? 0)}
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-xs text-muted-foreground">
              Memerlukan peninjauan masa kontrak.
            </p>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader className="gap-3">
          <div>
            <CardTitle>Renewal Monitoring</CardTitle>
            <CardDescription>
              Kontrak ACTIVE atau EXPIRED berdasarkan akhir periode.
            </CardDescription>
          </div>

          <div className="flex flex-wrap gap-3">
            <Select
              value={filter}
              onValueChange={(value) => {
                setFilter(value as RenewalFilter);
                setPage(1);
              }}>
              <SelectTrigger className="w-[190px]">
                <SelectValue placeholder="Pilih status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="ALL">Semua perhatian</SelectItem>
                <SelectItem value="UPCOMING">Segera berakhir</SelectItem>
                <SelectItem value="EXPIRED">Kedaluwarsa</SelectItem>
              </SelectContent>
            </Select>

            <Select
              value={days}
              onValueChange={(value) => {
                setDays(value);
                setPage(1);
              }}>
              <SelectTrigger className="w-[160px]">
                <SelectValue placeholder="Periode" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="7">7 hari</SelectItem>
                <SelectItem value="14">14 hari</SelectItem>
                <SelectItem value="30">30 hari</SelectItem>
                <SelectItem value="60">60 hari</SelectItem>
                <SelectItem value="90">90 hari</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </CardHeader>

        <CardContent className="gap-4">
          {loading ? (
            <div className="space-y-3">
              {Array.from({ length: 5 }).map((_, index) => (
                <Skeleton key={index} className="h-14 w-full" />
              ))}
            </div>
          ) : rows.length === 0 ? (
            <div className="flex flex-col items-center gap-3 py-12 text-center">
              <CheckCircle2 className="size-9 text-muted-foreground" />
              <p className="font-medium">Tidak ada kontrak pada filter ini.</p>
              <p className="text-sm text-muted-foreground">
                Ubah filter atau periode pemantauan.
              </p>
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Kontrak</TableHead>
                  <TableHead>Client</TableHead>
                  <TableHead>Tanggal Berakhir</TableHead>
                  <TableHead>Sisa Hari</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Nilai</TableHead>
                  <TableHead className="text-right">Aksi</TableHead>
                </TableRow>
              </TableHeader>

              <TableBody>
                {rows.map((contract) => (
                  <TableRow key={contract.id}>
                    <TableCell>
                      <div className="max-w-56 space-y-1">
                        <p className="font-medium">{contract.contractNo}</p>
                        <p className="truncate text-xs text-muted-foreground">
                          {contract.title}
                        </p>
                      </div>
                    </TableCell>

                    <TableCell>{contract.client.companyName}</TableCell>
                    <TableCell>{formatDate(contract.endDate)}</TableCell>

                    <TableCell>
                      {contract.daysRemaining < 0
                        ? `${Math.abs(contract.daysRemaining)} hari lewat`
                        : contract.daysRemaining === 0
                          ? "Hari ini"
                          : `${contract.daysRemaining} hari`}
                    </TableCell>

                    <TableCell>
                      <Badge
                        variant={
                          contract.renewalStatus === "EXPIRED"
                            ? "destructive"
                            : "secondary"
                        }>
                        {contract.renewalStatus === "EXPIRED"
                          ? "Expired"
                          : "Upcoming"}
                      </Badge>
                    </TableCell>

                    <TableCell>
                      {formatMoney(contract.value, contract.currency)}
                    </TableCell>

                    <TableCell>
                      <div className="flex justify-end gap-2">
                        <Button size="sm" variant="outline" asChild>
                          <Link href={contractHref(contract.id)}>
                            <ExternalLink />
                            Detail
                          </Link>
                        </Button>

                        {canCreate && (
                          <Button
                            type="button"
                            size="sm"
                            onClick={() => openRenewal(contract)}>
                            <Plus />
                            Renewal
                          </Button>
                        )}
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}

          <div className="flex flex-wrap items-center justify-between gap-3 border-t pt-4">
            <p className="text-xs text-muted-foreground">
              Total {meta?.total ?? 0} kontrak
              {meta
                ? ` · Halaman ${meta.page} dari ${Math.max(meta.totalPages, 1)}`
                : ""}
            </p>

            <div className="flex gap-2">
              <Button
                variant="outline"
                size="sm"
                disabled={loading || page <= 1}
                onClick={() => setPage((value) => value - 1)}>
                <ChevronLeft />
                Sebelumnya
              </Button>

              <Button
                variant="outline"
                size="sm"
                disabled={loading || !meta || page >= meta.totalPages}
                onClick={() => setPage((value) => value + 1)}>
                Berikutnya
                <ChevronRight />
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>

      <Dialog
        open={dialogOpen}
        onOpenChange={(open) => {
          if (submitting) return;
          setDialogOpen(open);
          if (!open) setSelected(null);
        }}>
        <DialogContent className="sm:max-w-xl">
          <DialogHeader>
            <DialogTitle>Create Renewal Draft</DialogTitle>
            <DialogDescription>
              Membuat kontrak DRAFT baru tanpa mengubah kontrak sumber.
            </DialogDescription>
          </DialogHeader>

          {selected && (
            <form className="space-y-5" onSubmit={submitRenewal}>
              <div className="rounded-lg border bg-muted/30 p-3 text-sm">
                <p className="font-medium">{selected.contractNo}</p>
                <p className="text-muted-foreground">{selected.title}</p>
                <p className="mt-1 text-xs text-muted-foreground">
                  Berakhir: {formatDate(selected.endDate)}
                </p>
              </div>

              <div className="grid gap-4 sm:grid-cols-2">
                <div className="space-y-2">
                  <Label htmlFor="renewal-start">Start Date</Label>
                  <Input
                    id="renewal-start"
                    type="date"
                    required
                    min={dateOnly(selected.endDate)}
                    value={form.startDate}
                    onChange={(event) =>
                      setForm((value) => ({
                        ...value,
                        startDate: event.target.value,
                      }))
                    }
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="renewal-end">End Date</Label>
                  <Input
                    id="renewal-end"
                    type="date"
                    required
                    min={form.startDate || undefined}
                    value={form.endDate}
                    onChange={(event) =>
                      setForm((value) => ({
                        ...value,
                        endDate: event.target.value,
                      }))
                    }
                  />
                </div>

                <div className="space-y-2 sm:col-span-2">
                  <Label htmlFor="renewal-title">Judul Kontrak</Label>
                  <Input
                    id="renewal-title"
                    minLength={2}
                    maxLength={200}
                    value={form.title ?? ""}
                    onChange={(event) =>
                      setForm((value) => ({
                        ...value,
                        title: event.target.value,
                      }))
                    }
                    placeholder="Judul renewal"
                  />
                </div>

                <div className="space-y-2 sm:col-span-2">
                  <Label htmlFor="renewal-value">
                    Nilai Kontrak ({selected.currency})
                  </Label>
                  <Input
                    id="renewal-value"
                    type="text"
                    inputMode="decimal"
                    value={form.value ?? ""}
                    onChange={(event) =>
                      setForm((value) => ({
                        ...value,
                        value: event.target.value,
                      }))
                    }
                    placeholder="120000000.00"
                  />
                </div>
              </div>

              <div className="space-y-2 rounded-lg border p-3">
                <p className="flex items-center gap-2 text-sm font-medium">
                  <History className="size-4" />
                  Renewal History
                </p>

                {historyLoading ? (
                  <Skeleton className="h-12 w-full" />
                ) : history ? (
                  <div className="space-y-2 text-xs text-muted-foreground">
                    {history.renewedFrom && (
                      <p className="flex items-center gap-2">
                        <span>{history.renewedFrom.contractNo}</span>
                        <ArrowRight className="size-3" />
                        <span>{history.contractNo}</span>
                      </p>
                    )}

                    {history.renewedTo ? (
                      <p>
                        Sudah memiliki renewal:{" "}
                        <strong>{history.renewedTo.contractNo}</strong>
                      </p>
                    ) : (
                      <p>Belum memiliki kontrak renewal.</p>
                    )}
                  </div>
                ) : (
                  <p className="text-xs text-muted-foreground">
                    Riwayat tidak tersedia.
                  </p>
                )}
              </div>

              {history?.renewedTo && (
                <div className="space-y-3 rounded-lg border p-4">
                  <div className="flex items-center justify-between gap-3">
                    <div>
                      <p className="text-sm font-medium">Kontrak Renewal</p>
                      <p className="text-xs text-muted-foreground">
                        {history.renewedTo.contractNo}
                      </p>
                    </div>
                    <Badge variant="secondary">
                      {history.renewedTo.status}
                    </Badge>
                  </div>

                  {history.renewedTo.status === "DRAFT" && canActivate && (
                    <Button
                      type="button"
                      variant="outline"
                      className="w-full"
                      disabled={activating || submitting}
                      onClick={() => activateRenewal(history.renewedTo!.id)}>
                      {activating && <Loader2 className="animate-spin" />}
                      Activate Renewal
                    </Button>
                  )}

                  {history.renewedTo.status === "ACTIVE" &&
                    permissions.includes("recurring_billing.read") && (
                      <Button
                        type="button"
                        variant="secondary"
                        className="w-full"
                        onClick={() => {
                          const renewalId = history.renewedTo!.id;

                          setDialogOpen(false);
                          openBillingHandoff(renewalId);
                        }}>
                        <CreditCard className="size-4" />
                        Configure Recurring Billing
                      </Button>
                    )}

                  <p className="text-xs text-muted-foreground">
                    Aktivasi tidak otomatis membuat invoice atau recurring
                    billing.
                  </p>
                </div>
              )}

              <DialogFooter>
                <Button
                  type="button"
                  variant="outline"
                  disabled={submitting}
                  onClick={() => setDialogOpen(false)}>
                  Batal
                </Button>

                <Button
                  type="submit"
                  disabled={
                    submitting ||
                    historyLoading ||
                    !history ||
                    Boolean(history.renewedTo)
                  }>
                  {submitting && <Loader2 className="animate-spin" />}
                  Buat Draft Renewal
                </Button>
              </DialogFooter>
            </form>
          )}
        </DialogContent>
      </Dialog>

      <ContractRenewalBillingDialog
        open={billingDialogOpen}
        onOpenChange={(open) => {
          setBillingDialogOpen(open);

          if (!open) {
            setBillingRenewalId(null);
          }
        }}
        renewalId={billingRenewalId}
        permissions={permissions}
        onSuccess={reload}
      />
    </div>
  );
}
