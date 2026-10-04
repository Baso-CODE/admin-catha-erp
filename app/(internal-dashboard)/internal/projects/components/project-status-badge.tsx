import { ProjectStatus } from "@/app/services/project.service";
import { Badge } from "@/components/ui/badge";

interface ProjectStatusBadgeProps {
  status: ProjectStatus;
}

const statusLabel: Record<ProjectStatus, string> = {
  DRAFT: "Draft",
  PLANNING: "Planning",
  IN_PROGRESS: "In Progress",
  INTERNAL_REVIEW: "Internal Review",
  PENDING_CLIENT_APPROVAL: "Pending Client Approval",
  CLIENT_REVISION: "Client Revision",
  APPROVED: "Approved",
  COMPLETED: "Completed",
  ON_HOLD: "On Hold",
  CANCELLED: "Cancelled",
};

export function ProjectStatusBadge({ status }: ProjectStatusBadgeProps) {
  const variant =
    status === "COMPLETED" || status === "APPROVED"
      ? "default"
      : status === "CANCELLED"
        ? "destructive"
        : "secondary";

  return <Badge variant={variant}>{statusLabel[status]}</Badge>;
}
