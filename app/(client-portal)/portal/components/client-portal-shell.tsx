"use client";

import {
  CheckCircle2,
  FileText,
  FolderKanban,
  Layers3,
  LayoutDashboard,
  LogOut,
  Menu,
  Ticket,
  UserRound,
} from "lucide-react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { ReactNode, useState } from "react";
import { toast } from "sonner";

import { authService } from "@/app/services/auth.service";
import { Button } from "@/components/ui/button";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from "@/components/ui/sheet";

interface ClientPortalShellProps {
  children: ReactNode;
  client: {
    companyName: string;
    clientCode: string;
    contactName: string;
    contactEmail: string;
  };
}

const navigation = [
  {
    title: "Dashboard",
    url: "/portal",
    icon: LayoutDashboard,
  },
  {
    title: "My Projects",
    url: "/portal/projects",
    icon: FolderKanban,
  },
  {
    title: "My Services",
    url: "/portal/services",
    icon: Layers3,
  },
  {
    title: "Approvals",
    url: "/portal/approvals",
    icon: CheckCircle2,
  },
  {
    title: "Documents",
    url: "/portal/documents",
    icon: FileText,
  },
  {
    title: "Profile",
    url: "/portal/profile",
    icon: UserRound,
  },
  {
    title: "Support",
    url: "/portal/support",
    icon: Ticket,
  },
];

export function ClientPortalShell({
  children,
  client,
}: ClientPortalShellProps) {
  const pathname = usePathname();
  const router = useRouter();

  const [open, setOpen] = useState(false);
  const [isLoggingOut, setIsLoggingOut] = useState(false);

  const handleLogout = async () => {
    try {
      setIsLoggingOut(true);

      await authService.logout();

      toast.success("Berhasil keluar dari portal.");

      router.replace("/login");
      router.refresh();
    } catch {
      toast.error("Gagal keluar dari portal.");
    } finally {
      setIsLoggingOut(false);
    }
  };

  return (
    <div className="min-h-screen bg-muted/30">
      <aside className="fixed inset-y-0 left-0 z-40 hidden w-64 border-r bg-background lg:flex lg:flex-col">
        <PortalNavigation
          pathname={pathname}
          client={client}
          onLogout={handleLogout}
          isLoggingOut={isLoggingOut}
        />
      </aside>

      <header className="sticky top-0 z-30 flex h-16 items-center justify-between border-b bg-background px-4 lg:hidden">
        <div className="flex items-center">
          <Sheet open={open} onOpenChange={setOpen}>
            <SheetTrigger asChild>
              <Button variant="ghost" size="icon">
                <Menu className="size-5" />
              </Button>
            </SheetTrigger>

            <SheetContent side="left" className="w-72 p-0">
              <SheetHeader className="sr-only">
                <SheetTitle>Client Portal Navigation</SheetTitle>
              </SheetHeader>

              <PortalNavigation
                pathname={pathname}
                client={client}
                onNavigate={() => setOpen(false)}
                onLogout={handleLogout}
                isLoggingOut={isLoggingOut}
              />
            </SheetContent>
          </Sheet>

          <div className="ml-3">
            <p className="max-w-[180px] truncate text-sm font-semibold">
              {client.companyName}
            </p>

            <p className="text-xs text-muted-foreground">{client.clientCode}</p>
          </div>
        </div>

        <div className="max-w-[120px] text-right">
          <p className="truncate text-xs font-medium">{client.contactName}</p>
        </div>
      </header>

      <main className="lg:pl-64">{children}</main>
    </div>
  );
}

interface PortalNavigationProps {
  pathname: string;
  client: {
    companyName: string;
    clientCode: string;
    contactName: string;
    contactEmail: string;
  };
  onNavigate?: () => void;
  onLogout: () => void | Promise<void>;
  isLoggingOut: boolean;
}

function PortalNavigation({
  pathname,
  client,
  onNavigate,
  onLogout,
  isLoggingOut,
}: PortalNavigationProps) {
  return (
    <div className="flex h-full flex-col">
      <div className="border-b px-5 py-5">
        <Link href="/portal" onClick={onNavigate} className="block">
          <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
            Client Portal
          </p>

          <p className="mt-1 truncate text-base font-semibold">
            {client.companyName}
          </p>

          <p className="mt-0.5 font-mono text-xs text-muted-foreground">
            {client.clientCode}
          </p>
        </Link>
      </div>

      <nav className="flex-1 space-y-1 p-3">
        {navigation.map((item) => {
          const Icon = item.icon;

          const isActive =
            item.url === "/portal"
              ? pathname === "/portal"
              : pathname === item.url || pathname.startsWith(`${item.url}/`);

          return (
            <Button
              key={item.url}
              variant={isActive ? "secondary" : "ghost"}
              className="w-full justify-start"
              asChild>
              <Link href={item.url} onClick={onNavigate}>
                <Icon className="mr-3 size-4" />
                {item.title}
              </Link>
            </Button>
          );
        })}
      </nav>

      <div className="border-t">
        <div className="px-5 py-4">
          <p className="truncate text-sm font-medium">{client.contactName}</p>

          <p className="truncate text-xs text-muted-foreground">
            {client.contactEmail}
          </p>
        </div>

        <div className="border-t p-3">
          <Button
            variant="ghost"
            className="w-full justify-start text-destructive hover:bg-destructive/10 hover:text-destructive"
            disabled={isLoggingOut}
            onClick={() => void onLogout()}>
            <LogOut className="mr-3 size-4" />

            {isLoggingOut ? "Keluar..." : "Keluar Portal"}
          </Button>
        </div>
      </div>
    </div>
  );
}
