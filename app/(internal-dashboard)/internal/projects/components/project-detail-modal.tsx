"use client";

import { Building2, CalendarDays, FolderKanban, UserRound } from "lucide-react";
import { ReactNode } from "react";

import { ProjectItem } from "@/app/services/project.service";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { ProjectStatusBadge } from "./project-status-badge";

interface ProjectDetailModalProps {
  item: ProjectItem;
  trigger?: ReactNode;
}

export function ProjectDetailModal({ item, trigger }: ProjectDetailModalProps) {
  return (
    <Dialog>
      {trigger && <DialogTrigger asChild>{trigger}</DialogTrigger>}

      <DialogContent className="max-h-[90vh] overflow-y-auto sm:max-w-2xl">
        <DialogHeader>
          <DialogTitle>Detail Project</DialogTitle>
          <DialogDescription>Ringkasan informasi project.</DialogDescription>
        </DialogHeader>

        <div className="space-y-6 pt-2">
          <div className="flex items-start justify-between gap-4 border-b pb-5">
            <div>
              <h3 className="text-lg font-semibold">{item.name}</h3>

              <p className="font-mono text-xs text-muted-foreground">
                {item.projectCode}
              </p>

              <p className="mt-1 text-sm text-muted-foreground">
                {item.projectType}
              </p>
            </div>

            <ProjectStatusBadge status={item.status} />
          </div>

          <div className="grid gap-4 sm:grid-cols-2">
            <DetailItem
              icon={Building2}
              label="Client"
              value={item.client?.companyName ?? "-"}
            />

            <DetailItem
              icon={UserRound}
              label="Project Manager"
              value={item.projectManager?.name ?? "-"}
            />

            <DetailItem
              icon={CalendarDays}
              label="Start Date"
              value={formatDate(item.startDate)}
            />

            <DetailItem
              icon={CalendarDays}
              label="Target End Date"
              value={formatDate(item.targetEndDate)}
            />

            <DetailItem
              icon={CalendarDays}
              label="Actual End Date"
              value={item.actualEndDate ? formatDate(item.actualEndDate) : "-"}
            />

            <DetailItem
              icon={FolderKanban}
              label="Services"
              value={`${item._count?.services ?? 0} service`}
            />
          </div>

          <div className="rounded-xl border p-4">
            <p className="mb-3 text-sm font-medium">Contract</p>

            {item.contract ? (
              <div>
                <p className="text-sm font-medium">{item.contract.title}</p>

                <p className="font-mono text-xs text-muted-foreground">
                  {item.contract.contractNo}
                </p>
              </div>
            ) : (
              <p className="text-sm text-muted-foreground">
                Project ini tidak menggunakan contract.
              </p>
            )}
          </div>

          <div>
            <p className="mb-2 text-sm font-medium">Deskripsi</p>

            <div className="whitespace-pre-wrap rounded-xl border bg-muted/20 p-4 text-sm">
              {item.description || "-"}
            </div>
          </div>

          <div className="grid gap-3 sm:grid-cols-3">
            <SummaryItem label="Tasks" value={item._count?.tasks ?? 0} />

            <SummaryItem
              label="Deliverables"
              value={item._count?.deliverables ?? 0}
            />

            <SummaryItem
              label="Performance"
              value={item._count?.performanceMetrics ?? 0}
            />
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}

interface DetailItemProps {
  icon: React.ElementType;
  label: string;
  value: React.ReactNode;
}

function DetailItem({ icon: Icon, label, value }: DetailItemProps) {
  return (
    <div className="flex items-start gap-3">
      <div className="rounded-md bg-muted p-2">
        <Icon className="size-4 text-muted-foreground" />
      </div>

      <div className="min-w-0">
        <p className="text-xs text-muted-foreground">{label}</p>

        <p className="mt-1 break-words text-sm font-medium">{value}</p>
      </div>
    </div>
  );
}

function SummaryItem({ label, value }: { label: string; value: number }) {
  return (
    <div className="rounded-xl border p-4">
      <p className="text-xs text-muted-foreground">{label}</p>

      <p className="mt-1 text-xl font-semibold">{value}</p>
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
