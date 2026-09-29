"use client";

import {
  CalendarClock,
  CheckCircle2,
  Mail,
  MessageCircle,
  MoreHorizontal,
  Pencil,
  Phone,
  StickyNote,
  Trash2,
  UserRound,
  XCircle,
} from "lucide-react";
import { useCallback, useEffect, useState } from "react";
import { toast } from "sonner";

import {
  ActivityItem,
  activityService,
} from "@/app/services/crm/activity.service";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

import { PermissionGuard } from "@/components/shared/permission-guard";
import { ConfirmDeleteDialog } from "./confirm-delete-dialog";
import { CreateActivityModal } from "./create-activity-modal";
import { EditActivityModal } from "./edit-activity-modal";

interface ActivityTimelineProps {
  leadId: string;
  permissions: string[];
  onRefreshLead?: () => void | Promise<void>;
}

function getActivityIcon(type: string) {
  switch (type) {
    case "CALL":
      return Phone;

    case "WHATSAPP":
      return MessageCircle;

    case "EMAIL":
      return Mail;

    case "MEETING":
    case "VISIT":
      return CalendarClock;

    default:
      return StickyNote;
  }
}

function getStatusBadge(status: string) {
  switch (status) {
    case "COMPLETED":
      return (
        <Badge
          variant="outline"
          className="border-emerald-500/20 bg-emerald-500/10 text-emerald-600 dark:text-emerald-400">
          <CheckCircle2 className="mr-1 size-3" />
          Completed
        </Badge>
      );

    case "CANCELLED":
      return (
        <Badge
          variant="outline"
          className="border-destructive/20 bg-destructive/10 text-destructive">
          <XCircle className="mr-1 size-3" />
          Cancelled
        </Badge>
      );

    default:
      return (
        <Badge
          variant="outline"
          className="border-blue-500/20 bg-blue-500/10 text-blue-600 dark:text-blue-400">
          <CalendarClock className="mr-1 size-3" />
          Scheduled
        </Badge>
      );
  }
}

function formatDateTime(value: string) {
  return new Intl.DateTimeFormat("id-ID", {
    day: "2-digit",
    month: "long",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  }).format(new Date(value));
}

