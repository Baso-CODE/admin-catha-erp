"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { Loader2, Plus } from "lucide-react";
import { useState } from "react";
import { useForm } from "react-hook-form";
import { toast } from "sonner";
import { z } from "zod";

import { roleService } from "@/app/services/role.service";
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
import { Switch } from "@/components/ui/switch";
import { Textarea } from "@/components/ui/textarea";

const schema = z.object({
  code: z
    .string()
    .trim()
    .min(2, "Code role minimal 2 karakter.")
    .max(50)
    .regex(/^[A-Z][A-Z0-9_]*$/, "Gunakan uppercase, angka, dan underscore."),
  name: z.string().trim().min(2, "Nama role minimal 2 karakter.").max(100),
  description: z.string().trim().max(500).optional(),
  isActive: z.boolean(),
});

type FormValues = z.infer<typeof schema>;

interface CreateRoleModalProps {
  onSuccess?: () => void | Promise<void>;
}

export function CreateRoleModal({ onSuccess }: CreateRoleModalProps) {
  const [open, setOpen] = useState(false);

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
      isActive: true,
    },
  });

  const isActive = watch("isActive");

  const handleOpenChange = (value: boolean) => {
    setOpen(value);

    if (!value) {
      reset();
    }
  };

  const onSubmit = async (values: FormValues) => {
    try {
      await roleService.createRole({
        code: values.code.trim(),
        name: values.name.trim(),
        description: values.description?.trim() || undefined,
        isActive: values.isActive,
      });

      toast.success("Role berhasil dibuat.");

      handleOpenChange(false);

      await onSuccess?.();
    } catch (error) {
      toast.error("Gagal membuat role.", {
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
          Tambah Role
        </Button>
      </DialogTrigger>

      <DialogContent className="sm:max-w-lg">
        <DialogHeader>
          <DialogTitle>Tambah Role</DialogTitle>

          <DialogDescription>
            Buat role baru untuk kebutuhan akses pengguna.
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit(onSubmit)} className="space-y-5">
          <div className="space-y-2">
            <Label htmlFor="role-code">Code</Label>

            <Input
              id="role-code"
              placeholder="SEO_SPECIALIST"
              {...register("code")}
              onChange={(event) =>
                setValue(
                  "code",
                  event.target.value.toUpperCase().replace(/\s+/g, "_"),
                  {
                    shouldValidate: true,
                  },
                )
              }
            />

            {errors.code && (
              <p className="text-xs text-destructive">{errors.code.message}</p>
            )}
          </div>

          <div className="space-y-2">
            <Label htmlFor="role-name">Nama Role</Label>

            <Input
              id="role-name"
              placeholder="SEO Specialist"
              {...register("name")}
            />

            {errors.name && (
              <p className="text-xs text-destructive">{errors.name.message}</p>
            )}
          </div>

          <div className="space-y-2">
            <Label htmlFor="role-description">Deskripsi</Label>

            <Textarea
              id="role-description"
              rows={4}
              placeholder="Deskripsi tanggung jawab role..."
              {...register("description")}
            />
          </div>

          <div className="flex items-center justify-between rounded-lg border p-4">
            <div>
              <Label>Role Aktif</Label>

              <p className="text-xs text-muted-foreground">
                Role aktif dapat diberikan ke user.
              </p>
            </div>

            <Switch
              checked={isActive}
              onCheckedChange={(checked) =>
                setValue("isActive", checked, {
                  shouldDirty: true,
                })
              }
              className="data-[state=checked]:bg-emerald-500 data-[state=unchecked]:bg-slate-300"
            />
          </div>

          <DialogFooter>
            <Button
              type="button"
              variant="outline"
              disabled={isSubmitting}
              onClick={() => handleOpenChange(false)}>
              Batal
            </Button>

            <Button type="submit" disabled={isSubmitting}>
              {isSubmitting && <Loader2 className="size-4 animate-spin" />}
              Simpan Role
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
