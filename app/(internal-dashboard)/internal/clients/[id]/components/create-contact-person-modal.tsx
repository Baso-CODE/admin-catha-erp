"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { Loader2, Plus } from "lucide-react";
import { useState } from "react";
import { useForm, useWatch } from "react-hook-form";
import { toast } from "sonner";
import * as z from "zod";

import {
  CreateContactPersonPayload,
  contactPersonService,
} from "@/app/services/contactPerson.service";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
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

const createContactPersonSchema = z.object({
  fullName: z.string().trim().min(2, {
    message: "Nama minimal 2 karakter.",
  }),
  position: z.string().trim().min(2, {
    message: "Jabatan minimal 2 karakter.",
  }),
  department: z.string().trim().optional(),
  email: z.string().trim().email({
    message: "Format email tidak valid.",
  }),
  phone: z.string().trim().optional(),
  mobile: z.string().trim().optional(),
  isPrimary: z.boolean(),
  status: z.enum(["ACTIVE", "INACTIVE"]),
});

type CreateContactPersonFormValues = z.infer<typeof createContactPersonSchema>;

interface CreateContactPersonModalProps {
  clientId: string;
  onSuccess?: () => void | Promise<void>;
}

export function CreateContactPersonModal({
  clientId,
  onSuccess,
}: CreateContactPersonModalProps) {
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);

  const {
    register,
    handleSubmit,
    setValue,
    control,
    reset,
    formState: { errors },
  } = useForm<CreateContactPersonFormValues>({
    resolver: zodResolver(createContactPersonSchema),
    defaultValues: {
      fullName: "",
      position: "",
      department: "",
      email: "",
      phone: "",
      mobile: "",
      isPrimary: false,
      status: "ACTIVE",
    },
  });

  const status = useWatch({
    control,
    name: "status",
  });

  const isPrimary = useWatch({
    control,
    name: "isPrimary",
  });

  const handleOpenChange = (value: boolean) => {
    setOpen(value);

    if (!value) {
      reset({
        fullName: "",
        position: "",
        department: "",
        email: "",
        phone: "",
        mobile: "",
        isPrimary: false,
        status: "ACTIVE",
      });
    }
  };

  const onSubmit = async (values: CreateContactPersonFormValues) => {
    try {
      setLoading(true);

      const payload: CreateContactPersonPayload = {
        clientId,
        fullName: values.fullName.trim(),
        position: values.position.trim(),
        department: values.department?.trim() || undefined,
        email: values.email.trim(),
        phone: values.phone?.trim() || undefined,
        mobile: values.mobile?.trim() || undefined,
        isPrimary: values.isPrimary,
        status: values.status,
      };

      const response = await contactPersonService.createContactPerson(payload);

      if (response.success) {
        toast.success("Contact person berhasil dibuat", {
          description: `"${response.data.fullName}" berhasil ditambahkan.`,
        });

        handleOpenChange(false);
        await onSuccess?.();
      }
    } catch (error) {
      toast.error("Gagal membuat contact person", {
        description:
          error instanceof Error
            ? error.message
            : "Terjadi kesalahan saat membuat contact person.",
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogTrigger asChild>
        <Button className="gap-2">
          <Plus className="size-4" />
          Tambah Contact
        </Button>
      </DialogTrigger>

      <DialogContent className="max-h-[90vh] overflow-y-auto sm:max-w-xl">
        <DialogHeader>
          <DialogTitle>Tambah Contact Person</DialogTitle>

          <DialogDescription>
            Tambahkan PIC atau contact person untuk client ini.
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit(onSubmit)} className="space-y-5 pt-2">
          <div className="space-y-2">
            <Label htmlFor="fullName">Nama Lengkap</Label>

            <Input
              id="fullName"
              placeholder="Budi Santoso"
              disabled={loading}
              {...register("fullName")}
            />

            {errors.fullName && (
              <p className="text-xs text-destructive">
                {errors.fullName.message}
              </p>
            )}
          </div>

          <div className="grid gap-4 sm:grid-cols-2">
            <div className="space-y-2">
              <Label htmlFor="position">Jabatan</Label>

              <Input
                id="position"
                placeholder="Marketing Manager"
                disabled={loading}
                {...register("position")}
              />

              {errors.position && (
                <p className="text-xs text-destructive">
                  {errors.position.message}
                </p>
              )}
            </div>

            <div className="space-y-2">
              <Label htmlFor="department">Department</Label>

              <Input
                id="department"
                placeholder="Marketing"
                disabled={loading}
                {...register("department")}
              />
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="email">Email</Label>

            <Input
              id="email"
              type="email"
              placeholder="budi@company.com"
              disabled={loading}
              {...register("email")}
            />

            {errors.email && (
              <p className="text-xs text-destructive">{errors.email.message}</p>
            )}
          </div>

          <div className="grid gap-4 sm:grid-cols-2">
            <div className="space-y-2">
              <Label htmlFor="phone">Telepon</Label>

              <Input
                id="phone"
                placeholder="021..."
                disabled={loading}
                {...register("phone")}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="mobile">Mobile</Label>

              <Input
                id="mobile"
                placeholder="08..."
                disabled={loading}
                {...register("mobile")}
              />
            </div>
          </div>

          <div className="space-y-2">
            <Label>Status</Label>

            <Select
              value={status}
              disabled={loading}
              onValueChange={(value) =>
                setValue("status", value as "ACTIVE" | "INACTIVE", {
                  shouldValidate: true,
                  shouldDirty: true,
                })
              }>
              <SelectTrigger className="w-full">
                <SelectValue />
              </SelectTrigger>

              <SelectContent>
                <SelectItem value="ACTIVE">Active</SelectItem>

                <SelectItem value="INACTIVE">Inactive</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="flex items-start gap-3 rounded-lg border p-4">
            <Checkbox
              id="isPrimary"
              checked={isPrimary}
              disabled={loading}
              onCheckedChange={(checked) =>
                setValue("isPrimary", checked === true, {
                  shouldValidate: true,
                  shouldDirty: true,
                })
              }
            />

            <div className="space-y-1">
              <Label htmlFor="isPrimary" className="cursor-pointer">
                Primary Contact
              </Label>

              <p className="text-xs text-muted-foreground">
                Jadikan contact person ini sebagai contact utama client.
              </p>
            </div>
          </div>

          <DialogFooter className="pt-2">
            <Button
              type="button"
              variant="outline"
              disabled={loading}
              onClick={() => handleOpenChange(false)}>
              Batal
            </Button>

            <Button type="submit" disabled={loading}>
              {loading && <Loader2 className="mr-2 size-4 animate-spin" />}
              Simpan Contact
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
