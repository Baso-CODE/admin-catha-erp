"use client";

import { Eye, MoreHorizontal, Pencil, Search, Trash2 } from "lucide-react";
import { useCallback, useEffect, useState } from "react";
import { toast } from "sonner";

import {
  WorkflowTemplateItem,
  workflowTemplateService,
} from "@/app/services/workflowTemplate.service";
import { PermissionGuard } from "@/components/shared/permission-guard";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Input } from "@/components/ui/input";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { useDebounce } from "@/hooks/useDebounce";
import { ConfirmDeleteDialog } from "../../crm/[id]/components/confirm-delete-dialog";
import { CreateWorkflowTemplateModal } from "./create-workflow-template-modal";
import { EditWorkflowTemplateModal } from "./edit-workflow-template-modal";
import { WorkflowTemplateDetailModal } from "./workflow-template-detail-modal";

interface WorkflowTemplateTableProps {
  permissions: string[];
}

export function WorkflowTemplateTable({
  permissions,
}: WorkflowTemplateTableProps) {
  const [items, setItems] = useState<WorkflowTemplateItem[]>([]);
  const [search, setSearch] = useState("");
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [isLoading, setIsLoading] = useState(true);

  const debouncedSearch = useDebounce(search, 600);

  const loadData = useCallback(async () => {
    try {
      setIsLoading(true);

      const response = await workflowTemplateService.getAll({
        search: debouncedSearch || undefined,
        page,
        limit: 10,
      });

      setItems(response.data);
      setTotalPages(response.meta.totalPages || 1);
    } catch (error) {
      toast.error("Gagal mengambil workflow template.", {
        description:
          error instanceof Error
            ? error.message
            : "Terjadi kesalahan pada server.",
      });
    } finally {
      setIsLoading(false);
    }
  }, [debouncedSearch, page]);

  useEffect(() => {
    void loadData();
  }, [loadData]);

  useEffect(() => {
    setPage(1);
  }, [debouncedSearch]);

  const handleDelete = async (id: string) => {
    try {
      await workflowTemplateService.remove(id);

      toast.success("Workflow template berhasil dihapus.");

      await loadData();
    } catch (error) {
      toast.error("Gagal menghapus workflow template.", {
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
        <div className="relative w-full sm:max-w-sm">
          <Search className="absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            value={search}
            onChange={(event) => setSearch(event.target.value)}
            placeholder="Cari workflow template..."
            className="pl-9"
          />
        </div>

        <PermissionGuard
          permissions={permissions}
          required="workflow.template.create">
          <CreateWorkflowTemplateModal onSuccess={loadData} />
        </PermissionGuard>
      </div>

      <div className="rounded-xl border">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Workflow</TableHead>
              <TableHead>Steps</TableHead>
              <TableHead>Master Service</TableHead>
              <TableHead>Instance</TableHead>
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
                  Workflow template belum tersedia.
                </TableCell>
              </TableRow>
            ) : (
              items.map((item) => (
                <TableRow key={item.id}>
                  <TableCell>
                    <div>
                      <p className="font-medium">{item.name}</p>

                      {item.description && (
                        <p className="line-clamp-1 max-w-md text-xs text-muted-foreground">
                          {item.description}
                        </p>
                      )}
                    </div>
                  </TableCell>

                  <TableCell>
                    <div className="flex flex-wrap gap-1.5">
                      {item.steps
                        .slice()
                        .sort((a, b) => a.order - b.order)
                        .slice(0, 3)
                        .map((step) => (
                          <span
                            key={step.key}
                            className="rounded-md bg-muted px-2 py-1 text-xs">
                            {step.order}. {step.name}
                          </span>
                        ))}

                      {item.steps.length > 3 && (
                        <span className="rounded-md bg-muted px-2 py-1 text-xs text-muted-foreground">
                          +{item.steps.length - 3}
                        </span>
                      )}
                    </div>
                  </TableCell>

                  <TableCell>{item._count?.masterServices ?? 0}</TableCell>

                  <TableCell>{item._count?.instances ?? 0}</TableCell>

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
                        <WorkflowTemplateDetailModal
                          item={item}
                          trigger={
                            <DropdownMenuItem
                              onSelect={(event) => event.preventDefault()}>
                              <Eye className="mr-2 size-4" />
                              Lihat Detail
                            </DropdownMenuItem>
                          }
                        />

                        <PermissionGuard
                          permissions={permissions}
                          required="workflow.template.update">
                          <EditWorkflowTemplateModal
                            item={item}
                            onSuccess={loadData}
                            trigger={
                              <DropdownMenuItem
                                onSelect={(event) => event.preventDefault()}>
                                <Pencil className="mr-2 size-4" />
                                Edit Workflow
                              </DropdownMenuItem>
                            }
                          />
                        </PermissionGuard>

                        <PermissionGuard
                          permissions={permissions}
                          required="workflow.template.delete">
                          <ConfirmDeleteDialog
                            title="Hapus Workflow Template"
                            description={`Workflow template "${item.name}" akan dihapus. Tindakan ini tidak dapat dibatalkan.`}
                            onConfirm={() => handleDelete(item.id)}
                            trigger={
                              <DropdownMenuItem
                                onSelect={(event) => event.preventDefault()}
                                className="text-destructive focus:text-destructive">
                                <Trash2 className="mr-2 size-4" />
                                Hapus Workflow
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
