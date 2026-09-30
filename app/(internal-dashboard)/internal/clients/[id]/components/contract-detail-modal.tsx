"use client";

import {
  CalendarDays,
  FileText,
  Globe2,
  Link2,
  ReceiptText,
} from "lucide-react";
import { ReactNode } from "react";

import { ContractItem } from "@/app/services/contract.service";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";

interface ContractDetailModalProps {
  contract: ContractItem;
  trigger?: ReactNode;
}

export function ContractDetailModal({
  contract,
  trigger,
}: ContractDetailModalProps) {
  const formatCurrency = (value: string | number, currency = "IDR") => {
    return new Intl.NumberFormat("id-ID", {
      style: "currency",
      currency,
      maximumFractionDigits: 0,
    }).format(Number(value));
  };

  const formatDate = (value: string) => {
    return new Intl.DateTimeFormat("id-ID", {
      day: "2-digit",
      month: "short",
      year: "numeric",
    }).format(new Date(value));
  };

  return (
    <Dialog>
      <DialogTrigger asChild>{trigger}</DialogTrigger>

      <DialogContent className="max-h-[90vh] overflow-y-auto sm:max-w-2xl">
        <DialogHeader>
          <DialogTitle>Detail Contract</DialogTitle>

          <DialogDescription>
            Informasi lengkap contract client.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-6 pt-2">
          <div className="flex flex-col gap-3 border-b pb-5 sm:flex-row sm:items-start sm:justify-between">
            <div>
              <h3 className="text-lg font-semibold">{contract.title}</h3>

              <p className="text-sm text-muted-foreground">
                {contract.contractNo}
              </p>
            </div>

            <span className="w-fit rounded-full bg-muted px-3 py-1 text-xs font-medium">
              {contract.status}
            </span>
          </div>

          <div className="grid gap-5 sm:grid-cols-2">
            <DetailItem
              icon={FileText}
              label="Contract Type"
              value={contract.contractType ?? "-"}
            />

            <DetailItem
              icon={ReceiptText}
              label="Nilai Contract"
              value={formatCurrency(contract.value, contract.currency)}
            />

            <DetailItem
              icon={CalendarDays}
              label="Start Date"
              value={formatDate(contract.startDate)}
            />

            <DetailItem
              icon={CalendarDays}
              label="End Date"
              value={formatDate(contract.endDate)}
            />

            <DetailItem
              icon={ReceiptText}
              label="Payment Term"
              value={contract.paymentTerm ?? "-"}
            />

            <DetailItem
              icon={FileText}
              label="Renewal Reminder"
              value={contract.renewalReminder ? "Aktif" : "Tidak Aktif"}
            />
          </div>

          <div className="rounded-xl border p-4">
            <p className="mb-3 text-sm font-medium">Client</p>

            <div className="grid gap-4 sm:grid-cols-2">
              <DetailItem
                icon={Globe2}
                label="Company"
                value={contract.client?.companyName ?? "-"}
              />

              <DetailItem
                icon={FileText}
                label="Client Code"
                value={contract.client?.clientCode ?? "-"}
              />
            </div>
          </div>

          <div className="rounded-xl border p-4">
            <p className="mb-3 text-sm font-medium">Quotation</p>

            {contract.quotation ? (
              <div className="grid gap-4 sm:grid-cols-2">
                <DetailItem
                  icon={FileText}
                  label="Quotation No"
                  value={contract.quotation.quotationNo}
                />

                <DetailItem
                  icon={ReceiptText}
                  label="Quotation Amount"
                  value={formatCurrency(
                    contract.quotation.amount,
                    contract.currency,
                  )}
                />

                <DetailItem
                  icon={FileText}
                  label="Quotation Status"
                  value={contract.quotation.status}
                />
              </div>
            ) : (
              <p className="text-sm text-muted-foreground">
                Contract ini tidak memiliki quotation.
              </p>
            )}
          </div>

          <div className="space-y-4">
            <TextSection title="SLA Terms" value={contract.slaTerms} />

            <TextSection
              title="Terms & Conditions"
              value={contract.termsConditions}
            />
          </div>

          {contract.documentUrl && (
            <div className="rounded-xl border p-4">
              <p className="mb-3 text-sm font-medium">Contract Document</p>

              <a
                href={contract.documentUrl}
                target="_blank"
                rel="noreferrer"
                className="inline-flex items-center gap-2 text-sm font-medium hover:underline">
                <Link2 className="size-4" />
                Buka Document
              </a>
            </div>
          )}

          {contract._count && (
            <div className="grid gap-3 sm:grid-cols-3">
              <SummaryItem label="Projects" value={contract._count.projects} />

              <SummaryItem
                label="Recurring Billing"
                value={contract._count.recurringBillings}
              />

              <SummaryItem
                label="Attachments"
                value={contract._count.attachments}
              />
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}

interface DetailItemProps {
  icon: React.ElementType;
  label: string;
  value: React.ReactNode;
}

function DetailItem({ icon: Icon, label, value }: DetailItemProps) {
  return (
    <div className="flex items-start gap-3">
      <div className="mt-0.5 rounded-md bg-muted p-2">
        <Icon className="size-4 text-muted-foreground" />
      </div>

      <div className="min-w-0">
        <p className="text-xs text-muted-foreground">{label}</p>

        <div className="mt-1 wrap-break-word text-sm font-medium">{value}</div>
      </div>
    </div>
  );
}

interface TextSectionProps {
  title: string;
  value?: string | null;
}

function TextSection({ title, value }: TextSectionProps) {
  return (
    <div>
      <p className="mb-2 text-sm font-medium">{title}</p>

      <div className="whitespace-pre-wrap rounded-xl border bg-muted/20 p-4 text-sm">
        {value || "-"}
      </div>
    </div>
  );
}

interface SummaryItemProps {
  label: string;
  value: number;
}

function SummaryItem({ label, value }: SummaryItemProps) {
  return (
    <div className="rounded-xl border p-4">
      <p className="text-xs text-muted-foreground">{label}</p>

      <p className="mt-1 text-xl font-semibold">{value}</p>
    </div>
  );
}
