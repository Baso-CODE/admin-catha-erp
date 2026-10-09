"use client";

import { clientService } from "@/app/services/client.service";
import { projectService } from "@/app/services/project.service";
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
import { useEffect, useMemo, useState } from "react";

type EntityType = "client" | "project";

type Option = {
  value: string;
  label: string;
  description: string;
};

interface Props {
  type: EntityType;
  value: string;
  onChange: (value: string) => void;
  clientId?: string;
  disabled?: boolean;
}

type OptionsState = {
  key: string;
  page: number;
  items: Option[];
  hasMore: boolean;
  error: boolean;
};

type SelectedState = {
  type: EntityType;
  value: string;
  option: Option | null;
  error: boolean;
};

const PAGE_SIZE = 20;

export function RevenueEntitySelect({
  type,
  value,
  onChange,
  clientId = "",
  disabled = false,
}: Props) {
  const [open, setOpen] = useState(false);
  const [search, setSearch] = useState("");
  const [page, setPage] = useState(1);

  const [optionsState, setOptionsState] = useState<OptionsState>({
    key: "",
    page: 0,
    items: [],
    hasMore: false,
    error: false,
  });

  const [selectedState, setSelectedState] = useState<SelectedState>({
    type,
    value: "",
    option: null,
    error: false,
  });

  const queryKey = useMemo(
    () => JSON.stringify([type, clientId, search.trim()]),
    [type, clientId, search],
  );

  const optionsReady =
    optionsState.key === queryKey && optionsState.page === page;

  const loading = open && !optionsReady;
  const options = optionsState.key === queryKey ? optionsState.items : [];

  const hasMore = optionsState.key === queryKey && optionsState.hasMore;

  const selectedOption =
    selectedState.type === type && selectedState.value === value
      ? selectedState.option
      : null;

  const optionFromList = options.find((item) => item.value === value);
  const displayOption = selectedOption ?? optionFromList;

  useEffect(() => {
    if (!value) return;

    let active = true;

    async function loadSelected() {
      try {
        let option: Option;

        if (type === "client") {
          const response = await clientService.getClientById(value);

          option = {
            value: response.data.id,
            label: response.data.companyName,
            description: response.data.clientCode,
          };
        } else {
          const response = await projectService.getById(value);

          option = {
            value: response.data.id,
            label: response.data.name,
            description: response.data.projectCode,
          };
        }

        if (!active) return;

        setSelectedState({
          type,
          value,
          option,
          error: false,
        });
      } catch {
        if (!active) return;

        setSelectedState({
          type,
          value,
          option: null,
          error: true,
        });
      }
    }

    void loadSelected();

    return () => {
      active = false;
    };
  }, [value, type]);

  useEffect(() => {
    if (!open) return;

    let active = true;

    async function loadOptions() {
      try {
        let next: Option[];
        let totalPages: number;

        if (type === "client") {
          const response = await clientService.getClients({
            search: search.trim() || undefined,
            page,
            limit: PAGE_SIZE,
          });

          next = response.data.map((item) => ({
            value: item.id,
            label: item.companyName,
            description: item.clientCode,
          }));

          totalPages = response.meta.totalPages;
        } else {
          const response = await projectService.getAll({
            search: search.trim() || undefined,
            clientId: clientId || undefined,
            page,
            limit: PAGE_SIZE,
          });

          next = response.data.map((item) => ({
            value: item.id,
            label: item.name,
            description: item.projectCode,
          }));

          totalPages = response.meta.totalPages;
        }

        if (!active) return;

        setOptionsState((previous) => {
          const existing =
            page > 1 && previous.key === queryKey ? previous.items : [];

          const merged = new Map(
            [...existing, ...next].map((item) => [item.value, item]),
          );

          return {
            key: queryKey,
            page,
            items: [...merged.values()],
            hasMore: page < totalPages,
            error: false,
          };
        });
      } catch {
        if (!active) return;

        setOptionsState({
          key: queryKey,
          page,
          items: [],
          hasMore: false,
          error: true,
        });
      }
    }

    void loadOptions();

    return () => {
      active = false;
    };
  }, [open, type, clientId, search, page, queryKey]);

  const handleSearch = (nextSearch: string) => {
    setSearch(nextSearch);
    setPage(1);
  };

  const handleSelect = (option: Option | null) => {
    if (option) {
      setSelectedState({
        type,
        value: option.value,
        option,
        error: false,
      });
    } else {
      setSelectedState({
        type,
        value: "",
        option: null,
        error: false,
      });
    }

    onChange(option?.value ?? "");
    setOpen(false);
  };

  const placeholder = type === "client" ? "Semua Client" : "Semua Project";

  const displayLabel = !value
    ? placeholder
    : (displayOption?.label ??
      (selectedState.value === value && selectedState.error
        ? "Detail tidak tersedia"
        : "Memuat pilihan..."));

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button
          type="button"
          variant="outline"
          role="combobox"
          aria-expanded={open}
          disabled={disabled}
          className="w-full justify-between gap-2 font-normal">
          <span className="min-w-0 truncate">{displayLabel}</span>
          <ChevronsUpDown className="size-4 shrink-0 opacity-50" />
        </Button>
      </PopoverTrigger>

      <PopoverContent
        align="start"
        className="w-[320px] max-w-[calc(100vw-2rem)] p-0">
        <Command shouldFilter={false}>
          <CommandInput
            placeholder={
              type === "client" ? "Cari nama Client..." : "Cari nama Project..."
            }
            value={search}
            onValueChange={handleSearch}
          />

          <CommandList>
            <CommandGroup>
              <CommandItem
                value="all-entities"
                onSelect={() => handleSelect(null)}>
                <Check
                  className={`mr-2 size-4 ${
                    !value ? "opacity-100" : "opacity-0"
                  }`}
                />
                {placeholder}
              </CommandItem>

              {options.map((option) => (
                <CommandItem
                  key={option.value}
                  value={option.value}
                  onSelect={() => handleSelect(option)}>
                  <Check
                    className={`mr-2 size-4 ${
                      value === option.value ? "opacity-100" : "opacity-0"
                    }`}
                  />
                  <div className="min-w-0">
                    <p className="truncate">{option.label}</p>
                    <p className="text-xs text-muted-foreground">
                      {option.description}
                    </p>
                  </div>
                </CommandItem>
              ))}
            </CommandGroup>

            {loading && (
              <div className="flex items-center justify-center gap-2 p-3 text-xs text-muted-foreground">
                <Loader2 className="size-4 animate-spin" />
                Memuat data...
              </div>
            )}

            {!loading && optionsState.error && (
              <p className="p-3 text-center text-xs text-destructive">
                Gagal memuat daftar. Tutup dan buka kembali untuk mencoba ulang.
              </p>
            )}

            {!loading && !optionsState.error && options.length === 0 && (
              <CommandEmpty>Data tidak ditemukan.</CommandEmpty>
            )}

            {!loading && hasMore && (
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
