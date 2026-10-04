"use client";

import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { MasterServiceTable } from "./components/master-service-table";
import { WorkflowTemplateTable } from "./components/workflow-template-table";

interface MasterDataPageClientProps {
  permissions: string[];
}

export function MasterDataPageClient({
  permissions,
}: MasterDataPageClientProps) {
  const canReadMasterService = permissions.includes("master.service.read");

  const canReadWorkflowTemplate = permissions.includes(
    "workflow.template.read",
  );

  const defaultTab = canReadMasterService
    ? "master-service"
    : "workflow-template";

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight">
          Master Data & Workflow
        </h1>
        <p className="text-sm text-muted-foreground">
          Kelola layanan agency dan workflow template.
        </p>
      </div>

      <Tabs defaultValue={defaultTab} className="space-y-6">
        <TabsList className="h-auto w-full justify-start gap-6 rounded-none border-b bg-transparent p-0">
          {canReadMasterService && (
            <TabsTrigger
              value="master-service"
              className="rounded-none border-b-2 border-transparent px-0 py-3 text-sm font-medium shadow-none data-[state=active]:border-primary data-[state=active]:bg-transparent data-[state=active]:text-primary data-[state=active]:shadow-none">
              Master Service
            </TabsTrigger>
          )}

          {canReadWorkflowTemplate && (
            <TabsTrigger
              value="workflow-template"
              className="rounded-none border-b-2 border-transparent px-0 py-3 text-sm font-medium shadow-none data-[state=active]:border-primary data-[state=active]:bg-transparent data-[state=active]:text-primary data-[state=active]:shadow-none">
              Workflow Template
            </TabsTrigger>
          )}
        </TabsList>

        {canReadMasterService && (
          <TabsContent value="master-service" className="mt-0">
            <MasterServiceTable permissions={permissions} />
          </TabsContent>
        )}

        {canReadWorkflowTemplate && (
          <TabsContent value="workflow-template" className="mt-0">
            <WorkflowTemplateTable permissions={permissions} />
          </TabsContent>
        )}
      </Tabs>
    </div>
  );
}
