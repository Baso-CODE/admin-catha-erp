"use client";

import { ArrowLeft, Search, Trash2, UserPlus, Users } from "lucide-react";
import Link from "next/link";
import { useCallback, useEffect, useState } from "react";
import { toast } from "sonner";

import {
  TeamItem,
  TeamMemberOption,
  teamService,
} from "@/app/services/team.service";
import { PermissionGuard } from "@/components/shared/permission-guard";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
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
import { ConfirmDeleteDialog } from "../../crm/[id]/components/confirm-delete-dialog";

interface TeamDetailClientProps {
  teamId: string;
  permissions: string[];
}

export function TeamDetailClient({
  teamId,
  permissions,
}: TeamDetailClientProps) {
  const [team, setTeam] = useState<TeamItem | null>(null);
  const [memberOptions, setMemberOptions] = useState<TeamMemberOption[]>([]);
  const [selectedUserId, setSelectedUserId] = useState("");
  const [search, setSearch] = useState("");
  const [isLoading, setIsLoading] = useState(true);
  const [isLoadingOptions, setIsLoadingOptions] = useState(false);
  const [isAdding, setIsAdding] = useState(false);

  const loadTeam = useCallback(async () => {
    try {
      setIsLoading(true);

      const response = await teamService.getById(teamId);

      setTeam(response.data);
    } catch (error) {
      toast.error("Gagal mengambil detail team.", {
        description:
          error instanceof Error
            ? error.message
            : "Terjadi kesalahan pada server.",
      });
    } finally {
      setIsLoading(false);
    }
  }, [teamId]);

  const loadMemberOptions = useCallback(async () => {
    if (!permissions.includes("admin.team.manage_member")) {
      return;
    }

    try {
      setIsLoadingOptions(true);

      const response = await teamService.getMemberOptions(teamId, {
        search: search.trim() || undefined,
        limit: 100,
      });

      setMemberOptions(response.data);
    } catch (error) {
      toast.error("Gagal mengambil kandidat anggota.", {
        description:
          error instanceof Error
            ? error.message
            : "Terjadi kesalahan pada server.",
      });
    } finally {
      setIsLoadingOptions(false);
    }
  }, [teamId, search, permissions]);

  useEffect(() => {
    void loadTeam();
  }, [loadTeam]);

  useEffect(() => {
    const timeout = window.setTimeout(() => {
      void loadMemberOptions();
    }, 400);

    return () => window.clearTimeout(timeout);
  }, [loadMemberOptions]);

  const handleAddMember = async () => {
    if (!selectedUserId) {
      toast.error("Pilih user terlebih dahulu.");
      return;
    }

    try {
      setIsAdding(true);

      await teamService.addMember(teamId, selectedUserId);

      toast.success("Anggota berhasil ditambahkan.");

      setSelectedUserId("");

      await Promise.all([loadTeam(), loadMemberOptions()]);
    } catch (error) {
      toast.error("Gagal menambahkan anggota.", {
        description:
          error instanceof Error
            ? error.message
            : "Terjadi kesalahan pada server.",
      });
    } finally {
      setIsAdding(false);
    }
  };

  const handleRemoveMember = async (userId: string, userName: string) => {
    try {
      await teamService.removeMember(teamId, userId);

      toast.success(`${userName} berhasil dihapus dari team.`);

      await Promise.all([loadTeam(), loadMemberOptions()]);
    } catch (error) {
      toast.error("Gagal menghapus anggota.", {
        description:
          error instanceof Error
            ? error.message
            : "Terjadi kesalahan pada server.",
      });
    }
  };
  if (isLoading) {
    return (
      <div className="p-6 text-sm text-muted-foreground">
        Memuat detail team...
      </div>
    );
  }

  if (!team) {
    return (
      <div className="p-6 text-sm text-muted-foreground">
        Team tidak ditemukan.
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
        <div className="space-y-2">
          <Button variant="ghost" size="sm" asChild className="-ml-3">
            <Link href="/internal/teams">
              <ArrowLeft className="mr-2 size-4" />
              Kembali
            </Link>
          </Button>

          <div>
            <div className="flex flex-wrap items-center gap-2">
              <h1 className="text-2xl font-semibold tracking-tight">
                {team.name}
              </h1>

              <Badge variant={team.isActive ? "default" : "secondary"}>
                {team.isActive ? "Active" : "Inactive"}
              </Badge>
            </div>

            <p className="mt-1 text-sm text-muted-foreground">
              {team.description || "Tidak ada deskripsi team."}
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2 rounded-lg border px-4 py-3">
          <Users className="size-5 text-muted-foreground" />

          <div>
            <p className="text-xs text-muted-foreground">Total Anggota</p>

            <p className="text-lg font-semibold">
              {team._count?.members ?? team.members?.length ?? 0}
            </p>
          </div>
        </div>
      </div>

      <PermissionGuard
        permissions={permissions}
        required="admin.team.manage_member">
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Tambah Anggota</CardTitle>
          </CardHeader>

          <CardContent className="space-y-4">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />

              <Input
                value={search}
                onChange={(event) => setSearch(event.target.value)}
                placeholder="Cari nama atau email..."
                className="pl-9"
              />
            </div>

            <div className="flex flex-col gap-3 sm:flex-row">
              <Select
                value={selectedUserId}
                onValueChange={setSelectedUserId}
                disabled={isLoadingOptions}>
                <SelectTrigger className="flex-1">
                  <SelectValue
                    placeholder={
                      isLoadingOptions ? "Memuat kandidat..." : "Pilih user"
                    }
                  />
                </SelectTrigger>

                <SelectContent>
                  {memberOptions.length > 0 ? (
                    memberOptions.map((user) => (
                      <SelectItem key={user.id} value={user.id}>
                        {user.name} - {user.email}
                      </SelectItem>
                    ))
                  ) : (
                    <SelectItem value="__empty" disabled>
                      Tidak ada kandidat anggota
                    </SelectItem>
                  )}
                </SelectContent>
              </Select>

              <Button
                type="button"
                disabled={isAdding || !selectedUserId}
                onClick={() => void handleAddMember()}>
                <UserPlus className="mr-2 size-4" />

                {isAdding ? "Menambahkan..." : "Tambah Anggota"}
              </Button>
            </div>
          </CardContent>
        </Card>
      </PermissionGuard>

      <Card>
        <CardHeader>
          <CardTitle className="text-base">Anggota Team</CardTitle>
        </CardHeader>

        <CardContent>
          <div className="rounded-lg border">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Nama</TableHead>
                  <TableHead>Email</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Bergabung</TableHead>
                  <TableHead className="w-20 text-right">Aksi</TableHead>
                </TableRow>
              </TableHeader>

              <TableBody>
                {!team.members?.length ? (
                  <TableRow>
                    <TableCell
                      colSpan={5}
                      className="h-24 text-center text-muted-foreground">
                      Team belum memiliki anggota.
                    </TableCell>
                  </TableRow>
                ) : (
                  team.members.map((member) => (
                    <TableRow key={member.userId}>
                      <TableCell className="font-medium">
                        {member.user.name}
                      </TableCell>

                      <TableCell>{member.user.email}</TableCell>

                      <TableCell>
                        <Badge
                          variant={
                            member.user.isActive ? "default" : "secondary"
                          }>
                          {member.user.isActive ? "Active" : "Inactive"}
                        </Badge>
                      </TableCell>

                      <TableCell>{formatDate(member.joinedAt)}</TableCell>

                      <TableCell className="text-right">
                        <PermissionGuard
                          permissions={permissions}
                          required="admin.team.manage_member">
                          <ConfirmDeleteDialog
                            title="Hapus Anggota Team"
                            description={`"${member.user.name}" akan dihapus dari team "${team.name}".`}
                            onConfirm={() =>
                              handleRemoveMember(
                                member.userId,
                                member.user.name,
                              )
                            }
                            trigger={
                              <Button
                                variant="ghost"
                                size="icon"
                                className="text-destructive hover:text-destructive">
                                <Trash2 className="size-4" />
                              </Button>
                            }
                          />
                        </PermissionGuard>
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>
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
