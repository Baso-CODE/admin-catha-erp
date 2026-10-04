"use client";

import { ArrowUpRight, Building2, Globe2, MapPin, User } from "lucide-react";
import { ReactNode } from "react";

import { ClientItem } from "@/app/services/client.service";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import Link from "next/link";
import { ClientStatusBadge } from "./client-status-badge";

interface ClientDetailModalProps {
  client: ClientItem;
  trigger?: ReactNode;
}

export function ClientDetailModal({ client, trigger }: ClientDetailModalProps) {
  return (
    <Dialog>
      <DialogTrigger asChild>{trigger}</DialogTrigger>

      <DialogContent className="sm:max-w-lg">
        <DialogHeader>
          <DialogTitle>Detail Client</DialogTitle>

          <DialogDescription>Informasi singkat client.</DialogDescription>
        </DialogHeader>

        <div className="space-y-5 pt-2">
          <div className="flex items-start justify-between gap-4">
            <div>
              <h3 className="font-semibold">{client.companyName}</h3>

              <p className="text-sm text-muted-foreground">
                {client.clientCode}
              </p>
            </div>

            <ClientStatusBadge status={client.status} />
          </div>

          <div className="grid gap-4">
            <div className="flex items-start gap-3">
              <Building2 className="mt-0.5 size-4 text-muted-foreground" />

              <div>
                <p className="text-xs text-muted-foreground">Industry</p>
                <p className="text-sm">{client.industry ?? "-"}</p>
              </div>
            </div>

            <div className="flex items-start gap-3">
              <Building2 className="mt-0.5 size-4 text-muted-foreground" />

              <div>
                <p className="text-xs text-muted-foreground">Business Type</p>

                <p className="text-sm">{client.businessType ?? "-"}</p>
              </div>
            </div>

            <div className="flex items-start gap-3">
              <User className="mt-0.5 size-4 text-muted-foreground" />

              <div>
                <p className="text-xs text-muted-foreground">Account Manager</p>

                <p className="text-sm">{client.accountManager?.name ?? "-"}</p>

                {client.accountManager?.email && (
                  <p className="text-xs text-muted-foreground">
                    {client.accountManager.email}
                  </p>
                )}
              </div>
            </div>

            {client.website && (
              <div className="flex items-start gap-3">
                <Globe2 className="mt-0.5 size-4 text-muted-foreground" />

                <div>
                  <p className="text-xs text-muted-foreground">Website</p>

                  <a
                    href={client.website}
                    target="_blank"
                    rel="noreferrer"
                    className="text-sm hover:underline">
                    {client.website}
                  </a>
                </div>
              </div>
            )}

            {client.address && (
              <div className="flex items-start gap-3">
                <MapPin className="mt-0.5 size-4 text-muted-foreground" />

                <div>
                  <p className="text-xs text-muted-foreground">Address</p>

                  <p className="text-sm">{client.address}</p>
                </div>
              </div>
            )}
          </div>

          <div className="flex justify-end border-t pt-4">
            <Button asChild>
              <Link href={`/internal/clients/${client.id}`}>
                Lihat Detail Lengkap
                <ArrowUpRight className="size-4" />
              </Link>
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
