"use client";

import { authService } from "@/app/services/auth.service";
import { NavFavorites } from "@/components/nav-favorites";
import { NavMain } from "@/components/nav-main";
import { NavSecondary } from "@/components/nav-secondary";
import { NavWorkspaces } from "@/components/nav-workspaces";
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
  Building2Icon,
  FolderKanbanIcon,
  HelpCircleIcon,
  LayoutDashboardIcon,
  LogOut,
  ReceiptTextIcon,
  SettingsIcon,
  UsersIcon,
  WorkflowIcon,
} from "lucide-react";
import { usePathname, useRouter } from "next/navigation";
import * as React from "react";
import { toast } from "sonner";

const data = {
  teams: [
    {
      name: "ERP Catha",
      logo: <Building2Icon />,
      plan: "Agency Operations",
    },
  ],

  navMain: [
    {
      title: "Overview",
      url: "/internal",
      icon: <LayoutDashboardIcon />,
      permission: null,
    },
    {
      title: "CRM & Leads",
      url: "/internal/crm",
      icon: <UsersIcon />,
      permission: "crm.lead.read",
    },
    {
      title: "Clients & Contracts",
      url: "/internal/clients",
      icon: <Building2Icon />,
      permission: "client.read",
    },

    {
      title: "Master Data & Workflow",
      url: "/internal/master-data",
      icon: <WorkflowIcon />,
      permission: "master.service.read",
    },

    {
      title: "Projects",
      url: "/internal/projects",
      icon: <FolderKanbanIcon />,
      permission: "project.read",
    },
    {
      title: "Finance",
      url: "/internal/finance",
      icon: <ReceiptTextIcon />,
      permission: "finance.invoice.read",
    },
  ],

  navSecondary: [
    {
      title: "Settings",
      url: "/internal/settings",
      icon: <SettingsIcon />,
      permission: "admin.role.read",
    },
    {
      title: "Help & Support",
      url: "/internal/support",
      icon: <HelpCircleIcon />,
      permission: null,
    },
  ],

  favorites: [
    {
      name: "User Management",
      url: "/internal/users",
      emoji: "🛡️",
      permission: "admin.user.read",
    },
    {
      name: "Audit Logs",
      url: "/internal/audit-logs",
      emoji: "📋",
      permission: "admin.audit.read",
    },
  ],

  workspaces: [
    {
      name: "Modul Operasional",
      emoji: "⚡",
      pages: [
        {
          name: "Daftar Klien Aktif",
          url: "/internal/crm",
          emoji: "👥",
          permission: "crm.lead.read",
        },
        {
          name: "Tracking Progress Task",
          url: "/internal/projects",
          emoji: "📊",
          permission: "project.read",
        },
        {
          name: "Invoice & Pembayaran",
          url: "/internal/finance",
          emoji: "💰",
          permission: "finance.invoice.read",
        },
      ],
    },
  ],
};

interface AppSidebarProps extends React.ComponentProps<typeof Sidebar> {
  permissions: string[];
}

export function AppSidebar({ permissions, ...props }: AppSidebarProps) {
  const pathname = usePathname();
  const router = useRouter();

  const hasPermission = (permission?: string | null) => {
    if (!permission) return true;
    return permissions.includes(permission);
  };

  const navMain = data.navMain
    .filter((item) => hasPermission(item.permission))
    .map((item) => ({
      ...item,
      isActive:
        pathname === item.url ||
        (item.url !== "/internal" && pathname.startsWith(`${item.url}/`)),
    }));

  const navSecondary = data.navSecondary.filter((item) =>
    hasPermission(item.permission),
  );

  const favorites = data.favorites.filter((item) =>
    hasPermission(item.permission),
  );

  const workspaces = data.workspaces
    .map((workspace) => ({
      ...workspace,
      pages: workspace.pages.filter((page) => hasPermission(page.permission)),
    }))
    .filter((workspace) => workspace.pages.length > 0);

  const handleLogout = async () => {
    try {
      await authService.logout();

      toast.success("Berhasil keluar dari sistem.");

      router.replace("/login");
      router.refresh();
    } catch {
      toast.error("Gagal keluar dari sistem.");
    }
  };

  return (
    <Sidebar className="border-r-0" {...props}>
      <SidebarHeader>
        <TeamSwitcher teams={data.teams} />
        <NavMain items={navMain} />
      </SidebarHeader>

      <SidebarContent>
        <NavFavorites favorites={favorites} />
        <NavWorkspaces workspaces={workspaces} />
        <NavSecondary items={navSecondary} className="mt-auto" />
      </SidebarContent>

      <SidebarFooter className="border-t border-sidebar-border p-2">
        <SidebarMenu>
          <SidebarMenuItem>
            <SidebarMenuButton
              onClick={handleLogout}
              className="w-full justify-start gap-3 text-destructive transition-colors hover:bg-destructive/10 hover:text-destructive"
              tooltip="Keluar Sistem">
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
