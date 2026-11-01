"use client";

import {
  CalendarDays,
  CheckCircle2,
  CreditCard,
  Loader2,
  RefreshCw,
} from "lucide-react";
import { useEffect, useState } from "react";
import { toast } from "sonner";

import {
  contractService,
  type ContractItem,
} from "@/app/services/contract.service";
import { recurringBillingService } from "@/app/services/recurring-billing.service";

import type {
  RecurringBilling,
  RecurringBillingFrequency,
} from "@/app/types/recurring-billing.type";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";

import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";

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

interface Props {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  renewalId: string | null;
  permissions: string[];
  onSuccess?: () => void;
}

const FREQUENCY_OPTIONS: {
  value: RecurringBillingFrequency;
  label: string;
}[] = [
  { value: "MONTHLY", label: "Bulanan" },
  { value: "QUARTERLY", label: "3 Bulanan" },
  { value: "SEMIANNUALLY", label: "6 Bulanan" },
  { value: "ANNUALLY", label: "Tahunan" },
];

function dateOnly(value: string): string {
  return value.slice(0, 10);
}

function toUtcDate(value: string): string {
  return `${value}T00:00:00.000Z`;
}

function errorMessage(error: unknown): string {
  return error instanceof Error ? error.message : "Terjadi kesalahan.";
}

