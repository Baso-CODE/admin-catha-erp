"use client";

import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "@/components/ui/collapsible";
import {
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarMenu,
  SidebarMenuAction,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarMenuSub,
  SidebarMenuSubButton,
  SidebarMenuSubItem,
} from "@/components/ui/sidebar";
import { ChevronRightIcon, MoreHorizontalIcon, PlusIcon } from "lucide-react";
import Link from "next/link";
import { usePathname } from "next/navigation";

export function NavWorkspaces({
  workspaces,
}: {
  workspaces: {
    name: string;
    emoji: React.ReactNode;
    pages: {
      name: string;
      emoji: React.ReactNode;
      url: string;
    }[];
  }[];
}) {
  const pathname = usePathname();

  return (
    <SidebarGroup>
      <SidebarGroupLabel>Workspaces</SidebarGroupLabel>

      <SidebarGroupContent>
        <SidebarMenu>
          {workspaces.map((workspace) => (
            <Collapsible
              key={workspace.name}
              defaultOpen={workspace.pages.some(
                (page) =>
                  pathname === page.url || pathname.startsWith(`${page.url}/`),
              )}>
              <SidebarMenuItem>
                <SidebarMenuButton>
                  <span>{workspace.emoji}</span>
                  <span>{workspace.name}</span>
                </SidebarMenuButton>

                <SidebarMenuAction
                  asChild
                  className="left-2 bg-sidebar-accent text-sidebar-accent-foreground data-[state=open]:rotate-90"
                  showOnHover>
                  <CollapsibleTrigger>
                    <ChevronRightIcon />
                  </CollapsibleTrigger>
                </SidebarMenuAction>

                <SidebarMenuAction showOnHover>
                  <PlusIcon />
                </SidebarMenuAction>

                <CollapsibleContent>
                  <SidebarMenuSub>
                    {workspace.pages.map((page) => {
                      const isActive =
                        pathname === page.url ||
                        pathname.startsWith(`${page.url}/`);

                      return (
                        <SidebarMenuSubItem key={page.name}>
                          <SidebarMenuSubButton asChild isActive={isActive}>
                            <Link href={page.url}>
                              <span>{page.emoji}</span>
                              <span>{page.name}</span>
                            </Link>
                          </SidebarMenuSubButton>
                        </SidebarMenuSubItem>
                      );
                    })}
                  </SidebarMenuSub>
                </CollapsibleContent>
              </SidebarMenuItem>
            </Collapsible>
          ))}

          <SidebarMenuItem>
            <SidebarMenuButton className="text-sidebar-foreground/70">
              <MoreHorizontalIcon />
              <span>More</span>
            </SidebarMenuButton>
          </SidebarMenuItem>
        </SidebarMenu>
      </SidebarGroupContent>
    </SidebarGroup>
  );
}
