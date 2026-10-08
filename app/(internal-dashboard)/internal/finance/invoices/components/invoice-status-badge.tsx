import { InvoiceStatus } from "@/app/services/invoice.service";
import { Badge } from "@/components/ui/badge";

const statusConfig: Record<
  InvoiceStatus,
  {
    label: string;
    className: string;
  }
> = {
  DRAFT: {
    label: "Draft",
    className: "bg-muted text-muted-foreground",
  },
  SENT: {
    label: "Sent",
    className: "bg-blue-100 text-blue-700",
  },
  PARTIALLY_PAID: {
    label: "Partially Paid",
    className: "bg-amber-100 text-amber-700",
  },
  PAID: {
    label: "Paid",
    className: "bg-emerald-100 text-emerald-700",
  },
  OVERDUE: {
    label: "Overdue",
    className: "bg-red-100 text-red-700",
  },
  CANCELLED: {
    label: "Cancelled",
    className: "bg-zinc-100 text-zinc-600",
  },
};

interface InvoiceStatusBadgeProps {
  status: InvoiceStatus;
  isOverdue?: boolean;
}

export function InvoiceStatusBadge({
  status,
  isOverdue = false,
}: InvoiceStatusBadgeProps) {
  if (isOverdue && !["DRAFT", "PAID", "CANCELLED"].includes(status)) {
    return (
      <Badge variant="secondary" className="bg-red-100 text-red-700">
        Overdue
      </Badge>
    );
  }

  const config = statusConfig[status];

  return (
    <Badge variant="secondary" className={config.className}>
      {config.label}
    </Badge>
  );
}
