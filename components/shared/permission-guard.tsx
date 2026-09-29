"use client";

import { ReactNode } from "react";

interface PermissionGuardProps {
  permissions: string[];
  required: string | string[];
  children: ReactNode;
  fallback?: ReactNode;
  requireAll?: boolean;
}

export function PermissionGuard({
  permissions,
  required,
  children,
  fallback = null,
  requireAll = false,
}: PermissionGuardProps) {
  const requiredPermissions = Array.isArray(required) ? required : [required];

  const hasPermission = requireAll
    ? requiredPermissions.every((permission) =>
        permissions.includes(permission),
      )
    : requiredPermissions.some((permission) =>
        permissions.includes(permission),
      );

  if (!hasPermission) {
    return <>{fallback}</>;
  }

  return <>{children}</>;
}
