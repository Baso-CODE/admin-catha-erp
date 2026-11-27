"use client";

import {
  ChevronLeft,
  ChevronRight,
  FolderTree,
  Loader2,
  RefreshCw,
  Search,
} from "lucide-react";
import Link from "next/link";
import { Fragment, useEffect, useMemo, useState } from "react";
import { toast } from "sonner";

import {
  type ClientServiceCategory,
  type ClientServiceItem,
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

interface ClientServiceGroup {
  id: string;
  name: string;
  sortOrder: number;
  items: ClientServiceItem[];
}

export function ClientServicesPage() {
  const [items, setItems] = useState<ClientServiceItem[]>([]);

  const [categories, setCategories] = useState<ClientServiceCategory[]>([]);

  const [hasUncategorized, setHasUncategorized] = useState(false);

  const [search, setSearch] = useState("");
  const [debouncedSearch, setDebouncedSearch] = useState("");

  const [status, setStatus] = useState("ALL");
  const [categoryId, setCategoryId] = useState("ALL");

  const [page, setPage] = useState(1);
  const [total, setTotal] = useState(0);
  const [totalPages, setTotalPages] = useState(0);

  const [isLoading, setIsLoading] = useState(true);
  const [isLoadingCategories, setIsLoadingCategories] = useState(true);

  const [loadError, setLoadError] = useState(false);
  const [categoryError, setCategoryError] = useState(false);
  const [refreshKey, setRefreshKey] = useState(0);

  // Debounced search.
  useEffect(() => {
    const timer = window.setTimeout(() => {
      setDebouncedSearch(search.trim());
      setPage(1);
    }, 400);

    return () => window.clearTimeout(timer);
  }, [search]);

  // Load kategori yang hanya dimiliki client.
  useEffect(() => {
    let active = true;

    async function loadCategories() {
      try {
        setIsLoadingCategories(true);
        setCategoryError(false);

        const response = await clientPortalService.getServiceCategories();

        if (!active) return;

        const { categories, hasUncategorized } = response.data;

        setCategories(categories);
        setHasUncategorized(hasUncategorized);

        setCategoryId((current) => {
          if (current === "ALL") return current;

          if (current === "uncategorized") {
            return hasUncategorized ? current : "ALL";
          }

          return categories.some((category) => category.id === current)
            ? current
            : "ALL";
        });
      } catch (error) {
        if (!active) return;

        setCategoryError(true);

        toast.error("Gagal mengambil kategori layanan.", {
          description:
            error instanceof Error
              ? error.message
              : "Terjadi kesalahan pada server.",
        });
      } finally {
        if (active) {
          setIsLoadingCategories(false);
        }
      }
    }

    void loadCategories();

    return () => {
      active = false;
    };
  }, [refreshKey]);

  // Load layanan berdasarkan server-side filter.
  useEffect(() => {
    let active = true;

    async function loadServices() {
      try {
        setIsLoading(true);
        setLoadError(false);

        const response = await clientPortalService.getServices({
          search: debouncedSearch || undefined,
          status: status === "ALL" ? undefined : status,
          categoryId: categoryId === "ALL" ? undefined : categoryId,
          page,
          limit: 10,
        });

        if (!active) return;

        if (page > Math.max(response.meta.totalPages, 1)) {
          setPage(Math.max(response.meta.totalPages, 1));
          return;
        }

        setItems(response.data);
        setTotal(response.meta.total);
        setTotalPages(response.meta.totalPages);
      } catch (error) {
        if (!active) return;

        setItems([]);
        setTotal(0);
        setTotalPages(0);
        setLoadError(true);

        toast.error("Gagal mengambil service.", {
          description:
            error instanceof Error
              ? error.message
              : "Terjadi kesalahan pada server.",
        });
      } finally {
        if (active) {
          setIsLoading(false);
        }
      }
    }

    void loadServices();

    return () => {
      active = false;
    };
  }, [debouncedSearch, status, categoryId, page, refreshKey]);

  const groupedItems = useMemo(() => {
    const groups = new Map<string, ClientServiceGroup>();

    for (const item of items) {
      const category = item.masterService.category;

      const groupId = category?.id ?? "uncategorized";

      let group = groups.get(groupId);

      if (!group) {
        group = {
          id: groupId,
          name: category?.name ?? "Uncategorized",
          sortOrder: category?.sortOrder ?? Number.MAX_SAFE_INTEGER,
          items: [],
        };

        groups.set(groupId, group);
      }

      group.items.push(item);
    }

    return Array.from(groups.values()).sort(
      (a, b) =>
        a.sortOrder - b.sortOrder ||
        a.name.localeCompare(b.name) ||
        a.id.localeCompare(b.id),
    );
  }, [items]);

  const hasFilters =
    search.trim().length > 0 || status !== "ALL" || categoryId !== "ALL";

  function resetFilters() {
    setSearch("");
    setDebouncedSearch("");
    setStatus("ALL");
    setCategoryId("ALL");
    setPage(1);
  }

  function refreshData() {
    setPage(1);
    setRefreshKey((current) => current + 1);
  }

  return (
    <div className="min-w-0 space-y-6 p-4 sm:p-6">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight">My Services</h1>

          <p className="text-sm text-muted-foreground">
            Pantau layanan dan progress pekerjaan perusahaan Anda berdasarkan
            kategori.
          </p>
        </div>

        <Button
          variant="outline"
          disabled={isLoading || isLoadingCategories}
          onClick={refreshData}>
          <RefreshCw
            className={`size-4 ${
              isLoading || isLoadingCategories ? "animate-spin" : ""
            }`}
          />
          Refresh
        </Button>
      </div>

      <Card className="min-w-0">
        <CardHeader>
          <CardTitle>Services</CardTitle>

          <CardDescription>
            {isLoading || loadError
              ? "Daftar layanan perusahaan Anda."
              : `Total ${total} project service sesuai filter.`}
          </CardDescription>
        </CardHeader>

        <CardContent className="space-y-4">
          <div className="flex flex-col flex-wrap gap-3 xl:flex-row">
            <div className="relative min-w-0 flex-1">
              <Search className="absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />

              <Input
                value={search}
                onChange={(event) => setSearch(event.target.value)}
                placeholder="Cari service, kategori, atau project..."
                className="pl-9"
              />
            </div>

            <Select
              value={categoryId}
              disabled={isLoadingCategories || categoryError}
              onValueChange={(value) => {
                setCategoryId(value);
                setPage(1);
              }}>
              <SelectTrigger
                className="w-full xl:w-64"
                aria-label="Filter kategori layanan">
                <SelectValue />
              </SelectTrigger>

              <SelectContent>
                <SelectItem value="ALL">Semua Kategori</SelectItem>

                {categories.map((category) => (
                  <SelectItem key={category.id} value={category.id}>
                    {category.name}
                  </SelectItem>
                ))}

                {hasUncategorized && (
                  <SelectItem value="uncategorized">Uncategorized</SelectItem>
                )}
              </SelectContent>
            </Select>

            <Select
              value={status}
              onValueChange={(value) => {
                setStatus(value);
                setPage(1);
              }}>
              <SelectTrigger
                className="w-full xl:w-44"
                aria-label="Filter status layanan">
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

            {hasFilters && (
              <Button variant="ghost" onClick={resetFilters}>
                Reset Filter
              </Button>
            )}
          </div>

          {categoryError && (
            <p className="text-xs text-destructive">
              Filter kategori gagal dimuat. Gunakan tombol Refresh untuk mencoba
              kembali.
            </p>
          )}

          <div className="max-w-full overflow-x-auto rounded-lg border">
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
                      <Loader2 className="mx-auto size-5 animate-spin" />

                      <p className="mt-2">Memuat layanan...</p>
                    </TableCell>
                  </TableRow>
                ) : loadError ? (
                  <TableRow>
                    <TableCell colSpan={5} className="h-28 text-center">
                      <p className="text-sm text-muted-foreground">
                        Gagal memuat layanan.
                      </p>

                      <Button
                        className="mt-3"
                        size="sm"
                        variant="outline"
                        onClick={refreshData}>
                        Coba Lagi
                      </Button>
                    </TableCell>
                  </TableRow>
                ) : groupedItems.length === 0 ? (
                  <TableRow>
                    <TableCell
                      colSpan={5}
                      className="h-28 text-center text-muted-foreground">
                      {hasFilters
                        ? "Tidak ada layanan yang sesuai dengan filter."
                        : "Belum ada layanan untuk perusahaan Anda."}
                    </TableCell>
                  </TableRow>
                ) : (
                  groupedItems.map((group) => (
                    <Fragment key={group.id}>
                      <TableRow className="bg-muted/50 hover:bg-muted/50">
                        <TableCell colSpan={5} className="py-3">
                          <div className="flex flex-wrap items-center gap-2">
                            <FolderTree className="size-4 text-muted-foreground" />

                            <span className="text-sm font-semibold">
                              {group.name}
                            </span>

                            <Badge variant="outline">
                              {group.items.length} service di halaman ini
                            </Badge>
                          </div>
                        </TableCell>
                      </TableRow>

                      {group.items.map((item) => (
                        <TableRow key={item.id}>
                          <TableCell>
                            <div className="min-w-40">
                              <p className="font-medium">
                                {item.masterService.name}
                              </p>

                              <p className="font-mono text-xs text-muted-foreground">
                                {item.masterService.code}
                              </p>
                            </div>
                          </TableCell>

                          <TableCell>
                            <Link
                              href={`/portal/projects/${item.project.id}`}
                              className="font-medium hover:underline">
                              {item.project.name}
                            </Link>

                            <p className="text-xs text-muted-foreground">
                              {item.project.projectCode}
                            </p>
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
                                  <p className="mt-1 text-xs text-muted-foreground">
                                    {item.workflowInstance.currentStepKey}
                                  </p>
                                )}
                              </div>
                            ) : (
                              <span className="text-xs text-muted-foreground">
                                —
                              </span>
                            )}
                          </TableCell>

                          <TableCell>
                            <div className="whitespace-nowrap text-sm">
                              {item.startDate
                                ? formatDate(item.startDate)
                                : "—"}
                            </div>

                            <div className="whitespace-nowrap text-xs text-muted-foreground">
                              s/d{" "}
                              {item.endDate ? formatDate(item.endDate) : "—"}
                            </div>
                          </TableCell>
                        </TableRow>
                      ))}
                    </Fragment>
                  ))
                )}
              </TableBody>
            </Table>
          </div>

          <Pagination
            page={page}
            totalPages={totalPages}
            isLoading={isLoading || loadError}
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
      ? "border-emerald-200 bg-emerald-50 text-emerald-700 dark:border-emerald-900 dark:bg-emerald-950 dark:text-emerald-300"
      : status === "PAUSED"
        ? "border-amber-200 bg-amber-50 text-amber-700 dark:border-amber-900 dark:bg-amber-950 dark:text-amber-300"
        : status === "CANCELLED"
          ? "border-red-200 bg-red-50 text-red-700 dark:border-red-900 dark:bg-red-950 dark:text-red-300"
          : "border-blue-200 bg-blue-50 text-blue-700 dark:border-blue-900 dark:bg-blue-950 dark:text-blue-300";

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
    <div className="flex flex-wrap items-center justify-between gap-3">
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
