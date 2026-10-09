import { requireInternalUser } from "@/app/lib/auth/require-internal-user";
import { BarChart3, FolderKanban, TrendingUp, Users } from "lucide-react";
import Link from "next/link";
import { redirect } from "next/navigation";

export default async function ReportsPage() {
  const user = await requireInternalUser();
  const permissions = new Set(user.permissions);

  const reports = [
    {
      title: "Revenue Report",
      description:
        "Analisis pendapatan, pembayaran, tren revenue, serta performa Client dan Project.",
      href: "/internal/reports/revenue",
      icon: TrendingUp,
      available:
        permissions.has("invoice.read") && permissions.has("payment.read"),
      enabled: true,
    },
    {
      title: "Project Report",
      description:
        "Monitoring status Project, progres Task dan Service, deadline, serta performa proyek.",
      href: "/internal/reports/projects",
      icon: FolderKanban,
      available: permissions.has("project.read"),
      enabled: true,
    },
    {
      title: "Team Workload Report",
      description:
        "Analisis beban kerja anggota tim, Task aktif, penyelesaian, overdue, blocked, dan prioritas pekerjaan.",
      href: "/internal/reports/team-workload",
      icon: Users,
      available: permissions.has("task.read"),
      enabled: true,
    },
    {
      title: "Client KPI Report",
      description:
        "Analisis performa Client, retention, dan kontribusi terhadap bisnis.",
      href: "/internal/reports/clients",
      icon: BarChart3,
      available: false,
      enabled: false,
    },
  ];

  if (!reports.some((report) => report.available)) {
    redirect("/internal");
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight">
          Reporting & Analytics
        </h1>
        <p className="mt-1 text-sm text-muted-foreground">
          Pusat laporan operasional dan performa bisnis ERP Catha.
        </p>
      </div>

      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
        {reports
          .filter((report) => report.available || !report.enabled)
          .map((report) => {
            const Icon = report.icon;

            const content = (
              <div className="rounded-xl border bg-card p-5 transition-colors hover:border-primary/40">
                <div className="mb-4 flex items-center justify-between">
                  <div className="rounded-lg bg-primary/10 p-3 text-primary">
                    <Icon className="size-5" />
                  </div>
                  <span className="text-xs text-muted-foreground">
                    {report.enabled ? "Available" : "Coming Soon"}
                  </span>
                </div>
                <h2 className="font-semibold">{report.title}</h2>
                <p className="mt-2 text-sm text-muted-foreground">
                  {report.description}
                </p>
              </div>
            );

            return report.available ? (
              <Link key={report.href} href={report.href}>
                {content}
              </Link>
            ) : (
              <div key={report.href} className="opacity-60">
                {content}
              </div>
            );
          })}
      </div>
    </div>
  );
}