export default function ContractRenewalBillingDialog({
  open,
  onOpenChange,
  renewalId,
  permissions,
  onSuccess,
}: Props) {
  const canRead = permissions.includes("recurring_billing.read");
  const canCreate = permissions.includes("recurring_billing.create");
  const canUpdate = permissions.includes("recurring_billing.update");

  const [contract, setContract] = useState<ContractItem | null>(null);
  const [billings, setBillings] = useState<RecurringBilling[]>([]);

  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [activatingId, setActivatingId] = useState<string | null>(null);

  const [amount, setAmount] = useState("");
  const [frequency, setFrequency] =
    useState<RecurringBillingFrequency>("MONTHLY");
  const [nextRunDate, setNextRunDate] = useState("");
  const [dueDays, setDueDays] = useState("14");

  useEffect(() => {
    if (!open || !renewalId) {
      setContract(null);
      setBillings([]);
      return;
    }

    let cancelled = false;

    async function loadData() {
      if (!renewalId) return;

      setLoading(true);
      setContract(null);
      setBillings([]);

      try {
        const contractResponse =
          await contractService.getContractById(renewalId);

        if (cancelled) return;

        const currentContract = contractResponse.data;

        setContract(currentContract);
        setAmount(String(currentContract.value));
        setFrequency("MONTHLY");
        setNextRunDate(
          dateOnly(currentContract.startDate) >
            new Date().toISOString().slice(0, 10)
            ? dateOnly(currentContract.startDate)
            : new Date().toISOString().slice(0, 10),
        );
        setDueDays("14");

        if (canRead) {
          const response = await recurringBillingService.getAll({
            contractId: renewalId,
            page: 1,
            limit: 100,
          });

          if (!cancelled) {
            if (response.meta.total > response.data.length) {
              throw new Error(
                "Jumlah jadwal billing melebihi batas tampilan. Periksa daftar billing lengkap sebelum membuat jadwal baru.",
              );
            }

            setBillings(response.data);
          }
        }
      } catch (error) {
        if (!cancelled) {
          toast.error(errorMessage(error));
        }
      } finally {
        if (!cancelled) {
          setLoading(false);
        }
      }
    }

    void loadData();

    return () => {
      cancelled = true;
    };
  }, [open, renewalId, canRead]);

  async function refreshBillings() {
    if (!renewalId || !canRead) return;

    try {
      const response = await recurringBillingService.getAll({
        contractId: renewalId,
        page: 1,
        limit: 100,
      });

      if (response.meta.total > response.data.length) {
        throw new Error("Daftar billing belum lengkap.");
      }

      setBillings(response.data);
    } catch (error) {
      toast.error(errorMessage(error));
    }
  }

  async function createBilling(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();

    if (!renewalId || !contract || !canCreate || !canRead || saving) {
      return;
    }

    if (contract.status !== "ACTIVE") {
      toast.error("Hanya kontrak ACTIVE yang dapat membuat billing.");
      return;
    }

    if (billings.length > 0) {
      toast.error(
        "Kontrak ini sudah mempunyai jadwal billing. Periksa jadwal existing.",
      );
      return;
    }

    if (!/^\d{1,13}(\.\d{1,2})?$/.test(amount) || Number(amount) <= 0) {
      toast.error("Nominal billing tidak valid.");
      return;
    }

    const due = Number(dueDays);

    if (!Number.isInteger(due) || due < 0 || due > 365) {
      toast.error("Due days harus antara 0 sampai 365.");
      return;
    }

    if (
      !nextRunDate ||
      nextRunDate < dateOnly(contract.startDate) ||
      nextRunDate > dateOnly(contract.endDate)
    ) {
      toast.error("Tanggal billing harus berada dalam periode kontrak.");
      return;
    }

    setSaving(true);

    try {
      // Pemeriksaan ulang untuk mengurangi risiko duplikasi.
      const existing = await recurringBillingService.getAll({
        contractId: renewalId,
        page: 1,
        limit: 100,
      });

      if (existing.meta.total > 0) {
        setBillings(existing.data);
        throw new Error(
          "Jadwal billing sudah tersedia. Tidak membuat duplikat.",
        );
      }

      await recurringBillingService.create({
        contractId: renewalId,
        amount,
        currency: contract.currency,
        frequency,
        nextRunDate: toUtcDate(nextRunDate),
        dueDays: due,
        isActive: false,
      });

      toast.success("Jadwal billing berhasil dibuat dalam kondisi nonaktif.");

      await refreshBillings();
      onSuccess?.();
    } catch (error) {
      toast.error(errorMessage(error));
    } finally {
      setSaving(false);
    }
  }

  async function activateBilling(billingId: string) {
    if (!canUpdate || !canRead || activatingId) return;

    if (
      !window.confirm(
        "Aktifkan jadwal billing ini? Setelah aktif, scheduler dapat menghasilkan invoice sesuai tanggal penagihan.",
      )
    ) {
      return;
    }

    setActivatingId(billingId);

    try {
      await recurringBillingService.activate(billingId);

      toast.success("Recurring Billing berhasil diaktifkan.");

      await refreshBillings();
      onSuccess?.();
    } catch (error) {
      toast.error(errorMessage(error));
    } finally {
      setActivatingId(null);
    }
  }

  const alreadyConfigured = billings.length > 0;

  return (
    <Dialog
      open={open}
      onOpenChange={(value) => {
        if (!saving && !activatingId) {
          onOpenChange(value);
        }
      }}>
      <DialogContent className="max-h-[90vh] overflow-y-auto sm:max-w-2xl">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <CreditCard className="size-5" />
            Renewal Billing Configuration
          </DialogTitle>

          <DialogDescription>
            Konfigurasikan jadwal penagihan kontrak renewal. Pembuatan jadwal
            tidak langsung menghasilkan invoice.
          </DialogDescription>
        </DialogHeader>

        {loading ? (
          <div className="flex items-center justify-center gap-2 py-12">
            <Loader2 className="size-5 animate-spin" />
            <span className="text-sm text-muted-foreground">
              Memuat data kontrak...
            </span>
          </div>
        ) : !contract ? (
          <p className="py-6 text-sm text-muted-foreground">
            Detail kontrak belum tersedia.
          </p>
        ) : (
          <div className="space-y-5">
            <Card>
              <CardHeader>
                <CardTitle>{contract.contractNo}</CardTitle>
                <CardDescription>{contract.title}</CardDescription>
              </CardHeader>

              <CardContent className="space-y-2">
                <div className="flex items-center gap-2">
                  <span className="text-sm">Status:</span>
                  <Badge
                    variant={
                      contract.status === "ACTIVE" ? "default" : "secondary"
                    }>
                    {contract.status}
                  </Badge>
                </div>

                <p className="text-sm text-muted-foreground">
                  Client: {contract.client.companyName}
                </p>

                <p className="text-sm text-muted-foreground">
                  Periode: {dateOnly(contract.startDate)} –{" "}
                  {dateOnly(contract.endDate)}
                </p>

                <p className="text-sm text-muted-foreground">
                  Nilai kontrak: {contract.currency}{" "}
                  {Number(contract.value).toLocaleString("id-ID")}
                </p>
              </CardContent>
            </Card>

            {contract.status !== "ACTIVE" && (
              <Card>
                <CardContent>
                  <p className="text-sm text-muted-foreground">
                    Kontrak harus diaktifkan terlebih dahulu sebelum Recurring
                    Billing dapat dikonfigurasi.
                  </p>
                </CardContent>
              </Card>
            )}

            {billings.length > 0 && (
              <Card>
                <CardHeader>
                  <CardTitle>Existing Billing Schedule</CardTitle>
                  <CardDescription>
                    Jadwal yang sudah terhubung dengan kontrak ini.
                  </CardDescription>
                </CardHeader>

                <CardContent className="space-y-3">
                  {billings.map((billing) => (
                    <div
                      key={billing.id}
                      className="space-y-3 rounded-lg border p-3">
                      <div className="flex flex-wrap items-center justify-between gap-2">
                        <div>
                          <p className="font-medium">
                            {billing.currency}{" "}
                            {Number(billing.amount).toLocaleString("id-ID")}
                          </p>

                          <p className="text-xs text-muted-foreground">
                            {billing.frequency} · Next run:{" "}
                            {dateOnly(billing.nextRunDate)}
                          </p>
                        </div>

                        <Badge
                          variant={billing.isActive ? "default" : "secondary"}>
                          {billing.isActive ? "ACTIVE" : "INACTIVE"}
                        </Badge>
                      </div>

                      {!billing.isActive && canUpdate && (
                        <Button
                          type="button"
                          size="sm"
                          disabled={!!activatingId}
                          onClick={() => activateBilling(billing.id)}>
                          {activatingId === billing.id ? (
                            <Loader2 className="size-4 animate-spin" />
                          ) : (
                            <CheckCircle2 className="size-4" />
                          )}
                          Activate Billing
                        </Button>
                      )}
                    </div>
                  ))}

                  <p className="text-xs text-muted-foreground">
                    Untuk mengubah jadwal yang sudah ada, gunakan fitur
                    Recurring Billing Management.
                  </p>
                </CardContent>
              </Card>
            )}

            {!alreadyConfigured &&
              canCreate &&
              canRead &&
              contract.status === "ACTIVE" && (
                <form onSubmit={createBilling} className="space-y-4">
                  <div>
                    <h3 className="font-semibold">Create Recurring Billing</h3>
                    <p className="text-sm text-muted-foreground">
                      Jadwal baru akan disimpan sebagai INACTIVE.
                    </p>
                  </div>

                  <div className="grid gap-4 sm:grid-cols-2">
                    <div className="space-y-2">
                      <Label htmlFor="billing-amount">Billing Amount</Label>

                      <Input
                        id="billing-amount"
                        value={amount}
                        onChange={(event) => setAmount(event.target.value)}
                        placeholder="5000000.00"
                        inputMode="decimal"
                        required
                      />
                    </div>

                    <div className="space-y-2">
                      <Label>Frequency</Label>

                      <Select
                        value={frequency}
                        onValueChange={(value) =>
                          setFrequency(value as RecurringBillingFrequency)
                        }>
                        <SelectTrigger className="w-full">
                          <SelectValue placeholder="Pilih frekuensi" />
                        </SelectTrigger>

                        <SelectContent>
                          {FREQUENCY_OPTIONS.map((item) => (
                            <SelectItem key={item.value} value={item.value}>
                              {item.label}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="billing-next-run">
                        First Billing Date
                      </Label>

                      <Input
                        id="billing-next-run"
                        type="date"
                        value={nextRunDate}
                        min={dateOnly(contract.startDate)}
                        max={dateOnly(contract.endDate)}
                        onChange={(event) => setNextRunDate(event.target.value)}
                        required
                      />
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="billing-due-days">Invoice Due Days</Label>

                      <Input
                        id="billing-due-days"
                        type="number"
                        min={0}
                        max={365}
                        value={dueDays}
                        onChange={(event) => setDueDays(event.target.value)}
                        required
                      />
                    </div>
                  </div>

                  <Card className="bg-muted/30">
                    <CardContent>
                      <div className="flex items-start gap-2">
                        <CalendarDays className="mt-0.5 size-4 shrink-0" />

                        <p className="text-xs text-muted-foreground">
                          Nominal yang dimasukkan adalah nominal
                          <strong> setiap siklus penagihan</strong>, bukan
                          otomatis nilai total kontrak. Pastikan sudah sesuai
                          kesepakatan komersial.
                        </p>
                      </div>
                    </CardContent>
                  </Card>

                  <Button type="submit" className="w-full" disabled={saving}>
                    {saving ? (
                      <Loader2 className="size-4 animate-spin" />
                    ) : (
                      <CreditCard className="size-4" />
                    )}
                    Save Billing Schedule
                  </Button>
                </form>
              )}

            {!canRead && (
              <p className="text-sm text-muted-foreground">
                Permission recurring_billing.read diperlukan untuk memeriksa
                jadwal existing.
              </p>
            )}
          </div>
        )}

        <DialogFooter>
          <Button
            type="button"
            variant="outline"
            onClick={() => onOpenChange(false)}
            disabled={saving || !!activatingId}>
            Close
          </Button>

          {canRead && contract && (
            <Button
              type="button"
              variant="secondary"
              onClick={() => void refreshBillings()}
              disabled={loading || saving}>
              <RefreshCw className="size-4" />
              Refresh Billing
            </Button>
          )}
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
