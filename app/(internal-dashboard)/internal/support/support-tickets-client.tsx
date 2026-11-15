"use client";

import {
  Loader2,
  MessageSquareText,
  RefreshCw,
  Search,
  Send,
} from "lucide-react";
import { useCallback, useEffect, useState } from "react";
import { toast } from "sonner";

import {
  supportTicketService,
  type SupportTicketDetail,
  type SupportTicketItem,
  type SupportTicketPriority,
  type SupportTicketStatus,
} from "@/app/services/support-ticket.service";

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
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Textarea } from "@/components/ui/textarea";

interface Props {
  permissions: string[];
}

const STATUS_LABELS: Record<SupportTicketStatus, string> = {
  OPEN: "Open",
  IN_PROGRESS: "In Progress",
  WAITING_CLIENT: "Waiting Client",
  RESOLVED: "Resolved",
  CLOSED: "Closed",
};

const PRIORITY_LABELS: Record<SupportTicketPriority, string> = {
  LOW: "Low",
  MEDIUM: "Medium",
  HIGH: "High",
  URGENT: "Urgent",
};

const NEXT_STATUSES: Record<SupportTicketStatus, SupportTicketStatus[]> = {
  OPEN: ["IN_PROGRESS", "CLOSED"],
  IN_PROGRESS: ["WAITING_CLIENT", "RESOLVED", "CLOSED"],
  WAITING_CLIENT: ["IN_PROGRESS", "RESOLVED", "CLOSED"],
  RESOLVED: ["IN_PROGRESS", "CLOSED"],
  CLOSED: [],
};

function errorMessage(error: unknown) {
  return error instanceof Error ? error.message : "Terjadi kesalahan.";
}

