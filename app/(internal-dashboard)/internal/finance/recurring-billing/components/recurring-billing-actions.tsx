"use client";

import { recurringBillingService } from "@/app/services/recurring-billing.service";
import { Button } from "@/components/ui/button";
import { Loader2, Pencil, Play } from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { toast } from "sonner";

interface Props {
  id: string;
  isActive: boolean;
  canUpdate: boolean;
  canGenerate: boolean;
  canEdit: boolean;
}

export function RecurringBillingActions({
  id,
  isActive,
  canUpdate,
  canGenerate,
  canEdit,
}: Props) {
  const router = useRouter();
  const [loading, setLoading] = useState(false);

  async function handleToggle() {
    try {
      setLoading(true);
      if (isActive) {
        await recurringBillingService.deactivate(id);
      } else {
        await recurringBillingService.activate(id);
      }
      toast.success("Status recurring billing berhasil diperbarui.");
      router.refresh();
    } catch (error) {
      toast.error(
        error instanceof Error ? error.message : "Gagal mengubah status.",
      );
    } finally {
      setLoading(false);
    }
  }

  async function handleGenerate() {
    if (!window.confirm("Generate invoice untuk siklus yang jatuh tempo?")) {
      return;
    }

    try {
      setLoading(true);
      const response = await recurringBillingService.generateInvoice(id);
      toast.success(`Invoice ${response.data.invoiceNo} berhasil dibuat.`);
      router.refresh();
    } catch (error) {
      toast.error(
        error instanceof Error ? error.message : "Gagal membuat invoice.",
      );
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="flex flex-wrap gap-2">
      {canUpdate && canEdit && (
        <Button variant="outline" asChild>
          <Link href={`/internal/finance/recurring-billing/${id}/edit`}>
            <Pencil className="size-4" />
            Edit
          </Link>
        </Button>
      )}

      {canGenerate && isActive && (
        <Button
          variant="outline"
          disabled={loading}
          onClick={() => void handleGenerate()}>
          {loading ? (
            <Loader2 className="size-4 animate-spin" />
          ) : (
            <Play className="size-4" />
          )}
          Generate Invoice
        </Button>
      )}

      {canUpdate && (
        <Button
          variant={isActive ? "destructive" : "default"}
          disabled={loading}
          onClick={() => void handleToggle()}>
          {loading && <Loader2 className="size-4 animate-spin" />}
          {isActive ? "Nonaktifkan" : "Aktifkan"}
        </Button>
      )}
    </div>
  );
}
