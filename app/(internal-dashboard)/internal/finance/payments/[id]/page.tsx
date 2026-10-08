import {
  ArrowLeft,
  CalendarDays,
  CreditCard,
  FileText,
  Landmark,
  UserCheck,
} from "lucide-react";
import Link from "next/link";
import { notFound, redirect } from "next/navigation";

import { requireInternalUser } from "@/app/lib/auth/require-internal-user";
import { getPaymentServer } from "@/app/lib/finance/get-payment-server";
import { Button } from "@/components/ui/button";
import { PaymentStatusBadge } from "../components/payment-status-badge";
import { PaymentActions } from "./payment-actions";

interface PaymentDetailPageProps {
  params: Promise<{
    id: string;
  }>;
}

function formatCurrency(value: string | number, currency = "IDR") {
  return new Intl.NumberFormat("id-ID", {
    style: "currency",
    currency,
    maximumFractionDigits: 2,
  }).format(Number(value));
}

function formatDate(value?: string | null) {
  if (!value) return "-";

  return new Intl.DateTimeFormat("id-ID", {
    day: "2-digit",
    month: "long",
    year: "numeric",
  }).format(new Date(value));
}

function formatPaymentMethod(value: string) {
  return value
    .split("_")
    .map((word) => word.charAt(0) + word.slice(1).toLowerCase())
    .join(" ");
}

export default async function PaymentDetailPage({
  params,
}: PaymentDetailPageProps) {
  const user = await requireInternalUser();

  if (!user.permissions.includes("payment.read")) {
    redirect("/internal");
  }

  const { id } = await params;

  const payment = await getPaymentServer(id);

  if (!payment) {
    notFound();
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex items-start gap-3">
          <Button variant="outline" size="icon" asChild>
            <Link href="/internal/finance/payments">
              <ArrowLeft className="size-4" />
            </Link>
          </Button>

          <div>
            <div className="flex flex-wrap items-center gap-3">
              <h1 className="text-2xl font-semibold">{payment.paymentNo}</h1>

              <PaymentStatusBadge status={payment.status} />
            </div>

            <p className="text-sm text-muted-foreground">
              Pembayaran untuk invoice {payment.invoice?.invoiceNo ?? "-"}
            </p>
          </div>
        </div>

        <PaymentActions payment={payment} permissions={user.permissions} />
      </div>

      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
        <div className="rounded-xl border p-4">
          <div className="mb-2 flex items-center gap-2 text-sm text-muted-foreground">
            <Landmark className="size-4" />
            Amount
          </div>

          <p className="text-xl font-semibold">
            {formatCurrency(
              payment.amountPaid,
              payment.invoice?.currency ?? "IDR",
            )}
          </p>
        </div>

        <div className="rounded-xl border p-4">
          <div className="mb-2 flex items-center gap-2 text-sm text-muted-foreground">
            <CalendarDays className="size-4" />
            Payment Date
          </div>

          <p className="font-medium">{formatDate(payment.paymentDate)}</p>
        </div>

        <div className="rounded-xl border p-4">
          <div className="mb-2 flex items-center gap-2 text-sm text-muted-foreground">
            <CreditCard className="size-4" />
            Method
          </div>

          <p className="font-medium">
            {formatPaymentMethod(payment.paymentMethod)}
          </p>
        </div>

        <div className="rounded-xl border p-4">
          <div className="mb-2 flex items-center gap-2 text-sm text-muted-foreground">
            <FileText className="size-4" />
            Reference
          </div>

          <p className="font-medium">{payment.reference ?? "-"}</p>
        </div>
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        <div className="rounded-xl border p-5">
          <h2 className="mb-4 font-semibold">Informasi Invoice</h2>

          <div className="space-y-4 text-sm">
            <div>
              <p className="text-muted-foreground">Invoice</p>

              {payment.invoice ? (
                <Link
                  href={`/internal/finance/invoices/${payment.invoice.id}`}
                  className="font-medium hover:underline">
                  {payment.invoice.invoiceNo}
                </Link>
              ) : (
                <p>-</p>
              )}
            </div>

            <div>
              <p className="text-muted-foreground">Client</p>

              <p className="font-medium">
                {payment.invoice?.client?.companyName ?? "-"}
              </p>
            </div>

            <div>
              <p className="text-muted-foreground">Total Invoice</p>

              <p className="font-medium">
                {formatCurrency(
                  payment.invoice?.totalAmount ?? "0",
                  payment.invoice?.currency ?? "IDR",
                )}
              </p>
            </div>

            <div>
              <p className="text-muted-foreground">Status Invoice</p>

              <p className="font-medium">{payment.invoice?.status ?? "-"}</p>
            </div>
          </div>
        </div>

        <div className="rounded-xl border p-5">
          <h2 className="mb-4 font-semibold">Verifikasi</h2>

          <div className="space-y-4 text-sm">
            <div>
              <p className="text-muted-foreground">Status</p>

              <PaymentStatusBadge status={payment.status} />
            </div>

            <div>
              <p className="text-muted-foreground">Verified By</p>

              <div className="flex items-center gap-2">
                <UserCheck className="size-4 text-muted-foreground" />

                <p className="font-medium">{payment.verifiedBy?.name ?? "-"}</p>
              </div>
            </div>

            <div>
              <p className="text-muted-foreground">Verified At</p>

              <p className="font-medium">{formatDate(payment.verifiedAt)}</p>
            </div>

            {payment.status === "REJECTED" && (
              <>
                <div>
                  <p className="text-muted-foreground">Rejected At</p>

                  <p className="font-medium">
                    {formatDate(payment.rejectedAt)}
                  </p>
                </div>

                <div>
                  <p className="text-muted-foreground">Alasan Penolakan</p>

                  <p className="whitespace-pre-wrap font-medium">
                    {payment.rejectionReason ?? "-"}
                  </p>
                </div>
              </>
            )}
          </div>
        </div>
      </div>

      {(payment.notes || payment.proofUrl) && (
        <div className="rounded-xl border p-5">
          <h2 className="mb-4 font-semibold">Informasi Tambahan</h2>

          <div className="space-y-4 text-sm">
            {payment.notes && (
              <div>
                <p className="text-muted-foreground">Notes</p>

                <p className="whitespace-pre-wrap">{payment.notes}</p>
              </div>
            )}

            {payment.proofUrl && (
              <div>
                <p className="text-muted-foreground">Bukti Pembayaran</p>

                <a
                  href={payment.proofUrl}
                  target="_blank"
                  rel="noreferrer"
                  className="font-medium text-primary hover:underline">
                  Lihat Bukti Pembayaran
                </a>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
