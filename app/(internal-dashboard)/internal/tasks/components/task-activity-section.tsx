"use client";

import { TaskActivityItem, taskService } from "@/app/services/task.service";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  ArrowRight,
  CheckCircle2,
  CircleDot,
  FileText,
  History,
  MessageSquare,
  MoveRight,
  Paperclip,
  Pencil,
  Plus,
  Trash2,
} from "lucide-react";
import { useCallback, useEffect, useState } from "react";

interface TaskActivitySectionProps {
  taskId: string;
}

const actionLabel: Record<string, string> = {
  CREATE: "Task dibuat",
  UPDATE: "Task diperbarui",
  MOVE: "Task dipindahkan",
  DELETE: "Task dihapus",

  CHECKLIST_CREATE: "Checklist ditambahkan",
  CHECKLIST_UPDATE: "Checklist diperbarui",
  CHECKLIST_DELETE: "Checklist dihapus",

  COMMENT_CREATE: "Komentar ditambahkan",
  COMMENT_UPDATE: "Komentar diperbarui",
  COMMENT_DELETE: "Komentar dihapus",

  ATTACHMENT_CREATE: "Attachment diunggah",
  ATTACHMENT_DELETE: "Attachment dihapus",
};

function ActivityIcon({ action }: { action: string }) {
  switch (action) {
    case "CREATE":
      return <Plus className="size-4" />;

    case "UPDATE":
      return <Pencil className="size-4" />;

    case "MOVE":
      return <MoveRight className="size-4" />;

    case "CHECKLIST_CREATE":
      return <Plus className="size-4" />;

    case "CHECKLIST_UPDATE":
      return <CheckCircle2 className="size-4" />;

    case "CHECKLIST_DELETE":
      return <Trash2 className="size-4" />;

    case "COMMENT_CREATE":
      return <MessageSquare className="size-4" />;

    case "COMMENT_UPDATE":
      return <Pencil className="size-4" />;

    case "COMMENT_DELETE":
      return <Trash2 className="size-4" />;

    case "ATTACHMENT_CREATE":
      return <Paperclip className="size-4" />;

    case "ATTACHMENT_DELETE":
      return <Trash2 className="size-4" />;

    default:
      return <CircleDot className="size-4" />;
  }
}

function formatFileSize(value: unknown) {
  if (typeof value !== "number") {
    return null;
  }

  if (value < 1024) {
    return `${value} B`;
  }

  if (value < 1024 * 1024) {
    return `${(value / 1024).toFixed(1)} KB`;
  }

  return `${(value / (1024 * 1024)).toFixed(1)} MB`;
}

function getStatusLabel(value: string) {
  const labels: Record<string, string> = {
    TODO: "Todo",
    IN_PROGRESS: "In Progress",
    REVIEW: "Review",
    BLOCKED: "Blocked",
    COMPLETED: "Completed",
  };

  return labels[value] ?? value;
}

function formatPriority(value: unknown) {
  if (typeof value !== "string") {
    return "-";
  }

  const labels: Record<string, string> = {
    LOW: "Low",
    MEDIUM: "Medium",
    HIGH: "High",
  };

  return labels[value] ?? value;
}

function formatDateTime(value: unknown) {
  if (typeof value !== "string" || !value) {
    return "-";
  }

  const date = new Date(value);

  if (Number.isNaN(date.getTime())) {
    return "-";
  }

  return date.toLocaleString("id-ID");
}

function getChangedFields(
  before: Record<string, unknown> | null,
  after: Record<string, unknown> | null,
) {
  if (!before || !after) {
    return [];
  }

  const fields = [
    "title",
    "description",
    "assigneeId",
    "parentTaskId",
    "priority",
    "status",
    "startDate",
    "dueDate",
  ];

  return fields.filter((field) => before[field] !== after[field]);
}

