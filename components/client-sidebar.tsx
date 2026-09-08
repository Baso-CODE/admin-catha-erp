"use client";

import { usePathname, useRouter } from "next/navigation";
import * as React from "react";

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
      isActive: true,
    },
    {
      title: "Proyek Saya",
      url: "/portal/projects",
      icon: <FolderKanbanIcon />,
    },
    {
      title: "Tagihan & Invoice",
      url: "/portal/invoices",
      icon: <ReceiptTextIcon />,
    },
  ],
  navSecondary: [
    {
      title: "Bantuan / Tiket",
      url: "/portal/support",
      icon: <HeadsetIcon />,
    },
  ],
  favorites: [
    {
      name: "Dokumen & Berkas",
      url: "/portal/documents",
      emoji: "📁",
    },
  ],
  workspaces: [
    {
      name: "Aktivitas Layanan",
      emoji: "🚀",
      pages: [
        {
          name: "Status Pengerjaan",
          url: "/portal/projects",
          emoji: "⚡",
        },
        {
          name: "Riwayat Pembayaran",
          url: "/portal/invoices",
          emoji: "💳",
        },
      ],
    },
  ],
};

export function ClientSidebar({
  ...props
}: React.ComponentProps<typeof Sidebar>) {
  const pathname = usePathname();
  const router = useRouter();

  // 2. Ganti logika logout menggunakan endpoint backend
  const handleLogout = async () => {
    try {
      await authService.logout(); // Backend akan membersihkan HTTP-Only Cookie
      router.push("/login");
      router.refresh(); // Wajib agar middleware Next.js mendeteksi state baru
    } catch (error) {
      console.error("Gagal keluar dari sistem:", error);
    }
  };

  const updatedNavMain = clientData.navMain.map((item) => ({
    ...item,
    isActive: pathname === item.url,
  }));

  return (
    <Sidebar className="border-r-0" {...props}>
      <SidebarHeader>
        <TeamSwitcher teams={clientData.teams} />
        <NavMain items={updatedNavMain} />
      </SidebarHeader>
      <SidebarContent>
        <NavMain
          items={clientData.favorites.map((fav) => ({
            title: fav.name,
            url: fav.url,
            icon: <span className="text-base">{fav.emoji}</span>,
            isActive: pathname === fav.url,
          }))}
        />
        <NavSecondary items={clientData.navSecondary} className="mt-auto" />
      </SidebarContent>
      <SidebarFooter className="border-t border-sidebar-border p-2">
        <SidebarMenu>
          <SidebarMenuItem>
            <SidebarMenuButton
              onClick={handleLogout}
              className="text-destructive hover:bg-destructive/10 hover:text-destructive w-full justify-start gap-3 transition-colors"
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
