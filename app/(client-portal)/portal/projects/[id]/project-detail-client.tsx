"use client";

import {
  ArrowLeft,
  CalendarDays,
  CheckCircle2,
  Clock3,
  FileText,
  UserRound,
} from "lucide-react";
import Link from "next/link";
import { useCallback, useEffect, useState } from "react";
import { toast } from "sonner";

import {
  ClientProjectDetail,
  clientPortalService,
} from "@/app/services/client-portal.service";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";

interface ClientProjectDetailPageProps {
  projectId: string;
}

export function ClientProjectDetailPage({
  projectId,
}: ClientProjectDetailPageProps) {
  const [project, setProject] = useState<ClientProjectDetail | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  const loadProject = useCallback(async () => {
    try {
      setIsLoading(true);

      const response = await clientPortalService.getProjectById(projectId);

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
      <div className="p-6 text-sm text-muted-foreground">
        Memuat detail project...
      </div>
    );
  }

  if (!project) {
    return (
      <div className="p-6 text-sm text-muted-foreground">
        Project tidak ditemukan.
      </div>
    );
  }

  return (
    <div className="space-y-6 p-6">
      <Button variant="ghost" size="sm" asChild className="-ml-3">
        <Link href="/portal/projects">
          <ArrowLeft className="mr-2 size-4" />
          Kembali ke Project
        </Link>
      </Button>

      <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
        <div>
          <div className="flex flex-wrap items-center gap-2">
            <h1 className="text-2xl font-semibold tracking-tight">
              {project.name}
            </h1>

            <ProjectStatusBadge status={project.status} />
          </div>

          <p className="mt-1 font-mono text-xs text-muted-foreground">
            {project.projectCode}
          </p>

          <p className="mt-3 max-w-3xl text-sm text-muted-foreground">
            {project.description || "Tidak ada deskripsi project."}
          </p>
        </div>

        <Badge variant="outline">{project.projectType}</Badge>
      </div>

      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
        <InfoCard
          title="Project Manager"
          value={project.projectManager.name}
          description={project.projectManager.email}
          icon={UserRound}
        />

        <InfoCard
          title="Mulai Project"
          value={formatDate(project.startDate)}
          description="Tanggal mulai"
          icon={CalendarDays}
        />

        <InfoCard
          title="Target Selesai"
          value={formatDate(project.targetEndDate)}
          description="Target penyelesaian"
          icon={Clock3}
        />

        <InfoCard
          title="Deliverables"
          value={String(project._count.deliverables)}
          description={`${project._count.services} service aktif`}
          icon={FileText}
        />
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Services</CardTitle>
          <CardDescription>
            Layanan yang sedang dikerjakan dalam project ini.
          </CardDescription>
        </CardHeader>

        <CardContent>
          {project.services.length === 0 ? (
            <div className="py-8 text-center text-sm text-muted-foreground">
              Belum ada service pada project ini.
            </div>
          ) : (
            <div className="grid gap-4 md:grid-cols-2">
              {project.services.map((service) => (
                <div key={service.id} className="rounded-xl border p-4">
                  <div className="flex items-start justify-between gap-3">
                    <div>
                      <p className="font-medium">
                        {service.masterService.name}
                      </p>

                      <p className="mt-1 font-mono text-xs text-muted-foreground">
                        {service.masterService.code}
                      </p>
                    </div>

                    <ServiceStatusBadge status={service.status} />
                  </div>

                  <p className="mt-3 text-sm text-muted-foreground">
                    {service.masterService.description ||
                      "Tidak ada deskripsi service."}
                  </p>

                  <div className="mt-4 grid grid-cols-2 gap-3 text-sm">
                    <div>
                      <p className="text-xs text-muted-foreground">Mulai</p>

                      <p>
                        {service.startDate
                          ? formatDate(service.startDate)
                          : "-"}
                      </p>
                    </div>

                    <div>
                      <p className="text-xs text-muted-foreground">Selesai</p>

                      <p>
                        {service.endDate ? formatDate(service.endDate) : "-"}
                      </p>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Deliverables</CardTitle>

          <CardDescription>
            Hasil pekerjaan yang tersedia untuk project ini.
          </CardDescription>
        </CardHeader>

        <CardContent>
          {project.deliverables.length === 0 ? (
            <div className="py-8 text-center text-sm text-muted-foreground">
              Belum ada deliverable.
            </div>
          ) : (
            <div className="space-y-3">
              {project.deliverables.map((deliverable) => (
                <div
                  key={deliverable.id}
                  className="flex flex-col gap-4 rounded-xl border p-4 lg:flex-row lg:items-center lg:justify-between">
                  <div className="flex items-start gap-3">
                    <div className="rounded-lg bg-muted p-2">
                      <FileText className="size-5" />
                    </div>

                    <div>
                      <div className="flex flex-wrap items-center gap-2">
                        <p className="font-medium">{deliverable.name}</p>

                        <Badge variant="outline">v{deliverable.version}</Badge>

                        <DeliverableStatusBadge status={deliverable.status} />
                      </div>

                      <p className="mt-1 text-sm text-muted-foreground">
                        {deliverable.description ||
                          "Tidak ada deskripsi deliverable."}
                      </p>

                      <div className="mt-2 flex flex-wrap gap-x-5 gap-y-1 text-xs text-muted-foreground">
                        <span>Dibuat {formatDate(deliverable.createdAt)}</span>

                        {deliverable.dueDate && (
                          <span>Due {formatDate(deliverable.dueDate)}</span>
                        )}

                        {deliverable.approvedAt && (
                          <span>
                            Approved {formatDate(deliverable.approvedAt)}
                          </span>
                        )}
                      </div>
                    </div>
                  </div>

                  {deliverable.fileUrl && (
                    <Button variant="outline" asChild>
                      <a
                        href={deliverable.fileUrl}
                        target="_blank"
                        rel="noreferrer">
                        <FileText className="mr-2 size-4" />
                        Lihat File
                      </a>
                    </Button>
                  )}
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}

interface InfoCardProps {
  title: string;
  value: string;
  description: string;
  icon: React.ComponentType<{
    className?: string;
  }>;
}

function InfoCard({ title, value, description, icon: Icon }: InfoCardProps) {
  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
        <CardTitle className="text-sm font-medium">{title}</CardTitle>

        <Icon className="size-4 text-muted-foreground" />
      </CardHeader>

      <CardContent>
        <div className="truncate text-lg font-semibold">{value}</div>

        <p className="truncate text-xs text-muted-foreground">{description}</p>
      </CardContent>
    </Card>
  );
}

function ProjectStatusBadge({ status }: { status: string }) {
  return (
    <Badge variant="outline" className={getStatusClass(status)}>
      {formatStatus(status)}
    </Badge>
  );
}

function ServiceStatusBadge({ status }: { status: string }) {
  return (
    <Badge variant="outline" className={getStatusClass(status)}>
      {formatStatus(status)}
    </Badge>
  );
}

function DeliverableStatusBadge({ status }: { status: string }) {
  const icon =
    status === "APPROVED" ? <CheckCircle2 className="mr-1 size-3" /> : null;

  return (
    <Badge variant="outline" className={getStatusClass(status)}>
      {icon}
      {formatStatus(status)}
    </Badge>
  );
}

function getStatusClass(status: string) {
  if (status === "COMPLETED" || status === "APPROVED" || status === "ACTIVE") {
    return "border-emerald-200 bg-emerald-50 text-emerald-700";
  }

  if (status === "CANCELLED" || status === "REJECTED") {
    return "border-red-200 bg-red-50 text-red-700";
  }

  if (
    status === "ON_HOLD" ||
    status === "PAUSED" ||
    status === "CLIENT_REVISION" ||
    status === "REVISION_REQUIRED"
  ) {
    return "border-amber-200 bg-amber-50 text-amber-700";
  }

  return "border-blue-200 bg-blue-50 text-blue-700";
}

function formatStatus(value: string) {
  return value
    .toLowerCase()
    .split("_")
    .map((item) => item.charAt(0).toUpperCase() + item.slice(1))
    .join(" ");
}

function formatDate(value: string) {
  return new Intl.DateTimeFormat("id-ID", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  }).format(new Date(value));
}
