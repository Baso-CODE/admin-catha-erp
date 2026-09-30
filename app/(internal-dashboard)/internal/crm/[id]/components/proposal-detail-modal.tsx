"use client";

import { Eye } from "lucide-react";

import { ProposalItem } from "@/app/services/crm/proposal.service";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";

interface ProposalDetailModalProps {
  proposal: ProposalItem;
}

function formatCurrency(value: number | string) {
  const amount = Number(value);

  if (Number.isNaN(amount)) return "-";

  return new Intl.NumberFormat("id-ID", {
    style: "currency",
    currency: "IDR",
    maximumFractionDigits: 0,
  }).format(amount);
}

function formatDate(value: string) {
  return new Intl.DateTimeFormat("id-ID", {
    day: "2-digit",
    month: "long",
    year: "numeric",
  }).format(new Date(value));
}

function getStatusBadge(status: string) {
  switch (status) {
    case "APPROVED":
      return (
        <Badge
          variant="outline"
          className="border-emerald-500/20 bg-emerald-500/10 text-emerald-600 dark:text-emerald-400">
          Approved
        </Badge>
      );

    case "SENT":
      return (
        <Badge
          variant="outline"
          className="border-blue-500/20 bg-blue-500/10 text-blue-600 dark:text-blue-400">
          Sent
        </Badge>
      );

    case "REJECTED":
      return (
        <Badge
          variant="outline"
          className="border-destructive/20 bg-destructive/10 text-destructive">
          Rejected
        </Badge>
      );

    case "EXPIRED":
      return (
        <Badge
          variant="outline"
          className="border-orange-500/20 bg-orange-500/10 text-orange-600 dark:text-orange-400">
          Expired
        </Badge>
      );

    case "WITHDRAWN":
      return (
        <Badge
          variant="outline"
          className="border-muted-foreground/20 bg-muted text-muted-foreground">
          Withdrawn
        </Badge>
      );

    default:
      return <Badge variant="outline">Draft</Badge>;
  }
}

export function ProposalDetailModal({ proposal }: ProposalDetailModalProps) {
  return (
    <Dialog>
      <DialogTrigger asChild>
        <Button
          variant="ghost"
          className="h-auto w-full justify-start rounded-sm px-2 py-1.5 text-sm font-normal">
          <Eye className="mr-2 size-4" />
          Lihat Detail
        </Button>
      </DialogTrigger>

      <DialogContent className="sm:max-w-xl">
        <DialogHeader>
          <DialogTitle>Detail Proposal</DialogTitle>

          <DialogDescription>
            Informasi lengkap proposal {proposal.proposalNo}.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-5 py-2">
          <div className="flex flex-col gap-3 rounded-lg border bg-muted/30 p-4 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <p className="text-xs text-muted-foreground">Proposal Number</p>

              <p className="mt-1 font-semibold">{proposal.proposalNo}</p>
            </div>

            {getStatusBadge(proposal.status)}
          </div>

          <div className="grid gap-4 sm:grid-cols-2">
            <div className="space-y-1">
              <p className="text-xs text-muted-foreground">Version</p>

              <p className="text-sm font-medium">{proposal.version}</p>
            </div>

            <div className="space-y-1">
              <p className="text-xs text-muted-foreground">Valid Until</p>

              <p className="text-sm font-medium">
                {formatDate(proposal.validUntil)}
              </p>
            </div>

            <div className="space-y-1 sm:col-span-2">
              <p className="text-xs text-muted-foreground">Subject</p>

              <p className="text-sm font-medium">{proposal.subject}</p>
            </div>

            <div className="space-y-1 sm:col-span-2">
              <p className="text-xs text-muted-foreground">Amount</p>

              <p className="text-lg font-semibold">
                {formatCurrency(proposal.amount)}
              </p>
            </div>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
