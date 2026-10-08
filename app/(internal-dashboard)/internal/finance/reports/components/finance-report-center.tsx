"use client";

import { ClientItem, clientService } from "@/app/services/client.service";
import { financeReportService } from "@/app/services/finance-report.service";
import {
  FinanceReportFormat,
  FinanceReportType,
} from "@/app/types/finance-report.type";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Download,
  FileSpreadsheet,
  FileText,
  Loader2,
  ReceiptText,
  Wallet,
} from "lucide-react";
import { useEffect, useState } from "react";
import { toast } from "sonner";
import { FinanceReportHistory } from "./finance-report-history";

interface FinanceReportCenterProps {
  permissions: string[];
}

const REPORTS = [
  {
    type: "invoices" as const,
    title: "Invoice Report",
    description: "Export invoice, nilai tagihan, pembayaran, dan outstanding.",
    icon: ReceiptText,
    permission: "invoice.read",
  },
  {
    type: "payments" as const,
    title: "Payment Report",
    description: "Export transaksi pembayaran dan status verifikasinya.",
    icon: Wallet,
    permission: "payment.read",
  },
  {
    type: "aging" as const,
    title: "AR Aging Report",
    description: "Export piutang berdasarkan umur keterlambatan saat ini.",
    icon: FileSpreadsheet,
    permission: "invoice.read",
  },
];

