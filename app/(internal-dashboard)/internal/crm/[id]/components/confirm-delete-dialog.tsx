"use client";

import { Loader2 } from "lucide-react";
import { ReactNode, useState } from "react";

import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import { Button } from "@/components/ui/button";

interface ConfirmDeleteDialogProps {
  title?: string;
  description?: string;
  triggerLabel?: string;
  loadingLabel?: string;
  onConfirm: () => void | Promise<void>;
  disabled?: boolean;
  trigger?: ReactNode;
}

export function ConfirmDeleteDialog({
  title = "Hapus data?",
  description = "Tindakan ini tidak dapat dibatalkan.",
  triggerLabel = "Hapus",
  loadingLabel = "Menghapus...",
  onConfirm,
  disabled = false,
  trigger,
}: ConfirmDeleteDialogProps) {
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);

  const handleConfirm = async () => {
    try {
      setLoading(true);
      await onConfirm();
      setOpen(false);
    } finally {
      setLoading(false);
    }
  };

  return (
    <AlertDialog open={open} onOpenChange={setOpen}>
      <AlertDialogTrigger asChild>
        {trigger ?? <Button variant="destructive">{triggerLabel}</Button>}
      </AlertDialogTrigger>

      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>{title}</AlertDialogTitle>

          <AlertDialogDescription>{description}</AlertDialogDescription>
        </AlertDialogHeader>

        <AlertDialogFooter>
          <AlertDialogCancel disabled={loading}>Batal</AlertDialogCancel>

          <AlertDialogAction
            disabled={loading}
            onClick={(event) => {
              event.preventDefault();
              void handleConfirm();
            }}>
            {loading && <Loader2 className="mr-2 size-4 animate-spin" />}

            {loading ? loadingLabel : "Ya, Hapus"}
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}
