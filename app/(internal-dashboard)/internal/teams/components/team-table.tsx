"use client";

import {
  MoreHorizontal,
  Pencil,
  Search,
  Trash2,
  UserRoundCog,
  Users,
} from "lucide-react";
import { useCallback, useEffect, useState } from "react";
import { toast } from "sonner";

import { TeamItem, teamService } from "@/app/services/team.service";
import { PermissionGuard } from "@/components/shared/permission-guard";
import { Badge } from "@/components/ui/badge";
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
import Link from "next/link";
import { ConfirmDeleteDialog } from "../../crm/[id]/components/confirm-delete-dialog";
import { CreateTeamModal } from "./create-team-modal";
import { EditTeamModal } from "./edit-team-modal";

interface TeamTableProps {
  permissions: string[];
}

export function TeamTable({ permissions }: TeamTableProps) {
  const [items, setItems] = useState<TeamItem[]>([]);
  const [search, setSearch] = useState("");
  const [status, setStatus] = useState("all");
  const [page, setPage] = useState(1);
  const [total, setTotal] = useState(0);
  const [totalPages, setTotalPages] = useState(1);
  const [isLoading, setIsLoading] = useState(true);

  const debouncedSearch = useDebounce(search, 500);

  const loadData = useCallback(async () => {
    try {
      setIsLoading(true);

      const response = await teamService.getAll({
        search: debouncedSearch || undefined,
        isActive: status === "all" ? undefined : status === "active",
        page,
        limit: 10,
      });

      setItems(response.data);
      setTotal(response.meta.total);
      setTotalPages(Math.max(response.meta.totalPages, 1));
    } catch (error) {
      toast.error("Gagal mengambil data team.", {
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

  const handleDelete = async (item: TeamItem) => {
    try {
      await teamService.delete(item.id);

      toast.success("Team berhasil dihapus.");

      await loadData();
    } catch (error) {
      toast.error("Gagal menghapus team.", {
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
              placeholder="Cari team..."
              className="pl-9"
            />
          </div>

          <Select value={status} onValueChange={setStatus}>
            <SelectTrigger className="w-full sm:w-48">
              <SelectValue placeholder="Status" />
            </SelectTrigger>

            <SelectContent>
              <SelectItem value="all">Semua Status</SelectItem>

              <SelectItem value="active">Active</SelectItem>

              <SelectItem value="inactive">Inactive</SelectItem>
            </SelectContent>
          </Select>
        </div>

        <PermissionGuard permissions={permissions} required="admin.team.create">
          <CreateTeamModal onSuccess={loadData} />
        </PermissionGuard>
      </div>

      <div className="rounded-xl border">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Team</TableHead>
              <TableHead>Deskripsi</TableHead>
              <TableHead>Anggota</TableHead>
              <TableHead>Status</TableHead>
              <TableHead>Dibuat</TableHead>
              <TableHead className="w-16 text-right">Action</TableHead>
            </TableRow>
          </TableHeader>

          <TableBody>
            {isLoading ? (
              <TableRow>
                <TableCell
                  colSpan={6}
                  className="h-24 text-center text-muted-foreground">
                  Memuat data team...
                </TableCell>
              </TableRow>
            ) : items.length === 0 ? (
              <TableRow>
                <TableCell
                  colSpan={6}
                  className="h-24 text-center text-muted-foreground">
                  Team belum tersedia.
                </TableCell>
              </TableRow>
            ) : (
              items.map((item) => (
                <TableRow key={item.id}>
                  <TableCell>
                    <div className="font-medium">{item.name}</div>

                    <div className="font-mono text-xs text-muted-foreground">
                      {item.id}
                    </div>
                  </TableCell>

                  <TableCell className="max-w-80">
                    <p className="truncate text-sm text-muted-foreground">
                      {item.description || "-"}
                    </p>
                  </TableCell>

                  <TableCell>
                    <div className="flex items-center gap-2">
                      <Users className="size-4 text-muted-foreground" />

                      <span className="font-medium">
                        {item._count?.members ?? 0}
                      </span>
                    </div>
                  </TableCell>

                  <TableCell>
                    <Badge variant={item.isActive ? "default" : "secondary"}>
                      {item.isActive ? "Active" : "Inactive"}
                    </Badge>
                  </TableCell>

                  <TableCell>{formatDate(item.createdAt)}</TableCell>

                  <TableCell className="text-right">
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button variant="ghost" size="icon">
                          <MoreHorizontal className="size-4" />
                        </Button>
                      </DropdownMenuTrigger>

                      <DropdownMenuContent align="end" className="min-w-40">
                        <PermissionGuard
                          permissions={permissions}
                          required="admin.team.manage_member">
                          <DropdownMenuItem asChild>
                            <Link href={`/internal/teams/${item.id}`}>
                              <UserRoundCog className="mr-2 size-4" />
                              Kelola Anggota
                            </Link>
                          </DropdownMenuItem>
                        </PermissionGuard>
                        <PermissionGuard
                          permissions={permissions}
                          required="admin.team.update">
                          <EditTeamModal
                            team={item}
                            onSuccess={loadData}
                            trigger={
                              <DropdownMenuItem
                                onSelect={(event) => event.preventDefault()}>
                                <Pencil className="mr-2 size-4" />
                                Edit Team
                              </DropdownMenuItem>
                            }
                          />
                        </PermissionGuard>

                        <PermissionGuard
                          permissions={permissions}
                          required="admin.team.delete">
                          <ConfirmDeleteDialog
                            title="Hapus Team"
                            description={`Team "${item.name}" akan dihapus. Tindakan ini tidak dapat dibatalkan.`}
                            onConfirm={() => handleDelete(item)}
                            trigger={
                              <DropdownMenuItem
                                onSelect={(event) => event.preventDefault()}
                                className="text-destructive focus:text-destructive">
                                <Trash2 className="mr-2 size-4" />
                                Hapus Team
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

      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <p className="text-sm text-muted-foreground">
          {total} team · Halaman {page} dari {totalPages}
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
