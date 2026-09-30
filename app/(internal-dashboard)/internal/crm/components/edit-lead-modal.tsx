"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { Loader2, Pencil } from "lucide-react";
import { useEffect, useState } from "react";
import { useForm, useWatch } from "react-hook-form";
import { toast } from "sonner";

import {
  LeadItem,
  UpdateLeadPayload,
  leadService,
} from "@/app/services/crm/lead.service";
import { UserItem, userService } from "@/app/services/userManagement.service";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
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
import { Textarea } from "@/components/ui/textarea";

import { UpdateLeadFormValues, updateLeadSchema } from "./lead-form-schema";

interface EditLeadModalProps {
  lead: LeadItem;
  onSuccess?: () => void | Promise<void>;
}

function getDefaultValues(lead: LeadItem): UpdateLeadFormValues {
  return {
    company: lead.company,
    pic: lead.pic,
    phone: lead.phone,
    email: lead.email ?? "",
    industry: lead.industry ?? "",
    address: lead.address ?? "",
    estimatedValue:
      lead.estimatedValue !== null && lead.estimatedValue !== undefined
        ? Number(lead.estimatedValue)
        : undefined,
    source: lead.source ?? "",
    status: lead.status as UpdateLeadFormValues["status"],
    assigneeId: lead.assigneeId,
  };
}

