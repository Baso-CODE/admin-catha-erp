"use client";

import { useParams } from "next/navigation";
import { useCallback, useEffect, useState } from "react";
import { toast } from "sonner";

import { ClientItem, clientService } from "@/app/services/client.service";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { ClientHeader } from "./components/client-header";
import { ClientOverview } from "./components/client-overview";
import { ContactPersonTable } from "./components/contact-person-table";
import { ContractTable } from "./components/contract-table";

interface ClientDetailClientProps {
  permissions: string[];
}

export default function ClientDetailClient({
  permissions,
}: ClientDetailClientProps) {
  const params = useParams();
  const clientId = params.id as string;

  const [client, setClient] = useState<ClientItem | null>(null);
  const [loading, setLoading] = useState(true);

  const loadClient = useCallback(async () => {
    try {
      setLoading(true);

      const response = await clientService.getClientById(clientId);

      if (response.success) {
        setClient(response.data);
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
  }, [clientId]);

  useEffect(() => {
    void loadClient();
  }, [loadClient]);

  if (loading) {
    return (
      <div className="flex min-h-60 items-center justify-center text-sm text-muted-foreground">
        Memuat detail client...
      </div>
    );
  }

  if (!client) {
    return (
      <div className="flex min-h-60 items-center justify-center text-sm text-muted-foreground">
        Client tidak ditemukan.
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <ClientHeader
        client={client}
        permissions={permissions}
        onRefresh={loadClient}
      />

      <Tabs defaultValue="overview" className="space-y-6">
        <TabsList className="h-auto w-full justify-start gap-6 rounded-none border-b bg-transparent p-0">
          <TabsTrigger
            value="overview"
            className="rounded-none border-b-2 border-transparent px-0 py-3 text-sm font-medium shadow-none data-[state=active]:border-primary data-[state=active]:bg-transparent data-[state=active]:text-primary data-[state=active]:shadow-none">
            Overview
          </TabsTrigger>

          <TabsTrigger
            value="contacts"
            className="rounded-none border-b-2 border-transparent px-0 py-3 text-sm font-medium shadow-none data-[state=active]:border-primary data-[state=active]:bg-transparent data-[state=active]:text-primary data-[state=active]:shadow-none">
            Contact Person
          </TabsTrigger>

          <TabsTrigger
            value="contracts"
            className="rounded-none border-b-2 border-transparent px-0 py-3 text-sm font-medium shadow-none data-[state=active]:border-primary data-[state=active]:bg-transparent data-[state=active]:text-primary data-[state=active]:shadow-none">
            Contract
          </TabsTrigger>
        </TabsList>

        <TabsContent value="overview">
          <ClientOverview client={client} />
        </TabsContent>

        <TabsContent value="contacts">
          <ContactPersonTable
            clientId={client.id}
            permissions={permissions}
            onRefreshClient={loadClient}
          />
        </TabsContent>

        <TabsContent value="contracts">
          <ContractTable
            clientId={client.id}
            sourceLeadId={client.sourceLeadId}
            permissions={permissions}
            onRefreshClient={loadClient}
          />
        </TabsContent>
      </Tabs>
    </div>
  );
}
