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
import { useDeferredValue, useEffect, useState } from "react";

type Option = { id: string; label: string; description: string };
type Props = {
  type: "client" | "manager";
  value: string;
  onChange: (value: string) => void;
};
type OptionResult = {
  key: string;
  items: Option[];
  page: number;
  hasMore: boolean;
  error: boolean;
};
export default function ClientKpiEntitySelect({
  type,
  value,
  onChange,
}: Props) {
  const [open, setOpen] = useState(false);
  const [search, setSearch] = useState("");
  const deferred = useDeferredValue(search);
  const [page, setPage] = useState(1);
  const [result, setResult] = useState<OptionResult>({
    key: "",
    items: [],
    page: 0,
    hasMore: false,
    error: false,
  });
  const [detail, setDetail] = useState<{ key: string; option: Option | null }>({
    key: "",
    option: null,
  });
  const key = JSON.stringify([type, deferred.trim()]);
  const detailKey = JSON.stringify([type, value]);
  const options = result.key === key ? result.items : [];
  const loading = open && (result.key !== key || result.page !== page);
  const selected =
    (detail.key === detailKey ? detail.option : null) ??
    options.find((item) => item.id === value);

  useEffect(() => {
    if (!open) return;
    let live = true;
    async function load() {
      try {
        if (type === "client") {
          const response = await clientService.getClients({
            search: deferred.trim() || undefined,
            page,
            limit: 20,
          });
          if (!live) return;
          const incoming = response.data.map((c) => ({
            id: c.id,
            label: c.companyName,
            description: c.clientCode,
          }));
          setResult((old) => {
            const existing = page > 1 && old.key === key ? old.items : [];
            return {
              key,
              page,
              items: [
                ...new Map(
                  [...existing, ...incoming].map((i) => [i.id, i]),
                ).values(),
              ],
              hasMore: page < response.meta.totalPages,
              error: false,
            };
          });
        } else {
          const response = await userService.getUserOptions({
            permissions: ["client.read", "client.update"],
            search: deferred.trim() || undefined,
            limit: 50,
          });
          if (!live) return;
          setResult({
            key,
            page: 1,
            items: response.data.map((u) => ({
              id: u.id,
              label: u.name,
              description: u.email,
            })),
            hasMore: false,
            error: false,
          });
        }
      } catch {
        if (live)
          setResult({ key, page, items: [], hasMore: false, error: true });
      }
    }
    void load();
    return () => {
      live = false;
    };
  }, [open, type, deferred, key, page]);

  useEffect(() => {
    if (!value) return;
    let live = true;
    async function load() {
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
        if (live) setDetail({ key: detailKey, option });
      } catch {
        if (live) setDetail({ key: detailKey, option: null });
      }
    }
    void load();
    return () => {
      live = false;
    };
  }, [value, type, detailKey]);

  const label = type === "client" ? "Semua Client" : "Semua Account Manager";
  const choose = (option: Option | null) => {
    const next = option?.id ?? "";
    setDetail({ key: JSON.stringify([type, next]), option });
    onChange(next);
    setOpen(false);
  };
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
          <span className="min-w-0 truncate">
            {!value
              ? label
              : (selected?.label ?? "ID terpilih (detail tidak tersedia)")}
          </span>
          <ChevronsUpDown className="size-4 shrink-0 opacity-50" />
        </Button>
      </PopoverTrigger>
      <PopoverContent align="start" className="w-[320px] p-0">
        <Command shouldFilter={false}>
          <CommandInput
            placeholder={`Cari ${type === "client" ? "Client" : "Account Manager"}...`}
            value={search}
            onValueChange={(s) => {
              setSearch(s);
              setPage(1);
            }}
          />
          <CommandList>
            <CommandGroup>
              <CommandItem value="all" onSelect={() => choose(null)}>
                <Check
                  className={`mr-2 size-4 ${!value ? "opacity-100" : "opacity-0"}`}
                />
                {label}
              </CommandItem>
              {options.map((option) => (
                <CommandItem
                  key={option.id}
                  value={option.id}
                  onSelect={() => choose(option)}>
                  <Check
                    className={`mr-2 size-4 ${value === option.id ? "opacity-100" : "opacity-0"}`}
                  />
                  <div className="min-w-0">
                    <p className="truncate">{option.label}</p>
                    <p className="truncate text-xs text-muted-foreground">
                      {option.description}
                    </p>
                  </div>
                </CommandItem>
              ))}
            </CommandGroup>
            {loading && (
              <div className="flex justify-center p-3">
                <Loader2 className="size-4 animate-spin" />
              </div>
            )}
            {!loading && result.key === key && result.error && (
              <p className="p-3 text-xs text-destructive">
                Lookup gagal atau tidak diizinkan untuk role ini.
              </p>
            )}
            {!loading && !result.error && !options.length && (
              <CommandEmpty>Tidak ada pilihan.</CommandEmpty>
            )}
            {!loading && result.hasMore && type === "client" && (
              <div className="p-2">
                <Button
                  size="sm"
                  variant="ghost"
                  className="w-full"
                  onClick={() => setPage((n) => n + 1)}>
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
