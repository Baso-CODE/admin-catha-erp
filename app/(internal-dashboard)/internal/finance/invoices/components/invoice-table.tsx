"use client";

import { Ban, Eye, MoreHorizontal, Pencil, Send, Trash2 } from "lucide-react";
import Link from "next/link";
import { toast } from "sonner";

import { Invoice, invoiceService } from "@/app/services/invoice.service";
import { PermissionGuard } from "@/components/shared/permission-guard";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { ConfirmDeleteDialog } from "../../../crm/[id]/components/confirm-delete-dialog";
import { InvoiceStatusBadge } from "./invoice-status-badge";

interface InvoiceTableProps {
  invoices: Invoice[];
  permissions: string[];
  onRefresh?: () => void | Promise<void>;
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

export function InvoiceTable({
  invoices,
  permissions,
  onRefresh,
}: InvoiceTableProps) {
  const handleSend = async (invoice: Invoice) => {
    try {
      await invoiceService.send(invoice.id);

      toast.success("Invoice berhasil dikirim", {
        description: invoice.invoiceNo,
      });

      await onRefresh?.();
    } catch (error) {
      toast.error("Gagal mengirim invoice", {
        description:
          error instanceof Error
            ? error.message
            : "Terjadi kesalahan pada server.",
      });
    }
  };

  const handleCancel = async (invoice: Invoice) => {
    try {
      await invoiceService.cancel(invoice.id);

      toast.success("Invoice berhasil dibatalkan", {
        description: invoice.invoiceNo,
      });

      await onRefresh?.();
    } catch (error) {
      toast.error("Gagal membatalkan invoice", {
        description:
          error instanceof Error
            ? error.message
            : "Terjadi kesalahan pada server.",
      });
    }
  };

  const handleDelete = async (invoice: Invoice) => {
    await invoiceService.remove(invoice.id);

    toast.success("Invoice berhasil dihapus", {
      description: invoice.invoiceNo,
    });

    await onRefresh?.();
  };

  return (
    <div className="overflow-hidden rounded-xl border">
      <div className="overflow-x-auto">
        <table className="w-full text-sm">
          <thead className="border-b bg-muted/40">
            <tr>
              <th className="px-4 py-3 text-left font-medium">Invoice</th>
              <th className="px-4 py-3 text-left font-medium">Client</th>
              <th className="px-4 py-3 text-left font-medium">Tanggal</th>
              <th className="px-4 py-3 text-left font-medium">Due Date</th>
              <th className="px-4 py-3 text-right font-medium">Total</th>
              <th className="px-4 py-3 text-right font-medium">Outstanding</th>
              <th className="px-4 py-3 text-left font-medium">Status</th>
              <th className="w-16 px-4 py-3 text-right font-medium">Action</th>
            </tr>
          </thead>

          <tbody>
            {invoices.map((invoice) => (
              <tr
                key={invoice.id}
                className="border-b transition-colors last:border-b-0 hover:bg-muted/30">
                <td className="px-4 py-3">
                  <div className="space-y-0.5">
                    <Link
                      href={`/internal/finance/invoices/${invoice.id}`}
                      className="font-medium hover:underline">
                      {invoice.invoiceNo}
                    </Link>

                    {invoice.project?.name && (
                      <p className="text-xs text-muted-foreground">
                        {invoice.project.name}
                      </p>
                    )}
                  </div>
                </td>

                <td className="px-4 py-3">
                  <div className="space-y-0.5">
                    <p>{invoice.client?.companyName ?? "-"}</p>
                    <p className="text-xs text-muted-foreground">
                      {invoice.client?.clientCode ?? "-"}
                    </p>
                  </div>
                </td>

                <td className="px-4 py-3">{formatDate(invoice.invoiceDate)}</td>

                <td className="px-4 py-3">{formatDate(invoice.dueDate)}</td>

                <td className="px-4 py-3 text-right font-medium">
                  {formatCurrency(invoice.totalAmount, invoice.currency)}
                </td>

                <td className="px-4 py-3 text-right">
                  {formatCurrency(
                    invoice.outstandingAmount ?? invoice.totalAmount,
                    invoice.currency,
                  )}
                </td>

                <td className="px-4 py-3">
                  <InvoiceStatusBadge
                    status={invoice.status}
                    isOverdue={invoice.isOverdue}
                  />
                </td>

                <td className="px-4 py-3 text-right">
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button variant="ghost" size="icon" className="size-8">
                        <MoreHorizontal className="size-4" />
                        <span className="sr-only">Invoice actions</span>
                      </Button>
                    </DropdownMenuTrigger>

                    <DropdownMenuContent align="end" className="min-w-48">
                      <DropdownMenuItem asChild>
                        <Link href={`/internal/finance/invoices/${invoice.id}`}>
                          <Eye className="mr-2 size-4" />
                          Lihat Detail
                        </Link>
                      </DropdownMenuItem>

                      {invoice.status === "DRAFT" && (
                        <PermissionGuard
                          permissions={permissions}
                          required="invoice.update">
                          <DropdownMenuItem asChild>
                            <Link
                              href={`/internal/finance/invoices/${invoice.id}/edit`}>
                              <Pencil className="mr-2 size-4" />
                              Edit Invoice
                            </Link>
                          </DropdownMenuItem>
                        </PermissionGuard>
                      )}

                      {invoice.status === "DRAFT" && (
                        <PermissionGuard
                          permissions={permissions}
                          required="invoice.update">
                          <DropdownMenuItem
                            onSelect={() => void handleSend(invoice)}>
                            <Send className="mr-2 size-4" />
                            Kirim Invoice
                          </DropdownMenuItem>
                        </PermissionGuard>
                      )}

                      {["DRAFT", "SENT", "OVERDUE"].includes(
                        invoice.status,
                      ) && (
                        <PermissionGuard
                          permissions={permissions}
                          required="invoice.update">
                          <DropdownMenuItem
                            onSelect={() => void handleCancel(invoice)}>
                            <Ban className="mr-2 size-4" />
                            Batalkan Invoice
                          </DropdownMenuItem>
                        </PermissionGuard>
                      )}

                      {invoice.status === "DRAFT" && (
                        <PermissionGuard
                          permissions={permissions}
                          required="invoice.delete">
                          <DropdownMenuSeparator />

                          <ConfirmDeleteDialog
                            title="Hapus invoice?"
                            description={`Invoice "${invoice.invoiceNo}" akan dihapus permanen.`}
                            triggerLabel="Hapus Invoice"
                            loadingLabel="Menghapus Invoice..."
                            onConfirm={() => handleDelete(invoice)}
                            trigger={
                              <DropdownMenuItem
                                onSelect={(event) => event.preventDefault()}
                                className="text-destructive focus:text-destructive">
                                <Trash2 className="mr-2 size-4" />
                                Hapus Invoice
                              </DropdownMenuItem>
                            }
                          />
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
