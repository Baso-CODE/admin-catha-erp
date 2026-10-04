"use client";

import {
  ExternalLink,
  Eye,
  MoreHorizontal,
  Pencil,
  Search,
  Trash2,
} from "lucide-react";
import { useCallback, useEffect, useState } from "react";
import { toast } from "sonner";

import {
  ProjectItem,
  ProjectStatus,
  projectService,
} from "@/app/services/project.service";

import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
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

import { PermissionGuard } from "@/components/shared/permission-guard";
import { useDebounce } from "@/hooks/useDebounce";
import Link from "next/link";
import { ConfirmDeleteDialog } from "../../crm/[id]/components/confirm-delete-dialog";
import { CreateProjectModal } from "./create-project-modal";
import { EditProjectModal } from "./edit-project-modal";
import { ProjectDetailModal } from "./project-detail-modal";
import { ProjectStatusBadge } from "./project-status-badge";

interface ProjectTableProps {
  permissions: string[];
}

export function ProjectTable({ permissions }: ProjectTableProps) {
  const [items, setItems] = useState<ProjectItem[]>([]);
  const [search, setSearch] = useState("");
  const [status, setStatus] = useState("all");
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [isLoading, setIsLoading] = useState(true);

  const debouncedSearch = useDebounce(search, 500);

  const loadData = useCallback(async () => {
    try {
      setIsLoading(true);

      const response = await projectService.getAll({
        search: debouncedSearch || undefined,
        status: status === "all" ? undefined : (status as ProjectStatus),
        page,
        limit: 10,
      });

      setItems(response.data);
      setTotalPages(response.meta.totalPages || 1);
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
  }, [debouncedSearch, status, page]);

  useEffect(() => {
    void loadData();
  }, [loadData]);

  useEffect(() => {
    setPage(1);
  }, [debouncedSearch, status]);

  const handleDelete = async (id: string) => {
    try {
      await projectService.remove(id);

      toast.success("Project berhasil dihapus.");

      await loadData();
    } catch (error) {
      toast.error("Gagal menghapus project.", {
        description:
          error instanceof Error
            ? error.message
            : "Terjadi kesalahan pada server.",
      });
    }
  };

  return (
    <div className="space-y-4">
      <div className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
        <div className="flex flex-1 flex-col gap-3 sm:flex-row">
          <div className="relative w-full sm:max-w-sm">
            <Search className="absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />

            <Input
              value={search}
              onChange={(event) => setSearch(event.target.value)}
              placeholder="Cari project..."
              className="pl-9"
            />
          </div>

          <Select value={status} onValueChange={setStatus}>
            <SelectTrigger className="w-full sm:w-56">
              <SelectValue placeholder="Status" />
            </SelectTrigger>

            <SelectContent>
              <SelectItem value="all">Semua Status</SelectItem>
              <SelectItem value="DRAFT">Draft</SelectItem>
              <SelectItem value="PLANNING">Planning</SelectItem>
              <SelectItem value="IN_PROGRESS">In Progress</SelectItem>
              <SelectItem value="INTERNAL_REVIEW">Internal Review</SelectItem>
              <SelectItem value="PENDING_CLIENT_APPROVAL">
                Pending Client Approval
              </SelectItem>
              <SelectItem value="CLIENT_REVISION">Client Revision</SelectItem>
              <SelectItem value="APPROVED">Approved</SelectItem>
              <SelectItem value="COMPLETED">Completed</SelectItem>
              <SelectItem value="ON_HOLD">On Hold</SelectItem>
              <SelectItem value="CANCELLED">Cancelled</SelectItem>
            </SelectContent>
          </Select>
        </div>

        <PermissionGuard permissions={permissions} required="project.create">
          <CreateProjectModal onSuccess={loadData} />
        </PermissionGuard>
      </div>

      <div className="rounded-xl border">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Project</TableHead>
              <TableHead>Client</TableHead>
              <TableHead>Project Manager</TableHead>
              <TableHead>Periode</TableHead>
              <TableHead>Status</TableHead>
              <TableHead>Services</TableHead>
              <TableHead className="w-16 text-right">Action</TableHead>
            </TableRow>
          </TableHeader>

          <TableBody>
            {isLoading ? (
              <TableRow>
                <TableCell
                  colSpan={7}
                  className="h-24 text-center text-muted-foreground">
                  Memuat data...
                </TableCell>
              </TableRow>
            ) : items.length === 0 ? (
              <TableRow>
                <TableCell
                  colSpan={7}
                  className="h-24 text-center text-muted-foreground">
                  Project belum tersedia.
                </TableCell>
              </TableRow>
            ) : (
              items.map((item) => (
                <TableRow key={item.id}>
                  <TableCell>
                    <div>
                      <Link
                        href={`/internal/projects/${item.id}`}
                        className="font-medium hover:underline">
                        {item.name}
                      </Link>

                      <p className="font-mono text-xs text-muted-foreground">
                        {item.projectCode}
                      </p>

                      <p className="text-xs text-muted-foreground">
                        {item.projectType}
                      </p>
                    </div>
                  </TableCell>

                  <TableCell>{item.client?.companyName ?? "-"}</TableCell>

                  <TableCell>
                    <div>
                      <p className="text-sm">
                        {item.projectManager?.name ?? "-"}
                      </p>

                      {item.projectManager?.email && (
                        <p className="text-xs text-muted-foreground">
                          {item.projectManager.email}
                        </p>
                      )}
                    </div>
                  </TableCell>

                  <TableCell>
                    <div className="text-sm">
                      <p>{formatDate(item.startDate)}</p>
                      <p className="text-xs text-muted-foreground">
                        s/d {formatDate(item.targetEndDate)}
                      </p>
                    </div>
                  </TableCell>

                  <TableCell>
                    <ProjectStatusBadge status={item.status} />
                  </TableCell>

                  <TableCell>{item._count?.services ?? 0}</TableCell>

                  <TableCell className="text-right">
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button variant="ghost" size="icon">
                          <MoreHorizontal className="size-4" />
                        </Button>
                      </DropdownMenuTrigger>

                      <DropdownMenuContent
                        align="end"
                        className="min-w-44 border bg-popover p-1 shadow-lg">
                        <ProjectDetailModal
                          item={item}
                          trigger={
                            <DropdownMenuItem
                              onSelect={(event) => event.preventDefault()}>
                              <Eye className="mr-2 size-4" />
                              Quick Detail
                            </DropdownMenuItem>
                          }
                        />

                        <DropdownMenuItem asChild>
                          <Link href={`/internal/projects/${item.id}`}>
                            <ExternalLink className="mr-2 size-4" />
                            Lihat Detail Lengkap
                          </Link>
                        </DropdownMenuItem>

                        <PermissionGuard
                          permissions={permissions}
                          required="project.update">
                          <EditProjectModal
                            item={item}
                            onSuccess={loadData}
                            trigger={
                              <DropdownMenuItem
                                onSelect={(event) => event.preventDefault()}>
                                <Pencil className="mr-2 size-4" />
                                Edit Project
                              </DropdownMenuItem>
                            }
                          />
                        </PermissionGuard>

                        <PermissionGuard
                          permissions={permissions}
                          required="project.delete">
                          <ConfirmDeleteDialog
                            title="Hapus Project"
                            description={`Project "${item.name}" akan dihapus. Tindakan ini tidak dapat dibatalkan.`}
                            onConfirm={() => handleDelete(item.id)}
                            trigger={
                              <DropdownMenuItem
                                onSelect={(event) => event.preventDefault()}
                                className="text-destructive focus:text-destructive">
                                <Trash2 className="mr-2 size-4" />
                                Hapus Project
                              </DropdownMenuItem>
                            }
                          />
                        </PermissionGuard>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </div>

      <div className="flex items-center justify-between">
        <p className="text-sm text-muted-foreground">
          Halaman {page} dari {totalPages}
        </p>

        <div className="flex gap-2">
          <Button
            variant="outline"
            size="sm"
            disabled={page <= 1}
            onClick={() => setPage((current) => Math.max(1, current - 1))}>
            Sebelumnya
          </Button>

          <Button
            variant="outline"
            size="sm"
            disabled={page >= totalPages}
            onClick={() =>
              setPage((current) => Math.min(totalPages, current + 1))
            }>
            Selanjutnya
          </Button>
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
