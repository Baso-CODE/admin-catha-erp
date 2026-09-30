"use client";

import { Eye, MoreHorizontal, Pencil, Trash2 } from "lucide-react";
import Link from "next/link";

import { ClientItem, clientService } from "@/app/services/client.service";
import { PermissionGuard } from "@/components/shared/permission-guard";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { toast } from "sonner";
import { ConfirmDeleteDialog } from "../../crm/[id]/components/confirm-delete-dialog";
import { ClientDetailModal } from "./client-detail-modal";
import { ClientStatusBadge } from "./client-status-badge";
import { EditClientModal } from "./edit-client-modal";

interface ClientTableProps {
  clients: ClientItem[];
  permissions: string[];
  loading?: boolean;
  onRefresh?: () => void | Promise<void>;
}

export function ClientTable({
  clients,
  permissions,
  loading = false,
  onRefresh,
}: ClientTableProps) {
  const handleDelete = async (client: ClientItem) => {
    const response = await clientService.deleteClient(client.id);

    if (response.success) {
      toast.success("Client berhasil dihapus", {
        description: `Client "${client.companyName}" berhasil dihapus.`,
      });

      await onRefresh?.();
    }
  };
  if (loading) {
    return (
      <div className="flex min-h-60 items-center justify-center rounded-xl border text-sm text-muted-foreground">
        Memuat data client...
      </div>
    );
  }

  if (clients.length === 0) {
    return (
      <div className="flex min-h-60 items-center justify-center rounded-xl border text-sm text-muted-foreground">
        Belum ada data client.
      </div>
    );
  }

  return (
    <div className="overflow-hidden rounded-xl border">
      <div className="overflow-x-auto">
        <table className="w-full text-sm">
          <thead className="border-b bg-muted/40">
            <tr>
              <th className="px-4 py-3 text-left font-medium">Client</th>

              <th className="px-4 py-3 text-left font-medium">Industry</th>

              <th className="px-4 py-3 text-left font-medium">Business Type</th>

              <th className="px-4 py-3 text-left font-medium">
                Account Manager
              </th>

              <th className="px-4 py-3 text-left font-medium">Status</th>

              <th className="px-4 py-3 text-center font-medium">Contacts</th>

              <th className="px-4 py-3 text-center font-medium">Contracts</th>

              <th className="w-16 px-4 py-3 text-right font-medium">Action</th>
            </tr>
          </thead>

          <tbody>
            {clients.map((client) => (
              <tr
                key={client.id}
                className="border-b transition-colors last:border-b-0 hover:bg-muted/30">
                <td className="px-4 py-3">
                  <div className="space-y-0.5">
                    <Link
                      href={`/internal/clients/${client.id}`}
                      className="font-medium hover:underline">
                      {client.companyName}
                    </Link>

                    <p className="text-xs text-muted-foreground">
                      {client.clientCode}
                    </p>
                  </div>
                </td>

                <td className="px-4 py-3">{client.industry ?? "-"}</td>

                <td className="px-4 py-3">{client.businessType ?? "-"}</td>

                <td className="px-4 py-3">
                  <div className="space-y-0.5">
                    <p>{client.accountManager?.name ?? "-"}</p>

                    {client.accountManager?.email && (
                      <p className="text-xs text-muted-foreground">
                        {client.accountManager.email}
                      </p>
                    )}
                  </div>
                </td>

                <td className="px-4 py-3">
                  <ClientStatusBadge status={client.status} />
                </td>

                <td className="px-4 py-3 text-center">
                  {client._count?.contacts ?? 0}
                </td>

                <td className="px-4 py-3 text-center">
                  {client._count?.contracts ?? 0}
                </td>

                <td className="px-4 py-3 text-right">
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button variant="ghost" size="icon" className="size-8">
                        <MoreHorizontal className="size-4" />
                        <span className="sr-only">Client actions</span>
                      </Button>
                    </DropdownMenuTrigger>

                    <DropdownMenuContent align="end" className="min-w-44">
                      <ClientDetailModal
                        client={client}
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
                        required="client.update">
                        <EditClientModal
                          client={client}
                          onSuccess={onRefresh}
                          trigger={
                            <DropdownMenuItem
                              onSelect={(event) => event.preventDefault()}>
                              <Pencil className="mr-2 size-4" />
                              Edit Client
                            </DropdownMenuItem>
                          }
                        />
                      </PermissionGuard>

                      <PermissionGuard
                        permissions={permissions}
                        required="client.delete">
                        <DropdownMenuSeparator />

                        <ConfirmDeleteDialog
                          title="Hapus client?"
                          description={`Client "${client.companyName}" akan dihapus permanen.`}
                          triggerLabel="Hapus Client"
                          loadingLabel="Menghapus Client..."
                          onConfirm={() => handleDelete(client)}
                          trigger={
                            <DropdownMenuItem
                              onSelect={(event) => event.preventDefault()}
                              className="text-destructive focus:text-destructive">
                              <Trash2 className="mr-2 size-4" />
                              Hapus Client
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
    </div>
  );
}
