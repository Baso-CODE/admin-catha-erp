"use client";

import { profitabilityService } from "@/app/services/profitability.service";
import type {
  ProjectBudget,
  ProjectCost,
  ProjectCostCategory,
  ProjectServiceProfitability,
} from "@/app/types/profitability.type";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  ArrowLeft,
  Loader2,
  Pencil,
  Plus,
  RefreshCw,
  Trash2,
  X,
} from "lucide-react";
import Link from "next/link";
import { useCallback, useEffect, useState } from "react";
import { toast } from "sonner";

type EntryType = "budget" | "cost";
type Entry = ProjectBudget | ProjectCost;

interface Props {
  projectId: string;
  type: EntryType;
  canCreate: boolean;
  canUpdate: boolean;
  canDelete: boolean;
}

const CATEGORIES: { value: ProjectCostCategory; label: string }[] = [
  { value: "PERSONNEL", label: "Personnel" },
  { value: "FREELANCER", label: "Freelancer" },
  { value: "ADVERTISING", label: "Advertising" },
  { value: "SOFTWARE", label: "Software" },
  { value: "PRODUCTION", label: "Production" },
  { value: "VENDOR", label: "Vendor" },
  { value: "OPERATIONAL", label: "Operational" },
  { value: "OTHER", label: "Other" },
];

type FormValues = {
  category: ProjectCostCategory;
  projectServiceId: string;
  description: string;
  amount: string;
  currency: string;
  notes: string;
  costDate: string;
  reference: string;
};

function emptyForm(currency = "IDR"): FormValues {
  return {
    category: "OTHER",
    projectServiceId: "",
    description: "",
    amount: "",
    currency,
    notes: "",
    costDate: new Date().toLocaleDateString("en-CA"),
    reference: "",
  };
}

function formatMoney(value: string, currency: string) {
  const amount = Number(value);
  if (!Number.isFinite(amount)) return `${currency} ${value}`;
  try {
    return new Intl.NumberFormat("id-ID", {
      style: "currency",
      currency,
      maximumFractionDigits: 2,
    }).format(amount);
  } catch {
    return `${currency} ${value}`;
  }
}

