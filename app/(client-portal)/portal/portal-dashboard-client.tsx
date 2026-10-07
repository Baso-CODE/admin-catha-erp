"use client";

import {
  AlertCircle,
  CheckCircle2,
  Clock3,
  FolderKanban,
  ReceiptText,
  ShieldCheck,
  Ticket,
} from "lucide-react";
import Link from "next/link";
import { useCallback, useEffect, useState } from "react";
import { toast } from "sonner";

import {
  ClientDashboardResponse,
  clientPortalService,
} from "@/app/services/client-portal.service";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";

export function PortalDashboardClient() {
  const [data, setData] = useState<ClientDashboardResponse | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  const loadDashboard = useCallback(async () => {
    try {
      setIsLoading(true);

      const response = await clientPortalService.getDashboard();

      setData(response.data);
    } catch (error) {
      toast.error("Gagal mengambil dashboard client.", {
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
    void loadDashboard();
  }, [loadDashboard]);

  if (isLoading) {
    return (
      <div className="p-6 text-sm text-muted-foreground">
        Memuat dashboard...
      </div>
    );
  }

  if (!data) {
    return (
      <div className="p-6 text-sm text-muted-foreground">
        Dashboard tidak tersedia.
      </div>
    );
  }

  const summary = data.summary;

  return (
    <div className="space-y-6 p-6">
      <div className="flex flex-col gap-2 sm:flex-row sm:items-start sm:justify-between">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight">
            Dashboard Client
          </h1>

          <p className="text-sm text-muted-foreground">
            Selamat datang, {data.contact.name} dari {data.client.companyName}.
          </p>
        </div>

        <Badge variant="outline">{data.client.clientCode}</Badge>
      </div>

      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
        <SummaryCard
          title="Project Aktif"
          value={summary.projects.active}
          description={`${summary.projects.total} total project`}
          icon={FolderKanban}
        />

        <SummaryCard
          title="Pending Approval"
          value={summary.approvals.pending}
          description="Menunggu tindakan client"
          icon={ShieldCheck}
        />

        <SummaryCard
          title="Deliverable Siap"
          value={summary.deliverables.readyForClient}
          description="Siap ditinjau"
          icon={CheckCircle2}
        />

        <SummaryCard
          title="Support Aktif"
          value={summary.support.open}
          description="Ticket belum selesai"
          icon={Ticket}
        />
      </div>

      <div className="grid gap-4 md:grid-cols-3">
        <Card>
          <CardHeader className="pb-2">
            <CardDescription>Outstanding Invoice</CardDescription>

            <CardTitle className="text-2xl">
              {summary.invoices.outstanding}
            </CardTitle>
          </CardHeader>

          <CardContent className="flex items-center gap-2 text-sm text-muted-foreground">
            <ReceiptText className="size-4" />
            {formatCurrency(summary.invoices.outstandingAmount)}
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardDescription>Overdue Invoice</CardDescription>

            <CardTitle className="text-2xl">
              {summary.invoices.overdue}
            </CardTitle>
          </CardHeader>

          <CardContent className="flex items-center gap-2 text-sm text-muted-foreground">
            <AlertCircle className="size-4" />
            Perlu perhatian
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardDescription>Project Selesai</CardDescription>

            <CardTitle className="text-2xl">
              {summary.projects.completed}
            </CardTitle>
          </CardHeader>

          <CardContent className="flex items-center gap-2 text-sm text-muted-foreground">
            <Clock3 className="size-4" />
            Dari {summary.projects.total} project
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <div>
            <CardTitle>Project Terbaru</CardTitle>

            <CardDescription>Project yang terakhir diperbarui.</CardDescription>
          </div>

          <Button asChild variant="outline">
            <Link href="/portal/projects">Lihat Semua</Link>
          </Button>
        </CardHeader>

        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Project</TableHead>
                <TableHead>Type</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Project Manager</TableHead>
                <TableHead>Service</TableHead>
                <TableHead>Deliverable</TableHead>
              </TableRow>
            </TableHeader>

            <TableBody>
              {data.recentProjects.length === 0 ? (
                <TableRow>
                  <TableCell
                    colSpan={6}
                    className="h-24 text-center text-muted-foreground">
                    Belum ada project.
                  </TableCell>
                </TableRow>
              ) : (
                data.recentProjects.map((project) => (
                  <TableRow key={project.id}>
                    <TableCell>
                      <div className="font-medium">{project.name}</div>

                      <div className="text-xs text-muted-foreground">
                        {project.projectCode}
                      </div>
                    </TableCell>

                    <TableCell>{project.projectType}</TableCell>

                    <TableCell>
                      <Badge variant="outline">
                        {formatStatus(project.status)}
                      </Badge>
                    </TableCell>

                    <TableCell>{project.projectManager.name}</TableCell>

                    <TableCell>{project._count.services}</TableCell>

                    <TableCell>{project._count.deliverables}</TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  );
}

interface SummaryCardProps {
  title: string;
  value: number;
  description: string;
  icon: React.ComponentType<{
    className?: string;
  }>;
}

function SummaryCard({
  title,
  value,
  description,
  icon: Icon,
}: SummaryCardProps) {
  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
        <CardTitle className="text-sm font-medium">{title}</CardTitle>

        <Icon className="size-4 text-muted-foreground" />
      </CardHeader>

      <CardContent>
        <div className="text-2xl font-bold">{value}</div>

        <p className="text-xs text-muted-foreground">{description}</p>
      </CardContent>
    </Card>
  );
}

function formatCurrency(value: number) {
  return new Intl.NumberFormat("id-ID", {
    style: "currency",
    currency: "IDR",
    maximumFractionDigits: 0,
  }).format(value);
}

function formatStatus(value: string) {
  return value
    .toLowerCase()
    .split("_")
    .map((item) => item.charAt(0).toUpperCase() + item.slice(1))
    .join(" ");
}
