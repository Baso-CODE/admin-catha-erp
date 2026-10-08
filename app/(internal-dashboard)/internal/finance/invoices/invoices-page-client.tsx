"use client";

import { Plus } from "lucide-react";
import Link from "next/link";
import { useCallback, useEffect, useState } from "react";
import { toast } from "sonner";

import {
  Invoice,
  InvoiceStatus,
  invoiceService,
} from "@/app/services/invoice.service";
import { PermissionGuard } from "@/components/shared/permission-guard";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { InvoiceTable } from "./components/invoice-table";

interface InvoicesPageClientProps {
  permissions: string[];
}

export default function InvoicesPageClient({
  permissions,
}: InvoicesPageClientProps) {
  const [invoices, setInvoices] = useState<Invoice[]>([]);
  const [loading, setLoading] = useState(true);

  const [search, setSearch] = useState("");
  const [debouncedSearch, setDebouncedSearch] = useState("");

  const [status, setStatus] = useState<InvoiceStatus | "ALL">("ALL");

  const [page, setPage] = useState(1);

  const [meta, setMeta] = useState({
    total: 0,
    page: 1,
    limit: 10,
    totalPages: 1,
  });

  useEffect(() => {
    const timeout = setTimeout(() => {
      setDebouncedSearch(search);
      setPage(1);
    }, 400);

    return () => clearTimeout(timeout);
  }, [search]);

  const loadInvoices = useCallback(async () => {
    try {
      setLoading(true);

      const response = await invoiceService.getAll({
        search: debouncedSearch || undefined,
        status: status === "ALL" ? undefined : status,
        page,
        limit: 10,
      });

      if (response.success) {
        setInvoices(response.data);
        setMeta(response.meta);
      }
    } catch (error) {
      toast.error("Gagal memuat invoice", {
        description:
          error instanceof Error
            ? error.message
            : "Terjadi kesalahan pada server.",
      });
    } finally {
      setLoading(false);
    }
  }, [debouncedSearch, status, page]);

  useEffect(() => {
    void loadInvoices();
  }, [loadInvoices]);

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-semibold">Invoice Management</h1>

          <p className="text-sm text-muted-foreground">
            Kelola invoice, status pembayaran, dan outstanding client.
          </p>
        </div>

        <PermissionGuard permissions={permissions} required="invoice.create">
          <Button asChild>
            <Link href="/internal/finance/invoices/new">
              <Plus className="size-4" />
              Buat Invoice
            </Link>
          </Button>
        </PermissionGuard>
      </div>

      <div className="flex flex-col gap-3 sm:flex-row">
        <Input
          placeholder="Cari invoice, client, project..."
          value={search}
          onChange={(event) => setSearch(event.target.value)}
          className="sm:max-w-sm"
        />

        <Select
          value={status}
          onValueChange={(value) => {
            setStatus(value as InvoiceStatus | "ALL");
            setPage(1);
          }}>
          <SelectTrigger className="w-full sm:w-50">
            <SelectValue />
          </SelectTrigger>

          <SelectContent>
            <SelectItem value="ALL">Semua Status</SelectItem>
            <SelectItem value="DRAFT">Draft</SelectItem>
            <SelectItem value="SENT">Sent</SelectItem>
            <SelectItem value="PARTIALLY_PAID">Partially Paid</SelectItem>
            <SelectItem value="PAID">Paid</SelectItem>
            <SelectItem value="OVERDUE">Overdue</SelectItem>
            <SelectItem value="CANCELLED">Cancelled</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {loading ? (
        <div className="flex min-h-60 items-center justify-center rounded-xl border text-sm text-muted-foreground">
          Memuat data invoice...
        </div>
      ) : invoices.length === 0 ? (
        <div className="flex min-h-60 items-center justify-center rounded-xl border text-sm text-muted-foreground">
          Belum ada data invoice.
        </div>
      ) : (
        <InvoiceTable
          invoices={invoices}
          permissions={permissions}
          onRefresh={loadInvoices}
        />
      )}

      <div className="flex items-center justify-between">
        <p className="text-sm text-muted-foreground">
          Total {meta.total} invoice
        </p>

        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            size="sm"
            disabled={page <= 1 || loading}
            onClick={() => setPage((prev) => Math.max(1, prev - 1))}>
            Previous
          </Button>

          <span className="text-sm">
            {meta.page} / {Math.max(meta.totalPages, 1)}
          </span>

          <Button
            variant="outline"
            size="sm"
            disabled={
              page >= meta.totalPages || loading || meta.totalPages === 0
            }
            onClick={() => setPage((prev) => prev + 1)}>
            Next
          </Button>
        </div>
      </div>
    </div>
  );
}
