"use client";

import { Loader2 } from "lucide-react";
import { ReactNode, useState } from "react";
import { toast } from "sonner";

import { clientPortalService } from "@/app/services/client-portal.service";
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

interface CreateSupportDialogProps {
  trigger: ReactNode;
  onSuccess?: () => void | Promise<void>;
}

export function CreateSupportDialog({
  trigger,
  onSuccess,
}: CreateSupportDialogProps) {
  const [open, setOpen] = useState(false);
  const [subject, setSubject] = useState("");
  const [description, setDescription] = useState("");
  const [priority, setPriority] = useState("MEDIUM");
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = async () => {
    if (!subject.trim() || !description.trim()) {
      toast.error("Subject dan deskripsi wajib diisi.");
      return;
    }

    try {
      setIsSubmitting(true);

      await clientPortalService.createSupportTicket({
        subject: subject.trim(),
        description: description.trim(),
        priority,
      });

      toast.success("Support ticket berhasil dibuat.");

      setSubject("");
      setDescription("");
      setPriority("MEDIUM");
      setOpen(false);

      await onSuccess?.();
    } catch (error) {
      toast.error("Gagal membuat support ticket.", {
        description:
          error instanceof Error
            ? error.message
            : "Terjadi kesalahan pada server.",
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>{trigger}</DialogTrigger>

      <DialogContent className="sm:max-w-lg">
        <DialogHeader>
          <DialogTitle>Buat Support Ticket</DialogTitle>
          <DialogDescription>
            Jelaskan kendala atau kebutuhan bantuan Anda.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          <div className="space-y-2">
            <Label>Subject</Label>
            <Input
              value={subject}
              onChange={(event) => setSubject(event.target.value)}
              maxLength={200}
              placeholder="Contoh: Revisi akses campaign"
            />
          </div>

          <div className="space-y-2">
            <Label>Priority</Label>

            <Select value={priority} onValueChange={setPriority}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>

              <SelectContent>
                <SelectItem value="LOW">Low</SelectItem>
                <SelectItem value="MEDIUM">Medium</SelectItem>
                <SelectItem value="HIGH">High</SelectItem>
                <SelectItem value="URGENT">Urgent</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <Label>Description</Label>

            <Textarea
              value={description}
              onChange={(event) => setDescription(event.target.value)}
              rows={6}
              maxLength={10000}
              placeholder="Jelaskan kebutuhan support..."
            />
          </div>
        </div>

        <DialogFooter>
          <Button
            variant="outline"
            disabled={isSubmitting}
            onClick={() => setOpen(false)}>
            Batal
          </Button>

          <Button
            disabled={isSubmitting || !subject.trim() || !description.trim()}
            onClick={() => void handleSubmit()}>
            {isSubmitting && <Loader2 className="size-4 animate-spin" />}
            Buat Ticket
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
