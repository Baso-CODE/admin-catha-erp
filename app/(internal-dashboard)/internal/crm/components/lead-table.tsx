"use client";

import { ChevronLeft, ChevronRight, Eye, MoreHorizontal } from "lucide-react";
import Link from "next/link";
import { toast } from "sonner";

import { LeadListItem, leadService } from "@/app/services/crm/lead.service";
import { Button } from "@/components/ui/button";

import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
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
import { ConfirmDeleteDialog } from "../[id]/components/confirm-delete-dialog";
import { EditLeadModal } from "./edit-lead-modal";
import { LeadStatusBadge } from "./lead-status-badge";

interface LeadTableProps {
  leads: LeadListItem[];
  loading: boolean;
  meta: {
    total: number;
    page: number;
    limit: number;
    totalPages: number;
  };
  onPageChange: (page: number) => void;
  onRefresh: () => void | Promise<void>;
}

function formatCurrency(value?: number | string | null) {
  if (value === null || value === undefined) return "-";

  const amount = Number(value);

  if (Number.isNaN(amount)) return "-";

  return new Intl.NumberFormat("id-ID", {
    style: "currency",
    currency: "IDR",
    maximumFractionDigits: 0,
  }).format(amount);
}

export function LeadTable({
  leads,
  loading,
  meta,
  onPageChange,
  onRefresh,
}: LeadTableProps) {
  const handleDelete = async (lead: LeadListItem) => {
    try {
      const response = await leadService.remove(lead.id);

      toast.success(response.message || "Lead berhasil dihapus.");

      await onRefresh();
    } catch (error) {
      toast.error("Gagal menghapus lead", {
        description:
          error instanceof Error
            ? error.message
            : "Terjadi kesalahan pada server.",
      });

      throw error;
    }
  };

  return (
    <div className="space-y-4">
      <div className="overflow-hidden rounded-lg border bg-card">
        <Table>
          <TableHeader className="bg-muted/50">
            <TableRow>
              <TableHead>Kode</TableHead>
              <TableHead>Company / PIC</TableHead>
              <TableHead>Status</TableHead>
              <TableHead>Sales</TableHead>
              <TableHead>Estimated Value</TableHead>
              <TableHead className="text-center">Activity</TableHead>
              <TableHead className="w-16 text-right">Aksi</TableHead>
            </TableRow>
          </TableHeader>

          <TableBody>
            {loading ? (
              <TableRow>
                <TableCell
                  colSpan={7}
                  className="h-32 text-center text-sm text-muted-foreground">
                  Memuat data lead...
                </TableCell>
              </TableRow>
            ) : leads.length === 0 ? (
              <TableRow>
                <TableCell
                  colSpan={7}
                  className="h-32 text-center text-sm text-muted-foreground">
                  Belum ada lead yang ditemukan.
                </TableCell>
              </TableRow>
            ) : (
              leads.map((lead) => (
                <TableRow key={lead.id} className="hover:bg-muted/30">
                  <TableCell>
                    <Link
                      href={`/internal/crm/${lead.id}`}
                      className="font-medium text-primary hover:underline">
                      {lead.leadCode}
                    </Link>
                  </TableCell>

                  <TableCell>
                    <div className="font-medium">{lead.company}</div>
                    <div className="text-xs text-muted-foreground">
                      {lead.pic} · {lead.phone}
                    </div>
                  </TableCell>

                  <TableCell>
                    <LeadStatusBadge status={lead.status} />
                  </TableCell>

                  <TableCell>
                    <div className="font-medium">
                      {lead.assignee?.name ?? "-"}
                    </div>
                    <div className="text-xs text-muted-foreground">
                      {lead.assignee?.email ?? ""}
                    </div>
                  </TableCell>

                  <TableCell className="font-medium">
                    {formatCurrency(lead.estimatedValue)}
                  </TableCell>

                  <TableCell className="text-center">
                    {lead._count?.activities ?? 0}
                  </TableCell>

                  <TableCell className="text-right">
                    <DropdownMenu>
                      <DropdownMenuTrigger
                        render={
                          <Button
                            variant="ghost"
                            size="icon"
                            className="size-8">
                            <MoreHorizontal className="size-4" />
                          </Button>
                        }
                      />

                      <DropdownMenuContent align="end">
                        <DropdownMenuItem
                          render={
                            <Link href={`/internal/crm/${lead.id}`}>
                              <Eye className="mr-2 size-4" />
                              Lihat Detail
                            </Link>
                          }
                        />

                        <EditLeadModal lead={lead} onSuccess={onRefresh} />

                        <DropdownMenuSeparator />

                        <DropdownMenuSeparator />

                        <ConfirmDeleteDialog
                          title="Hapus lead?"
                          description={`Lead "${lead.company}" akan dihapus permanen. Tindakan ini tidak dapat dibatalkan.`}
                          triggerLabel="Hapus Lead"
                          loadingLabel="Menghapus Lead..."
                          onConfirm={() => handleDelete(lead)}
                        />
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
        <p className="text-sm text-muted-foreground">Total {meta.total} lead</p>

        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            size="sm"
            disabled={meta.page <= 1 || loading}
            onClick={() => onPageChange(meta.page - 1)}>
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
            onClick={() => onPageChange(meta.page + 1)}>
            Selanjutnya
            <ChevronRight className="ml-1 size-4" />
          </Button>
        </div>
      </div>
    </div>
  );
}
