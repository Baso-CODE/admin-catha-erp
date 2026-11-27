"use client";

import { FolderTree, Loader2, Search } from "lucide-react";
import { useEffect, useId, useMemo, useState } from "react";

import {
  quotationService,
  type QuotationServiceLine,
  type QuotationServiceOption,
} from "@/app/services/crm/quotation.service";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

interface Props {
  open: boolean;
  leadId?: string;
  quotationId?: string;
  value: string[];
  onChange: (value: string[]) => void;
  onReady: (ready: boolean) => void;
  existingItems?: QuotationServiceLine[];
  disabled?: boolean;
}

interface PickerGroup {
  id: string;
  name: string;
  sortOrder: number;
  services: QuotationServiceOption[];
}

export function QuotationServicePicker({
  open,
  leadId,
  quotationId,
  value,
  onChange,
  onReady,
  existingItems,
  disabled = false,
}: Props) {
  const inputId = useId();

  const [options, setOptions] = useState<QuotationServiceOption[]>([]);

  const [search, setSearch] = useState("");
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState(false);
  const [retryKey, setRetryKey] = useState(0);

  useEffect(() => {
    if (!open) return;

    let active = true;

    setOptions([]);
    setSearch("");
    setLoading(true);
    setLoadError(false);
    onReady(false);

    async function loadOptions() {
      try {
        const response = quotationId
          ? await quotationService.getEditServiceOptions(quotationId)
          : leadId
            ? await quotationService.getCreateServiceOptions(leadId)
            : null;

        if (!response) {
          throw new Error("Referensi quotation tidak tersedia.");
        }

        if (!active) return;

        setOptions(response.data);
        onReady(true);
      } catch {
        if (!active) return;

        setLoadError(true);
        onReady(false);
      } finally {
        if (active) setLoading(false);
      }
    }

    void loadOptions();

    return () => {
      active = false;
    };
  }, [open, leadId, quotationId, retryKey, onReady]);

  const groups = useMemo(() => {
    const merged = new Map(options.map((option) => [option.id, option]));

    // Pertahankan nama dan kategori dari snapshot existing.
    // Termasuk layanan lama yang sudah tidak aktif.
    for (const item of existingItems ?? []) {
      const catalogItem = merged.get(item.masterServiceId);

      merged.set(item.masterServiceId, {
        id: item.masterServiceId,
        code: item.serviceCodeSnapshot,
        name: item.serviceNameSnapshot,
        description: item.serviceDescriptionSnapshot,

        category: item.categoryIdSnapshot
          ? {
              id: item.categoryIdSnapshot,
              code: item.categoryCodeSnapshot ?? "",
              name: item.categoryNameSnapshot ?? "Uncategorized",
              sortOrder:
                item.categorySortOrderSnapshot ?? Number.MAX_SAFE_INTEGER,
              isActive: catalogItem?.category?.isActive ?? true,
            }
          : null,
      });
    }

    const keyword = search.trim().toLowerCase();

    const result = new Map<string, PickerGroup>();

    for (const service of merged.values()) {
      const category = service.category;

      const matches =
        !keyword ||
        [service.code, service.name, category?.name ?? "Uncategorized"].some(
          (part) => part.toLowerCase().includes(keyword),
        );

      if (!matches) continue;

      const groupId = category
        ? JSON.stringify([category.id, category.name])
        : "uncategorized";

      let group = result.get(groupId);

      if (!group) {
        group = {
          id: groupId,
          name: category?.name ?? "Uncategorized",
          sortOrder: category?.sortOrder ?? Number.MAX_SAFE_INTEGER,
          services: [],
        };

        result.set(groupId, group);
      }

      group.services.push(service);
    }

    return Array.from(result.values())
      .map((group) => ({
        ...group,
        services: group.services.sort((a, b) => a.name.localeCompare(b.name)),
      }))
      .sort(
        (a, b) => a.sortOrder - b.sortOrder || a.name.localeCompare(b.name),
      );
  }, [options, existingItems, search]);

  function toggleService(serviceId: string, checked: boolean) {
    if (disabled || loading || loadError) return;

    if (checked) {
      if (value.includes(serviceId)) return;

      if (value.length >= 100) return;

      onChange([...value, serviceId]);
    } else {
      onChange(value.filter((id) => id !== serviceId));
    }
  }

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between gap-2">
        <Label htmlFor={inputId}>Layanan yang Ditawarkan</Label>

        <Badge variant="secondary">{value.length} dipilih</Badge>
      </div>

      <div className="relative">
        <Search className="absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />

        <Input
          id={inputId}
          value={search}
          disabled={disabled || loading || loadError}
          onChange={(event) => setSearch(event.target.value)}
          placeholder="Cari layanan atau kategori..."
          className="pl-9"
        />
      </div>

      <div className="max-h-80 overflow-y-auto rounded-lg border">
        {loading ? (
          <div className="flex items-center justify-center gap-2 p-6 text-sm text-muted-foreground">
            <Loader2 className="size-4 animate-spin" />
            Memuat layanan...
          </div>
        ) : loadError ? (
          <div className="space-y-3 p-5 text-center">
            <p className="text-sm text-muted-foreground">
              Gagal memuat katalog layanan.
            </p>

            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={() => setRetryKey((current) => current + 1)}>
              Coba Lagi
            </Button>
          </div>
        ) : groups.length === 0 ? (
          <p className="p-6 text-center text-sm text-muted-foreground">
            Tidak ada layanan yang tersedia.
          </p>
        ) : (
          groups.map((group) => (
            <div key={group.id}>
              <div className="sticky top-0 z-10 flex items-center gap-2 border-b bg-muted px-3 py-2">
                <FolderTree className="size-4 text-muted-foreground" />

                <p className="text-xs font-semibold">{group.name}</p>
              </div>

              <div className="divide-y">
                {group.services.map((service) => {
                  const checked = value.includes(service.id);

                  const checkboxId = `${inputId}-${service.id}`;

                  const isLegacy = !options.some(
                    (option) => option.id === service.id,
                  );

                  return (
                    <div
                      key={service.id}
                      className="flex items-start gap-3 p-3 hover:bg-muted/20">
                      <Checkbox
                        id={checkboxId}
                        checked={checked}
                        disabled={disabled || (!checked && value.length >= 100)}
                        onCheckedChange={(next) =>
                          toggleService(service.id, next === true)
                        }
                      />

                      <Label
                        htmlFor={checkboxId}
                        className="min-w-0 flex-1 cursor-pointer items-start">
                        <div className="space-y-1">
                          <p className="text-sm font-medium">{service.name}</p>

                          <p className="font-mono text-xs text-muted-foreground">
                            {service.code}
                          </p>

                          {isLegacy && (
                            <p className="text-xs text-muted-foreground">
                              Layanan existing yang sudah tidak tersedia di
                              katalog aktif.
                            </p>
                          )}
                        </div>
                      </Label>
                    </div>
                  );
                })}
              </div>
            </div>
          ))
        )}
      </div>

      <p className="text-xs text-muted-foreground">
        Pilih layanan dari satu atau beberapa kategori. Amount quotation tetap
        merupakan total harga paket.
      </p>
    </div>
  );
}
