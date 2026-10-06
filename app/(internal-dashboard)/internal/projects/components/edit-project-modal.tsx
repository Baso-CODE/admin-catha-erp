"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { Loader2 } from "lucide-react";
import { ReactNode, useEffect, useState } from "react";
import { useForm } from "react-hook-form";
import { toast } from "sonner";
import { z } from "zod";

import { ClientItem, clientService } from "@/app/services/client.service";
import { ContractItem, contractService } from "@/app/services/contract.service";
import {
  ProjectItem,
  ProjectStatus,
  projectService,
} from "@/app/services/project.service";
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

const schema = z
  .object({
    name: z.string().min(2, "Nama project minimal 2 karakter.").max(150),
    projectType: z.string().min(2, "Project type wajib diisi.").max(100),
    description: z.string().optional(),
    clientId: z.string().min(1, "Client wajib dipilih."),
    contractId: z.string().optional(),
    projectManagerId: z.string().min(1, "Project manager wajib dipilih."),
    startDate: z.string().min(1, "Start date wajib diisi."),
    targetEndDate: z.string().min(1, "Target end date wajib diisi."),
    actualEndDate: z.string().optional(),
    status: z.custom<ProjectStatus>(),
  })
  .refine(
    (values) => new Date(values.targetEndDate) > new Date(values.startDate),
    {
      message: "Target end date harus setelah start date.",
      path: ["targetEndDate"],
    },
  )
  .refine(
    (values) =>
      !values.actualEndDate ||
      new Date(values.actualEndDate) >= new Date(values.startDate),
    {
      message: "Actual end date tidak boleh sebelum start date.",
      path: ["actualEndDate"],
    },
  );

type FormValues = z.infer<typeof schema>;

interface EditProjectModalProps {
  item: ProjectItem;
  onSuccess?: () => void | Promise<void>;
  trigger?: ReactNode;
}

function toDateInput(value?: string | null) {
  if (!value) return "";
  return new Date(value).toISOString().slice(0, 10);
}

