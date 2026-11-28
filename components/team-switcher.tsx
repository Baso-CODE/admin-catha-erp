"use client";

import Link from "next/link";
import type { ReactNode } from "react";

import {
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
} from "@/components/ui/sidebar";

export function TeamSwitcher({
  teams,
}: {
  teams: {
    name: string;
    logo: ReactNode;
    plan: string;
  }[];
}) {
  const organization = teams[0];

  if (!organization) return null;

  return (
    <SidebarMenu>
      <SidebarMenuItem>
        <SidebarMenuButton asChild size="lg" tooltip={organization.name}>
          <Link href="/internal">
            <div className="flex aspect-square size-8 shrink-0 items-center justify-center rounded-lg bg-sidebar-primary text-sidebar-primary-foreground">
              {organization.logo}
            </div>

            <div className="grid min-w-0 flex-1 text-left">
              <span className="truncate text-sm font-semibold">
                {organization.name}
              </span>

              <span className="truncate text-xs text-muted-foreground">
                {organization.plan}
              </span>
            </div>
          </Link>
        </SidebarMenuButton>
      </SidebarMenuItem>
    </SidebarMenu>
  );
}
