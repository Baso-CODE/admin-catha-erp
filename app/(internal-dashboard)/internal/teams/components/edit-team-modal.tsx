"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { Loader2, Pencil } from "lucide-react";
import { ReactNode, useEffect, useState } from "react";
import { useForm } from "react-hook-form";
import { toast } from "sonner";
import { z } from "zod";

import { TeamItem, teamService } from "@/app/services/team.service";
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

interface EditTeamModalProps {
  team: TeamItem;
  trigger?: ReactNode;
  onSuccess?: () => void | Promise<void>;
}

export function EditTeamModal({
  team,
  trigger,
  onSuccess,
}: EditTeamModalProps) {
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
      name: team.name,
      description: team.description ?? "",
      isActive: team.isActive,
    },
  });

  const isActive = watch("isActive");

  useEffect(() => {
    if (!open) return;

    reset({
      name: team.name,
      description: team.description ?? "",
      isActive: team.isActive,
    });
  }, [open, team, reset]);

  const onSubmit = async (values: FormValues) => {
    try {
      await teamService.update(team.id, {
        name: values.name.trim(),
        description: values.description?.trim() || "",
        isActive: values.isActive,
      });

      toast.success("Team berhasil diperbarui.");

      setOpen(false);
      await onSuccess?.();
    } catch (error) {
      toast.error("Gagal memperbarui team.", {
        description:
          error instanceof Error
            ? error.message
            : "Terjadi kesalahan pada server.",
      });
    }
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      {trigger ? (
        <DialogTrigger asChild>{trigger}</DialogTrigger>
      ) : (
        <DialogTrigger asChild>
          <Button variant="outline" size="sm">
            <Pencil className="size-4" />
            Edit
          </Button>
        </DialogTrigger>
      )}

      <DialogContent className="sm:max-w-lg">
        <DialogHeader>
          <DialogTitle>Edit Team</DialogTitle>

          <DialogDescription>
            Perbarui informasi dan status team.
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit(onSubmit)} className="space-y-5">
          <div className="space-y-2">
            <Label htmlFor={`team-name-${team.id}`}>Nama Team</Label>

            <Input id={`team-name-${team.id}`} {...register("name")} />

            {errors.name && (
              <p className="text-xs text-destructive">{errors.name.message}</p>
            )}
          </div>

          <div className="space-y-2">
            <Label htmlFor={`team-description-${team.id}`}>Deskripsi</Label>

            <Textarea
              id={`team-description-${team.id}`}
              rows={4}
              {...register("description")}
            />
          </div>

          <div className="flex items-center justify-between rounded-lg border p-4">
            <div>
              <Label>Team Aktif</Label>

              <p className="text-xs text-muted-foreground">
                Nonaktifkan team tanpa menghapus data dan member.
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
