"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { Eye, EyeOff, Loader2, LockKeyhole } from "lucide-react";
import { useState } from "react";
import { useForm } from "react-hook-form";
import { toast } from "sonner";
import * as z from "zod";

import { clientPortalService } from "@/app/services/client-portal.service";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

const changePasswordSchema = z
  .object({
    currentPassword: z.string().min(1, {
      message: "Password saat ini wajib diisi.",
    }),
    newPassword: z.string().min(8, {
      message: "Password baru minimal 8 karakter.",
    }),
    confirmPassword: z.string().min(1, {
      message: "Konfirmasi password wajib diisi.",
    }),
  })
  .refine((data) => data.newPassword === data.confirmPassword, {
    message: "Konfirmasi password tidak sesuai.",
    path: ["confirmPassword"],
  })
  .refine((data) => data.currentPassword !== data.newPassword, {
    message: "Password baru tidak boleh sama dengan password saat ini.",
    path: ["newPassword"],
  });

type ChangePasswordFormValues = z.infer<typeof changePasswordSchema>;

export function ChangePasswordForm() {
  const [loading, setLoading] = useState(false);
  const [showCurrentPassword, setShowCurrentPassword] = useState(false);
  const [showNewPassword, setShowNewPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors },
  } = useForm<ChangePasswordFormValues>({
    resolver: zodResolver(changePasswordSchema),
    defaultValues: {
      currentPassword: "",
      newPassword: "",
      confirmPassword: "",
    },
  });

  const onSubmit = async (values: ChangePasswordFormValues) => {
    try {
      setLoading(true);

      const response = await clientPortalService.changePassword({
        currentPassword: values.currentPassword,
        newPassword: values.newPassword,
      });

      if (response.success) {
        toast.success("Password berhasil diperbarui", {
          description: "Gunakan password baru untuk login berikutnya.",
        });

        reset();
      }
    } catch (error) {
      toast.error("Gagal memperbarui password", {
        description:
          error instanceof Error
            ? error.message
            : "Terjadi kesalahan saat memperbarui password.",
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center gap-3">
          <div className="flex size-10 items-center justify-center rounded-lg bg-muted">
            <LockKeyhole className="size-5" />
          </div>

          <div>
            <CardTitle>Ubah Password</CardTitle>
            <CardDescription>
              Perbarui password akun Client Portal Anda.
            </CardDescription>
          </div>
        </div>
      </CardHeader>

      <CardContent>
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-5">
          <div className="space-y-2">
            <Label htmlFor="currentPassword">Password Saat Ini</Label>

            <div className="relative">
              <Input
                id="currentPassword"
                type={showCurrentPassword ? "text" : "password"}
                autoComplete="current-password"
                disabled={loading}
                className="pr-10"
                {...register("currentPassword")}
              />

              <Button
                type="button"
                variant="ghost"
                size="icon"
                disabled={loading}
                className="absolute right-0 top-0 h-full"
                onClick={() => setShowCurrentPassword((current) => !current)}>
                {showCurrentPassword ? (
                  <EyeOff className="size-4" />
                ) : (
                  <Eye className="size-4" />
                )}
              </Button>
            </div>

            {errors.currentPassword && (
              <p className="text-xs text-destructive">
                {errors.currentPassword.message}
              </p>
            )}
          </div>

          <div className="space-y-2">
            <Label htmlFor="newPassword">Password Baru</Label>

            <div className="relative">
              <Input
                id="newPassword"
                type={showNewPassword ? "text" : "password"}
                autoComplete="new-password"
                disabled={loading}
                className="pr-10"
                {...register("newPassword")}
              />

              <Button
                type="button"
                variant="ghost"
                size="icon"
                disabled={loading}
                className="absolute right-0 top-0 h-full"
                onClick={() => setShowNewPassword((current) => !current)}>
                {showNewPassword ? (
                  <EyeOff className="size-4" />
                ) : (
                  <Eye className="size-4" />
                )}
              </Button>
            </div>

            {errors.newPassword && (
              <p className="text-xs text-destructive">
                {errors.newPassword.message}
              </p>
            )}
          </div>

          <div className="space-y-2">
            <Label htmlFor="confirmPassword">Konfirmasi Password Baru</Label>

            <div className="relative">
              <Input
                id="confirmPassword"
                type={showConfirmPassword ? "text" : "password"}
                autoComplete="new-password"
                disabled={loading}
                className="pr-10"
                {...register("confirmPassword")}
              />

              <Button
                type="button"
                variant="ghost"
                size="icon"
                disabled={loading}
                className="absolute right-0 top-0 h-full"
                onClick={() => setShowConfirmPassword((current) => !current)}>
                {showConfirmPassword ? (
                  <EyeOff className="size-4" />
                ) : (
                  <Eye className="size-4" />
                )}
              </Button>
            </div>

            {errors.confirmPassword && (
              <p className="text-xs text-destructive">
                {errors.confirmPassword.message}
              </p>
            )}
          </div>

          <div className="flex justify-end">
            <Button type="submit" disabled={loading}>
              {loading && <Loader2 className="mr-2 size-4 animate-spin" />}
              Ubah Password
            </Button>
          </div>
        </form>
      </CardContent>
    </Card>
  );
}
