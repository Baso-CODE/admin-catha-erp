"use client";

import { Eye, MoreHorizontal, Pencil, Search, Trash2 } from "lucide-react";
import { useCallback, useEffect, useState } from "react";
import { toast } from "sonner";

import {
  MasterServiceItem,
  masterServiceService,
} from "@/app/services/masterService.service";
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
import { useDebounce } from "@/hooks/useDebounce";
import { CreateMasterServiceModal } from "./create-master-service-modal";
import { EditMasterServiceModal } from "./edit-master-service-modal";
import { MasterServiceDetailModal } from "./master-service-detail-modal";

interface MasterServiceTableProps {
  permissions: string[];
}

export function MasterServiceTable({ permissions }: MasterServiceTableProps) {
  const [items, setItems] = useState<MasterServiceItem[]>([]);
  const [search, setSearch] = useState("");
  const [status, setStatus] = useState("all");
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [isLoading, setIsLoading] = useState(true);

  const debouncedSearch = useDebounce(search, 600);

  const loadData = useCallback(async () => {
    try {
      setIsLoading(true);

      const response = await masterServiceService.getAll({
        search: debouncedSearch || undefined,
        isActive: status === "all" ? undefined : status === "active",
        page,
        limit: 10,
      });

      setItems(response.data);
      setTotalPages(response.meta.totalPages || 1);
    } catch (error) {
      toast.error("Gagal mengambil master service.", {
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
      await masterServiceService.remove(id);

      toast.success("Master service berhasil dihapus.");

      await loadData();
    } catch (error) {
      toast.error("Gagal menghapus master service.", {
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
              placeholder="Cari code atau nama service..."
              className="pl-9"
            />
          </div>

          <Select value={status} onValueChange={setStatus}>
            <SelectTrigger className="w-full sm:w-44">
              <SelectValue placeholder="Status" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Semua Status</SelectItem>
              <SelectItem value="active">Aktif</SelectItem>
              <SelectItem value="inactive">Tidak Aktif</SelectItem>
            </SelectContent>
          </Select>
        </div>

        <PermissionGuard
          permissions={permissions}
          required="master.service.create">
          <CreateMasterServiceModal onSuccess={loadData} />
        </PermissionGuard>
      </div>

      <div className="rounded-xl border">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Code</TableHead>
              <TableHead>Service</TableHead>
              <TableHead>Workflow Template</TableHead>
              <TableHead>Status</TableHead>
              <TableHead>Project</TableHead>
              <TableHead className="w-16 text-right">Action</TableHead>
            </TableRow>
          </TableHeader>

          <TableBody>
            {isLoading ? (
              <TableRow>
                <TableCell
                  colSpan={6}
                  className="h-24 text-center text-muted-foreground">
                  Memuat data...
                </TableCell>
              </TableRow>
            ) : items.length === 0 ? (
              <TableRow>
                <TableCell
                  colSpan={6}
                  className="h-24 text-center text-muted-foreground">
                  Master service belum tersedia.
                </TableCell>
              </TableRow>
            ) : (
              items.map((item) => (
                <TableRow key={item.id}>
                  <TableCell className="font-mono text-xs font-medium">
                    {item.code}
                  </TableCell>

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

                  <TableCell>{item.defaultTemplate?.name ?? "-"}</TableCell>

                  <TableCell>
                    <span
                      className={
                        item.isActive
                          ? "inline-flex rounded-full bg-primary/10 px-2.5 py-1 text-xs font-medium text-primary"
                          : "inline-flex rounded-full bg-muted px-2.5 py-1 text-xs font-medium text-muted-foreground"
                      }>
                      {item.isActive ? "Aktif" : "Tidak Aktif"}
                    </span>
                  </TableCell>

                  <TableCell>{item._count?.projectServices ?? 0}</TableCell>

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
                        <MasterServiceDetailModal
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
                          required="master.service.update">
                          <EditMasterServiceModal
                            item={item}
                            onSuccess={loadData}
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
                          required="master.service.delete">
                          <DropdownMenuItem
                            onSelect={(event) => {
                              event.preventDefault();

                              const confirmed = window.confirm(
                                `Hapus master service "${item.name}"?`,
                              );

                              if (confirmed) {
                                void handleDelete(item.id);
                              }
                            }}
                            className="text-destructive focus:text-destructive">
                            <Trash2 className="mr-2 size-4" />
                            Hapus Service
                          </DropdownMenuItem>
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
