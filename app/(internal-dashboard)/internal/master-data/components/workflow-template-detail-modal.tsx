"use client";

import { Layers3, ListChecks, Loader2, Workflow } from "lucide-react";
import { ReactNode, useEffect, useState } from "react";
import { toast } from "sonner";

import {
  WorkflowTemplateItem,
  workflowTemplateService,
} from "@/app/services/workflowTemplate.service";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";

interface WorkflowTemplateDetailModalProps {
  item: WorkflowTemplateItem;
  trigger?: ReactNode;
}

export function WorkflowTemplateDetailModal({
  item,
  trigger,
}: WorkflowTemplateDetailModalProps) {
  const [open, setOpen] = useState(false);
  const [detail, setDetail] = useState<WorkflowTemplateItem>(item);
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    if (!open) return;

    const loadDetail = async () => {
      try {
        setIsLoading(true);

        const response = await workflowTemplateService.getById(item.id);

        setDetail(response.data);
      } catch (error) {
        toast.error("Gagal mengambil detail workflow template.", {
          description:
            error instanceof Error
              ? error.message
              : "Terjadi kesalahan pada server.",
        });
      } finally {
        setIsLoading(false);
      }
    };

    void loadDetail();
  }, [open, item.id]);

  const sortedSteps = detail.steps.slice().sort((a, b) => a.order - b.order);

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      {trigger && <DialogTrigger asChild>{trigger}</DialogTrigger>}

      <DialogContent className="max-h-[90vh] overflow-y-auto sm:max-w-2xl">
        <DialogHeader>
          <DialogTitle>Detail Workflow Template</DialogTitle>
          <DialogDescription>
            Informasi lengkap workflow template dan urutan prosesnya.
          </DialogDescription>
        </DialogHeader>

        {isLoading ? (
          <div className="flex min-h-52 items-center justify-center">
            <Loader2 className="size-6 animate-spin text-muted-foreground" />
          </div>
        ) : (
          <div className="space-y-6 pt-2">
            <div className="border-b pb-4">
              <div className="flex items-start gap-3">
                <div className="rounded-lg bg-muted p-2">
                  <Workflow className="size-5 text-muted-foreground" />
                </div>

                <div>
                  <h3 className="text-lg font-semibold">{detail.name}</h3>

                  <p className="text-sm text-muted-foreground">
                    {detail.description || "Tidak ada deskripsi."}
                  </p>
                </div>
              </div>
            </div>

            <div className="grid gap-4 sm:grid-cols-2">
              <DetailItem
                icon={Layers3}
                label="Master Service"
                value={`${detail._count?.masterServices ?? 0} service`}
              />

              <DetailItem
                icon={ListChecks}
                label="Workflow Instance"
                value={`${detail._count?.instances ?? 0} instance`}
              />
            </div>

            <div className="space-y-3">
              <div>
                <p className="text-sm font-medium">Workflow Steps</p>

                <p className="text-xs text-muted-foreground">
                  Urutan proses yang digunakan oleh template ini.
                </p>
              </div>

              <div className="space-y-3">
                {sortedSteps.map((step) => (
                  <div
                    key={`${step.key}-${step.order}`}
                    className="flex items-start gap-3 rounded-xl border p-4">
                    <div className="flex size-8 shrink-0 items-center justify-center rounded-full bg-primary/10 text-sm font-semibold text-primary">
                      {step.order}
                    </div>

                    <div className="min-w-0">
                      <p className="font-medium">{step.name}</p>

                      <p className="mt-1 font-mono text-xs text-muted-foreground">
                        {step.key}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {detail.masterServices && detail.masterServices.length > 0 && (
              <div className="space-y-3">
                <div>
                  <p className="text-sm font-medium">
                    Digunakan oleh Master Service
                  </p>

                  <p className="text-xs text-muted-foreground">
                    Service yang menggunakan workflow template ini.
                  </p>
                </div>

                <div className="space-y-2">
                  {detail.masterServices.map((service) => (
                    <div
                      key={service.id}
                      className="flex items-center justify-between rounded-lg border p-3">
                      <div>
                        <p className="text-sm font-medium">{service.name}</p>

                        <p className="font-mono text-xs text-muted-foreground">
                          {service.code}
                        </p>
                      </div>

                      <span
                        className={
                          service.isActive
                            ? "rounded-full bg-primary/10 px-2.5 py-1 text-xs font-medium text-primary"
                            : "rounded-full bg-muted px-2.5 py-1 text-xs font-medium text-muted-foreground"
                        }>
                        {service.isActive ? "Aktif" : "Tidak Aktif"}
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            )}

            <div className="grid grid-cols-2 gap-4 border-t pt-4">
              <div>
                <p className="text-xs text-muted-foreground">Dibuat</p>

                <p className="mt-1 text-sm font-medium">
                  {formatDate(detail.createdAt)}
                </p>
              </div>

              <div>
                <p className="text-xs text-muted-foreground">
                  Terakhir Diperbarui
                </p>

                <p className="mt-1 text-sm font-medium">
                  {formatDate(detail.updatedAt)}
                </p>
              </div>
            </div>
          </div>
        )}
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
    <div className="flex items-start gap-3 rounded-xl border p-4">
      <div className="rounded-md bg-muted p-2">
        <Icon className="size-4 text-muted-foreground" />
      </div>

      <div>
        <p className="text-xs text-muted-foreground">{label}</p>

        <p className="mt-1 text-sm font-medium">{value}</p>
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
