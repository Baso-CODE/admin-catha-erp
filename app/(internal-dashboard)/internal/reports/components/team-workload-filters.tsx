"use client";

import { projectService } from "@/app/services/project.service";
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
import { useDeferredValue, useEffect, useState } from "react";

type FilterType = "project" | "assignee";
type Option = { id: string; label: string; description?: string };
type OptionState = {
  key: string;
  page: number;
  items: Option[];
  hasMore: boolean;
  error: boolean;
};
type DetailState = {
  key: string;
  item: Option | null;
  error: boolean;
};

type Props = {
  type: FilterType;
  value: string;
  onChange: (value: string) => void;
};

export default function TeamWorkloadFilterSelect({
  type,
  value,
  onChange,
}: Props) {
  const [open, setOpen] = useState(false);
  const [search, setSearch] = useState("");
  const deferredSearch = useDeferredValue(search);
  const [page, setPage] = useState(1);
  const [result, setResult] = useState<OptionState>({
    key: "",
    page: 0,
    items: [],
    hasMore: false,
    error: false,
  });
  const [detail, setDetail] = useState<DetailState>({
    key: "",
    item: null,
    error: false,
  });

  const queryKey = JSON.stringify([type, deferredSearch.trim()]);
  const detailKey = JSON.stringify([type, value]);
  const options = result.key === queryKey ? result.items : [];
  const loading = open && (result.key !== queryKey || result.page !== page);
  const selected =
    detail.key === detailKey && detail.item
      ? detail.item
      : options.find((item) => item.id === value);

  useEffect(() => {
    if (!open) return;
    let active = true;

    async function loadOptions() {
      try {
        if (type === "project") {
          const response = await projectService.getAll({
            search: deferredSearch.trim() || undefined,
            page,
            limit: 20,
          });
          if (!active) return;

          const incoming = response.data.map((item) => ({
            id: item.id,
            label: item.name,
            description: item.projectCode,
          }));

          setResult((previous) => {
            const existing =
              page > 1 && previous.key === queryKey ? previous.items : [];
            const items = new Map(
              [...existing, ...incoming].map((item) => [item.id, item]),
            );
            return {
              key: queryKey,
              page,
              items: [...items.values()],
              hasMore: page < response.meta.totalPages,
              error: false,
            };
          });
        } else {
          const response = await userService.getUserOptions({
            permissions: ["task.read", "task.update"],
            search: deferredSearch.trim() || undefined,
            limit: 50,
          });
          if (!active) return;

          setResult({
            key: queryKey,
            page: 1,
            items: response.data.map((user) => ({
              id: user.id,
              label: user.name,
              description: user.email,
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

    void loadOptions();
    return () => {
      active = false;
    };
  }, [open, type, deferredSearch, queryKey, page]);

  useEffect(() => {
    if (!value) return;
    let active = true;

    async function loadDetail() {
      try {
        let item: Option;
        if (type === "project") {
          const response = await projectService.getById(value);
          item = {
            id: response.data.id,
            label: response.data.name,
            description: response.data.projectCode,
          };
        } else {
          const response = await userService.getUserById(value);
          item = {
            id: response.data.id,
            label: response.data.name,
            description: response.data.email,
          };
        }

        if (active) setDetail({ key: detailKey, item, error: false });
      } catch {
        if (active) setDetail({ key: detailKey, item: null, error: true });
      }
    }

    void loadDetail();
    return () => {
      active = false;
    };
  }, [type, value, detailKey]);

  const choose = (item: Option | null) => {
    const next = item?.id ?? "";
    setDetail({
      key: JSON.stringify([type, next]),
      item,
      error: false,
    });
    onChange(next);
    setOpen(false);
  };

  const placeholder = type === "project" ? "Semua Project" : "Semua Assignee";
  const display = !value
    ? placeholder
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
          className="w-full justify-between gap-2 font-normal">
          <span className="min-w-0 truncate">{display}</span>
          <ChevronsUpDown className="size-4 shrink-0 opacity-50" />
        </Button>
      </PopoverTrigger>
      <PopoverContent align="start" className="w-[320px] p-0">
        <Command shouldFilter={false}>
          <CommandInput
            placeholder={`Cari ${type === "project" ? "Project" : "Assignee"}...`}
            value={search}
            onValueChange={(next) => {
              setSearch(next);
              setPage(1);
            }}
          />
          <CommandList>
            <CommandGroup>
              <CommandItem value="all" onSelect={() => choose(null)}>
                <Check
                  className={`mr-2 size-4 ${
                    !value ? "opacity-100" : "opacity-0"
                  }`}
                />
                {placeholder}
              </CommandItem>
              {options.map((item) => (
                <CommandItem
                  key={item.id}
                  value={item.id}
                  onSelect={() => choose(item)}>
                  <Check
                    className={`mr-2 size-4 ${
                      value === item.id ? "opacity-100" : "opacity-0"
                    }`}
                  />
                  <div className="min-w-0">
                    <p className="truncate">{item.label}</p>
                    <p className="truncate text-xs text-muted-foreground">
                      {item.description}
                    </p>
                  </div>
                </CommandItem>
              ))}
            </CommandGroup>
            {loading && (
              <div className="flex items-center justify-center gap-2 p-3 text-xs">
                <Loader2 className="size-4 animate-spin" /> Memuat...
              </div>
            )}
            {!loading && result.key === queryKey && result.error && (
              <p className="p-3 text-center text-xs text-destructive">
                Lookup tidak tersedia atau akses ditolak.
              </p>
            )}
            {!loading && !result.error && options.length === 0 && (
              <CommandEmpty>Data tidak ditemukan.</CommandEmpty>
            )}
            {!loading && result.hasMore && type === "project" && (
              <div className="border-t p-2">
                <Button
                  type="button"
                  size="sm"
                  variant="ghost"
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
