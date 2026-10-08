"use client";

import {
  contractService,
  type ContractItem,
} from "@/app/services/contract.service";
import { recurringBillingService } from "@/app/services/recurring-billing.service";
import type {
  RecurringBillingDetail,
  RecurringBillingFrequency,
} from "@/app/types/recurring-billing.type";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Loader2 } from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { toast } from "sonner";

interface Props {
  billing?: RecurringBillingDetail;
  initialContractId?: string;
}

const FREQUENCIES: { value: RecurringBillingFrequency; label: string }[] = [
  { value: "MONTHLY", label: "Bulanan" },
  { value: "QUARTERLY", label: "3 Bulanan" },
  { value: "SEMIANNUALLY", label: "6 Bulanan" },
  { value: "ANNUALLY", label: "Tahunan" },
];

function toDatetimeLocal(value: string) {
  const date = new Date(value);
  const offset = date.getTimezoneOffset() * 60000;
  return new Date(date.getTime() - offset).toISOString().slice(0, 16);
}

export function RecurringBillingForm({ billing, initialContractId }: Props) {
  const router = useRouter();
  const isEdit = Boolean(billing);
  const locked = Boolean(billing?.lastRunDate);

  const [contracts, setContracts] = useState<ContractItem[]>([]);
  const [loadingContracts, setLoadingContracts] = useState(!isEdit);
  const [submitting, setSubmitting] = useState(false);
  const [contractId, setContractId] = useState(
    billing?.contractId ?? initialContractId ?? "",
  );
  const [amount, setAmount] = useState(billing?.amount ?? "");
  const [currency, setCurrency] = useState(billing?.currency ?? "IDR");
  const [frequency, setFrequency] = useState<RecurringBillingFrequency>(
    billing?.frequency ?? "MONTHLY",
  );
  const [nextRunDate, setNextRunDate] = useState(
    billing ? toDatetimeLocal(billing.nextRunDate) : "",
  );
  const [dueDays, setDueDays] = useState(String(billing?.dueDays ?? 14));
  const [isActive, setIsActive] = useState(billing?.isActive ?? true);

  useEffect(() => {
    if (isEdit) return;
    let cancelled = false;

    async function loadContracts() {
      try {
        const response = await contractService.getContracts({
          status: "ACTIVE",
          page: 1,
          limit: 100,
        });
        if (!cancelled) setContracts(response.data);
      } catch (error) {
        if (!cancelled) {
          toast.error(
            error instanceof Error ? error.message : "Gagal memuat kontrak.",
          );
        }
      } finally {
        if (!cancelled) setLoadingContracts(false);
      }
    }

    void loadContracts();
    return () => {
      cancelled = true;
    };
  }, [isEdit]);

  const selectedContract = contracts.find((item) => item.id === contractId);

  const handleContractChange = (id: string) => {
    setContractId(id);
    const contract = contracts.find((item) => item.id === id);
    if (contract) setCurrency(contract.currency);
  };

  const handleSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (submitting || locked) return;

    if (!isEdit && !contractId) {
      toast.error("Pilih kontrak terlebih dahulu.");
      return;
    }

    const amountPattern = /^\d+(\.\d{1,2})?$/;
    if (!amountPattern.test(amount) || Number(amount) <= 0) {
      toast.error("Nominal harus positif dengan maksimal 2 desimal.");
      return;
    }

    const parsedDueDays = Number(dueDays);
    if (
      !Number.isInteger(parsedDueDays) ||
      parsedDueDays < 0 ||
      parsedDueDays > 365
    ) {
      toast.error("Due days harus antara 0 sampai 365.");
      return;
    }

    const date = new Date(nextRunDate);
    if (!nextRunDate || Number.isNaN(date.getTime())) {
      toast.error("Tanggal billing tidak valid.");
      return;
    }

    try {
      setSubmitting(true);
      const payload = {
        amount,
        currency,
        frequency,
        nextRunDate: date.toISOString(),
        dueDays: parsedDueDays,
      };

      if (billing) {
        await recurringBillingService.update(billing.id, payload);
        toast.success("Jadwal billing berhasil diperbarui.");
        router.push(`/internal/finance/recurring-billing/${billing.id}`);
      } else {
        const response = await recurringBillingService.create({
          ...payload,
          contractId,
          isActive,
        });
        toast.success("Recurring billing berhasil dibuat.");
        router.push(`/internal/finance/recurring-billing/${response.data.id}`);
      }
      router.refresh();
    } catch (error) {
      toast.error(
        error instanceof Error ? error.message : "Gagal menyimpan jadwal.",
      );
    } finally {
      setSubmitting(false);
    }
  };

  if (locked) {
    return (
      <div className="rounded-xl border p-5">
        <p className="font-medium">Jadwal tidak dapat diubah</p>
        <p className="mt-2 text-sm text-muted-foreground">
          Jadwal ini sudah menghasilkan invoice. Nonaktifkan jadwal jika tidak
          ingin membuat tagihan berikutnya.
        </p>
        <Button className="mt-4" variant="outline" asChild>
          <Link href={`/internal/finance/recurring-billing/${billing?.id}`}>
            Kembali ke Detail
          </Link>
        </Button>
      </div>
    );
  }

  return (
    <form onSubmit={handleSubmit} className="max-w-3xl space-y-6">
      <div className="space-y-5 rounded-xl border bg-card p-6">
        <div className="space-y-2">
          <Label>Kontrak</Label>
          {billing ? (
            <Input
              value={`${billing.contract.contractNo} — ${billing.contract.title}`}
              disabled
            />
          ) : (
            <>
              <Select
                value={contractId}
                onValueChange={handleContractChange}
                disabled={loadingContracts}>
                <SelectTrigger className="w-full">
                  <SelectValue placeholder="Pilih kontrak ACTIVE" />
                </SelectTrigger>
                <SelectContent>
                  {contracts.map((contract) => (
                    <SelectItem key={contract.id} value={contract.id}>
                      {contract.contractNo} — {contract.client.companyName}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <p className="text-xs text-muted-foreground">
                Maksimal 100 kontrak aktif ditampilkan. Pemilihan kontrak lain
                dapat ditambahkan melalui pencarian pada tahap penyempurnaan.
              </p>
            </>
          )}
        </div>

        <div className="grid gap-5 sm:grid-cols-2">
          <div className="space-y-2">
            <Label htmlFor="amount">Nominal per Siklus</Label>
            <Input
              id="amount"
              type="text"
              inputMode="decimal"
              placeholder="1500000.00"
              value={amount}
              onChange={(event) => setAmount(event.target.value)}
              required
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="currency">Currency</Label>
            <Input id="currency" value={currency} readOnly />
          </div>
          <div className="space-y-2">
            <Label>Frekuensi</Label>
            <Select
              value={frequency}
              onValueChange={(value) =>
                setFrequency(value as RecurringBillingFrequency)
              }>
              <SelectTrigger className="w-full">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {FREQUENCIES.map((item) => (
                  <SelectItem key={item.value} value={item.value}>
                    {item.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-2">
            <Label htmlFor="nextRunDate">Tanggal Billing Berikutnya</Label>
            <Input
              id="nextRunDate"
              type="datetime-local"
              value={nextRunDate}
              onChange={(event) => setNextRunDate(event.target.value)}
              required
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="dueDays">Jatuh Tempo (Hari)</Label>
            <Input
              id="dueDays"
              type="number"
              min={0}
              max={365}
              value={dueDays}
              onChange={(event) => setDueDays(event.target.value)}
              required
            />
          </div>
          {!isEdit && (
            <div className="space-y-2">
              <Label>Status Awal</Label>
              <Select
                value={String(isActive)}
                onValueChange={(value) => setIsActive(value === "true")}>
                <SelectTrigger className="w-full">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="true">Aktif</SelectItem>
                  <SelectItem value="false">Nonaktif</SelectItem>
                </SelectContent>
              </Select>
            </div>
          )}
        </div>

        {!billing && selectedContract && (
          <div className="rounded-lg bg-muted/50 p-4 text-sm">
            <p className="font-medium">{selectedContract.title}</p>
            <p className="mt-1 text-muted-foreground">
              Periode:{" "}
              {new Date(selectedContract.startDate).toLocaleDateString("id-ID")}
              {" — "}
              {new Date(selectedContract.endDate).toLocaleDateString("id-ID")}
            </p>
          </div>
        )}
      </div>

      <div className="flex gap-3">
        <Button
          type="submit"
          disabled={submitting || (!billing && loadingContracts)}>
          {submitting && <Loader2 className="size-4 animate-spin" />}
          {submitting
            ? "Menyimpan..."
            : billing
              ? "Simpan Perubahan"
              : "Buat Jadwal"}
        </Button>
        <Button variant="outline" type="button" asChild>
          <Link
            href={
              billing
                ? `/internal/finance/recurring-billing/${billing.id}`
                : "/internal/finance/recurring-billing"
            }>
            Batal
          </Link>
        </Button>
      </div>
    </form>
  );
}
