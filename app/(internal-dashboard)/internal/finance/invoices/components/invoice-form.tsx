"use client";

import { Plus, Trash2 } from "lucide-react";
import { useRouter } from "next/navigation";
import { useEffect, useMemo, useState } from "react";
import { toast } from "sonner";

import { ClientItem, clientService } from "@/app/services/client.service";
import { ContractItem, contractService } from "@/app/services/contract.service";
import {
  CreateInvoicePayload,
  Invoice,
  InvoiceItemPayload,
  invoiceService,
} from "@/app/services/invoice.service";
import { ProjectItem, projectService } from "@/app/services/project.service";
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

interface InvoiceFormProps {
  invoice?: Invoice;
}

interface FormState {
  clientId: string;
  contractId: string;
  projectId: string;
  invoiceDate: string;
  dueDate: string;
  currency: string;
  discountAmount: string;
  taxAmount: string;
  notes: string;
  items: InvoiceItemPayload[];
}

function toInputDate(value?: string | null) {
  if (!value) return "";
  return new Date(value).toISOString().slice(0, 10);
}

function createEmptyItem(): InvoiceItemPayload {
  return {
    description: "",
    quantity: "1",
    unitPrice: "0",
  };
}

export function InvoiceForm({ invoice }: InvoiceFormProps) {
  const router = useRouter();

  const isEdit = Boolean(invoice);

  const [clients, setClients] = useState<ClientItem[]>([]);
  const [contracts, setContracts] = useState<ContractItem[]>([]);
  const [projects, setProjects] = useState<ProjectItem[]>([]);

  const [loadingReferences, setLoadingReferences] = useState(true);
  const [submitting, setSubmitting] = useState(false);

  const [form, setForm] = useState<FormState>({
    clientId: invoice?.clientId ?? "",
    contractId: invoice?.contractId ?? "",
    projectId: invoice?.projectId ?? "",
    invoiceDate:
      toInputDate(invoice?.invoiceDate) ||
      toInputDate(new Date().toISOString()),
    dueDate: toInputDate(invoice?.dueDate),
    currency: invoice?.currency ?? "IDR",
    discountAmount: String(invoice?.discountAmount ?? "0"),
    taxAmount: String(invoice?.taxAmount ?? "0"),
    notes: invoice?.notes ?? "",
    items: invoice?.items?.map((item) => ({
      description: item.description,
      quantity: String(item.quantity),
      unitPrice: String(item.unitPrice),
    })) ?? [createEmptyItem()],
  });

  useEffect(() => {
    const loadClients = async () => {
      try {
        setLoadingReferences(true);

        const response = await clientService.getClients({
          status: "ACTIVE",
          page: 1,
          limit: 100,
        });

        setClients(response.data);
      } catch (error) {
        toast.error("Gagal memuat client", {
          description:
            error instanceof Error
              ? error.message
              : "Terjadi kesalahan pada server.",
        });
      } finally {
        setLoadingReferences(false);
      }
    };

    void loadClients();
  }, []);

  useEffect(() => {
    if (!form.clientId) {
      setContracts([]);
      setProjects([]);
      return;
    }

    const loadClientReferences = async () => {
      try {
        const [contractResponse, projectResponse] = await Promise.all([
          contractService.getContracts({
            clientId: form.clientId,
            page: 1,
            limit: 100,
          }),
          projectService.getAll({
            clientId: form.clientId,
            page: 1,
            limit: 100,
          }),
        ]);

        setContracts(contractResponse.data);
        setProjects(projectResponse.data);
      } catch (error) {
        toast.error("Gagal memuat contract / project", {
          description:
            error instanceof Error
              ? error.message
              : "Terjadi kesalahan pada server.",
        });
      }
    };

    void loadClientReferences();
  }, [form.clientId]);

  const subtotal = useMemo(() => {
    return form.items.reduce((total, item) => {
      const quantity = Number(item.quantity || 0);
      const unitPrice = Number(item.unitPrice || 0);

      return total + quantity * unitPrice;
    }, 0);
  }, [form.items]);

  const discountAmount = Number(form.discountAmount || 0);
  const taxAmount = Number(form.taxAmount || 0);

  const total = Math.max(subtotal - discountAmount + taxAmount, 0);

  const formatCurrency = (value: number) =>
    new Intl.NumberFormat("id-ID", {
      style: "currency",
      currency: form.currency || "IDR",
      maximumFractionDigits: 2,
    }).format(value);

  const updateItem = (
    index: number,
    field: keyof InvoiceItemPayload,
    value: string,
  ) => {
    setForm((prev) => ({
      ...prev,
      items: prev.items.map((item, itemIndex) =>
        itemIndex === index
          ? {
              ...item,
              [field]: value,
            }
          : item,
      ),
    }));
  };

  const addItem = () => {
    setForm((prev) => ({
      ...prev,
      items: [...prev.items, createEmptyItem()],
    }));
  };

  const removeItem = (index: number) => {
    setForm((prev) => ({
      ...prev,
      items:
        prev.items.length === 1
          ? prev.items
          : prev.items.filter((_, itemIndex) => itemIndex !== index),
    }));
  };

  const validate = () => {
    if (!form.clientId) {
      toast.error("Client wajib dipilih.");
      return false;
    }

    if (!form.invoiceDate || !form.dueDate) {
      toast.error("Tanggal invoice dan due date wajib diisi.");
      return false;
    }

    if (new Date(form.dueDate) < new Date(form.invoiceDate)) {
      toast.error("Due date tidak boleh sebelum tanggal invoice.");
      return false;
    }

    if (form.items.length === 0) {
      toast.error("Minimal harus ada satu item invoice.");
      return false;
    }

    for (const item of form.items) {
      if (!item.description.trim()) {
        toast.error("Deskripsi item wajib diisi.");
        return false;
      }

      if (Number(item.quantity) <= 0) {
        toast.error("Quantity harus lebih besar dari 0.");
        return false;
      }

      if (Number(item.unitPrice) < 0) {
        toast.error("Unit price tidak boleh negatif.");
        return false;
      }
    }

    if (discountAmount < 0 || taxAmount < 0) {
      toast.error("Discount dan tax tidak boleh negatif.");
      return false;
    }

    if (discountAmount > subtotal) {
      toast.error("Discount tidak boleh lebih besar dari subtotal.");
      return false;
    }

    if (total <= 0) {
      toast.error("Total invoice harus lebih besar dari 0.");
      return false;
    }

    return true;
  };

  const handleSubmit = async () => {
    if (!validate()) return;

    const payload: CreateInvoicePayload = {
      clientId: form.clientId,
      contractId: form.contractId || undefined,
      projectId: form.projectId || undefined,
      invoiceDate: form.invoiceDate,
      dueDate: form.dueDate,
      currency: form.currency,
      discountAmount: form.discountAmount || "0",
      taxAmount: form.taxAmount || "0",
      notes: form.notes.trim() || undefined,
      items: form.items.map((item) => ({
        description: item.description.trim(),
        quantity: item.quantity,
        unitPrice: item.unitPrice,
      })),
    };

    try {
      setSubmitting(true);

      const response = isEdit
        ? await invoiceService.update(invoice!.id, payload)
        : await invoiceService.create(payload);

      toast.success(
        isEdit ? "Invoice berhasil diperbarui" : "Invoice berhasil dibuat",
        {
          description: response.data.invoiceNo,
        },
      );

      router.push(`/internal/finance/invoices/${response.data.id}`);
      router.refresh();
    } catch (error) {
      toast.error(
        isEdit ? "Gagal memperbarui invoice" : "Gagal membuat invoice",
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
    <div className="space-y-6">
      <div className="grid gap-6 lg:grid-cols-[1fr_320px]">
        <div className="space-y-6">
          <div className="rounded-xl border p-5">
            <h2 className="mb-4 font-semibold">Informasi Invoice</h2>

            <div className="grid gap-4 md:grid-cols-2">
              <div className="space-y-2 md:col-span-2">
                <Label>Client</Label>

                <Select
                  value={form.clientId}
                  disabled={loadingReferences || isEdit}
                  onValueChange={(value) =>
                    setForm((prev) => ({
                      ...prev,
                      clientId: value,
                      contractId: "",
                      projectId: "",
                    }))
                  }>
                  <SelectTrigger>
                    <SelectValue placeholder="Pilih client" />
                  </SelectTrigger>

                  <SelectContent>
                    {clients.map((client) => (
                      <SelectItem key={client.id} value={client.id}>
                        {client.companyName} — {client.clientCode}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label>Contract</Label>

                <Select
                  value={form.contractId || "NONE"}
                  disabled={!form.clientId}
                  onValueChange={(value) =>
                    setForm((prev) => ({
                      ...prev,
                      contractId: value === "NONE" ? "" : value,
                    }))
                  }>
                  <SelectTrigger>
                    <SelectValue placeholder="Pilih contract" />
                  </SelectTrigger>

                  <SelectContent>
                    <SelectItem value="NONE">Tanpa Contract</SelectItem>

                    {contracts.map((contract) => (
                      <SelectItem key={contract.id} value={contract.id}>
                        {contract.contractNo} — {contract.title}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label>Project</Label>

                <Select
                  value={form.projectId || "NONE"}
                  disabled={!form.clientId}
                  onValueChange={(value) => {
                    const project = projects.find((item) => item.id === value);

                    setForm((prev) => ({
                      ...prev,
                      projectId: value === "NONE" ? "" : value,
                      contractId:
                        value !== "NONE" && project?.contractId
                          ? project.contractId
                          : prev.contractId,
                    }));
                  }}>
                  <SelectTrigger>
                    <SelectValue placeholder="Pilih project" />
                  </SelectTrigger>

                  <SelectContent>
                    <SelectItem value="NONE">Tanpa Project</SelectItem>

                    {projects.map((project) => (
                      <SelectItem key={project.id} value={project.id}>
                        {project.projectCode} — {project.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label>Tanggal Invoice</Label>

                <Input
                  type="date"
                  value={form.invoiceDate}
                  onChange={(event) =>
                    setForm((prev) => ({
                      ...prev,
                      invoiceDate: event.target.value,
                    }))
                  }
                />
              </div>

              <div className="space-y-2">
                <Label>Due Date</Label>

                <Input
                  type="date"
                  value={form.dueDate}
                  onChange={(event) =>
                    setForm((prev) => ({
                      ...prev,
                      dueDate: event.target.value,
                    }))
                  }
                />
              </div>

              <div className="space-y-2">
                <Label>Currency</Label>

                <Select
                  value={form.currency}
                  onValueChange={(value) =>
                    setForm((prev) => ({
                      ...prev,
                      currency: value,
                    }))
                  }>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>

                  <SelectContent>
                    <SelectItem value="IDR">IDR</SelectItem>
                    <SelectItem value="USD">USD</SelectItem>
                    <SelectItem value="SGD">SGD</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2 md:col-span-2">
                <Label>Catatan</Label>

                <Textarea
                  rows={4}
                  placeholder="Catatan invoice..."
                  value={form.notes}
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

          <div className="rounded-xl border p-5">
            <div className="mb-4 flex items-center justify-between">
              <div>
                <h2 className="font-semibold">Item Invoice</h2>

                <p className="text-sm text-muted-foreground">
                  Tambahkan item jasa atau pekerjaan yang ditagihkan.
                </p>
              </div>

              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={addItem}>
                <Plus className="size-4" />
                Tambah Item
              </Button>
            </div>

            <div className="space-y-4">
              {form.items.map((item, index) => {
                const lineTotal =
                  Number(item.quantity || 0) * Number(item.unitPrice || 0);

                return (
                  <div
                    key={index}
                    className="grid gap-3 rounded-lg border p-4 md:grid-cols-[1fr_120px_180px_180px_40px]">
                    <div className="space-y-2">
                      <Label>Deskripsi</Label>

                      <Input
                        value={item.description}
                        placeholder="Contoh: Google Ads Management"
                        onChange={(event) =>
                          updateItem(index, "description", event.target.value)
                        }
                      />
                    </div>

                    <div className="space-y-2">
                      <Label>Qty</Label>

                      <Input
                        type="number"
                        min="0.01"
                        step="0.01"
                        value={item.quantity}
                        onChange={(event) =>
                          updateItem(index, "quantity", event.target.value)
                        }
                      />
                    </div>

                    <div className="space-y-2">
                      <Label>Unit Price</Label>

                      <Input
                        type="number"
                        min="0"
                        step="0.01"
                        value={item.unitPrice}
                        onChange={(event) =>
                          updateItem(index, "unitPrice", event.target.value)
                        }
                      />
                    </div>

                    <div className="space-y-2">
                      <Label>Total</Label>

                      <div className="flex h-9 items-center rounded-md border bg-muted/30 px-3 text-sm font-medium">
                        {formatCurrency(lineTotal)}
                      </div>
                    </div>

                    <div className="flex items-end">
                      <Button
                        type="button"
                        variant="ghost"
                        size="icon"
                        disabled={form.items.length === 1}
                        onClick={() => removeItem(index)}>
                        <Trash2 className="size-4 text-destructive" />
                      </Button>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>

        <div className="space-y-4">
          <div className="sticky top-6 rounded-xl border p-5">
            <h2 className="mb-4 font-semibold">Ringkasan Invoice</h2>

            <div className="space-y-4">
              <div className="flex justify-between text-sm">
                <span className="text-muted-foreground">Subtotal</span>

                <span>{formatCurrency(subtotal)}</span>
              </div>

              <div className="space-y-2">
                <Label>Discount</Label>

                <Input
                  type="number"
                  min="0"
                  step="0.01"
                  value={form.discountAmount}
                  onChange={(event) =>
                    setForm((prev) => ({
                      ...prev,
                      discountAmount: event.target.value,
                    }))
                  }
                />
              </div>

              <div className="space-y-2">
                <Label>Tax</Label>

                <Input
                  type="number"
                  min="0"
                  step="0.01"
                  value={form.taxAmount}
                  onChange={(event) =>
                    setForm((prev) => ({
                      ...prev,
                      taxAmount: event.target.value,
                    }))
                  }
                />
              </div>

              <div className="border-t pt-4">
                <div className="flex items-center justify-between">
                  <span className="font-medium">Total</span>

                  <span className="text-xl font-semibold">
                    {formatCurrency(total)}
                  </span>
                </div>
              </div>

              <div className="flex flex-col gap-2 pt-2">
                <Button
                  disabled={submitting}
                  onClick={() => void handleSubmit()}>
                  {submitting
                    ? "Menyimpan..."
                    : isEdit
                      ? "Simpan Perubahan"
                      : "Buat Invoice"}
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
      </div>
    </div>
  );
}
