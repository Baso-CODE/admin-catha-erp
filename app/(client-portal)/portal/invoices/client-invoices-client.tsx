"use client";

import { useEffect, useState } from "react";
import { toast } from "sonner";

import { FileText, Loader2, RefreshCw, Search, Wallet } from "lucide-react";

import {
  clientPortalInvoiceService,
  type ClientInvoiceDetail,
  type ClientInvoiceFilter,
  type ClientInvoiceItem,
} from "@/app/services/client-portal-invoice.service";

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
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
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

function money(value: string, currency: string) {
  const numericValue = Number(value);

  if (!Number.isFinite(numericValue)) {
    return `${currency} ${value}`;
  }

  return new Intl.NumberFormat("id-ID", {
    style: "currency",
    currency,
    maximumFractionDigits: 2,
  }).format(numericValue);
}

function date(value: string) {
  return new Date(value).toLocaleDateString("id-ID", {
    day: "2-digit",
    month: "short",
    year: "numeric",
    timeZone: "UTC",
  });
}

function message(error: unknown) {
  return error instanceof Error ? error.message : "Terjadi kesalahan.";
}

function StatusBadge({
  status,
}: {
  status: ClientInvoiceItem["paymentStatus"];
}) {
  const label = {
    PAID: "Lunas",
    PARTIALLY_PAID: "Sebagian Dibayar",
    OVERDUE: "Terlambat",
    UNPAID: "Belum Dibayar",
  }[status];

  return (
    <Badge
      variant={
        status === "OVERDUE"
          ? "destructive"
          : status === "PAID"
            ? "default"
            : "secondary"
      }>
      {label}
    </Badge>
  );
}

