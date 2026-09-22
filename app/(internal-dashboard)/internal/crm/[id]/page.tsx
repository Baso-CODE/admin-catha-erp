"use client";

import { useParams } from "next/navigation";
import { useEffect, useState } from "react";
import { toast } from "sonner";

import { LeadItem, leadService } from "@/app/services/crm/lead.service";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

import { ActivityTimeline } from "./components/activity-timeline";
import { LeadHeader } from "./components/lead-header";
import { LeadOverview } from "./components/lead-overview";
import { ProposalTable } from "./components/proposal-table";
import { QuotationTable } from "./components/quotation-table";

export default function LeadDetailPage() {
  const params = useParams<{ id: string }>();

  const [lead, setLead] = useState<LeadItem | null>(null);
  const [loading, setLoading] = useState(true);

  const loadLead = async () => {
    try {
      setLoading(true);

      const response = await leadService.getById(params.id);

      if (response.success) {
        setLead(response.data);
      }
    } catch (error) {
      toast.error("Gagal memuat detail lead", {
        description:
          error instanceof Error
            ? error.message
            : "Terjadi kesalahan pada server.",
      });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    void loadLead();
  }, [params.id]);

  if (loading) {
    return (
      <div className="flex min-h-80 items-center justify-center text-sm text-muted-foreground">
        Memuat detail lead...
      </div>
    );
  }

  if (!lead) {
    return (
      <div className="flex min-h-80 items-center justify-center text-sm text-muted-foreground">
        Lead tidak ditemukan.
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <LeadHeader lead={lead} />

      <Tabs defaultValue="overview" className="space-y-6">
        <TabsList>
          <TabsTrigger value="overview">Overview</TabsTrigger>

          <TabsTrigger value="activity">Activity</TabsTrigger>

          <TabsTrigger value="proposal">Proposal</TabsTrigger>

          <TabsTrigger value="quotation">Quotation</TabsTrigger>
        </TabsList>

        <TabsContent value="overview">
          <LeadOverview lead={lead} />
        </TabsContent>

        <TabsContent value="activity">
          <ActivityTimeline leadId={lead.id} onRefreshLead={loadLead} />
        </TabsContent>

        <TabsContent value="proposal">
          <ProposalTable leadId={lead.id} onRefreshLead={loadLead} />
        </TabsContent>

        <TabsContent value="quotation">
          <QuotationTable leadId={lead.id} onRefreshLead={loadLead} />
        </TabsContent>
      </Tabs>
    </div>
  );
}
