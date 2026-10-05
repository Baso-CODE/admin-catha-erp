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

import { UserItem, userService } from "@/app/services/userManagement.service";
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
  const [users, setUsers] = useState<UserItem[]>([]);

  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [projectId, setProjectId] = useState("");
  const [assigneeId, setAssigneeId] = useState("");
  const [priority, setPriority] = useState<TaskPriority>("MEDIUM");
  const [status, setStatus] = useState<TaskStatus>("TODO");
  const [dueDate, setDueDate] = useState("");

  useEffect(() => {
    if (!open) return;

    const fetchOptions = async () => {
      try {
        const [projectResponse, userResponse] = await Promise.all([
          projectService.getAll({
            page: 1,
            limit: 100,
          }),
          userService.getUsers({
            isActive: true,
            page: 1,
            limit: 100,
          }),
        ]);

        setProjects(projectResponse.data);
        setUsers(userResponse.data);
      } catch (error) {
        console.error("Gagal mengambil option task:", error);
      }
    };

    fetchOptions();
  }, [open]);

  const resetForm = () => {
    setTitle("");
    setDescription("");
    setProjectId("");
    setAssigneeId("");
    setPriority("MEDIUM");
    setStatus("TODO");
    setDueDate("");
  };

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault();

    if (!title.trim() || !projectId) {
      toast.error("Judul dan project wajib diisi");
      return;
    }

    try {
      setIsSubmitting(true);

      await taskService.createTask({
        title: title.trim(),
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
      onSuccess?.();
    } catch (error) {
      console.error(error);

      toast.error("Gagal membuat task");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Dialog
      open={open}
      onOpenChange={(value) => {
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

      <DialogContent className="sm:max-w-xl">
        <DialogHeader>
          <DialogTitle>Tambah Task</DialogTitle>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="title">Judul Task</Label>

            <Input
              id="title"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="Contoh: Setup Meta Ads"
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="description">Deskripsi</Label>

            <Textarea
              id="description"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Deskripsi task..."
            />
          </div>

          <div className="space-y-2">
            <Label>Project</Label>

            <Select value={projectId} onValueChange={setProjectId}>
              <SelectTrigger>
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
          </div>

          <div className="space-y-2">
            <Label>Assignee</Label>

            <Select value={assigneeId} onValueChange={setAssigneeId}>
              <SelectTrigger>
                <SelectValue placeholder="Pilih assignee" />
              </SelectTrigger>

              <SelectContent>
                {users.map((user) => (
                  <SelectItem key={user.id} value={user.id}>
                    {user.name}
                  </SelectItem>
                ))}
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

          <div className="flex justify-end gap-2 pt-2">
            <Button
              type="button"
              variant="outline"
              onClick={() => setOpen(false)}>
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
