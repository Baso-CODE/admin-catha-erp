"use client";

import { Loader2 } from "lucide-react";
import { useParams } from "next/navigation";
import { useCallback, useEffect, useState } from "react";
import { toast } from "sonner";

import { ProjectItem, projectService } from "@/app/services/project.service";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

import { ProjectHeader } from "./components/project-header";
import { ProjectOverview } from "./components/project-overview";
import { ProjectServiceTable } from "./components/project-service-table";

interface ProjectDetailClientProps {
  permissions: string[];
}

export function ProjectDetailClient({ permissions }: ProjectDetailClientProps) {
  const params = useParams();
  const projectId = String(params.id);

  const [project, setProject] = useState<ProjectItem | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  const loadProject = useCallback(async () => {
    try {
      setIsLoading(true);

      const response = await projectService.getById(projectId);

      setProject(response.data);
    } catch (error) {
      toast.error("Gagal mengambil detail project.", {
        description:
          error instanceof Error
            ? error.message
            : "Terjadi kesalahan pada server.",
      });
    } finally {
      setIsLoading(false);
    }
  }, [projectId]);

  useEffect(() => {
    void loadProject();
  }, [loadProject]);

  if (isLoading) {
    return (
      <div className="flex min-h-[400px] items-center justify-center">
        <Loader2 className="size-6 animate-spin text-muted-foreground" />
      </div>
    );
  }

  if (!project) {
    return (
      <div className="rounded-xl border p-8 text-center">
        <p className="text-sm text-muted-foreground">
          Project tidak ditemukan.
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <ProjectHeader
        project={project}
        permissions={permissions}
        onRefresh={loadProject}
      />

      <Tabs defaultValue="overview" className="space-y-6">
        <TabsList className="h-auto w-full justify-start gap-6 rounded-none border-b bg-transparent p-0">
          <TabsTrigger
            value="overview"
            className="rounded-none border-b-2 border-transparent px-0 py-3 text-sm font-medium shadow-none data-[state=active]:border-primary data-[state=active]:bg-transparent data-[state=active]:text-primary data-[state=active]:shadow-none">
            Overview
          </TabsTrigger>

          <TabsTrigger
            value="services"
            className="rounded-none border-b-2 border-transparent px-0 py-3 text-sm font-medium shadow-none data-[state=active]:border-primary data-[state=active]:bg-transparent data-[state=active]:text-primary data-[state=active]:shadow-none">
            Services
          </TabsTrigger>
        </TabsList>

        <TabsContent value="overview" className="mt-0">
          <ProjectOverview project={project} />
        </TabsContent>

        <TabsContent value="services" className="mt-0">
          <ProjectServiceTable
            projectId={project.id}
            permissions={permissions}
            onRefreshProject={loadProject}
          />
        </TabsContent>
      </Tabs>
    </div>
  );
}