export function ActivityTimeline({
  leadId,
  permissions,
  onRefreshLead,
}: ActivityTimelineProps) {
  const [activities, setActivities] = useState<ActivityItem[]>([]);
  const [loading, setLoading] = useState(true);

  const loadActivities = useCallback(async () => {
    try {
      setLoading(true);

      const response = await activityService.getAll({
        leadId,
        page: 1,
        limit: 100,
      });

      if (response.success) {
        setActivities(response.data);
      }
    } catch (error) {
      toast.error("Gagal memuat aktivitas", {
        description:
          error instanceof Error
            ? error.message
            : "Terjadi kesalahan pada server.",
      });
    } finally {
      setLoading(false);
    }
  }, [leadId]);

  useEffect(() => {
    void loadActivities();
  }, [loadActivities]);

  const handleRefresh = async () => {
    await loadActivities();
    await onRefreshLead?.();
  };

  const handleDelete = async (activity: ActivityItem) => {
    try {
      const response = await activityService.remove(activity.id);

      toast.success(response.message || "Activity berhasil dihapus.");

      await handleRefresh();
    } catch (error) {
      toast.error("Gagal menghapus activity", {
        description:
          error instanceof Error
            ? error.message
            : "Terjadi kesalahan pada server.",
      });

      throw error;
    }
  };

  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between gap-4">
        <div>
          <CardTitle className="text-base font-semibold">
            Activity Timeline
          </CardTitle>

          <p className="mt-1 text-xs text-muted-foreground">
            Riwayat komunikasi dan follow-up terhadap lead.
          </p>
        </div>
        <PermissionGuard
          permissions={permissions}
          required="crm.activity.create">
          <CreateActivityModal leadId={leadId} onSuccess={handleRefresh} />
        </PermissionGuard>
      </CardHeader>

      <CardContent>
        {loading ? (
          <div className="py-12 text-center text-sm text-muted-foreground">
            Memuat aktivitas...
          </div>
        ) : activities.length === 0 ? (
          <div className="rounded-lg border border-dashed py-12 text-center">
            <CalendarClock className="mx-auto mb-3 size-8 text-muted-foreground" />

            <p className="text-sm font-medium">Belum ada aktivitas</p>

            <p className="mt-1 text-xs text-muted-foreground">
              Tambahkan call, WhatsApp, meeting, email, atau catatan pertama.
            </p>
          </div>
        ) : (
          <div className="relative space-y-0">
            {activities.map((activity, index) => {
              const Icon = getActivityIcon(activity.type);

              return (
                <div
                  key={activity.id}
                  className="relative flex gap-4 pb-8 last:pb-0">
                  {index !== activities.length - 1 && (
                    <div className="absolute left-4 top-9 h-[calc(100%-1rem)] w-px bg-border" />
                  )}

                  <div className="relative z-10 flex size-8 shrink-0 items-center justify-center rounded-full border bg-background">
                    <Icon className="size-4 text-primary" />
                  </div>

                  <div className="min-w-0 flex-1 rounded-lg border bg-card p-4">
                    <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
                      <div className="min-w-0">
                        <div className="flex flex-wrap items-center gap-2">
                          <h3 className="font-medium">{activity.subject}</h3>

                          <Badge variant="secondary">{activity.type}</Badge>

                          {getStatusBadge(activity.status)}
                        </div>

                        <p className="mt-2 whitespace-pre-wrap text-sm text-muted-foreground">
                          {activity.description}
                        </p>
                      </div>

                      <div className="flex shrink-0 items-start gap-2">
                        <p className="pt-2 text-xs text-muted-foreground">
                          {formatDateTime(activity.activityDate)}
                        </p>

                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <Button
                              variant="ghost"
                              size="icon"
                              className="size-8">
                              <MoreHorizontal className="size-4" />
                            </Button>
                          </DropdownMenuTrigger>

                          <DropdownMenuContent
                            align="end"
                            className="w-44 border bg-popover shadow-lg ring-1 ring-black/5">
                            <PermissionGuard
                              permissions={permissions}
                              required="crm.activity.update">
                              <EditActivityModal
                                activity={activity}
                                onSuccess={handleRefresh}
                                trigger={
                                  <DropdownMenuItem
                                    onSelect={(event) =>
                                      event.preventDefault()
                                    }>
                                    <Pencil className="mr-2 size-4" />
                                    Edit Activity
                                  </DropdownMenuItem>
                                }
                              />
                            </PermissionGuard>

                            <PermissionGuard
                              permissions={permissions}
                              required="crm.activity.delete">
                              <DropdownMenuSeparator />

                              <ConfirmDeleteDialog
                                title="Hapus activity?"
                                description={`Activity "${activity.subject}" akan dihapus permanen.`}
                                triggerLabel="Hapus Activity"
                                loadingLabel="Menghapus Activity..."
                                onConfirm={() => handleDelete(activity)}
                                trigger={
                                  <DropdownMenuItem
                                    variant="destructive"
                                    onSelect={(event) =>
                                      event.preventDefault()
                                    }>
                                    <Trash2 className="mr-2 size-4" />
                                    Hapus Activity
                                  </DropdownMenuItem>
                                }
                              />
                            </PermissionGuard>
                          </DropdownMenuContent>
                        </DropdownMenu>
                      </div>
                    </div>

                    {activity.result && (
                      <div className="mt-4 rounded-md bg-muted/50 p-3">
                        <p className="text-xs font-medium text-muted-foreground">
                          Result
                        </p>

                        <p className="mt-1 text-sm">{activity.result}</p>
                      </div>
                    )}

                    <div className="mt-4 flex flex-wrap items-center gap-x-5 gap-y-2 border-t pt-3 text-xs text-muted-foreground">
                      <div className="flex items-center gap-1.5">
                        <UserRound className="size-3.5" />

                        {activity.performedBy?.name ?? "-"}
                      </div>

                      {activity.nextFollowUp && (
                        <div className="flex items-center gap-1.5">
                          <CalendarClock className="size-3.5" />
                          Follow-up: {formatDateTime(activity.nextFollowUp)}
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </CardContent>
    </Card>
  );
}
