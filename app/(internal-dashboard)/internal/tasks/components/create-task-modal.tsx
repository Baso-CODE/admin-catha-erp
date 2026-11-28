"use client";

import { Plus } from "lucide-react";
import { useEffect, useState } from "react";
import { toast } from "sonner";

import { projectService } from "@/app/services/project.service";
import {
  TaskPriority,
  TaskStatus,
  taskService,
} from "@/app/services/task.service";

import {
  UserOptionItem,
  userService,
} from "@/app/services/userManagement.service";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
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

interface CreateTaskModalProps {
  onSuccess?: () => void;
}

export function CreateTaskModal({ onSuccess }: CreateTaskModalProps) {
  const [open, setOpen] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const [projects, setProjects] = useState<any[]>([]);
  const [users, setUsers] = useState<UserOptionItem[]>([]);
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [projectId, setProjectId] = useState("");
  const [assigneeId, setAssigneeId] = useState("");
  const [priority, setPriority] = useState<TaskPriority>("MEDIUM");
  const [status, setStatus] = useState<TaskStatus>("TODO");
  const [dueDate, setDueDate] = useState("");

  const [submitted, setSubmitted] = useState(false);

  const titleError = submitted
    ? title.trim().length < 2
      ? "Judul task minimal 2 karakter."
      : title.trim().length > 200
        ? "Judul task maksimal 200 karakter."
        : undefined
    : undefined;

  const projectError =
    submitted && !projectId ? "Project wajib dipilih." : undefined;

  useEffect(() => {
    if (!open) return;

    const fetchOptions = async () => {
      try {
        const [projectResponse, userResponse] = await Promise.all([
          projectService.getAll({
            page: 1,
            limit: 100,
          }),
          userService.getUserOptions({
            permissions: ["task.read", "task.update"],
            limit: 100,
          }),
        ]);

        setProjects(projectResponse.data);
        setUsers(userResponse.data);
      } catch (error) {
        console.error("Gagal mengambil option task:", error);
        toast.error("Gagal memuat option task");
      }
    };

    void fetchOptions();
  }, [open]);

  const resetForm = () => {
    setTitle("");
    setDescription("");
    setProjectId("");
    setAssigneeId("");
    setPriority("MEDIUM");
    setStatus("TODO");
    setDueDate("");
    setSubmitted(false);
  };

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault();

    if (isSubmitting) return;

    setSubmitted(true);

    const normalizedTitle = title.trim();

    if (
      normalizedTitle.length < 2 ||
      normalizedTitle.length > 200 ||
      !projectId
    ) {
      toast.error("Lengkapi field yang wajib diisi.");
      return;
    }

    try {
      setIsSubmitting(true);

      await taskService.createTask({
        title: normalizedTitle,
        description: description.trim() || undefined,
        projectId,
        assigneeId: assigneeId || undefined,
        priority,
        status,
        dueDate: dueDate ? new Date(dueDate).toISOString() : undefined,
      });

      toast.success("Task berhasil dibuat");

      resetForm();
      setOpen(false);
    } catch (error) {
      toast.error("Gagal membuat task", {
        description:
          error instanceof Error
            ? error.message
            : "Terjadi kesalahan pada server.",
      });

      return;
    } finally {
      setIsSubmitting(false);
    }

    await onSuccess?.();
  };

  return (
    <Dialog
      open={open}
      onOpenChange={(value) => {
        if (isSubmitting) return;

        setOpen(value);

        if (!value) {
          resetForm();
        }
      }}>
      <DialogTrigger asChild>
        <Button>
          <Plus className="mr-2 size-4" />
          Tambah Task
        </Button>
      </DialogTrigger>

      <DialogContent
        className="flex max-h-[calc(100dvh-2rem)] min-h-0 flex-col gap-0 overflow-hidden p-0 sm:max-w-xl"
        onInteractOutside={(event) => event.preventDefault()}>
        <DialogHeader className="shrink-0 border-b px-6 py-5 pr-14">
          <DialogTitle>Tambah Task</DialogTitle>
        </DialogHeader>

        <form
          noValidate
          onSubmit={handleSubmit}
          className="flex min-h-0 flex-1 flex-col overflow-hidden">
          <div className="min-h-0 flex-1 space-y-4 overflow-y-auto overscroll-contain px-6 py-5">
            <Label htmlFor="title">
              Judul Task <span className="text-destructive">*</span>
            </Label>

            <Input
              id="title"
              value={title}
              maxLength={200}
              disabled={isSubmitting}
              aria-required="true"
              aria-invalid={!!titleError}
              aria-describedby={titleError ? "task-title-error" : undefined}
              onChange={(event) => setTitle(event.target.value)}
              placeholder="Contoh: Setup Meta Ads"
            />

            {titleError && (
              <p
                id="task-title-error"
                role="alert"
                className="text-xs text-destructive">
                {titleError}
              </p>
            )}
          </div>

          <div className="space-y-2">
            <Label htmlFor="description">Deskripsi</Label>

            <Textarea
              id="description"
              value={description}
              rows={5}
              disabled={isSubmitting}
              className="h-32 max-h-48 resize-y overflow-y-auto field-sizing-fixed"
              onChange={(event) => setDescription(event.target.value)}
              placeholder="Deskripsi task..."
            />
          </div>

          <div className="min-w-0 space-y-2">
            <Label htmlFor="task-project">
              Project <span className="text-destructive">*</span>
            </Label>

            <Select
              value={projectId}
              onValueChange={setProjectId}
              disabled={isSubmitting}>
              <SelectTrigger
                id="task-project"
                className="w-full min-w-0"
                aria-required="true"
                aria-invalid={!!projectError}
                aria-describedby={
                  projectError ? "task-project-error" : undefined
                }>
                <SelectValue placeholder="Pilih project" />
              </SelectTrigger>

              <SelectContent>
                {projects.map((project) => (
                  <SelectItem key={project.id} value={project.id}>
                    {project.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>

            {projectError && (
              <p
                id="task-project-error"
                role="alert"
                className="text-xs text-destructive">
                {projectError}
              </p>
            )}
          </div>

          <div className="space-y-2">
            <Label>Assignee</Label>

            <Select value={assigneeId} onValueChange={setAssigneeId}>
              <SelectTrigger>
                <SelectValue placeholder="Pilih assignee" />
              </SelectTrigger>

              <SelectContent>
                {users.length > 0 ? (
                  users.map((user) => (
                    <SelectItem key={user.id} value={user.id}>
                      {user.name} - {user.email}
                    </SelectItem>
                  ))
                ) : (
                  <SelectItem value="__empty" disabled>
                    Tidak ada user yang eligible
                  </SelectItem>
                )}
              </SelectContent>
            </Select>
          </div>

          <div className="grid gap-4 sm:grid-cols-2">
            <div className="space-y-2">
              <Label>Priority</Label>

              <Select
                value={priority}
                onValueChange={(value) => setPriority(value as TaskPriority)}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>

                <SelectContent>
                  <SelectItem value="LOW">Low</SelectItem>
                  <SelectItem value="MEDIUM">Medium</SelectItem>
                  <SelectItem value="HIGH">High</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label>Status</Label>

              <Select
                value={status}
                onValueChange={(value) => setStatus(value as TaskStatus)}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>

                <SelectContent>
                  <SelectItem value="TODO">Todo</SelectItem>
                  <SelectItem value="IN_PROGRESS">In Progress</SelectItem>
                  <SelectItem value="REVIEW">Review</SelectItem>
                  <SelectItem value="BLOCKED">Blocked</SelectItem>
                  <SelectItem value="COMPLETED">Completed</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="dueDate">Due Date</Label>

            <Input
              id="dueDate"
              type="date"
              value={dueDate}
              onChange={(e) => setDueDate(e.target.value)}
            />
          </div>

          <div className="flex shrink-0 flex-wrap justify-end gap-2 border-t bg-background px-6 py-4">
            <Button
              type="button"
              variant="outline"
              disabled={isSubmitting}
              onClick={() => {
                resetForm();
                setOpen(false);
              }}>
              Batal
            </Button>

            <Button type="submit" disabled={isSubmitting}>
              {isSubmitting ? "Menyimpan..." : "Simpan Task"}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}
