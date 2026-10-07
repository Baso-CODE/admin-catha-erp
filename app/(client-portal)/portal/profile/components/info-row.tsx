import { ComponentType } from "react";

interface InfoRowProps {
  label: string;
  value: string;
  icon?: ComponentType<{
    className?: string;
  }>;
}

export function InfoRow({ label, value, icon: Icon }: InfoRowProps) {
  return (
    <div className="flex items-start justify-between gap-4">
      <span className="text-sm text-muted-foreground">{label}</span>

      <div className="flex max-w-[65%] items-center gap-2 text-right text-sm font-medium">
        {Icon && <Icon className="size-4 shrink-0 text-muted-foreground" />}

        <span className="wrap-break-words">{value}</span>
      </div>
    </div>
  );
}
