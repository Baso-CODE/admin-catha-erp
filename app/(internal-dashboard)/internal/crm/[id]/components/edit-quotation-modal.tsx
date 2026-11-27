"use client";

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
import { zodResolver } from "@hookform/resolvers/zod";
import { Loader2, Pencil } from "lucide-react";
import { useEffect, useState } from "react";
import { useForm, useWatch } from "react-hook-form";
import { toast } from "sonner";

import {
  UpdateQuotationFormValues,
  updateQuotationSchema,
} from "./quotation-form-schema";
import { QuotationServicePicker } from "./quotation-service-picker";
import { QuotationServiceSummary } from "./quotation-service-summary";

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
  const [selectedServiceIds, setSelectedServiceIds] = useState<string[]>([]);

  const [servicesReady, setServicesReady] = useState(false);

  const canEditContent =
    quotation.status === "DRAFT" && (quotation._count?.contracts ?? 0) === 0;
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

    setSelectedServiceIds(
      quotation.serviceItems?.map((item) => item.masterServiceId) ?? [],
    );

    setServicesReady(false);
  }, [open, quotation, reset]);

  const onSubmit = async (values: UpdateQuotationFormValues) => {
    if (canEditContent && !servicesReady) {
      toast.error("Katalog layanan belum berhasil dimuat.");
      return;
    }

    try {
      setLoading(true);

      const payload: UpdateQuotationPayload = {
        status: values.status,

        ...(canEditContent && {
          amount: values.amount,
          masterServiceIds: selectedServiceIds,
        }),
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
      <DialogTrigger asChild>
        <Button variant="ghost" size="sm" className="w-full justify-start">
          <Pencil className="mr-2 size-4" />
          Edit Quotation
        </Button>
      </DialogTrigger>

      <DialogContent className="max-h-[90vh] overflow-y-auto sm:max-w-2xl">
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

          {canEditContent ? (
            <QuotationServicePicker
              open={open}
              quotationId={quotation.id}
              existingItems={quotation.serviceItems}
              value={selectedServiceIds}
              onChange={setSelectedServiceIds}
              onReady={setServicesReady}
              disabled={loading}
            />
          ) : (
            <div className="space-y-3">
              <Label>Layanan yang Ditawarkan</Label>

              <QuotationServiceSummary items={quotation.serviceItems ?? []} />

              <p className="rounded-lg border bg-muted/40 p-3 text-xs text-muted-foreground">
                Nominal dan layanan tidak dapat diubah setelah quotation
                diproses atau terhubung dengan contract.
              </p>
            </div>
          )}
          <div className="space-y-2">
            <Label htmlFor={`quotation-amount-${quotation.id}`}>Amount</Label>
            <Input
              id={`quotation-amount-${quotation.id}`}
              type="number"
              min={0}
              step={0.01}
              readOnly={!canEditContent || loading}
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
                {quotation.status === "DRAFT" && (
                  <SelectItem value="DRAFT">Draft</SelectItem>
                )}
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

            <Button
              type="submit"
              disabled={loading || (canEditContent && !servicesReady)}>
              {loading && <Loader2 className="mr-2 size-4 animate-spin" />}
              Simpan Perubahan
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
