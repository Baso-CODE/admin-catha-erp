import { Mail, Phone, UserRound } from "lucide-react";

import { ClientProfile } from "@/app/services/client-portal.service";
import { Badge } from "@/components/ui/badge";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { InfoRow } from "./info-row";

interface ContactPersonCardProps {
  profile: ClientProfile;
}

export function ContactPersonCard({ profile }: ContactPersonCardProps) {
  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <UserRound className="size-5" />
          Contact Person
        </CardTitle>

        <CardDescription>
          Informasi Anda sebagai contact person perusahaan.
        </CardDescription>
      </CardHeader>

      <CardContent className="space-y-4">
        <InfoRow label="Nama" value={profile.contact?.fullName ?? "-"} />

        <InfoRow label="Jabatan" value={profile.contact?.position ?? "-"} />

        <InfoRow
          label="Department"
          value={profile.contact?.department ?? "-"}
        />

        <InfoRow
          label="Email"
          value={profile.contact?.email ?? "-"}
          icon={Mail}
        />

        <InfoRow
          label="Phone"
          value={profile.contact?.mobile ?? profile.contact?.phone ?? "-"}
          icon={Phone}
        />

        <div className="flex items-center justify-between gap-4">
          <span className="text-sm text-muted-foreground">Primary Contact</span>

          <Badge variant="outline">
            {profile.contact?.isPrimary ? "Yes" : "No"}
          </Badge>
        </div>
      </CardContent>
    </Card>
  );
}
