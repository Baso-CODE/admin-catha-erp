"use client";

import {
  NotificationItem,
  notificationService,
} from "@/app/services/notification.service";
import { Button } from "@/components/ui/button";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { Bell, CheckCheck, CircleAlert, Loader2 } from "lucide-react";
import { useRouter } from "next/navigation";
import { useCallback, useEffect, useState } from "react";
import { toast } from "sonner";

export function NotificationBell() {
  const router = useRouter();

  const [notifications, setNotifications] = useState<NotificationItem[]>([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [loading, setLoading] = useState(true);
  const [markingAll, setMarkingAll] = useState(false);

  const fetchNotifications = useCallback(async () => {
    try {
      const response = await notificationService.getAll({
        page: 1,
        limit: 20,
      });

      setNotifications(response.data);
      setUnreadCount(response.meta.unreadCount);
    } catch {
      toast.error("Gagal mengambil notification");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void fetchNotifications();

    const interval = window.setInterval(() => {
      void fetchNotifications();
    }, 60_000);

    return () => window.clearInterval(interval);
  }, [fetchNotifications]);

  const handleNotificationClick = async (notification: NotificationItem) => {
    try {
      if (!notification.isRead) {
        await notificationService.markAsRead(notification.id);

        setNotifications((current) =>
          current.map((item) =>
            item.id === notification.id
              ? {
                  ...item,
                  isRead: true,
                  readAt: new Date().toISOString(),
                }
              : item,
          ),
        );

        setUnreadCount((current) => Math.max(0, current - 1));
      }

      if (notification.actionUrl) {
        router.push(notification.actionUrl);
      }
    } catch {
      toast.error("Gagal membuka notification");
    }
  };

  const handleMarkAllAsRead = async () => {
    if (unreadCount === 0) return;

    setMarkingAll(true);

    try {
      await notificationService.markAllAsRead();

      const now = new Date().toISOString();

      setNotifications((current) =>
        current.map((item) => ({
          ...item,
          isRead: true,
          readAt: item.readAt ?? now,
        })),
      );

      setUnreadCount(0);
    } catch {
      toast.error("Gagal menandai semua notification");
    } finally {
      setMarkingAll(false);
    }
  };

  return (
    <Popover>
      <PopoverTrigger asChild>
        <Button
          variant="ghost"
          size="icon"
          className="relative size-9"
          aria-label="Notification">
          <Bell className="size-4" />

          {unreadCount > 0 && (
            <span className="absolute -right-1 -top-1 flex min-h-4 min-w-4 items-center justify-center rounded-full bg-destructive px-1 text-[10px] font-semibold leading-none text-destructive-foreground">
              {unreadCount > 99 ? "99+" : unreadCount}
            </span>
          )}
        </Button>
      </PopoverTrigger>

      <PopoverContent
        align="end"
        sideOffset={8}
        className="w-[380px] overflow-hidden p-0">
        <div className="flex items-center justify-between border-b px-4 py-3">
          <div>
            <p className="font-semibold">Notifications</p>
            <p className="text-xs text-muted-foreground">
              {unreadCount > 0
                ? `${unreadCount} belum dibaca`
                : "Tidak ada notification baru"}
            </p>
          </div>

          <Button
            variant="ghost"
            size="sm"
            disabled={unreadCount === 0 || markingAll}
            onClick={handleMarkAllAsRead}
            className="gap-2 text-xs">
            {markingAll ? (
              <Loader2 className="size-3.5 animate-spin" />
            ) : (
              <CheckCheck className="size-3.5" />
            )}
            Tandai semua
          </Button>
        </div>

        <div className="max-h-[420px] overflow-y-auto">
          {loading ? (
            <div className="flex items-center justify-center py-10">
              <Loader2 className="size-5 animate-spin text-muted-foreground" />
            </div>
          ) : notifications.length === 0 ? (
            <div className="flex flex-col items-center justify-center gap-2 px-4 py-10 text-center">
              <Bell className="size-8 text-muted-foreground/50" />
              <p className="text-sm font-medium">Belum ada notification</p>
              <p className="text-xs text-muted-foreground">
                Notification aktivitas Anda akan muncul di sini.
              </p>
            </div>
          ) : (
            notifications.map((notification) => (
              <button
                key={notification.id}
                type="button"
                onClick={() => handleNotificationClick(notification)}
                className={`flex w-full gap-3 border-b px-4 py-3 text-left transition-colors last:border-b-0 hover:bg-muted/50 ${
                  notification.isRead ? "" : "bg-primary/5"
                }`}>
                <div className="mt-0.5">
                  {notification.isRead ? (
                    <Bell className="size-4 text-muted-foreground" />
                  ) : (
                    <CircleAlert className="size-4 text-primary" />
                  )}
                </div>

                <div className="min-w-0 flex-1">
                  <div className="flex items-start justify-between gap-3">
                    <p
                      className={`text-sm ${
                        notification.isRead ? "font-medium" : "font-semibold"
                      }`}>
                      {notification.title}
                    </p>

                    {!notification.isRead && (
                      <span className="mt-1 size-2 shrink-0 rounded-full bg-primary" />
                    )}
                  </div>

                  <p className="mt-1 line-clamp-2 text-xs text-muted-foreground">
                    {notification.message}
                  </p>

                  <p className="mt-2 text-[11px] text-muted-foreground">
                    {formatNotificationDate(notification.createdAt)}
                  </p>
                </div>
              </button>
            ))
          )}
        </div>
      </PopoverContent>
    </Popover>
  );
}

function formatNotificationDate(value: string) {
  return new Intl.DateTimeFormat("id-ID", {
    dateStyle: "medium",
    timeStyle: "short",
  }).format(new Date(value));
}
