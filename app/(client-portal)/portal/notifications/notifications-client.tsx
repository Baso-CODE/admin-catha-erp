"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { toast } from "sonner";

import { Bell, BellOff, CheckCheck, Loader2, RefreshCw } from "lucide-react";

import {
  clientPortalNotificationService,
  type ClientNotification,
} from "@/app/services/client-portal-notification.service";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";

import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";

import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";

import { Skeleton } from "@/components/ui/skeleton";

function formatDate(value: string) {
  return new Date(value).toLocaleString("id-ID", {
    day: "2-digit",
    month: "short",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

function errorMessage(error: unknown) {
  return error instanceof Error ? error.message : "Terjadi kesalahan.";
}

export default function NotificationsClient() {
  const [notifications, setNotifications] = useState<ClientNotification[]>([]);

  const [loading, setLoading] = useState(true);
  const [processingId, setProcessingId] = useState<string | null>(null);
  const [markingAll, setMarkingAll] = useState(false);

  const [filter, setFilter] = useState<"ALL" | "UNREAD">("ALL");
  const [page, setPage] = useState(1);
  const [refreshKey, setRefreshKey] = useState(0);

  const [meta, setMeta] = useState({
    page: 1,
    limit: 20,
    total: 0,
    totalPages: 0,
    unreadCount: 0,
  });

  function refresh() {
    setRefreshKey((value) => value + 1);
  }

  useEffect(() => {
    let active = true;

    async function load() {
      setLoading(true);

      try {
        const result = await clientPortalNotificationService.getAll({
          page,
          limit: 20,
          ...(filter === "UNREAD" && { isRead: false }),
        });

        if (!active) return;

        setNotifications(result.data);
        setMeta(result.meta);
      } catch (error) {
        if (!active) return;

        setNotifications([]);
        toast.error(errorMessage(error));
      } finally {
        if (active) setLoading(false);
      }
    }

    void load();

    return () => {
      active = false;
    };
  }, [filter, page, refreshKey]);

  async function markRead(notificationId: string) {
    if (processingId) return;

    setProcessingId(notificationId);

    try {
      await clientPortalNotificationService.markAsRead(notificationId);

      toast.success("Notifikasi ditandai sudah dibaca.");
      refresh();
    } catch (error) {
      toast.error(errorMessage(error));
    } finally {
      setProcessingId(null);
    }
  }

  async function markAllRead() {
    if (markingAll) return;

    setMarkingAll(true);

    try {
      await clientPortalNotificationService.markAllAsRead();

      toast.success("Semua notifikasi ditandai sudah dibaca.");
      refresh();
    } catch (error) {
      toast.error(errorMessage(error));
    } finally {
      setMarkingAll(false);
    }
  }

  return (
    <div className="space-y-6 p-4 md:p-6">
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <h1 className="flex items-center gap-2 text-2xl font-semibold">
            <Bell className="size-6" />
            Notifications
          </h1>

          <p className="mt-1 text-sm text-muted-foreground">
            Informasi terbaru tentang project dan pekerjaan yang membutuhkan
            perhatian Anda.
          </p>
        </div>

        <div className="flex flex-wrap gap-2">
          <Button variant="outline" onClick={refresh} disabled={loading}>
            <RefreshCw className={loading ? "animate-spin" : ""} />
            Refresh
          </Button>

          <Button
            onClick={markAllRead}
            disabled={markingAll || loading || meta.unreadCount === 0}>
            {markingAll ? <Loader2 className="animate-spin" /> : <CheckCheck />}
            Mark All as Read
          </Button>
        </div>
      </div>

      <div className="grid gap-4 sm:grid-cols-2">
        <Card>
          <CardHeader>
            <CardDescription>Total Notifications</CardDescription>
            <CardTitle className="text-3xl">
              {loading ? "—" : meta.total}
            </CardTitle>
          </CardHeader>
        </Card>

        <Card>
          <CardHeader>
            <CardDescription>Unread Notifications</CardDescription>
            <CardTitle className="text-3xl">
              {loading ? "—" : meta.unreadCount}
            </CardTitle>
          </CardHeader>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Notification Center</CardTitle>

          <CardDescription>
            Lihat pembaruan dan notifikasi yang belum dibaca.
          </CardDescription>

          <Tabs
            value={filter}
            onValueChange={(value) => {
              setFilter(value as "ALL" | "UNREAD");
              setPage(1);
            }}>
            <TabsList>
              <TabsTrigger value="ALL">Semua</TabsTrigger>
              <TabsTrigger value="UNREAD">Belum Dibaca</TabsTrigger>
            </TabsList>
          </Tabs>
        </CardHeader>

        <CardContent className="space-y-4">
          {loading ? (
            <div className="space-y-3">
              {Array.from({ length: 5 }, (_, index) => (
                <Skeleton key={index} className="h-20 w-full" />
              ))}
            </div>
          ) : notifications.length === 0 ? (
            <div className="flex flex-col items-center gap-3 py-12 text-center">
              <BellOff className="size-10 text-muted-foreground" />

              <p className="font-medium">Belum ada notifikasi</p>

              <p className="text-sm text-muted-foreground">
                Notifikasi baru akan muncul di halaman ini.
              </p>
            </div>
          ) : (
            <div className="space-y-3">
              {notifications.map((notification) => (
                <Card
                  key={notification.id}
                  className={
                    !notification.isRead ? "border-primary/30 bg-primary/5" : ""
                  }>
                  <CardContent className="space-y-3">
                    <div className="flex flex-wrap items-start justify-between gap-3">
                      <div className="space-y-1">
                        <div className="flex flex-wrap items-center gap-2">
                          <p className="font-semibold">{notification.title}</p>

                          {!notification.isRead && <Badge>Baru</Badge>}
                        </div>

                        <p className="text-xs text-muted-foreground">
                          {formatDate(notification.createdAt)}
                        </p>
                      </div>

                      <Badge variant="outline">
                        {notification.type.replaceAll("_", " ")}
                      </Badge>
                    </div>

                    <p className="text-sm text-muted-foreground">
                      {notification.message}
                    </p>

                    <div className="flex flex-wrap gap-2">
                      <Button size="sm" variant="outline" asChild>
                        <Link href={notification.actionUrl}>Lihat Detail</Link>
                      </Button>

                      {!notification.isRead && (
                        <Button
                          size="sm"
                          variant="secondary"
                          disabled={processingId === notification.id}
                          onClick={() => void markRead(notification.id)}>
                          {processingId === notification.id ? (
                            <Loader2 className="animate-spin" />
                          ) : (
                            <CheckCheck />
                          )}
                          Tandai Dibaca
                        </Button>
                      )}
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}

          <div className="flex flex-wrap items-center justify-between gap-3 border-t pt-4">
            <p className="text-sm text-muted-foreground">
              {meta.total} notifikasi · Halaman {page} dari{" "}
              {Math.max(meta.totalPages, 1)}
            </p>

            <div className="flex gap-2">
              <Button
                size="sm"
                variant="outline"
                disabled={loading || page <= 1}
                onClick={() => setPage((current) => current - 1)}>
                Sebelumnya
              </Button>

              <Button
                size="sm"
                variant="outline"
                disabled={loading || page >= meta.totalPages}
                onClick={() => setPage((current) => current + 1)}>
                Berikutnya
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
