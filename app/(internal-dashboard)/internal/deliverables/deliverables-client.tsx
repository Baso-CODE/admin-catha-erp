"use client";

import { FileCheck2, Loader2, Plus, RefreshCw } from "lucide-react";
import { useCallback, useEffect, useState } from "react";
import { toast } from "sonner";

import {
  deliverableService,
  type DeliverableItem,
  type DeliverablePayload,
  type DeliverableStatus,
} from "@/app/services/deliverable.service";
import {
  projectService,
  type ProjectItem,
} from "@/app/services/project.service";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
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
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Textarea } from "@/components/ui/textarea";

type Props = {
  permissions: string[];
};

const STATUS_LABELS: Record<DeliverableStatus, string> = {
  DRAFT: "Draft",
  INTERNAL_REVIEW: "Internal Review",
  READY_FOR_CLIENT: "Ready for Client",
  PENDING_CLIENT_APPROVAL: "Pending Client Approval",
  REVISION_REQUIRED: "Revision Required",
  REJECTED: "Rejected",
  APPROVED: "Approved",
  SUPERSEDED: "Superseded",
};

const INITIAL_FORM: DeliverablePayload = {
  name: "",
  version: "1.0",
  description: "",
};

function getErrorMessage(error: unknown): string {
  return error instanceof Error
    ? error.message
    : "Terjadi kesalahan. Silakan coba lagi.";
}

