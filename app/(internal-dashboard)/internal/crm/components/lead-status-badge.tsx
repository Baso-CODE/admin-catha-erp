// lead-status-badge.tsx

"use client";

import { Badge } from "@/components/ui/badge";

interface LeadStatusBadgeProps {
  status: string;
}

const statusConfig: Record<
  string,
  {
    label: string;
    className: string;
  }
> = {
  NEW: {
    label: "New",
    className:
      "border-blue-500/20 bg-blue-500/10 text-blue-600 dark:text-blue-400",
  },
  QUALIFIED: {
    label: "Qualified",
    className:
      "border-amber-500/20 bg-amber-500/10 text-amber-600 dark:text-amber-400",
  },
  PROPOSAL: {
    label: "Proposal",
    className:
      "border-violet-500/20 bg-violet-500/10 text-violet-600 dark:text-violet-400",
  },
  NEGOTIATION: {
    label: "Negotiation",
    className:
      "border-orange-500/20 bg-orange-500/10 text-orange-600 dark:text-orange-400",
  },
  WON: {
    label: "Won",
    className:
      "border-emerald-500/20 bg-emerald-500/10 text-emerald-600 dark:text-emerald-400",
  },
  LOST: {
    label: "Lost",
    className: "border-destructive/20 bg-destructive/10 text-destructive",
  },
};

export function LeadStatusBadge({ status }: LeadStatusBadgeProps) {
  const config = statusConfig[status] ?? {
    label: status,
    className: "border-border bg-muted text-muted-foreground",
  };

  return (
    <Badge variant="outline" className={`font-medium ${config.className}`}>
      {config.label}
    </Badge>
  );
}
