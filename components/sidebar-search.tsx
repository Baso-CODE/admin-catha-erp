"use client";

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
  FolderKanban,
  LayoutDashboard,
  ReceiptText,
  ShieldCheck,
  Users,
} from "lucide-react";
import { useRouter } from "next/navigation";
import * as React from "react";

interface SidebarSearchProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function SidebarSearch({ open, onOpenChange }: SidebarSearchProps) {
  const router = useRouter();

  // Shortcut keyboard Ctrl+K atau Cmd+K
  React.useEffect(() => {
    const down = (e: KeyboardEvent) => {
      if (e.key === "k" && (e.metaKey || e.ctrlKey)) {
        e.preventDefault();
        onOpenChange(!open);
      }
    };
    document.addEventListener("keydown", down);
    return () => document.removeEventListener("keydown", down);
  }, [open, onOpenChange]);

  const runCommand = React.useCallback(
    (command: () => unknown) => {
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
        <CommandGroup heading="Menu Utama">
          <CommandItem
            onSelect={() => runCommand(() => router.push("/internal"))}>
            <LayoutDashboard className="mr-2 size-4 text-primary" />
            <span>Overview / Dashboard</span>
          </CommandItem>
          <CommandItem
            onSelect={() => runCommand(() => router.push("/internal/crm"))}>
            <Users className="mr-2 size-4 text-primary" />
            <span>CRM & Leads</span>
          </CommandItem>
          <CommandItem
            onSelect={() =>
              runCommand(() => router.push("/internal/projects"))
            }>
            <FolderKanban className="mr-2 size-4 text-primary" />
            <span>Projects Management</span>
          </CommandItem>
          <CommandItem
            onSelect={() => runCommand(() => router.push("/internal/finance"))}>
            <ReceiptText className="mr-2 size-4 text-primary" />
            <span>Finance & Invoices</span>
          </CommandItem>
        </CommandGroup>
        <CommandSeparator />
        <CommandGroup heading="Administrator">
          <CommandItem
            onSelect={() => runCommand(() => router.push("/internal/users"))}>
            <ShieldCheck className="mr-2 size-4 text-primary" />
            <span>User Management</span>
          </CommandItem>
          <CommandItem
            onSelect={() =>
              runCommand(() => router.push("/internal/audit-logs"))
            }>
            <Briefcase className="mr-2 size-4 text-primary" />
            <span>Audit Logs</span>
          </CommandItem>
        </CommandGroup>
      </CommandList>
    </CommandDialog>
  );
}
