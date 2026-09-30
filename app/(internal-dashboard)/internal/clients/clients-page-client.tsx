"use client";

import { useCallback, useEffect, useState } from "react";
import { toast } from "sonner";

import {
  ClientItem,
  ClientStatus,
  clientService,
} from "@/app/services/client.service";
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
import { ClientTable } from "./components/client-table";
import { CreateClientModal } from "./components/create-client-modal";

interface ClientsPageClientProps {
  permissions: string[];
}

export default function ClientsPageClient({
  permissions,
}: ClientsPageClientProps) {
  const [clients, setClients] = useState<ClientItem[]>([]);
  const [loading, setLoading] = useState(true);

  const [search, setSearch] = useState("");
  const [debouncedSearch, setDebouncedSearch] = useState("");

  const [status, setStatus] = useState<ClientStatus | "ALL">("ALL");

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

  const loadClients = useCallback(async () => {
    try {
      setLoading(true);

      const response = await clientService.getClients({
        search: debouncedSearch || undefined,
        status: status === "ALL" ? undefined : status,
        page,
        limit: 10,
      });

      if (response.success) {
        setClients(response.data);
        setMeta(response.meta);
      }
    } catch (error) {
      toast.error("Gagal memuat client", {
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
    void loadClients();
  }, [loadClients]);

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-semibold">Client Management</h1>

          <p className="text-sm text-muted-foreground">
            Kelola data client, account manager, contact person, dan contract.
          </p>
        </div>

        <PermissionGuard permissions={permissions} required="client.create">
          <CreateClientModal onSuccess={loadClients} />
        </PermissionGuard>
      </div>

      <div className="flex flex-col gap-3 sm:flex-row">
        <Input
          placeholder="Cari client..."
          value={search}
          onChange={(event) => setSearch(event.target.value)}
          className="sm:max-w-sm"
        />

        <Select
          value={status}
          onValueChange={(value) => {
            setStatus(value as ClientStatus | "ALL");
            setPage(1);
          }}>
          <SelectTrigger className="w-full sm:w-45">
            <SelectValue />
          </SelectTrigger>

          <SelectContent>
            <SelectItem value="ALL">Semua Status</SelectItem>

            <SelectItem value="ACTIVE">Active</SelectItem>

            <SelectItem value="INACTIVE">Inactive</SelectItem>
          </SelectContent>
        </Select>
      </div>

      <div className="rounded-xl border">
        {loading ? (
          <div className="flex min-h-60 items-center justify-center text-sm text-muted-foreground">
            Memuat data client...
          </div>
        ) : clients.length === 0 ? (
          <div className="flex min-h-60 items-center justify-center text-sm text-muted-foreground">
            Belum ada data client.
          </div>
        ) : (
          <ClientTable
            clients={clients}
            permissions={permissions}
            loading={loading}
            onRefresh={loadClients}
          />
        )}
      </div>

      <div className="flex items-center justify-between">
        <p className="text-sm text-muted-foreground">
          Total {meta.total} client
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
