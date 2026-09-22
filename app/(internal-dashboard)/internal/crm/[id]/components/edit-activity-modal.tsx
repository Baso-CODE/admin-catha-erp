"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { Loader2, Pencil } from "lucide-react";
import { useEffect, useState } from "react";
import { useForm, useWatch } from "react-hook-form";
import { toast } from "sonner";

import {
  ActivityItem,
  UpdateActivityPayload,
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
  UpdateActivityFormValues,
  updateActivitySchema,
} from "./activity-form-schema";

interface EditActivityModalProps {
  activity: ActivityItem;
  onSuccess?: () => void | Promise<void>;
}

function formatDateTimeLocal(value?: string | null) {
  if (!value) return "";

  const date = new Date(value);
  const offset = date.getTimezoneOffset();

  return new Date(date.getTime() - offset * 60_000).toISOString().slice(0, 16);
}

function getDefaultValues(activity: ActivityItem): UpdateActivityFormValues {
  return {
    type: activity.type as UpdateActivityFormValues["type"],
    subject: activity.subject,
    description: activity.description,
    result: activity.result ?? "",
    activityDate: formatDateTimeLocal(activity.activityDate),
    nextFollowUp: formatDateTimeLocal(activity.nextFollowUp),
    status: activity.status as UpdateActivityFormValues["status"],
  };
}

export function EditActivityModal({
  activity,
  onSuccess,
}: EditActivityModalProps) {
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);

  const {
    register,
    handleSubmit,
    setValue,
    control,
    reset,
    formState: { errors },
  } = useForm<UpdateActivityFormValues>({
    resolver: zodResolver(updateActivitySchema),
    defaultValues: getDefaultValues(activity),
  });

  const selectedType = useWatch({
    control,
    name: "type",
  });

  const selectedStatus = useWatch({
    control,
    name: "status",
  });

  useEffect(() => {
    if (!open) return;

    reset(getDefaultValues(activity));
  }, [open, activity, reset]);

  const onSubmit = async (values: UpdateActivityFormValues) => {
    try {
      setLoading(true);

      const payload: UpdateActivityPayload = {
        type: values.type,
        subject: values.subject.trim(),
        description: values.description.trim(),
        result: values.result?.trim() || undefined,
        activityDate: new Date(values.activityDate).toISOString(),
        nextFollowUp: values.nextFollowUp
          ? new Date(values.nextFollowUp).toISOString()
          : undefined,
        status: values.status,
      };

      const response = await activityService.update(activity.id, payload);

      toast.success("Activity berhasil diperbarui", {
        description: response.data.subject,
      });

      setOpen(false);

      await onSuccess?.();
    } catch (error) {
      toast.error("Gagal memperbarui activity", {
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
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger
        render={
          <button
            type="button"
            className="flex w-full items-center gap-2 rounded-sm px-2 py-1.5 text-sm outline-none hover:bg-accent hover:text-accent-foreground">
            <Pencil className="size-4" />
            Edit Activity
          </button>
        }
      />

      <DialogContent className="max-h-[90vh] overflow-y-auto sm:max-w-2xl">
        <DialogHeader>
          <DialogTitle>Edit Activity</DialogTitle>

          <DialogDescription>
            Perbarui informasi aktivitas dan status follow-up lead.
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
                  setValue("type", value as UpdateActivityFormValues["type"], {
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
                    value as UpdateActivityFormValues["status"],
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
              <Label htmlFor={`subject-${activity.id}`}>Subject</Label>

              <Input
                id={`subject-${activity.id}`}
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
              <Label htmlFor={`description-${activity.id}`}>Description</Label>

              <Textarea
                id={`description-${activity.id}`}
                rows={4}
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
              <Label htmlFor={`activityDate-${activity.id}`}>
                Activity Date
              </Label>

              <Input
                id={`activityDate-${activity.id}`}
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
              <Label htmlFor={`nextFollowUp-${activity.id}`}>
                Next Follow Up
              </Label>

              <Input
                id={`nextFollowUp-${activity.id}`}
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
              <Label htmlFor={`result-${activity.id}`}>Result</Label>

              <Textarea
                id={`result-${activity.id}`}
                rows={3}
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
              onClick={() => setOpen(false)}>
              Batal
            </Button>

            <Button type="submit" disabled={loading}>
              {loading && <Loader2 className="mr-2 size-4 animate-spin" />}
              Simpan Perubahan
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
