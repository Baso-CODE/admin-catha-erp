"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { Loader2, Plus } from "lucide-react";
import { useEffect, useState } from "react";
import { useForm } from "react-hook-form";
import { toast } from "sonner";
import { z } from "zod";

import { ClientItem, clientService } from "@/app/services/client.service";
import { ContractItem, contractService } from "@/app/services/contract.service";
import { ProjectStatus, projectService } from "@/app/services/project.service";
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

interface UserItem {
  id: string;
  name: string;
  email: string;
  isActive: boolean;
}

interface UserListResponse {
  success: boolean;
  data: UserItem[];
}

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
    status: z.custom<ProjectStatus>(),
  })
  .refine(
    (values) => new Date(values.targetEndDate) > new Date(values.startDate),
    {
      message: "Target end date harus setelah start date.",
      path: ["targetEndDate"],
    },
  );

type FormValues = z.infer<typeof schema>;

interface CreateProjectModalProps {
  onSuccess?: () => void | Promise<void>;
}

export function CreateProjectModal({ onSuccess }: CreateProjectModalProps) {
  const [open, setOpen] = useState(false);
  const [clients, setClients] = useState<ClientItem[]>([]);
  const [contracts, setContracts] = useState<ContractItem[]>([]);
  const [projectManagers, setProjectManagers] = useState<UserItem[]>([]);
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
      name: "",
      projectType: "",
      description: "",
      clientId: "",
      contractId: "",
      projectManagerId: "",
      startDate: "",
      targetEndDate: "",
      status: "PLANNING",
    },
  });

  const clientId = watch("clientId");
  const contractId = watch("contractId");
  const projectManagerId = watch("projectManagerId");
  const status = watch("status");

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
          userService.getUsers({
            isActive: true,
            page: 1,
            limit: 100,
          }),
        ]);

        setClients(clientResponse.data);

        setProjectManagers(userResponse.data.filter((user) => user.isActive));
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

    setValue("contractId", "");
    void loadContracts();
  }, [open, clientId, setValue]);

  const handleOpenChange = (value: boolean) => {
    setOpen(value);

    if (!value) {
      reset();
      setContracts([]);
    }
  };

  const onSubmit = async (values: FormValues) => {
    try {
      await projectService.create({
        name: values.name.trim(),
        projectType: values.projectType.trim(),
        description: values.description?.trim() || undefined,
        clientId: values.clientId,
        contractId: values.contractId || undefined,
        projectManagerId: values.projectManagerId,
        startDate: values.startDate,
        targetEndDate: values.targetEndDate,
        status: values.status,
      });

      toast.success("Project berhasil dibuat.");

      setOpen(false);
      reset();

      await onSuccess?.();
    } catch (error) {
      toast.error("Gagal membuat project.", {
        description:
          error instanceof Error
            ? error.message
            : "Terjadi kesalahan pada server.",
      });
    }
  };

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogTrigger asChild>
        <Button>
          <Plus className="size-4" />
          Tambah Project
        </Button>
      </DialogTrigger>

      <DialogContent className="max-h-[90vh] overflow-y-auto sm:max-w-2xl">
        <DialogHeader>
          <DialogTitle>Tambah Project</DialogTitle>

          <DialogDescription>
            Buat project baru dan tentukan client, contract, serta project
            manager.
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit(onSubmit)} className="space-y-5">
          <div className="grid gap-4 sm:grid-cols-2">
            <div className="space-y-2">
              <Label htmlFor="project-name">Nama Project</Label>

              <Input
                id="project-name"
                placeholder="Google Ads Q4 Campaign"
                {...register("name")}
              />

              {errors.name && (
                <p className="text-xs text-destructive">
                  {errors.name.message}
                </p>
              )}
            </div>

            <div className="space-y-2">
              <Label htmlFor="project-type">Project Type</Label>

              <Input
                id="project-type"
                placeholder="Client Project"
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
            <Label htmlFor="project-description">Deskripsi</Label>

            <Textarea
              id="project-description"
              rows={3}
              placeholder="Deskripsi project..."
              {...register("description")}
            />
          </div>

          <div className="grid gap-4 sm:grid-cols-2">
            <div className="space-y-2">
              <Label>Client</Label>

              <Select
                value={clientId || undefined}
                onValueChange={(value) =>
                  setValue("clientId", value, {
                    shouldValidate: true,
                  })
                }
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
                  <SelectValue
                    placeholder={
                      isLoadingContracts
                        ? "Memuat contract..."
                        : "Pilih contract"
                    }
                  />
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
              value={projectManagerId || undefined}
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

          <div className="grid gap-4 sm:grid-cols-2">
            <div className="space-y-2">
              <Label htmlFor="start-date">Start Date</Label>

              <Input id="start-date" type="date" {...register("startDate")} />

              {errors.startDate && (
                <p className="text-xs text-destructive">
                  {errors.startDate.message}
                </p>
              )}
            </div>

            <div className="space-y-2">
              <Label htmlFor="target-end-date">Target End Date</Label>

              <Input
                id="target-end-date"
                type="date"
                {...register("targetEndDate")}
              />

              {errors.targetEndDate && (
                <p className="text-xs text-destructive">
                  {errors.targetEndDate.message}
                </p>
              )}
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

                <SelectItem value="ON_HOLD">On Hold</SelectItem>
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
              Simpan Project
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
