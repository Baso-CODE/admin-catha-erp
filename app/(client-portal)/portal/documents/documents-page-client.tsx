"use client";

import {
  ChevronLeft,
  ChevronRight,
  Download,
  FileText,
  Loader2,
  Search,
} from "lucide-react";
import { useCallback, useEffect, useState } from "react";
import { toast } from "sonner";

import {
  clientPortalService,
  type ClientDocumentItem,
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
  const [downloadingId, setDownloadingId] = useState<string | null>(null);

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
      toast.error(
        error instanceof Error ? error.message : "Gagal mengambil dokumen.",
      );
    } finally {
      setIsLoading(false);
    }
  }, [debouncedSearch, page]);

  useEffect(() => {
    void loadDocuments();
  }, [loadDocuments]);

  async function downloadDocument(documentId: string) {
    if (downloadingId) return;

    setDownloadingId(documentId);

    try {
      const response =
        await clientPortalService.getDocumentDownloadUrl(documentId);

      // URL hanya dibuat setelah backend memeriksa akses.
      // Signed URL tidak disimpan di state atau localStorage.
      window.location.assign(response.data.url);
    } catch (error) {
      toast.error("Gagal mengunduh dokumen.", {
        description:
          error instanceof Error
            ? error.message
            : "Terjadi kesalahan pada server.",
      });
    } finally {
      setDownloadingId(null);
    }
  }

  return (
    <div className="space-y-6 p-6">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight">
          Documents Center
        </h1>

        <p className="text-sm text-muted-foreground">
          Akses dokumen project, deliverable, dan contract yang telah dibagikan
          kepada perusahaan Anda.
        </p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Client Documents</CardTitle>

          <CardDescription>
            Total {total} dokumen yang dapat diakses.
          </CardDescription>
        </CardHeader>

        <CardContent className="space-y-4">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />

            <Input
              value={search}
              onChange={(event) => setSearch(event.target.value)}
              placeholder="Cari nama dokumen..."
              className="pl-9"
            />
          </div>

          <div className="overflow-x-auto rounded-lg border">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Document</TableHead>
                  <TableHead>Source</TableHead>
                  <TableHead>Reference</TableHead>
                  <TableHead>Size</TableHead>
                  <TableHead>Uploaded</TableHead>
                  <TableHead className="text-right">Action</TableHead>
                </TableRow>
              </TableHeader>

              <TableBody>
                {isLoading ? (
                  <TableRow>
                    <TableCell
                      colSpan={6}
                      className="h-28 text-center text-muted-foreground">
                      <Loader2 className="mx-auto size-5 animate-spin" />
                      <p className="mt-2">Memuat dokumen...</p>
                    </TableCell>
                  </TableRow>
                ) : items.length === 0 ? (
                  <TableRow>
                    <TableCell
                      colSpan={6}
                      className="h-28 text-center text-muted-foreground">
                      Belum ada dokumen yang tersedia.
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
                            <div className="max-w-64 truncate font-medium">
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
                          {formatSource(item.source)}
                        </Badge>
                      </TableCell>

                      <TableCell>{getReference(item)}</TableCell>

                      <TableCell>{formatFileSize(item.fileSize)}</TableCell>

                      <TableCell>{formatDate(item.createdAt)}</TableCell>

                      <TableCell className="text-right">
                        <Button
                          size="sm"
                          variant="outline"
                          disabled={downloadingId !== null}
                          onClick={() => void downloadDocument(item.id)}>
                          {downloadingId === item.id ? (
                            <Loader2 className="size-4 animate-spin" />
                          ) : (
                            <Download className="size-4" />
                          )}
                          Unduh
                        </Button>
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </div>

          <div className="flex items-center justify-between gap-3">
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
  // Deliverable didahulukan karena memiliki projectId.
  if (item.deliverable) {
    return (
      <div>
        <p>{item.deliverable.name}</p>
        <p className="text-xs text-muted-foreground">
          {item.deliverable.project.projectCode}
          {" · "}v{item.deliverable.version}
        </p>
      </div>
    );
  }

  if (item.contract) {
    return (
      <div>
        <p>{item.contract.title}</p>
        <p className="text-xs text-muted-foreground">
          {item.contract.contractNo}
        </p>
      </div>
    );
  }

  if (item.project) {
    return (
      <div>
        <p>{item.project.name}</p>
        <p className="text-xs text-muted-foreground">
          {item.project.projectCode}
        </p>
      </div>
    );
  }

  return "—";
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

function formatSource(value: string) {
  return value
    .toLowerCase()
    .split("_")
    .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
    .join(" ");
}

function formatDate(value: string) {
  return new Intl.DateTimeFormat("id-ID", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  }).format(new Date(value));
}
