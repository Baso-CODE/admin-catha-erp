"use client";

import { ArrowLeft, Pencil } from "lucide-react";
import Link from "next/link";

import { ClientItem } from "@/app/services/client.service";
import { PermissionGuard } from "@/components/shared/permission-guard";
import { Button } from "@/components/ui/button";

import { ClientStatusBadge } from "../../components/client-status-badge";
import { EditClientModal } from "../../components/edit-client-modal";

interface ClientHeaderProps {
  client: ClientItem;
  permissions: string[];
  onRefresh?: () => void | Promise<void>;
}

export function ClientHeader({
  client,
  permissions,
  onRefresh,
}: ClientHeaderProps) {
  return (
    <div className="space-y-4">
      <div>
        <Button variant="ghost" size="sm" asChild className="-ml-2">
          <Link href="/internal/clients">
            <ArrowLeft className="mr-2 size-4" />
            Kembali ke Client
          </Link>
        </Button>
      </div>

      <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
        <div className="space-y-2">
          <div className="flex flex-wrap items-center gap-3">
            <h1 className="text-2xl font-semibold">{client.companyName}</h1>

            <ClientStatusBadge status={client.status} />
          </div>

          <div className="flex flex-wrap gap-x-4 gap-y-1 text-sm text-muted-foreground">
            <span>{client.clientCode}</span>

            {client.industry && <span>{client.industry}</span>}

            {client.businessType && <span>{client.businessType}</span>}
          </div>
        </div>

        <PermissionGuard permissions={permissions} required="client.update">
          <EditClientModal
            client={client}
            onSuccess={onRefresh}
            trigger={
              <Button variant="outline" className="gap-2">
                <Pencil className="size-4" />
                Edit Client
              </Button>
            }
          />
        </PermissionGuard>
      </div>
    </div>
  );
}
