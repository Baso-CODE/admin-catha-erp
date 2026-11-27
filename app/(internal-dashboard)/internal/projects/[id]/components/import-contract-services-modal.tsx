"use client";

import { Download, FolderTree, Loader2, Search, Workflow } from "lucide-react";

import { useEffect, useId, useMemo, useState } from "react";

import { toast } from "sonner";

import {
  projectServiceService,
  type ContractHandoffData,
  type ContractHandoffItem,
} from "@/app/services/projectService.service";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
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

interface Props {
  projectId: string;
  contractId: string;
  onSuccess?: () => void | Promise<void>;
}

interface ServiceGroup {
  id: string;
  name: string;
  sortOrder: number;
  items: ContractHandoffItem[];
}

export function ImportContractServicesModal({
  projectId,
  contractId,
  onSuccess,
}: Props) {
  const inputId = useId();

  const [open, setOpen] = useState(false);

  const [data, setData] = useState<ContractHandoffData | null>(null);

  const [selectedIds, setSelectedIds] = useState<string[]>([]);

  const [search, setSearch] = useState("");
  const [loading, setLoading] = useState(true);
  const [importing, setImporting] = useState(false);
  const [loadError, setLoadError] = useState(false);
  const [retryKey, setRetryKey] = useState(0);

  useEffect(() => {
    if (!open) return;

    let active = true;

    async function loadHandoff() {
      try {
        setLoading(true);
        setLoadError(false);
        setData(null);
        setSelectedIds([]);

        const response = await projectServiceService.getContractHandoff(
          projectId,
          contractId,
        );

        if (!active) return;

        setData(response.data);
      } catch (error) {
        if (!active) return;

        setLoadError(true);

        toast.error("Gagal mengambil layanan contract.", {
          description:
            error instanceof Error
              ? error.message
              : "Terjadi kesalahan pada server.",
        });
      } finally {
        if (active) setLoading(false);
      }
    }

    void loadHandoff();

    return () => {
      active = false;
    };
  }, [open, projectId, contractId, retryKey]);

  const availableIds = useMemo(
    () =>
      (data?.items ?? [])
        .filter((item) => item.availability === "AVAILABLE")
        .map((item) => item.masterServiceId),
    [data],
  );

  const groups = useMemo(() => {
    const result = new Map<string, ServiceGroup>();

    const keyword = search.trim().toLowerCase();

    for (const item of data?.items ?? []) {
      const categoryName = item.categoryNameSnapshot ?? "Uncategorized";

      const matches =
        !keyword ||
        [
          item.serviceNameSnapshot,
          item.serviceCodeSnapshot,
          item.currentServiceName,
          categoryName,
        ].some((value) => value.toLowerCase().includes(keyword));

      if (!matches) continue;

      const groupId = JSON.stringify([
        item.categoryIdSnapshot,
        item.categoryNameSnapshot,
      ]);

      let group = result.get(groupId);

      if (!group) {
        group = {
          id: groupId,
          name: categoryName,

          sortOrder: item.categorySortOrderSnapshot ?? Number.MAX_SAFE_INTEGER,

          items: [],
        };

        result.set(groupId, group);
      }

      group.items.push(item);
    }

    return Array.from(result.values()).sort(
      (a, b) => a.sortOrder - b.sortOrder || a.name.localeCompare(b.name),
    );
  }, [data, search]);

  function handleOpenChange(value: boolean) {
    if (importing) return;

    setOpen(value);

    if (value) {
      setData(null);
      setSelectedIds([]);
      setSearch("");
      setLoadError(false);
      setLoading(true);
    }
  }

  function toggleService(item: ContractHandoffItem, checked: boolean) {
    if (
      importing ||
      loading ||
      !data?.canImport ||
      item.availability !== "AVAILABLE"
    ) {
      return;
    }

    setSelectedIds((current) => {
      if (checked) {
        if (current.includes(item.masterServiceId) || current.length >= 100) {
          return current;
        }

        return [...current, item.masterServiceId];
      }

      return current.filter((id) => id !== item.masterServiceId);
    });
  }

  function selectAll() {
    if (importing || loading || !data?.canImport) {
      return;
    }

    setSelectedIds(availableIds.slice(0, 100));
  }

  async function handleImport() {
    if (
      importing ||
      loading ||
      loadError ||
      !data?.canImport ||
      selectedIds.length === 0
    ) {
      return;
    }

    try {
      setImporting(true);

      const response = await projectServiceService.importContractServices(
        projectId,
        contractId,
        selectedIds,
      );

      const result = response.data;

      toast.success(
        result.createdCount > 0
          ? "Contract service berhasil di-import."
          : "Service yang dipilih sudah tersedia.",
        {
          description:
            `${result.createdCount} service dibuat, ` +
            `${result.workflowCreated} workflow dibuat, ` +
            `${result.skippedCount} service dilewati.`,
        },
      );

      setOpen(false);
      setSelectedIds([]);
    } catch (error) {
      toast.error("Gagal mengimpor contract service.", {
        description:
          error instanceof Error
            ? error.message
            : "Terjadi kesalahan pada server.",
      });

      setRetryKey((current) => current + 1);
      return;
    } finally {
      setImporting(false);
    }

    try {
      await onSuccess?.();
    } catch {
      toast.error("Import berhasil, tetapi halaman gagal diperbarui.");
    }
  }

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogTrigger asChild>
        <Button variant="outline">
          <Download className="size-4" />
          Import from Contract
        </Button>
      </DialogTrigger>

      <DialogContent className="max-h-[90vh] overflow-y-auto sm:max-w-2xl">
        <DialogHeader>
          <DialogTitle>Import Contract Services</DialogTitle>

          <DialogDescription>
            Pilih layanan yang disepakati dalam contract untuk dikerjakan pada
            project ini.
          </DialogDescription>
        </DialogHeader>

        {loading ? (
          <div className="flex min-h-40 items-center justify-center gap-2 text-sm text-muted-foreground">
            <Loader2 className="size-5 animate-spin" />
            Memuat layanan contract...
          </div>
        ) : loadError || !data ? (
          <div className="space-y-3 rounded-lg border p-6 text-center">
            <p className="text-sm text-muted-foreground">
              Gagal memuat layanan contract.
            </p>

            <Button
              variant="outline"
              onClick={() => setRetryKey((current) => current + 1)}>
              Coba Lagi
            </Button>
          </div>
        ) : (
          <div className="space-y-4">
            <div className="rounded-lg border bg-muted/30 p-4">
              <div className="flex items-start justify-between gap-3">
                <div>
                  <p className="font-medium">{data.contract.title}</p>

                  <p className="mt-1 font-mono text-xs text-muted-foreground">
                    {data.contract.contractNo}
                  </p>
                </div>

                <Badge variant="outline">{data.contract.status}</Badge>
              </div>

              <div className="mt-4 grid grid-cols-2 gap-3 sm:grid-cols-4">
                {[
                  {
                    label: "Contract Services",
                    value: data.summary.total,
                  },
                  {
                    label: "Available",
                    value: data.summary.available,
                  },
                  {
                    label: "Already Added",
                    value: data.summary.alreadyAdded,
                  },
                  {
                    label: "Inactive",
                    value: data.summary.inactive,
                  },
                ].map((item) => (
                  <div key={item.label}>
                    <p className="text-xs text-muted-foreground">
                      {item.label}
                    </p>

                    <p className="mt-1 text-xl font-semibold tabular-nums">
                      {item.value}
                    </p>
                  </div>
                ))}
              </div>
            </div>

            {!data.canImport && (
              <div className="rounded-lg border bg-muted/30 p-3 text-sm text-muted-foreground">
                Import membutuhkan Contract Active dan Project yang belum
                Completed atau Cancelled.
              </div>
            )}

            <div className="relative">
              <Search className="absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />

              <Input
                value={search}
                disabled={importing}
                onChange={(event) => setSearch(event.target.value)}
                placeholder="Cari layanan atau kategori..."
                className="pl-9"
              />
            </div>

            <div className="flex flex-wrap items-center justify-between gap-2">
              <p className="text-sm text-muted-foreground">
                {selectedIds.length} service dipilih
              </p>

              <div className="flex gap-2">
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  disabled={importing || selectedIds.length === 0}
                  onClick={() => setSelectedIds([])}>
                  Kosongkan
                </Button>

                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  disabled={
                    importing || !data.canImport || availableIds.length === 0
                  }
                  onClick={selectAll}>
                  Pilih Semua
                </Button>
              </div>
            </div>

            <div className="max-h-80 overflow-y-auto rounded-lg border">
              {groups.length === 0 ? (
                <p className="p-6 text-center text-sm text-muted-foreground">
                  {data.items.length === 0
                    ? "Contract ini belum memiliki daftar layanan."
                    : "Tidak ada layanan yang sesuai pencarian."}
                </p>
              ) : (
                groups.map((group) => (
                  <div key={group.id}>
                    <div className="sticky top-0 z-10 flex items-center gap-2 border-b bg-muted px-3 py-2.5">
                      <FolderTree className="size-4 text-muted-foreground" />

                      <p className="text-xs font-semibold">{group.name}</p>
                    </div>

                    <div className="divide-y">
                      {group.items.map((item) => {
                        const checkboxId = `${inputId}-${item.id}`;

                        const checked = selectedIds.includes(
                          item.masterServiceId,
                        );

                        const unavailable = item.availability !== "AVAILABLE";

                        return (
                          <div
                            key={item.id}
                            className="flex items-start gap-3 p-3">
                            <Checkbox
                              id={checkboxId}
                              checked={checked}
                              disabled={
                                importing ||
                                !data.canImport ||
                                unavailable ||
                                (!checked && selectedIds.length >= 100)
                              }
                              onCheckedChange={(value) =>
                                toggleService(item, value === true)
                              }
                            />

                            <div className="min-w-0 flex-1 space-y-1">
                              <Label htmlFor={checkboxId}>
                                {item.serviceNameSnapshot}
                              </Label>

                              <p className="font-mono text-xs text-muted-foreground">
                                {item.serviceCodeSnapshot}
                              </p>

                              {item.currentServiceName !==
                                item.serviceNameSnapshot && (
                                <p className="text-xs text-muted-foreground">
                                  Nama saat ini: {item.currentServiceName}
                                </p>
                              )}

                              <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
                                <Workflow className="size-3.5" />

                                {item.workflowTemplate?.name ??
                                  "Tanpa default workflow"}
                              </div>
                            </div>

                            {item.availability === "ALREADY_ADDED" && (
                              <Badge variant="secondary">
                                Sudah Ditambahkan
                              </Badge>
                            )}

                            {item.availability === "INACTIVE" && (
                              <Badge variant="outline">Inactive</Badge>
                            )}
                          </div>
                        );
                      })}
                    </div>
                  </div>
                ))
              )}
            </div>

            <p className="text-xs text-muted-foreground">
              Workflow menggunakan template Master Service saat ini. Periode
              setiap layanan dapat diatur setelah proses import.
            </p>
          </div>
        )}

        <DialogFooter>
          <Button
            type="button"
            variant="outline"
            disabled={importing}
            onClick={() => handleOpenChange(false)}>
            Batal
          </Button>

          <Button
            type="button"
            disabled={
              loading ||
              importing ||
              loadError ||
              !data?.canImport ||
              selectedIds.length === 0
            }
            onClick={() => void handleImport()}>
            {importing ? (
              <Loader2 className="size-4 animate-spin" />
            ) : (
              <Download className="size-4" />
            )}
            Import {selectedIds.length} Services
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