export function FinanceReportCenter({ permissions }: FinanceReportCenterProps) {
  const availableReports = REPORTS.filter((item) =>
    permissions.includes(item.permission),
  );

  const [reportType, setReportType] = useState<FinanceReportType>(
    availableReports[0].type,
  );

  const [format, setFormat] = useState<FinanceReportFormat>("xlsx");
  const [status, setStatus] = useState("ALL");
  const [paymentMethod, setPaymentMethod] = useState("ALL");
  const [clientId, setClientId] = useState("ALL");
  const [dateFrom, setDateFrom] = useState("");
  const [dateTo, setDateTo] = useState("");
  const [clients, setClients] = useState<ClientItem[]>([]);
  const [clientSearch, setClientSearch] = useState("");
  const [loadingClients, setLoadingClients] = useState(false);
  const [exporting, setExporting] = useState(false);

  const [historyRefreshKey, setHistoryRefreshKey] = useState(0);

  const hasClientAccess = permissions.includes("client.read");
  const selectedReport = availableReports.find(
    (item) => item.type === reportType,
  );
  const isAging = reportType === "aging";

  useEffect(() => {
    if (!hasClientAccess || isAging) return;

    let cancelled = false;
    const timeout = setTimeout(async () => {
      try {
        setLoadingClients(true);
        const result = await clientService.getClients({
          search: clientSearch || undefined,
          page: 1,
          limit: 100,
        });
        if (!cancelled) setClients(result.data);
      } catch (error) {
        if (!cancelled) {
          toast.error(
            error instanceof Error ? error.message : "Gagal memuat client.",
          );
        }
      } finally {
        if (!cancelled) setLoadingClients(false);
      }
    }, 350);

    return () => {
      cancelled = true;
      clearTimeout(timeout);
    };
  }, [clientSearch, hasClientAccess, isAging]);

  const handleReportChange = (value: FinanceReportType) => {
    setReportType(value);
    setStatus("ALL");
    setPaymentMethod("ALL");
    setClientId("ALL");
    setClientSearch("");
    setDateFrom("");
    setDateTo("");
  };

  const handleDownload = async () => {
    if (!isAging && dateFrom && dateTo && dateFrom > dateTo) {
      toast.error("Tanggal awal tidak boleh melewati tanggal akhir.");
      return;
    }

    try {
      setExporting(true);

      if (reportType === "invoices") {
        await financeReportService.exportInvoices(
          {
            status: status === "ALL" ? undefined : status,
            clientId: clientId === "ALL" ? undefined : clientId,
            dateFrom: dateFrom || undefined,
            dateTo: dateTo || undefined,
          },
          format,
        );
      } else if (reportType === "payments") {
        await financeReportService.exportPayments(
          {
            status: status === "ALL" ? undefined : status,
            paymentMethod: paymentMethod === "ALL" ? undefined : paymentMethod,
            clientId: clientId === "ALL" ? undefined : clientId,
            dateFrom: dateFrom || undefined,
            dateTo: dateTo || undefined,
          },
          format,
        );
      } else {
        await financeReportService.exportAging(format);
      }
      toast.success("Download laporan berhasil dimulai.");
      setHistoryRefreshKey((prev) => prev + 1);
    } catch (error) {
      toast.error("Gagal export laporan", {
        description:
          error instanceof Error ? error.message : "Terjadi kesalahan.",
      });
    } finally {
      setExporting(false);
    }
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-semibold">Finance Report Center</h1>
        <p className="text-sm text-muted-foreground">
          Unduh laporan keuangan berdasarkan data dan hak akses pengguna.
        </p>
      </div>

      <div className="grid gap-4 md:grid-cols-3">
        {availableReports.map((report) => {
          const Icon = report.icon;
          const active = reportType === report.type;

          return (
            <button
              key={report.type}
              type="button"
              onClick={() => handleReportChange(report.type)}
              aria-pressed={active}
              className={`rounded-xl border p-5 text-left transition-colors hover:bg-muted/40 ${
                active ? "border-primary bg-primary/5" : "bg-card"
              }`}>
              <Icon className="mb-4 size-6 text-muted-foreground" />
              <h2 className="font-semibold">{report.title}</h2>
              <p className="mt-2 text-sm text-muted-foreground">
                {report.description}
              </p>
            </button>
          );
        })}
      </div>

      <div className="rounded-xl border bg-card p-5">
        <div className="mb-6">
          <h2 className="font-semibold">{selectedReport?.title}</h2>
          <p className="text-sm text-muted-foreground">
            {isAging
              ? "Laporan snapshot piutang terkini, tanpa filter periode."
              : "Atur filter laporan sebelum mengunduh file CSV."}
          </p>
        </div>

        {!isAging && (
          <div className="grid gap-5 md:grid-cols-2">
            <div className="space-y-2">
              <Label>Status</Label>
              <Select value={status} onValueChange={setStatus}>
                <SelectTrigger className="w-full">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="ALL">Semua Status</SelectItem>
                  {reportType === "invoices" ? (
                    <>
                      <SelectItem value="DRAFT">Draft</SelectItem>
                      <SelectItem value="SENT">Sent</SelectItem>
                      <SelectItem value="PARTIALLY_PAID">
                        Partially Paid
                      </SelectItem>
                      <SelectItem value="PAID">Paid</SelectItem>
                      <SelectItem value="OVERDUE">Overdue</SelectItem>
                      <SelectItem value="CANCELLED">Cancelled</SelectItem>
                    </>
                  ) : (
                    <>
                      <SelectItem value="PENDING">Pending</SelectItem>
                      <SelectItem value="VERIFIED">Verified</SelectItem>
                      <SelectItem value="REJECTED">Rejected</SelectItem>
                    </>
                  )}
                </SelectContent>
              </Select>
            </div>

            {reportType === "payments" && (
              <div className="space-y-2">
                <Label>Metode Pembayaran</Label>
                <Select value={paymentMethod} onValueChange={setPaymentMethod}>
                  <SelectTrigger className="w-full">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="ALL">Semua Metode</SelectItem>
                    <SelectItem value="BANK_TRANSFER">Bank Transfer</SelectItem>
                    <SelectItem value="CASH">Cash</SelectItem>
                    <SelectItem value="CREDIT_CARD">Credit Card</SelectItem>
                    <SelectItem value="VIRTUAL_ACCOUNT">
                      Virtual Account
                    </SelectItem>
                    <SelectItem value="E_WALLET">E-Wallet</SelectItem>
                    <SelectItem value="OTHER">Other</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            )}

            <div className="space-y-2">
              <Label>Tanggal Awal</Label>
              <Input
                type="date"
                value={dateFrom}
                onChange={(event) => setDateFrom(event.target.value)}
              />
            </div>

            <div className="space-y-2">
              <Label>Tanggal Akhir</Label>
              <Input
                type="date"
                min={dateFrom || undefined}
                value={dateTo}
                onChange={(event) => setDateTo(event.target.value)}
              />
            </div>

            {hasClientAccess && (
              <div className="space-y-2 md:col-span-2">
                <Label>Client</Label>
                <Input
                  placeholder="Cari client..."
                  value={clientSearch}
                  onChange={(event) => setClientSearch(event.target.value)}
                />
                <Select value={clientId} onValueChange={setClientId}>
                  <SelectTrigger className="w-full">
                    <SelectValue
                      placeholder={
                        loadingClients ? "Memuat client..." : "Pilih client"
                      }
                    />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="ALL">Semua Client</SelectItem>
                    {clients.map((client) => (
                      <SelectItem key={client.id} value={client.id}>
                        {client.clientCode} — {client.companyName}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <p className="text-xs text-muted-foreground">
                  Cari berdasarkan nama atau kode client. Maksimal 100 hasil
                  pencarian ditampilkan.
                </p>
              </div>
            )}
          </div>
        )}

        <div className="mt-6 space-y-3 border-t pt-5">
          <Label>Format Laporan</Label>

          <div className="grid gap-3 sm:grid-cols-2">
            <button
              type="button"
              onClick={() => setFormat("xlsx")}
              aria-pressed={format === "xlsx"}
              className={`flex items-center gap-3 rounded-lg border p-4 text-left transition-colors ${
                format === "xlsx"
                  ? "border-primary bg-primary/5"
                  : "hover:bg-muted/40"
              }`}>
              <FileSpreadsheet className="size-6 text-emerald-600" />
              <div>
                <p className="text-sm font-semibold">Excel (.xlsx)</p>
                <p className="text-xs text-muted-foreground">
                  Tabel terformat dan filter Excel
                </p>
              </div>
            </button>

            <button
              type="button"
              onClick={() => setFormat("csv")}
              aria-pressed={format === "csv"}
              className={`flex items-center gap-3 rounded-lg border p-4 text-left transition-colors ${
                format === "csv"
                  ? "border-primary bg-primary/5"
                  : "hover:bg-muted/40"
              }`}>
              <FileText className="size-6 text-muted-foreground" />
              <div>
                <p className="text-sm font-semibold">CSV (.csv)</p>
                <p className="text-xs text-muted-foreground">
                  Data mentah untuk impor dan integrasi
                </p>
              </div>
            </button>
          </div>
        </div>

        <div className="mt-6 flex flex-col gap-3 border-t pt-5 sm:flex-row sm:items-center sm:justify-between">
          <p className="text-xs text-muted-foreground">
            Format {format.toUpperCase()} · Data mengikuti permission dan scope
            backend.
          </p>

          <Button onClick={() => void handleDownload()} disabled={exporting}>
            {exporting ? (
              <Loader2 className="size-4 animate-spin" />
            ) : (
              <Download className="size-4" />
            )}
            {exporting
              ? "Menyiapkan laporan..."
              : `Download ${format.toUpperCase()}`}
          </Button>
        </div>
      </div>
      <FinanceReportHistory refreshKey={historyRefreshKey} />
    </div>
  );
}
