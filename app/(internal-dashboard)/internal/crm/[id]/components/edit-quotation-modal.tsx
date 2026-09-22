"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { Loader2, Pencil } from "lucide-react";
import { useEffect, useState } from "react";
import { useForm, useWatch } from "react-hook-form";
import { toast } from "sonner";

import {
  QuotationItem,
  UpdateQuotationPayload,
  quotationService,
} from "@/app/services/crm/quotation.service";
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

import {
  UpdateQuotationFormValues,
  updateQuotationSchema,
} from "./quotation-form-schema";

interface EditQuotationModalProps {
  quotation: QuotationItem;
  onSuccess?: () => void | Promise<void>;
}

function getDefaultValues(quotation: QuotationItem): UpdateQuotationFormValues {
  return {
    amount: Number(quotation.amount),
    status: quotation.status as UpdateQuotationFormValues["status"],
  };
}

export function EditQuotationModal({
  quotation,
  onSuccess,
}: EditQuotationModalProps) {
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);

  const {
    register,
    handleSubmit,
    setValue,
    control,
    reset,
    formState: { errors },
  } = useForm<UpdateQuotationFormValues>({
    resolver: zodResolver(updateQuotationSchema),
    defaultValues: getDefaultValues(quotation),
  });

  const selectedStatus = useWatch({
    control,
    name: "status",
  });

  useEffect(() => {
    if (!open) return;
    reset(getDefaultValues(quotation));
  }, [open, quotation, reset]);

  const onSubmit = async (values: UpdateQuotationFormValues) => {
    try {
      setLoading(true);

      const payload: UpdateQuotationPayload = {
        amount: values.amount,
        status: values.status,
      };

      const response = await quotationService.update(quotation.id, payload);

      toast.success("Quotation berhasil diperbarui", {
        description: response.data.quotationNo,
      });

      setOpen(false);

      await onSuccess?.();
    } catch (error) {
      toast.error("Gagal memperbarui quotation", {
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
          <Button variant="ghost" size="sm" className="w-full justify-start">
            <Pencil className="mr-2 size-4" />
            Edit Quotation
          </Button>
        }
      />

      <DialogContent className="sm:max-w-lg">
        <DialogHeader>
          <DialogTitle>Edit Quotation</DialogTitle>

          <DialogDescription>
            Perbarui nilai dan status quotation.
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit(onSubmit)} className="space-y-5 pt-2">
          <div className="rounded-lg border bg-muted/30 p-4">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <p className="text-xs text-muted-foreground">Quotation No</p>

                <p className="mt-1 text-sm font-medium">
                  {quotation.quotationNo}
                </p>
              </div>

              <div>
                <p className="text-xs text-muted-foreground">Version</p>

                <p className="mt-1 text-sm font-medium">{quotation.version}</p>
              </div>
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor={`quotation-amount-${quotation.id}`}>Amount</Label>

            <Input
              id={`quotation-amount-${quotation.id}`}
              type="number"
              min={0}
              step={1000}
              disabled={loading}
              {...register("amount", {
                setValueAs: (value) => (value === "" ? 0 : Number(value)),
              })}
            />

            {errors.amount && (
              <p className="text-xs text-destructive">
                {errors.amount.message}
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
                  value as UpdateQuotationFormValues["status"],
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
                <SelectItem value="DRAFT">Draft</SelectItem>
                <SelectItem value="SENT">Sent</SelectItem>
                <SelectItem value="APPROVED">Approved</SelectItem>
                <SelectItem value="REJECTED">Rejected</SelectItem>
                <SelectItem value="EXPIRED">Expired</SelectItem>
                <SelectItem value="WITHDRAWN">Withdrawn</SelectItem>
              </SelectContent>
            </Select>

            {errors.status && (
              <p className="text-xs text-destructive">
                {errors.status.message}
              </p>
            )}
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
