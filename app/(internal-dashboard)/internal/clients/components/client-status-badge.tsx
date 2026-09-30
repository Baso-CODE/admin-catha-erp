import { ClientStatus } from "@/app/services/client.service";
import { Badge } from "@/components/ui/badge";

interface ClientStatusBadgeProps {
  status: ClientStatus;
}

export function ClientStatusBadge({ status }: ClientStatusBadgeProps) {
  if (status === "ACTIVE") {
    return <Badge variant="default">Active</Badge>;
  }

  return <Badge variant="secondary">Inactive</Badge>;
}
