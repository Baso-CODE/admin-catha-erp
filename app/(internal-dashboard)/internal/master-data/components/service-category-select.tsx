"use client";

import { useEffect, useState } from "react";
import { toast } from "sonner";

import {
  serviceCategoryService,
  type ServiceCategoryItem,
} from "@/app/services/serviceCategory.service";

import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

interface Props {
  value?: string | null;
  onChange: (value: string) => void;
  open: boolean;
  disabled?: boolean;
  currentCategory?: {
    id: string;
    name: string;
    isActive: boolean;
  } | null;
}

export function ServiceCategorySelect({
  value,
  onChange,
  open,
  disabled = false,
  currentCategory,
}: Props) {
  const [categories, setCategories] = useState<ServiceCategoryItem[]>([]);

  const [loading, setLoading] = useState(false);
  const [loadError, setLoadError] = useState(false);

  useEffect(() => {
    if (!open) return;

    let active = true;

    setLoading(true);
    setLoadError(false);

    void serviceCategoryService
      .getAll()
      .then((response) => {
        if (active) {
          setCategories(response.data);
        }
      })
      .catch((error) => {
        if (!active) return;

        setLoadError(true);
        toast.error(
          error instanceof Error
            ? error.message
            : "Gagal mengambil service category.",
        );
      })
      .finally(() => {
        if (active) setLoading(false);
      });

    return () => {
      active = false;
    };
  }, [open]);

  const options = categories.filter(
    (category) => category.isActive || category.id === currentCategory?.id,
  );

  const showCurrentFallback =
    currentCategory && !options.some((item) => item.id === currentCategory.id);

  return (
    <div className="space-y-2">
      <Label>Service Category</Label>

      <Select
        value={value || "none"}
        onValueChange={(selected) =>
          onChange(selected === "none" ? "" : selected)
        }
        disabled={disabled || loading || loadError}>
        <SelectTrigger className="w-full">
          <SelectValue
            placeholder={loading ? "Memuat kategori..." : "Pilih kategori"}
          />
        </SelectTrigger>

        <SelectContent>
          <SelectItem value="none">Tanpa Kategori</SelectItem>

          {showCurrentFallback && currentCategory && (
            <SelectItem value={currentCategory.id}>
              {currentCategory.name}
              {!currentCategory.isActive && " (Tidak Aktif)"}
            </SelectItem>
          )}

          {options.map((category) => (
            <SelectItem key={category.id} value={category.id}>
              {category.name}
              {!category.isActive && " (Tidak Aktif)"}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>

      <p className="text-xs text-muted-foreground">
        {loadError
          ? "Kategori gagal dimuat. Buka ulang form untuk mencoba kembali."
          : "Kelompokkan service berdasarkan kategori layanan agency."}
      </p>
    </div>
  );
}