export function EditProjectModal({
  item,
  onSuccess,
  trigger,
}: EditProjectModalProps) {
  const [open, setOpen] = useState(false);
  const [clients, setClients] = useState<ClientItem[]>([]);
  const [contracts, setContracts] = useState<ContractItem[]>([]);
  const [projectManagers, setProjectManagers] = useState<UserOptionItem[]>([]);
  const [isLoadingData, setIsLoadingData] = useState(false);
  const [isLoadingContracts, setIsLoadingContracts] = useState(false);

  const {
    register,
    handleSubmit,
    setValue,
    watch,
    reset,
    formState: { errors, isSubmitting },
  } = useForm<FormValues>({
    resolver: zodResolver(schema),
    defaultValues: {
      name: item.name,
      projectType: item.projectType,
      description: item.description ?? "",
      clientId: item.clientId,
      contractId: item.contractId ?? "",
      projectManagerId: item.projectManagerId,
      startDate: toDateInput(item.startDate),
      targetEndDate: toDateInput(item.targetEndDate),
      actualEndDate: toDateInput(item.actualEndDate),
      status: item.status,
    },
  });

  const clientId = watch("clientId");
  const contractId = watch("contractId");
  const projectManagerId = watch("projectManagerId");
  const status = watch("status");

  const resetForm = () => {
    reset({
      name: item.name,
      projectType: item.projectType,
      description: item.description ?? "",
      clientId: item.clientId,
      contractId: item.contractId ?? "",
      projectManagerId: item.projectManagerId,
      startDate: toDateInput(item.startDate),
      targetEndDate: toDateInput(item.targetEndDate),
      actualEndDate: toDateInput(item.actualEndDate),
      status: item.status,
    });
  };

  useEffect(() => {
    resetForm();
  }, [item, reset]);

  useEffect(() => {
    if (!open) return;

    const loadInitialData = async () => {
      try {
        setIsLoadingData(true);

        const [clientResponse, userResponse] = await Promise.all([
          clientService.getClients({
            status: "ACTIVE",
            page: 1,
            limit: 100,
          }),
          userService.getUserOptions({
            permissions: ["project.read", "project.update"],
            limit: 100,
          }),
        ]);

        setClients(clientResponse.data);
        setProjectManagers(userResponse.data);
      } catch (error) {
        toast.error("Gagal mengambil data project.", {
          description:
            error instanceof Error
              ? error.message
              : "Terjadi kesalahan pada server.",
        });
      } finally {
        setIsLoadingData(false);
      }
    };

    void loadInitialData();
  }, [open]);
  useEffect(() => {
    if (!open || !clientId) {
      setContracts([]);
      return;
    }

    const selectedClientId = clientId;

    const loadContracts = async () => {
      try {
        setIsLoadingContracts(true);

        const response = await contractService.getContracts({
          clientId: selectedClientId,
          page: 1,
          limit: 100,
        });

        setContracts(response.data);
      } catch (error) {
        toast.error("Gagal mengambil contract client.", {
          description:
            error instanceof Error
              ? error.message
              : "Terjadi kesalahan pada server.",
        });
      } finally {
        setIsLoadingContracts(false);
      }
    };

    void loadContracts();
  }, [open, clientId]);

  const handleOpenChange = (value: boolean) => {
    setOpen(value);

    if (value) {
      resetForm();
    }
  };

  const onSubmit = async (values: FormValues) => {
    try {
      await projectService.update(item.id, {
        name: values.name.trim(),
        projectType: values.projectType.trim(),
        description: values.description?.trim() || undefined,
        clientId: values.clientId,
        contractId: values.contractId || null,
        projectManagerId: values.projectManagerId,
        startDate: values.startDate,
        targetEndDate: values.targetEndDate,
        actualEndDate: values.actualEndDate || null,
        status: values.status,
      });

      toast.success("Project berhasil diperbarui.");

      setOpen(false);

      await onSuccess?.();
    } catch (error) {
      toast.error("Gagal memperbarui project.", {
        description:
          error instanceof Error
            ? error.message
            : "Terjadi kesalahan pada server.",
      });
    }
  };

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      {trigger && <DialogTrigger asChild>{trigger}</DialogTrigger>}

      <DialogContent className="max-h-[90vh] overflow-y-auto sm:max-w-2xl">
        <DialogHeader>
          <DialogTitle>Edit Project</DialogTitle>
          <DialogDescription>
            Perbarui informasi, client, contract, project manager, dan status
            project.
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit(onSubmit)} className="space-y-5">
          <div className="grid gap-4 sm:grid-cols-2">
            <div className="space-y-2">
              <Label htmlFor={`project-name-${item.id}`}>Nama Project</Label>
              <Input id={`project-name-${item.id}`} {...register("name")} />
              {errors.name && (
                <p className="text-xs text-destructive">
                  {errors.name.message}
                </p>
              )}
            </div>

            <div className="space-y-2">
              <Label htmlFor={`project-type-${item.id}`}>Project Type</Label>
              <Input
                id={`project-type-${item.id}`}
                {...register("projectType")}
              />
              {errors.projectType && (
                <p className="text-xs text-destructive">
                  {errors.projectType.message}
                </p>
              )}
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor={`project-description-${item.id}`}>Deskripsi</Label>
            <Textarea
              id={`project-description-${item.id}`}
              rows={3}
              {...register("description")}
            />
          </div>

          <div className="grid gap-4 sm:grid-cols-2">
            <div className="space-y-2">
              <Label>Client</Label>

              <Select
                value={clientId}
                onValueChange={(value) => {
                  setValue("clientId", value, {
                    shouldValidate: true,
                  });
                  setValue("contractId", "");
                }}
                disabled={isLoadingData}>
                <SelectTrigger>
                  <SelectValue placeholder="Pilih client" />
                </SelectTrigger>

                <SelectContent>
                  {clients.map((client) => (
                    <SelectItem key={client.id} value={client.id}>
                      {client.companyName}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>

              {errors.clientId && (
                <p className="text-xs text-destructive">
                  {errors.clientId.message}
                </p>
              )}
            </div>

            <div className="space-y-2">
              <Label>Contract</Label>

              <Select
                value={contractId || "none"}
                onValueChange={(value) =>
                  setValue("contractId", value === "none" ? "" : value)
                }
                disabled={!clientId || isLoadingContracts}>
                <SelectTrigger>
                  <SelectValue placeholder="Pilih contract" />
                </SelectTrigger>

                <SelectContent>
                  <SelectItem value="none">Tanpa Contract</SelectItem>

                  {contracts.map((contract) => (
                    <SelectItem key={contract.id} value={contract.id}>
                      {contract.contractNo} - {contract.title}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="space-y-2">
            <Label>Project Manager</Label>

            <Select
              value={projectManagerId}
              onValueChange={(value) =>
                setValue("projectManagerId", value, {
                  shouldValidate: true,
                })
              }
              disabled={isLoadingData}>
              <SelectTrigger>
                <SelectValue placeholder="Pilih project manager" />
              </SelectTrigger>

              <SelectContent>
                {projectManagers.map((user) => (
                  <SelectItem key={user.id} value={user.id}>
                    {user.name} - {user.email}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>

            {errors.projectManagerId && (
              <p className="text-xs text-destructive">
                {errors.projectManagerId.message}
              </p>
            )}
          </div>

          <div className="grid gap-4 sm:grid-cols-3">
            <div className="space-y-2">
              <Label htmlFor={`start-date-${item.id}`}>Start Date</Label>
              <Input
                id={`start-date-${item.id}`}
                type="date"
                {...register("startDate")}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor={`target-date-${item.id}`}>Target End Date</Label>
              <Input
                id={`target-date-${item.id}`}
                type="date"
                {...register("targetEndDate")}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor={`actual-date-${item.id}`}>Actual End Date</Label>
              <Input
                id={`actual-date-${item.id}`}
                type="date"
                {...register("actualEndDate")}
              />
            </div>
          </div>

          <div className="space-y-2">
            <Label>Status</Label>

            <Select
              value={status}
              onValueChange={(value) =>
                setValue("status", value as ProjectStatus)
              }>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>

              <SelectContent>
                <SelectItem value="DRAFT">Draft</SelectItem>
                <SelectItem value="PLANNING">Planning</SelectItem>
                <SelectItem value="IN_PROGRESS">In Progress</SelectItem>
                <SelectItem value="INTERNAL_REVIEW">Internal Review</SelectItem>
                <SelectItem value="PENDING_CLIENT_APPROVAL">
                  Pending Client Approval
                </SelectItem>
                <SelectItem value="CLIENT_REVISION">Client Revision</SelectItem>
                <SelectItem value="APPROVED">Approved</SelectItem>
                <SelectItem value="COMPLETED">Completed</SelectItem>
                <SelectItem value="ON_HOLD">On Hold</SelectItem>
                <SelectItem value="CANCELLED">Cancelled</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <DialogFooter>
            <Button
              type="button"
              variant="outline"
              onClick={() => setOpen(false)}
              disabled={isSubmitting}>
              Batal
            </Button>

            <Button type="submit" disabled={isSubmitting || isLoadingData}>
              {isSubmitting && <Loader2 className="size-4 animate-spin" />}
              Simpan Perubahan
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
