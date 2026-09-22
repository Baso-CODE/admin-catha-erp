"use client";

import {
  ChevronLeft,
  ChevronRight,
  Eye,
  FileText,
  MoreHorizontal,
} from "lucide-react";
import { useCallback, useEffect, useState } from "react";
import { toast } from "sonner";

import {
  ProposalItem,
  proposalService,
} from "@/app/services/crm/proposal.service";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
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

import { ConfirmDeleteDialog } from "./confirm-delete-dialog";
import { CreateProposalModal } from "./create-proposal-modal";
import { EditProposalModal } from "./edit-proposal-modal";

interface ProposalTableProps {
  leadId: string;
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

function formatDate(value: string) {
  return new Intl.DateTimeFormat("id-ID", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  }).format(new Date(value));
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

export function ProposalTable({ leadId, onRefreshLead }: ProposalTableProps) {
  const [proposals, setProposals] = useState<ProposalItem[]>([]);
  const [loading, setLoading] = useState(true);

  const [page, setPage] = useState(1);

  const [meta, setMeta] = useState({
    total: 0,
    page: 1,
    limit: 10,
    totalPages: 1,
  });

  const loadProposals = useCallback(async () => {
    try {
      setLoading(true);

      const response = await proposalService.getAll({
        leadId,
        page,
        limit: 10,
      });

      if (response.success) {
        setProposals(response.data);
        setMeta(response.meta);
      }
    } catch (error) {
      toast.error("Gagal memuat proposal", {
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
    void loadProposals();
  }, [loadProposals]);

  const handleRefresh = async () => {
    await loadProposals();
    await onRefreshLead?.();
  };

  const handleDelete = async (proposal: ProposalItem) => {
    try {
      const response = await proposalService.remove(proposal.id);

      toast.success(response.message || "Proposal berhasil dihapus.");

      await handleRefresh();
    } catch (error) {
      toast.error("Gagal menghapus proposal", {
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
          <CardTitle className="text-base font-semibold">Proposal</CardTitle>

          <p className="mt-1 text-xs text-muted-foreground">
            Kelola proposal yang dikirimkan kepada lead.
          </p>
        </div>

        <CreateProposalModal leadId={leadId} onSuccess={handleRefresh} />
      </CardHeader>

      <CardContent className="space-y-4">
        <div className="overflow-hidden rounded-lg border">
          <Table>
            <TableHeader className="bg-muted/50">
              <TableRow>
                <TableHead>Proposal No</TableHead>
                <TableHead>Version</TableHead>
                <TableHead>Subject</TableHead>
                <TableHead>Amount</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Valid Until</TableHead>
                <TableHead className="w-16 text-right">Aksi</TableHead>
              </TableRow>
            </TableHeader>

            <TableBody>
              {loading ? (
                <TableRow>
                  <TableCell
                    colSpan={7}
                    className="h-32 text-center text-sm text-muted-foreground">
                    Memuat proposal...
                  </TableCell>
                </TableRow>
              ) : proposals.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={7} className="h-32 text-center">
                    <FileText className="mx-auto mb-3 size-8 text-muted-foreground" />

                    <p className="text-sm font-medium">Belum ada proposal</p>

                    <p className="mt-1 text-xs text-muted-foreground">
                      Buat proposal pertama untuk lead ini.
                    </p>
                  </TableCell>
                </TableRow>
              ) : (
                proposals.map((proposal) => (
                  <TableRow key={proposal.id}>
                    <TableCell className="font-medium">
                      {proposal.proposalNo}
                    </TableCell>

                    <TableCell>{proposal.version}</TableCell>

                    <TableCell>{proposal.subject}</TableCell>

                    <TableCell className="font-medium">
                      {formatCurrency(proposal.amount)}
                    </TableCell>

                    <TableCell>{getStatusBadge(proposal.status)}</TableCell>

                    <TableCell>{formatDate(proposal.validUntil)}</TableCell>

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
                          <DropdownMenuItem>
                            <Eye className="mr-2 size-4" />
                            Lihat Detail
                          </DropdownMenuItem>

                          <EditProposalModal
                            proposal={proposal}
                            onSuccess={handleRefresh}
                          />

                          <DropdownMenuSeparator />

                          <ConfirmDeleteDialog
                            title="Hapus proposal?"
                            description={`Proposal "${proposal.proposalNo}" akan dihapus permanen.`}
                            triggerLabel="Hapus Proposal"
                            loadingLabel="Menghapus Proposal..."
                            onConfirm={() => handleDelete(proposal)}
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
          <p className="text-sm text-muted-foreground">
            Total {meta.total} proposal
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
