"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { Loader2, Plus } from "lucide-react";
import { useState } from "react";
import { useForm } from "react-hook-form";
import { toast } from "sonner";
import { z } from "zod";

import { teamService } from "@/app/services/team.service";
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
  name: z.string().trim().min(2, "Nama team minimal 2 karakter.").max(100),
  description: z.string().trim().max(500).optional(),
  isActive: z.boolean(),
});

type FormValues = z.infer<typeof schema>;

interface CreateTeamModalProps {
  onSuccess?: () => void | Promise<void>;
}

export function CreateTeamModal({ onSuccess }: CreateTeamModalProps) {
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
      await teamService.create({
        name: values.name.trim(),
        description: values.description?.trim() || undefined,
        isActive: values.isActive,
      });

      toast.success("Team berhasil dibuat.");

      handleOpenChange(false);
      await onSuccess?.();
    } catch (error) {
      toast.error("Gagal membuat team.", {
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
          Tambah Team
        </Button>
      </DialogTrigger>

      <DialogContent className="sm:max-w-lg">
        <DialogHeader>
          <DialogTitle>Tambah Team</DialogTitle>

          <DialogDescription>
            Buat team baru untuk pengelompokan staf dan akses berbasis TEAM.
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit(onSubmit)} className="space-y-5">
          <div className="space-y-2">
            <Label htmlFor="team-name">Nama Team</Label>

            <Input
              id="team-name"
              placeholder="Contoh: Performance Marketing"
              {...register("name")}
            />

            {errors.name && (
              <p className="text-xs text-destructive">{errors.name.message}</p>
            )}
          </div>

          <div className="space-y-2">
            <Label htmlFor="team-description">Deskripsi</Label>

            <Textarea
              id="team-description"
              rows={4}
              placeholder="Deskripsi dan tanggung jawab team..."
              {...register("description")}
            />

            {errors.description && (
              <p className="text-xs text-destructive">
                {errors.description.message}
              </p>
            )}
          </div>

          <div className="flex items-center justify-between rounded-lg border p-4">
            <div>
              <Label>Team Aktif</Label>

              <p className="text-xs text-muted-foreground">
                Team aktif dapat digunakan oleh AccessScope TEAM.
              </p>
            </div>
            <Switch
              checked={isActive}
              onCheckedChange={(checked) =>
                setValue("isActive", checked, {
                  shouldDirty: true,
                })
              }
              className="data-[state=checked]:bg-emerald-550 data-[state=unchecked]:bg-slate-300 [&_[data-slot=switch-thumb]]:bg-white"
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
              Simpan Team
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
