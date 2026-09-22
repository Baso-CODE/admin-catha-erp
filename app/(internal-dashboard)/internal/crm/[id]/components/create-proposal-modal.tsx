"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { FilePlus2, Loader2 } from "lucide-react";
import { useState } from "react";
import { useForm } from "react-hook-form";
import { toast } from "sonner";

import {
  CreateProposalPayload,
  proposalService,
} from "@/app/services/crm/proposal.service";
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
  CreateProposalFormValues,
  createProposalSchema,
} from "./proposal-form-schema";

interface CreateProposalModalProps {
  leadId: string;
  onSuccess?: () => void | Promise<void>;
}

function getTodayDate() {
  return new Date().toISOString().slice(0, 10);
}

export function CreateProposalModal({
  leadId,
  onSuccess,
}: CreateProposalModalProps) {
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors },
  } = useForm<CreateProposalFormValues>({
    resolver: zodResolver(createProposalSchema),
    defaultValues: {
      subject: "",
      amount: 0,
      proposalDate: getTodayDate(),
      validUntil: "",
      fileUrl: "",
    },
  });

  const handleOpenChange = (value: boolean) => {
    setOpen(value);

    if (!value) {
      reset({
        subject: "",
        amount: 0,
        proposalDate: getTodayDate(),
        validUntil: "",
        fileUrl: "",
      });
    }
  };

  const onSubmit = async (values: CreateProposalFormValues) => {
    try {
      setLoading(true);

      const payload: CreateProposalPayload = {
        leadId,
        subject: values.subject.trim(),
        amount: values.amount,
        proposalDate: new Date(values.proposalDate).toISOString(),
        validUntil: new Date(values.validUntil).toISOString(),
        ...(values.fileUrl?.trim() && {
          fileUrl: values.fileUrl.trim(),
        }),
      };

      const response = await proposalService.create(payload);

      toast.success("Proposal berhasil dibuat", {
        description: `${response.data.proposalNo} - ${response.data.subject}`,
      });

      handleOpenChange(false);

      await onSuccess?.();
    } catch (error) {
      toast.error("Gagal membuat proposal", {
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
            <FilePlus2 className="size-4" />
            Buat Proposal
          </Button>
        }
      />

      <DialogContent className="sm:max-w-xl">
        <DialogHeader>
          <DialogTitle>Buat Proposal Baru</DialogTitle>

          <DialogDescription>
            Buat proposal baru untuk lead ini.
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit(onSubmit)} className="space-y-5 pt-2">
          <div className="space-y-2">
            <Label htmlFor="subject">Subject</Label>

            <Input
              id="subject"
              placeholder="Contoh: Digital Marketing Campaign"
              disabled={loading}
              {...register("subject")}
            />

            {errors.subject && (
              <p className="text-xs text-destructive">
                {errors.subject.message}
              </p>
            )}
          </div>

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

          <div className="grid gap-4 sm:grid-cols-2">
            <div className="space-y-2">
              <Label htmlFor="proposalDate">Proposal Date</Label>

              <Input
                id="proposalDate"
                type="date"
                disabled={loading}
                {...register("proposalDate")}
              />

              {errors.proposalDate && (
                <p className="text-xs text-destructive">
                  {errors.proposalDate.message}
                </p>
              )}
            </div>

            <div className="space-y-2">
              <Label htmlFor="validUntil">Valid Until</Label>

              <Input
                id="validUntil"
                type="date"
                disabled={loading}
                {...register("validUntil")}
              />

              {errors.validUntil && (
                <p className="text-xs text-destructive">
                  {errors.validUntil.message}
                </p>
              )}
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="fileUrl">File URL</Label>

            <Input
              id="fileUrl"
              type="url"
              placeholder="https://..."
              disabled={loading}
              {...register("fileUrl")}
            />

            <p className="text-xs text-muted-foreground">
              Opsional. Bisa diisi URL file proposal jika sudah tersedia.
            </p>

            {errors.fileUrl && (
              <p className="text-xs text-destructive">
                {errors.fileUrl.message}
              </p>
            )}
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
              Simpan Proposal
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
