"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { Loader2, Plus } from "lucide-react";
import { useEffect, useState } from "react";
import { useForm } from "react-hook-form";
import { toast } from "sonner";
import { z } from "zod";

import {
  MasterServiceItem,
  masterServiceService,
} from "@/app/services/masterService.service";
import { projectServiceService } from "@/app/services/projectService.service";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

const schema = z
  .object({
    masterServiceId: z.string().min(1, "Service wajib dipilih."),
    startDate: z.string().optional(),
    endDate: z.string().optional(),
  })
  .refine(
    (values) =>
      !values.startDate ||
      !values.endDate ||
      new Date(values.endDate) > new Date(values.startDate),
    {
      message: "End date harus setelah start date.",
      path: ["endDate"],
    },
  );

type FormValues = z.infer<typeof schema>;

interface AddProjectServiceModalProps {
  projectId: string;
  onSuccess?: () => void | Promise<void>;
}

export function AddProjectServiceModal({
  projectId,
  onSuccess,
}: AddProjectServiceModalProps) {
  const [open, setOpen] = useState(false);
  const [services, setServices] = useState<MasterServiceItem[]>([]);
  const [isLoadingServices, setIsLoadingServices] = useState(false);

  const {
    register,
    handleSubmit,
    setValue,
    watch,
    reset,
    formState: { errors, isSubmitting },
  } = useForm<FormValues>({
    resolver: zodResolver(schema),
    defaultValues: {
      masterServiceId: "",
      startDate: "",
      endDate: "",
    },
  });

  const masterServiceId = watch("masterServiceId");

  useEffect(() => {
    if (!open) return;

    const loadServices = async () => {
      try {
        setIsLoadingServices(true);

        const response = await masterServiceService.getAll({
          isActive: true,
          page: 1,
          limit: 100,
        });

        setServices(response.data);
      } catch (error) {
        toast.error("Gagal mengambil master service.", {
          description:
            error instanceof Error
              ? error.message
              : "Terjadi kesalahan pada server.",
        });
      } finally {
        setIsLoadingServices(false);
      }
    };

    void loadServices();
  }, [open]);

  const handleOpenChange = (value: boolean) => {
    setOpen(value);

    if (!value) {
      reset();
    }
  };

  const onSubmit = async (values: FormValues) => {
    try {
      await projectServiceService.create({
        projectId,
        masterServiceId: values.masterServiceId,
        startDate: values.startDate || undefined,
        endDate: values.endDate || undefined,
      });

      toast.success("Service berhasil ditambahkan ke project.");

      setOpen(false);
      reset();

      await onSuccess?.();
    } catch (error) {
      toast.error("Gagal menambahkan project service.", {
        description:
          error instanceof Error
            ? error.message
            : "Terjadi kesalahan pada server.",
      });
    }
  };

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogTrigger asChild>
        <Button>
          <Plus className="size-4" />
          Tambah Service
        </Button>
      </DialogTrigger>

      <DialogContent className="sm:max-w-lg">
        <DialogHeader>
          <DialogTitle>Tambah Project Service</DialogTitle>

          <DialogDescription>
            Tambahkan service ke project. Workflow default akan dibuat otomatis
            jika tersedia.
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit(onSubmit)} className="space-y-5">
          <div className="space-y-2">
            <Label>Master Service</Label>

            <Select
              value={masterServiceId || undefined}
              onValueChange={(value) =>
                setValue("masterServiceId", value, {
                  shouldValidate: true,
                })
              }
              disabled={isLoadingServices}>
              <SelectTrigger>
                <SelectValue
                  placeholder={
                    isLoadingServices
                      ? "Memuat service..."
                      : "Pilih master service"
                  }
                />
              </SelectTrigger>

              <SelectContent>
                {services.map((service) => (
                  <SelectItem key={service.id} value={service.id}>
                    {service.name}
                    {" · "}
                    {service.code}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>

            {errors.masterServiceId && (
              <p className="text-xs text-destructive">
                {errors.masterServiceId.message}
              </p>
            )}

            {masterServiceId && (
              <ServiceWorkflowInfo
                service={services.find(
                  (service) => service.id === masterServiceId,
                )}
              />
            )}
          </div>

          <div className="grid gap-4 sm:grid-cols-2">
            <div className="space-y-2">
              <Label htmlFor="service-start-date">Start Date</Label>

              <Input
                id="service-start-date"
                type="date"
                {...register("startDate")}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="service-end-date">End Date</Label>

              <Input
                id="service-end-date"
                type="date"
                {...register("endDate")}
              />

              {errors.endDate && (
                <p className="text-xs text-destructive">
                  {errors.endDate.message}
                </p>
              )}
            </div>
          </div>

          <DialogFooter>
            <Button
              type="button"
              variant="outline"
              onClick={() => setOpen(false)}
              disabled={isSubmitting}>
              Batal
            </Button>

            <Button type="submit" disabled={isSubmitting || isLoadingServices}>
              {isSubmitting && <Loader2 className="size-4 animate-spin" />}
              Tambahkan Service
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}

function ServiceWorkflowInfo({ service }: { service?: MasterServiceItem }) {
  if (!service) return null;

  return (
    <div className="rounded-lg border bg-muted/20 p-3">
      <p className="text-xs text-muted-foreground">Default Workflow</p>

      <p className="mt-1 text-sm font-medium">
        {service.defaultTemplate?.name ?? "Tidak memiliki default workflow"}
      </p>

      {service.defaultTemplate ? (
        <p className="mt-1 text-xs text-muted-foreground">
          Workflow instance akan dibuat otomatis setelah service ditambahkan.
        </p>
      ) : (
        <p className="mt-1 text-xs text-muted-foreground">
          Project service tetap dapat dibuat tanpa workflow instance.
        </p>
      )}
    </div>
  );
}
