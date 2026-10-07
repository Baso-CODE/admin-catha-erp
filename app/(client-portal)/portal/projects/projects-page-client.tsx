"use client";

import { ChevronLeft, ChevronRight, Eye, Search } from "lucide-react";
import Link from "next/link";
import { useCallback, useEffect, useState } from "react";
import { toast } from "sonner";

import {
  ClientProjectItem,
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
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";

const PROJECT_STATUSES = [
  "DRAFT",
  "PLANNING",
  "IN_PROGRESS",
  "INTERNAL_REVIEW",
  "PENDING_CLIENT_APPROVAL",
  "CLIENT_REVISION",
  "APPROVED",
  "COMPLETED",
  "ON_HOLD",
  "CANCELLED",
] as const;

export function ClientProjectsPage() {
  const [projects, setProjects] = useState<ClientProjectItem[]>([]);
  const [search, setSearch] = useState("");
  const [debouncedSearch, setDebouncedSearch] = useState("");
  const [status, setStatus] = useState("ALL");
  const [page, setPage] = useState(1);
  const [limit] = useState(10);
  const [total, setTotal] = useState(0);
  const [totalPages, setTotalPages] = useState(0);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const timer = window.setTimeout(() => {
      setDebouncedSearch(search.trim());
      setPage(1);
    }, 400);

    return () => window.clearTimeout(timer);
  }, [search]);

  const loadProjects = useCallback(async () => {
    try {
      setIsLoading(true);

      const response = await clientPortalService.getProjects({
        search: debouncedSearch || undefined,
        status: status === "ALL" ? undefined : status,
        page,
        limit,
      });

      setProjects(response.data);
      setTotal(response.meta.total);
      setTotalPages(response.meta.totalPages);
    } catch (error) {
      toast.error("Gagal mengambil project.", {
        description:
          error instanceof Error
            ? error.message
            : "Terjadi kesalahan pada server.",
      });
    } finally {
      setIsLoading(false);
    }
  }, [debouncedSearch, status, page, limit]);

  useEffect(() => {
    void loadProjects();
  }, [loadProjects]);

  const handleStatusChange = (value: string) => {
    setStatus(value);
    setPage(1);
  };

  return (
    <div className="space-y-6 p-6">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight">My Projects</h1>

        <p className="text-sm text-muted-foreground">
          Lihat semua project perusahaan Anda beserta status dan progress-nya.
        </p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Projects</CardTitle>

          <CardDescription>Total {total} project.</CardDescription>
        </CardHeader>

        <CardContent className="space-y-4">
          <div className="flex flex-col gap-3 sm:flex-row">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />

              <Input
                value={search}
                onChange={(event) => setSearch(event.target.value)}
                placeholder="Cari nama atau kode project..."
                className="pl-9"
              />
            </div>

            <Select value={status} onValueChange={handleStatusChange}>
              <SelectTrigger className="w-full sm:w-56">
                <SelectValue placeholder="Semua status" />
              </SelectTrigger>

              <SelectContent>
                <SelectItem value="ALL">Semua Status</SelectItem>

                {PROJECT_STATUSES.map((item) => (
                  <SelectItem key={item} value={item}>
                    {formatStatus(item)}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="rounded-lg border">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Project</TableHead>
                  <TableHead>Type</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Project Manager</TableHead>
                  <TableHead>Service</TableHead>
                  <TableHead>Deliverable</TableHead>
                  <TableHead>Periode</TableHead>
                  <TableHead className="w-16 text-right">Action</TableHead>
                </TableRow>
              </TableHeader>

              <TableBody>
                {isLoading ? (
                  <TableRow>
                    <TableCell
                      colSpan={8}
                      className="h-28 text-center text-muted-foreground">
                      Memuat project...
                    </TableCell>
                  </TableRow>
                ) : projects.length === 0 ? (
                  <TableRow>
                    <TableCell
                      colSpan={8}
                      className="h-28 text-center text-muted-foreground">
                      Project tidak ditemukan.
                    </TableCell>
                  </TableRow>
                ) : (
                  projects.map((project) => (
                    <TableRow key={project.id}>
                      <TableCell>
                        <div className="font-medium">{project.name}</div>

                        <div className="text-xs text-muted-foreground">
                          {project.projectCode}
                        </div>
                      </TableCell>

                      <TableCell>{project.projectType}</TableCell>

                      <TableCell>
                        <ProjectStatusBadge status={project.status} />
                      </TableCell>

                      <TableCell>{project.projectManager.name}</TableCell>

                      <TableCell>{project._count.services}</TableCell>

                      <TableCell>{project._count.deliverables}</TableCell>

                      <TableCell>
                        <div className="text-sm">
                          {formatDate(project.startDate)}
                        </div>

                        <div className="text-xs text-muted-foreground">
                          s/d {formatDate(project.targetEndDate)}
                        </div>
                      </TableCell>

                      <TableCell className="text-right">
                        <Button size="icon" variant="ghost" asChild>
                          <Link href={`/portal/projects/${project.id}`}>
                            <Eye className="size-4" />
                          </Link>
                        </Button>
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </div>

          <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
            <p className="text-sm text-muted-foreground">
              Halaman {totalPages === 0 ? 0 : page} dari {totalPages}
            </p>

            <div className="flex items-center gap-2">
              <Button
                variant="outline"
                size="sm"
                disabled={page <= 1 || isLoading}
                onClick={() => setPage((current) => Math.max(1, current - 1))}>
                <ChevronLeft className="size-4" />
                Sebelumnya
              </Button>

              <Button
                variant="outline"
                size="sm"
                disabled={page >= totalPages || totalPages === 0 || isLoading}
                onClick={() => setPage((current) => current + 1)}>
                Selanjutnya
                <ChevronRight className="size-4" />
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

function ProjectStatusBadge({ status }: { status: string }) {
  const className =
    status === "COMPLETED" || status === "APPROVED"
      ? "border-emerald-200 bg-emerald-50 text-emerald-700"
      : status === "CANCELLED"
        ? "border-red-200 bg-red-50 text-red-700"
        : status === "ON_HOLD" || status === "CLIENT_REVISION"
          ? "border-amber-200 bg-amber-50 text-amber-700"
          : "border-blue-200 bg-blue-50 text-blue-700";

  return (
    <Badge variant="outline" className={className}>
      {formatStatus(status)}
    </Badge>
  );
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