export default function ProjectFinancialEntries({
  projectId,
  type,
  canCreate,
  canUpdate,
  canDelete,
}: Props) {
  const isCost = type === "cost";
  const title = isCost ? "Actual Cost" : "Project Budget";
  const baseUrl = `/internal/finance/profitability/${projectId}`;

  const [entries, setEntries] = useState<Entry[]>([]);
  const [services, setServices] = useState<
    ProjectServiceProfitability["services"]
  >([]);
  const [currency, setCurrency] = useState("IDR");
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [total, setTotal] = useState(0);
  const [category, setCategory] = useState("ALL");
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [formOpen, setFormOpen] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [form, setForm] = useState<FormValues>(emptyForm());
  const [refreshKey, setRefreshKey] = useState(0);

  const updateForm = <K extends keyof FormValues>(
    key: K,
    value: FormValues[K],
  ) => setForm((prev) => ({ ...prev, [key]: value }));

  const loadData = useCallback(async () => {
    setLoading(true);

    try {
      const params = {
        projectId,
        category:
          category === "ALL" ? undefined : (category as ProjectCostCategory),
        page,
        limit: 10,
      };

      const [listResult, serviceResult] = await Promise.all([
        isCost
          ? profitabilityService.getCosts(params)
          : profitabilityService.getBudgets(params),
        profitabilityService.getProjectServices(projectId),
      ]);

      setEntries(listResult.data);
      setTotal(listResult.meta.total);
      setTotalPages(listResult.meta.totalPages);
      setServices(serviceResult.data.services);

      const projectCurrency = serviceResult.data.currency;
      if (projectCurrency) setCurrency(projectCurrency);
    } catch (error) {
      toast.error(
        error instanceof Error ? error.message : "Gagal mengambil data.",
      );
    } finally {
      setLoading(false);
    }
  }, [projectId, isCost, category, page, refreshKey]);

  useEffect(() => {
    void loadData();
  }, [loadData]);

  const resetForm = () => {
    setEditingId(null);
    setForm(emptyForm(currency));
    setFormOpen(false);
  };

  const openCreate = () => {
    setEditingId(null);
    setForm(emptyForm(currency));
    setFormOpen(true);
  };

  const openEdit = (item: Entry) => {
    setEditingId(item.id);
    setForm({
      category: item.category,
      projectServiceId: item.projectServiceId ?? "",
      description: item.description,
      amount: item.amount,
      currency: item.currency,
      notes: item.notes ?? "",
      costDate:
        "costDate" in item
          ? item.costDate.slice(0, 10)
          : new Date().toLocaleDateString("en-CA"),
      reference: "reference" in item ? (item.reference ?? "") : "",
    });
    setFormOpen(true);
  };

  const handleSave = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();

    const description = form.description.trim();
    const amount = form.amount.trim();

    if (!description || !/^(?:0|[1-9]\d*)(?:\.\d{1,2})?$/.test(amount)) {
      toast.error("Periksa deskripsi dan format nominal.");
      return;
    }

    if (Number(amount) <= 0) {
      toast.error("Nominal harus lebih besar dari nol.");
      return;
    }

    setSaving(true);

    try {
      const common = {
        category: form.category,
        projectServiceId: form.projectServiceId || undefined,
        description,
        amount,
        currency: form.currency.trim().toUpperCase(),
        notes: form.notes.trim() || undefined,
      };

      if (isCost) {
        const payload = {
          ...common,
          costDate: form.costDate,
          reference: form.reference.trim() || undefined,
        };

        if (editingId) {
          await profitabilityService.updateCost(editingId, payload);
        } else {
          await profitabilityService.createCost({
            ...payload,
            projectId,
          });
        }
      } else {
        if (editingId) {
          await profitabilityService.updateBudget(editingId, common);
        } else {
          await profitabilityService.createBudget({
            ...common,
            projectId,
          });
        }
      }

      toast.success(`${title} berhasil disimpan.`);
      resetForm();
      setRefreshKey((value) => value + 1);
    } catch (error) {
      toast.error(
        error instanceof Error ? error.message : "Gagal menyimpan data.",
      );
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (item: Entry) => {
    if (!confirm(`Hapus ${title} "${item.description}"?`)) return;

    try {
      if (isCost) {
        await profitabilityService.deleteCost(item.id);
      } else {
        await profitabilityService.deleteBudget(item.id);
      }

      toast.success(`${title} berhasil dihapus.`);
      if (entries.length === 1 && page > 1) {
        setPage((value) => value - 1);
      } else {
        setRefreshKey((value) => value + 1);
      }
    } catch (error) {
      toast.error(
        error instanceof Error ? error.message : "Gagal menghapus data.",
      );
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-start gap-3">
          <Button size="icon" variant="outline" asChild>
            <Link href={baseUrl} aria-label="Kembali ke Project">
              <ArrowLeft className="size-4" />
            </Link>
          </Button>
          <div>
            <h1 className="text-2xl font-semibold">{title}</h1>
            <p className="text-sm text-muted-foreground">
              Kelola {isCost ? "biaya aktual" : "anggaran"} Project.
            </p>
          </div>
        </div>

        <div className="flex gap-2">
          <Button
            variant="outline"
            disabled={loading}
            onClick={() => setRefreshKey((value) => value + 1)}>
            <RefreshCw className="size-4" />
            Refresh
          </Button>
          {canCreate && (
            <Button onClick={openCreate}>
              <Plus className="size-4" />
              Tambah {title}
            </Button>
          )}
        </div>
      </div>

      {formOpen && (
        <form
          onSubmit={handleSave}
          className="space-y-4 rounded-xl border bg-card p-5">
          <div className="flex items-center justify-between">
            <h2 className="font-semibold">
              {editingId ? `Edit ${title}` : `Tambah ${title}`}
            </h2>
            <Button
              type="button"
              size="icon"
              variant="ghost"
              onClick={resetForm}
              disabled={saving}>
              <X className="size-4" />
            </Button>
          </div>

          <div className="grid gap-4 sm:grid-cols-2">
            <div className="space-y-2">
              <label className="text-sm font-medium">Kategori</label>
              <Select
                value={form.category}
                onValueChange={(value) =>
                  updateForm("category", value as ProjectCostCategory)
                }>
                <SelectTrigger className="w-full">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {CATEGORIES.map((option) => (
                    <SelectItem key={option.value} value={option.value}>
                      {option.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <label className="text-sm font-medium">Project Service</label>
              <Select
                value={form.projectServiceId || "UNALLOCATED"}
                onValueChange={(value) =>
                  updateForm(
                    "projectServiceId",
                    value === "UNALLOCATED" ? "" : value,
                  )
                }>
                <SelectTrigger className="w-full">
                  <SelectValue placeholder="Pilih Service" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="UNALLOCATED">
                    Biaya umum / tanpa Service
                  </SelectItem>
                  {services.map((service) => (
                    <SelectItem
                      key={service.projectServiceId}
                      value={service.projectServiceId}>
                      {service.serviceName}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2 sm:col-span-2">
              <label className="text-sm font-medium">Deskripsi</label>
              <Input
                required
                value={form.description}
                onChange={(event) =>
                  updateForm("description", event.target.value)
                }
                placeholder="Contoh: Biaya desain konten Instagram"
              />
            </div>

            <div className="space-y-2">
              <label className="text-sm font-medium">Nominal</label>
              <Input
                required
                inputMode="decimal"
                value={form.amount}
                onChange={(event) => updateForm("amount", event.target.value)}
                placeholder="1500000.00"
              />
              <p className="text-xs text-muted-foreground">
                Gunakan titik untuk desimal, tanpa pemisah ribuan.
              </p>
            </div>

            <div className="space-y-2">
              <label className="text-sm font-medium">Currency</label>
              <Input
                required
                maxLength={3}
                value={form.currency}
                onChange={(event) =>
                  updateForm("currency", event.target.value.toUpperCase())
                }
                placeholder="IDR"
              />
            </div>

            {isCost && (
              <>
                <div className="space-y-2">
                  <label className="text-sm font-medium">Tanggal Biaya</label>
                  <Input
                    type="date"
                    required
                    value={form.costDate}
                    onChange={(event) =>
                      updateForm("costDate", event.target.value)
                    }
                  />
                </div>

                <div className="space-y-2">
                  <label className="text-sm font-medium">Referensi</label>
                  <Input
                    value={form.reference}
                    onChange={(event) =>
                      updateForm("reference", event.target.value)
                    }
                    placeholder="Nomor kuitansi / referensi"
                  />
                </div>
              </>
            )}

            <div className="space-y-2 sm:col-span-2">
              <label className="text-sm font-medium">Catatan</label>
              <textarea
                value={form.notes}
                onChange={(event) => updateForm("notes", event.target.value)}
                rows={3}
                className="w-full rounded-md border bg-background px-3 py-2 text-sm"
                placeholder="Catatan tambahan (opsional)"
              />
            </div>
          </div>

          <div className="flex justify-end gap-2">
            <Button
              type="button"
              variant="outline"
              onClick={resetForm}
              disabled={saving}>
              Batal
            </Button>
            <Button type="submit" disabled={saving}>
              {saving && <Loader2 className="size-4 animate-spin" />}
              Simpan
            </Button>
          </div>
        </form>
      )}

      <div className="rounded-xl border bg-card">
        <div className="flex flex-wrap items-center justify-between gap-3 border-b p-4">
          <div>
            <h2 className="font-semibold">Daftar {title}</h2>
            <p className="text-xs text-muted-foreground">
              {total} entri ditemukan
            </p>
          </div>

          <Select
            value={category}
            onValueChange={(value) => {
              setCategory(value);
              setPage(1);
            }}>
            <SelectTrigger className="w-48">
              <SelectValue placeholder="Kategori" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="ALL">Semua Kategori</SelectItem>
              {CATEGORIES.map((option) => (
                <SelectItem key={option.value} value={option.value}>
                  {option.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="bg-muted/40">
              <tr>
                <th className="px-4 py-3 text-left">Deskripsi</th>
                <th className="px-4 py-3 text-left">Kategori</th>
                <th className="px-4 py-3 text-left">Service</th>
                {isCost && <th className="px-4 py-3 text-left">Tanggal</th>}
                <th className="px-4 py-3 text-right">Nominal</th>
                <th className="px-4 py-3 text-right">Aksi</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr>
                  <td
                    colSpan={isCost ? 6 : 5}
                    className="p-10 text-center text-muted-foreground">
                    <Loader2 className="mx-auto size-5 animate-spin" />
                  </td>
                </tr>
              ) : entries.length === 0 ? (
                <tr>
                  <td
                    colSpan={isCost ? 6 : 5}
                    className="p-10 text-center text-muted-foreground">
                    Belum ada data {title}.
                  </td>
                </tr>
              ) : (
                entries.map((item) => (
                  <tr key={item.id} className="border-t">
                    <td className="px-4 py-3">
                      <p className="font-medium">{item.description}</p>
                      {item.notes && (
                        <p className="mt-1 text-xs text-muted-foreground">
                          {item.notes}
                        </p>
                      )}
                    </td>
                    <td className="px-4 py-3">
                      <Badge variant="secondary">
                        {item.category.replaceAll("_", " ")}
                      </Badge>
                    </td>
                    <td className="px-4 py-3">
                      {services.find(
                        (service) =>
                          service.projectServiceId === item.projectServiceId,
                      )?.serviceName ?? "Biaya Umum"}
                    </td>
                    {isCost && (
                      <td className="px-4 py-3">
                        {"costDate" in item
                          ? new Date(item.costDate).toLocaleDateString("id-ID")
                          : "-"}
                      </td>
                    )}
                    <td className="px-4 py-3 text-right whitespace-nowrap">
                      {formatMoney(item.amount, item.currency)}
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex justify-end gap-1">
                        {canUpdate && (
                          <Button
                            size="icon"
                            variant="ghost"
                            onClick={() => openEdit(item)}
                            aria-label="Edit">
                            <Pencil className="size-4" />
                          </Button>
                        )}
                        {canDelete && (
                          <Button
                            size="icon"
                            variant="ghost"
                            onClick={() => void handleDelete(item)}
                            aria-label="Hapus">
                            <Trash2 className="size-4 text-destructive" />
                          </Button>
                        )}
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        <div className="flex items-center justify-between border-t p-4">
          <span className="text-sm text-muted-foreground">
            Halaman {page} dari {Math.max(totalPages, 1)}
          </span>
          <div className="flex gap-2">
            <Button
              size="sm"
              variant="outline"
              disabled={loading || page <= 1}
              onClick={() => setPage((value) => value - 1)}>
              Sebelumnya
            </Button>
            <Button
              size="sm"
              variant="outline"
              disabled={loading || page >= totalPages}
              onClick={() => setPage((value) => value + 1)}>
              Berikutnya
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}
