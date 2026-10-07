"use client";

import { roleService } from "@/app/services/role.service";
import { PermissionGuard } from "@/components/shared/permission-guard";
import { Button } from "@/components/ui/button";
import { RefreshCw } from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";
import { RoleTable } from "./components/role-table";

interface RolesPageClientProps {
  permissions: string[];
}

export function RolesPageClient({ permissions }: RolesPageClientProps) {
  const [isSyncing, setIsSyncing] = useState(false);

  const handleSyncPermissions = async () => {
    try {
      setIsSyncing(true);

      await roleService.syncPermissions();

      toast.success("Permission registry berhasil disinkronkan.");
    } catch (error) {
      toast.error("Gagal melakukan sinkronisasi permission.", {
        description:
          error instanceof Error
            ? error.message
            : "Terjadi kesalahan pada server.",
      });
    } finally {
      setIsSyncing(false);
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight">
            Role & Permission Management
          </h1>

          <p className="text-sm text-muted-foreground">
            Kelola role, permission, dan access scope pengguna sistem.
          </p>
        </div>

        <PermissionGuard
          permissions={permissions}
          required="admin.permission.manage">
          <Button
            variant="outline"
            disabled={isSyncing}
            onClick={() => void handleSyncPermissions()}>
            <RefreshCw
              className={`size-4 ${isSyncing ? "animate-spin" : ""}`}
            />

            {isSyncing ? "Syncing..." : "Sync Permissions"}
          </Button>
        </PermissionGuard>
      </div>

      <RoleTable permissions={permissions} />
    </div>
  );
}