export default function ClientInvoicesClient() {
  const [rows, setRows] = useState<ClientInvoiceItem[]>([]);
  const [loading, setLoading] = useState(true);

  const [filter, setFilter] = useState<ClientInvoiceFilter>("ALL");
  const [searchInput, setSearchInput] = useState("");
  const [search, setSearch] = useState("");
  const [page, setPage] = useState(1);
  const [refreshKey, setRefreshKey] = useState(0);

  const [meta, setMeta] = useState({
    total: 0,
    page: 1,
    limit: 10,
    totalPages: 0,
  });

  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [detail, setDetail] = useState<ClientInvoiceDetail | null>(null);
  const [detailLoading, setDetailLoading] = useState(false);

  useEffect(() => {
    let active = true;

    async function load() {
      setLoading(true);

      try {
        const result = await clientPortalInvoiceService.getAll({
          page,
          limit: 10,
          filter,
          search,
        });

        if (!active) return;

        setRows(result.data);
        setMeta(result.meta);
      } catch (error) {
        if (!active) return;

        setRows([]);
        toast.error(message(error));
      } finally {
        if (active) setLoading(false);
      }
    }

    void load();

    return () => {
      active = false;
    };
  }, [page, filter, search, refreshKey]);

  useEffect(() => {
    if (!selectedId) {
      setDetail(null);
      return;
    }

    let active = true;

    async function loadDetail() {
      setDetail(null);
      setDetailLoading(true);

      try {
        const result = await clientPortalInvoiceService.getById(selectedId!);

        if (active) setDetail(result.data);
      } catch (error) {
        if (active) toast.error(message(error));
      } finally {
        if (active) setDetailLoading(false);
      }
    }

    void loadDetail();

    return () => {
      active = false;
    };
  }, [selectedId]);

  return (
    <div className="space-y-6 p-4 md:p-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl font-semibold">Invoice & Payment</h1>

          <p className="text-sm text-muted-foreground">
            Pantau tagihan dan riwayat pembayaran perusahaan Anda.
          </p>
        </div>

        <Button
          variant="outline"
          onClick={() => setRefreshKey((value) => value + 1)}
          disabled={loading}>
          <RefreshCw className={loading ? "animate-spin" : ""} />
          Refresh
        </Button>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Wallet className="size-5" />
            Daftar Invoice
          </CardTitle>

          <CardDescription>
            Pembayaran dihitung setelah diverifikasi Finance.
          </CardDescription>

          <div className="flex flex-wrap gap-3 pt-3">
            <form
              className="flex min-w-56 flex-1 gap-2"
              onSubmit={(event) => {
                event.preventDefault();
                setPage(1);
                setSearch(searchInput);
              }}>
              <Input
                placeholder="Cari nomor invoice / kontrak..."
                value={searchInput}
                onChange={(event) => setSearchInput(event.target.value)}
              />

              <Button type="submit" variant="outline">
                <Search className="size-4" />
                Cari
              </Button>
            </form>

            <Select
              value={filter}
              onValueChange={(value) => {
                setFilter(value as ClientInvoiceFilter);
                setPage(1);
              }}>
              <SelectTrigger className="w-44">
                <SelectValue placeholder="Filter status" />
              </SelectTrigger>

              <SelectContent>
                <SelectItem value="ALL">Semua Invoice</SelectItem>
                <SelectItem value="OUTSTANDING">Belum Lunas</SelectItem>
                <SelectItem value="OVERDUE">Terlambat</SelectItem>
                <SelectItem value="PAID">Lunas</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </CardHeader>

        <CardContent className="space-y-4">
          {loading ? (
            <div className="space-y-3">
              {Array.from({ length: 5 }, (_, index) => (
                <Skeleton key={index} className="h-12 w-full" />
              ))}
            </div>
          ) : rows.length === 0 ? (
            <div className="flex flex-col items-center gap-2 py-12 text-center">
              <FileText className="size-9 text-muted-foreground" />
              <p className="font-medium">Tidak ada invoice</p>
              <p className="text-sm text-muted-foreground">
                Belum ada invoice yang sesuai dengan filter.
              </p>
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Invoice</TableHead>
                  <TableHead>Kontrak</TableHead>
                  <TableHead>Jatuh Tempo</TableHead>
                  <TableHead>Total</TableHead>
                  <TableHead>Sisa Tagihan</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead className="text-right">Aksi</TableHead>
                </TableRow>
              </TableHeader>

              <TableBody>
                {rows.map((invoice) => (
                  <TableRow key={invoice.id}>
                    <TableCell className="font-medium">
                      {invoice.invoiceNo}
                    </TableCell>

                    <TableCell>{invoice.contract?.contractNo ?? "—"}</TableCell>

                    <TableCell>{date(invoice.dueDate)}</TableCell>

                    <TableCell>
                      {money(invoice.totalAmount, invoice.currency)}
                    </TableCell>

                    <TableCell>
                      {money(invoice.outstandingAmount, invoice.currency)}
                    </TableCell>

                    <TableCell>
                      <StatusBadge status={invoice.paymentStatus} />
                    </TableCell>

                    <TableCell className="text-right">
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => setSelectedId(invoice.id)}>
                        Detail
                      </Button>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}

          <div className="flex flex-wrap items-center justify-between gap-3 border-t pt-4">
            <p className="text-sm text-muted-foreground">
              {meta.total} invoice · Halaman {page} dari{" "}
              {Math.max(meta.totalPages, 1)}
            </p>

            <div className="flex gap-2">
              <Button
                variant="outline"
                size="sm"
                disabled={loading || page <= 1}
                onClick={() => setPage((value) => value - 1)}>
                Sebelumnya
              </Button>

              <Button
                variant="outline"
                size="sm"
                disabled={loading || page >= meta.totalPages}
                onClick={() => setPage((value) => value + 1)}>
                Berikutnya
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>

      <Dialog
        open={selectedId !== null}
        onOpenChange={(open) => {
          if (!open) setSelectedId(null);
        }}>
        <DialogContent className="max-h-[90vh] overflow-y-auto sm:max-w-2xl">
          <DialogHeader>
            <DialogTitle>Detail Invoice</DialogTitle>
            <DialogDescription>
              Rincian tagihan dan pembayaran terverifikasi.
            </DialogDescription>
          </DialogHeader>

          {detailLoading ? (
            <div className="flex items-center gap-2 py-8">
              <Loader2 className="size-5 animate-spin" />
              Memuat detail invoice...
            </div>
          ) : !detail ? (
            <p className="py-6 text-sm text-muted-foreground">
              Detail invoice tidak tersedia.
            </p>
          ) : (
            <div className="space-y-5">
              <div className="flex flex-wrap items-center justify-between gap-3">
                <div>
                  <p className="text-lg font-semibold">{detail.invoiceNo}</p>
                  <p className="text-sm text-muted-foreground">
                    Jatuh tempo: {date(detail.dueDate)}
                  </p>
                </div>

                <StatusBadge status={detail.paymentStatus} />
              </div>

              <Card>
                <CardContent className="grid gap-4 sm:grid-cols-3">
                  <div>
                    <p className="text-xs text-muted-foreground">
                      Total Tagihan
                    </p>
                    <p className="font-semibold">
                      {money(detail.totalAmount, detail.currency)}
                    </p>
                  </div>

                  <div>
                    <p className="text-xs text-muted-foreground">Terbayar</p>
                    <p className="font-semibold">
                      {money(detail.paidAmount, detail.currency)}
                    </p>
                  </div>

                  <div>
                    <p className="text-xs text-muted-foreground">Outstanding</p>
                    <p className="font-semibold">
                      {money(detail.outstandingAmount, detail.currency)}
                    </p>
                  </div>
                </CardContent>
              </Card>

              <div>
                <h3 className="mb-3 font-semibold">Rincian Item</h3>

                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Deskripsi</TableHead>
                      <TableHead>Qty</TableHead>
                      <TableHead>Harga</TableHead>
                      <TableHead>Subtotal</TableHead>
                    </TableRow>
                  </TableHeader>

                  <TableBody>
                    {detail.items.map((item) => (
                      <TableRow key={item.id}>
                        <TableCell>{item.description}</TableCell>
                        <TableCell>{item.quantity}</TableCell>
                        <TableCell>
                          {money(item.unitPrice, detail.currency)}
                        </TableCell>
                        <TableCell>
                          {money(item.lineTotal, detail.currency)}
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>

              <div>
                <h3 className="mb-3 font-semibold">Riwayat Pembayaran</h3>

                {detail.payments.length === 0 ? (
                  <p className="text-sm text-muted-foreground">
                    Belum ada pembayaran yang terverifikasi.
                  </p>
                ) : (
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>No. Pembayaran</TableHead>
                        <TableHead>Tanggal</TableHead>
                        <TableHead>Nominal</TableHead>
                      </TableRow>
                    </TableHeader>

                    <TableBody>
                      {detail.payments.map((payment) => (
                        <TableRow key={payment.id}>
                          <TableCell>{payment.paymentNo}</TableCell>
                          <TableCell>{date(payment.paymentDate)}</TableCell>
                          <TableCell>
                            {money(payment.amountPaid, detail.currency)}
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                )}
              </div>

              <p className="text-xs text-muted-foreground">
                Untuk konfirmasi atau koreksi pembayaran, hubungi tim Finance
                Catha.
              </p>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}
