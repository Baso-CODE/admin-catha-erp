"use client";

import { ArrowLeft, Pencil } from "lucide-react";
import Link from "next/link";

import { ProjectItem } from "@/app/services/project.service";
import { PermissionGuard } from "@/components/shared/permission-guard";
import { Button } from "@/components/ui/button";
import { EditProjectModal } from "../../components/edit-project-modal";
import { ProjectStatusBadge } from "../../components/project-status-badge";

interface ProjectHeaderProps {
  project: ProjectItem;
  permissions: string[];
  onRefresh?: () => void | Promise<void>;
}

export function ProjectHeader({
  project,
  permissions,
  onRefresh,
}: ProjectHeaderProps) {
  return (
    <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
      <div className="flex items-start gap-3">
        <Button variant="outline" size="icon" asChild>
          <Link href="/internal/projects">
            <ArrowLeft className="size-4" />
          </Link>
        </Button>

        <div>
          <div className="flex flex-wrap items-center gap-3">
            <h1 className="text-2xl font-semibold tracking-tight">
              {project.name}
            </h1>

            <ProjectStatusBadge status={project.status} />
          </div>

          <p className="mt-1 font-mono text-xs text-muted-foreground">
            {project.projectCode}
          </p>

          <div className="mt-2 flex flex-wrap gap-x-4 gap-y-1 text-sm text-muted-foreground">
            <span>{project.projectType}</span>

            {project.client?.companyName && (
              <span>Client: {project.client.companyName}</span>
            )}

            {project.projectManager?.name && (
              <span>PM: {project.projectManager.name}</span>
            )}
          </div>
        </div>
      </div>

      <PermissionGuard permissions={permissions} required="project.update">
        <EditProjectModal
          item={project}
          onSuccess={onRefresh}
          trigger={
            <Button variant="outline">
              <Pencil className="size-4" />
              Edit Project
            </Button>
          }
        />
      </PermissionGuard>
    </div>
  );
}
