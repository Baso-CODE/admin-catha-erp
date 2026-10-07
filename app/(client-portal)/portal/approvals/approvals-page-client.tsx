"use client";

import { CheckCircle2, FileText, RefreshCcw } from "lucide-react";
import { useCallback, useEffect, useState } from "react";
import { toast } from "sonner";

import {
  ClientApprovalItem,
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
import { RevisionDialog } from "./components/revision-dialog";

export function ClientApprovalsPage() {
  const [items, setItems] = useState<ClientApprovalItem[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [actionId, setActionId] = useState<string | null>(null);

  const loadData = useCallback(async () => {
    try {
      setIsLoading(true);

      const response = await clientPortalService.getApprovals();

      setItems(response.data);
    } catch (error) {
      toast.error("Gagal mengambil approval.", {
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
    void loadData();
  }, [loadData]);

  const handleApprove = async (approval: ClientApprovalItem) => {
    try {
      setActionId(approval.id);

      await clientPortalService.approve(approval.id);

      toast.success("Deliverable berhasil disetujui.");

      await loadData();
    } catch (error) {
      toast.error("Gagal menyetujui deliverable.", {
        description:
          error instanceof Error
            ? error.message
            : "Terjadi kesalahan pada server.",
      });
    } finally {
      setActionId(null);
    }
  };

  return (
    <div className="space-y-6 p-6">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight">
          Deliverable Approval
        </h1>

        <p className="text-sm text-muted-foreground">
          Review deliverable, setujui hasil pekerjaan, atau kirim permintaan
          revisi.
        </p>
      </div>

      {isLoading ? (
        <div className="py-10 text-center text-sm text-muted-foreground">
          Memuat approval...
        </div>
      ) : items.length === 0 ? (
        <Card>
          <CardContent className="py-10 text-center text-sm text-muted-foreground">
            Belum ada approval request.
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-4">
          {items.map((item) => {
            const canRespond = item.status === "PENDING_CLIENT_APPROVAL";

            return (
              <Card key={item.id}>
                <CardHeader>
                  <div className="flex flex-col gap-3 lg:flex-row lg:items-start lg:justify-between">
                    <div>
                      <div className="flex flex-wrap items-center gap-2">
                        <CardTitle className="text-lg">
                          {item.deliverable.name}
                        </CardTitle>

                        <Badge variant="outline">
                          v{item.deliverable.version}
                        </Badge>

                        <StatusBadge status={item.status} />
                      </div>

                      <CardDescription className="mt-2">
                        {item.deliverable.project.name} ·{" "}
                        {item.deliverable.project.projectCode}
                      </CardDescription>
                    </div>

                    <span className="text-xs text-muted-foreground">
                      Diminta {formatDate(item.requestedAt)}
                    </span>
                  </div>
                </CardHeader>

                <CardContent className="space-y-4">
                  <p className="text-sm text-muted-foreground">
                    {item.deliverable.description ||
                      "Tidak ada deskripsi deliverable."}
                  </p>

                  <div className="flex flex-wrap gap-3">
                    {item.deliverable.fileUrl && (
                      <Button variant="outline" asChild>
                        <a
                          href={item.deliverable.fileUrl}
                          target="_blank"
                          rel="noreferrer">
                          <FileText className="mr-2 size-4" />
                          Lihat File
                        </a>
                      </Button>
                    )}

                    {canRespond && (
                      <>
                        <Button
                          disabled={actionId === item.id}
                          onClick={() => void handleApprove(item)}>
                          <CheckCircle2 className="mr-2 size-4" />
                          Approve
                        </Button>

                        <RevisionDialog
                          approval={item}
                          onSuccess={loadData}
                          trigger={
                            <Button
                              variant="outline"
                              disabled={actionId === item.id}>
                              <RefreshCcw className="mr-2 size-4" />
                              Request Revision
                            </Button>
                          }
                        />
                      </>
                    )}
                  </div>

                  {item.feedback && (
                    <div className="rounded-lg border bg-muted/40 p-4">
                      <p className="text-xs font-medium text-muted-foreground">
                        Feedback
                      </p>

                      <p className="mt-1 text-sm">{item.feedback}</p>
                    </div>
                  )}

                  {item.respondedAt && (
                    <p className="text-xs text-muted-foreground">
                      Direspons {formatDate(item.respondedAt)}
                      {item.approver ? ` oleh ${item.approver.fullName}` : ""}
                    </p>
                  )}
                </CardContent>
              </Card>
            );
          })}
        </div>
      )}
    </div>
  );
}

function StatusBadge({ status }: { status: string }) {
  const className =
    status === "APPROVED"
      ? "border-emerald-200 bg-emerald-50 text-emerald-700"
      : status === "REVISION_REQUIRED" || status === "REJECTED"
        ? "border-amber-200 bg-amber-50 text-amber-700"
        : "border-blue-200 bg-blue-50 text-blue-700";

  return (
    <Badge variant="outline" className={className}>
      {formatStatus(status)}
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
    hour: "2-digit",
    minute: "2-digit",
  }).format(new Date(value));
}