export function EditLeadModal({ lead, onSuccess }: EditLeadModalProps) {
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [loadingSales, setLoadingSales] = useState(false);
  const [salesUsers, setSalesUsers] = useState<UserItem[]>([]);

  const {
    register,
    handleSubmit,
    setValue,
    control,
    reset,
    formState: { errors },
  } = useForm<UpdateLeadFormValues>({
    resolver: zodResolver(updateLeadSchema),
    defaultValues: getDefaultValues(lead),
  });

  const selectedStatus = useWatch({
    control,
    name: "status",
  });

  const selectedSource = useWatch({
    control,
    name: "source",
  });

  const selectedAssigneeId = useWatch({
    control,
    name: "assigneeId",
  });

  useEffect(() => {
    if (!open) return;

    reset(getDefaultValues(lead));

    const loadSalesUsers = async () => {
      try {
        setLoadingSales(true);

        const response = await userService.getUsers({
          isActive: true,
          page: 1,
          limit: 100,
        });

        if (!response.success) return;

        const sales = response.data.filter((user) =>
          user.roles.some(({ role }) =>
            ["SALES_MANAGER", "SALES_EXECUTIVE"].includes(role.code),
          ),
        );

        setSalesUsers(sales);
      } catch (error) {
        toast.error("Gagal memuat Sales", {
          description:
            error instanceof Error
              ? error.message
              : "Terjadi kesalahan pada server.",
        });
      } finally {
        setLoadingSales(false);
      }
    };

    void loadSalesUsers();
  }, [open, lead, reset]);

  const onSubmit = async (values: UpdateLeadFormValues) => {
    try {
      setLoading(true);

      const payload: UpdateLeadPayload = {
        company: values.company.trim(),
        pic: values.pic.trim(),
        phone: values.phone.trim(),
        email: values.email?.trim() || undefined,
        industry: values.industry?.trim() || undefined,
        address: values.address?.trim() || undefined,
        estimatedValue: values.estimatedValue,
        source: values.source?.trim() || undefined,
        status: values.status,
        assigneeId: values.assigneeId,
      };

      const response = await leadService.update(lead.id, payload);

      toast.success("Lead berhasil diperbarui", {
        description: `${response.data.leadCode} - ${response.data.company}`,
      });

      setOpen(false);

      await onSuccess?.();
    } catch (error) {
      toast.error("Gagal memperbarui lead", {
        description:
          error instanceof Error
            ? error.message
            : "Terjadi kesalahan pada server.",
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button variant="ghost" size="sm" className="w-full justify-start">
          <Pencil className="mr-2 size-4" />
          Edit Lead
        </Button>
      </DialogTrigger>

      <DialogContent className="max-h-[90vh] overflow-y-auto sm:max-w-2xl">
        <DialogHeader>
          <DialogTitle>Edit Lead</DialogTitle>

          <DialogDescription>
            Perbarui informasi lead, Sales assignee, dan status pipeline.
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit(onSubmit)} className="space-y-6 pt-2">
          <div className="grid gap-4 sm:grid-cols-2">
            <div className="space-y-2">
              <Label htmlFor={`company-${lead.id}`}>Nama Perusahaan</Label>

              <Input
                id={`company-${lead.id}`}
                disabled={loading}
                {...register("company")}
              />

              {errors.company && (
                <p className="text-xs text-destructive">
                  {errors.company.message}
                </p>
              )}
            </div>

            <div className="space-y-2">
              <Label htmlFor={`pic-${lead.id}`}>PIC / Contact Person</Label>

              <Input
                id={`pic-${lead.id}`}
                disabled={loading}
                {...register("pic")}
              />

              {errors.pic && (
                <p className="text-xs text-destructive">{errors.pic.message}</p>
              )}
            </div>

            <div className="space-y-2">
              <Label htmlFor={`phone-${lead.id}`}>Nomor Telepon</Label>

              <Input
                id={`phone-${lead.id}`}
                type="tel"
                disabled={loading}
                {...register("phone")}
              />

              {errors.phone && (
                <p className="text-xs text-destructive">
                  {errors.phone.message}
                </p>
              )}
            </div>

            <div className="space-y-2">
              <Label htmlFor={`email-${lead.id}`}>Email</Label>

              <Input
                id={`email-${lead.id}`}
                type="email"
                disabled={loading}
                {...register("email")}
              />

              {errors.email && (
                <p className="text-xs text-destructive">
                  {errors.email.message}
                </p>
              )}
            </div>

            <div className="space-y-2">
              <Label htmlFor={`industry-${lead.id}`}>Industry</Label>

              <Input
                id={`industry-${lead.id}`}
                disabled={loading}
                {...register("industry")}
              />

              {errors.industry && (
                <p className="text-xs text-destructive">
                  {errors.industry.message}
                </p>
              )}
            </div>

            <div className="space-y-2">
              <Label>Status</Label>

              <Select
                value={selectedStatus}
                disabled={loading}
                onValueChange={(value) =>
                  setValue("status", value as UpdateLeadFormValues["status"], {
                    shouldValidate: true,
                    shouldDirty: true,
                  })
                }>
                <SelectTrigger className="w-full">
                  <SelectValue placeholder="Pilih status" />
                </SelectTrigger>

                <SelectContent>
                  <SelectItem value="NEW">New</SelectItem>
                  <SelectItem value="QUALIFIED">Qualified</SelectItem>
                  <SelectItem value="PROPOSAL">Proposal</SelectItem>
                  <SelectItem value="NEGOTIATION">Negotiation</SelectItem>
                  <SelectItem value="WON">Won</SelectItem>
                  <SelectItem value="LOST">Lost</SelectItem>
                </SelectContent>
              </Select>

              {errors.status && (
                <p className="text-xs text-destructive">
                  {errors.status.message}
                </p>
              )}
            </div>

            <div className="space-y-2">
              <Label>Lead Source</Label>

              <Select
                value={selectedSource}
                disabled={loading}
                onValueChange={(value) =>
                  setValue("source", value ?? "", {
                    shouldValidate: true,
                    shouldDirty: true,
                  })
                }>
                <SelectTrigger className="w-full">
                  <SelectValue placeholder="Pilih sumber lead" />
                </SelectTrigger>

                <SelectContent>
                  <SelectItem value="Website">Website</SelectItem>
                  <SelectItem value="Referral">Referral</SelectItem>
                  <SelectItem value="WhatsApp">WhatsApp</SelectItem>
                  <SelectItem value="Instagram">Instagram</SelectItem>
                  <SelectItem value="Facebook">Facebook</SelectItem>
                  <SelectItem value="Google Ads">Google Ads</SelectItem>
                  <SelectItem value="Event">Event</SelectItem>
                  <SelectItem value="Other">Lainnya</SelectItem>
                </SelectContent>
              </Select>

              {errors.source && (
                <p className="text-xs text-destructive">
                  {errors.source.message}
                </p>
              )}
            </div>

            <div className="space-y-2">
              <Label htmlFor={`estimatedValue-${lead.id}`}>
                Estimated Value
              </Label>

              <Input
                id={`estimatedValue-${lead.id}`}
                type="number"
                min={0}
                step={1000}
                disabled={loading}
                {...register("estimatedValue", {
                  setValueAs: (value) =>
                    value === "" ? undefined : Number(value),
                })}
              />

              {errors.estimatedValue && (
                <p className="text-xs text-destructive">
                  {errors.estimatedValue.message}
                </p>
              )}
            </div>

            <div className="space-y-2">
              <Label>Sales Assignee</Label>

              <Select
                value={selectedAssigneeId}
                disabled={loading || loadingSales}
                onValueChange={(value) =>
                  setValue("assigneeId", value ?? "", {
                    shouldValidate: true,
                    shouldDirty: true,
                  })
                }>
                <SelectTrigger className="w-full">
                  <SelectValue
                    placeholder={
                      loadingSales ? "Memuat Sales..." : "Pilih Sales"
                    }
                  />
                </SelectTrigger>

                <SelectContent>
                  {salesUsers.length > 0 ? (
                    salesUsers.map((user) => (
                      <SelectItem key={user.id} value={user.id}>
                        {user.name} - {user.email}
                      </SelectItem>
                    ))
                  ) : (
                    <SelectItem value="__empty" disabled>
                      Tidak ada Sales aktif
                    </SelectItem>
                  )}
                </SelectContent>
              </Select>

              {errors.assigneeId && (
                <p className="text-xs text-destructive">
                  {errors.assigneeId.message}
                </p>
              )}
            </div>

            <div className="space-y-2 sm:col-span-2">
              <Label htmlFor={`address-${lead.id}`}>Alamat</Label>

              <Textarea
                id={`address-${lead.id}`}
                rows={3}
                disabled={loading}
                {...register("address")}
              />

              {errors.address && (
                <p className="text-xs text-destructive">
                  {errors.address.message}
                </p>
              )}
            </div>
          </div>

          <DialogFooter className="pt-4">
            <Button
              type="button"
              variant="outline"
              disabled={loading}
              onClick={() => setOpen(false)}>
              Batal
            </Button>

            <Button type="submit" disabled={loading || loadingSales}>
              {loading && <Loader2 className="mr-2 size-4 animate-spin" />}
              Simpan Perubahan
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
