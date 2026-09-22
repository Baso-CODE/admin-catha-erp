import { authService } from "@/app/services/auth.service";
import { AppSidebar } from "@/components/app-sidebar";
import { SidebarProvider, SidebarTrigger } from "@/components/ui/sidebar";
import { cookies } from "next/headers";
import { redirect } from "next/navigation";

export default async function InternalLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const cookieStore = await cookies();
  const token = cookieStore.get("token")?.value;

  if (!token) {
    redirect("/login");
  }

  let user;

  try {
    const response = await authService.me(`token=${token}`);

    if (!response.success) {
      redirect("/login");
    }

    user = response.data;
  } catch {
    redirect("/login");
  }

  const permissions = user.permissions ?? [];
  const userRoles = user.roles?.join(", ") || "-";

  return (
    <SidebarProvider>
      <div className="flex min-h-screen w-full bg-background">
        <AppSidebar permissions={permissions} />

        <div className="flex min-w-0 flex-1 flex-col">
          <header className="flex h-16 shrink-0 items-center justify-between border-b border-border bg-card px-6">
            <div className="flex items-center gap-4">
              <SidebarTrigger />

              <span className="text-sm font-medium text-muted-foreground">
                Agency Operations Dashboard
              </span>
            </div>

            <div>
              <span className="inline-flex items-center rounded-full border border-primary/20 bg-primary/10 px-2.5 py-1 text-xs font-semibold text-primary">
                Role: {userRoles}
              </span>
            </div>
          </header>

          <main className="flex-1 overflow-y-auto p-6 lg:p-8">{children}</main>
        </div>
      </div>
    </SidebarProvider>
  );
}
