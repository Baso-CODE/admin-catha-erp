"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { Loader2, Pencil } from "lucide-react";
import { ReactNode, useEffect, useState } from "react";
import { useForm, useWatch } from "react-hook-form";
import { toast } from "sonner";
import * as z from "zod";

import {
  ContractItem,
  ContractStatus,
  UpdateContractPayload,
  contractService,
} from "@/app/services/contract.service";

import { quotationService } from "@/app/services/crm/quotation.service";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
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

const editContractSchema = z
  .object({
    title: z.string().trim().min(2, {
      message: "Judul contract minimal 2 karakter.",
    }),
    quotationId: z.string().optional(),
    contractType: z.string().trim().optional(),
    startDate: z.string().min(1, {
      message: "Start date wajib diisi.",
    }),
    endDate: z.string().min(1, {
      message: "End date wajib diisi.",
    }),
    value: z
      .string()
      .min(1, {
        message: "Nilai contract wajib diisi.",
      })
      .refine((value) => !Number.isNaN(Number(value)) && Number(value) >= 0, {
        message: "Nilai contract harus berupa angka.",
      }),
    currency: z.string().trim().min(1),
    paymentTerm: z.string().trim().optional(),
    slaTerms: z.string().trim().optional(),
    termsConditions: z.string().trim().optional(),
    documentUrl: z
      .string()
      .trim()
      .refine((value) => !value || z.string().url().safeParse(value).success, {
        message: "Document URL harus berupa URL valid.",
      })
      .optional(),
    status: z.enum(["DRAFT", "ACTIVE", "EXPIRED", "TERMINATED"]),
    renewalReminder: z.boolean(),
  })
  .refine(
    (values) =>
      !values.startDate ||
      !values.endDate ||
      new Date(values.endDate) > new Date(values.startDate),
    {
      message: "End date harus lebih besar dari start date.",
      path: ["endDate"],
    },
  );

type EditContractFormValues = z.infer<typeof editContractSchema>;

interface QuotationOption {
  id: string;
  quotationNo: string;
  amount: string | number;
  status: string;
}

interface EditContractModalProps {
  contract: ContractItem;
  sourceLeadId?: string | null;
  onSuccess?: () => void | Promise<void>;
  trigger?: ReactNode;
}

