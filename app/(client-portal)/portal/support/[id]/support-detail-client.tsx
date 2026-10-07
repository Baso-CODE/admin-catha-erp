"use client";

import { ArrowLeft, Loader2, MessageSquareText, Send } from "lucide-react";
import Link from "next/link";
import { useCallback, useEffect, useMemo, useState } from "react";
import { toast } from "sonner";

import {
  ClientSupportTicketDetail,
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
import { Textarea } from "@/components/ui/textarea";

interface ClientSupportDetailPageProps {
  ticketId: string;
}

export function ClientSupportDetailPage({
  ticketId,
}: ClientSupportDetailPageProps) {
  const [ticket, setTicket] = useState<ClientSupportTicketDetail | null>(null);
  const [message, setMessage] = useState("");
  const [isLoading, setIsLoading] = useState(true);
  const [isSending, setIsSending] = useState(false);

  const loadTicket = useCallback(async () => {
    try {
      setIsLoading(true);

      const response = await clientPortalService.getSupportTicketById(ticketId);

      setTicket(response.data);
    } catch (error) {
      toast.error("Gagal mengambil detail support ticket.", {
        description:
          error instanceof Error
            ? error.message
            : "Terjadi kesalahan pada server.",
      });
    } finally {
      setIsLoading(false);
    }
  }, [ticketId]);

  useEffect(() => {
    void loadTicket();
  }, [loadTicket]);

  const canSendMessage = useMemo(() => {
    return ticket?.status !== "CLOSED";
  }, [ticket?.status]);

  const handleSendMessage = async () => {
    const value = message.trim();

    if (!value) {
      toast.error("Pesan tidak boleh kosong.");
      return;
    }

    try {
      setIsSending(true);

      await clientPortalService.createSupportMessage(ticketId, value);

      setMessage("");

      toast.success("Pesan berhasil dikirim.");

      await loadTicket();
    } catch (error) {
      toast.error("Gagal mengirim pesan.", {
        description:
          error instanceof Error
            ? error.message
            : "Terjadi kesalahan pada server.",
      });
    } finally {
      setIsSending(false);
    }
  };

  if (isLoading) {
    return (
      <div className="p-6 text-sm text-muted-foreground">
        Memuat support ticket...
      </div>
    );
  }

  if (!ticket) {
    return (
      <div className="p-6 text-sm text-muted-foreground">
        Support ticket tidak ditemukan.
      </div>
    );
  }

  return (
    <div className="space-y-6 p-6">
      <Button variant="ghost" size="sm" asChild className="-ml-3">
        <Link href="/portal/support">
          <ArrowLeft className="mr-2 size-4" />
          Kembali ke Support
        </Link>
      </Button>

      <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
        <div>
          <div className="flex flex-wrap items-center gap-2">
            <h1 className="text-2xl font-semibold tracking-tight">
              {ticket.subject}
            </h1>

            <StatusBadge status={ticket.status} />
            <PriorityBadge priority={ticket.priority} />
          </div>

          <p className="mt-1 font-mono text-xs text-muted-foreground">
            {ticket.ticketNo}
          </p>
        </div>

        <div className="text-sm text-muted-foreground lg:text-right">
          <p>Dibuat {formatDateTime(ticket.createdAt)}</p>

          <p>Update terakhir {formatDateTime(ticket.updatedAt)}</p>
        </div>
      </div>

      <div className="grid gap-4 lg:grid-cols-[minmax(0,1fr)_320px]">
        <div className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="text-base">Deskripsi Ticket</CardTitle>
            </CardHeader>

            <CardContent>
              <p className="whitespace-pre-wrap text-sm">
                {ticket.description}
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <MessageSquareText className="size-5" />
                Conversation
              </CardTitle>

              <CardDescription>
                Riwayat komunikasi support ticket.
              </CardDescription>
            </CardHeader>

            <CardContent className="space-y-4">
              {ticket.messages.length === 0 ? (
                <div className="rounded-lg border border-dashed py-8 text-center text-sm text-muted-foreground">
                  Belum ada pesan.
                </div>
              ) : (
                <div className="space-y-3">
                  {ticket.messages.map((item) => (
                    <div
                      key={item.id}
                      className="rounded-xl border bg-muted/20 p-4">
                      <div className="flex flex-col gap-1 sm:flex-row sm:items-center sm:justify-between">
                        <p className="text-sm font-medium">
                          {item.author.name}
                        </p>

                        <p className="text-xs text-muted-foreground">
                          {formatDateTime(item.createdAt)}
                        </p>
                      </div>

                      <p className="mt-3 whitespace-pre-wrap text-sm text-muted-foreground">
                        {item.message}
                      </p>
                    </div>
                  ))}
                </div>
              )}

              {canSendMessage ? (
                <div className="space-y-3 border-t pt-4">
                  <Textarea
                    value={message}
                    onChange={(event) => setMessage(event.target.value)}
                    placeholder="Tulis pesan..."
                    rows={5}
                    maxLength={10000}
                    disabled={isSending}
                  />

                  <div className="flex items-center justify-between gap-3">
                    <p className="text-xs text-muted-foreground">
                      {message.length}/10000
                    </p>

                    <Button
                      disabled={isSending || !message.trim()}
                      onClick={() => void handleSendMessage()}>
                      {isSending ? (
                        <Loader2 className="mr-2 size-4 animate-spin" />
                      ) : (
                        <Send className="mr-2 size-4" />
                      )}
                      Kirim Pesan
                    </Button>
                  </div>
                </div>
              ) : (
                <div className="rounded-lg border bg-muted/40 p-4 text-sm text-muted-foreground">
                  Ticket ini sudah ditutup dan tidak dapat menerima pesan baru.
                </div>
              )}
            </CardContent>
          </Card>
        </div>

        <div className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="text-base">Informasi Ticket</CardTitle>
            </CardHeader>

            <CardContent className="space-y-4 text-sm">
              <InfoRow label="Requester" value={ticket.requester.fullName} />

              <InfoRow label="Email" value={ticket.requester.email} />

              <InfoRow label="Status" value={formatStatus(ticket.status)} />

              <InfoRow label="Priority" value={formatStatus(ticket.priority)} />
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="text-base">Project</CardTitle>
            </CardHeader>

            <CardContent>
              {ticket.project ? (
                <div className="space-y-2">
                  <p className="font-medium">{ticket.project.name}</p>

                  <p className="font-mono text-xs text-muted-foreground">
                    {ticket.project.projectCode}
                  </p>

                  <Button variant="outline" size="sm" asChild className="mt-2">
                    <Link href={`/portal/projects/${ticket.project.id}`}>
                      Lihat Project
                    </Link>
                  </Button>
                </div>
              ) : (
                <p className="text-sm text-muted-foreground">
                  Ticket ini tidak terhubung dengan project tertentu.
                </p>
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}

function InfoRow({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex items-start justify-between gap-4">
      <span className="text-muted-foreground">{label}</span>

      <span className="text-right font-medium">{value}</span>
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

function formatDateTime(value: string) {
  return new Intl.DateTimeFormat("id-ID", {
    day: "2-digit",
    month: "short",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  }).format(new Date(value));
}
