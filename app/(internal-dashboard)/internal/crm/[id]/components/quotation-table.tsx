"use client";

import {
  ChevronLeft,
  ChevronRight,
  FileText,
  MoreHorizontal,
} from "lucide-react";
import { useCallback, useEffect, useState } from "react";
import { toast } from "sonner";

import {
  QuotationItem,
  quotationService,
} from "@/app/services/crm/quotation.service";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";

import { PermissionGuard } from "@/components/shared/permission-guard";
import { ConfirmDeleteDialog } from "./confirm-delete-dialog";
import { CreateQuotationModal } from "./create-quotation-modal";
import { EditQuotationModal } from "./edit-quotation-modal";
import { QuotationDetailModal } from "./quotation-detail-modal";

interface QuotationTableProps {
  leadId: string;
  permissions: string[];
  onRefreshLead?: () => void | Promise<void>;
}

function formatCurrency(value: number | string) {
  const amount = Number(value);

  if (Number.isNaN(amount)) return "-";

  return new Intl.NumberFormat("id-ID", {
    style: "currency",
    currency: "IDR",
    maximumFractionDigits: 0,
  }).format(amount);
}

function getStatusBadge(status: string) {
  switch (status) {
    case "APPROVED":
      return (
        <Badge
          variant="outline"
          className="border-emerald-500/20 bg-emerald-500/10 text-emerald-600 dark:text-emerald-400">
          Approved
        </Badge>
      );

    case "SENT":
      return (
        <Badge
          variant="outline"
          className="border-blue-500/20 bg-blue-500/10 text-blue-600 dark:text-blue-400">
          Sent
        </Badge>
      );

    case "REJECTED":
      return (
        <Badge
          variant="outline"
          className="border-destructive/20 bg-destructive/10 text-destructive">
          Rejected
        </Badge>
      );

    case "EXPIRED":
      return (
        <Badge
          variant="outline"
          className="border-orange-500/20 bg-orange-500/10 text-orange-600 dark:text-orange-400">
          Expired
        </Badge>
      );

    case "WITHDRAWN":
      return (
        <Badge
          variant="outline"
          className="border-muted-foreground/20 bg-muted text-muted-foreground">
          Withdrawn
        </Badge>
      );

    default:
      return <Badge variant="outline">Draft</Badge>;
  }
}

export function QuotationTable({
  leadId,
  permissions,
  onRefreshLead,
}: QuotationTableProps) {
  const [quotations, setQuotations] = useState<QuotationItem[]>([]);
  const [loading, setLoading] = useState(true);

  const [page, setPage] = useState(1);

  const [meta, setMeta] = useState({
    total: 0,
    page: 1,
    limit: 10,
    totalPages: 1,
  });

  const loadQuotations = useCallback(async () => {
    try {
      setLoading(true);

      const response = await quotationService.getAll({
        leadId,
        page,
        limit: 10,
      });

      if (response.success) {
        setQuotations(response.data);
        setMeta(response.meta);
      }
    } catch (error) {
      toast.error("Gagal memuat quotation", {
        description:
          error instanceof Error
            ? error.message
            : "Terjadi kesalahan pada server.",
      });
    } finally {
      setLoading(false);
    }
  }, [leadId, page]);

  useEffect(() => {
    void loadQuotations();
  }, [loadQuotations]);

  const handleRefresh = async () => {
    await loadQuotations();
    await onRefreshLead?.();
  };

  const handleDelete = async (quotation: QuotationItem) => {
    try {
      const response = await quotationService.remove(quotation.id);

      toast.success(response.message || "Quotation berhasil dihapus.");

      await handleRefresh();
    } catch (error) {
      toast.error("Gagal menghapus quotation", {
        description:
          error instanceof Error
            ? error.message
            : "Terjadi kesalahan pada server.",
      });

      throw error;
    }
  };

  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between gap-4">
        <div>
          <CardTitle className="text-base font-semibold">Quotation</CardTitle>

          <p className="mt-1 text-xs text-muted-foreground">
            Kelola quotation untuk lead ini.
          </p>
        </div>
        <PermissionGuard
          permissions={permissions}
          required="crm.quotation.create">
          <CreateQuotationModal leadId={leadId} onSuccess={handleRefresh} />
        </PermissionGuard>
      </CardHeader>

      <CardContent className="space-y-4">
        <div className="overflow-hidden rounded-lg border">
          <Table>
            <TableHeader className="bg-muted/50">
              <TableRow>
                <TableHead>Quotation No</TableHead>
                <TableHead>Version</TableHead>
                <TableHead>Amount</TableHead>
                <TableHead>Status</TableHead>
                <TableHead className="text-center">Contract</TableHead>
                <TableHead className="w-16 text-right">Aksi</TableHead>
              </TableRow>
            </TableHeader>

            <TableBody>
              {loading ? (
                <TableRow>
                  <TableCell
                    colSpan={6}
                    className="h-32 text-center text-sm text-muted-foreground">
                    Memuat quotation...
                  </TableCell>
                </TableRow>
              ) : quotations.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={6} className="h-32 text-center">
                    <FileText className="mx-auto mb-3 size-8 text-muted-foreground" />

                    <p className="text-sm font-medium">Belum ada quotation</p>

                    <p className="mt-1 text-xs text-muted-foreground">
                      Buat quotation pertama untuk lead ini.
                    </p>
                  </TableCell>
                </TableRow>
              ) : (
                quotations.map((quotation) => (
                  <TableRow key={quotation.id}>
                    <TableCell className="font-medium">
                      {quotation.quotationNo}
                    </TableCell>

                    <TableCell>{quotation.version}</TableCell>

                    <TableCell className="font-medium">
                      {formatCurrency(quotation.amount)}
                    </TableCell>

                    <TableCell>{getStatusBadge(quotation.status)}</TableCell>

                    <TableCell className="text-center">
                      {quotation._count?.contracts ?? 0}
                    </TableCell>

                    <TableCell className="text-right">
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button
                            variant="ghost"
                            size="icon"
                            className="size-8">
                            <MoreHorizontal className="size-4" />
                          </Button>
                        </DropdownMenuTrigger>

                        <DropdownMenuContent align="end">
                          <QuotationDetailModal quotation={quotation} />

                          <PermissionGuard
                            permissions={permissions}
                            required="crm.quotation.update">
                            <EditQuotationModal
                              quotation={quotation}
                              onSuccess={handleRefresh}
                            />
                          </PermissionGuard>

                          <PermissionGuard
                            permissions={permissions}
                            required="crm.quotation.delete">
                            <DropdownMenuSeparator />

                            <ConfirmDeleteDialog
                              title="Hapus quotation?"
                              description={`Quotation "${quotation.quotationNo}" akan dihapus permanen.`}
                              triggerLabel="Hapus Quotation"
                              loadingLabel="Menghapus Quotation..."
                              onConfirm={() => handleDelete(quotation)}
                            />
                          </PermissionGuard>
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </div>

        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <p className="text-sm text-muted-foreground">
            Total {meta.total} quotation
          </p>

          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              size="sm"
              disabled={meta.page <= 1 || loading}
              onClick={() => setPage(meta.page - 1)}>
              <ChevronLeft className="mr-1 size-4" />
              Sebelumnya
            </Button>

            <span className="px-2 text-sm text-muted-foreground">
              Halaman {meta.page} dari {Math.max(meta.totalPages, 1)}
            </span>

            <Button
              variant="outline"
              size="sm"
              disabled={meta.page >= meta.totalPages || loading}
              onClick={() => setPage(meta.page + 1)}>
              Selanjutnya
              <ChevronRight className="ml-1 size-4" />
            </Button>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
