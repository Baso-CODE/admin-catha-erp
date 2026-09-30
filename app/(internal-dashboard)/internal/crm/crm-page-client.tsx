"use client";

import { useCallback, useEffect, useState } from "react";
import { toast } from "sonner";

import {
  LeadListItem,
  LeadMetrics,
  leadService,
} from "@/app/services/crm/lead.service";
import { useDebounce } from "@/hooks/useDebounce";

import { PermissionGuard } from "@/components/shared/permission-guard";
import { CreateLeadModal } from "./components/create-lead-modal";
import { LeadFilters } from "./components/lead-filters";
import { LeadStatCards } from "./components/lead-stat-cards";
import { LeadTable } from "./components/lead-table";

const initialMetrics: LeadMetrics = {
  total: 0,
  new: 0,
  qualified: 0,
  proposal: 0,
  negotiation: 0,
  won: 0,
  lost: 0,
};

interface CRMPageProps {
  permissions: string[];
}

export default function CRMPageClient({ permissions }: CRMPageProps) {
  const [loading, setLoading] = useState(true);

  const [leads, setLeads] = useState<LeadListItem[]>([]);
  const [metrics, setMetrics] = useState<LeadMetrics>(initialMetrics);

  const [search, setSearch] = useState("");
  const [status, setStatus] = useState<string | undefined>(undefined);
  const [page, setPage] = useState(1);

  const debouncedSearch = useDebounce(search, 500);

  const [meta, setMeta] = useState({
    total: 0,
    page: 1,
    limit: 10,
    totalPages: 1,
  });

  const loadCRMData = useCallback(async () => {
    try {
      setLoading(true);

      const [metricsResponse, leadsResponse] = await Promise.all([
        leadService.getMetrics(),
        leadService.getAll({
          search: debouncedSearch || undefined,
          status,
          page,
          limit: 10,
        }),
      ]);

      if (metricsResponse.success) {
        setMetrics(metricsResponse.data);
      }

      if (leadsResponse.success) {
        setLeads(leadsResponse.data);
        setMeta(leadsResponse.meta);
      }
    } catch (error) {
      toast.error("Gagal memuat data CRM", {
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
    void loadCRMData();
  }, [loadCRMData]);

  const handleSearchChange = (value: string) => {
    setSearch(value);
    setPage(1);
  };

  const handleStatusChange = (value?: string) => {
    setStatus(value);
    setPage(1);
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">
            CRM & Lead Management
          </h1>

          <p className="text-sm text-muted-foreground">
            Kelola pipeline lead, aktivitas, proposal, dan quotation client.
          </p>
        </div>

        <PermissionGuard permissions={permissions} required="crm.lead.create">
          <CreateLeadModal onSuccess={loadCRMData} />
        </PermissionGuard>
      </div>

      <LeadStatCards metrics={metrics} />

      <LeadFilters
        search={search}
        status={status}
        onSearchChange={handleSearchChange}
        onStatusChange={handleStatusChange}
      />

      <LeadTable
        leads={leads}
        permissions={permissions}
        loading={loading}
        meta={meta}
        onPageChange={setPage}
        onRefresh={loadCRMData}
      />
    </div>
  );
}