export default function DeliverablesClient({ permissions }: Props) {
  const canUpdate = permissions.includes("project.update");

  const [projects, setProjects] = useState<ProjectItem[]>([]);
  const [projectId, setProjectId] = useState("");
  const [deliverables, setDeliverables] = useState<DeliverableItem[]>([]);

  const [loading, setLoading] = useState(false);
  const [projectsLoading, setProjectsLoading] = useState(true);
  const [processingId, setProcessingId] = useState<string | null>(null);

  const [dialogOpen, setDialogOpen] = useState(false);
  const [editing, setEditing] = useState<DeliverableItem | null>(null);
  const [form, setForm] = useState<DeliverablePayload>(INITIAL_FORM);
  const [saving, setSaving] = useState(false);

  const [uploadingId, setUploadingId] = useState<string | null>(null);

  async function uploadDeliverableFile(item: DeliverableItem, file: File) {
    if (!canUpdate || uploadingId) return;

    if (file.size > 10 * 1024 * 1024) {
      toast.error("Maksimal ukuran file adalah 10 MB.");
      return;
    }

    setUploadingId(item.id);

    try {
      await deliverableService.uploadFile(item.id, file);

      toast.success("File deliverable berhasil diupload.");
      await loadDeliverables();
    } catch (error) {
      toast.error(getErrorMessage(error));
    } finally {
      setUploadingId(null);
    }
  }

  async function downloadDeliverableFile(id: string) {
    try {
      const response = await deliverableService.getDownloadUrl(id);

      // Navigasi browser ke signed URL sementara.
      // Tidak menyimpan URL di localStorage atau database frontend.
      window.location.assign(response.data.url);
    } catch (error) {
      toast.error(getErrorMessage(error));
    }
  }

  useEffect(() => {
    let active = true;

    async function loadProjects() {
      setProjectsLoading(true);

      try {
        const response = await projectService.getAll({
          page: 1,
          limit: 100,
        });

        if (!active) return;

        setProjects(response.data);

        if (response.data.length > 0) {
          setProjectId(response.data[0].id);
        }
      } catch (error) {
        if (active) toast.error(getErrorMessage(error));
      } finally {
        if (active) setProjectsLoading(false);
      }
    }

    void loadProjects();

    return () => {
      active = false;
    };
  }, []);

  const loadDeliverables = useCallback(async () => {
    if (!projectId) {
      setDeliverables([]);
      return;
    }

    setLoading(true);

    try {
      const response = await deliverableService.getAll(projectId);
      setDeliverables(response.data);
    } catch (error) {
      setDeliverables([]);
      toast.error(getErrorMessage(error));
    } finally {
      setLoading(false);
    }
  }, [projectId]);

  useEffect(() => {
    void loadDeliverables();
  }, [loadDeliverables]);

  function openCreate() {
    setEditing(null);
    setForm(INITIAL_FORM);
    setDialogOpen(true);
  }

  function openEdit(item: DeliverableItem) {
    if (item.status !== "DRAFT") return;

    setEditing(item);
    setForm({
      name: item.name,
      version: item.version,
      description: item.description ?? "",
    });
    setDialogOpen(true);
  }

  async function save() {
    if (!projectId) {
      toast.error("Pilih project terlebih dahulu.");
      return;
    }

    if (!form.name.trim()) {
      toast.error("Nama deliverable wajib diisi.");
      return;
    }

    setSaving(true);

    try {
      const payload: DeliverablePayload = {
        name: form.name.trim(),
        version: form.version?.trim() || "1.0",
        description: form.description?.trim() || null,
      };

      if (editing) {
        await deliverableService.update(editing.id, payload);
        toast.success("Draft deliverable berhasil diperbarui.");
      } else {
        await deliverableService.create({
          ...payload,
          projectId,
        });

        toast.success("Draft deliverable berhasil dibuat.");
      }

      setDialogOpen(false);
      setEditing(null);
      await loadDeliverables();
    } catch (error) {
      toast.error(getErrorMessage(error));
    } finally {
      setSaving(false);
    }
  }

  async function runAction(
    item: DeliverableItem,
    action: "review" | "ready" | "submit" | "reopen",
  ) {
    if (processingId) return;

    setProcessingId(item.id);

    try {
      switch (action) {
        case "review":
          await deliverableService.startReview(item.id);
          toast.success("Review internal dimulai.");
          break;

        case "ready":
          await deliverableService.markReady(item.id);
          toast.success("Deliverable siap dikirim ke client.");
          break;

        case "submit": {
          const result = await deliverableService.submit(item.id);

          toast.success(
            `Approval berhasil dikirim. ${result.data.notifications.created} notifikasi dibuat.`,
          );
          break;
        }

        case "reopen":
          await deliverableService.reopen(item.id);
          toast.success("Deliverable dikembalikan ke Draft.");
          break;
      }

      await loadDeliverables();
    } catch (error) {
      toast.error(getErrorMessage(error));
    } finally {
      setProcessingId(null);
    }
  }

  function renderActions(item: DeliverableItem) {
    if (!canUpdate) return null;

    const busy = processingId !== null;

    switch (item.status) {
      case "DRAFT":
        return (
          <>
            <Button
              size="sm"
              variant="outline"
              disabled={busy || uploadingId !== null}
              onClick={() => openEdit(item)}>
              Edit
            </Button>

            <div className="flex items-center">
              <Input
                type="file"
                accept=".pdf,.jpg,.jpeg,.png,.webp,.docx,.xlsx"
                className="h-9 w-52 cursor-pointer text-xs"
                disabled={busy || uploadingId !== null}
                aria-label={`Upload file untuk ${item.name}`}
                onChange={(event) => {
                  const file = event.target.files?.[0];

                  if (file) {
                    void uploadDeliverableFile(item, file);
                  }

                  event.target.value = "";
                }}
              />
            </div>

            <Button
              size="sm"
              disabled={busy || uploadingId !== null}
              onClick={() => void runAction(item, "review")}>
              Start Review
            </Button>
          </>
        );

      case "INTERNAL_REVIEW":
        return (
          <>
            <Button
              size="sm"
              disabled={busy}
              onClick={() => void runAction(item, "ready")}>
              Mark Ready
            </Button>

            <Button
              size="sm"
              variant="outline"
              disabled={busy}
              onClick={() => void runAction(item, "reopen")}>
              Reopen
            </Button>
          </>
        );

      case "READY_FOR_CLIENT":
        return (
          <>
            <Button
              size="sm"
              disabled={busy}
              onClick={() => void runAction(item, "submit")}>
              Submit Approval
            </Button>

            <Button
              size="sm"
              variant="outline"
              disabled={busy}
              onClick={() => void runAction(item, "reopen")}>
              Reopen
            </Button>
          </>
        );

      case "REVISION_REQUIRED":
        return (
          <Button
            size="sm"
            disabled={busy}
            onClick={() => void runAction(item, "reopen")}>
            Reopen Draft
          </Button>
        );

      default:
        return null;
    }
  }

  return (
    <div className="space-y-6 p-4 md:p-6">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <h1 className="flex items-center gap-2 text-2xl font-semibold">
            <FileCheck2 className="size-6" />
            Deliverable Management
          </h1>

          <p className="mt-1 text-sm text-muted-foreground">
            Kelola hasil pekerjaan, review internal, dan approval client.
          </p>
        </div>

        <div className="flex gap-2">
          <Button
            variant="outline"
            disabled={loading || !projectId}
            onClick={() => void loadDeliverables()}>
            <RefreshCw className={loading ? "animate-spin" : ""} />
            Refresh
          </Button>

          {canUpdate && (
            <Button disabled={!projectId} onClick={openCreate}>
              <Plus />
              Create Deliverable
            </Button>
          )}
        </div>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Pilih Project</CardTitle>

          <CardDescription>
            Deliverable dikelompokkan berdasarkan project.
          </CardDescription>
        </CardHeader>

        <CardContent>
          <Select
            value={projectId}
            onValueChange={setProjectId}
            disabled={projectsLoading}>
            <SelectTrigger className="w-full md:max-w-xl">
              <SelectValue placeholder="Pilih project" />
            </SelectTrigger>

            <SelectContent>
              {projects.map((project) => (
                <SelectItem key={project.id} value={project.id}>
                  {project.projectCode} — {project.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>

          <p className="mt-2 text-xs text-muted-foreground">
            Menampilkan maksimal 100 project pertama.
          </p>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Daftar Deliverable</CardTitle>
          <CardDescription>
            Total {deliverables.length} deliverable pada project terpilih.
          </CardDescription>
        </CardHeader>

        <CardContent>
          {loading ? (
            <div className="flex items-center gap-2 py-8">
              <Loader2 className="size-5 animate-spin" />
              Memuat deliverable...
            </div>
          ) : deliverables.length === 0 ? (
            <p className="py-10 text-center text-sm text-muted-foreground">
              Belum ada deliverable untuk project ini.
            </p>
          ) : (
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Deliverable</TableHead>
                    <TableHead>Versi</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Approval</TableHead>
                    <TableHead>File</TableHead>
                    <TableHead>Aksi</TableHead>
                  </TableRow>
                </TableHeader>

                <TableBody>
                  {deliverables.map((item) => {
                    const latestApproval = item.approvalRequests[0];

                    return (
                      <TableRow key={item.id}>
                        <TableCell>
                          <p className="font-medium">{item.name}</p>

                          {item.description && (
                            <p className="max-w-xs truncate text-xs text-muted-foreground">
                              {item.description}
                            </p>
                          )}
                        </TableCell>

                        <TableCell>{item.version}</TableCell>

                        <TableCell>
                          <Badge variant="secondary">
                            {STATUS_LABELS[item.status]}
                          </Badge>
                        </TableCell>

                        <TableCell>
                          {latestApproval ? (
                            <div className="space-y-1">
                              <Badge variant="outline">
                                {STATUS_LABELS[latestApproval.status]}
                              </Badge>

                              {latestApproval.feedback && (
                                <p className="max-w-48 text-xs text-muted-foreground">
                                  {latestApproval.feedback}
                                </p>
                              )}
                            </div>
                          ) : (
                            "—"
                          )}
                        </TableCell>

                        <TableCell>
                          {item.hasFile ? (
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={() =>
                                void downloadDeliverableFile(item.id)
                              }>
                              Unduh File
                            </Button>
                          ) : (
                            <Badge variant="secondary">Belum Upload</Badge>
                          )}
                        </TableCell>

                        <TableCell>
                          <div className="flex flex-wrap gap-2">
                            {renderActions(item)}
                          </div>
                        </TableCell>
                      </TableRow>
                    );
                  })}
                </TableBody>
              </Table>
            </div>
          )}
        </CardContent>
      </Card>

      <Dialog
        open={dialogOpen}
        onOpenChange={(open) => {
          if (!saving) setDialogOpen(open);
        }}>
        <DialogContent className="sm:max-w-xl">
          <DialogHeader>
            <DialogTitle>
              {editing ? "Edit Draft Deliverable" : "Create Deliverable"}
            </DialogTitle>

            <DialogDescription>
              Deliverable baru dibuat dengan status Draft.
            </DialogDescription>
          </DialogHeader>

          <div className="grid gap-4 py-2">
            <div className="space-y-2">
              <Label htmlFor="deliverable-name">Nama Deliverable</Label>

              <Input
                id="deliverable-name"
                value={form.name}
                onChange={(event) =>
                  setForm((current) => ({
                    ...current,
                    name: event.target.value,
                  }))
                }
                placeholder="Contoh: Laporan Performance Oktober"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="deliverable-version">Versi</Label>

              <Input
                id="deliverable-version"
                value={form.version ?? ""}
                onChange={(event) =>
                  setForm((current) => ({
                    ...current,
                    version: event.target.value,
                  }))
                }
                placeholder="1.0"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="deliverable-description">Deskripsi</Label>

              <Textarea
                id="deliverable-description"
                value={form.description ?? ""}
                onChange={(event) =>
                  setForm((current) => ({
                    ...current,
                    description: event.target.value,
                  }))
                }
                placeholder="Deskripsi hasil pekerjaan..."
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="deliverable-url">URL File</Label>

              <Input
                id="deliverable-url"
                type="url"
                value={form.fileUrl ?? ""}
                onChange={(event) =>
                  setForm((current) => ({
                    ...current,
                    fileUrl: event.target.value,
                  }))
                }
                placeholder="https://..."
              />

              <p className="text-xs text-muted-foreground">
                Masukkan URL dokumen HTTPS. Upload file langsung belum tersedia
                pada tahap ini.
              </p>
            </div>
          </div>

          <DialogFooter>
            <Button
              variant="outline"
              disabled={saving}
              onClick={() => setDialogOpen(false)}>
              Batal
            </Button>

            <Button disabled={saving} onClick={() => void save()}>
              {saving && <Loader2 className="animate-spin" />}
              {editing ? "Simpan Perubahan" : "Create Draft"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
