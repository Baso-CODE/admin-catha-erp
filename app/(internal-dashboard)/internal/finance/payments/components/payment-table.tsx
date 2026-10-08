"use client";

import {
  CheckCircle2,
  Eye,
  MoreHorizontal,
  Pencil,
  XCircle,
} from "lucide-react";
import Link from "next/link";

import { Payment } from "@/app/services/payment.service";
import { PermissionGuard } from "@/components/shared/permission-guard";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { PaymentStatusBadge } from "./payment-status-badge";

interface PaymentTableProps {
  payments: Payment[];
  permissions: string[];
}

function formatCurrency(value: string | number, currency = "IDR") {
  return new Intl.NumberFormat("id-ID", {
    style: "currency",
    currency,
    maximumFractionDigits: 2,
  }).format(Number(value));
}

function formatDate(value: string) {
  return new Intl.DateTimeFormat("id-ID", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  }).format(new Date(value));
}

function formatPaymentMethod(value: string) {
  return value
    .split("_")
    .map((word) => word.charAt(0) + word.slice(1).toLowerCase())
    .join(" ");
}

export function PaymentTable({ payments, permissions }: PaymentTableProps) {
  return (
    <div className="overflow-hidden rounded-xl border">
      <div className="overflow-x-auto">
        <table className="w-full text-sm">
          <thead className="border-b bg-muted/40">
            <tr>
              <th className="px-4 py-3 text-left font-medium">Payment</th>
              <th className="px-4 py-3 text-left font-medium">Invoice</th>
              <th className="px-4 py-3 text-left font-medium">Client</th>
              <th className="px-4 py-3 text-left font-medium">Tanggal</th>
              <th className="px-4 py-3 text-left font-medium">Method</th>
              <th className="px-4 py-3 text-right font-medium">Amount</th>
              <th className="px-4 py-3 text-left font-medium">Status</th>
              <th className="w-16 px-4 py-3 text-right font-medium">Action</th>
            </tr>
          </thead>

          <tbody>
            {payments.map((payment) => (
              <tr
                key={payment.id}
                className="border-b transition-colors last:border-b-0 hover:bg-muted/30">
                <td className="px-4 py-3">
                  <Link
                    href={`/internal/finance/payments/${payment.id}`}
                    className="font-medium hover:underline">
                    {payment.paymentNo}
                  </Link>

                  {payment.reference && (
                    <p className="text-xs text-muted-foreground">
                      Ref: {payment.reference}
                    </p>
                  )}
                </td>

                <td className="px-4 py-3">
                  {payment.invoice?.invoiceNo ?? "-"}
                </td>

                <td className="px-4 py-3">
                  <div>
                    <p>{payment.invoice?.client?.companyName ?? "-"}</p>

                    <p className="text-xs text-muted-foreground">
                      {payment.invoice?.client?.clientCode ?? "-"}
                    </p>
                  </div>
                </td>

                <td className="px-4 py-3">{formatDate(payment.paymentDate)}</td>

                <td className="px-4 py-3">
                  {formatPaymentMethod(payment.paymentMethod)}
                </td>

                <td className="px-4 py-3 text-right font-medium">
                  {formatCurrency(
                    payment.amountPaid,
                    payment.invoice?.currency ?? "IDR",
                  )}
                </td>

                <td className="px-4 py-3">
                  <PaymentStatusBadge status={payment.status} />
                </td>

                <td className="px-4 py-3 text-right">
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button variant="ghost" size="icon" className="size-8">
                        <MoreHorizontal className="size-4" />
                      </Button>
                    </DropdownMenuTrigger>

                    <DropdownMenuContent align="end" className="min-w-48">
                      <DropdownMenuItem asChild>
                        <Link href={`/internal/finance/payments/${payment.id}`}>
                          <Eye className="mr-2 size-4" />
                          Lihat Detail
                        </Link>
                      </DropdownMenuItem>

                      {payment.status === "PENDING" && (
                        <PermissionGuard
                          permissions={permissions}
                          required="payment.update">
                          <DropdownMenuItem asChild>
                            <Link
                              href={`/internal/finance/payments/${payment.id}/edit`}>
                              <Pencil className="mr-2 size-4" />
                              Edit Payment
                            </Link>
                          </DropdownMenuItem>
                        </PermissionGuard>
                      )}

                      {payment.status === "PENDING" && (
                        <PermissionGuard
                          permissions={permissions}
                          required="payment.verify">
                          <DropdownMenuItem asChild>
                            <Link
                              href={`/internal/finance/payments/${payment.id}`}>
                              <CheckCircle2 className="mr-2 size-4" />
                              Verifikasi
                            </Link>
                          </DropdownMenuItem>
                        </PermissionGuard>
                      )}

                      {payment.status === "PENDING" && (
                        <PermissionGuard
                          permissions={permissions}
                          required="payment.reject">
                          <DropdownMenuItem asChild>
                            <Link
                              href={`/internal/finance/payments/${payment.id}`}>
                              <XCircle className="mr-2 size-4" />
                              Tolak
                            </Link>
                          </DropdownMenuItem>
                        </PermissionGuard>
                      )}
                    </DropdownMenuContent>
                  </DropdownMenu>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
