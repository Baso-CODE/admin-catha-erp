"use client";

import { CheckCircle2, XCircle } from "lucide-react";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { toast } from "sonner";

import { Payment, paymentService } from "@/app/services/payment.service";
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

interface PaymentActionsProps {
  payment: Payment;
  permissions: string[];
}

export function PaymentActions({ payment, permissions }: PaymentActionsProps) {
  const router = useRouter();

  const [verifying, setVerifying] = useState(false);

  const [rejecting, setRejecting] = useState(false);

  const [rejectOpen, setRejectOpen] = useState(false);

  const [rejectionReason, setRejectionReason] = useState("");

  if (payment.status !== "PENDING") {
    return null;
  }

  const canVerify = permissions.includes("payment.verify");

  const canReject = permissions.includes("payment.reject");

  const handleVerify = async () => {
    try {
      setVerifying(true);

      await paymentService.verify(payment.id);

      toast.success("Payment berhasil diverifikasi");

      router.refresh();
    } catch (error) {
      toast.error("Gagal memverifikasi payment", {
        description:
          error instanceof Error
            ? error.message
            : "Terjadi kesalahan pada server.",
      });
    } finally {
      setVerifying(false);
    }
  };

  const handleReject = async () => {
    const reason = rejectionReason.trim();

    if (!reason) {
      toast.error("Alasan penolakan wajib diisi.");
      return;
    }

    try {
      setRejecting(true);

      await paymentService.reject(payment.id, {
        rejectionReason: reason,
      });

      toast.success("Payment berhasil ditolak");

      setRejectOpen(false);
      setRejectionReason("");

      router.refresh();
    } catch (error) {
      toast.error("Gagal menolak payment", {
        description:
          error instanceof Error
            ? error.message
            : "Terjadi kesalahan pada server.",
      });
    } finally {
      setRejecting(false);
    }
  };

  return (
    <div className="flex flex-wrap gap-2">
      {canVerify && (
        <AlertDialog>
          <AlertDialogTrigger asChild>
            <Button>
              <CheckCircle2 className="size-4" />
              Verifikasi Payment
            </Button>
          </AlertDialogTrigger>

          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle>Verifikasi payment?</AlertDialogTitle>

              <AlertDialogDescription>
                Payment {payment.paymentNo} akan dinyatakan valid dan nilai
                pembayaran akan dihitung ke invoice.
              </AlertDialogDescription>
            </AlertDialogHeader>

            <AlertDialogFooter>
              <AlertDialogCancel disabled={verifying}>Batal</AlertDialogCancel>

              <AlertDialogAction
                disabled={verifying}
                onClick={(event) => {
                  event.preventDefault();
                  void handleVerify();
                }}>
                {verifying ? "Memverifikasi..." : "Ya, Verifikasi"}
              </AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>
      )}

      {canReject && (
        <Dialog open={rejectOpen} onOpenChange={setRejectOpen}>
          <DialogTrigger asChild>
            <Button variant="destructive">
              <XCircle className="size-4" />
              Tolak Payment
            </Button>
          </DialogTrigger>

          <DialogContent>
            <DialogHeader>
              <DialogTitle>Tolak payment</DialogTitle>

              <DialogDescription>
                Masukkan alasan payment {payment.paymentNo} ditolak.
              </DialogDescription>
            </DialogHeader>

            <div className="space-y-2">
              <Label>Alasan Penolakan</Label>

              <Textarea
                rows={5}
                value={rejectionReason}
                placeholder="Contoh: nominal bukti transfer tidak sesuai..."
                onChange={(event) => setRejectionReason(event.target.value)}
              />
            </div>

            <DialogFooter>
              <Button
                variant="outline"
                disabled={rejecting}
                onClick={() => setRejectOpen(false)}>
                Batal
              </Button>

              <Button
                variant="destructive"
                disabled={rejecting || !rejectionReason.trim()}
                onClick={() => void handleReject()}>
                {rejecting ? "Menolak..." : "Tolak Payment"}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      )}
    </div>
  );
}
