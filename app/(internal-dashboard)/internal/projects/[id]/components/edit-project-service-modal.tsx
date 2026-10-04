"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { Loader2 } from "lucide-react";
import { ReactNode, useEffect, useState } from "react";
import { useForm } from "react-hook-form";
import { toast } from "sonner";
import { z } from "zod";

import {
  ProjectServiceItem,
  projectServiceService,
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

const schema = z
  .object({
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

interface EditProjectServiceModalProps {
  item: ProjectServiceItem;
  onSuccess?: () => void | Promise<void>;
  trigger?: ReactNode;
}

function toDateInput(value?: string | null) {
  if (!value) return "";
  return new Date(value).toISOString().slice(0, 10);
}

export function EditProjectServiceModal({
  item,
  onSuccess,
  trigger,
}: EditProjectServiceModalProps) {
  const [open, setOpen] = useState(false);

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors, isSubmitting },
  } = useForm<FormValues>({
    resolver: zodResolver(schema),
    defaultValues: {
      startDate: toDateInput(item.startDate),
      endDate: toDateInput(item.endDate),
    },
  });

  useEffect(() => {
    reset({
      startDate: toDateInput(item.startDate),
      endDate: toDateInput(item.endDate),
    });
  }, [item, reset]);

  const handleOpenChange = (value: boolean) => {
    setOpen(value);

    if (value) {
      reset({
        startDate: toDateInput(item.startDate),
        endDate: toDateInput(item.endDate),
      });
    }
  };

  const onSubmit = async (values: FormValues) => {
    try {
      await projectServiceService.update(item.id, {
        startDate: values.startDate || null,
        endDate: values.endDate || null,
      });

      toast.success("Project service berhasil diperbarui.");

      setOpen(false);

      await onSuccess?.();
    } catch (error) {
      toast.error("Gagal memperbarui project service.", {
        description:
          error instanceof Error
            ? error.message
            : "Terjadi kesalahan pada server.",
      });
    }
  };

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      {trigger && <DialogTrigger asChild>{trigger}</DialogTrigger>}

      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Edit Project Service</DialogTitle>
          <DialogDescription>
            Perbarui periode service. Jenis service tidak dapat diganti setelah
            ditambahkan ke project.
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit(onSubmit)} className="space-y-5">
          <div className="rounded-lg border bg-muted/20 p-3">
            <p className="text-xs text-muted-foreground">Service</p>

            <p className="mt-1 text-sm font-medium">
              {item.masterService?.name ?? "-"}
            </p>

            <p className="font-mono text-xs text-muted-foreground">
              {item.masterService?.code ?? "-"}
            </p>
          </div>

          <div className="grid gap-4 sm:grid-cols-2">
            <div className="space-y-2">
              <Label htmlFor={`service-start-${item.id}`}>Start Date</Label>

              <Input
                id={`service-start-${item.id}`}
                type="date"
                {...register("startDate")}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor={`service-end-${item.id}`}>End Date</Label>

              <Input
                id={`service-end-${item.id}`}
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

            <Button type="submit" disabled={isSubmitting}>
              {isSubmitting && <Loader2 className="size-4 animate-spin" />}
              Simpan Perubahan
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
