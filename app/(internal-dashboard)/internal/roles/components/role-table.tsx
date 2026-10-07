"use client";

import {
  KeyRound,
  MoreHorizontal,
  Pencil,
  Search,
  ShieldCheck,
  Trash2,
} from "lucide-react";
import { useCallback, useEffect, useState } from "react";
import { toast } from "sonner";

import { RoleItem, roleService } from "@/app/services/role.service";
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
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";

import Link from "next/link";
import { ConfirmDeleteDialog } from "../../crm/[id]/components/confirm-delete-dialog";
import { CreateRoleModal } from "./create-role-modal";
import { EditRoleModal } from "./edit-role-modal";

interface RoleTableProps {
  permissions: string[];
}

export function RoleTable({ permissions }: RoleTableProps) {
  const [items, setItems] = useState<RoleItem[]>([]);
  const [search, setSearch] = useState("");
  const [isLoading, setIsLoading] = useState(true);

  const loadData = useCallback(async () => {
    try {
      setIsLoading(true);

      const response = await roleService.getRoles();

      setItems(response.data);
    } catch (error) {
      toast.error("Gagal mengambil data role.", {
        description:
          error instanceof Error
            ? error.message
            : "Terjadi kesalahan pada server.",
      });
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    void loadData();
  }, [loadData]);

  const filteredItems = items.filter((item) => {
    const keyword = search.toLowerCase().trim();

    if (!keyword) return true;

    return (
      item.name.toLowerCase().includes(keyword) ||
      item.code.toLowerCase().includes(keyword) ||
      item.description?.toLowerCase().includes(keyword)
    );
  });

  const handleDelete = async (role: RoleItem) => {
    try {
      await roleService.deleteRole(role.id);

      toast.success("Role berhasil dihapus.");

      await loadData();
    } catch (error) {
      toast.error("Gagal menghapus role.", {
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
        <div className="relative w-full sm:max-w-sm">
          <Search className="absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />

          <Input
            value={search}
            onChange={(event) => setSearch(event.target.value)}
            placeholder="Cari role..."
            className="pl-9"
          />
        </div>

        <PermissionGuard permissions={permissions} required="admin.role.create">
          <CreateRoleModal onSuccess={loadData} />
        </PermissionGuard>
      </div>

      <div className="rounded-xl border">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Role</TableHead>
              <TableHead>Deskripsi</TableHead>
              <TableHead>Type</TableHead>
              <TableHead>Status</TableHead>
              <TableHead>Permission</TableHead>
              <TableHead>User</TableHead>
              <TableHead className="w-16 text-right">Action</TableHead>
            </TableRow>
          </TableHeader>

          <TableBody>
            {isLoading ? (
              <TableRow>
                <TableCell
                  colSpan={7}
                  className="h-24 text-center text-muted-foreground">
                  Memuat data role...
                </TableCell>
              </TableRow>
            ) : filteredItems.length === 0 ? (
              <TableRow>
                <TableCell
                  colSpan={7}
                  className="h-24 text-center text-muted-foreground">
                  Role tidak ditemukan.
                </TableCell>
              </TableRow>
            ) : (
              filteredItems.map((item) => (
                <TableRow key={item.id}>
                  <TableCell>
                    <div className="font-medium">{item.name}</div>

                    <div className="font-mono text-xs text-muted-foreground">
                      {item.code}
                    </div>
                  </TableCell>

                  <TableCell className="max-w-80">
                    <p className="truncate text-sm text-muted-foreground">
                      {item.description || "-"}
                    </p>
                  </TableCell>

                  <TableCell>
                    <Badge variant={item.isSystem ? "default" : "outline"}>
                      {item.isSystem ? "System" : "Custom"}
                    </Badge>
                  </TableCell>

                  <TableCell>
                    <Badge variant={item.isActive ? "default" : "secondary"}>
                      {item.isActive ? "Active" : "Inactive"}
                    </Badge>
                  </TableCell>

                  <TableCell>
                    <div className="flex items-center gap-2">
                      <ShieldCheck className="size-4 text-muted-foreground" />

                      {item._count?.permissions ?? 0}
                    </div>
                  </TableCell>

                  <TableCell>{item._count?.users ?? 0}</TableCell>

                  <TableCell className="text-right">
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button variant="ghost" size="icon">
                          <MoreHorizontal className="size-4" />
                        </Button>
                      </DropdownMenuTrigger>

                      <DropdownMenuContent
                        align="end"
                        className="min-w-[180px]">
                        {" "}
                        <PermissionGuard
                          permissions={permissions}
                          required="admin.role.read">
                          <DropdownMenuItem asChild>
                            <Link href={`/internal/roles/${item.id}`}>
                              <KeyRound className="mr-2 size-4" />
                              Kelola Permission
                            </Link>
                          </DropdownMenuItem>
                        </PermissionGuard>
                        <PermissionGuard
                          permissions={permissions}
                          required="admin.role.update">
                          <EditRoleModal
                            role={item}
                            onSuccess={loadData}
                            trigger={
                              <DropdownMenuItem
                                onSelect={(event) => event.preventDefault()}>
                                <Pencil className="mr-2 size-4" />
                                Edit Role
                              </DropdownMenuItem>
                            }
                          />
                        </PermissionGuard>
                        {!item.isSystem && (
                          <PermissionGuard
                            permissions={permissions}
                            required="admin.role.delete">
                            <ConfirmDeleteDialog
                              title="Hapus Role"
                              description={`Role "${item.name}" akan dihapus. Tindakan ini tidak dapat dibatalkan.`}
                              onConfirm={() => handleDelete(item)}
                              trigger={
                                <DropdownMenuItem
                                  onSelect={(event) => event.preventDefault()}
                                  className="text-destructive focus:text-destructive">
                                  <Trash2 className="mr-2 size-4" />
                                  Hapus Role
                                </DropdownMenuItem>
                              }
                            />
                          </PermissionGuard>
                        )}
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </div>
    </div>
  );
}
