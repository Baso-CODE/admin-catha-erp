"use client";

import {
  BriefcaseBusiness,
  Building2,
  CalendarDays,
  Mail,
  MapPin,
  Phone,
  User,
  UserCheck,
  WalletCards,
} from "lucide-react";

import { LeadItem } from "@/app/services/crm/lead.service";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

interface LeadOverviewProps {
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

function formatDate(value: string) {
  return new Intl.DateTimeFormat("id-ID", {
    day: "2-digit",
    month: "long",
    year: "numeric",
  }).format(new Date(value));
}

export function LeadOverview({ lead }: LeadOverviewProps) {
  return (
    <div className="grid gap-6 lg:grid-cols-2">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-base">
            <Building2 className="size-4 text-primary" />
            Informasi Perusahaan
          </CardTitle>
        </CardHeader>

        <CardContent className="space-y-5">
          <div className="flex items-start gap-3">
            <Building2 className="mt-0.5 size-4 text-muted-foreground" />

            <div>
              <p className="text-xs text-muted-foreground">Nama Perusahaan</p>

              <p className="font-medium">{lead.company}</p>
            </div>
          </div>

          <div className="flex items-start gap-3">
            <BriefcaseBusiness className="mt-0.5 size-4 text-muted-foreground" />

            <div>
              <p className="text-xs text-muted-foreground">Industry</p>

              <p className="font-medium">{lead.industry || "-"}</p>
            </div>
          </div>

          <div className="flex items-start gap-3">
            <MapPin className="mt-0.5 size-4 text-muted-foreground" />

            <div>
              <p className="text-xs text-muted-foreground">Alamat</p>

              <p className="font-medium">{lead.address || "-"}</p>
            </div>
          </div>

          <div className="flex items-start gap-3">
            <WalletCards className="mt-0.5 size-4 text-muted-foreground" />

            <div>
              <p className="text-xs text-muted-foreground">Estimated Value</p>

              <p className="font-medium">
                {formatCurrency(lead.estimatedValue)}
              </p>
            </div>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-base">
            <User className="size-4 text-primary" />
            Contact Person
          </CardTitle>
        </CardHeader>

        <CardContent className="space-y-5">
          <div className="flex items-start gap-3">
            <User className="mt-0.5 size-4 text-muted-foreground" />

            <div>
              <p className="text-xs text-muted-foreground">PIC</p>

              <p className="font-medium">{lead.pic}</p>
            </div>
          </div>

          <div className="flex items-start gap-3">
            <Phone className="mt-0.5 size-4 text-muted-foreground" />

            <div>
              <p className="text-xs text-muted-foreground">Nomor Telepon</p>

              <p className="font-medium">{lead.phone}</p>
            </div>
          </div>

          <div className="flex items-start gap-3">
            <Mail className="mt-0.5 size-4 text-muted-foreground" />

            <div>
              <p className="text-xs text-muted-foreground">Email</p>

              <p className="font-medium">{lead.email || "-"}</p>
            </div>
          </div>

          <div className="flex items-start gap-3">
            <UserCheck className="mt-0.5 size-4 text-muted-foreground" />

            <div>
              <p className="text-xs text-muted-foreground">Sales Assignee</p>

              <p className="font-medium">{lead.assignee?.name ?? "-"}</p>

              {lead.assignee?.email && (
                <p className="text-xs text-muted-foreground">
                  {lead.assignee.email}
                </p>
              )}
            </div>
          </div>
        </CardContent>
      </Card>

      <Card className="lg:col-span-2">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-base">
            <CalendarDays className="size-4 text-primary" />
            Informasi Lead
          </CardTitle>
        </CardHeader>

        <CardContent>
          <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-4">
            <div>
              <p className="text-xs text-muted-foreground">Lead Code</p>

              <p className="mt-1 font-medium">{lead.leadCode}</p>
            </div>

            <div>
              <p className="text-xs text-muted-foreground">Lead Source</p>

              <p className="mt-1 font-medium">{lead.source || "-"}</p>
            </div>

            <div>
              <p className="text-xs text-muted-foreground">Dibuat</p>

              <p className="mt-1 font-medium">{formatDate(lead.createdAt)}</p>
            </div>

            <div>
              <p className="text-xs text-muted-foreground">Terakhir Diupdate</p>

              <p className="mt-1 font-medium">{formatDate(lead.updatedAt)}</p>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
