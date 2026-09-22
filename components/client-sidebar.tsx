"use client";

import { usePathname, useRouter } from "next/navigation";
import * as React from "react";
import { toast } from "sonner";

import { authService } from "@/app/services/auth.service";
import { NavMain } from "@/components/nav-main";
import { NavSecondary } from "@/components/nav-secondary";
import { TeamSwitcher } from "@/components/team-switcher";
import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarRail,
} from "@/components/ui/sidebar";
import {
  FolderKanbanIcon,
  HeadsetIcon,
  LayoutDashboardIcon,
  LogOut,
  ReceiptTextIcon,
} from "lucide-react";

const clientData = {
  teams: [
    {
      name: "Catha Portal",
      logo: <LayoutDashboardIcon />,
      plan: "Client Workspace",
    },
  ],

  navMain: [
    {
      title: "Dashboard Klien",
      url: "/portal",
      icon: <LayoutDashboardIcon />,
      permission: null,
    },
    {
      title: "Proyek Saya",
      url: "/portal/projects",
      icon: <FolderKanbanIcon />,
      permission: "client.project.read",
    },
    {
      title: "Tagihan & Invoice",
      url: "/portal/invoices",
      icon: <ReceiptTextIcon />,
      permission: "client.invoice.read",
    },
  ],

  navSecondary: [
    {
      title: "Bantuan / Tiket",
      url: "/portal/support",
      icon: <HeadsetIcon />,
      permission: "client.support.read",
    },
  ],

  favorites: [
    {
      name: "Dokumen & Berkas",
      url: "/portal/documents",
      emoji: "📁",
      permission: "client.document.read",
    },
  ],
};

interface ClientSidebarProps extends React.ComponentProps<typeof Sidebar> {
  permissions: string[];
}

export function ClientSidebar({ permissions, ...props }: ClientSidebarProps) {
  const pathname = usePathname();
  const router = useRouter();

  const hasPermission = (permission?: string | null) => {
    if (!permission) return true;

    return permissions.includes(permission);
  };

  const navMain = clientData.navMain
    .filter((item) => hasPermission(item.permission))
    .map((item) => ({
      ...item,
      isActive:
        pathname === item.url ||
        (item.url !== "/portal" && pathname.startsWith(`${item.url}/`)),
    }));

  const navSecondary = clientData.navSecondary.filter((item) =>
    hasPermission(item.permission),
  );

  const favorites = clientData.favorites
    .filter((item) => hasPermission(item.permission))
    .map((item) => ({
      title: item.name,
      url: item.url,
      icon: <span className="text-base">{item.emoji}</span>,
      isActive: pathname === item.url || pathname.startsWith(`${item.url}/`),
    }));

  const handleLogout = async () => {
    try {
      await authService.logout();

      toast.success("Berhasil keluar dari sistem.");

      router.replace("/login");
      router.refresh();
    } catch (error) {
      toast.error("Gagal keluar dari sistem.", {
        description:
          error instanceof Error
            ? error.message
            : "Terjadi kesalahan pada server.",
      });
    }
  };

  return (
    <Sidebar className="border-r-0" {...props}>
      <SidebarHeader>
        <TeamSwitcher teams={clientData.teams} />

        <NavMain items={navMain} />
      </SidebarHeader>

      <SidebarContent>
        {favorites.length > 0 && <NavMain items={favorites} />}

        <NavSecondary items={navSecondary} className="mt-auto" />
      </SidebarContent>

      <SidebarFooter className="border-t border-sidebar-border p-2">
        <SidebarMenu>
          <SidebarMenuItem>
            <SidebarMenuButton
              onClick={handleLogout}
              className="w-full justify-start gap-3 text-destructive transition-colors hover:bg-destructive/10 hover:text-destructive"
              tooltip="Keluar">
              <LogOut className="size-4 shrink-0" />

              <span>Keluar Sistem</span>
            </SidebarMenuButton>
          </SidebarMenuItem>
        </SidebarMenu>
      </SidebarFooter>

      <SidebarRail />
    </Sidebar>
  );
}
