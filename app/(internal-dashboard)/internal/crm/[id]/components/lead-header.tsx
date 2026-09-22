"use client";

import { ArrowLeft, Building2, Mail, Phone } from "lucide-react";
import Link from "next/link";

import { LeadItem } from "@/app/services/crm/lead.service";
import { Button } from "@/components/ui/button";
import { LeadStatusBadge } from "../../components/lead-status-badge";

interface LeadHeaderProps {
  lead: LeadItem;
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

export function LeadHeader({ lead }: LeadHeaderProps) {
  return (
    <div className="space-y-5">
      <Button
        variant="ghost"
        size="sm"
        render={
          <Link href="/internal/crm">
            <ArrowLeft className="mr-2 size-4" />
            Kembali ke CRM
          </Link>
        }
      />

      <div className="flex flex-col gap-4 border-b pb-6 lg:flex-row lg:items-start lg:justify-between">
        <div className="space-y-3">
          <div className="flex flex-wrap items-center gap-3">
            <h1 className="text-2xl font-bold tracking-tight">
              {lead.company}
            </h1>

            <LeadStatusBadge status={lead.status} />
          </div>

          <p className="text-sm font-medium text-muted-foreground">
            {lead.leadCode}
          </p>

          <div className="flex flex-wrap gap-x-5 gap-y-2 text-sm text-muted-foreground">
            <div className="flex items-center gap-2">
              <Building2 className="size-4" />
              {lead.industry || "Industry belum diisi"}
            </div>

            <div className="flex items-center gap-2">
              <Phone className="size-4" />
              {lead.phone}
            </div>

            {lead.email && (
              <div className="flex items-center gap-2">
                <Mail className="size-4" />
                {lead.email}
              </div>
            )}
          </div>
        </div>

        <div className="space-y-1 lg:text-right">
          <p className="text-xs text-muted-foreground">Estimated Value</p>

          <p className="text-xl font-bold">
            {formatCurrency(lead.estimatedValue)}
          </p>

          <p className="text-xs text-muted-foreground">
            Sales: {lead.assignee?.name ?? "-"}
          </p>
        </div>
      </div>
    </div>
  );
}