export function EditContractModal({
  contract,
  sourceLeadId,
  onSuccess,
  trigger,
}: EditContractModalProps) {
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [loadingQuotations, setLoadingQuotations] = useState(false);
  const [quotations, setQuotations] = useState<QuotationOption[]>([]);

  const {
    register,
    handleSubmit,
    setValue,
    control,
    reset,
    formState: { errors },
  } = useForm<EditContractFormValues>({
    resolver: zodResolver(editContractSchema),
    defaultValues: {
      title: contract.title,
      quotationId: contract.quotationId ?? "",
      contractType: contract.contractType ?? "",
      startDate: contract.startDate.slice(0, 10),
      endDate: contract.endDate.slice(0, 10),
      value: String(contract.value),
      currency: contract.currency,
      paymentTerm: contract.paymentTerm ?? "",
      slaTerms: contract.slaTerms ?? "",
      termsConditions: contract.termsConditions ?? "",
      documentUrl: contract.documentUrl ?? "",
      status: contract.status,
      renewalReminder: contract.renewalReminder,
    },
  });

  const quotationId = useWatch({
    control,
    name: "quotationId",
  });

  const status = useWatch({
    control,
    name: "status",
  });

  const renewalReminder = useWatch({
    control,
    name: "renewalReminder",
  });

  useEffect(() => {
    if (!open) return;

    reset({
      title: contract.title,
      quotationId: contract.quotationId ?? "",
      contractType: contract.contractType ?? "",
      startDate: contract.startDate.slice(0, 10),
      endDate: contract.endDate.slice(0, 10),
      value: String(contract.value),
      currency: contract.currency,
      paymentTerm: contract.paymentTerm ?? "",
      slaTerms: contract.slaTerms ?? "",
      termsConditions: contract.termsConditions ?? "",
      documentUrl: contract.documentUrl ?? "",
      status: contract.status,
      renewalReminder: contract.renewalReminder,
    });
  }, [open, contract, reset]);

  useEffect(() => {
    if (!open || !sourceLeadId) return;

    const leadId = sourceLeadId;

    async function loadQuotations() {
      try {
        setLoadingQuotations(true);

        const response = await quotationService.getAll({
          leadId,
          page: 1,
          limit: 100,
        });

        if (response.success) {
          setQuotations(
            response.data.map((quotation) => ({
              id: quotation.id,
              quotationNo: quotation.quotationNo,
              amount: quotation.amount,
              status: quotation.status,
            })),
          );
        }
      } catch (error) {
        toast.error("Gagal memuat quotation", {
          description:
            error instanceof Error
              ? error.message
              : "Terjadi kesalahan pada server.",
        });
      } finally {
        setLoadingQuotations(false);
      }
    }

    void loadQuotations();
  }, [open, sourceLeadId]);

  const handleOpenChange = (value: boolean) => {
    setOpen(value);

    if (!value) {
      setQuotations([]);
    }
  };

  const onSubmit = async (values: EditContractFormValues) => {
    try {
      setLoading(true);

      const payload: UpdateContractPayload = {
        title: values.title.trim(),
        quotationId: values.quotationId || undefined,
        contractType: values.contractType?.trim() || undefined,
        startDate: values.startDate,
        endDate: values.endDate,
        value: Number(values.value),
        currency: values.currency.trim(),
        paymentTerm: values.paymentTerm?.trim() || undefined,
        slaTerms: values.slaTerms?.trim() || undefined,
        termsConditions: values.termsConditions?.trim() || undefined,
        documentUrl: values.documentUrl?.trim() || undefined,
        status: values.status as ContractStatus,
        renewalReminder: values.renewalReminder,
      };

      const response = await contractService.updateContract(
        contract.id,
        payload,
      );

      if (response.success) {
        toast.success("Contract berhasil diperbarui", {
          description: `"${response.data.contractNo}" berhasil diperbarui.`,
        });

        handleOpenChange(false);
        await onSuccess?.();
      }
    } catch (error) {
      toast.error("Gagal memperbarui contract", {
        description:
          error instanceof Error
            ? error.message
            : "Terjadi kesalahan saat memperbarui contract.",
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogTrigger asChild>
        {trigger ?? (
          <Button variant="outline" size="sm" className="gap-2">
            <Pencil className="size-4" />
            Edit Contract
          </Button>
        )}
      </DialogTrigger>

      <DialogContent className="max-h-[90vh] overflow-y-auto sm:max-w-2xl">
        <DialogHeader>
          <DialogTitle>Edit Contract</DialogTitle>

          <DialogDescription>
            Perbarui informasi contract client.
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit(onSubmit)} className="space-y-5 pt-2">
          <div className="space-y-2">
            <Label htmlFor={`title-${contract.id}`}>Judul Contract</Label>

            <Input
              id={`title-${contract.id}`}
              disabled={loading}
              {...register("title")}
            />

            {errors.title && (
              <p className="text-xs text-destructive">{errors.title.message}</p>
            )}
          </div>

          <div className="grid gap-4 sm:grid-cols-2">
            <div className="space-y-2">
              <Label>Quotation</Label>

              <Select
                value={quotationId || "NONE"}
                disabled={loading || loadingQuotations || !sourceLeadId}
                onValueChange={(value) =>
                  setValue("quotationId", value === "NONE" ? "" : value, {
                    shouldDirty: true,
                  })
                }>
                <SelectTrigger className="w-full">
                  <SelectValue />
                </SelectTrigger>

                <SelectContent>
                  <SelectItem value="NONE">Tanpa Quotation</SelectItem>

                  {quotations.map((quotation) => (
                    <SelectItem key={quotation.id} value={quotation.id}>
                      {quotation.quotationNo}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor={`type-${contract.id}`}>Contract Type</Label>

              <Input
                id={`type-${contract.id}`}
                disabled={loading}
                {...register("contractType")}
              />
            </div>
          </div>

          <div className="grid gap-4 sm:grid-cols-2">
            <div className="space-y-2">
              <Label htmlFor={`start-${contract.id}`}>Start Date</Label>

              <Input
                id={`start-${contract.id}`}
                type="date"
                disabled={loading}
                {...register("startDate")}
              />

              {errors.startDate && (
                <p className="text-xs text-destructive">
                  {errors.startDate.message}
                </p>
              )}
            </div>

            <div className="space-y-2">
              <Label htmlFor={`end-${contract.id}`}>End Date</Label>

              <Input
                id={`end-${contract.id}`}
                type="date"
                disabled={loading}
                {...register("endDate")}
              />

              {errors.endDate && (
                <p className="text-xs text-destructive">
                  {errors.endDate.message}
                </p>
              )}
            </div>
          </div>

          <div className="grid gap-4 sm:grid-cols-[1fr_140px]">
            <div className="space-y-2">
              <Label htmlFor={`value-${contract.id}`}>Nilai Contract</Label>

              <Input
                id={`value-${contract.id}`}
                type="number"
                min="0"
                step="0.01"
                disabled={loading}
                {...register("value")}
              />

              {errors.value && (
                <p className="text-xs text-destructive">
                  {errors.value.message}
                </p>
              )}
            </div>

            <div className="space-y-2">
              <Label htmlFor={`currency-${contract.id}`}>Currency</Label>

              <Input
                id={`currency-${contract.id}`}
                disabled={loading}
                {...register("currency")}
              />
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor={`payment-${contract.id}`}>Payment Term</Label>

            <Input
              id={`payment-${contract.id}`}
              disabled={loading}
              {...register("paymentTerm")}
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor={`sla-${contract.id}`}>SLA Terms</Label>

            <Textarea
              id={`sla-${contract.id}`}
              disabled={loading}
              {...register("slaTerms")}
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor={`terms-${contract.id}`}>Terms & Conditions</Label>

            <Textarea
              id={`terms-${contract.id}`}
              disabled={loading}
              {...register("termsConditions")}
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor={`document-${contract.id}`}>Document URL</Label>

            <Input
              id={`document-${contract.id}`}
              disabled={loading}
              {...register("documentUrl")}
            />

            {errors.documentUrl && (
              <p className="text-xs text-destructive">
                {errors.documentUrl.message}
              </p>
            )}
          </div>

          <div className="space-y-2">
            <Label>Status</Label>

            <Select
              value={status}
              disabled={loading}
              onValueChange={(value) =>
                setValue("status", value as ContractStatus, {
                  shouldValidate: true,
                  shouldDirty: true,
                })
              }>
              <SelectTrigger className="w-full">
                <SelectValue />
              </SelectTrigger>

              <SelectContent>
                <SelectItem value="DRAFT">Draft</SelectItem>
                <SelectItem value="ACTIVE">Active</SelectItem>
                <SelectItem value="EXPIRED">Expired</SelectItem>
                <SelectItem value="TERMINATED">Terminated</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="flex items-start gap-3 rounded-lg border p-4">
            <Checkbox
              id={`renewal-${contract.id}`}
              checked={renewalReminder}
              disabled={loading}
              onCheckedChange={(checked) =>
                setValue("renewalReminder", checked === true, {
                  shouldDirty: true,
                })
              }
            />

            <div className="space-y-1">
              <Label
                htmlFor={`renewal-${contract.id}`}
                className="cursor-pointer">
                Renewal Reminder
              </Label>

              <p className="text-xs text-muted-foreground">
                Aktifkan pengingat renewal contract.
              </p>
            </div>
          </div>

          <DialogFooter className="pt-2">
            <Button
              type="button"
              variant="outline"
              disabled={loading}
              onClick={() => handleOpenChange(false)}>
              Batal
            </Button>

            <Button type="submit" disabled={loading || loadingQuotations}>
              {loading && <Loader2 className="mr-2 size-4 animate-spin" />}
              Simpan Perubahan
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
