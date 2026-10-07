"use client";

import { ArrowLeft } from "lucide-react";
import Link from "next/link";

import { Button } from "@/components/ui/button";
import { PermissionMatrix } from "./components/permission-matrix";

interface RoleDetailClientProps {
  roleId: string;
  permissions: string[];
}

export function RoleDetailClient({
  roleId,
  permissions,
}: RoleDetailClientProps) {
  return (
    <div className="space-y-6">
      <Button variant="ghost" size="sm" asChild className="-ml-3">
        <Link href="/internal/roles">
          <ArrowLeft className="mr-2 size-4" />
          Kembali
        </Link>
      </Button>

      <PermissionMatrix roleId={roleId} permissions={permissions} />
    </div>
  );
}
