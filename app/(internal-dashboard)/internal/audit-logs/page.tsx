"use client";

import { ChevronLeft, ChevronRight, History, Search } from "lucide-react";
import { useEffect, useState } from "react";
import { toast } from "sonner";

import {
  AuditLogItem,
  userService,
} from "@/app/services/userManagement.service";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
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

export default function AuditLogsPage() {
  const [search, setSearch] = useState("");
  const debouncedSearch = useDebounce(search, 500);

  const [page, setPage] = useState(1);
  const [loading, setLoading] = useState(true);
  const [logs, setLogs] = useState<AuditLogItem[]>([]);

  const [meta, setMeta] = useState({
    total: 0,
    page: 1,
    limit: 10,
    totalPages: 1,
  });

  useEffect(() => {
    setPage(1);
  }, [debouncedSearch]);

  useEffect(() => {
    async function loadLogs() {
      try {
        setLoading(true);

        const res = await userService.getAuditLogs({
          search: debouncedSearch || undefined,
          page,
          limit: 10,
        });

        if (res.success) {
          setLogs(res.data);
          setMeta(res.meta);
        }
      } catch (error) {
        toast.error("Gagal memuat audit log", {
          description:
            error instanceof Error
              ? error.message
              : "Terjadi kesalahan pada server.",
        });
      } finally {
        setLoading(false);
      }
    }

    void loadLogs();
  }, [page, debouncedSearch]);

  const getActionBadge = (action: string) => {
    switch (action) {
      case "CREATE":
        return (
          <Badge
            variant="outline"
            className="border-emerald-500/20 bg-emerald-500/10 text-emerald-600 dark:text-emerald-400">
            CREATE
          </Badge>
        );

      case "UPDATE":
        return (
          <Badge
            variant="outline"
            className="border-blue-500/20 bg-blue-500/10 text-blue-600 dark:text-blue-400">
            UPDATE
          </Badge>
        );

      case "DELETE":
        return (
          <Badge
            variant="outline"
            className="border-destructive/20 bg-destructive/10 text-destructive">
            DELETE
          </Badge>
        );

      case "ACTIVATE":
      case "DEACTIVATE":
        return (
          <Badge
            variant="outline"
            className="border-amber-500/20 bg-amber-500/10 text-amber-600 dark:text-amber-400">
            {action}
          </Badge>
        );

      default:
        return <Badge variant="outline">{action}</Badge>;
    }
  };

  const getUserRoles = (log: AuditLogItem) => {
    if (!log.user?.roles?.length) {
      return null;
    }

    return log.user.roles.map(({ role }) => role.name).join(", ");
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">
            System Audit Logs
          </h1>

          <p className="text-sm text-muted-foreground">
            Rekam jejak seluruh aktivitas keamanan dan perubahan data penting
            dalam sistem.
          </p>
        </div>
      </div>

      <Card>
        <CardHeader className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <CardTitle className="flex items-center gap-2 text-base font-semibold">
            <History className="size-4 text-primary" />
            Riwayat Aktivitas Sistem
          </CardTitle>

          <div className="relative w-full sm:w-72">
            <Search className="absolute left-2.5 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />

            <Input
              type="search"
              placeholder="Cari aktivitas atau user..."
              value={search}
              onChange={(event) => setSearch(event.target.value)}
              className="h-9 pl-9 text-xs"
            />
          </div>
        </CardHeader>

        <CardContent>
          <div className="overflow-hidden rounded-md border bg-background shadow-sm">
            <Table>
              <TableHeader className="bg-muted/50">
                <TableRow>
                  <TableHead>Waktu</TableHead>
                  <TableHead>Aktor</TableHead>
                  <TableHead>Aksi</TableHead>
                  <TableHead>Entitas</TableHead>
                  <TableHead>Detail Perubahan</TableHead>
                </TableRow>
              </TableHeader>

              <TableBody>
                {loading ? (
                  <TableRow>
                    <TableCell
                      colSpan={5}
                      className="py-10 text-center text-xs text-muted-foreground">
                      Memuat riwayat log...
                    </TableCell>
                  </TableRow>
                ) : logs.length > 0 ? (
                  logs.map((log) => {
                    const roles = getUserRoles(log);

                    return (
                      <TableRow key={log.id} className="hover:bg-muted/30">
                        <TableCell className="whitespace-nowrap text-xs text-muted-foreground">
                          {new Date(log.createdAt).toLocaleString("id-ID", {
                            dateStyle: "medium",
                            timeStyle: "short",
                          })}
                        </TableCell>

                        <TableCell>
                          {log.user ? (
                            <div className="space-y-0.5">
                              <div className="text-xs font-medium">
                                {log.user.name}
                              </div>

                              <div className="text-[11px] text-muted-foreground">
                                {log.user.email}
                              </div>

                              {roles && (
                                <div className="text-[10px] text-muted-foreground">
                                  {roles}
                                </div>
                              )}
                            </div>
                          ) : (
                            <div className="text-xs text-muted-foreground">
                              System
                            </div>
                          )}
                        </TableCell>

                        <TableCell>{getActionBadge(log.action)}</TableCell>

                        <TableCell>
                          <div className="space-y-1">
                            <Badge
                              variant="outline"
                              className="font-mono text-[10px]">
                              {log.entity}
                            </Badge>

                            <p
                              className="max-w-40 truncate font-mono text-[10px] text-muted-foreground"
                              title={log.entityId}>
                              {log.entityId}
                            </p>
                          </div>
                        </TableCell>

                        <TableCell className="max-w-md">
                          {log.details ? (
                            <p
                              className="truncate text-xs text-muted-foreground"
                              title={JSON.stringify(log.details, null, 2)}>
                              {JSON.stringify(log.details)}
                            </p>
                          ) : (
                            <span className="text-xs text-muted-foreground">
                              -
                            </span>
                          )}
                        </TableCell>
                      </TableRow>
                    );
                  })
                ) : (
                  <TableRow>
                    <TableCell
                      colSpan={5}
                      className="py-10 text-center text-xs text-muted-foreground">
                      {debouncedSearch
                        ? `Tidak ada audit log yang cocok dengan "${debouncedSearch}".`
                        : "Tidak ada riwayat log yang ditemukan."}
                    </TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>
          </div>

          <div className="mt-4 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
            <p className="text-sm text-muted-foreground">
              Total {meta.total} audit log
            </p>

            <div className="flex items-center gap-2">
              <Button
                variant="outline"
                size="sm"
                disabled={meta.page <= 1 || loading}
                onClick={() => setPage(meta.page - 1)}>
                <ChevronLeft className="mr-1 size-4" />
                Sebelumnya
              </Button>

              <span className="px-2 text-sm text-muted-foreground">
                Halaman {meta.page} dari {Math.max(meta.totalPages, 1)}
              </span>

              <Button
                variant="outline"
                size="sm"
                disabled={meta.page >= meta.totalPages || loading}
                onClick={() => setPage(meta.page + 1)}>
                Selanjutnya
                <ChevronRight className="ml-1 size-4" />
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
