"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { Loader2 } from "lucide-react";
import { ReactNode, useEffect, useState } from "react";
import { Controller, useForm } from "react-hook-form";
import { toast } from "sonner";
import { z } from "zod";

import { RoleItem, roleService } from "@/app/services/role.service";
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
  name: z.string().trim().min(2).max(100),
  description: z.string().trim().max(500).optional(),
  isActive: z.boolean(),
});

type FormValues = z.infer<typeof schema>;

interface EditRoleModalProps {
  role: RoleItem;
  trigger: ReactNode;
  onSuccess?: () => void | Promise<void>;
}

export function EditRoleModal({
  role,
  trigger,
  onSuccess,
}: EditRoleModalProps) {
  const [open, setOpen] = useState(false);

  const {
    register,
    handleSubmit,
    control,
    reset,
    formState: { errors, isSubmitting },
  } = useForm<FormValues>({
    resolver: zodResolver(schema),
    defaultValues: {
      name: role.name,
      description: role.description ?? "",
      isActive: role.isActive,
    },
  });

  useEffect(() => {
    if (!open) return;

    reset({
      name: role.name,
      description: role.description ?? "",
      isActive: role.isActive,
    });
  }, [open, role, reset]);

  const onSubmit = async (values: FormValues) => {
    try {
      await roleService.updateRole(role.id, {
        name: values.name.trim(),
        description: values.description?.trim() || "",
        isActive: values.isActive,
      });

      toast.success("Role berhasil diperbarui.");

      setOpen(false);

      await onSuccess?.();
    } catch (error) {
      toast.error("Gagal memperbarui role.", {
        description:
          error instanceof Error
            ? error.message
            : "Terjadi kesalahan pada server.",
      });
    }
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>{trigger}</DialogTrigger>

      <DialogContent className="sm:max-w-lg">
        <DialogHeader>
          <DialogTitle>Edit Role</DialogTitle>

          <DialogDescription>Perbarui data role.</DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit(onSubmit)} className="space-y-5">
          <div className="space-y-2">
            <Label>Code</Label>

            <Input value={role.code} disabled />

            <p className="text-xs text-muted-foreground">
              Code role tidak dapat diubah setelah dibuat.
            </p>
          </div>

          <div className="space-y-2">
            <Label htmlFor={`role-name-${role.id}`}>Nama Role</Label>

            <Input id={`role-name-${role.id}`} {...register("name")} />

            {errors.name && (
              <p className="text-xs text-destructive">{errors.name.message}</p>
            )}
          </div>

          <div className="space-y-2">
            <Label>Deskripsi</Label>

            <Textarea rows={4} {...register("description")} />
          </div>

          <Controller
            name="isActive"
            control={control}
            render={({ field }) => (
              <div className="flex items-center justify-between gap-4 rounded-lg border p-4">
                <div className="min-w-0 space-y-1">
                  <Label htmlFor={`role-active-${role.id}`}>
                    {field.value ? "Role Aktif" : "Role Nonaktif"}
                  </Label>

                  <p
                    id={`role-status-description-${role.id}`}
                    className="text-xs text-muted-foreground">
                    {role.code === "OWNER"
                      ? "Role OWNER tidak dapat dinonaktifkan."
                      : field.value
                        ? "Role dapat memberikan hak akses kepada pengguna."
                        : "Hak akses dari role ini dinonaktifkan."}
                  </p>
                </div>

                <Switch
                  id={`role-active-${role.id}`}
                  checked={field.value === true}
                  onCheckedChange={field.onChange}
                  onBlur={field.onBlur}
                  ref={field.ref}
                  disabled={role.code === "OWNER" || isSubmitting}
                  aria-describedby={`role-status-description-${role.id}`}
                />
              </div>
            )}
          />

          <DialogFooter>
            <Button
              type="button"
              variant="outline"
              disabled={isSubmitting}
              onClick={() => setOpen(false)}>
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
