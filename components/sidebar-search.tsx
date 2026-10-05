"use client";

import { TASK_PERMISSIONS } from "@/app/(internal-dashboard)/internal/tasks/components/task-permissions";
import {
  CommandDialog,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
  CommandSeparator,
} from "@/components/ui/command";
import {
  Briefcase,
  Building2,
  ClipboardList,
  FolderKanban,
  LayoutDashboard,
  ReceiptText,
  ShieldCheck,
  Users,
  Workflow,
} from "lucide-react";
import { useRouter } from "next/navigation";
import * as React from "react";

interface SidebarSearchProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  permissions: string[];
}

interface SearchMenuItem {
  title: string;
  url: string;
  icon: React.ReactNode;
  permission?: string | null;
}

export function SidebarSearch({
  open,
  onOpenChange,
  permissions,
}: SidebarSearchProps) {
  const router = useRouter();

  const hasPermission = React.useCallback(
    (permission?: string | null) => {
      if (!permission) return true;

      return permissions.includes(permission);
    },
    [permissions],
  );

  const mainItems: SearchMenuItem[] = [
    {
      title: "Overview / Dashboard",
      url: "/internal",
      icon: <LayoutDashboard className="mr-2 size-4 text-primary" />,
      permission: null,
    },
    {
      title: "CRM & Leads",
      url: "/internal/crm",
      icon: <Users className="mr-2 size-4 text-primary" />,
      permission: "crm.lead.read",
    },
    {
      title: "Clients & Contracts",
      url: "/internal/clients",
      icon: <Building2 className="mr-2 size-4 text-primary" />,
      permission: "client.read",
    },
    {
      title: "Master Data & Workflow",
      url: "/internal/master-data",
      icon: <Workflow className="mr-2 size-4 text-primary" />,
      permission: "master.service.read",
    },
    {
      title: "Projects Management",
      url: "/internal/projects",
      icon: <FolderKanban className="mr-2 size-4 text-primary" />,
      permission: "project.read",
    },
    {
      title: "Task Management",
      url: "/internal/tasks",
      icon: <ClipboardList className="mr-2 size-4 text-primary" />,
      permission: TASK_PERMISSIONS.READ,
    },
    {
      title: "Finance & Invoices",
      url: "/internal/finance",
      icon: <ReceiptText className="mr-2 size-4 text-primary" />,
      permission: "finance.invoice.read",
    },
  ];

  const adminItems: SearchMenuItem[] = [
    {
      title: "User Management",
      url: "/internal/users",
      icon: <ShieldCheck className="mr-2 size-4 text-primary" />,
      permission: "admin.user.read",
    },
    {
      title: "Audit Logs",
      url: "/internal/audit-logs",
      icon: <Briefcase className="mr-2 size-4 text-primary" />,
      permission: "admin.audit.read",
    },
  ];

  const visibleMainItems = mainItems.filter((item) =>
    hasPermission(item.permission),
  );

  const visibleAdminItems = adminItems.filter((item) =>
    hasPermission(item.permission),
  );

  React.useEffect(() => {
    const down = (event: KeyboardEvent) => {
      if (event.key === "k" && (event.metaKey || event.ctrlKey)) {
        event.preventDefault();
        onOpenChange(!open);
      }
    };

    document.addEventListener("keydown", down);

    return () => document.removeEventListener("keydown", down);
  }, [open, onOpenChange]);

  const runCommand = React.useCallback(
    (command: () => void) => {
      onOpenChange(false);
      command();
    },
    [onOpenChange],
  );

  return (
    <CommandDialog open={open} onOpenChange={onOpenChange}>
      <CommandInput placeholder="Cari menu, halaman, atau fitur ERP..." />

      <CommandList>
        <CommandEmpty>Tidak ada menu yang ditemukan.</CommandEmpty>

        {visibleMainItems.length > 0 && (
          <CommandGroup heading="Menu Utama">
            {visibleMainItems.map((item) => (
              <CommandItem
                key={item.url}
                value={`${item.title} ${item.url}`}
                onSelect={() => runCommand(() => router.push(item.url))}>
                {item.icon}
                <span>{item.title}</span>
              </CommandItem>
            ))}
          </CommandGroup>
        )}

        {visibleMainItems.length > 0 && visibleAdminItems.length > 0 && (
          <CommandSeparator />
        )}

        {visibleAdminItems.length > 0 && (
          <CommandGroup heading="Administrator">
            {visibleAdminItems.map((item) => (
              <CommandItem
                key={item.url}
                value={`${item.title} ${item.url}`}
                onSelect={() => runCommand(() => router.push(item.url))}>
                {item.icon}
                <span>{item.title}</span>
              </CommandItem>
            ))}
          </CommandGroup>
        )}
      </CommandList>
    </CommandDialog>
  );
}
