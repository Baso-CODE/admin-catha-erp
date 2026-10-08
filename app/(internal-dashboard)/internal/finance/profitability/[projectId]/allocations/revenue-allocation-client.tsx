"use client";

import { invoiceService, type Invoice } from "@/app/services/invoice.service";
import { profitabilityService } from "@/app/services/profitability.service";
import type {
  InvoiceRevenueAllocations,
  ProjectServiceProfitability,
} from "@/app/types/profitability.type";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { ArrowLeft, Loader2, RefreshCw, Save } from "lucide-react";
import Link from "next/link";
import { useCallback, useEffect, useMemo, useState } from "react";
import { toast } from "sonner";

interface Props {
  projectId: string;
  canUpdate: boolean;
}

type AllocationValues = Record<string, string>;

const ALLOWED_STATUSES = new Set(["SENT", "PARTIALLY_PAID", "PAID", "OVERDUE"]);

const ZERO = BigInt(0);
const HUNDRED = BigInt(100);

function toCents(value: string): bigint | null {
  if (!/^\d+(?:\.\d{1,2})?$/.test(value)) return null;

  const [whole, fraction = ""] = value.split(".");

  return BigInt(whole) * HUNDRED + BigInt(fraction.padEnd(2, "0"));
}

function fromCents(value: bigint): string {
  const negative = value < ZERO;
  const absolute = negative ? -value : value;

  return `${negative ? "-" : ""}${absolute / HUNDRED}.${String(
    absolute % HUNDRED,
  ).padStart(2, "0")}`;
}

function formatMoney(value: string, currency: string) {
  const amount = Number(value);
  if (!Number.isFinite(amount)) return `${currency} ${value}`;

  try {
    return new Intl.NumberFormat("id-ID", {
      style: "currency",
      currency,
      maximumFractionDigits: 2,
    }).format(amount);
  } catch {
    return `${currency} ${value}`;
  }
}

