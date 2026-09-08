"use client";

import {
  MoreHorizontal,
  Plus,
  Search,
  ShieldCheck,
  TrendingUp,
  UserCheck,
  Users,
  UserX,
} from "lucide-react";
import { useState } from "react";
import {
  Area,
  AreaChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";

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

// Data Dummy Grafik Performa Pekerja (Task Completed per Hari)
const performanceData = [
  { date: "Jun 24", performance: 40 },
  { date: "Jun 25", performance: 30 },
  { date: "Jun 26", performance: 65 },
  { date: "Jun 27", performance: 85 },
  { date: "Jun 28", performance: 50 },
  { date: "Jun 29", performance: 70 },
  { date: "Jun 30", performance: 95 },
];

// Data Dummy Tabel User Internal
const initialUsers = [
  {
    id: 1,
    name: "Catha Admin",
    email: "admin@catha.co.id",
    role: "OWNER",
    status: "Active",
    tasksCompleted: 45,
    efficiency: "98%",
  },
  {
    id: 2,
    name: "Rian Developer",
    email: "rian@catha.co.id",
    role: "ADMIN",
    status: "Active",
    tasksCompleted: 38,
    efficiency: "92%",
  },
  {
    id: 3,
    name: "Siti Marketing",
    email: "siti@catha.co.id",
    role: "STAFF",
    status: "Active",
    tasksCompleted: 29,
    efficiency: "88%",
  },
  {
    id: 4,
    name: "Budi Finance",
    email: "budi@catha.co.id",
    role: "STAFF",
    status: "Inactive",
    tasksCompleted: 12,
    efficiency: "75%",
  },
  {
    id: 5,
    name: "Dewi Support",
    email: "dewi@catha.co.id",
    role: "STAFF",
    status: "Active",
    tasksCompleted: 34,
    efficiency: "90%",
  },
];

export default function UserManagementPage() {
  const [searchTerm, setSearchTerm] = useState("");

  const filteredUsers = initialUsers.filter(
    (user) =>
      user.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      user.email.toLowerCase().includes(searchTerm.toLowerCase()),
  );

  return (
    <div className="space-y-6">
      {/* Header Halaman */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">
            User Management & Performance
          </h1>
          <p className="text-sm text-muted-foreground">
            Kelola akses staf internal agensi dan pantau metrik produktivitas
            kerja.
          </p>
        </div>
        <Button className="gap-2">
          <Plus className="size-4" />
          <span>Tambah Pengguna</span>
        </Button>
      </div>

      {/* 1. KARTU METRIK (STAT CARDS) */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card className="bg-card border-border/55">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Total Pengguna
            </CardTitle>
            <Users className="size-4 text-primary" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">24 Staf</div>
            <p className="text-xs text-emerald-500 mt-1 flex items-center gap-1 font-medium">
              <TrendingUp className="size-3" /> +12.5% bulan ini
            </p>
          </CardContent>
        </Card>

        <Card className="bg-card border-border/55">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Akun Aktif
            </CardTitle>
            <UserCheck className="size-4 text-emerald-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">22 Aktif</div>
            <p className="text-xs text-muted-foreground mt-1">
              Retensi sistem sangat baik
            </p>
          </CardContent>
        </Card>

        <Card className="bg-card border-border/55">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Rata-rata Efisiensi
            </CardTitle>
            <ShieldCheck className="size-4 text-blue-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">91.4%</div>
            <p className="text-xs text-emerald-500 mt-1 flex items-center gap-1 font-medium">
              <TrendingUp className="size-3" /> +4.5% dari target
            </p>
          </CardContent>
        </Card>

        <Card className="bg-card border-border/55">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Akun Nonaktif
            </CardTitle>
            <UserX className="size-4 text-destructive" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">2 Nonaktif</div>
            <p className="text-xs text-muted-foreground mt-1">
              Memerlukan tinjauan admin
            </p>
          </CardContent>
        </Card>
      </div>

      {/* 2. CHART PERFORMA PEKERJA (AREA CHART) */}
      <Card className="bg-card border-border/55">
        <CardHeader className="flex flex-row items-center justify-between pb-2">
          <div>
            <CardTitle className="text-base font-semibold">
              Grafik Performa Tim
            </CardTitle>
            <p className="text-xs text-muted-foreground">
              Total tugas selesai oleh seluruh staf dalam 7 hari terakhir
            </p>
          </div>
          <div className="flex items-center gap-2">
            <Button variant="outline" size="sm" className="text-xs h-8">
              3 Bulan
            </Button>
            <Button variant="outline" size="sm" className="text-xs h-8">
              30 Hari
            </Button>
            <Button variant="default" size="sm" className="text-xs h-8">
              7 Hari
            </Button>
          </div>
        </CardHeader>
        <CardContent className="pt-4">
          <div className="h-[250px] w-full">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart
                data={performanceData}
                margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
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

      {/* 3. TABEL DATA USER INTERNAL */}
      <Card className="bg-card border-border/55">
        <CardHeader className="flex flex-row items-center justify-between">
          <CardTitle className="text-base font-semibold">
            Daftar Pengguna Internal
          </CardTitle>
          <div className="relative w-64">
            <Search className="absolute left-2.5 top-2.5 size-4 text-muted-foreground" />
            <Input
              type="search"
              placeholder="Cari nama atau email..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-9 h-9 text-xs"
            />
          </div>
        </CardHeader>
        <CardContent>
          <div className="rounded-md border border-border/40 overflow-hidden">
            <Table>
              <TableHeader className="bg-muted/50">
                <TableRow>
                  <TableHead className="w-[250px]">Nama Staf</TableHead>
                  <TableHead>Role Akses</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead className="text-center">Task Selesai</TableHead>
                  <TableHead className="text-center">Efisiensi</TableHead>
                  <TableHead className="text-right">Aksi</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredUsers.length > 0 ? (
                  filteredUsers.map((user) => (
                    <TableRow key={user.id} className="hover:bg-muted/30">
                      <TableCell className="font-medium">
                        <div>{user.name}</div>
                        <div className="text-xs text-muted-foreground">
                          {user.email}
                        </div>
                      </TableCell>
                      <TableCell>
                        <Badge
                          variant="outline"
                          className="text-[10px] font-semibold">
                          {user.role}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        <span
                          className={`inline-flex items-center gap-1.5 px-2 py-0.5 rounded-full text-xs font-medium ${
                            user.status === "Active"
                              ? "bg-emerald-500/10 text-emerald-500 border border-emerald-500/20"
                              : "bg-destructive/10 text-destructive border border-destructive/20"
                          }`}>
                          <span
                            className={`size-1.5 rounded-full ${user.status === "Active" ? "bg-emerald-500" : "bg-destructive"}`}></span>
                          {user.status}
                        </span>
                      </TableCell>
                      <TableCell className="text-center font-semibold">
                        {user.tasksCompleted}
                      </TableCell>
                      <TableCell className="text-center text-emerald-500 font-medium">
                        {user.efficiency}
                      </TableCell>
                      <TableCell className="text-right">
                        <Button variant="ghost" size="icon" className="size-8">
                          <MoreHorizontal className="size-4" />
                        </Button>
                      </TableCell>
                    </TableRow>
                  ))
                ) : (
                  <TableRow>
                    <TableCell
                      colSpan={6}
                      className="text-center py-6 text-muted-foreground text-xs">
                      Tidak ada pengguna yang ditemukan.
                    </TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
