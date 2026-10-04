"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { Loader2, Plus, Trash2 } from "lucide-react";
import { useState } from "react";
import { useFieldArray, useForm } from "react-hook-form";
import { toast } from "sonner";
import { z } from "zod";

import { workflowTemplateService } from "@/app/services/workflowTemplate.service";
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
import { Textarea } from "@/components/ui/textarea";

const workflowStepSchema = z.object({
  key: z
    .string()
    .min(1, "Key wajib diisi.")
    .max(100, "Key maksimal 100 karakter."),
  name: z
    .string()
    .min(1, "Nama step wajib diisi.")
    .max(150, "Nama step maksimal 150 karakter."),
  order: z.coerce.number().int().min(1, "Order minimal 1."),
});

const schema = z.object({
  name: z
    .string()
    .min(2, "Nama minimal 2 karakter.")
    .max(150, "Nama maksimal 150 karakter."),
  description: z
    .string()
    .max(500, "Deskripsi maksimal 500 karakter.")
    .optional(),
  steps: z
    .array(workflowStepSchema)
    .min(1, "Minimal harus memiliki 1 workflow step."),
});

type FormValues = z.infer<typeof schema>;

interface CreateWorkflowTemplateModalProps {
  onSuccess?: () => void | Promise<void>;
}

export function CreateWorkflowTemplateModal({
  onSuccess,
}: CreateWorkflowTemplateModalProps) {
  const [open, setOpen] = useState(false);

  const {
    register,
    control,
    handleSubmit,
    reset,
    formState: { errors, isSubmitting },
  } = useForm<FormValues>({
    resolver: zodResolver(schema),
    defaultValues: {
      name: "",
      description: "",
      steps: [
        {
          key: "brief",
          name: "Brief",
          order: 1,
        },
      ],
    },
  });

  const { fields, append, remove } = useFieldArray({
    control,
    name: "steps",
  });

  const handleOpenChange = (value: boolean) => {
    setOpen(value);

    if (!value) {
      reset();
    }
  };

  const addStep = () => {
    append({
      key: "",
      name: "",
      order: fields.length + 1,
    });
  };

  const onSubmit = async (values: FormValues) => {
    try {
      const steps = values.steps.map((step) => ({
        key: step.key.trim(),
        name: step.name.trim(),
        order: step.order,
      }));

      await workflowTemplateService.create({
        name: values.name.trim(),
        description: values.description?.trim() || undefined,
        steps,
      });

      toast.success("Workflow template berhasil dibuat.");

      setOpen(false);
      reset();

      await onSuccess?.();
    } catch (error) {
      toast.error("Gagal membuat workflow template.", {
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
          Tambah Workflow
        </Button>
      </DialogTrigger>

      <DialogContent className="max-h-[90vh] overflow-y-auto sm:max-w-2xl">
        <DialogHeader>
          <DialogTitle>Tambah Workflow Template</DialogTitle>
          <DialogDescription>
            Buat template alur kerja yang nantinya dapat digunakan oleh master
            service.
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
          <div className="space-y-2">
            <Label htmlFor="workflow-name">Nama Workflow</Label>

            <Input
              id="workflow-name"
              placeholder="Google Ads Standard Workflow"
              {...register("name")}
            />

            {errors.name && (
              <p className="text-xs text-destructive">{errors.name.message}</p>
            )}
          </div>

          <div className="space-y-2">
            <Label htmlFor="workflow-description">Deskripsi</Label>

            <Textarea
              id="workflow-description"
              placeholder="Workflow standar untuk pengerjaan Google Ads..."
              rows={3}
              {...register("description")}
            />

            {errors.description && (
              <p className="text-xs text-destructive">
                {errors.description.message}
              </p>
            )}
          </div>

          <div className="space-y-4">
            <div className="flex items-center justify-between gap-4">
              <div>
                <Label>Workflow Steps</Label>
                <p className="text-xs text-muted-foreground">
                  Tentukan urutan proses workflow dari awal sampai selesai.
                </p>
              </div>

              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={addStep}>
                <Plus className="size-4" />
                Tambah Step
              </Button>
            </div>

            <div className="space-y-3">
              {fields.map((field, index) => (
                <div key={field.id} className="rounded-xl border p-4">
                  <div className="mb-4 flex items-center justify-between">
                    <p className="text-sm font-medium">Step {index + 1}</p>

                    {fields.length > 1 && (
                      <Button
                        type="button"
                        variant="ghost"
                        size="icon"
                        onClick={() => remove(index)}
                        className="text-destructive hover:text-destructive">
                        <Trash2 className="size-4" />
                      </Button>
                    )}
                  </div>

                  <div className="grid gap-4 sm:grid-cols-[1fr_1fr_100px]">
                    <div className="space-y-2">
                      <Label htmlFor={`steps-${index}-key`}>Key</Label>

                      <Input
                        id={`steps-${index}-key`}
                        placeholder="brief"
                        {...register(`steps.${index}.key`)}
                      />

                      {errors.steps?.[index]?.key && (
                        <p className="text-xs text-destructive">
                          {errors.steps[index]?.key?.message}
                        </p>
                      )}
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor={`steps-${index}-name`}>Nama Step</Label>

                      <Input
                        id={`steps-${index}-name`}
                        placeholder="Brief"
                        {...register(`steps.${index}.name`)}
                      />

                      {errors.steps?.[index]?.name && (
                        <p className="text-xs text-destructive">
                          {errors.steps[index]?.name?.message}
                        </p>
                      )}
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor={`steps-${index}-order`}>Order</Label>

                      <Input
                        id={`steps-${index}-order`}
                        type="number"
                        min={1}
                        {...register(`steps.${index}.order`)}
                      />

                      {errors.steps?.[index]?.order && (
                        <p className="text-xs text-destructive">
                          {errors.steps[index]?.order?.message}
                        </p>
                      )}
                    </div>
                  </div>
                </div>
              ))}
            </div>

            {errors.steps?.root && (
              <p className="text-xs text-destructive">
                {errors.steps.root.message}
              </p>
            )}
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
              Simpan Workflow
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
