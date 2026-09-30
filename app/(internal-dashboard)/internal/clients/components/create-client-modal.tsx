"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { Loader2, Plus } from "lucide-react";
import { useEffect, useState } from "react";
import { useForm, useWatch } from "react-hook-form";
import { toast } from "sonner";
import * as z from "zod";

import {
  CreateClientPayload,
  clientService,
} from "@/app/services/client.service";
import { userService } from "@/app/services/userManagement.service";
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

const createClientSchema = z.object({
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

type CreateClientFormValues = z.infer<typeof createClientSchema>;

interface AccountManagerOption {
  id: string;
  name: string;
  email: string;
}

interface CreateClientModalProps {
  onSuccess?: () => void | Promise<void>;
}

export function CreateClientModal({ onSuccess }: CreateClientModalProps) {
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [loadingUsers, setLoadingUsers] = useState(false);
  const [accountManagers, setAccountManagers] = useState<
    AccountManagerOption[]
  >([]);

  const {
    register,
    handleSubmit,
    setValue,
    control,
    reset,
    formState: { errors },
  } = useForm<CreateClientFormValues>({
    resolver: zodResolver(createClientSchema),
    defaultValues: {
      companyName: "",
      industry: "",
      businessType: "",
      website: "",
      address: "",
      status: "ACTIVE",
      accountManagerId: "",
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

    async function loadAccountManagers() {
      try {
        setLoadingUsers(true);

        const response = await userService.getUsers({
          isActive: true,
          page: 1,
          limit: 100,
        });

        if (response.success) {
          const managers = response.data
            .filter((user) =>
              user.roles.some(({ role }) => role.code === "ACCOUNT_MANAGER"),
            )
            .map((user) => ({
              id: user.id,
              name: user.name,
              email: user.email,
            }));

          setAccountManagers(managers);
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
  }, [open]);

  const handleOpenChange = (value: boolean) => {
    setOpen(value);

    if (!value) {
      reset({
        companyName: "",
        industry: "",
        businessType: "",
        website: "",
        address: "",
        status: "ACTIVE",
        accountManagerId: "",
      });
    }
  };

  const onSubmit = async (values: CreateClientFormValues) => {
    try {
      setLoading(true);

      const payload: CreateClientPayload = {
        companyName: values.companyName.trim(),
        industry: values.industry?.trim() || undefined,
        businessType: values.businessType?.trim() || undefined,
        website: values.website?.trim() || undefined,
        address: values.address?.trim() || undefined,
        status: values.status,
        accountManagerId: values.accountManagerId,
      };

      const response = await clientService.createClient(payload);

      if (response.success) {
        toast.success("Client berhasil dibuat", {
          description: "Data client baru berhasil ditambahkan.",
        });

        handleOpenChange(false);
        await onSuccess?.();
      }
    } catch (error) {
      toast.error("Gagal membuat client", {
        description:
          error instanceof Error
            ? error.message
            : "Terjadi kesalahan saat membuat client.",
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
          Tambah Client
        </Button>
      </DialogTrigger>

      <DialogContent className="max-h-[90vh] overflow-y-auto sm:max-w-xl">
        <DialogHeader>
          <DialogTitle>Tambah Client</DialogTitle>

          <DialogDescription>
            Tambahkan data perusahaan dan tentukan Account Manager yang
            bertanggung jawab.
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit(onSubmit)} className="space-y-5 pt-2">
          <div className="space-y-2">
            <Label htmlFor="companyName">Nama Perusahaan</Label>

            <Input
              id="companyName"
              placeholder="PT Contoh Indonesia"
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
              <Label htmlFor="industry">Industry</Label>

              <Input
                id="industry"
                placeholder="Technology"
                disabled={loading}
                {...register("industry")}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="businessType">Business Type</Label>

              <Input
                id="businessType"
                placeholder="B2B"
                disabled={loading}
                {...register("businessType")}
              />
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="website">Website</Label>

            <Input
              id="website"
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
            <Label htmlFor="address">Alamat</Label>

            <Textarea
              id="address"
              placeholder="Alamat perusahaan"
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
                  {accountManagers.map((manager) => (
                    <SelectItem key={manager.id} value={manager.id}>
                      {manager.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>

              {errors.accountManagerId && (
                <p className="text-xs text-destructive">
                  {errors.accountManagerId.message}
                </p>
              )}

              {!loadingUsers && accountManagers.length === 0 && (
                <p className="text-xs text-muted-foreground">
                  Belum ada user dengan role Account Manager.
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
              Simpan Client
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
