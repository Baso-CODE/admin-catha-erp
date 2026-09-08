"use client";

import { usePathname, useRouter } from "next/navigation";
import * as React from "react";

import { authService } from "@/app/services/auth.service"; // Pastikan path ini sesuai
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
  LogOut, // Import icon LogOut
  ReceiptTextIcon,
  SettingsIcon,
  UsersIcon,
} from "lucide-react";
import { toast } from "sonner"; // Opsional untuk notifikasi

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
      isActive: true,
    },
    {
      title: "CRM & Leads",
      url: "/internal/crm",
      icon: <UsersIcon />,
    },
    {
      title: "Projects",
      url: "/internal/projects",
      icon: <FolderKanbanIcon />,
    },
    {
      title: "Finance",
      url: "/internal/finance",
      icon: <ReceiptTextIcon />,
    },
  ],
  navSecondary: [
    {
      title: "Settings",
      url: "/internal/settings",
      icon: <SettingsIcon />,
    },
    {
      title: "Help & Support",
      url: "/internal/support",
      icon: <HelpCircleIcon />,
    },
  ],
  favorites: [
    {
      name: "User Management (Admin)",
      url: "/internal/users",
      emoji: "🛡️",
    },
    {
      name: "Audit Logs & Activity",
      url: "/internal/audit-logs",
      emoji: "📋",
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
        },
        {
          name: "Tracking Progress Task",
          url: "/internal/projects",
          emoji: "📊",
        },
        {
          name: "Invoice & Pembayaran",
          url: "/internal/finance",
          emoji: "💰",
        },
      ],
    },
    {
      name: "Pengaturan Sistem",
      emoji: "⚙️",
      pages: [
        {
          name: "Konfigurasi Perusahaan",
          url: "/internal/settings",
          emoji: "🏢",
        },
        {
          name: "Keamanan Akun",
          url: "/internal/settings#security",
          emoji: "🔒",
        },
      ],
    },
  ],
};

export function AppSidebar({ ...props }: React.ComponentProps<typeof Sidebar>) {
  const pathname = usePathname();
  const router = useRouter();

  const updatedNavMain = data.navMain.map((item) => ({
    ...item,
    isActive: pathname === item.url,
  }));

  // Fungsi untuk handle logout
  const handleLogout = async () => {
    try {
      await authService.logout(); // Menghapus HTTP-Only Cookie dari backend
      toast.success("Berhasil keluar dari sistem.");
      router.push("/login");
      router.refresh(); // Segarkan state agar middleware Next.js mendeteksi cookie telah hilang
    } catch (error) {
      console.error("Gagal logout", error);
      toast.error("Gagal keluar dari sistem.");
    }
  };

  return (
    <Sidebar className="border-r-0" {...props}>
      <SidebarHeader>
        <TeamSwitcher teams={data.teams} />
        <NavMain items={updatedNavMain} />
      </SidebarHeader>

      <SidebarContent>
        <NavFavorites favorites={data.favorites} />
        <NavWorkspaces workspaces={data.workspaces} />
        <NavSecondary items={data.navSecondary} className="mt-auto" />
      </SidebarContent>

      <SidebarFooter className="border-t border-sidebar-border p-2">
        <SidebarMenu>
          <SidebarMenuItem>
            <SidebarMenuButton
              onClick={handleLogout}
              className="text-destructive hover:bg-destructive/10 hover:text-destructive w-full justify-start gap-3 transition-colors"
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
