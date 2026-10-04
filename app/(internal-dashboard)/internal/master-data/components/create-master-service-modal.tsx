"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { Loader2, Plus } from "lucide-react";
import { useEffect, useState } from "react";
import { useForm } from "react-hook-form";
import { toast } from "sonner";
import { z } from "zod";

import { masterServiceService } from "@/app/services/masterService.service";
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

interface CreateMasterServiceModalProps {
  onSuccess?: () => void | Promise<void>;
}

export function CreateMasterServiceModal({
  onSuccess,
}: CreateMasterServiceModalProps) {
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
      code: "",
      name: "",
      description: "",
      workflowTemplateId: "",
      isActive: true,
    },
  });

  const workflowTemplateId = watch("workflowTemplateId");
  const isActive = watch("isActive");

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

    if (!value) {
      reset();
    }
  };

  const onSubmit = async (values: FormValues) => {
    try {
      await masterServiceService.create({
        code: values.code.trim(),
        name: values.name.trim(),
        description: values.description?.trim() || undefined,
        workflowTemplateId: values.workflowTemplateId || undefined,
        isActive: values.isActive,
      });

      toast.success("Master service berhasil dibuat.");

      setOpen(false);
      reset();

      await onSuccess?.();
    } catch (error) {
      toast.error("Gagal membuat master service.", {
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
          <DialogTitle>Tambah Master Service</DialogTitle>
          <DialogDescription>
            Tambahkan layanan yang dapat digunakan pada project client.
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit(onSubmit)} className="space-y-5">
          <div className="grid gap-4 sm:grid-cols-2">
            <div className="space-y-2">
              <Label htmlFor="code">Code</Label>
              <Input id="code" placeholder="GOOGLE-ADS" {...register("code")} />
              {errors.code && (
                <p className="text-xs text-destructive">
                  {errors.code.message}
                </p>
              )}
            </div>

            <div className="space-y-2">
              <Label htmlFor="name">Nama Service</Label>
              <Input id="name" placeholder="Google Ads" {...register("name")} />
              {errors.name && (
                <p className="text-xs text-destructive">
                  {errors.name.message}
                </p>
              )}
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="description">Deskripsi</Label>
            <Textarea
              id="description"
              placeholder="Deskripsi singkat service..."
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

            <p className="text-xs text-muted-foreground">
              Template ini akan menjadi workflow default untuk service ini.
            </p>
          </div>

          <div className="flex items-center gap-3 rounded-lg border p-3">
            <Checkbox
              id="isActive"
              checked={isActive}
              onCheckedChange={(checked) =>
                setValue("isActive", checked === true, {
                  shouldDirty: true,
                })
              }
            />

            <div>
              <Label htmlFor="isActive" className="cursor-pointer">
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
              Simpan Service
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
