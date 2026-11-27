"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { FolderTree, Loader2, Plus, Workflow } from "lucide-react";
import { useEffect, useMemo, useState } from "react";
import { useForm } from "react-hook-form";
import { toast } from "sonner";
import { z } from "zod";

import { groupServicesByCategory } from "@/app/lib/group-services-by-category";

import {
  projectServiceService,
  type AvailableMasterService,
} from "@/app/services/projectService.service";

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
  SelectGroup,
  SelectItem,
  SelectLabel,
  SelectSeparator,
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

  const [services, setServices] = useState<AvailableMasterService[]>([]);

  const [isLoadingServices, setIsLoadingServices] = useState(false);

  const [loadError, setLoadError] = useState(false);
  const [reloadKey, setReloadKey] = useState(0);

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

  const groupedServices = useMemo(
    () => groupServicesByCategory(services),
    [services],
  );

  const selectedService = services.find(
    (service) => service.id === masterServiceId,
  );

  useEffect(() => {
    if (!open) return;

    let active = true;

    async function loadServices() {
      try {
        setIsLoadingServices(true);
        setLoadError(false);

        const response =
          await projectServiceService.getAvailableMasterServices(projectId);

        if (!active) return;

        setServices(response.data);
      } catch (error) {
        if (!active) return;

        setServices([]);
        setLoadError(true);

        toast.error("Gagal mengambil master service.", {
          description:
            error instanceof Error
              ? error.message
              : "Terjadi kesalahan pada server.",
        });
      } finally {
        if (active) {
          setIsLoadingServices(false);
        }
      }
    }

    void loadServices();

    return () => {
      active = false;
    };
  }, [open, projectId, reloadKey]);

  const handleOpenChange = (value: boolean) => {
    if (isSubmitting) return;

    if (value) {
      reset();
      setServices([]);
      setLoadError(false);
      setIsLoadingServices(true);
    }

    setOpen(value);

    if (!value) {
      reset();
      setServices([]);
    }
  };

  const onSubmit = async (values: FormValues) => {
    if (
      isLoadingServices ||
      loadError ||
      !services.some((service) => service.id === values.masterServiceId)
    ) {
      toast.error("Service yang dipilih tidak tersedia.");
      return;
    }

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
      setServices([]);
    } catch (error) {
      toast.error("Gagal menambahkan project service.", {
        description:
          error instanceof Error
            ? error.message
            : "Terjadi kesalahan pada server.",
      });

      return;
    }

    try {
      await onSuccess?.();
    } catch {
      toast.error("Service tersimpan, tetapi data halaman gagal diperbarui.");
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

      <DialogContent className="max-h-[90vh] overflow-y-auto sm:max-w-lg">
        <DialogHeader>
          <DialogTitle>Tambah Project Service</DialogTitle>

          <DialogDescription>
            Pilih layanan berdasarkan kategori. Workflow default akan dibuat
            otomatis jika tersedia.
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit(onSubmit)} className="space-y-5">
          <div className="space-y-2">
            <Label htmlFor="project-master-service">Master Service</Label>

            <Select
              value={masterServiceId || ""}
              disabled={
                isLoadingServices ||
                isSubmitting ||
                loadError ||
                services.length === 0
              }
              onValueChange={(value) =>
                setValue("masterServiceId", value, {
                  shouldDirty: true,
                  shouldValidate: true,
                })
              }>
              <SelectTrigger id="project-master-service" className="w-full">
                <SelectValue
                  placeholder={
                    isLoadingServices
                      ? "Memuat service..."
                      : loadError
                        ? "Gagal memuat service"
                        : services.length === 0
                          ? "Tidak ada service tersedia"
                          : "Pilih master service"
                  }
                />
              </SelectTrigger>

              <SelectContent className="max-h-80">
                {groupedServices.map((group, index) => (
                  <SelectGroup key={group.id}>
                    {index > 0 && <SelectSeparator />}

                    <SelectLabel className="px-2 py-2 text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                      {group.name}
                      {!group.isActive && " (Tidak Aktif)"}
                    </SelectLabel>

                    {group.services.map((service) => (
                      <SelectItem key={service.id} value={service.id}>
                        {service.name}
                        {" · "}
                        {service.code}
                      </SelectItem>
                    ))}
                  </SelectGroup>
                ))}
              </SelectContent>
            </Select>

            {errors.masterServiceId && (
              <p className="text-xs text-destructive">
                {errors.masterServiceId.message}
              </p>
            )}

            {loadError ? (
              <Button
                type="button"
                size="sm"
                variant="outline"
                disabled={isLoadingServices}
                onClick={() => setReloadKey((current) => current + 1)}>
                Coba Lagi
              </Button>
            ) : !isLoadingServices && services.length === 0 ? (
              <p className="text-xs text-muted-foreground">
                Seluruh service aktif sudah ditambahkan atau belum ada master
                service aktif.
              </p>
            ) : !isLoadingServices ? (
              <p className="text-xs text-muted-foreground">
                {services.length} service tersedia dalam{" "}
                {groupedServices.length} grup.
              </p>
            ) : null}
          </div>

          {selectedService && <ServiceWorkflowInfo service={selectedService} />}

          <div className="grid gap-4 sm:grid-cols-2">
            <div className="space-y-2">
              <Label htmlFor="service-start-date">Start Date</Label>

              <Input
                id="service-start-date"
                type="date"
                disabled={isSubmitting}
                {...register("startDate")}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="service-end-date">End Date</Label>

              <Input
                id="service-end-date"
                type="date"
                disabled={isSubmitting}
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
              disabled={isSubmitting}
              onClick={() => handleOpenChange(false)}>
              Batal
            </Button>

            <Button
              type="submit"
              disabled={
                isSubmitting ||
                isLoadingServices ||
                loadError ||
                !selectedService
              }>
              {isSubmitting && <Loader2 className="size-4 animate-spin" />}
              Tambahkan Service
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}

function ServiceWorkflowInfo({ service }: { service: AvailableMasterService }) {
  return (
    <div className="divide-y rounded-lg border bg-muted/20">
      <div className="flex items-start gap-3 p-3">
        <div className="rounded-md bg-muted p-2">
          <FolderTree className="size-4 text-muted-foreground" />
        </div>

        <div className="min-w-0">
          <p className="text-xs text-muted-foreground">Service Category</p>

          <p className="mt-1 text-sm font-medium">
            {service.category?.name ?? "Uncategorized"}
          </p>

          {service.category && !service.category.isActive && (
            <p className="mt-1 text-xs text-muted-foreground">
              Kategori tidak aktif. Service masih aktif.
            </p>
          )}
        </div>
      </div>

      <div className="flex items-start gap-3 p-3">
        <div className="rounded-md bg-muted p-2">
          <Workflow className="size-4 text-muted-foreground" />
        </div>

        <div className="min-w-0">
          <p className="text-xs text-muted-foreground">Default Workflow</p>

          <p className="mt-1 text-sm font-medium">
            {service.defaultTemplate?.name ?? "Tidak memiliki default workflow"}
          </p>

          <p className="mt-1 text-xs text-muted-foreground">
            {service.defaultTemplate
              ? "Workflow instance akan dibuat otomatis setelah service ditambahkan."
              : "Project service tetap dapat dibuat tanpa workflow instance."}
          </p>
        </div>
      </div>
    </div>
  );
}
