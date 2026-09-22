"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { Loader2, Plus } from "lucide-react";
import { useState } from "react";
import { useForm, useWatch } from "react-hook-form";
import { toast } from "sonner";

import {
  CreateActivityPayload,
  activityService,
} from "@/app/services/crm/activity.service";
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
import { Textarea } from "@/components/ui/textarea";

import {
  CreateActivityFormValues,
  createActivitySchema,
} from "./activity-form-schema";

interface CreateActivityModalProps {
  leadId: string;
  onSuccess?: () => void | Promise<void>;
}

function getCurrentDateTimeLocal() {
  const now = new Date();
  const offset = now.getTimezoneOffset();

  return new Date(now.getTime() - offset * 60_000).toISOString().slice(0, 16);
}

export function CreateActivityModal({
  leadId,
  onSuccess,
}: CreateActivityModalProps) {
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);

  const {
    register,
    handleSubmit,
    setValue,
    control,
    reset,
    formState: { errors },
  } = useForm<CreateActivityFormValues>({
    resolver: zodResolver(createActivitySchema),
    defaultValues: {
      type: "CALL",
      subject: "",
      description: "",
      result: "",
      activityDate: getCurrentDateTimeLocal(),
      nextFollowUp: "",
      status: "COMPLETED",
    },
  });

  const selectedType = useWatch({
    control,
    name: "type",
  });

  const selectedStatus = useWatch({
    control,
    name: "status",
  });

  const handleOpenChange = (value: boolean) => {
    setOpen(value);

    if (!value) {
      reset({
        type: "CALL",
        subject: "",
        description: "",
        result: "",
        activityDate: getCurrentDateTimeLocal(),
        nextFollowUp: "",
        status: "COMPLETED",
      });
    }
  };

  const onSubmit = async (values: CreateActivityFormValues) => {
    try {
      setLoading(true);

      const payload: CreateActivityPayload = {
        leadId,
        type: values.type,
        subject: values.subject.trim(),
        description: values.description.trim(),
        activityDate: new Date(values.activityDate).toISOString(),
        status: values.status,
        ...(values.result?.trim() && {
          result: values.result.trim(),
        }),
        ...(values.nextFollowUp && {
          nextFollowUp: new Date(values.nextFollowUp).toISOString(),
        }),
      };

      await activityService.create(payload);

      toast.success("Activity berhasil dibuat", {
        description: "Aktivitas lead berhasil ditambahkan.",
      });

      handleOpenChange(false);

      await onSuccess?.();
    } catch (error) {
      toast.error("Gagal membuat activity", {
        description:
          error instanceof Error
            ? error.message
            : "Terjadi kesalahan pada server.",
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
            <Plus className="size-4" />
            Tambah Activity
          </Button>
        }
      />

      <DialogContent className="max-h-[90vh] overflow-y-auto sm:max-w-2xl">
        <DialogHeader>
          <DialogTitle>Tambah Activity</DialogTitle>

          <DialogDescription>
            Catat komunikasi, meeting, follow-up, atau aktivitas lain terhadap
            lead.
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit(onSubmit)} className="space-y-6 pt-2">
          <div className="grid gap-4 sm:grid-cols-2">
            <div className="space-y-2">
              <Label>Activity Type</Label>

              <Select
                value={selectedType}
                disabled={loading}
                onValueChange={(value) =>
                  setValue("type", value as CreateActivityFormValues["type"], {
                    shouldValidate: true,
                    shouldDirty: true,
                  })
                }>
                <SelectTrigger className="w-full">
                  <SelectValue placeholder="Pilih tipe activity" />
                </SelectTrigger>

                <SelectContent>
                  <SelectItem value="CALL">Call</SelectItem>

                  <SelectItem value="WHATSAPP">WhatsApp</SelectItem>

                  <SelectItem value="EMAIL">Email</SelectItem>

                  <SelectItem value="MEETING">Meeting</SelectItem>

                  <SelectItem value="VISIT">Visit</SelectItem>

                  <SelectItem value="NOTE">Note</SelectItem>
                </SelectContent>
              </Select>

              {errors.type && (
                <p className="text-xs text-destructive">
                  {errors.type.message}
                </p>
              )}
            </div>

            <div className="space-y-2">
              <Label>Status</Label>

              <Select
                value={selectedStatus}
                disabled={loading}
                onValueChange={(value) =>
                  setValue(
                    "status",
                    value as CreateActivityFormValues["status"],
                    {
                      shouldValidate: true,
                      shouldDirty: true,
                    },
                  )
                }>
                <SelectTrigger className="w-full">
                  <SelectValue placeholder="Pilih status" />
                </SelectTrigger>

                <SelectContent>
                  <SelectItem value="SCHEDULED">Scheduled</SelectItem>

                  <SelectItem value="COMPLETED">Completed</SelectItem>

                  <SelectItem value="CANCELLED">Cancelled</SelectItem>
                </SelectContent>
              </Select>

              {errors.status && (
                <p className="text-xs text-destructive">
                  {errors.status.message}
                </p>
              )}
            </div>

            <div className="space-y-2 sm:col-span-2">
              <Label htmlFor="subject">Subject</Label>

              <Input
                id="subject"
                placeholder="Contoh: Follow up proposal"
                disabled={loading}
                {...register("subject")}
              />

              {errors.subject && (
                <p className="text-xs text-destructive">
                  {errors.subject.message}
                </p>
              )}
            </div>

            <div className="space-y-2 sm:col-span-2">
              <Label htmlFor="description">Description</Label>

              <Textarea
                id="description"
                rows={4}
                placeholder="Jelaskan aktivitas yang dilakukan..."
                disabled={loading}
                {...register("description")}
              />

              {errors.description && (
                <p className="text-xs text-destructive">
                  {errors.description.message}
                </p>
              )}
            </div>

            <div className="space-y-2">
              <Label htmlFor="activityDate">Activity Date</Label>

              <Input
                id="activityDate"
                type="datetime-local"
                disabled={loading}
                {...register("activityDate")}
              />

              {errors.activityDate && (
                <p className="text-xs text-destructive">
                  {errors.activityDate.message}
                </p>
              )}
            </div>

            <div className="space-y-2">
              <Label htmlFor="nextFollowUp">Next Follow Up</Label>

              <Input
                id="nextFollowUp"
                type="datetime-local"
                disabled={loading}
                {...register("nextFollowUp")}
              />

              {errors.nextFollowUp && (
                <p className="text-xs text-destructive">
                  {errors.nextFollowUp.message}
                </p>
              )}
            </div>

            <div className="space-y-2 sm:col-span-2">
              <Label htmlFor="result">Result</Label>

              <Textarea
                id="result"
                rows={3}
                placeholder="Hasil aktivitas, respon client, keputusan, dll."
                disabled={loading}
                {...register("result")}
              />

              {errors.result && (
                <p className="text-xs text-destructive">
                  {errors.result.message}
                </p>
              )}
            </div>
          </div>

          <DialogFooter className="pt-4">
            <Button
              type="button"
              variant="outline"
              disabled={loading}
              onClick={() => handleOpenChange(false)}>
              Batal
            </Button>

            <Button type="submit" disabled={loading}>
              {loading && <Loader2 className="mr-2 size-4 animate-spin" />}
              Simpan Activity
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
