"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { Loader2, UserPlus } from "lucide-react";
import { useEffect, useState } from "react";
import { useForm, useWatch } from "react-hook-form";
import { toast } from "sonner";
import * as z from "zod";

import {
  CreateUserPayload,
  RoleItem,
  userService,
} from "@/app/services/userManagement.service";
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

const createUserSchema = z.object({
  name: z.string().trim().min(1, {
    message: "Nama wajib diisi",
  }),

  email: z.string().trim().email({
    message: "Format email tidak valid",
  }),

  password: z.string().min(8, {
    message: "Password minimal 8 karakter",
  }),

  roleId: z.string().min(1, {
    message: "Role wajib dipilih",
  }),
});

type CreateUserFormValues = z.infer<typeof createUserSchema>;

interface CreateUserModalProps {
  onSuccess?: () => void | Promise<void>;
}

export function CreateUserModal({ onSuccess }: CreateUserModalProps) {
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [loadingRoles, setLoadingRoles] = useState(false);
  const [roles, setRoles] = useState<RoleItem[]>([]);

  const {
    register,
    handleSubmit,
    setValue,
    control,
    reset,
    formState: { errors },
  } = useForm<CreateUserFormValues>({
    resolver: zodResolver(createUserSchema),
    defaultValues: {
      name: "",
      email: "",
      password: "",
      roleId: "",
    },
  });

  const selectedRoleId = useWatch({
    control,
    name: "roleId",
  });

  useEffect(() => {
    if (!open) return;

    async function loadRoles() {
      try {
        setLoadingRoles(true);

        const response = await userService.getRoles();

        if (response.success) {
          setRoles(response.data);
        }
      } catch (error) {
        toast.error("Gagal memuat role", {
          description:
            error instanceof Error
              ? error.message
              : "Terjadi kesalahan pada server.",
        });
      } finally {
        setLoadingRoles(false);
      }
    }

    void loadRoles();
  }, [open]);

  const handleOpenChange = (value: boolean) => {
    setOpen(value);

    if (!value) {
      reset({
        name: "",
        email: "",
        password: "",
        roleId: "",
      });
    }
  };

  const onSubmit = async (values: CreateUserFormValues) => {
    try {
      setLoading(true);

      const payload: CreateUserPayload = {
        name: values.name.trim(),
        email: values.email.trim(),
        password: values.password,
        roleIds: [values.roleId],
        isActive: true,
      };

      const response = await userService.createUser(payload);

      if (response.success) {
        toast.success("Berhasil", {
          description: "Pengguna baru berhasil ditambahkan ke sistem.",
        });

        handleOpenChange(false);

        await onSuccess?.();
      }
    } catch (error) {
      toast.error("Gagal", {
        description:
          error instanceof Error
            ? error.message
            : "Terjadi kesalahan saat membuat pengguna.",
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogTrigger
        render={
          <Button className="gap-2">
            <UserPlus className="size-4" />
            <span>Tambah Pengguna</span>
          </Button>
        }
      />

      <DialogContent className="sm:max-w-120">
        <DialogHeader>
          <DialogTitle>Tambah Pengguna Internal</DialogTitle>

          <DialogDescription>
            Buat akun baru untuk staf agensi dan tentukan hak akses rolenya.
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4 pt-2">
          <div className="space-y-2">
            <Label htmlFor="name">Nama Lengkap</Label>

            <Input
              id="name"
              placeholder="cth. Budi Santoso"
              disabled={loading}
              {...register("name")}
            />

            {errors.name && (
              <p className="text-xs text-destructive">{errors.name.message}</p>
            )}
          </div>

          <div className="space-y-2">
            <Label htmlFor="email">Email Kantor</Label>

            <Input
              id="email"
              type="email"
              placeholder="budi@catha.co.id"
              disabled={loading}
              {...register("email")}
            />

            {errors.email && (
              <p className="text-xs text-destructive">{errors.email.message}</p>
            )}
          </div>

          <div className="space-y-2">
            <Label htmlFor="password">Password Sementara</Label>

            <Input
              id="password"
              type="password"
              placeholder="Minimal 8 karakter"
              disabled={loading}
              {...register("password")}
            />

            {errors.password && (
              <p className="text-xs text-destructive">
                {errors.password.message}
              </p>
            )}
          </div>

          <div className="space-y-2">
            <Label>Role Akses</Label>

            <Select
              value={selectedRoleId}
              disabled={loading || loadingRoles}
              onValueChange={(value) =>
                setValue("roleId", value ?? "", {
                  shouldValidate: true,
                  shouldDirty: true,
                })
              }>
              <SelectTrigger className="w-full">
                <SelectValue
                  placeholder={
                    loadingRoles ? "Memuat role..." : "Pilih role akses"
                  }
                />
              </SelectTrigger>

              <SelectContent>
                {roles.map((role) => (
                  <SelectItem key={role.id} value={role.id}>
                    {role.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>

            {errors.roleId && (
              <p className="text-xs text-destructive">
                {errors.roleId.message}
              </p>
            )}
          </div>

          <DialogFooter className="pt-4">
            <Button
              type="submit"
              disabled={loading || loadingRoles}
              className="w-full">
              {loading && <Loader2 className="mr-2 size-4 animate-spin" />}
              Simpan Pengguna
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