export function TaskActivitySection({ taskId }: TaskActivitySectionProps) {
  const [activities, setActivities] = useState<TaskActivityItem[]>([]);

  const [meta, setMeta] = useState({
    total: 0,
    page: 1,
    limit: 20,
    totalPages: 1,
  });

  const [isLoading, setIsLoading] = useState(true);
  const [isLoadingMore, setIsLoadingMore] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchActivity = useCallback(
    async (page = 1, append = false) => {
      try {
        if (append) {
          setIsLoadingMore(true);
        } else {
          setIsLoading(true);
        }

        setError(null);

        const result = await taskService.getTaskActivity(taskId, page, 20);

        setActivities((current) => {
          if (!append) {
            return result.data;
          }

          const existingIds = new Set(current.map((activity) => activity.id));

          return [
            ...current,
            ...result.data.filter((activity) => !existingIds.has(activity.id)),
          ];
        });

        setMeta(result.meta);
      } catch (error) {
        console.error("Gagal mengambil activity task:", error);

        setError(
          error instanceof Error
            ? error.message
            : "Gagal mengambil activity task.",
        );
      } finally {
        setIsLoading(false);
        setIsLoadingMore(false);
      }
    },
    [taskId],
  );

  useEffect(() => {
    fetchActivity();
  }, [fetchActivity]);

  const handleLoadMore = async () => {
    if (isLoadingMore || meta.page >= meta.totalPages) {
      return;
    }

    await fetchActivity(meta.page + 1, true);
  };

  const hasMore = meta.page < meta.totalPages;

  if (isLoading) {
    return (
      <section className="space-y-3">
        <div className="flex items-center gap-2">
          <History className="size-4" />

          <h3 className="font-medium">Activity</h3>
        </div>

        <p className="text-sm text-muted-foreground">Memuat activity...</p>
      </section>
    );
  }

  if (error && !activities.length) {
    return (
      <section className="space-y-3">
        <div className="flex items-center gap-2">
          <History className="size-4" />

          <h3 className="font-medium">Activity</h3>
        </div>

        <div className="rounded-md border border-destructive/30 p-3">
          <p className="text-sm text-destructive">{error}</p>

          <Button
            type="button"
            variant="outline"
            size="sm"
            className="mt-3"
            onClick={() => fetchActivity()}>
            Coba Lagi
          </Button>
        </div>
      </section>
    );
  }

  return (
    <section className="space-y-4">
      <div className="flex items-center gap-2">
        <History className="size-4" />

        <h3 className="font-medium">Activity</h3>

        <Badge variant="secondary">{meta.total}</Badge>
      </div>

      {!activities.length ? (
        <p className="text-sm text-muted-foreground">Belum ada activity.</p>
      ) : (
        <div className="space-y-0">
          {activities.map((activity, index) => {
            const details = activity.details ?? {};

            const fromStatus =
              typeof details["fromStatus"] === "string"
                ? details["fromStatus"]
                : null;

            const toStatus =
              typeof details["toStatus"] === "string"
                ? details["toStatus"]
                : null;

            const type =
              typeof details["type"] === "string" ? details["type"] : null;

            const before =
              typeof details["before"] === "object" &&
              details["before"] !== null
                ? (details["before"] as Record<string, unknown>)
                : null;

            const after =
              typeof details["after"] === "object" && details["after"] !== null
                ? (details["after"] as Record<string, unknown>)
                : null;

            const changedFields =
              activity.action === "UPDATE" && type === "TASK_UPDATE"
                ? getChangedFields(before, after)
                : [];

            const comment =
              typeof details["comment"] === "string"
                ? details["comment"]
                : null;

            const beforeComment =
              typeof before?.["comment"] === "string"
                ? (before["comment"] as string)
                : null;

            const afterComment =
              typeof after?.["comment"] === "string"
                ? (after["comment"] as string)
                : null;

            const fileName =
              typeof details["fileName"] === "string"
                ? details["fileName"]
                : null;

            const fileUrl =
              typeof details["fileUrl"] === "string"
                ? details["fileUrl"]
                : null;

            const fileType =
              typeof details["fileType"] === "string"
                ? details["fileType"]
                : null;

            const fileSize = formatFileSize(details["fileSize"]);

            const description =
              typeof details["description"] === "string"
                ? details["description"]
                : typeof after?.["description"] === "string"
                  ? (after["description"] as string)
                  : typeof before?.["description"] === "string"
                    ? (before["description"] as string)
                    : null;

            const beforeCompleted = before?.["isCompleted"];

            const afterCompleted = after?.["isCompleted"];

            const isChecklistCompleted =
              activity.action === "CHECKLIST_UPDATE" &&
              beforeCompleted === false &&
              afterCompleted === true;

            const isChecklistReopened =
              activity.action === "CHECKLIST_UPDATE" &&
              beforeCompleted === true &&
              afterCompleted === false;

            return (
              <div key={activity.id} className="relative flex gap-3 pb-5">
                {index !== activities.length - 1 && (
                  <div className="absolute left-4 top-8 h-full w-px bg-border" />
                )}

                <div className="relative z-10 flex size-8 shrink-0 items-center justify-center rounded-full border bg-background">
                  <ActivityIcon action={activity.action} />
                </div>

                <div className="min-w-0 flex-1 pt-1">
                  <div className="flex flex-wrap items-center gap-2">
                    <span className="text-sm font-medium">
                      {isChecklistCompleted
                        ? "Checklist diselesaikan"
                        : isChecklistReopened
                          ? "Checklist dibuka kembali"
                          : (actionLabel[activity.action] ?? activity.action)}
                    </span>

                    <Badge variant="outline" className="text-[10px]">
                      {activity.action}
                    </Badge>
                  </div>

                  {activity.action === "MOVE" && fromStatus && toStatus && (
                    <div className="mt-2 flex flex-wrap items-center gap-2 text-xs text-muted-foreground">
                      <Badge variant="secondary">
                        {getStatusLabel(fromStatus)}
                      </Badge>

                      <ArrowRight className="size-3" />

                      <Badge variant="secondary">
                        {getStatusLabel(toStatus)}
                      </Badge>
                    </div>
                  )}

                  {type === "TASK_UPDATE" &&
                    activity.action === "UPDATE" &&
                    changedFields.length > 0 && (
                      <div className="mt-3 space-y-2">
                        {changedFields.map((field) => {
                          let label = field;

                          let beforeValue = before?.[field];

                          let afterValue = after?.[field];

                          switch (field) {
                            case "title":
                              label = "Judul";
                              break;

                            case "description":
                              label = "Deskripsi";
                              break;

                            case "assigneeId":
                              label = "Assignee";

                              beforeValue =
                                before?.["assigneeName"] ?? "Tidak ada";

                              afterValue =
                                after?.["assigneeName"] ?? "Tidak ada";
                              break;

                            case "parentTaskId":
                              label = "Parent Task";

                              beforeValue =
                                before?.["parentTaskTitle"] ?? "Tidak ada";

                              afterValue =
                                after?.["parentTaskTitle"] ?? "Tidak ada";
                              break;

                            case "priority":
                              label = "Priority";

                              beforeValue = formatPriority(beforeValue);

                              afterValue = formatPriority(afterValue);
                              break;

                            case "status":
                              label = "Status";

                              beforeValue =
                                typeof beforeValue === "string"
                                  ? getStatusLabel(beforeValue)
                                  : "-";

                              afterValue =
                                typeof afterValue === "string"
                                  ? getStatusLabel(afterValue)
                                  : "-";
                              break;

                            case "startDate":
                              label = "Start Date";

                              beforeValue = formatDateTime(beforeValue);

                              afterValue = formatDateTime(afterValue);
                              break;

                            case "dueDate":
                              label = "Due Date";

                              beforeValue = formatDateTime(beforeValue);

                              afterValue = formatDateTime(afterValue);
                              break;
                          }

                          return (
                            <div
                              key={field}
                              className="rounded-md border bg-muted/30 px-3 py-2">
                              <p className="mb-1 text-xs font-medium text-muted-foreground">
                                {label}
                              </p>

                              <div className="flex flex-wrap items-center gap-2 text-sm">
                                <span className="wrap-break-words text-muted-foreground">
                                  {String(beforeValue ?? "-")}
                                </span>

                                <ArrowRight className="size-3 shrink-0 text-muted-foreground" />

                                <span className="wrap-break-words font-medium text-foreground">
                                  {String(afterValue ?? "-")}
                                </span>
                              </div>
                            </div>
                          );
                        })}
                      </div>
                    )}

                  {type === "CHECKLIST" && (
                    <div className="mt-2 space-y-1">
                      {description && (
                        <p className="text-sm text-foreground">{description}</p>
                      )}

                      {activity.action === "CHECKLIST_UPDATE" &&
                        typeof beforeCompleted === "boolean" &&
                        typeof afterCompleted === "boolean" &&
                        beforeCompleted !== afterCompleted && (
                          <div className="flex items-center gap-2 text-xs text-muted-foreground">
                            <Badge variant="secondary">
                              {beforeCompleted ? "Selesai" : "Belum selesai"}
                            </Badge>

                            <ArrowRight className="size-3" />

                            <Badge variant="secondary">
                              {afterCompleted ? "Selesai" : "Belum selesai"}
                            </Badge>
                          </div>
                        )}
                    </div>
                  )}

                  {type === "COMMENT" && (
                    <div className="mt-2 space-y-2">
                      {activity.action === "COMMENT_CREATE" && comment && (
                        <div className="rounded-md border bg-muted/40 px-3 py-2">
                          <p className="whitespace-pre-wrap wrap-break-words text-sm text-foreground">
                            {comment}
                          </p>
                        </div>
                      )}

                      {activity.action === "COMMENT_UPDATE" && (
                        <div className="space-y-2">
                          {beforeComment && (
                            <div className="rounded-md border px-3 py-2">
                              <p className="mb-1 text-[11px] font-medium uppercase tracking-wide text-muted-foreground">
                                Sebelum
                              </p>

                              <p className="whitespace-pre-wrap wrap-break-words text-sm text-muted-foreground line-through">
                                {beforeComment}
                              </p>
                            </div>
                          )}

                          {afterComment && (
                            <div className="rounded-md border bg-muted/40 px-3 py-2">
                              <p className="mb-1 text-[11px] font-medium uppercase tracking-wide text-muted-foreground">
                                Sesudah
                              </p>

                              <p className="whitespace-pre-wrap wrap-break-words text-sm text-foreground">
                                {afterComment}
                              </p>
                            </div>
                          )}
                        </div>
                      )}

                      {activity.action === "COMMENT_DELETE" && comment && (
                        <div className="rounded-md border border-dashed px-3 py-2">
                          <p className="whitespace-pre-wrap wrap-break-words text-sm text-muted-foreground">
                            {comment}
                          </p>
                        </div>
                      )}
                    </div>
                  )}

                  {type === "ATTACHMENT" && (
                    <div className="mt-2">
                      <div className="flex items-start gap-3 rounded-md border bg-muted/30 px-3 py-2">
                        <div className="mt-0.5 flex size-8 shrink-0 items-center justify-center rounded-md border bg-background">
                          <FileText className="size-4 text-muted-foreground" />
                        </div>

                        <div className="min-w-0 flex-1">
                          {fileName && (
                            <>
                              {activity.action === "ATTACHMENT_CREATE" &&
                              fileUrl ? (
                                <a
                                  href={fileUrl}
                                  target="_blank"
                                  rel="noreferrer"
                                  className="block truncate text-sm font-medium hover:underline">
                                  {fileName}
                                </a>
                              ) : (
                                <p className="truncate text-sm font-medium">
                                  {fileName}
                                </p>
                              )}
                            </>
                          )}

                          {(fileType || fileSize) && (
                            <p className="mt-0.5 text-xs text-muted-foreground">
                              {[fileType, fileSize].filter(Boolean).join(" • ")}
                            </p>
                          )}

                          {activity.action === "ATTACHMENT_DELETE" && (
                            <p className="mt-1 text-xs text-muted-foreground">
                              File telah dihapus.
                            </p>
                          )}
                        </div>
                      </div>
                    </div>
                  )}

                  <div className="mt-2 text-xs text-muted-foreground">
                    oleh{" "}
                    <span className="font-medium text-foreground">
                      {activity.user.name || activity.user.email}
                    </span>
                    {" • "}
                    {new Date(activity.createdAt).toLocaleString("id-ID")}
                  </div>
                </div>
              </div>
            );
          })}

          {hasMore && (
            <div className="flex justify-center pt-2">
              <Button
                type="button"
                variant="outline"
                size="sm"
                disabled={isLoadingMore}
                onClick={handleLoadMore}>
                {isLoadingMore
                  ? "Memuat..."
                  : `Muat aktivitas lainnya (${activities.length}/${meta.total})`}
              </Button>
            </div>
          )}
        </div>
      )}
    </section>
  );
}
