import { Mail, UserRound } from "lucide-react";

import { ClientProfile } from "@/app/services/client-portal.service";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";

import { formatDate } from "@/app/lib/format-date";
import { InfoRow } from "./info-row";

interface AccountCardProps {
  profile: ClientProfile;
}

export function AccountCard({ profile }: AccountCardProps) {
  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <UserRound className="size-5" />
          Account
        </CardTitle>

        <CardDescription>Informasi akun login Client Portal.</CardDescription>
      </CardHeader>

      <CardContent className="space-y-4">
        <InfoRow label="Nama" value={profile.user?.name ?? "-"} />

        <InfoRow label="Email" value={profile.user?.email ?? "-"} icon={Mail} />

        <InfoRow
          label="Account Since"
          value={
            profile.user?.createdAt ? formatDate(profile.user.createdAt) : "-"
          }
        />
      </CardContent>
    </Card>
  );
}
