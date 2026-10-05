"use client";

import { TaskActivityItem, taskService } from "@/app/services/task.service";
import { Badge } from "@/components/ui/badge";
import {
  ArrowRight,
  CircleDot,
  History,
  MoveRight,
  Pencil,
  Plus,
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
};

function ActivityIcon({ action }: { action: string }) {
  switch (action) {
    case "CREATE":
      return <Plus className="size-4" />;

    case "UPDATE":
      return <Pencil className="size-4" />;

    case "MOVE":
      return <MoveRight className="size-4" />;

    default:
      return <CircleDot className="size-4" />;
  }
}

function getStatusLabel(value: unknown) {
  if (typeof value !== "string") {
    return "-";
  }

  const labels: Record<string, string> = {
    TODO: "Todo",
    IN_PROGRESS: "In Progress",
    REVIEW: "Review",
    BLOCKED: "Blocked",
    COMPLETED: "Completed",
  };

  return labels[value] ?? value;
}

export function TaskActivitySection({ taskId }: TaskActivitySectionProps) {
  const [activities, setActivities] = useState<TaskActivityItem[]>([]);

  const [isLoading, setIsLoading] = useState(true);

  const fetchActivity = useCallback(async () => {
    try {
      setIsLoading(true);

      const data = await taskService.getTaskActivity(taskId);

      setActivities(data);
    } catch (error) {
      console.error("Gagal mengambil activity task:", error);

      setActivities([]);
    } finally {
      setIsLoading(false);
    }
  }, [taskId]);

  useEffect(() => {
    fetchActivity();
  }, [fetchActivity]);

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

  return (
    <section className="space-y-4">
      <div className="flex items-center gap-2">
        <History className="size-4" />

        <h3 className="font-medium">Activity</h3>

        <Badge variant="secondary">{activities.length}</Badge>
      </div>

      {!activities.length ? (
        <p className="text-sm text-muted-foreground">Belum ada activity.</p>
      ) : (
        <div className="space-y-0">
          {activities.map((activity, index) => {
            const details = activity.details ?? {};

            const fromStatus = details["fromStatus"];

            const toStatus = details["toStatus"];

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
                      {actionLabel[activity.action] ?? activity.action}
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
        </div>
      )}
    </section>
  );
}
