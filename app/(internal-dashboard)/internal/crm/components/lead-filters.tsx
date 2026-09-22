"use client";

import { Search, X } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

interface LeadFiltersProps {
  search: string;
  status?: string;
  onSearchChange: (value: string) => void;
  onStatusChange: (value?: string) => void;
}

export function LeadFilters({
  search,
  status,
  onSearchChange,
  onStatusChange,
}: LeadFiltersProps) {
  const handleReset = () => {
    onSearchChange("");
    onStatusChange(undefined);
  };

  const hasFilter = Boolean(search || status);

  return (
    <div className="flex flex-col gap-3 rounded-lg border bg-card p-4 md:flex-row md:items-center md:justify-between">
      <div className="flex flex-1 flex-col gap-3 sm:flex-row">
        <div className="relative w-full sm:max-w-sm">
          <Search className="absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />

          <Input
            value={search}
            onChange={(e) => onSearchChange(e.target.value)}
            placeholder="Cari kode, company, PIC, email..."
            className="pl-9"
          />
        </div>

        <Select
          value={status ?? "ALL"}
          onValueChange={(value) => {
            if (!value || value === "ALL") {
              onStatusChange(undefined);
              return;
            }

            onStatusChange(value);
          }}>
          <SelectTrigger className="w-full sm:w-52">
            <SelectValue placeholder="Semua status" />
          </SelectTrigger>

          <SelectContent>
            <SelectItem value="ALL">Semua Status</SelectItem>

            <SelectItem value="NEW">New</SelectItem>

            <SelectItem value="QUALIFIED">Qualified</SelectItem>

            <SelectItem value="PROPOSAL">Proposal</SelectItem>

            <SelectItem value="NEGOTIATION">Negotiation</SelectItem>

            <SelectItem value="WON">Won</SelectItem>

            <SelectItem value="LOST">Lost</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {hasFilter && (
        <Button variant="ghost" size="sm" onClick={handleReset}>
          <X className="mr-2 size-4" />
          Reset Filter
        </Button>
      )}
    </div>
  );
}
