"use client";

import { ChevronLeft, ChevronRight, Eye, Plus, Search } from "lucide-react";
import Link from "next/link";
import { useCallback, useEffect, useState } from "react";
import { toast } from "sonner";

import {
  ClientSupportTicketItem,
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
import { CreateSupportDialog } from "./components/create-support-dialog";

const SUPPORT_STATUSES = [
  "OPEN",
  "IN_PROGRESS",
  "WAITING_CLIENT",
  "RESOLVED",
  "CLOSED",
] as const;

export function ClientSupportPage() {
  const [tickets, setTickets] = useState<ClientSupportTicketItem[]>([]);
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

  const loadTickets = useCallback(async () => {
    try {
      setIsLoading(true);

      const response = await clientPortalService.getSupportTickets({
        search: debouncedSearch || undefined,
        status: status === "ALL" ? undefined : status,
        page,
        limit: 10,
      });

      setTickets(response.data);
      setTotal(response.meta.total);
      setTotalPages(response.meta.totalPages);
    } catch (error) {
      toast.error("Gagal mengambil support ticket.", {
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
    void loadTickets();
  }, [loadTickets]);

  return (
    <div className="space-y-6 p-6">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight">Support</h1>

          <p className="text-sm text-muted-foreground">
            Buat dan pantau ticket support untuk project Anda.
          </p>
        </div>

        <CreateSupportDialog
          onSuccess={loadTickets}
          trigger={
            <Button>
              <Plus className="mr-2 size-4" />
              Buat Ticket
            </Button>
          }
        />
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Support Tickets</CardTitle>

          <CardDescription>Total {total} ticket.</CardDescription>
        </CardHeader>

        <CardContent className="space-y-4">
          <div className="flex flex-col gap-3 sm:flex-row">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />

              <Input
                value={search}
                onChange={(event) => setSearch(event.target.value)}
                placeholder="Cari nomor atau subject..."
                className="pl-9"
              />
            </div>

            <Select
              value={status}
              onValueChange={(value) => {
                setStatus(value);
                setPage(1);
              }}>
              <SelectTrigger className="w-full sm:w-56">
                <SelectValue />
              </SelectTrigger>

              <SelectContent>
                <SelectItem value="ALL">Semua Status</SelectItem>

                {SUPPORT_STATUSES.map((item) => (
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
                  <TableHead>Ticket</TableHead>
                  <TableHead>Project</TableHead>
                  <TableHead>Priority</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Messages</TableHead>
                  <TableHead>Updated</TableHead>
                  <TableHead className="w-16 text-right">Action</TableHead>
                </TableRow>
              </TableHeader>

              <TableBody>
                {isLoading ? (
                  <TableRow>
                    <TableCell
                      colSpan={7}
                      className="h-28 text-center text-muted-foreground">
                      Memuat ticket...
                    </TableCell>
                  </TableRow>
                ) : tickets.length === 0 ? (
                  <TableRow>
                    <TableCell
                      colSpan={7}
                      className="h-28 text-center text-muted-foreground">
                      Belum ada support ticket.
                    </TableCell>
                  </TableRow>
                ) : (
                  tickets.map((ticket) => (
                    <TableRow key={ticket.id}>
                      <TableCell>
                        <div className="font-medium">{ticket.subject}</div>

                        <div className="text-xs text-muted-foreground">
                          {ticket.ticketNo}
                        </div>
                      </TableCell>

                      <TableCell>
                        {ticket.project ? ticket.project.name : "-"}
                      </TableCell>

                      <TableCell>
                        <PriorityBadge priority={ticket.priority} />
                      </TableCell>

                      <TableCell>
                        <StatusBadge status={ticket.status} />
                      </TableCell>

                      <TableCell>{ticket._count.messages}</TableCell>

                      <TableCell>{formatDate(ticket.updatedAt)}</TableCell>

                      <TableCell className="text-right">
                        <Button size="icon" variant="ghost" asChild>
                          <Link href={`/portal/support/${ticket.id}`}>
                            <Eye className="size-4" />
                          </Link>
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

function StatusBadge({ status }: { status: string }) {
  const className =
    status === "RESOLVED" || status === "CLOSED"
      ? "border-emerald-200 bg-emerald-50 text-emerald-700"
      : status === "WAITING_CLIENT"
        ? "border-amber-200 bg-amber-50 text-amber-700"
        : "border-blue-200 bg-blue-50 text-blue-700";

  return (
    <Badge variant="outline" className={className}>
      {formatStatus(status)}
    </Badge>
  );
}

function PriorityBadge({ priority }: { priority: string }) {
  const className =
    priority === "URGENT"
      ? "border-red-200 bg-red-50 text-red-700"
      : priority === "HIGH"
        ? "border-orange-200 bg-orange-50 text-orange-700"
        : "border-border";

  return (
    <Badge variant="outline" className={className}>
      {formatStatus(priority)}
    </Badge>
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
