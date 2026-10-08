import { PaymentStatus } from "@/app/services/payment.service";
import { Badge } from "@/components/ui/badge";

const statusConfig: Record<
  PaymentStatus,
  {
    label: string;
    className: string;
  }
> = {
  PENDING: {
    label: "Pending",
    className: "bg-amber-100 text-amber-700",
  },
  VERIFIED: {
    label: "Verified",
    className: "bg-emerald-100 text-emerald-700",
  },
  REJECTED: {
    label: "Rejected",
    className: "bg-red-100 text-red-700",
  },
};

interface PaymentStatusBadgeProps {
  status: PaymentStatus;
}

export function PaymentStatusBadge({ status }: PaymentStatusBadgeProps) {
  const config = statusConfig[status];

  return (
    <Badge variant="secondary" className={config.className}>
      {config.label}
    </Badge>
  );
}
