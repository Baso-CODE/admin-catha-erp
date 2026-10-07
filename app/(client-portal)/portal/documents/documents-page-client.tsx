"use client";

import {
  ChevronLeft,
  ChevronRight,
  ExternalLink,
  FileText,
  Search,
} from "lucide-react";
import { useCallback, useEffect, useState } from "react";
import { toast } from "sonner";

import {
  ClientDocumentItem,
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
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";

export function ClientDocumentsPage() {
  const [items, setItems] = useState<ClientDocumentItem[]>([]);
  const [search, setSearch] = useState("");
  const [debouncedSearch, setDebouncedSearch] = useState("");
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

  const loadDocuments = useCallback(async () => {
    try {
      setIsLoading(true);

      const response = await clientPortalService.getDocuments({
        search: debouncedSearch || undefined,
        page,
        limit: 20,
      });

      setItems(response.data);
      setTotal(response.meta.total);
      setTotalPages(response.meta.totalPages);
    } catch (error) {
      toast.error("Gagal mengambil document.", {
        description:
          error instanceof Error
            ? error.message
            : "Terjadi kesalahan pada server.",
      });
    } finally {
      setIsLoading(false);
    }
  }, [debouncedSearch, page]);

  useEffect(() => {
    void loadDocuments();
  }, [loadDocuments]);

  return (
    <div className="space-y-6 p-6">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight">Documents</h1>

        <p className="text-sm text-muted-foreground">
          File dan dokumen yang dibagikan kepada perusahaan Anda.
        </p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Client Documents</CardTitle>
          <CardDescription>Total {total} document.</CardDescription>
        </CardHeader>

        <CardContent className="space-y-4">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />

            <Input
              value={search}
              onChange={(event) => setSearch(event.target.value)}
              placeholder="Cari nama file..."
              className="pl-9"
            />
          </div>

          <div className="rounded-lg border">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Document</TableHead>
                  <TableHead>Source</TableHead>
                  <TableHead>Reference</TableHead>
                  <TableHead>Size</TableHead>
                  <TableHead>Uploaded</TableHead>
                  <TableHead className="w-16 text-right">Action</TableHead>
                </TableRow>
              </TableHeader>

              <TableBody>
                {isLoading ? (
                  <TableRow>
                    <TableCell
                      colSpan={6}
                      className="h-28 text-center text-muted-foreground">
                      Memuat document...
                    </TableCell>
                  </TableRow>
                ) : items.length === 0 ? (
                  <TableRow>
                    <TableCell
                      colSpan={6}
                      className="h-28 text-center text-muted-foreground">
                      Belum ada document yang dibagikan.
                    </TableCell>
                  </TableRow>
                ) : (
                  items.map((item) => (
                    <TableRow key={item.id}>
                      <TableCell>
                        <div className="flex items-center gap-3">
                          <div className="rounded-lg bg-muted p-2">
                            <FileText className="size-4" />
                          </div>

                          <div className="min-w-0">
                            <div className="max-w-[320px] truncate font-medium">
                              {item.fileName}
                            </div>

                            <div className="text-xs text-muted-foreground">
                              {item.fileType}
                            </div>
                          </div>
                        </div>
                      </TableCell>

                      <TableCell>
                        <Badge variant="outline">
                          {formatStatus(item.source)}
                        </Badge>
                      </TableCell>

                      <TableCell>{getReference(item)}</TableCell>

                      <TableCell>{formatFileSize(item.fileSize)}</TableCell>

                      <TableCell>{formatDate(item.createdAt)}</TableCell>

                      <TableCell className="text-right">
                        <Button size="icon" variant="ghost" asChild>
                          <a
                            href={item.fileUrl}
                            target="_blank"
                            rel="noreferrer">
                            <ExternalLink className="size-4" />
                          </a>
                        </Button>
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </div>

          <div className="flex items-center justify-between">
            <p className="text-sm text-muted-foreground">
              Halaman {totalPages === 0 ? 0 : page} dari {totalPages}
            </p>

            <div className="flex gap-2">
              <Button
                variant="outline"
                size="sm"
                disabled={page <= 1 || isLoading}
                onClick={() => setPage((current) => Math.max(1, current - 1))}>
                <ChevronLeft className="size-4" />
                Sebelumnya
              </Button>

              <Button
                variant="outline"
                size="sm"
                disabled={page >= totalPages || totalPages === 0 || isLoading}
                onClick={() => setPage((current) => current + 1)}>
                Selanjutnya
                <ChevronRight className="size-4" />
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

function getReference(item: ClientDocumentItem) {
  if (item.project) {
    return (
      <div>
        <div>{item.project.name}</div>
        <div className="text-xs text-muted-foreground">
          {item.project.projectCode}
        </div>
      </div>
    );
  }

  if (item.deliverable) {
    return (
      <div>
        <div>{item.deliverable.name}</div>
        <div className="text-xs text-muted-foreground">
          {item.deliverable.project.projectCode} · v{item.deliverable.version}
        </div>
      </div>
    );
  }

  if (item.contract) {
    return (
      <div>
        <div>{item.contract.title}</div>
        <div className="text-xs text-muted-foreground">
          {item.contract.contractNo}
        </div>
      </div>
    );
  }

  return "-";
}

function formatFileSize(bytes: number) {
  if (bytes <= 0) return "0 B";

  const units = ["B", "KB", "MB", "GB"];
  const index = Math.min(
    Math.floor(Math.log(bytes) / Math.log(1024)),
    units.length - 1,
  );

  return `${(bytes / 1024 ** index).toFixed(
    index === 0 ? 0 : 1,
  )} ${units[index]}`;
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
