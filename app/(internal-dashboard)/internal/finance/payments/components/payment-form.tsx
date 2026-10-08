"use client";

import { useRouter } from "next/navigation";
import { useEffect, useMemo, useState } from "react";
import { toast } from "sonner";

import { Invoice, invoiceService } from "@/app/services/invoice.service";
import {
  Payment,
  PaymentMethod,
  paymentService,
} from "@/app/services/payment.service";
import { Button } from "@/components/ui/button";
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

interface PaymentFormProps {
  payment?: Payment;
}

interface FormState {
  invoiceId: string;
  amountPaid: string;
  paymentDate: string;
  paymentMethod: PaymentMethod;
  reference: string;
  notes: string;
  proofUrl: string;
}

function toInputDate(value?: string | null) {
  if (!value) return "";
  return new Date(value).toISOString().slice(0, 10);
}

function formatCurrency(value: string | number, currency = "IDR") {
  return new Intl.NumberFormat("id-ID", {
    style: "currency",
    currency,
    maximumFractionDigits: 2,
  }).format(Number(value));
}

export function PaymentForm({ payment }: PaymentFormProps) {
  const router = useRouter();
  const isEdit = Boolean(payment);

  const [invoices, setInvoices] = useState<Invoice[]>([]);
  const [loadingInvoices, setLoadingInvoices] = useState(true);
  const [submitting, setSubmitting] = useState(false);

  const [form, setForm] = useState<FormState>({
    invoiceId: payment?.invoiceId ?? "",
    amountPaid: String(payment?.amountPaid ?? ""),
    paymentDate:
      toInputDate(payment?.paymentDate) ||
      toInputDate(new Date().toISOString()),
    paymentMethod: payment?.paymentMethod ?? "BANK_TRANSFER",
    reference: payment?.reference ?? "",
    notes: payment?.notes ?? "",
    proofUrl: payment?.proofUrl ?? "",
  });

  useEffect(() => {
    const loadInvoices = async () => {
      try {
        setLoadingInvoices(true);

        const [sentResponse, partialResponse] = await Promise.all([
          invoiceService.getAll({
            status: "SENT",
            page: 1,
            limit: 100,
          }),
          invoiceService.getAll({
            status: "PARTIALLY_PAID",
            page: 1,
            limit: 100,
          }),
        ]);

        const invoiceMap = new Map<string, Invoice>();

        for (const invoice of [...sentResponse.data, ...partialResponse.data]) {
          invoiceMap.set(invoice.id, invoice);
        }

        if (payment?.invoice) {
          invoiceMap.set(
            payment.invoice.id,
            payment.invoice as unknown as Invoice,
          );
        }

        setInvoices([...invoiceMap.values()]);
      } catch (error) {
        toast.error("Gagal memuat invoice", {
          description:
            error instanceof Error
              ? error.message
              : "Terjadi kesalahan pada server.",
        });
      } finally {
        setLoadingInvoices(false);
      }
    };

    void loadInvoices();
  }, [payment]);

  const selectedInvoice = useMemo(
    () => invoices.find((invoice) => invoice.id === form.invoiceId),
    [invoices, form.invoiceId],
  );

  const outstandingAmount = useMemo(() => {
    if (!selectedInvoice) return 0;

    return Number(
      selectedInvoice.outstandingAmount ?? selectedInvoice.totalAmount,
    );
  }, [selectedInvoice]);

  const paidAmount = useMemo(() => {
    if (!selectedInvoice) return 0;

    return Number(selectedInvoice.paidAmount ?? 0);
  }, [selectedInvoice]);

  const validate = () => {
    if (!form.invoiceId) {
      toast.error("Invoice wajib dipilih.");
      return false;
    }

    const amount = Number(form.amountPaid);

    if (!form.amountPaid || amount <= 0) {
      toast.error("Jumlah pembayaran harus lebih besar dari 0.");
      return false;
    }

    if (selectedInvoice && amount > outstandingAmount) {
      toast.error("Jumlah pembayaran melebihi outstanding invoice.");
      return false;
    }

    if (!form.paymentDate) {
      toast.error("Tanggal pembayaran wajib diisi.");
      return false;
    }

    return true;
  };

  const handleSubmit = async () => {
    if (!validate()) return;

    try {
      setSubmitting(true);

      const response = isEdit
        ? await paymentService.update(payment!.id, {
            amountPaid: form.amountPaid,
            paymentDate: form.paymentDate,
            paymentMethod: form.paymentMethod,
            reference: form.reference.trim() || undefined,
            notes: form.notes.trim() || undefined,
            proofUrl: form.proofUrl.trim() || undefined,
          })
        : await paymentService.create({
            invoiceId: form.invoiceId,
            amountPaid: form.amountPaid,
            paymentDate: form.paymentDate,
            paymentMethod: form.paymentMethod,
            reference: form.reference.trim() || undefined,
            notes: form.notes.trim() || undefined,
            proofUrl: form.proofUrl.trim() || undefined,
          });

      toast.success(
        isEdit ? "Payment berhasil diperbarui" : "Payment berhasil dibuat",
        {
          description: response.data.paymentNo,
        },
      );

      router.push(`/internal/finance/payments/${response.data.id}`);
      router.refresh();
    } catch (error) {
      toast.error(
        isEdit ? "Gagal memperbarui payment" : "Gagal membuat payment",
        {
          description:
            error instanceof Error
              ? error.message
              : "Terjadi kesalahan pada server.",
        },
      );
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="grid gap-6 lg:grid-cols-[1fr_320px]">
      <div className="space-y-6">
        <div className="rounded-xl border p-5">
          <h2 className="mb-4 font-semibold">Informasi Payment</h2>

          <div className="grid gap-4 md:grid-cols-2">
            <div className="space-y-2 md:col-span-2">
              <Label>Invoice</Label>

              <Select
                value={form.invoiceId}
                disabled={loadingInvoices || isEdit}
                onValueChange={(value) =>
                  setForm((prev) => ({
                    ...prev,
                    invoiceId: value,
                  }))
                }>
                <SelectTrigger>
                  <SelectValue placeholder="Pilih invoice" />
                </SelectTrigger>

                <SelectContent>
                  {invoices.map((invoice) => (
                    <SelectItem key={invoice.id} value={invoice.id}>
                      {invoice.invoiceNo} — {invoice.client?.companyName ?? "-"}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label>Jumlah Pembayaran</Label>

              <Input
                type="number"
                min="0.01"
                step="0.01"
                value={form.amountPaid}
                onChange={(event) =>
                  setForm((prev) => ({
                    ...prev,
                    amountPaid: event.target.value,
                  }))
                }
              />
            </div>

            <div className="space-y-2">
              <Label>Tanggal Pembayaran</Label>

              <Input
                type="date"
                value={form.paymentDate}
                onChange={(event) =>
                  setForm((prev) => ({
                    ...prev,
                    paymentDate: event.target.value,
                  }))
                }
              />
            </div>

            <div className="space-y-2">
              <Label>Metode Pembayaran</Label>

              <Select
                value={form.paymentMethod}
                onValueChange={(value) =>
                  setForm((prev) => ({
                    ...prev,
                    paymentMethod: value as PaymentMethod,
                  }))
                }>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>

                <SelectContent>
                  <SelectItem value="BANK_TRANSFER">Bank Transfer</SelectItem>
                  <SelectItem value="CASH">Cash</SelectItem>
                  <SelectItem value="CREDIT_CARD">Credit Card</SelectItem>
                  <SelectItem value="VIRTUAL_ACCOUNT">
                    Virtual Account
                  </SelectItem>
                  <SelectItem value="E_WALLET">E-Wallet</SelectItem>
                  <SelectItem value="OTHER">Other</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label>Reference</Label>

              <Input
                value={form.reference}
                placeholder="Nomor referensi transaksi"
                onChange={(event) =>
                  setForm((prev) => ({
                    ...prev,
                    reference: event.target.value,
                  }))
                }
              />
            </div>

            <div className="space-y-2 md:col-span-2">
              <Label>Proof URL</Label>

              <Input
                value={form.proofUrl}
                placeholder="https://..."
                onChange={(event) =>
                  setForm((prev) => ({
                    ...prev,
                    proofUrl: event.target.value,
                  }))
                }
              />
            </div>

            <div className="space-y-2 md:col-span-2">
              <Label>Notes</Label>

              <Textarea
                rows={5}
                value={form.notes}
                placeholder="Catatan pembayaran..."
                onChange={(event) =>
                  setForm((prev) => ({
                    ...prev,
                    notes: event.target.value,
                  }))
                }
              />
            </div>
          </div>
        </div>
      </div>

      <div>
        <div className="sticky top-6 rounded-xl border p-5">
          <h2 className="mb-4 font-semibold">Ringkasan Invoice</h2>

          {!selectedInvoice ? (
            <p className="text-sm text-muted-foreground">
              Pilih invoice terlebih dahulu.
            </p>
          ) : (
            <div className="space-y-4">
              <div>
                <p className="text-sm text-muted-foreground">Invoice</p>

                <p className="font-medium">{selectedInvoice.invoiceNo}</p>
              </div>

              <div>
                <p className="text-sm text-muted-foreground">Client</p>

                <p className="font-medium">
                  {selectedInvoice.client?.companyName ?? "-"}
                </p>
              </div>

              <div className="border-t pt-4">
                <div className="flex justify-between text-sm">
                  <span className="text-muted-foreground">Total</span>

                  <span>
                    {formatCurrency(
                      selectedInvoice.totalAmount,
                      selectedInvoice.currency,
                    )}
                  </span>
                </div>

                <div className="mt-2 flex justify-between text-sm">
                  <span className="text-muted-foreground">Paid</span>

                  <span>
                    {formatCurrency(paidAmount, selectedInvoice.currency)}
                  </span>
                </div>

                <div className="mt-2 flex justify-between font-semibold">
                  <span>Outstanding</span>

                  <span>
                    {formatCurrency(
                      outstandingAmount,
                      selectedInvoice.currency,
                    )}
                  </span>
                </div>
              </div>
            </div>
          )}

          <div className="mt-6 flex flex-col gap-2">
            <Button disabled={submitting} onClick={() => void handleSubmit()}>
              {submitting
                ? "Menyimpan..."
                : isEdit
                  ? "Simpan Perubahan"
                  : "Buat Payment"}
            </Button>

            <Button
              variant="outline"
              disabled={submitting}
              onClick={() => router.back()}>
              Batal
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}
