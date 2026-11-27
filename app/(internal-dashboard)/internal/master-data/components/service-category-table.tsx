"use client";

import {
  FolderTree,
  Layers3,
  Loader2,
  Pencil,
  Plus,
  RefreshCw,
  Search,
  Tags,
} from "lucide-react";
import { useCallback, useEffect, useMemo, useState } from "react";
import { toast } from "sonner";

import {
  serviceCategoryService,
  type ServiceCategoryItem,
} from "@/app/services/serviceCategory.service";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Checkbox } from "@/components/ui/checkbox";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
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
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Textarea } from "@/components/ui/textarea";

interface Props {
  permissions: string[];
}

const INITIAL_FORM = {
  code: "",
  name: "",
  description: "",
  sortOrder: "0",
  isActive: true,
};

export function ServiceCategoryTable({ permissions }: Props) {
  const canCreate = permissions.includes("master.service.create");
  const canUpdate = permissions.includes("master.service.update");

  const [items, setItems] = useState<ServiceCategoryItem[]>([]);
  const [search, setSearch] = useState("");
  const [status, setStatus] = useState("all");
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState(false);

  const [open, setOpen] = useState(false);
  const [editing, setEditing] = useState<ServiceCategoryItem | null>(null);

  const [form, setForm] = useState(INITIAL_FORM);
  const [saving, setSaving] = useState(false);

  const loadData = useCallback(async () => {
    try {
      setLoading(true);
      setLoadError(false);

      const response = await serviceCategoryService.getAll();

      setItems(response.data);
    } catch (error) {
      setLoadError(true);

      toast.error("Gagal mengambil service category.", {
        description:
          error instanceof Error
            ? error.message
            : "Terjadi kesalahan pada server.",
      });
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void loadData();
  }, [loadData]);

  const metrics = useMemo(
    () => ({
      total: items.length,
      active: items.filter((item) => item.isActive).length,
      services: items.reduce(
        (sum, item) => sum + item._count.masterServices,
        0,
      ),
    }),
    [items],
  );

  const filteredItems = useMemo(() => {
    const keyword = search.trim().toLowerCase();

    return items.filter((item) => {
      const matchesSearch =
        !keyword ||
        [item.code, item.name, item.description ?? ""].some((value) =>
          value.toLowerCase().includes(keyword),
        );

      const matchesStatus =
        status === "all" || item.isActive === (status === "active");

      return matchesSearch && matchesStatus;
    });
  }, [items, search, status]);

  function openCreate() {
    setEditing(null);
    setForm(INITIAL_FORM);
    setOpen(true);
  }

  function openEdit(item: ServiceCategoryItem) {
    setEditing(item);
    setForm({
      code: item.code,
      name: item.name,
      description: item.description ?? "",
      sortOrder: String(item.sortOrder),
      isActive: item.isActive,
    });
    setOpen(true);
  }

  async function saveCategory() {
    if (saving || (editing ? !canUpdate : !canCreate)) return;

    const code = form.code.trim().toUpperCase();
    const name = form.name.trim();
    const sortOrder = Number(form.sortOrder);

    if (!/^[A-Z0-9_-]{2,50}$/.test(code)) {
      toast.error("Code harus terdiri dari 2–50 karakter yang valid.");
      return;
    }

    if (name.length < 2 || name.length > 150) {
      toast.error("Nama kategori harus terdiri dari 2–150 karakter.");
      return;
    }

    if (
      !form.sortOrder.trim() ||
      !Number.isInteger(sortOrder) ||
      sortOrder < 0 ||
      sortOrder > 9999
    ) {
      toast.error("Sort order harus berupa angka 0–9999.");
      return;
    }

    try {
      setSaving(true);

      const payload = {
        code,
        name,
        description: form.description.trim(),
        sortOrder,
        isActive: form.isActive,
      };

      if (editing) {
        await serviceCategoryService.update(editing.id, payload);
        toast.success("Service category berhasil diperbarui.");
      } else {
        await serviceCategoryService.create(payload);
        toast.success("Service category berhasil dibuat.");
      }

      setOpen(false);
      setEditing(null);
      setForm(INITIAL_FORM);

      await loadData();
    } catch (error) {
      toast.error("Gagal menyimpan kategori.", {
        description:
          error instanceof Error
            ? error.message
            : "Terjadi kesalahan pada server.",
      });
    } finally {
      setSaving(false);
    }
  }

  const cards = [
    {
      label: "Total Categories",
      value: metrics.total,
      icon: FolderTree,
    },
    {
      label: "Active Categories",
      value: metrics.active,
      icon: Tags,
    },
    {
      label: "Categorized Services",
      value: metrics.services,
      icon: Layers3,
    },
  ];

  return (
    <div className="space-y-6">
      <div className="grid gap-4 sm:grid-cols-3">
        {cards.map(({ label, value, icon: Icon }) => (
          <Card key={label}>
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">
                {label}
              </CardTitle>

              <Icon className="size-4 text-muted-foreground" />
            </CardHeader>

            <CardContent>
              <div className="text-2xl font-semibold tabular-nums">
                {loading || loadError ? "—" : value}
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      <div className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
        <div className="flex flex-1 flex-col gap-3 sm:flex-row">
          <div className="relative w-full sm:max-w-sm">
            <Search className="absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />

            <Input
              value={search}
              onChange={(event) => setSearch(event.target.value)}
              placeholder="Cari code atau nama kategori..."
              className="pl-9"
            />
          </div>

          <Select value={status} onValueChange={setStatus}>
            <SelectTrigger className="w-full sm:w-44">
              <SelectValue placeholder="Status" />
            </SelectTrigger>

            <SelectContent>
              <SelectItem value="all">Semua Status</SelectItem>
              <SelectItem value="active">Aktif</SelectItem>
              <SelectItem value="inactive">Tidak Aktif</SelectItem>
            </SelectContent>
          </Select>
        </div>

        <div className="flex gap-2">
          <Button
            variant="outline"
            disabled={loading}
            onClick={() => void loadData()}>
            <RefreshCw className={`size-4 ${loading ? "animate-spin" : ""}`} />
            Refresh
          </Button>

          {canCreate && (
            <Button onClick={openCreate}>
              <Plus className="size-4" />
              Tambah Kategori
            </Button>
          )}
        </div>
      </div>

      <div className="overflow-x-auto rounded-xl border">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Code</TableHead>
              <TableHead>Category</TableHead>
              <TableHead>Services</TableHead>
              <TableHead>Sort Order</TableHead>
              <TableHead>Status</TableHead>
              <TableHead className="text-right">Action</TableHead>
            </TableRow>
          </TableHeader>

          <TableBody>
            {loading || loadError || filteredItems.length === 0 ? (
              <TableRow>
                <TableCell
                  colSpan={6}
                  className="h-28 text-center text-muted-foreground">
                  {loading
                    ? "Memuat kategori..."
                    : loadError
                      ? "Gagal memuat kategori. Silakan refresh."
                      : "Service category belum tersedia pada filter ini."}
                </TableCell>
              </TableRow>
            ) : (
              filteredItems.map((item) => (
                <TableRow key={item.id}>
                  <TableCell className="font-mono text-xs">
                    {item.code}
                  </TableCell>

                  <TableCell>
                    <div className="min-w-40">
                      <p className="font-medium">{item.name}</p>

                      {item.description && (
                        <p className="max-w-sm truncate text-xs text-muted-foreground">
                          {item.description}
                        </p>
                      )}
                    </div>
                  </TableCell>

                  <TableCell>
                    <Badge variant="outline">
                      {item._count.masterServices} Services
                    </Badge>
                  </TableCell>

                  <TableCell>{item.sortOrder}</TableCell>

                  <TableCell>
                    <Badge variant={item.isActive ? "default" : "secondary"}>
                      {item.isActive ? "Aktif" : "Tidak Aktif"}
                    </Badge>
                  </TableCell>

                  <TableCell className="text-right">
                    {canUpdate ? (
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => openEdit(item)}>
                        <Pencil className="size-4" />
                        Edit
                      </Button>
                    ) : (
                      "—"
                    )}
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </div>

      <p className="text-sm text-muted-foreground">
        Menampilkan {filteredItems.length} dari {items.length} kategori.
      </p>

      <Dialog
        open={open}
        onOpenChange={(value) => {
          if (!saving) setOpen(value);
        }}>
        <DialogContent className="max-h-[90vh] overflow-y-auto sm:max-w-lg">
          <DialogHeader>
            <DialogTitle>
              {editing ? "Edit Service Category" : "Tambah Service Category"}
            </DialogTitle>

            <DialogDescription>
              Kelola pengelompokan layanan agency Catha.
            </DialogDescription>
          </DialogHeader>

          <form
            className="space-y-5"
            onSubmit={(event) => {
              event.preventDefault();
              void saveCategory();
            }}>
            <div className="space-y-2">
              <Label htmlFor="category-code">Category Code</Label>

              <Input
                id="category-code"
                value={form.code}
                disabled={saving}
                maxLength={50}
                placeholder="PERFORMANCE_INTELLIGENCE"
                onChange={(event) =>
                  setForm((current) => ({
                    ...current,
                    code: event.target.value.toUpperCase(),
                  }))
                }
                required
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="category-name">Nama Kategori</Label>

              <Input
                id="category-name"
                value={form.name}
                disabled={saving}
                maxLength={150}
                placeholder="Performance & Intelligence"
                onChange={(event) =>
                  setForm((current) => ({
                    ...current,
                    name: event.target.value,
                  }))
                }
                required
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="category-description">Deskripsi</Label>

              <Textarea
                id="category-description"
                value={form.description}
                disabled={saving}
                rows={4}
                maxLength={1000}
                placeholder="Deskripsi kategori layanan..."
                onChange={(event) =>
                  setForm((current) => ({
                    ...current,
                    description: event.target.value,
                  }))
                }
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="category-order">Sort Order</Label>

              <Input
                id="category-order"
                type="number"
                min={0}
                max={9999}
                step={1}
                value={form.sortOrder}
                disabled={saving}
                onChange={(event) =>
                  setForm((current) => ({
                    ...current,
                    sortOrder: event.target.value,
                  }))
                }
                required
              />

              <p className="text-xs text-muted-foreground">
                Angka lebih kecil ditampilkan lebih dahulu.
              </p>
            </div>

            <div className="flex items-center gap-3 rounded-lg border p-3">
              <Checkbox
                id="category-active"
                checked={form.isActive}
                disabled={saving}
                onCheckedChange={(checked) =>
                  setForm((current) => ({
                    ...current,
                    isActive: checked === true,
                  }))
                }
              />

              <div>
                <Label htmlFor="category-active">Kategori Aktif</Label>

                <p className="text-xs text-muted-foreground">
                  Kategori aktif dapat dipilih pada master service.
                </p>
              </div>
            </div>

            {editing && !form.isActive && (
              <p className="rounded-lg border bg-muted/40 p-3 text-xs text-muted-foreground">
                Menonaktifkan kategori tidak menghapus atau menonaktifkan
                service yang sudah terhubung.
              </p>
            )}

            <DialogFooter>
              <Button
                type="button"
                variant="outline"
                disabled={saving}
                onClick={() => setOpen(false)}>
                Batal
              </Button>

              <Button type="submit" disabled={saving}>
                {saving && <Loader2 className="size-4 animate-spin" />}

                {editing ? "Simpan Perubahan" : "Simpan Kategori"}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
}