function dateTime(value: string) {
  return new Date(value).toLocaleString("id-ID", {
    day: "2-digit",
    month: "short",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

function TicketStatusBadge({ status }: { status: SupportTicketStatus }) {
  return (
    <Badge
      variant={
        status === "CLOSED"
          ? "outline"
          : status === "RESOLVED"
            ? "default"
            : "secondary"
      }>
      {STATUS_LABELS[status]}
    </Badge>
  );
}

export default function SupportTicketsClient({ permissions }: Props) {
  const canUpdate = permissions.includes("client.update");

  const [tickets, setTickets] = useState<SupportTicketItem[]>([]);
  const [loading, setLoading] = useState(true);

  const [searchInput, setSearchInput] = useState("");
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("ALL");
  const [priorityFilter, setPriorityFilter] = useState("ALL");
  const [page, setPage] = useState(1);
  const [refreshKey, setRefreshKey] = useState(0);

  const [meta, setMeta] = useState({
    page: 1,
    limit: 10,
    total: 0,
    totalPages: 0,
  });

  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [detail, setDetail] = useState<SupportTicketDetail | null>(null);
  const [detailLoading, setDetailLoading] = useState(false);

  const [reply, setReply] = useState("");
  const [processing, setProcessing] = useState(false);

  const refreshList = useCallback(() => {
    setRefreshKey((value) => value + 1);
  }, []);

  useEffect(() => {
    let active = true;

    async function load() {
      setLoading(true);

      try {
        const result = await supportTicketService.getAll({
          page,
          limit: 10,
          search: search || undefined,
          status:
            statusFilter === "ALL"
              ? undefined
              : (statusFilter as SupportTicketStatus),
          priority:
            priorityFilter === "ALL"
              ? undefined
              : (priorityFilter as SupportTicketPriority),
        });

        if (!active) return;

        setTickets(result.data);
        setMeta(result.meta);
      } catch (error) {
        if (!active) return;

        setTickets([]);
        toast.error(errorMessage(error));
      } finally {
        if (active) setLoading(false);
      }
    }

    void load();

    return () => {
      active = false;
    };
  }, [page, search, statusFilter, priorityFilter, refreshKey]);

  const loadDetail = useCallback(async (id: string) => {
    setDetailLoading(true);

    try {
      const result = await supportTicketService.getById(id);
      setDetail(result.data);
    } catch (error) {
      setDetail(null);
      toast.error(errorMessage(error));
    } finally {
      setDetailLoading(false);
    }
  }, []);

  useEffect(() => {
    if (!selectedId) {
      setDetail(null);
      return;
    }

    let active = true;

    setDetail(null);
    setDetailLoading(true);

    void supportTicketService
      .getById(selectedId)
      .then((result) => {
        if (active) setDetail(result.data);
      })
      .catch((error) => {
        if (active) toast.error(errorMessage(error));
      })
      .finally(() => {
        if (active) setDetailLoading(false);
      });

    return () => {
      active = false;
    };
  }, [selectedId]);

  async function updateTicket(payload: {
    status?: SupportTicketStatus;
    priority?: SupportTicketPriority;
  }) {
    if (!selectedId || processing || !canUpdate) return;

    setProcessing(true);

    try {
      await supportTicketService.update(selectedId, payload);
      await loadDetail(selectedId);
      refreshList();

      toast.success("Support ticket berhasil diperbarui.");
    } catch (error) {
      toast.error(errorMessage(error));
    } finally {
      setProcessing(false);
    }
  }

  async function sendReply() {
    if (!selectedId || !reply.trim() || processing || !canUpdate) {
      return;
    }

    setProcessing(true);

    try {
      await supportTicketService.reply(selectedId, reply.trim());

      setReply("");
      await loadDetail(selectedId);
      refreshList();

      toast.success("Balasan berhasil dikirim.");
    } catch (error) {
      toast.error(errorMessage(error));
    } finally {
      setProcessing(false);
    }
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="flex items-center gap-2 text-2xl font-semibold">
            <MessageSquareText className="size-6" />
            Support Ticket Management
          </h1>
          <p className="text-sm text-muted-foreground">
            Pantau, tangani, dan balas permintaan bantuan client.
          </p>
        </div>

        <Button variant="outline" disabled={loading} onClick={refreshList}>
          <RefreshCw className={loading ? "animate-spin" : ""} />
          Refresh
        </Button>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Daftar Support Ticket</CardTitle>
          <CardDescription>
            {meta.total} tiket sesuai hak akses Anda.
          </CardDescription>

          <div className="flex flex-wrap gap-3 pt-3">
            <form
              className="flex min-w-56 flex-1 gap-2"
              onSubmit={(event) => {
                event.preventDefault();
                setPage(1);
                setSearch(searchInput);
              }}>
              <Input
                value={searchInput}
                onChange={(event) => setSearchInput(event.target.value)}
                placeholder="Cari tiket atau nama client..."
              />

              <Button type="submit" variant="outline">
                <Search className="size-4" />
                Cari
              </Button>
            </form>

            <Select
              value={statusFilter}
              onValueChange={(value) => {
                setStatusFilter(value);
                setPage(1);
              }}>
              <SelectTrigger className="w-44">
                <SelectValue placeholder="Status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="ALL">Semua Status</SelectItem>
                {Object.entries(STATUS_LABELS).map(([key, value]) => (
                  <SelectItem key={key} value={key}>
                    {value}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>

            <Select
              value={priorityFilter}
              onValueChange={(value) => {
                setPriorityFilter(value);
                setPage(1);
              }}>
              <SelectTrigger className="w-40">
                <SelectValue placeholder="Prioritas" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="ALL">Semua Prioritas</SelectItem>
                {Object.entries(PRIORITY_LABELS).map(([key, value]) => (
                  <SelectItem key={key} value={key}>
                    {value}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </CardHeader>

        <CardContent className="space-y-4">
          {loading ? (
            <div className="space-y-3">
              {Array.from({ length: 5 }, (_, index) => (
                <Skeleton key={index} className="h-12 w-full" />
              ))}
            </div>
          ) : tickets.length === 0 ? (
            <p className="py-12 text-center text-sm text-muted-foreground">
              Tidak ada tiket pada filter ini.
            </p>
          ) : (
            <div className="overflow-x-auto rounded-lg border">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Ticket</TableHead>
                    <TableHead>Client</TableHead>
                    <TableHead>Subject</TableHead>
                    <TableHead>Prioritas</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Terakhir Update</TableHead>
                    <TableHead className="text-right">Aksi</TableHead>
                  </TableRow>
                </TableHeader>

                <TableBody>
                  {tickets.map((ticket) => (
                    <TableRow key={ticket.id}>
                      <TableCell className="font-medium">
                        {ticket.ticketNo}
                      </TableCell>
                      <TableCell>{ticket.client.companyName}</TableCell>
                      <TableCell>{ticket.subject}</TableCell>
                      <TableCell>
                        <Badge variant="outline">
                          {PRIORITY_LABELS[ticket.priority]}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        <TicketStatusBadge status={ticket.status} />
                      </TableCell>
                      <TableCell>{dateTime(ticket.updatedAt)}</TableCell>
                      <TableCell className="text-right">
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => setSelectedId(ticket.id)}>
                          Detail
                        </Button>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          )}

          <div className="flex items-center justify-between border-t pt-4">
            <p className="text-sm text-muted-foreground">
              Halaman {page} dari {Math.max(meta.totalPages, 1)}
            </p>

            <div className="flex gap-2">
              <Button
                size="sm"
                variant="outline"
                disabled={loading || page <= 1}
                onClick={() => setPage((value) => value - 1)}>
                Sebelumnya
              </Button>

              <Button
                size="sm"
                variant="outline"
                disabled={loading || page >= meta.totalPages}
                onClick={() => setPage((value) => value + 1)}>
                Berikutnya
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>

      <Dialog
        open={selectedId !== null}
        onOpenChange={(open) => {
          if (!open && !processing) {
            setSelectedId(null);
            setReply("");
          }
        }}>
        <DialogContent className="max-h-[90vh] overflow-y-auto sm:max-w-3xl">
          <DialogHeader>
            <DialogTitle>
              {detail?.ticketNo ?? "Detail Support Ticket"}
            </DialogTitle>
            <DialogDescription>
              Percakapan dengan client dan pengelolaan tiket.
            </DialogDescription>
          </DialogHeader>

          {detailLoading ? (
            <div className="flex items-center gap-2 py-8">
              <Loader2 className="size-5 animate-spin" />
              Memuat tiket...
            </div>
          ) : !detail ? (
            <p className="text-sm text-muted-foreground">
              Detail tiket tidak tersedia.
            </p>
          ) : (
            <div className="space-y-6">
              <div className="space-y-2">
                <div className="flex flex-wrap items-center gap-2">
                  <h3 className="text-lg font-semibold">{detail.subject}</h3>
                  <TicketStatusBadge status={detail.status} />
                </div>

                <p className="text-sm text-muted-foreground">
                  {detail.client.companyName} · {detail.requester.fullName}
                </p>

                {detail.project && (
                  <p className="text-xs text-muted-foreground">
                    Project: {detail.project.projectCode} —{" "}
                    {detail.project.name}
                  </p>
                )}

                <p className="rounded-lg border bg-muted/30 p-3 text-sm whitespace-pre-wrap">
                  {detail.description}
                </p>
              </div>

              {canUpdate && (
                <div className="grid gap-4 sm:grid-cols-2">
                  <div className="space-y-2">
                    <Label>Status Ticket</Label>

                    <Select
                      value={detail.status}
                      disabled={
                        processing || NEXT_STATUSES[detail.status].length === 0
                      }
                      onValueChange={(value) =>
                        void updateTicket({
                          status: value as SupportTicketStatus,
                        })
                      }>
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value={detail.status}>
                          {STATUS_LABELS[detail.status]}
                        </SelectItem>

                        {NEXT_STATUSES[detail.status].map((status) => (
                          <SelectItem key={status} value={status}>
                            {STATUS_LABELS[status]}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="space-y-2">
                    <Label>Prioritas</Label>
                    <Select
                      value={detail.priority}
                      disabled={processing}
                      onValueChange={(value) =>
                        void updateTicket({
                          priority: value as SupportTicketPriority,
                        })
                      }>
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        {Object.entries(PRIORITY_LABELS).map(([key, label]) => (
                          <SelectItem key={key} value={key}>
                            {label}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                </div>
              )}

              <div className="space-y-3">
                <h3 className="font-semibold">Percakapan</h3>

                {detail.messages.length === 0 ? (
                  <p className="text-sm text-muted-foreground">
                    Belum ada balasan untuk tiket ini.
                  </p>
                ) : (
                  <div className="max-h-72 space-y-3 overflow-y-auto rounded-lg border p-3">
                    {detail.messages.map((message) => (
                      <div
                        key={message.id}
                        className="rounded-lg bg-muted/40 p-3">
                        <div className="flex flex-wrap justify-between gap-2">
                          <p className="text-sm font-semibold">
                            {message.author.name}
                          </p>
                          <p className="text-xs text-muted-foreground">
                            {dateTime(message.createdAt)}
                          </p>
                        </div>

                        <p className="mt-2 whitespace-pre-wrap text-sm">
                          {message.message}
                        </p>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              {canUpdate && !["CLOSED", "RESOLVED"].includes(detail.status) && (
                <div className="space-y-3">
                  <Label htmlFor="support-reply">Balas Client</Label>

                  <Textarea
                    id="support-reply"
                    value={reply}
                    onChange={(event) => setReply(event.target.value)}
                    rows={4}
                    maxLength={10000}
                    placeholder="Tulis tanggapan untuk client..."
                  />

                  <div className="flex justify-end">
                    <Button
                      disabled={
                        processing ||
                        !reply.trim() ||
                        reply.trim().length > 10000
                      }
                      onClick={() => void sendReply()}>
                      {processing ? (
                        <Loader2 className="size-4 animate-spin" />
                      ) : (
                        <Send className="size-4" />
                      )}
                      Kirim Balasan
                    </Button>
                  </div>
                </div>
              )}
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}
