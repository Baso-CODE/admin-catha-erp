"use client";

import { ChevronLeft, ChevronRight, Search } from "lucide-react";
import Link from "next/link";
import { useCallback, useEffect, useState } from "react";
import { toast } from "sonner";

import {
  ClientServiceItem,
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

const SERVICE_STATUSES = [
  "PLANNED",
  "ACTIVE",
  "PAUSED",
  "COMPLETED",
  "CANCELLED",
] as const;

export function ClientServicesPage() {
  const [items, setItems] = useState<ClientServiceItem[]>([]);
  const [search, setSearch] = useState("");
  const [debouncedSearch, setDebouncedSearch] = useState("");
  const [status, setStatus] = useState("ALL");
  const [page, setPage] = useState(1);
  const [total, setTotal] = useState(0);
  const [totalPages, setTotalPages] = useState(0);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const timer = window.setTimeout(() => {
      setDebouncedSearch(search.trim());
      setPage(1);
    }, 400);

    return () => window.clearTimeout(timer);
  }, [search]);

  const loadServices = useCallback(async () => {
    try {
      setIsLoading(true);

      const response = await clientPortalService.getServices({
        search: debouncedSearch || undefined,
        status: status === "ALL" ? undefined : status,
        page,
        limit: 10,
      });

      setItems(response.data);
      setTotal(response.meta.total);
      setTotalPages(response.meta.totalPages);
    } catch (error) {
      toast.error("Gagal mengambil service.", {
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
    void loadServices();
  }, [loadServices]);

  return (
    <div className="space-y-6 p-6">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight">My Services</h1>

        <p className="text-sm text-muted-foreground">
          Layanan yang sedang atau pernah dikerjakan untuk perusahaan Anda.
        </p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Services</CardTitle>
          <CardDescription>Total {total} service.</CardDescription>
        </CardHeader>

        <CardContent className="space-y-4">
          <div className="flex flex-col gap-3 sm:flex-row">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />

              <Input
                value={search}
                onChange={(event) => setSearch(event.target.value)}
                placeholder="Cari service atau project..."
                className="pl-9"
              />
            </div>

            <Select
              value={status}
              onValueChange={(value) => {
                setStatus(value);
                setPage(1);
              }}>
              <SelectTrigger className="w-full sm:w-52">
                <SelectValue />
              </SelectTrigger>

              <SelectContent>
                <SelectItem value="ALL">Semua Status</SelectItem>

                {SERVICE_STATUSES.map((item) => (
                  <SelectItem key={item} value={item}>
                    {formatStatus(item)}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="rounded-lg border">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Service</TableHead>
                  <TableHead>Project</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Workflow</TableHead>
                  <TableHead>Periode</TableHead>
                </TableRow>
              </TableHeader>

              <TableBody>
                {isLoading ? (
                  <TableRow>
                    <TableCell
                      colSpan={5}
                      className="h-28 text-center text-muted-foreground">
                      Memuat service...
                    </TableCell>
                  </TableRow>
                ) : items.length === 0 ? (
                  <TableRow>
                    <TableCell
                      colSpan={5}
                      className="h-28 text-center text-muted-foreground">
                      Belum ada service.
                    </TableCell>
                  </TableRow>
                ) : (
                  items.map((item) => (
                    <TableRow key={item.id}>
                      <TableCell>
                        <div className="font-medium">
                          {item.masterService.name}
                        </div>

                        <div className="text-xs text-muted-foreground">
                          {item.masterService.code}
                        </div>
                      </TableCell>

                      <TableCell>
                        <Link
                          href={`/portal/projects/${item.project.id}`}
                          className="hover:underline">
                          {item.project.name}
                        </Link>

                        <div className="text-xs text-muted-foreground">
                          {item.project.projectCode}
                        </div>
                      </TableCell>

                      <TableCell>
                        <StatusBadge status={item.status} />
                      </TableCell>

                      <TableCell>
                        {item.workflowInstance ? (
                          <div>
                            <Badge variant="outline">
                              {formatStatus(item.workflowInstance.status)}
                            </Badge>

                            {item.workflowInstance.currentStepKey && (
                              <div className="mt-1 text-xs text-muted-foreground">
                                {item.workflowInstance.currentStepKey}
                              </div>
                            )}
                          </div>
                        ) : (
                          "-"
                        )}
                      </TableCell>

                      <TableCell>
                        <div className="text-sm">
                          {item.startDate ? formatDate(item.startDate) : "-"}
                        </div>

                        <div className="text-xs text-muted-foreground">
                          s/d {item.endDate ? formatDate(item.endDate) : "-"}
                        </div>
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </div>

          <Pagination
            page={page}
            totalPages={totalPages}
            isLoading={isLoading}
            onPageChange={setPage}
          />
        </CardContent>
      </Card>
    </div>
  );
}

function StatusBadge({ status }: { status: string }) {
  const className =
    status === "COMPLETED" || status === "ACTIVE"
      ? "border-emerald-200 bg-emerald-50 text-emerald-700"
      : status === "PAUSED"
        ? "border-amber-200 bg-amber-50 text-amber-700"
        : status === "CANCELLED"
          ? "border-red-200 bg-red-50 text-red-700"
          : "border-blue-200 bg-blue-50 text-blue-700";

  return (
    <Badge variant="outline" className={className}>
      {formatStatus(status)}
    </Badge>
  );
}

function Pagination({
  page,
  totalPages,
  isLoading,
  onPageChange,
}: {
  page: number;
  totalPages: number;
  isLoading: boolean;
  onPageChange: (page: number) => void;
}) {
  return (
    <div className="flex items-center justify-between">
      <p className="text-sm text-muted-foreground">
        Halaman {totalPages === 0 ? 0 : page} dari {totalPages}
      </p>

      <div className="flex gap-2">
        <Button
          size="sm"
          variant="outline"
          disabled={page <= 1 || isLoading}
          onClick={() => onPageChange(Math.max(1, page - 1))}>
          <ChevronLeft className="size-4" />
          Sebelumnya
        </Button>

        <Button
          size="sm"
          variant="outline"
          disabled={page >= totalPages || totalPages === 0 || isLoading}
          onClick={() => onPageChange(page + 1)}>
          Selanjutnya
          <ChevronRight className="size-4" />
        </Button>
      </div>
    </div>
  );
}

function formatStatus(value: string) {
  return value
    .toLowerCase()
    .split("_")
    .map((item) => item.charAt(0).toUpperCase() + item.slice(1))
    .join(" ");
}

function formatDate(value: string) {
  return new Intl.DateTimeFormat("id-ID", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  }).format(new Date(value));
}
