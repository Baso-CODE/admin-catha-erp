import { Building2, Globe2, MapPin } from "lucide-react";

import { ClientProfile } from "@/app/services/client-portal.service";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { InfoRow } from "./info-row";

interface CompanyCardProps {
  profile: ClientProfile;
}

export function CompanyCard({ profile }: CompanyCardProps) {
  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Building2 className="size-5" />
          Company
        </CardTitle>

        <CardDescription>
          Informasi perusahaan yang terhubung dengan Client Portal.
        </CardDescription>
      </CardHeader>

      <CardContent className="grid gap-4 md:grid-cols-2">
        <InfoRow label="Company Name" value={profile.client.companyName} />

        <InfoRow label="Client Code" value={profile.client.clientCode} />

        <InfoRow label="Industry" value={profile.client.industry ?? "-"} />

        <InfoRow
          label="Business Type"
          value={profile.client.businessType ?? "-"}
        />

        <InfoRow
          label="Website"
          value={profile.client.website ?? "-"}
          icon={Globe2}
        />

        <InfoRow label="Status" value={profile.client.status} />

        <div className="md:col-span-2">
          <InfoRow
            label="Address"
            value={profile.client.address ?? "-"}
            icon={MapPin}
          />
        </div>
      </CardContent>
    </Card>
  );
}
