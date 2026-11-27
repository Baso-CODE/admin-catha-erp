"use client";

import {
  CreateQuotationPayload,
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
import { zodResolver } from "@hookform/resolvers/zod";
import { FilePlus2, Loader2 } from "lucide-react";
import { useState } from "react";
import { useForm } from "react-hook-form";
import { toast } from "sonner";

import {
  CreateQuotationFormValues,
  createQuotationSchema,
} from "./quotation-form-schema";
import { QuotationServicePicker } from "./quotation-service-picker";

interface CreateQuotationModalProps {
  leadId: string;
  onSuccess?: () => void | Promise<void>;
}

export function CreateQuotationModal({
  leadId,
  onSuccess,
}: CreateQuotationModalProps) {
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [selectedServiceIds, setSelectedServiceIds] = useState<string[]>([]);

  const [servicesReady, setServicesReady] = useState(false);
  const {
    register,
    handleSubmit,
    reset,
    formState: { errors },
  } = useForm<CreateQuotationFormValues>({
    resolver: zodResolver(createQuotationSchema),
    defaultValues: {
      amount: 0,
    },
  });

  const handleOpenChange = (value: boolean) => {
    setOpen(value);
    setSelectedServiceIds([]);
    setServicesReady(false);

    if (!value) {
      reset({
        amount: 0,
      });
    }
  };

  const onSubmit = async (values: CreateQuotationFormValues) => {
    if (!servicesReady) {
      toast.error("Katalog layanan belum berhasil dimuat.");
      return;
    }

    try {
      setLoading(true);

      const payload: CreateQuotationPayload = {
        leadId,
        amount: values.amount,
        masterServiceIds: selectedServiceIds,
      };

      const response = await quotationService.create(payload);

      toast.success("Quotation berhasil dibuat", {
        description: `${response.data.quotationNo} berhasil ditambahkan.`,
      });

      handleOpenChange(false);

      await onSuccess?.();
    } catch (error) {
      toast.error("Gagal membuat quotation", {
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
      <DialogTrigger asChild>
        <Button className="gap-2">
          <FilePlus2 className="size-4" />
          Buat Quotation
        </Button>
      </DialogTrigger>

      <DialogContent className="max-h-[90vh] overflow-y-auto sm:max-w-2xl">
        <DialogHeader>
          <DialogTitle>Buat Quotation Baru</DialogTitle>

          <DialogDescription>
            Buat quotation baru untuk lead ini.
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit(onSubmit)} className="space-y-5 pt-2">
          <QuotationServicePicker
            open={open}
            leadId={leadId}
            value={selectedServiceIds}
            onChange={setSelectedServiceIds}
            onReady={setServicesReady}
            disabled={loading}
          />

          <div className="space-y-2">
            <Label htmlFor="amount">Amount</Label>

            <Input
              id="amount"
              type="number"
              min={0}
              step={1000}
              placeholder="15000000"
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

          <div className="rounded-lg border bg-muted/30 p-4">
            <p className="text-sm font-medium">Informasi Quotation</p>

            <p className="mt-1 text-xs text-muted-foreground">
              Nomor quotation, version, dan status awal akan dibuat otomatis
              oleh sistem.
            </p>

            <div className="mt-3 grid grid-cols-2 gap-3 text-sm">
              <div>
                <p className="text-xs text-muted-foreground">Status Awal</p>

                <p className="mt-1 font-medium">Draft</p>
              </div>

              <div>
                <p className="text-xs text-muted-foreground">Version</p>

                <p className="mt-1 font-medium">1.0</p>
              </div>
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

            <Button type="submit" disabled={loading || !servicesReady}>
              {loading && <Loader2 className="mr-2 size-4 animate-spin" />}
              Simpan Quotation
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
