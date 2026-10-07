"use client";

import { Check, Loader2, ShieldCheck } from "lucide-react";
import { useCallback, useEffect, useMemo, useState } from "react";
import { toast } from "sonner";

import {
  AccessScope,
  PermissionItem,
  RoleItem,
  roleService,
} from "@/app/services/role.service";
import { PermissionGuard } from "@/components/shared/permission-guard";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Checkbox } from "@/components/ui/checkbox";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

interface PermissionMatrixProps {
  roleId: string;
  permissions: string[];
}

interface SelectedPermission {
  permissionId: string;
  scope: AccessScope;
}

const ACCESS_SCOPES: AccessScope[] = [
  "OWN",
  "TEAM",
  "PROJECT",
  "CLIENT",
  "ALL",
];

export function PermissionMatrix({
  roleId,
  permissions,
}: PermissionMatrixProps) {
  const [role, setRole] = useState<RoleItem | null>(null);
  const [grouped, setGrouped] = useState<Record<string, PermissionItem[]>>({});
  const [selected, setSelected] = useState<Record<string, AccessScope>>({});
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);

  const canManage = permissions.includes("admin.permission.manage");

  const loadData = useCallback(async () => {
    try {
      setIsLoading(true);

      const [roleResponse, permissionResponse] = await Promise.all([
        roleService.getRoleById(roleId),
        roleService.getPermissions(),
      ]);

      setRole(roleResponse.data);
      setGrouped(permissionResponse.grouped);

      const current: Record<string, AccessScope> = {};

      roleResponse.data.permissions?.forEach((item) => {
        current[item.permission.id] = item.scope;
      });

      setSelected(current);
    } catch (error) {
      toast.error("Gagal mengambil permission role.", {
        description:
          error instanceof Error
            ? error.message
            : "Terjadi kesalahan pada server.",
      });
    } finally {
      setIsLoading(false);
    }
  }, [roleId]);

  useEffect(() => {
    void loadData();
  }, [loadData]);

  const selectedCount = Object.keys(selected).length;

  const modules = useMemo(() => Object.entries(grouped), [grouped]);

  const togglePermission = (permission: PermissionItem, checked: boolean) => {
    setSelected((current) => {
      const next = { ...current };

      if (checked) {
        const defaultScope = permission.allowedScopes[0];

        if (!defaultScope) {
          return current;
        }

        next[permission.id] = defaultScope;
      } else {
        delete next[permission.id];
      }

      return next;
    });
  };

  const changeScope = (permissionId: string, scope: AccessScope) => {
    setSelected((current) => ({
      ...current,
      [permissionId]: scope,
    }));
  };

  const handleSave = async () => {
    if (!role) return;

    try {
      setIsSaving(true);

      const payload: SelectedPermission[] = Object.entries(selected).map(
        ([permissionId, scope]) => ({
          permissionId,
          scope,
        }),
      );

      await roleService.updatePermissions(role.id, {
        permissions: payload,
      });

      toast.success("Hak akses role berhasil diperbarui.");

      await loadData();
    } catch (error) {
      toast.error("Gagal memperbarui permission.", {
        description:
          error instanceof Error
            ? error.message
            : "Terjadi kesalahan pada server.",
      });
    } finally {
      setIsSaving(false);
    }
  };

  if (isLoading) {
    return (
      <div className="py-10 text-center text-sm text-muted-foreground">
        Memuat permission...
      </div>
    );
  }

  if (!role) {
    return (
      <div className="py-10 text-center text-sm text-muted-foreground">
        Role tidak ditemukan.
      </div>
    );
  }

  const isOwner = role.code === "OWNER";

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-2xl font-semibold tracking-tight">
              {role.name}
            </h1>

            {role.isSystem && <Badge variant="outline">System</Badge>}
          </div>

          <p className="mt-1 font-mono text-xs text-muted-foreground">
            {role.code}
          </p>

          <p className="mt-2 text-sm text-muted-foreground">
            {role.description || "Tidak ada deskripsi role."}
          </p>
        </div>

        <div className="flex items-center gap-3 rounded-lg border px-4 py-3">
          <ShieldCheck className="size-5 text-muted-foreground" />

          <div>
            <p className="text-xs text-muted-foreground">Permission Aktif</p>

            <p className="text-lg font-semibold">{selectedCount}</p>
          </div>
        </div>
      </div>

      {isOwner && (
        <Card>
          <CardContent className="flex items-start gap-3 p-4">
            <Check className="mt-0.5 size-5 text-emerald-500" />

            <div>
              <p className="font-medium">Owner memiliki akses penuh</p>

              <p className="text-sm text-muted-foreground">
                Permission role OWNER dikelola otomatis oleh Permission Registry
                dan tidak dapat diubah manual.
              </p>
            </div>
          </CardContent>
        </Card>
      )}

      <div className="space-y-4">
        {modules.map(([moduleName, modulePermissions]) => (
          <Card key={moduleName}>
            <CardHeader>
              <CardTitle className="text-base">
                {formatModuleName(moduleName)}
              </CardTitle>
            </CardHeader>

            <CardContent className="space-y-3">
              {modulePermissions.map((permission) => {
                const checked = selected[permission.id] !== undefined;

                return (
                  <div
                    key={permission.id}
                    className="flex flex-col gap-3 rounded-lg border p-4 sm:flex-row sm:items-center sm:justify-between">
                    <div className="flex items-start gap-3">
                      <Checkbox
                        checked={checked}
                        disabled={isOwner || !canManage}
                        onCheckedChange={(value) =>
                          togglePermission(permission, value === true)
                        }
                      />

                      <div>
                        <p className="text-sm font-medium">{permission.code}</p>

                        <p className="text-xs text-muted-foreground">
                          {permission.description || permission.action}
                        </p>
                      </div>
                    </div>

                    <Select
                      value={checked ? selected[permission.id] : undefined}
                      disabled={!checked || isOwner || !canManage}
                      onValueChange={(value) =>
                        changeScope(permission.id, value as AccessScope)
                      }>
                      <SelectTrigger className="w-full sm:w-44">
                        <SelectValue placeholder="Access Scope" />
                      </SelectTrigger>

                      <SelectContent>
                        {permission.allowedScopes.map((scope) => (
                          <SelectItem key={scope} value={scope}>
                            {formatScope(scope)}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                );
              })}
            </CardContent>
          </Card>
        ))}
      </div>

      {!isOwner && (
        <PermissionGuard
          permissions={permissions}
          required="admin.permission.manage">
          <div className="sticky bottom-4 flex justify-end">
            <Button
              size="lg"
              disabled={isSaving}
              onClick={() => void handleSave()}
              className="shadow-lg">
              {isSaving && <Loader2 className="size-4 animate-spin" />}
              Simpan Permission
            </Button>
          </div>
        </PermissionGuard>
      )}
    </div>
  );
}

function formatModuleName(value: string) {
  return value
    .split(".")
    .map((item) => item.charAt(0).toUpperCase() + item.slice(1))
    .join(" / ");
}

function formatScope(scope: AccessScope) {
  const labels: Record<AccessScope, string> = {
    OWN: "Own",
    TEAM: "Team",
    PROJECT: "Project",
    CLIENT: "Client",
    ALL: "All",
  };

  return labels[scope];
}
