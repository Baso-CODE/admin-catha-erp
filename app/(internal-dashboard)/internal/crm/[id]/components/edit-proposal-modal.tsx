"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { Loader2, Pencil } from "lucide-react";
import { useEffect, useState } from "react";
import { useForm, useWatch } from "react-hook-form";
import { toast } from "sonner";

import {
  ProposalItem,
  UpdateProposalPayload,
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
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

import {
  UpdateProposalFormValues,
  updateProposalSchema,
} from "./proposal-form-schema";

interface EditProposalModalProps {
  proposal: ProposalItem;
  onSuccess?: () => void | Promise<void>;
}

function formatDateInput(value: string) {
  return new Date(value).toISOString().slice(0, 10);
}

function getDefaultValues(proposal: ProposalItem): UpdateProposalFormValues {
  return {
    subject: proposal.subject,
    amount: Number(proposal.amount),
    proposalDate: formatDateInput(proposal.proposalDate),
    validUntil: formatDateInput(proposal.validUntil),
    fileUrl: proposal.fileUrl ?? "",
    status: proposal.status as UpdateProposalFormValues["status"],
  };
}

export function EditProposalModal({
  proposal,
  onSuccess,
}: EditProposalModalProps) {
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);

  const {
    register,
    handleSubmit,
    setValue,
    control,
    reset,
    formState: { errors },
  } = useForm<UpdateProposalFormValues>({
    resolver: zodResolver(updateProposalSchema),
    defaultValues: getDefaultValues(proposal),
  });

  const selectedStatus = useWatch({
    control,
    name: "status",
  });

  useEffect(() => {
    if (!open) return;
    reset(getDefaultValues(proposal));
  }, [open, proposal, reset]);

  const onSubmit = async (values: UpdateProposalFormValues) => {
    try {
      setLoading(true);

      const payload: UpdateProposalPayload = {
        subject: values.subject.trim(),
        amount: values.amount,
        proposalDate: new Date(values.proposalDate).toISOString(),
        validUntil: new Date(values.validUntil).toISOString(),
        status: values.status,
        fileUrl: values.fileUrl?.trim() || undefined,
      };

      const response = await proposalService.update(proposal.id, payload);

      toast.success("Proposal berhasil diperbarui", {
        description: response.data.proposalNo,
      });

      setOpen(false);

      await onSuccess?.();
    } catch (error) {
      toast.error("Gagal memperbarui proposal", {
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
          Edit Proposal
        </Button>
      </DialogTrigger>

      <DialogContent className="sm:max-w-xl">
        <DialogHeader>
          <DialogTitle>Edit Proposal</DialogTitle>

          <DialogDescription>
            Perbarui informasi dan status proposal.
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit(onSubmit)} className="space-y-5 pt-2">
          <div className="space-y-2">
            <Label htmlFor={`proposal-subject-${proposal.id}`}>Subject</Label>

            <Input
              id={`proposal-subject-${proposal.id}`}
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
            <Label htmlFor={`proposal-amount-${proposal.id}`}>Amount</Label>

            <Input
              id={`proposal-amount-${proposal.id}`}
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

          <div className="grid gap-4 sm:grid-cols-2">
            <div className="space-y-2">
              <Label htmlFor={`proposal-date-${proposal.id}`}>
                Proposal Date
              </Label>

              <Input
                id={`proposal-date-${proposal.id}`}
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
              <Label htmlFor={`valid-until-${proposal.id}`}>Valid Until</Label>

              <Input
                id={`valid-until-${proposal.id}`}
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
            <Label>Status</Label>

            <Select
              value={selectedStatus}
              disabled={loading}
              onValueChange={(value) =>
                setValue(
                  "status",
                  value as UpdateProposalFormValues["status"],
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

          <div className="space-y-2">
            <Label htmlFor={`file-url-${proposal.id}`}>File URL</Label>

            <Input
              id={`file-url-${proposal.id}`}
              type="url"
              placeholder="https://..."
              disabled={loading}
              {...register("fileUrl")}
            />
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
