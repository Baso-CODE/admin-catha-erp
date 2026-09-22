"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { Loader2, Plus } from "lucide-react";
import { useEffect, useState } from "react";
import { useForm, useWatch } from "react-hook-form";
import { toast } from "sonner";

import {
  CreateLeadPayload,
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

import { CreateLeadFormValues, createLeadSchema } from "./lead-form-schema";

interface CreateLeadModalProps {
  onSuccess?: () => void | Promise<void>;
}

export function CreateLeadModal({ onSuccess }: CreateLeadModalProps) {
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
  } = useForm<CreateLeadFormValues>({
    resolver: zodResolver(createLeadSchema),
    defaultValues: {
      company: "",
      pic: "",
      phone: "",
      email: "",
      industry: "",
      address: "",
      estimatedValue: undefined,
      source: "",
      assigneeId: "",
    },
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
  }, [open]);

  const handleOpenChange = (value: boolean) => {
    setOpen(value);

    if (!value) {
      reset();
    }
  };

  const onSubmit = async (values: CreateLeadFormValues) => {
    try {
      setLoading(true);

      const payload: CreateLeadPayload = {
        company: values.company.trim(),
        pic: values.pic.trim(),
        phone: values.phone.trim(),
        assigneeId: values.assigneeId,
        ...(values.email?.trim() && { email: values.email.trim() }),
        ...(values.industry?.trim() && { industry: values.industry.trim() }),
        ...(values.address?.trim() && { address: values.address.trim() }),
        ...(values.source && { source: values.source }),
        ...(values.estimatedValue !== undefined && {
          estimatedValue: values.estimatedValue,
        }),
      };

      const response = await leadService.create(payload);

      toast.success("Lead berhasil dibuat", {
        description: `${response.data.leadCode} - ${response.data.company}`,
      });

      reset();
      setOpen(false);

      await onSuccess?.();
    } catch (error) {
      toast.error("Gagal membuat lead", {
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
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogTrigger
        render={
          <Button className="gap-2">
            <Plus className="size-4" />
            Tambah Lead
          </Button>
        }
      />

      <DialogContent className="max-h-[90vh] overflow-y-auto sm:max-w-2xl">
        <DialogHeader>
          <DialogTitle>Tambah Lead Baru</DialogTitle>
          <DialogDescription>
            Masukkan informasi calon client dan tentukan Sales yang bertanggung
            jawab.
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit(onSubmit)} className="space-y-6 pt-2">
          <div className="grid gap-4 sm:grid-cols-2">
            <div className="space-y-2">
              <Label htmlFor="company">Nama Perusahaan</Label>

              <Input
                id="company"
                placeholder="PT Catha Indonesia"
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
              <Label htmlFor="pic">PIC / Contact Person</Label>

              <Input
                id="pic"
                placeholder="Budi Santoso"
                disabled={loading}
                {...register("pic")}
              />

              {errors.pic && (
                <p className="text-xs text-destructive">{errors.pic.message}</p>
              )}
            </div>

            <div className="space-y-2">
              <Label htmlFor="phone">Nomor Telepon</Label>

              <Input
                id="phone"
                type="tel"
                placeholder="081234567890"
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
              <Label htmlFor="email">Email</Label>

              <Input
                id="email"
                type="email"
                placeholder="client@company.com"
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
              <Label htmlFor="industry">Industry</Label>

              <Input
                id="industry"
                placeholder="Education"
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
              <Label htmlFor="source">Lead Source</Label>

              <Select
                value={selectedSource}
                onValueChange={(value) =>
                  setValue("source", value ?? "", {
                    shouldValidate: true,
                  })
                }>
                <SelectTrigger id="source" className="w-full">
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
              <Label htmlFor="estimatedValue">Estimated Value</Label>

              <Input
                id="estimatedValue"
                type="number"
                min={0}
                step={1000}
                placeholder="10000000"
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
              <Label htmlFor="assigneeId">Sales Assignee</Label>

              <Select
                value={selectedAssigneeId}
                disabled={loading || loadingSales}
                onValueChange={(value) =>
                  setValue("assigneeId", value ?? "", {
                    shouldValidate: true,
                  })
                }>
                <SelectTrigger id="assigneeId" className="w-full">
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
              <Label htmlFor="address">Alamat</Label>

              <Textarea
                id="address"
                rows={3}
                placeholder="Alamat perusahaan..."
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
              onClick={() => handleOpenChange(false)}>
              Batal
            </Button>

            <Button type="submit" disabled={loading || loadingSales}>
              {loading && <Loader2 className="mr-2 size-4 animate-spin" />}
              Simpan Lead
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
