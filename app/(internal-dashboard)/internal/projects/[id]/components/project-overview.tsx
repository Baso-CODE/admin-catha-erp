import {
  Building2,
  CalendarDays,
  FileText,
  FolderKanban,
  ListChecks,
  PackageCheck,
  UserRound,
} from "lucide-react";

import { ProjectItem } from "@/app/services/project.service";
import { ProjectStatusBadge } from "../../components/project-status-badge";

interface ProjectOverviewProps {
  project: ProjectItem;
}

export function ProjectOverview({ project }: ProjectOverviewProps) {
  return (
    <div className="space-y-6">
      <div className="grid gap-4 lg:grid-cols-3">
        <div className="rounded-xl border p-5 lg:col-span-2">
          <div className="mb-5">
            <h3 className="font-semibold">Informasi Project</h3>

            <p className="text-sm text-muted-foreground">
              Informasi utama dan periode project.
            </p>
          </div>

          <div className="grid gap-5 sm:grid-cols-2">
            <InfoItem
              icon={FolderKanban}
              label="Project Type"
              value={project.projectType}
            />

            <InfoItem
              icon={Building2}
              label="Client"
              value={project.client?.companyName ?? "-"}
            />

            <InfoItem
              icon={UserRound}
              label="Project Manager"
              value={project.projectManager?.name ?? "-"}
            />

            <InfoItem
              icon={FileText}
              label="Status"
              value={<ProjectStatusBadge status={project.status} />}
            />

            <InfoItem
              icon={CalendarDays}
              label="Start Date"
              value={formatDate(project.startDate)}
            />

            <InfoItem
              icon={CalendarDays}
              label="Target End Date"
              value={formatDate(project.targetEndDate)}
            />

            <InfoItem
              icon={CalendarDays}
              label="Actual End Date"
              value={
                project.actualEndDate ? formatDate(project.actualEndDate) : "-"
              }
            />
          </div>
        </div>

        <div className="rounded-xl border p-5">
          <div className="mb-5">
            <h3 className="font-semibold">Contract</h3>

            <p className="text-sm text-muted-foreground">
              Contract yang terhubung ke project.
            </p>
          </div>

          {project.contract ? (
            <div className="space-y-2">
              <p className="font-medium">{project.contract.title}</p>

              <p className="font-mono text-xs text-muted-foreground">
                {project.contract.contractNo}
              </p>
            </div>
          ) : (
            <p className="text-sm text-muted-foreground">
              Project tidak terhubung dengan contract.
            </p>
          )}
        </div>
      </div>

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <SummaryCard
          icon={PackageCheck}
          label="Services"
          value={project._count?.services ?? 0}
        />

        <SummaryCard
          icon={ListChecks}
          label="Tasks"
          value={project._count?.tasks ?? 0}
        />

        <SummaryCard
          icon={FileText}
          label="Deliverables"
          value={project._count?.deliverables ?? 0}
        />

        <SummaryCard
          icon={FolderKanban}
          label="Performance"
          value={project._count?.performanceMetrics ?? 0}
        />
      </div>

      <div className="rounded-xl border p-5">
        <h3 className="mb-2 font-semibold">Deskripsi</h3>

        <div className="whitespace-pre-wrap text-sm text-muted-foreground">
          {project.description || "Belum ada deskripsi project."}
        </div>
      </div>

      <div className="grid gap-4 sm:grid-cols-2">
        <div className="rounded-xl border p-5">
          <p className="text-xs text-muted-foreground">Dibuat</p>

          <p className="mt-1 text-sm font-medium">
            {formatDateTime(project.createdAt)}
          </p>
        </div>

        <div className="rounded-xl border p-5">
          <p className="text-xs text-muted-foreground">Terakhir Diperbarui</p>

          <p className="mt-1 text-sm font-medium">
            {formatDateTime(project.updatedAt)}
          </p>
        </div>
      </div>
    </div>
  );
}

interface InfoItemProps {
  icon: React.ElementType;
  label: string;
  value: React.ReactNode;
}

function InfoItem({ icon: Icon, label, value }: InfoItemProps) {
  return (
    <div className="flex items-start gap-3">
      <div className="rounded-md bg-muted p-2">
        <Icon className="size-4 text-muted-foreground" />
      </div>

      <div className="min-w-0">
        <p className="text-xs text-muted-foreground">{label}</p>

        <div className="mt-1 wrap-break-words text-sm font-medium">{value}</div>
      </div>
    </div>
  );
}

interface SummaryCardProps {
  icon: React.ElementType;
  label: string;
  value: number;
}

function SummaryCard({ icon: Icon, label, value }: SummaryCardProps) {
  return (
    <div className="rounded-xl border p-5">
      <div className="flex items-center justify-between">
        <div>
          <p className="text-xs text-muted-foreground">{label}</p>

          <p className="mt-1 text-2xl font-semibold">{value}</p>
        </div>

        <div className="rounded-lg bg-muted p-2">
          <Icon className="size-5 text-muted-foreground" />
        </div>
      </div>
    </div>
  );
}

function formatDate(value: string) {
  return new Intl.DateTimeFormat("id-ID", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  }).format(new Date(value));
}

function formatDateTime(value: string) {
  return new Intl.DateTimeFormat("id-ID", {
    day: "2-digit",
    month: "short",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  }).format(new Date(value));
}
