"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { Loader2 } from "lucide-react";
import { ReactNode, useEffect, useState } from "react";
import { useForm } from "react-hook-form";
import { toast } from "sonner";
import { z } from "zod";

import {
  MasterServiceItem,
  masterServiceService,
} from "@/app/services/masterService.service";
import {
  WorkflowTemplateItem,
  workflowTemplateService,
} from "@/app/services/workflowTemplate.service";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
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
import { Textarea } from "@/components/ui/textarea";

const schema = z.object({
  code: z
    .string()
    .min(2, "Code minimal 2 karakter.")
    .max(50, "Code maksimal 50 karakter."),
  name: z
    .string()
    .min(2, "Nama minimal 2 karakter.")
    .max(150, "Nama maksimal 150 karakter."),
  description: z
    .string()
    .max(500, "Deskripsi maksimal 500 karakter.")
    .optional(),
  workflowTemplateId: z.string().optional(),
  isActive: z.boolean(),
});

type FormValues = z.infer<typeof schema>;

interface EditMasterServiceModalProps {
  item: MasterServiceItem;
  onSuccess?: () => void | Promise<void>;
  trigger?: ReactNode;
}

export function EditMasterServiceModal({
  item,
  onSuccess,
  trigger,
}: EditMasterServiceModalProps) {
  const [open, setOpen] = useState(false);
  const [templates, setTemplates] = useState<WorkflowTemplateItem[]>([]);
  const [isLoadingTemplates, setIsLoadingTemplates] = useState(false);

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
      code: item.code,
      name: item.name,
      description: item.description ?? "",
      workflowTemplateId: item.workflowTemplateId ?? "",
      isActive: item.isActive,
    },
  });

  const workflowTemplateId = watch("workflowTemplateId");
  const isActive = watch("isActive");

  useEffect(() => {
    reset({
      code: item.code,
      name: item.name,
      description: item.description ?? "",
      workflowTemplateId: item.workflowTemplateId ?? "",
      isActive: item.isActive,
    });
  }, [item, reset]);

  useEffect(() => {
    if (!open) return;

    const loadTemplates = async () => {
      try {
        setIsLoadingTemplates(true);

        const response = await workflowTemplateService.getAll({
          page: 1,
          limit: 100,
        });

        setTemplates(response.data);
      } catch (error) {
        toast.error("Gagal mengambil workflow template.", {
          description:
            error instanceof Error
              ? error.message
              : "Terjadi kesalahan pada server.",
        });
      } finally {
        setIsLoadingTemplates(false);
      }
    };

    void loadTemplates();
  }, [open]);

  const handleOpenChange = (value: boolean) => {
    setOpen(value);

    if (value) {
      reset({
        code: item.code,
        name: item.name,
        description: item.description ?? "",
        workflowTemplateId: item.workflowTemplateId ?? "",
        isActive: item.isActive,
      });
    }
  };

  const onSubmit = async (values: FormValues) => {
    try {
      await masterServiceService.update(item.id, {
        code: values.code.trim(),
        name: values.name.trim(),
        description: values.description?.trim() || undefined,
        workflowTemplateId: values.workflowTemplateId || null,
        isActive: values.isActive,
      });

      toast.success("Master service berhasil diperbarui.");

      setOpen(false);

      await onSuccess?.();
    } catch (error) {
      toast.error("Gagal memperbarui master service.", {
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

      <DialogContent className="sm:max-w-lg">
        <DialogHeader>
          <DialogTitle>Edit Master Service</DialogTitle>
          <DialogDescription>
            Perbarui informasi master service dan workflow default.
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit(onSubmit)} className="space-y-5">
          <div className="grid gap-4 sm:grid-cols-2">
            <div className="space-y-2">
              <Label htmlFor={`code-${item.id}`}>Code</Label>

              <Input id={`code-${item.id}`} {...register("code")} />

              {errors.code && (
                <p className="text-xs text-destructive">
                  {errors.code.message}
                </p>
              )}
            </div>

            <div className="space-y-2">
              <Label htmlFor={`name-${item.id}`}>Nama Service</Label>

              <Input id={`name-${item.id}`} {...register("name")} />

              {errors.name && (
                <p className="text-xs text-destructive">
                  {errors.name.message}
                </p>
              )}
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor={`description-${item.id}`}>Deskripsi</Label>

            <Textarea
              id={`description-${item.id}`}
              rows={4}
              {...register("description")}
            />

            {errors.description && (
              <p className="text-xs text-destructive">
                {errors.description.message}
              </p>
            )}
          </div>

          <div className="space-y-2">
            <Label>Default Workflow Template</Label>

            <Select
              value={workflowTemplateId || "none"}
              onValueChange={(value) =>
                setValue("workflowTemplateId", value === "none" ? "" : value, {
                  shouldDirty: true,
                })
              }
              disabled={isLoadingTemplates}>
              <SelectTrigger>
                <SelectValue
                  placeholder={
                    isLoadingTemplates
                      ? "Memuat template..."
                      : "Pilih workflow template"
                  }
                />
              </SelectTrigger>

              <SelectContent>
                <SelectItem value="none">Tanpa Workflow Template</SelectItem>

                {templates.map((template) => (
                  <SelectItem key={template.id} value={template.id}>
                    {template.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="flex items-center gap-3 rounded-lg border p-3">
            <Checkbox
              id={`isActive-${item.id}`}
              checked={isActive}
              onCheckedChange={(checked) =>
                setValue("isActive", checked === true, {
                  shouldDirty: true,
                })
              }
            />

            <div>
              <Label htmlFor={`isActive-${item.id}`} className="cursor-pointer">
                Service Aktif
              </Label>

              <p className="text-xs text-muted-foreground">
                Service aktif dapat digunakan pada project.
              </p>
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
