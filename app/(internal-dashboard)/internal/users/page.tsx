"use client";

import {
  MoreHorizontal,
  Search,
  ShieldCheck,
  TrendingUp,
  UserCheck,
  Users,
  UserX,
} from "lucide-react";
import { useCallback, useEffect, useState } from "react";
import {
  Area,
  AreaChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import { toast } from "sonner";

import { UserItem, userService } from "@/app/services/userManagement.service";
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

import { CreateUserModal } from "./components/createUserModal";

const USER_LIMIT = 10;

export default function UserManagementPage() {
  const [searchTerm, setSearchTerm] = useState("");
  const debouncedSearch = useDebounce(searchTerm, 500);

  const [loading, setLoading] = useState(true);

  const [period, setPeriod] = useState<"7days" | "30days" | "3months">("7days");

  const [page, setPage] = useState(1);

  const [metrics, setMetrics] = useState({
    totalUsers: 0,
    activeUsers: 0,
    inactiveUsers: 0,
    averageEfficiency: 0,
  });

  const [performanceData, setPerformanceData] = useState<
    Array<{
      date: string;
      performance: number;
    }>
  >([]);

  const [usersList, setUsersList] = useState<UserItem[]>([]);

  const [meta, setMeta] = useState({
    total: 0,
    page: 1,
    limit: USER_LIMIT,
    totalPages: 1,
  });

  const loadDashboardData = useCallback(async () => {
    try {
      setLoading(true);

      const [metricsRes, perfRes, usersRes] = await Promise.all([
        userService.getMetrics(),

        userService.getPerformance(period),

        userService.getUsers({
          search: debouncedSearch || undefined,
          page,
          limit: USER_LIMIT,
        }),
      ]);

      if (metricsRes.success) {
        setMetrics(metricsRes.data);
      }

      if (perfRes.success) {
        setPerformanceData(perfRes.data);
      }

      if (usersRes.success) {
        setUsersList(usersRes.data);
        setMeta(usersRes.meta);
      }
    } catch (error) {
      toast.error("Gagal memuat data", {
        description:
          error instanceof Error
            ? error.message
            : "Terjadi kesalahan pada server.",
      });
    } finally {
      setLoading(false);
    }
  }, [period, debouncedSearch, page]);

  useEffect(() => {
    void loadDashboardData();
  }, [loadDashboardData]);

  const handleSearchChange = (value: string) => {
    setSearchTerm(value);
    setPage(1);
  };

  const handlePreviousPage = () => {
    setPage((current) => Math.max(1, current - 1));
  };

  const handleNextPage = () => {
    setPage((current) => Math.min(meta.totalPages, current + 1));
  };

  const getUserRoles = (user: UserItem) => {
    if (!user.roles?.length) {
      return [];
    }

    return user.roles.map(({ role }) => role);
  };

  const startItem = meta.total === 0 ? 0 : (meta.page - 1) * meta.limit + 1;

  const endItem = Math.min(meta.page * meta.limit, meta.total);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">
            User Management & Performance
          </h1>

          <p className="text-sm text-muted-foreground">
            Kelola akses staf internal agensi dan pantau metrik produktivitas
            kerja.
          </p>
        </div>

        <CreateUserModal onSuccess={loadDashboardData} />
      </div>

      {/* Metrics */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Total Pengguna
            </CardTitle>

            <Users className="size-4 text-primary" />
          </CardHeader>

          <CardContent>
            <div className="text-2xl font-bold">{metrics.totalUsers} Staf</div>

            <p className="mt-1 flex items-center gap-1 text-xs font-medium text-emerald-500">
              <TrendingUp className="size-3" />
              Data diperbarui otomatis
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Akun Aktif
            </CardTitle>

            <UserCheck className="size-4 text-emerald-500" />
          </CardHeader>

          <CardContent>
            <div className="text-2xl font-bold">
              {metrics.activeUsers} Aktif
            </div>

            <p className="mt-1 text-xs text-muted-foreground">
              Pengguna dengan akun aktif
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Rata-rata Efisiensi
            </CardTitle>

            <ShieldCheck className="size-4 text-blue-500" />
          </CardHeader>

          <CardContent>
            <div className="text-2xl font-bold">
              {metrics.averageEfficiency}%
            </div>

            <p className="mt-1 flex items-center gap-1 text-xs font-medium text-emerald-500">
              <TrendingUp className="size-3" />
              Performa tim
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Akun Nonaktif
            </CardTitle>

            <UserX className="size-4 text-destructive" />
          </CardHeader>

          <CardContent>
            <div className="text-2xl font-bold">
              {metrics.inactiveUsers} Nonaktif
            </div>

            <p className="mt-1 text-xs text-muted-foreground">
              Akun yang sedang dinonaktifkan
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Performance Chart */}
      <Card>
        <CardHeader className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <CardTitle className="text-base font-semibold">
              Grafik Performa Tim
            </CardTitle>

            <p className="text-xs text-muted-foreground">
              Total tugas selesai oleh seluruh staf berdasarkan periode.
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-2">
            <Button
              variant={period === "3months" ? "default" : "outline"}
              size="sm"
              className="h-8 text-xs"
              onClick={() => setPeriod("3months")}>
              3 Bulan
            </Button>

            <Button
              variant={period === "30days" ? "default" : "outline"}
              size="sm"
              className="h-8 text-xs"
              onClick={() => setPeriod("30days")}>
              30 Hari
            </Button>

            <Button
              variant={period === "7days" ? "default" : "outline"}
              size="sm"
              className="h-8 text-xs"
              onClick={() => setPeriod("7days")}>
              7 Hari
            </Button>
          </div>
        </CardHeader>

        <CardContent className="pt-4">
          <div className="h-62.5 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart
                data={performanceData}
                margin={{
                  top: 10,
                  right: 10,
                  left: -20,
                  bottom: 0,
                }}>
                <defs>
                  <linearGradient id="colorPerf" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#f59e0b" stopOpacity={0.4} />

                    <stop offset="95%" stopColor="#f59e0b" stopOpacity={0} />
                  </linearGradient>
                </defs>

                <XAxis
                  dataKey="date"
                  stroke="#888888"
                  fontSize={12}
                  tickLine={false}
                  axisLine={false}
                />

                <YAxis
                  stroke="#888888"
                  fontSize={12}
                  tickLine={false}
                  axisLine={false}
                />

                <Tooltip
                  contentStyle={{
                    backgroundColor: "#18181b",
                    borderColor: "#27272a",
                    borderRadius: "8px",
                    color: "#fff",
                  }}
                />

                <Area
                  type="monotone"
                  dataKey="performance"
                  stroke="#f59e0b"
                  strokeWidth={2}
                  fillOpacity={1}
                  fill="url(#colorPerf)"
                />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </CardContent>
      </Card>

      {/* Users Table */}
      <Card>
        <CardHeader className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <CardTitle className="text-base font-semibold">
              Daftar Pengguna Internal
            </CardTitle>

            <p className="mt-1 text-xs text-muted-foreground">
              {meta.total} pengguna terdaftar
            </p>
          </div>

          <div className="relative w-full sm:w-72">
            <Search className="absolute left-2.5 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />

            <Input
              type="search"
              placeholder="Cari nama atau email..."
              value={searchTerm}
              onChange={(event) => handleSearchChange(event.target.value)}
              className="h-9 pl-9 text-xs"
            />
          </div>
        </CardHeader>

        <CardContent>
          <div className="overflow-hidden rounded-md border bg-background shadow-sm">
            <Table>
              <TableHeader className="bg-muted/50">
                <TableRow>
                  <TableHead className="w-62.5">Nama Staf</TableHead>

                  <TableHead>Role Akses</TableHead>

                  <TableHead>Status</TableHead>

                  <TableHead className="text-center">Task Selesai</TableHead>

                  <TableHead className="text-center">Efisiensi</TableHead>

                  <TableHead className="text-right">Aksi</TableHead>
                </TableRow>
              </TableHeader>

              <TableBody>
                {loading ? (
                  <TableRow>
                    <TableCell
                      colSpan={6}
                      className="py-10 text-center text-xs text-muted-foreground">
                      Memuat data pengguna...
                    </TableCell>
                  </TableRow>
                ) : usersList.length > 0 ? (
                  usersList.map((user) => {
                    const roles = getUserRoles(user);

                    return (
                      <TableRow key={user.id} className="hover:bg-muted/30">
                        <TableCell>
                          <div className="font-medium">{user.name}</div>

                          <div className="text-xs text-muted-foreground">
                            {user.email}
                          </div>
                        </TableCell>

                        <TableCell>
                          {roles.length > 0 ? (
                            <div className="flex flex-wrap gap-1.5">
                              {roles.map((role) => (
                                <Badge
                                  key={role.id}
                                  variant="outline"
                                  className="text-[10px] font-semibold">
                                  {role.name}
                                </Badge>
                              ))}
                            </div>
                          ) : (
                            <span className="text-xs text-muted-foreground">
                              Belum ada role
                            </span>
                          )}
                        </TableCell>

                        <TableCell>
                          <span
                            className={`inline-flex items-center gap-1.5 rounded-full border px-2 py-0.5 text-xs font-medium ${
                              user.isActive
                                ? "border-emerald-500/20 bg-emerald-500/10 text-emerald-500"
                                : "border-destructive/20 bg-destructive/10 text-destructive"
                            }`}>
                            <span
                              className={`size-1.5 rounded-full ${
                                user.isActive
                                  ? "bg-emerald-500"
                                  : "bg-destructive"
                              }`}
                            />

                            {user.isActive ? "Active" : "Inactive"}
                          </span>
                        </TableCell>

                        <TableCell className="text-center font-semibold">
                          {user.tasksCompleted ?? 0}
                        </TableCell>

                        <TableCell className="text-center font-medium">
                          {user.efficiency ?? "-"}
                        </TableCell>

                        <TableCell className="text-right">
                          <Button
                            variant="ghost"
                            size="icon"
                            className="size-8">
                            <MoreHorizontal className="size-4" />
                          </Button>
                        </TableCell>
                      </TableRow>
                    );
                  })
                ) : (
                  <TableRow>
                    <TableCell
                      colSpan={6}
                      className="py-10 text-center text-xs text-muted-foreground">
                      {debouncedSearch
                        ? `Tidak ada pengguna yang cocok dengan "${debouncedSearch}".`
                        : "Tidak ada pengguna yang ditemukan."}
                    </TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>

            {/* Pagination */}
            {!loading && meta.total > 0 && (
              <div className="flex flex-col gap-3 border-t px-4 py-3 sm:flex-row sm:items-center sm:justify-between">
                <p className="text-xs text-muted-foreground">
                  Menampilkan
                  <span className="font-medium text-foreground">
                    {startItem}
                  </span>
                  {" - "}
                  <span className="font-medium text-foreground">{endItem}</span>
                  {" dari "}
                  <span className="font-medium text-foreground">
                    {meta.total}
                  </span>
                  pengguna
                </p>

                <div className="flex items-center gap-3">
                  <span className="text-xs text-muted-foreground">
                    Halaman {meta.page} dari {meta.totalPages}
                  </span>

                  <div className="flex items-center gap-2">
                    <Button
                      variant="outline"
                      size="sm"
                      disabled={meta.page <= 1 || loading}
                      onClick={handlePreviousPage}>
                      Sebelumnya
                    </Button>

                    <Button
                      variant="outline"
                      size="sm"
                      disabled={meta.page >= meta.totalPages || loading}
                      onClick={handleNextPage}>
                      Selanjutnya
                    </Button>
                  </div>
                </div>
              </div>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
