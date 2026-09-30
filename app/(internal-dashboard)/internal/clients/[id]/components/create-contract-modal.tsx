"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { Loader2, Plus } from "lucide-react";
import { useEffect, useState } from "react";
import { useForm, useWatch } from "react-hook-form";
import { toast } from "sonner";
import * as z from "zod";

import {
  ContractStatus,
  CreateContractPayload,
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

const createContractSchema = z
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

type CreateContractFormValues = z.infer<typeof createContractSchema>;

interface QuotationOption {
  id: string;
  quotationNo: string;
  amount: string | number;
  status: string;
}

interface CreateContractModalProps {
  clientId: string;
  sourceLeadId?: string | null;
  onSuccess?: () => void | Promise<void>;
}

export function CreateContractModal({
  clientId,
  sourceLeadId,
  onSuccess,
}: CreateContractModalProps) {
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
  } = useForm<CreateContractFormValues>({
    resolver: zodResolver(createContractSchema),
    defaultValues: {
      title: "",
      quotationId: "",
      contractType: "",
      startDate: "",
      endDate: "",
      value: "",
      currency: "IDR",
      paymentTerm: "",
      slaTerms: "",
      termsConditions: "",
      documentUrl: "",
      status: "DRAFT",
      renewalReminder: false,
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
      reset({
        title: "",
        quotationId: "",
        contractType: "",
        startDate: "",
        endDate: "",
        value: "",
        currency: "IDR",
        paymentTerm: "",
        slaTerms: "",
        termsConditions: "",
        documentUrl: "",
        status: "DRAFT",
        renewalReminder: false,
      });

      setQuotations([]);
    }
  };

  const onSubmit = async (values: CreateContractFormValues) => {
    try {
      setLoading(true);

      const payload: CreateContractPayload = {
        title: values.title.trim(),
        clientId,
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
        status: values.status,
        renewalReminder: values.renewalReminder,
      };

      const response = await contractService.createContract(payload);

      if (response.success) {
        toast.success("Contract berhasil dibuat", {
          description: `"${response.data.contractNo}" berhasil ditambahkan.`,
        });

        handleOpenChange(false);
        await onSuccess?.();
      }
    } catch (error) {
      toast.error("Gagal membuat contract", {
        description:
          error instanceof Error
            ? error.message
            : "Terjadi kesalahan saat membuat contract.",
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogTrigger asChild>
        <Button className="gap-2">
          <Plus className="size-4" />
          Tambah Contract
        </Button>
      </DialogTrigger>

      <DialogContent className="max-h-[90vh] overflow-y-auto sm:max-w-2xl">
        <DialogHeader>
          <DialogTitle>Tambah Contract</DialogTitle>

          <DialogDescription>
            Tambahkan contract baru untuk client ini.
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit(onSubmit)} className="space-y-5 pt-2">
          <div className="space-y-2">
            <Label htmlFor="contract-title">Judul Contract</Label>

            <Input
              id="contract-title"
              placeholder="Digital Marketing Retainer 2026"
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
                  <SelectValue
                    placeholder={
                      !sourceLeadId
                        ? "Client tanpa source lead"
                        : loadingQuotations
                          ? "Memuat quotation..."
                          : "Pilih quotation"
                    }
                  />
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
              <Label htmlFor="contract-type">Contract Type</Label>

              <Input
                id="contract-type"
                placeholder="Retainer"
                disabled={loading}
                {...register("contractType")}
              />
            </div>
          </div>

          <div className="grid gap-4 sm:grid-cols-2">
            <div className="space-y-2">
              <Label htmlFor="start-date">Start Date</Label>

              <Input
                id="start-date"
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
              <Label htmlFor="end-date">End Date</Label>

              <Input
                id="end-date"
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
              <Label htmlFor="contract-value">Nilai Contract</Label>

              <Input
                id="contract-value"
                type="number"
                min="0"
                step="0.01"
                placeholder="10000000"
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
              <Label htmlFor="currency">Currency</Label>

              <Input
                id="currency"
                disabled={loading}
                {...register("currency")}
              />
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="payment-term">Payment Term</Label>

            <Input
              id="payment-term"
              placeholder="Net 30"
              disabled={loading}
              {...register("paymentTerm")}
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="sla-terms">SLA Terms</Label>

            <Textarea
              id="sla-terms"
              placeholder="Ketentuan SLA..."
              disabled={loading}
              {...register("slaTerms")}
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="terms">Terms & Conditions</Label>

            <Textarea
              id="terms"
              placeholder="Syarat dan ketentuan contract..."
              disabled={loading}
              {...register("termsConditions")}
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="document-url">Document URL</Label>

            <Input
              id="document-url"
              placeholder="https://..."
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
                  shouldDirty: true,
                  shouldValidate: true,
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
              id="renewalReminder"
              checked={renewalReminder}
              disabled={loading}
              onCheckedChange={(checked) =>
                setValue("renewalReminder", checked === true, {
                  shouldDirty: true,
                })
              }
            />

            <div className="space-y-1">
              <Label htmlFor="renewalReminder" className="cursor-pointer">
                Renewal Reminder
              </Label>

              <p className="text-xs text-muted-foreground">
                Aktifkan pengingat untuk renewal contract.
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
              Simpan Contract
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
