"use client";

import { useCallback, useEffect, useState } from "react";
import { toast } from "sonner";

import {
  Payment,
  PaymentMethod,
  PaymentStatus,
  paymentService,
} from "@/app/services/payment.service";
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
import { Plus } from "lucide-react";
import Link from "next/link";
import { PaymentTable } from "./components/payment-table";

interface PaymentsPageClientProps {
  permissions: string[];
}

export default function PaymentsPageClient({
  permissions,
}: PaymentsPageClientProps) {
  const [payments, setPayments] = useState<Payment[]>([]);
  const [loading, setLoading] = useState(true);

  const [search, setSearch] = useState("");
  const [debouncedSearch, setDebouncedSearch] = useState("");

  const [status, setStatus] = useState<PaymentStatus | "ALL">("ALL");

  const [paymentMethod, setPaymentMethod] = useState<PaymentMethod | "ALL">(
    "ALL",
  );

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

  const loadPayments = useCallback(async () => {
    try {
      setLoading(true);

      const response = await paymentService.getAll({
        search: debouncedSearch || undefined,
        status: status === "ALL" ? undefined : status,
        paymentMethod: paymentMethod === "ALL" ? undefined : paymentMethod,
        page,
        limit: 10,
      });

      if (response.success) {
        setPayments(response.data);
        setMeta(response.meta);
      }
    } catch (error) {
      toast.error("Gagal memuat payment", {
        description:
          error instanceof Error
            ? error.message
            : "Terjadi kesalahan pada server.",
      });
    } finally {
      setLoading(false);
    }
  }, [debouncedSearch, status, paymentMethod, page]);

  useEffect(() => {
    void loadPayments();
  }, [loadPayments]);

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-semibold">Payment Management</h1>

          <p className="text-sm text-muted-foreground">
            Kelola pembayaran invoice dan proses verifikasi pembayaran client.
          </p>
        </div>

        <PermissionGuard permissions={permissions} required="payment.create">
          <Button asChild>
            <Link href="/internal/finance/payments/new">
              <Plus className="size-4" />
              Buat Payment
            </Link>
          </Button>
        </PermissionGuard>
      </div>

      <div className="flex flex-col gap-3 lg:flex-row">
        <Input
          placeholder="Cari payment, invoice, client..."
          value={search}
          onChange={(event) => setSearch(event.target.value)}
          className="lg:max-w-sm"
        />

        <Select
          value={status}
          onValueChange={(value) => {
            setStatus(value as PaymentStatus | "ALL");
            setPage(1);
          }}>
          <SelectTrigger className="w-full lg:w-45">
            <SelectValue />
          </SelectTrigger>

          <SelectContent>
            <SelectItem value="ALL">Semua Status</SelectItem>
            <SelectItem value="PENDING">Pending</SelectItem>
            <SelectItem value="VERIFIED">Verified</SelectItem>
            <SelectItem value="REJECTED">Rejected</SelectItem>
          </SelectContent>
        </Select>

        <Select
          value={paymentMethod}
          onValueChange={(value) => {
            setPaymentMethod(value as PaymentMethod | "ALL");
            setPage(1);
          }}>
          <SelectTrigger className="w-full lg:w-52">
            <SelectValue />
          </SelectTrigger>

          <SelectContent>
            <SelectItem value="ALL">Semua Method</SelectItem>
            <SelectItem value="BANK_TRANSFER">Bank Transfer</SelectItem>
            <SelectItem value="CASH">Cash</SelectItem>
            <SelectItem value="CREDIT_CARD">Credit Card</SelectItem>
            <SelectItem value="VIRTUAL_ACCOUNT">Virtual Account</SelectItem>
            <SelectItem value="E_WALLET">E-Wallet</SelectItem>
            <SelectItem value="OTHER">Other</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {loading ? (
        <div className="flex min-h-60 items-center justify-center rounded-xl border text-sm text-muted-foreground">
          Memuat data payment...
        </div>
      ) : payments.length === 0 ? (
        <div className="flex min-h-60 items-center justify-center rounded-xl border text-sm text-muted-foreground">
          Belum ada data payment.
        </div>
      ) : (
        <PaymentTable payments={payments} permissions={permissions} />
      )}

      <div className="flex items-center justify-between">
        <p className="text-sm text-muted-foreground">
          Total {meta.total} payment
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
              page >= meta.totalPages || meta.totalPages === 0 || loading
            }
            onClick={() => setPage((prev) => prev + 1)}>
            Next
          </Button>
        </div>
      </div>
    </div>
  );
}
