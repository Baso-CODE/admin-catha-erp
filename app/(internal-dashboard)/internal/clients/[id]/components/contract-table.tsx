"use client";

import { Eye, MoreHorizontal, Pencil, Trash2 } from "lucide-react";
import { useCallback, useEffect, useState } from "react";
import { toast } from "sonner";

import {
  ContractItem,
  ContractStatus,
  contractService,
} from "@/app/services/contract.service";

import { PermissionGuard } from "@/components/shared/permission-guard";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { ConfirmDeleteDialog } from "../../../crm/[id]/components/confirm-delete-dialog";
import { ContractDetailModal } from "./contract-detail-modal";
import { CreateContractModal } from "./create-contract-modal";
import { EditContractModal } from "./edit-contract-modal";

interface ContractTableProps {
  clientId: string;
  sourceLeadId?: string | null;
  permissions: string[];
  onRefreshClient?: () => void | Promise<void>;
}

export function ContractTable({
  clientId,
  sourceLeadId,
  permissions,
  onRefreshClient,
}: ContractTableProps) {
  const [contracts, setContracts] = useState<ContractItem[]>([]);
  const [loading, setLoading] = useState(true);

  const [search, setSearch] = useState("");
  const [debouncedSearch, setDebouncedSearch] = useState("");
  const [status, setStatus] = useState<ContractStatus | "ALL">("ALL");
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

  const loadContracts = useCallback(async () => {
    try {
      setLoading(true);

      const response = await contractService.getContracts({
        clientId,
        search: debouncedSearch || undefined,
        status: status === "ALL" ? undefined : status,
        page,
        limit: 10,
      });

      if (response.success) {
        setContracts(response.data);
        setMeta(response.meta);
      }
    } catch (error) {
      toast.error("Gagal memuat contract", {
        description:
          error instanceof Error
            ? error.message
            : "Terjadi kesalahan pada server.",
      });
    } finally {
      setLoading(false);
    }
  }, [clientId, debouncedSearch, status, page]);

  useEffect(() => {
    void loadContracts();
  }, [loadContracts]);

  const handleDelete = async (contract: ContractItem) => {
    const response = await contractService.deleteContract(contract.id);

    if (response.success) {
      toast.success("Contract berhasil dihapus", {
        description: `"${contract.contractNo}" berhasil dihapus.`,
      });

      await loadContracts();
      await onRefreshClient?.();
    }
  };

  const formatCurrency = (value: string | number, currency = "IDR") => {
    return new Intl.NumberFormat("id-ID", {
      style: "currency",
      currency,
      maximumFractionDigits: 0,
    }).format(Number(value));
  };

  const formatDate = (value: string) => {
    return new Intl.DateTimeFormat("id-ID", {
      day: "2-digit",
      month: "short",
      year: "numeric",
    }).format(new Date(value));
  };

  return (
    <div className="space-y-4">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex flex-col gap-3 sm:flex-row">
          <Input
            placeholder="Cari contract..."
            value={search}
            onChange={(event) => setSearch(event.target.value)}
            className="sm:w-72"
          />

          <Select
            value={status}
            onValueChange={(value) => {
              setStatus(value as ContractStatus | "ALL");
              setPage(1);
            }}>
            <SelectTrigger className="w-full sm:w-44">
              <SelectValue />
            </SelectTrigger>

            <SelectContent>
              <SelectItem value="ALL">Semua Status</SelectItem>
              <SelectItem value="DRAFT">Draft</SelectItem>
              <SelectItem value="ACTIVE">Active</SelectItem>
              <SelectItem value="EXPIRED">Expired</SelectItem>
              <SelectItem value="TERMINATED">Terminated</SelectItem>
            </SelectContent>
          </Select>
        </div>

        <PermissionGuard permissions={permissions} required="contract.create">
          <CreateContractModal
            clientId={clientId}
            sourceLeadId={sourceLeadId}
            onSuccess={async () => {
              await loadContracts();
              await onRefreshClient?.();
            }}
          />
        </PermissionGuard>
      </div>

      <div className="overflow-hidden rounded-xl border">
        {loading ? (
          <div className="flex min-h-52 items-center justify-center text-sm text-muted-foreground">
            Memuat contract...
          </div>
        ) : contracts.length === 0 ? (
          <div className="flex min-h-52 items-center justify-center text-sm text-muted-foreground">
            Belum ada contract.
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="border-b bg-muted/40">
                <tr>
                  <th className="px-4 py-3 text-left font-medium">Contract</th>
                  <th className="px-4 py-3 text-left font-medium">Type</th>
                  <th className="px-4 py-3 text-left font-medium">Periode</th>
                  <th className="px-4 py-3 text-left font-medium">Nilai</th>
                  <th className="px-4 py-3 text-left font-medium">Status</th>
                  <th className="w-16 px-4 py-3 text-right font-medium">
                    Action
                  </th>
                </tr>
              </thead>

              <tbody>
                {contracts.map((contract) => (
                  <tr
                    key={contract.id}
                    className="border-b last:border-b-0 hover:bg-muted/30">
                    <td className="px-4 py-3">
                      <div className="space-y-0.5">
                        <p className="font-medium">{contract.title}</p>
                        <p className="text-xs text-muted-foreground">
                          {contract.contractNo}
                        </p>
                      </div>
                    </td>

                    <td className="px-4 py-3">
                      {contract.contractType ?? "-"}
                    </td>

                    <td className="px-4 py-3">
                      <div className="space-y-0.5">
                        <p>{formatDate(contract.startDate)}</p>
                        <p className="text-xs text-muted-foreground">
                          s/d {formatDate(contract.endDate)}
                        </p>
                      </div>
                    </td>

                    <td className="px-4 py-3">
                      {formatCurrency(contract.value, contract.currency)}
                    </td>

                    <td className="px-4 py-3">
                      <span className="rounded-full bg-muted px-2.5 py-1 text-xs font-medium">
                        {contract.status}
                      </span>
                    </td>

                    <td className="px-4 py-3 text-right">
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button
                            variant="ghost"
                            size="icon"
                            className="size-8">
                            <MoreHorizontal className="size-4" />
                          </Button>
                        </DropdownMenuTrigger>

                        <DropdownMenuContent align="end" className="min-w-44">
                          <ContractDetailModal
                            contract={contract}
                            trigger={
                              <DropdownMenuItem
                                onSelect={(event) => event.preventDefault()}>
                                <Eye className="mr-2 size-4" />
                                Lihat Detail
                              </DropdownMenuItem>
                            }
                          />

                          <PermissionGuard
                            permissions={permissions}
                            required="contract.update">
                            <EditContractModal
                              contract={contract}
                              sourceLeadId={sourceLeadId}
                              onSuccess={async () => {
                                await loadContracts();
                                await onRefreshClient?.();
                              }}
                              trigger={
                                <DropdownMenuItem
                                  onSelect={(event) => event.preventDefault()}>
                                  <Pencil className="mr-2 size-4" />
                                  Edit Contract
                                </DropdownMenuItem>
                              }
                            />
                          </PermissionGuard>

                          <PermissionGuard
                            permissions={permissions}
                            required="contract.delete">
                            <DropdownMenuSeparator />

                            <ConfirmDeleteDialog
                              title="Hapus contract?"
                              description={`Contract "${contract.contractNo}" akan dihapus permanen.`}
                              triggerLabel="Hapus Contract"
                              loadingLabel="Menghapus Contract..."
                              onConfirm={() => handleDelete(contract)}
                              trigger={
                                <DropdownMenuItem
                                  onSelect={(event) => event.preventDefault()}
                                  className="text-destructive focus:text-destructive">
                                  <Trash2 className="mr-2 size-4" />
                                  Hapus Contract
                                </DropdownMenuItem>
                              }
                            />
                          </PermissionGuard>
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      <div className="flex items-center justify-between">
        <p className="text-sm text-muted-foreground">
          Total {meta.total} contract
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
