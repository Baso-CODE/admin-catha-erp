"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { Loader2, Pencil } from "lucide-react";
import { ReactNode, useEffect, useState } from "react";
import { useForm, useWatch } from "react-hook-form";
import { toast } from "sonner";
import * as z from "zod";

import {
  ClientPortalUserOption,
  ContactPersonItem,
  UpdateContactPersonPayload,
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

const editContactPersonSchema = z.object({
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
  userId: z.string().nullable().optional(),
  isPrimary: z.boolean(),
  status: z.enum(["ACTIVE", "INACTIVE"]),
});

type EditContactPersonFormValues = z.infer<typeof editContactPersonSchema>;

interface EditContactPersonModalProps {
  contact: ContactPersonItem;
  onSuccess?: () => void | Promise<void>;
  trigger?: ReactNode;
}

export function EditContactPersonModal({
  contact,
  onSuccess,
  trigger,
}: EditContactPersonModalProps) {
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [loadingUsers, setLoadingUsers] = useState(false);
  const [portalUsers, setPortalUsers] = useState<ClientPortalUserOption[]>([]);

  const {
    register,
    handleSubmit,
    setValue,
    control,
    reset,
    formState: { errors },
  } = useForm<EditContactPersonFormValues>({
    resolver: zodResolver(editContactPersonSchema),
    defaultValues: {
      fullName: contact.fullName,
      position: contact.position,
      department: contact.department ?? "",
      email: contact.email,
      phone: contact.phone ?? "",
      mobile: contact.mobile ?? "",
      userId: contact.userId ?? null,
      isPrimary: contact.isPrimary,
      status: contact.status,
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

  const userId = useWatch({
    control,
    name: "userId",
  });

  useEffect(() => {
    if (!open) return;

    reset({
      fullName: contact.fullName,
      position: contact.position,
      department: contact.department ?? "",
      email: contact.email,
      phone: contact.phone ?? "",
      mobile: contact.mobile ?? "",
      userId: contact.userId ?? null,
      isPrimary: contact.isPrimary,
      status: contact.status,
    });

    const loadPortalUsers = async () => {
      try {
        setLoadingUsers(true);

        const response = await contactPersonService.getPortalUserOptions(
          contact.userId ?? undefined,
        );

        setPortalUsers(response.data);
      } catch (error) {
        toast.error("Gagal mengambil user Client Portal", {
          description:
            error instanceof Error
              ? error.message
              : "Terjadi kesalahan saat mengambil user.",
        });
      } finally {
        setLoadingUsers(false);
      }
    };

    void loadPortalUsers();
  }, [open, contact, reset]);

  const handleOpenChange = (value: boolean) => {
    setOpen(value);

    if (!value) {
      reset({
        fullName: contact.fullName,
        position: contact.position,
        department: contact.department ?? "",
        email: contact.email,
        phone: contact.phone ?? "",
        mobile: contact.mobile ?? "",
        userId: contact.userId ?? null,
        isPrimary: contact.isPrimary,
        status: contact.status,
      });

      setPortalUsers([]);
    }
  };

  const onSubmit = async (values: EditContactPersonFormValues) => {
    try {
      setLoading(true);

      const payload: UpdateContactPersonPayload = {
        fullName: values.fullName.trim(),
        position: values.position.trim(),
        department: values.department?.trim() || undefined,
        email: values.email.trim(),
        phone: values.phone?.trim() || undefined,
        mobile: values.mobile?.trim() || undefined,
        userId: values.userId ?? null,
        isPrimary: values.isPrimary,
        status: values.status,
      };

      const response = await contactPersonService.updateContactPerson(
        contact.id,
        payload,
      );

      if (response.success) {
        toast.success("Contact person berhasil diperbarui", {
          description: `"${response.data.fullName}" berhasil diperbarui.`,
        });

        handleOpenChange(false);
        await onSuccess?.();
      }
    } catch (error) {
      toast.error("Gagal memperbarui contact person", {
        description:
          error instanceof Error
            ? error.message
            : "Terjadi kesalahan saat memperbarui contact person.",
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogTrigger asChild>
        {trigger ?? (
          <Button variant="outline" size="sm" className="gap-2">
            <Pencil className="size-4" />
            Edit Contact
          </Button>
        )}
      </DialogTrigger>

      <DialogContent className="max-h-[90vh] overflow-y-auto sm:max-w-xl">
        <DialogHeader>
          <DialogTitle>Edit Contact Person</DialogTitle>

          <DialogDescription>
            Perbarui informasi contact person client.
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit(onSubmit)} className="space-y-5 pt-2">
          <div className="space-y-2">
            <Label htmlFor={`fullName-${contact.id}`}>Nama Lengkap</Label>

            <Input
              id={`fullName-${contact.id}`}
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
              <Label htmlFor={`position-${contact.id}`}>Jabatan</Label>

              <Input
                id={`position-${contact.id}`}
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
              <Label htmlFor={`department-${contact.id}`}>Department</Label>

              <Input
                id={`department-${contact.id}`}
                disabled={loading}
                {...register("department")}
              />
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor={`email-${contact.id}`}>Email</Label>

            <Input
              id={`email-${contact.id}`}
              type="email"
              disabled={loading}
              {...register("email")}
            />

            {errors.email && (
              <p className="text-xs text-destructive">{errors.email.message}</p>
            )}
          </div>

          <div className="grid gap-4 sm:grid-cols-2">
            <div className="space-y-2">
              <Label htmlFor={`phone-${contact.id}`}>Telepon</Label>

              <Input
                id={`phone-${contact.id}`}
                disabled={loading}
                {...register("phone")}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor={`mobile-${contact.id}`}>Mobile</Label>

              <Input
                id={`mobile-${contact.id}`}
                disabled={loading}
                {...register("mobile")}
              />
            </div>
          </div>

          <div className="space-y-2">
            <Label>Akun Login Client Portal</Label>

            <Select
              value={userId ?? "NONE"}
              disabled={loading || loadingUsers}
              onValueChange={(value) =>
                setValue("userId", value === "NONE" ? null : value, {
                  shouldValidate: true,
                  shouldDirty: true,
                })
              }>
              <SelectTrigger className="w-full">
                <SelectValue
                  placeholder={
                    loadingUsers ? "Memuat user..." : "Pilih akun Client Portal"
                  }
                />
              </SelectTrigger>

              <SelectContent>
                <SelectItem value="NONE">Tidak dihubungkan</SelectItem>

                {portalUsers.map((user) => (
                  <SelectItem key={user.id} value={user.id}>
                    {user.name} - {user.email}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>

            {contact.user && (
              <p className="text-xs text-muted-foreground">
                Saat ini terhubung ke{" "}
                <span className="font-medium text-foreground">
                  {contact.user.name}
                </span>{" "}
                ({contact.user.email})
              </p>
            )}

            {!contact.user && (
              <p className="text-xs text-muted-foreground">
                Contact ini belum memiliki akun login Client Portal.
              </p>
            )}
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
              id={`isPrimary-${contact.id}`}
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
              <Label
                htmlFor={`isPrimary-${contact.id}`}
                className="cursor-pointer">
                Primary Contact
              </Label>

              <p className="text-xs text-muted-foreground">
                Jadikan contact ini sebagai contact utama client.
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

            <Button type="submit" disabled={loading || loadingUsers}>
              {loading && <Loader2 className="mr-2 size-4 animate-spin" />}
              Simpan Perubahan
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
