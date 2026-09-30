import {
  Building2,
  FileText,
  Globe2,
  Mail,
  MapPin,
  UserRound,
  UsersRound,
} from "lucide-react";

import { ClientItem } from "@/app/services/client.service";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

interface ClientOverviewProps {
  client: ClientItem;
}

export function ClientOverview({ client }: ClientOverviewProps) {
  return (
    <div className="grid gap-6 lg:grid-cols-3">
      <div className="space-y-6 lg:col-span-2">
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Informasi Client</CardTitle>
          </CardHeader>

          <CardContent className="grid gap-5 sm:grid-cols-2">
            <OverviewItem
              icon={Building2}
              label="Company Name"
              value={client.companyName}
            />

            <OverviewItem
              icon={Building2}
              label="Industry"
              value={client.industry ?? "-"}
            />

            <OverviewItem
              icon={Building2}
              label="Business Type"
              value={client.businessType ?? "-"}
            />

            <OverviewItem
              icon={Globe2}
              label="Website"
              value={
                client.website ? (
                  <a
                    href={client.website}
                    target="_blank"
                    rel="noreferrer"
                    className="break-all hover:underline">
                    {client.website}
                  </a>
                ) : (
                  "-"
                )
              }
            />

            <div className="sm:col-span-2">
              <OverviewItem
                icon={MapPin}
                label="Address"
                value={client.address ?? "-"}
              />
            </div>
          </CardContent>
        </Card>

        {client.sourceLead && (
          <Card>
            <CardHeader>
              <CardTitle className="text-base">Source Lead</CardTitle>
            </CardHeader>

            <CardContent className="grid gap-5 sm:grid-cols-2">
              <OverviewItem
                icon={FileText}
                label="Lead Code"
                value={client.sourceLead.leadCode}
              />

              <OverviewItem
                icon={Building2}
                label="Company"
                value={client.sourceLead.company}
              />

              <OverviewItem
                icon={FileText}
                label="Lead Status"
                value={client.sourceLead.status}
              />
            </CardContent>
          </Card>
        )}
      </div>

      <div className="space-y-6">
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Account Manager</CardTitle>
          </CardHeader>

          <CardContent className="space-y-4">
            <OverviewItem
              icon={UserRound}
              label="Name"
              value={client.accountManager?.name ?? "-"}
            />

            <OverviewItem
              icon={Mail}
              label="Email"
              value={client.accountManager?.email ?? "-"}
            />
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-base">Summary</CardTitle>
          </CardHeader>

          <CardContent className="grid gap-4">
            <SummaryItem
              icon={UsersRound}
              label="Contact Person"
              value={client._count?.contacts ?? 0}
            />

            <SummaryItem
              icon={FileText}
              label="Contract"
              value={client._count?.contracts ?? 0}
            />

            <SummaryItem
              icon={FileText}
              label="Project"
              value={client._count?.projects ?? 0}
            />

            <SummaryItem
              icon={FileText}
              label="Invoice"
              value={client._count?.invoices ?? 0}
            />

            <SummaryItem
              icon={FileText}
              label="Ticket"
              value={client._count?.tickets ?? 0}
            />
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

interface OverviewItemProps {
  icon: React.ElementType;
  label: string;
  value: React.ReactNode;
}

function OverviewItem({ icon: Icon, label, value }: OverviewItemProps) {
  return (
    <div className="flex items-start gap-3">
      <div className="mt-0.5 rounded-md bg-muted p-2">
        <Icon className="size-4 text-muted-foreground" />
      </div>

      <div className="min-w-0 space-y-1">
        <p className="text-xs text-muted-foreground">{label}</p>

        <div className="text-sm font-medium">{value}</div>
      </div>
    </div>
  );
}

interface SummaryItemProps {
  icon: React.ElementType;
  label: string;
  value: number;
}

function SummaryItem({ icon: Icon, label, value }: SummaryItemProps) {
  return (
    <div className="flex items-center justify-between gap-4 rounded-lg border p-3">
      <div className="flex items-center gap-3">
        <Icon className="size-4 text-muted-foreground" />

        <span className="text-sm">{label}</span>
      </div>

      <span className="text-sm font-semibold">{value}</span>
    </div>
  );
}
