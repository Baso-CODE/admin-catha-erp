"use client";

import { clientService } from "@/app/services/client.service";
import { userService } from "@/app/services/userManagement.service";
import { Button } from "@/components/ui/button";
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from "@/components/ui/command";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { Check, ChevronsUpDown, Loader2 } from "lucide-react";
import { useDeferredValue, useEffect, useMemo, useState } from "react";

type EntityType = "client" | "manager";
type Option = { id: string; label: string; description?: string };
type OptionsResult = {
  key: string;
  items: Option[];
  page: number;
  hasMore: boolean;
  error: boolean;
};
type DetailResult = {
  key: string;
  option: Option | null;
  error: boolean;
};

interface Props {
  type: EntityType;
  value: string;
  onChange: (value: string) => void;
  disabled?: boolean;
}

const LIMIT = 20;

export default function ProjectReportEntitySelect({
  type,
  value,
  onChange,
  disabled = false,
}: Props) {
  const [open, setOpen] = useState(false);
  const [search, setSearch] = useState("");
  const deferredSearch = useDeferredValue(search);
  const [page, setPage] = useState(1);
  const [result, setResult] = useState<OptionsResult>({
    key: "",
    items: [],
    page: 0,
    hasMore: false,
    error: false,
  });
  const [detail, setDetail] = useState<DetailResult>({
    key: "",
    option: null,
    error: false,
  });

  const queryKey = useMemo(
    () => JSON.stringify([type, deferredSearch.trim()]),
    [type, deferredSearch],
  );
  const detailKey = JSON.stringify([type, value]);
  const options = result.key === queryKey ? result.items : [];
  const loading = open && (result.key !== queryKey || result.page !== page);
  const selected =
    detail.key === detailKey
      ? detail.option
      : options.find((item) => item.id === value);

  useEffect(() => {
    if (!open) return;
    let active = true;

    async function fetchOptions() {
      try {
        if (type === "client") {
          const response = await clientService.getClients({
            search: deferredSearch.trim() || undefined,
            page,
            limit: LIMIT,
          });

          if (!active) return;

          const incoming = response.data.map((item) => ({
            id: item.id,
            label: item.companyName,
            description: item.clientCode,
          }));

          setResult((previous) => {
            const existing =
              page > 1 && previous.key === queryKey ? previous.items : [];
            const merged = new Map(
              [...existing, ...incoming].map((item) => [item.id, item]),
            );

            return {
              key: queryKey,
              page,
              items: [...merged.values()],
              hasMore: page < response.meta.totalPages,
              error: false,
            };
          });
        } else {
          const response = await userService.getUserOptions({
            permissions: ["project.read", "project.update"],
            search: deferredSearch.trim() || undefined,
            limit: 50,
          });

          if (!active) return;

          setResult({
            key: queryKey,
            page: 1,
            items: response.data.map((item) => ({
              id: item.id,
              label: item.name,
              description: item.email,
            })),
            hasMore: false,
            error: false,
          });
        }
      } catch {
        if (!active) return;
        setResult({
          key: queryKey,
          page,
          items: [],
          hasMore: false,
          error: true,
        });
      }
    }

    void fetchOptions();
    return () => {
      active = false;
    };
  }, [open, type, deferredSearch, queryKey, page]);

  useEffect(() => {
    if (!value) return;
    let active = true;

    async function fetchDetail() {
      try {
        let option: Option;

        if (type === "client") {
          const response = await clientService.getClientById(value);
          option = {
            id: response.data.id,
            label: response.data.companyName,
            description: response.data.clientCode,
          };
        } else {
          const response = await userService.getUserById(value);
          option = {
            id: response.data.id,
            label: response.data.name,
            description: response.data.email,
          };
        }

        if (!active) return;
        setDetail({ key: detailKey, option, error: false });
      } catch {
        if (active) {
          setDetail({ key: detailKey, option: null, error: true });
        }
      }
    }

    void fetchDetail();
    return () => {
      active = false;
    };
  }, [type, value, detailKey]);

  const selectOption = (option: Option | null) => {
    const next = option?.id ?? "";

    setDetail({
      key: JSON.stringify([type, next]),
      option,
      error: false,
    });

    onChange(next);
    setOpen(false);
  };

  const label = type === "client" ? "Semua Client" : "Semua Project Manager";

  const selectedLabel = !value
    ? label
    : (selected?.label ??
      (detail.key === detailKey && detail.error
        ? "Detail tidak tersedia"
        : "Memuat pilihan..."));

  return (
    <Popover
      open={open}
      onOpenChange={(next) => {
        setOpen(next);
        if (next) {
          setSearch("");
          setPage(1);
        }
      }}>
      <PopoverTrigger asChild>
        <Button
          type="button"
          variant="outline"
          role="combobox"
          aria-expanded={open}
          disabled={disabled}
          className="w-full justify-between gap-2 font-normal">
          <span className="truncate">{selectedLabel}</span>
          <ChevronsUpDown className="size-4 shrink-0 opacity-50" />
        </Button>
      </PopoverTrigger>

      <PopoverContent
        align="start"
        className="w-[320px] max-w-[calc(100vw-2rem)] p-0">
        <Command shouldFilter={false}>
          <CommandInput
            placeholder={
              type === "client"
                ? "Cari nama Client..."
                : "Cari nama Project Manager..."
            }
            value={search}
            onValueChange={(next) => {
              setSearch(next);
              setPage(1);
            }}
          />
          <CommandList>
            <CommandGroup>
              <CommandItem value="all" onSelect={() => selectOption(null)}>
                <Check
                  className={`mr-2 size-4 ${
                    !value ? "opacity-100" : "opacity-0"
                  }`}
                />
                {label}
              </CommandItem>
              {options.map((option) => (
                <CommandItem
                  key={option.id}
                  value={option.id}
                  onSelect={() => selectOption(option)}>
                  <Check
                    className={`mr-2 size-4 ${
                      option.id === value ? "opacity-100" : "opacity-0"
                    }`}
                  />
                  <div className="min-w-0">
                    <p className="truncate">{option.label}</p>
                    {option.description && (
                      <p className="truncate text-xs text-muted-foreground">
                        {option.description}
                      </p>
                    )}
                  </div>
                </CommandItem>
              ))}
            </CommandGroup>

            {loading && (
              <div className="flex justify-center gap-2 p-3 text-xs text-muted-foreground">
                <Loader2 className="size-4 animate-spin" />
                Memuat...
              </div>
            )}

            {!loading && result.error && (
              <p className="p-3 text-center text-xs text-destructive">
                Gagal mengambil pilihan. Coba tutup dan buka kembali.
              </p>
            )}

            {!loading && !result.error && options.length === 0 && (
              <CommandEmpty>Data tidak ditemukan.</CommandEmpty>
            )}

            {!loading && result.hasMore && (
              <div className="border-t p-2">
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  className="w-full"
                  onClick={() => setPage((current) => current + 1)}>
                  Muat lebih banyak
                </Button>
              </div>
            )}
          </CommandList>
        </Command>
      </PopoverContent>
    </Popover>
  );
}
