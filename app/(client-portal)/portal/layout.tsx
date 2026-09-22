import { getCurrentUser } from "@/app/lib/auth/get-current-user";
import { ClientSidebar } from "@/components/client-sidebar";
import { SidebarProvider, SidebarTrigger } from "@/components/ui/sidebar";
import { redirect } from "next/navigation";

export default async function ClientLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const user = await getCurrentUser();

  if (!user) {
    redirect("/login");
  }

  if (!user.roles.includes("CLIENT")) {
    redirect("/internal");
  }

  return (
    <SidebarProvider>
      <div className="flex min-h-screen w-full bg-background">
        <ClientSidebar permissions={user.permissions} />

        <div className="flex min-w-0 flex-1 flex-col">
          <header className="flex h-16 shrink-0 items-center justify-between border-b border-border bg-card px-6">
            <div className="flex items-center gap-4">
              <SidebarTrigger />

              <span className="text-sm font-medium text-muted-foreground">
                Client Portal & Tracking
              </span>
            </div>

            <div className="flex items-center gap-3">
              <span className="hidden text-xs text-muted-foreground sm:inline">
                {user.name}
              </span>

              <span className="inline-flex items-center rounded-full border border-primary/20 bg-primary/10 px-2.5 py-1 text-xs font-semibold text-primary">
                Akses Klien
              </span>
            </div>
          </header>

          <main className="flex-1 overflow-y-auto p-6 lg:p-8">{children}</main>
        </div>
      </div>
    </SidebarProvider>
  );
}
