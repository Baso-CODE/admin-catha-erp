"use client";

import { MoreHorizontal, Pencil, Trash2 } from "lucide-react";
import { useCallback, useEffect, useState } from "react";
import { toast } from "sonner";

import {
  ProjectServiceItem,
  projectServiceService,
} from "@/app/services/projectService.service";
import { PermissionGuard } from "@/components/shared/permission-guard";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { ConfirmDeleteDialog } from "../../../crm/[id]/components/confirm-delete-dialog";
import { AddProjectServiceModal } from "./add-project-service-modal";
import { EditProjectServiceModal } from "./edit-project-service-modal";

interface ProjectServiceTableProps {
  projectId: string;
  permissions: string[];
  onRefreshProject?: () => void | Promise<void>;
}

export function ProjectServiceTable({
  projectId,
  permissions,
  onRefreshProject,
}: ProjectServiceTableProps) {
  const [items, setItems] = useState<ProjectServiceItem[]>([]);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [isLoading, setIsLoading] = useState(true);

  const loadData = useCallback(async () => {
    try {
      setIsLoading(true);

      const response = await projectServiceService.getAll({
        projectId,
        page,
        limit: 10,
      });

      setItems(response.data);
      setTotalPages(response.meta.totalPages || 1);
    } catch (error) {
      toast.error("Gagal mengambil project service.", {
        description:
          error instanceof Error
            ? error.message
            : "Terjadi kesalahan pada server.",
      });
    } finally {
      setIsLoading(false);
    }
  }, [projectId, page]);

  useEffect(() => {
    void loadData();
  }, [loadData]);

  const handleRefresh = async () => {
    await loadData();
    await onRefreshProject?.();
  };

  const handleDelete = async (id: string) => {
    try {
      await projectServiceService.remove(id);

      toast.success("Project service berhasil dihapus.");

      await handleRefresh();
    } catch (error) {
      toast.error("Gagal menghapus project service.", {
        description:
          error instanceof Error
            ? error.message
            : "Terjadi kesalahan pada server.",
      });
    }
  };

  return (
    <div className="space-y-4">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h3 className="font-semibold">Project Services</h3>

          <p className="text-sm text-muted-foreground">
            Layanan yang digunakan dalam project dan workflow yang berjalan.
          </p>
        </div>

        <PermissionGuard
          permissions={permissions}
          required="project.service.create">
          <AddProjectServiceModal
            projectId={projectId}
            onSuccess={handleRefresh}
          />
        </PermissionGuard>
      </div>

      <div className="rounded-xl border">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Service</TableHead>
              <TableHead>Periode</TableHead>
              <TableHead>Workflow</TableHead>
              <TableHead>Current Step</TableHead>
              <TableHead className="w-16 text-right">Action</TableHead>
            </TableRow>
          </TableHeader>

          <TableBody>
            {isLoading ? (
              <TableRow>
                <TableCell
                  colSpan={5}
                  className="h-24 text-center text-muted-foreground">
                  Memuat data...
                </TableCell>
              </TableRow>
            ) : items.length === 0 ? (
              <TableRow>
                <TableCell
                  colSpan={5}
                  className="h-24 text-center text-muted-foreground">
                  Project belum memiliki service.
                </TableCell>
              </TableRow>
            ) : (
              items.map((item) => (
                <TableRow key={item.id}>
                  <TableCell>
                    <div>
                      <p className="font-medium">
                        {item.masterService?.name ?? "-"}
                      </p>

                      <p className="font-mono text-xs text-muted-foreground">
                        {item.masterService?.code ?? "-"}
                      </p>
                    </div>
                  </TableCell>

                  <TableCell>
                    <div className="text-sm">
                      <p>{item.startDate ? formatDate(item.startDate) : "-"}</p>

                      <p className="text-xs text-muted-foreground">
                        s/d {item.endDate ? formatDate(item.endDate) : "-"}
                      </p>
                    </div>
                  </TableCell>

                  <TableCell>
                    {item.workflowInstance ? (
                      <WorkflowStatusBadge
                        status={item.workflowInstance.status}
                      />
                    ) : (
                      <span className="text-sm text-muted-foreground">
                        Tanpa workflow
                      </span>
                    )}
                  </TableCell>

                  <TableCell>
                    {item.workflowInstance?.currentStepKey ? (
                      <span className="rounded-md bg-muted px-2 py-1 font-mono text-xs">
                        {item.workflowInstance.currentStepKey}
                      </span>
                    ) : (
                      "-"
                    )}
                  </TableCell>

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
                        <PermissionGuard
                          permissions={permissions}
                          required="project.service.update">
                          <EditProjectServiceModal
                            item={item}
                            onSuccess={handleRefresh}
                            trigger={
                              <DropdownMenuItem
                                onSelect={(event) => event.preventDefault()}>
                                <Pencil className="mr-2 size-4" />
                                Edit Service
                              </DropdownMenuItem>
                            }
                          />
                        </PermissionGuard>

                        <PermissionGuard
                          permissions={permissions}
                          required="project.service.delete">
                          <ConfirmDeleteDialog
                            title="Hapus Project Service"
                            description={`Service "${item.masterService?.name ?? "ini"}" akan dihapus dari project.`}
                            onConfirm={() => handleDelete(item.id)}
                            trigger={
                              <DropdownMenuItem
                                onSelect={(event) => event.preventDefault()}
                                className="text-destructive focus:text-destructive">
                                <Trash2 className="mr-2 size-4" />
                                Hapus Service
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

      {totalPages > 1 && (
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
      )}
    </div>
  );
}

function WorkflowStatusBadge({
  status,
}: {
  status: ProjectServiceItem["workflowInstance"] extends
    | infer T
    | null
    | undefined
    ? T extends { status: infer S }
      ? S
      : never
    : never;
}) {
  const label: Record<string, string> = {
    RUNNING: "Running",
    PAUSED: "Paused",
    COMPLETED: "Completed",
    CANCELLED: "Cancelled",
  };

  return (
    <span className="inline-flex rounded-full bg-muted px-2.5 py-1 text-xs font-medium">
      {label[String(status)] ?? String(status)}
    </span>
  );
}

function formatDate(value: string) {
  return new Intl.DateTimeFormat("id-ID", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  }).format(new Date(value));
}
