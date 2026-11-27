"use client";

import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

import { MasterServiceTable } from "./components/master-service-table";
import { ServiceCategoryTable } from "./components/service-category-table";
import { WorkflowTemplateTable } from "./components/workflow-template-table";

interface MasterDataPageClientProps {
  permissions: string[];
}

const TAB_CLASS =
  "shrink-0 rounded-none border-b-2 border-transparent px-0 py-3 text-sm font-medium shadow-none data-[state=active]:border-primary data-[state=active]:bg-transparent data-[state=active]:text-primary data-[state=active]:shadow-none";

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
    <div className="min-w-0 space-y-6">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight">
          Master Data & Workflow
        </h1>

        <p className="text-sm text-muted-foreground">
          Kelola kategori layanan, master service, dan workflow template.
        </p>
      </div>

      <Tabs defaultValue={defaultTab} className="space-y-6">
        <div className="max-w-full overflow-x-auto border-b">
          <TabsList className="h-auto w-max min-w-full justify-start gap-6 rounded-none bg-transparent p-0">
            {canReadMasterService && (
              <>
                <TabsTrigger value="service-category" className={TAB_CLASS}>
                  Service Category
                </TabsTrigger>

                <TabsTrigger value="master-service" className={TAB_CLASS}>
                  Master Service
                </TabsTrigger>
              </>
            )}

            {canReadWorkflowTemplate && (
              <TabsTrigger value="workflow-template" className={TAB_CLASS}>
                Workflow Template
              </TabsTrigger>
            )}
          </TabsList>
        </div>

        {canReadMasterService && (
          <>
            <TabsContent value="service-category" className="mt-0">
              <ServiceCategoryTable permissions={permissions} />
            </TabsContent>

            <TabsContent value="master-service" className="mt-0">
              <MasterServiceTable permissions={permissions} />
            </TabsContent>
          </>
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
