"use client";

import { TASK_PERMISSIONS } from "@/app/(internal-dashboard)/internal/tasks/components/task-permissions";
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
  ClipboardList,
  FolderKanbanIcon,
  HelpCircleIcon,
  LayoutDashboardIcon,
  LogOut,
  ReceiptTextIcon,
  Search,
  SettingsIcon,
  UsersIcon,
  WorkflowIcon,
} from "lucide-react";
import { usePathname, useRouter } from "next/navigation";
import * as React from "react";
import { toast } from "sonner";
import { SidebarSearch } from "./sidebar-search";

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
      title: "Task Management",
      url: "/internal/tasks",
      icon: <ClipboardList />,
      permission: TASK_PERMISSIONS.READ,
    },
    {
      title: "Finance",
      url: "/internal/finance",
      icon: <ReceiptTextIcon />,
      permission: "invoice.read",
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
      name: "Team Management",
      url: "/internal/teams",
      emoji: "👥",
      permission: "admin.team.read",
    },
    {
      name: "Role & Permission",
      url: "/internal/roles",
      emoji: "🔐",
      permission: "admin.role.read",
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
          url: "/internal/tasks",
          emoji: "📊",
          permission: TASK_PERMISSIONS.READ,
        },
        {
          name: "Invoice",
          url: "/internal/finance/invoices",
          emoji: "🧾",
          permission: "invoice.read",
        },
        {
          name: "Pembayaran",
          url: "/internal/finance/payments",
          emoji: "💰",
          permission: "payment.read",
        },
        {
          name: "AR Aging Report",
          url: "/internal/finance/aging",
          emoji: "📊",
          permission: "invoice.read",
        },
        {
          name: "Finance Reports",
          url: "/internal/finance/reports",
          emoji: "📑",
          permission: "invoice.read",
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

  const [searchOpen, setSearchOpen] = React.useState(false);

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

        <SidebarMenu>
          <SidebarMenuItem>
            <SidebarMenuButton
              onClick={() => setSearchOpen(true)}
              tooltip="Cari menu"
              className="justify-start gap-3">
              <Search className="size-4" />

              <span className="flex-1 text-left">Cari Menu</span>

              <span className="text-xs text-muted-foreground">⌘K</span>
            </SidebarMenuButton>
          </SidebarMenuItem>
        </SidebarMenu>

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
      <SidebarSearch
        open={searchOpen}
        onOpenChange={setSearchOpen}
        permissions={permissions}
      />
    </Sidebar>
  );
}
