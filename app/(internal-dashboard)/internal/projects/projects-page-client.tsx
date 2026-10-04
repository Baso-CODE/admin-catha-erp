"use client";

import { ProjectTable } from "./components/project-table";

interface ProjectsPageClientProps {
  permissions: string[];
}

export function ProjectsPageClient({ permissions }: ProjectsPageClientProps) {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight">
          Project Management
        </h1>

        <p className="text-sm text-muted-foreground">
          Kelola project client, project manager, status, dan service yang
          digunakan.
        </p>
      </div>

      <ProjectTable permissions={permissions} />
    </div>
  );
}
