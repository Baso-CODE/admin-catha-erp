"use client";

import { Loader2 } from "lucide-react";
import { ReactNode, useState } from "react";
import { toast } from "sonner";

import {
  ClientApprovalItem,
  clientPortalService,
} from "@/app/services/client-portal.service";
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
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";

interface RevisionDialogProps {
  approval: ClientApprovalItem;
  trigger: ReactNode;
  onSuccess?: () => void | Promise<void>;
}

export function RevisionDialog({
  approval,
  trigger,
  onSuccess,
}: RevisionDialogProps) {
  const [open, setOpen] = useState(false);
  const [feedback, setFeedback] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = async () => {
    const value = feedback.trim();

    if (!value) {
      toast.error("Feedback revisi wajib diisi.");
      return;
    }

    try {
      setIsSubmitting(true);

      await clientPortalService.requestRevision(approval.id, value);

      toast.success("Permintaan revisi berhasil dikirim.");

      setFeedback("");
      setOpen(false);

      await onSuccess?.();
    } catch (error) {
      toast.error("Gagal mengirim permintaan revisi.", {
        description:
          error instanceof Error
            ? error.message
            : "Terjadi kesalahan pada server.",
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleOpenChange = (value: boolean) => {
    if (isSubmitting) return;

    setOpen(value);

    if (!value) {
      setFeedback("");
    }
  };

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogTrigger asChild>{trigger}</DialogTrigger>

      <DialogContent className="sm:max-w-lg">
        <DialogHeader>
          <DialogTitle>Request Revision</DialogTitle>

          <DialogDescription>
            Jelaskan perubahan yang dibutuhkan untuk {approval.deliverable.name}
            .
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-2">
          <Label htmlFor="revision-feedback">Feedback</Label>

          <Textarea
            id="revision-feedback"
            value={feedback}
            onChange={(event) => setFeedback(event.target.value)}
            placeholder="Contoh: Mohon revisi bagian headline dan visual utama..."
            rows={6}
            maxLength={5000}
          />

          <p className="text-right text-xs text-muted-foreground">
            {feedback.length}/5000
          </p>
        </div>

        <DialogFooter>
          <Button
            variant="outline"
            disabled={isSubmitting}
            onClick={() => handleOpenChange(false)}>
            Batal
          </Button>

          <Button
            disabled={isSubmitting || !feedback.trim()}
            onClick={() => void handleSubmit()}>
            {isSubmitting && <Loader2 className="size-4 animate-spin" />}
            Kirim Revisi
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
