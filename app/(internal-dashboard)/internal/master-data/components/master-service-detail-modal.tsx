"use client";

import { FileText, Layers3, Workflow } from "lucide-react";
import { ReactNode } from "react";

import { MasterServiceItem } from "@/app/services/masterService.service";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";

interface MasterServiceDetailModalProps {
  item: MasterServiceItem;
  trigger?: ReactNode;
}

export function MasterServiceDetailModal({
  item,
  trigger,
}: MasterServiceDetailModalProps) {
  return (
    <Dialog>
      {trigger && <DialogTrigger asChild>{trigger}</DialogTrigger>}

      <DialogContent className="sm:max-w-lg">
        <DialogHeader>
          <DialogTitle>Detail Master Service</DialogTitle>
          <DialogDescription>
            Informasi lengkap master service dan workflow default.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-5 pt-2">
          <div className="flex items-start justify-between gap-4 border-b pb-4">
            <div>
              <h3 className="text-lg font-semibold">{item.name}</h3>
              <p className="font-mono text-xs text-muted-foreground">
                {item.code}
              </p>
            </div>

            <span
              className={
                item.isActive
                  ? "inline-flex rounded-full bg-primary/10 px-2.5 py-1 text-xs font-medium text-primary"
                  : "inline-flex rounded-full bg-muted px-2.5 py-1 text-xs font-medium text-muted-foreground"
              }>
              {item.isActive ? "Aktif" : "Tidak Aktif"}
            </span>
          </div>

          <DetailItem
            icon={FileText}
            label="Deskripsi"
            value={item.description || "-"}
          />

          <DetailItem
            icon={Workflow}
            label="Default Workflow Template"
            value={item.defaultTemplate?.name ?? "Belum ditentukan"}
          />

          {item.defaultTemplate?.description && (
            <div className="rounded-lg border bg-muted/20 p-4">
              <p className="mb-1 text-xs text-muted-foreground">
                Deskripsi Workflow
              </p>
              <p className="text-sm">{item.defaultTemplate.description}</p>
            </div>
          )}

          <DetailItem
            icon={Layers3}
            label="Digunakan pada Project"
            value={`${item._count?.projectServices ?? 0} project service`}
          />

          <div className="grid grid-cols-2 gap-4 border-t pt-4">
            <div>
              <p className="text-xs text-muted-foreground">Dibuat</p>
              <p className="mt-1 text-sm font-medium">
                {formatDate(item.createdAt)}
              </p>
            </div>

            <div>
              <p className="text-xs text-muted-foreground">
                Terakhir Diperbarui
              </p>
              <p className="mt-1 text-sm font-medium">
                {formatDate(item.updatedAt)}
              </p>
            </div>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}

interface DetailItemProps {
  icon: React.ElementType;
  label: string;
  value: React.ReactNode;
}

function DetailItem({ icon: Icon, label, value }: DetailItemProps) {
  return (
    <div className="flex items-start gap-3">
      <div className="mt-0.5 rounded-md bg-muted p-2">
        <Icon className="size-4 text-muted-foreground" />
      </div>

      <div className="min-w-0">
        <p className="text-xs text-muted-foreground">{label}</p>
        <div className="mt-1 wrap-break-words text-sm font-medium">{value}</div>
      </div>
    </div>
  );
}

function formatDate(value: string) {
  return new Intl.DateTimeFormat("id-ID", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  }).format(new Date(value));
}
