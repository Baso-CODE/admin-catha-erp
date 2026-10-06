"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { Loader2, Pencil } from "lucide-react";
import { ReactNode, useEffect, useState } from "react";
import { useForm, useWatch } from "react-hook-form";
import { toast } from "sonner";
import * as z from "zod";

import {
  ClientItem,
  ClientStatus,
  UpdateClientPayload,
  clientService,
} from "@/app/services/client.service";
import {
  UserOptionItem,
  userService,
} from "@/app/services/userManagement.service";
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

const editClientSchema = z.object({
  companyName: z.string().trim().min(2, {
    message: "Nama perusahaan minimal 2 karakter.",
  }),
  industry: z.string().trim().optional(),
  businessType: z.string().trim().optional(),
  website: z
    .string()
    .trim()
    .refine((value) => !value || z.string().url().safeParse(value).success, {
      message: "Website harus berupa URL yang valid.",
    })
    .optional(),
  address: z.string().trim().optional(),
  status: z.enum(["ACTIVE", "INACTIVE"]),
  accountManagerId: z.string().min(1, {
    message: "Account Manager wajib dipilih.",
  }),
});

type EditClientFormValues = z.infer<typeof editClientSchema>;

interface EditClientModalProps {
  client: ClientItem;
  onSuccess?: () => void | Promise<void>;
  trigger?: ReactNode;
}

export function EditClientModal({
  client,
  onSuccess,
  trigger,
}: EditClientModalProps) {
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [loadingUsers, setLoadingUsers] = useState(false);
  const [accountManagers, setAccountManagers] = useState<UserOptionItem[]>([]);

  const {
    register,
    handleSubmit,
    setValue,
    control,
    reset,
    formState: { errors },
  } = useForm<EditClientFormValues>({
    resolver: zodResolver(editClientSchema),
    defaultValues: {
      companyName: client.companyName,
      industry: client.industry ?? "",
      businessType: client.businessType ?? "",
      website: client.website ?? "",
      address: client.address ?? "",
      status: client.status,
      accountManagerId: client.accountManagerId,
    },
  });

  const status = useWatch({
    control,
    name: "status",
  });

  const accountManagerId = useWatch({
    control,
    name: "accountManagerId",
  });

  useEffect(() => {
    if (!open) return;

    reset({
      companyName: client.companyName,
      industry: client.industry ?? "",
      businessType: client.businessType ?? "",
      website: client.website ?? "",
      address: client.address ?? "",
      status: client.status,
      accountManagerId: client.accountManagerId,
    });

    async function loadAccountManagers() {
      try {
        setLoadingUsers(true);

        const response = await userService.getUserOptions({
          permissions: ["client.read", "client.update"],
          limit: 100,
        });

        if (response.success) {
          setAccountManagers(response.data);
        }
      } catch (error) {
        toast.error("Gagal memuat Account Manager", {
          description:
            error instanceof Error
              ? error.message
              : "Terjadi kesalahan pada server.",
        });
      } finally {
        setLoadingUsers(false);
      }
    }

    void loadAccountManagers();
  }, [open, client, reset]);

  const handleOpenChange = (value: boolean) => {
    setOpen(value);

    if (!value) {
      reset({
        companyName: client.companyName,
        industry: client.industry ?? "",
        businessType: client.businessType ?? "",
        website: client.website ?? "",
        address: client.address ?? "",
        status: client.status,
        accountManagerId: client.accountManagerId,
      });
    }
  };

  const onSubmit = async (values: EditClientFormValues) => {
    try {
      setLoading(true);

      const payload: UpdateClientPayload = {
        companyName: values.companyName.trim(),
        industry: values.industry?.trim() || undefined,
        businessType: values.businessType?.trim() || undefined,
        website: values.website?.trim() || undefined,
        address: values.address?.trim() || undefined,
        status: values.status as ClientStatus,
        accountManagerId: values.accountManagerId,
      };

      const response = await clientService.updateClient(client.id, payload);

      if (response.success) {
        toast.success("Client berhasil diperbarui", {
          description: "Perubahan data client berhasil disimpan.",
        });

        handleOpenChange(false);
        await onSuccess?.();
      }
    } catch (error) {
      toast.error("Gagal memperbarui client", {
        description:
          error instanceof Error
            ? error.message
            : "Terjadi kesalahan saat memperbarui client.",
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
            Edit Client
          </Button>
        )}
      </DialogTrigger>

      <DialogContent className="max-h-[90vh] overflow-y-auto sm:max-w-xl">
        <DialogHeader>
          <DialogTitle>Edit Client</DialogTitle>

          <DialogDescription>
            Perbarui informasi client dan Account Manager yang bertanggung
            jawab.
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit(onSubmit)} className="space-y-5 pt-2">
          <div className="space-y-2">
            <Label htmlFor="edit-companyName">Nama Perusahaan</Label>

            <Input
              id="edit-companyName"
              disabled={loading}
              {...register("companyName")}
            />

            {errors.companyName && (
              <p className="text-xs text-destructive">
                {errors.companyName.message}
              </p>
            )}
          </div>

          <div className="grid gap-4 sm:grid-cols-2">
            <div className="space-y-2">
              <Label htmlFor="edit-industry">Industry</Label>

              <Input
                id="edit-industry"
                disabled={loading}
                {...register("industry")}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="edit-businessType">Business Type</Label>

              <Input
                id="edit-businessType"
                disabled={loading}
                {...register("businessType")}
              />
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="edit-website">Website</Label>

            <Input
              id="edit-website"
              placeholder="https://company.com"
              disabled={loading}
              {...register("website")}
            />

            {errors.website && (
              <p className="text-xs text-destructive">
                {errors.website.message}
              </p>
            )}
          </div>

          <div className="space-y-2">
            <Label htmlFor="edit-address">Alamat</Label>

            <Textarea
              id="edit-address"
              disabled={loading}
              {...register("address")}
            />
          </div>

          <div className="grid gap-4 sm:grid-cols-2">
            <div className="space-y-2">
              <Label>Status</Label>

              <Select
                value={status}
                disabled={loading}
                onValueChange={(value) =>
                  setValue("status", value as ClientStatus, {
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

            <div className="space-y-2">
              <Label>Account Manager</Label>

              <Select
                value={accountManagerId || undefined}
                disabled={loading || loadingUsers}
                onValueChange={(value) =>
                  setValue("accountManagerId", value, {
                    shouldValidate: true,
                    shouldDirty: true,
                    shouldTouch: true,
                  })
                }>
                <SelectTrigger className="w-full">
                  <SelectValue
                    placeholder={
                      loadingUsers ? "Memuat..." : "Pilih Account Manager"
                    }
                  />
                </SelectTrigger>

                <SelectContent>
                  {accountManagers.length > 0 ? (
                    accountManagers.map((manager) => (
                      <SelectItem key={manager.id} value={manager.id}>
                        {manager.name} - {manager.email}
                      </SelectItem>
                    ))
                  ) : (
                    <SelectItem value="__empty" disabled>
                      Tidak ada user yang eligible
                    </SelectItem>
                  )}
                </SelectContent>
              </Select>

              {errors.accountManagerId && (
                <p className="text-xs text-destructive">
                  {errors.accountManagerId.message}
                </p>
              )}
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