export default function RevenueAllocationClient({
  projectId,
  canUpdate,
}: Props) {
  const baseUrl = `/internal/finance/profitability/${projectId}`;

  const [services, setServices] = useState<
    ProjectServiceProfitability["services"]
  >([]);
  const [invoices, setInvoices] = useState<Invoice[]>([]);
  const [invoicePage, setInvoicePage] = useState(1);
  const [invoiceTotalPages, setInvoiceTotalPages] = useState(1);
  const [selectedId, setSelectedId] = useState("");
  const [allocation, setAllocation] =
    useState<InvoiceRevenueAllocations | null>(null);
  const [values, setValues] = useState<AllocationValues>({});
  const [loadingList, setLoadingList] = useState(true);
  const [loadingAllocation, setLoadingAllocation] = useState(false);
  const [saving, setSaving] = useState(false);
  const [refreshKey, setRefreshKey] = useState(0);

  const loadList = useCallback(async () => {
    setLoadingList(true);

    try {
      const [invoiceResult, serviceResult] = await Promise.all([
        invoiceService.getAll({
          projectId,
          page: invoicePage,
          limit: 20,
        }),
        profitabilityService.getProjectServices(projectId),
      ]);

      setInvoices(
        invoiceResult.data.filter((item) => ALLOWED_STATUSES.has(item.status)),
      );
      setInvoiceTotalPages(invoiceResult.meta.totalPages);
      setServices(serviceResult.data.services);
    } catch (error) {
      toast.error(
        error instanceof Error
          ? error.message
          : "Gagal mengambil daftar invoice.",
      );
    } finally {
      setLoadingList(false);
    }
  }, [projectId, invoicePage, refreshKey]);

  useEffect(() => {
    void loadList();
  }, [loadList]);

  useEffect(() => {
    if (!selectedId) {
      setAllocation(null);
      setValues({});
      return;
    }

    let active = true;

    async function loadAllocation() {
      setLoadingAllocation(true);
      setAllocation(null);
      setValues({});

      try {
        const response =
          await profitabilityService.getInvoiceAllocations(selectedId);

        if (!active) return;
        if (response.data.invoice.projectId !== projectId) {
          throw new Error("Invoice bukan milik Project ini.");
        }

        const next: AllocationValues = {};

        for (const item of response.data.allocations) {
          next[item.projectServiceId] = item.amount;
        }

        setAllocation(response.data);
        setValues(next);
      } catch (error) {
        if (active) {
          toast.error(
            error instanceof Error
              ? error.message
              : "Gagal mengambil revenue allocation.",
          );
        }
      } finally {
        if (active) setLoadingAllocation(false);
      }
    }

    void loadAllocation();

    return () => {
      active = false;
    };
  }, [selectedId, projectId, refreshKey]);

  const calculation = useMemo(() => {
    const netRevenue = allocation
      ? toCents(allocation.summary.netRevenue)
      : null;

    let total = ZERO;
    let invalid = false;

    for (const value of Object.values(values)) {
      if (!value.trim()) continue;

      const cents = toCents(value.trim());

      if (cents === null || cents <= ZERO) {
        invalid = true;
        continue;
      }

      total += cents;
    }

    const remaining = netRevenue === null ? null : netRevenue - total;

    return {
      total,
      remaining,
      invalid: invalid || (allocation !== null && netRevenue === null),
      exceeds: remaining !== null && remaining < ZERO,
    };
  }, [allocation, values]);

  const save = () => {
    if (!selectedId || !allocation || !canUpdate || saving) return;

    if (calculation.invalid || calculation.exceeds) {
      toast.error("Periksa nominal alokasi dan total Net Revenue.");
      return;
    }

    const payload = {
      allocationVersion: allocation.invoice.allocationVersion,
      allocations: services
        .filter((service) => values[service.projectServiceId]?.trim())
        .map((service) => ({
          projectServiceId: service.projectServiceId,
          amount: fromCents(toCents(values[service.projectServiceId].trim())!),
        })),
    };

    const invoiceId = selectedId;

    toast.warning("Konfirmasi Revenue Allocation", {
      description: `Yakin ingin menyimpan ${payload.allocations.length} alokasi untuk invoice ${allocation.invoice.invoiceNo}?`,
      duration: 10000,
      action: {
        label: "Ya, Simpan",
        onClick: async () => {
          setSaving(true);

          try {
            await profitabilityService.saveInvoiceAllocations(
              invoiceId,
              payload,
            );

            const response =
              await profitabilityService.getInvoiceAllocations(invoiceId);

            setAllocation(response.data);
            setValues(
              Object.fromEntries(
                response.data.allocations.map((item) => [
                  item.projectServiceId,
                  item.amount,
                ]),
              ),
            );

            toast.success("Revenue Allocation berhasil disimpan.");
          } catch (error) {
            toast.error(
              error instanceof Error
                ? error.message
                : "Gagal menyimpan Revenue Allocation.",
            );
          } finally {
            setSaving(false);
          }
        },
      },
      cancel: {
        label: "Batal",
        onClick: () => toast.info("Penyimpanan dibatalkan."),
      },
    });
  };

  const currency = allocation?.invoice.currency ?? "IDR";
  const currentInvoice = invoices.find((item) => item.id === selectedId);

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-start gap-3">
          <Button variant="outline" size="icon" asChild>
            <Link href={baseUrl} aria-label="Kembali">
              <ArrowLeft className="size-4" />
            </Link>
          </Button>
          <div>
            <h1 className="text-2xl font-semibold">Revenue Allocation</h1>
            <p className="text-sm text-muted-foreground">
              Distribusikan Net Revenue invoice ke layanan Project.
            </p>
          </div>
        </div>

        <Button
          variant="outline"
          disabled={loadingList || saving}
          onClick={() => setRefreshKey((value) => value + 1)}>
          <RefreshCw className="size-4" />
          Refresh
        </Button>
      </div>

      <div className="rounded-xl border bg-card p-5">
        <h2 className="font-semibold">Pilih Invoice</h2>
        <p className="mt-1 text-xs text-muted-foreground">
          Invoice Draft dan Cancelled tidak bisa dialokasikan.
        </p>

        {loadingList ? (
          <p className="mt-4 text-sm text-muted-foreground">
            Memuat invoice...
          </p>
        ) : (
          <>
            <div className="mt-4 grid gap-2 sm:grid-cols-2 lg:grid-cols-3">
              {invoices.map((invoice) => (
                <button
                  type="button"
                  key={invoice.id}
                  disabled={saving}
                  onClick={() => setSelectedId(invoice.id)}
                  className={`rounded-lg border p-3 text-left transition-colors ${
                    selectedId === invoice.id
                      ? "border-primary bg-primary/5"
                      : "hover:bg-muted/40"
                  }`}>
                  <p className="font-medium">{invoice.invoiceNo}</p>
                  <p className="mt-1 text-xs text-muted-foreground">
                    {invoice.status}
                  </p>
                  <p className="mt-2 text-sm font-semibold">
                    {formatMoney(String(invoice.totalAmount), invoice.currency)}
                  </p>
                  <p className="text-xs text-muted-foreground">
                    Total tagihan termasuk pajak
                  </p>
                </button>
              ))}
            </div>

            {invoices.length === 0 && (
              <p className="mt-4 text-sm text-muted-foreground">
                Tidak ada invoice yang dapat dialokasikan pada halaman ini.
              </p>
            )}

            <div className="mt-4 flex items-center justify-between border-t pt-4">
              <p className="text-xs text-muted-foreground">
                Halaman {invoicePage} dari {Math.max(invoiceTotalPages, 1)}
              </p>
              <div className="flex gap-2">
                <Button
                  size="sm"
                  variant="outline"
                  disabled={loadingList || invoicePage <= 1}
                  onClick={() => setInvoicePage((page) => page - 1)}>
                  Sebelumnya
                </Button>
                <Button
                  size="sm"
                  variant="outline"
                  disabled={loadingList || invoicePage >= invoiceTotalPages}
                  onClick={() => setInvoicePage((page) => page + 1)}>
                  Berikutnya
                </Button>
              </div>
            </div>
          </>
        )}
      </div>

      {selectedId && (
        <div className="rounded-xl border bg-card p-5">
          {loadingAllocation ? (
            <div className="flex items-center gap-2 text-sm text-muted-foreground">
              <Loader2 className="size-4 animate-spin" />
              Memuat Revenue Allocation...
            </div>
          ) : !allocation ? (
            <p className="text-sm text-muted-foreground">
              Data alokasi invoice belum tersedia. Tekan Refresh untuk mencoba
              lagi.
            </p>
          ) : (
            <div className="space-y-5">
              <div>
                <h2 className="font-semibold">
                  Alokasi {allocation.invoice.invoiceNo}
                </h2>
                <p className="text-xs text-muted-foreground">
                  {currentInvoice?.status ?? allocation.invoice.status} ·{" "}
                  {currency}
                </p>
              </div>

              <div className="grid gap-3 sm:grid-cols-3">
                {[
                  {
                    label: "Net Revenue",
                    value: allocation.summary.netRevenue,
                  },
                  {
                    label: "Total Alokasi Input",
                    value: fromCents(calculation.total),
                  },
                  {
                    label: "Sisa Revenue",
                    value:
                      calculation.remaining === null
                        ? "0.00"
                        : fromCents(calculation.remaining),
                  },
                ].map((item) => (
                  <div key={item.label} className="rounded-lg border p-4">
                    <p className="text-xs text-muted-foreground">
                      {item.label}
                    </p>
                    <p className="mt-2 text-lg font-semibold">
                      {formatMoney(item.value, currency)}
                    </p>
                  </div>
                ))}
              </div>

              <div className="overflow-x-auto rounded-lg border">
                <table className="w-full text-sm">
                  <thead className="bg-muted/40">
                    <tr>
                      <th className="px-4 py-3 text-left">Service</th>
                      <th className="px-4 py-3 text-right">
                        Revenue Allocation
                      </th>
                    </tr>
                  </thead>
                  <tbody>
                    {services.map((service) => (
                      <tr key={service.projectServiceId} className="border-t">
                        <td className="px-4 py-3">
                          <p className="font-medium">{service.serviceName}</p>
                          <p className="text-xs text-muted-foreground">
                            {service.status}
                          </p>
                        </td>
                        <td className="px-4 py-3">
                          <Input
                            inputMode="decimal"
                            placeholder="0.00"
                            value={values[service.projectServiceId] ?? ""}
                            disabled={!canUpdate || saving}
                            onChange={(event) =>
                              setValues((previous) => ({
                                ...previous,
                                [service.projectServiceId]: event.target.value,
                              }))
                            }
                            className="ml-auto max-w-56 text-right"
                          />
                        </td>
                      </tr>
                    ))}
                    {services.length === 0 && (
                      <tr>
                        <td
                          colSpan={2}
                          className="p-6 text-center text-muted-foreground">
                          Project belum memiliki Service.
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>

              {(calculation.invalid || calculation.exceeds) && (
                <p role="alert" className="text-sm text-destructive">
                  {calculation.invalid
                    ? "Nominal harus positif dengan maksimal dua digit desimal."
                    : "Total alokasi melebihi Net Revenue invoice."}
                </p>
              )}

              <div className="flex flex-wrap items-center justify-between gap-3">
                <p className="text-xs text-muted-foreground">
                  Kosongkan nominal Service untuk menghapus alokasinya.
                  Perubahan disimpan sekaligus.
                </p>
                {canUpdate && (
                  <Button
                    disabled={
                      saving ||
                      loadingAllocation ||
                      services.length === 0 ||
                      calculation.invalid ||
                      calculation.exceeds
                    }
                    onClick={() => void save()}>
                    {saving ? (
                      <Loader2 className="size-4 animate-spin" />
                    ) : (
                      <Save className="size-4" />
                    )}
                    Simpan Alokasi
                  </Button>
                )}
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
