"use client";

import { BadgeDollarSign, CircleCheckBig, Target, Users } from "lucide-react";

import { LeadMetrics } from "@/app/services/crm/lead.service";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

interface LeadStatCardsProps {
  metrics: LeadMetrics;
}

export function LeadStatCards({ metrics }: LeadStatCardsProps) {
  return (
    <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
      <Card>
        <CardHeader className="flex flex-row items-center justify-between pb-2">
          <CardTitle className="text-sm font-medium text-muted-foreground">
            Total Lead
          </CardTitle>

          <Users className="size-4 text-primary" />
        </CardHeader>

        <CardContent>
          <div className="text-2xl font-bold">{metrics.total}</div>

          <p className="mt-1 text-xs text-muted-foreground">
            Seluruh lead yang dapat Anda akses
          </p>
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="flex flex-row items-center justify-between pb-2">
          <CardTitle className="text-sm font-medium text-muted-foreground">
            Lead Baru
          </CardTitle>

          <Target className="size-4 text-blue-500" />
        </CardHeader>

        <CardContent>
          <div className="text-2xl font-bold">{metrics.new}</div>

          <p className="mt-1 text-xs text-muted-foreground">
            Lead dengan status NEW
          </p>
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="flex flex-row items-center justify-between pb-2">
          <CardTitle className="text-sm font-medium text-muted-foreground">
            Qualified
          </CardTitle>

          <BadgeDollarSign className="size-4 text-amber-500" />
        </CardHeader>

        <CardContent>
          <div className="text-2xl font-bold">{metrics.qualified}</div>

          <p className="mt-1 text-xs text-muted-foreground">
            Lead yang sudah lolos kualifikasi
          </p>
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="flex flex-row items-center justify-between pb-2">
          <CardTitle className="text-sm font-medium text-muted-foreground">
            Won
          </CardTitle>

          <CircleCheckBig className="size-4 text-emerald-500" />
        </CardHeader>

        <CardContent>
          <div className="text-2xl font-bold">{metrics.won}</div>

          <p className="mt-1 text-xs text-muted-foreground">
            Lead yang berhasil dikonversi
          </p>
        </CardContent>
      </Card>
    </div>
  );
}
