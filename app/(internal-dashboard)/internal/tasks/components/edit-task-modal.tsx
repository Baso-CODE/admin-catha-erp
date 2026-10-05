"use client";

import { projectService } from "@/app/services/project.service";
import {
  TaskItem,
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
import { ReactNode, useEffect, useState } from "react";
import { toast } from "sonner";

interface EditTaskModalProps {
  task: TaskItem;
  trigger?: ReactNode;
  onSuccess?: () => void;
}

export function EditTaskModal({
  task,
  trigger,
  onSuccess,
}: EditTaskModalProps) {
  const [open, setOpen] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [projects, setProjects] = useState<any[]>([]);
  const [users, setUsers] = useState<UserItem[]>([]);

  const [title, setTitle] = useState(task.title);
  const [description, setDescription] = useState(task.description ?? "");
  const [projectId] = useState(task.projectId);
  const [assigneeId, setAssigneeId] = useState(task.assigneeId ?? "");
  const [priority, setPriority] = useState<TaskPriority>(task.priority);
  const [status, setStatus] = useState<TaskStatus>(task.status);
  const [dueDate, setDueDate] = useState(
    task.dueDate ? new Date(task.dueDate).toISOString().slice(0, 10) : "",
  );

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
        console.error(error);
      }
    };

    fetchOptions();
  }, [open]);

  useEffect(() => {
    if (!open) return;

    setTitle(task.title);
    setDescription(task.description ?? "");
    setAssigneeId(task.assigneeId ?? "");
    setPriority(task.priority);
    setStatus(task.status);
    setDueDate(
      task.dueDate ? new Date(task.dueDate).toISOString().slice(0, 10) : "",
    );
  }, [open, task]);

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault();

    if (!title.trim()) {
      toast.error("Judul task wajib diisi");
      return;
    }

    try {
      setIsSubmitting(true);

      await taskService.updateTask(task.id, {
        title: title.trim(),
        description: description.trim(),
        assigneeId: assigneeId || null,
        priority,
        status,
        dueDate: dueDate ? new Date(dueDate).toISOString() : null,
      });

      toast.success("Task berhasil diperbarui");
      setOpen(false);
      onSuccess?.();
    } catch (error) {
      console.error(error);
      toast.error("Gagal memperbarui task");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      {trigger && <DialogTrigger asChild>{trigger}</DialogTrigger>}

      <DialogContent className="sm:max-w-xl">
        <DialogHeader>
          <DialogTitle>Edit Task</DialogTitle>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor={`title-${task.id}`}>Judul Task</Label>
            <Input
              id={`title-${task.id}`}
              value={title}
              onChange={(e) => setTitle(e.target.value)}
            />
          </div>

          <div className="space-y-2">
            <Label>Project</Label>
            <Select value={projectId} disabled>
              <SelectTrigger>
                <SelectValue />
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
            <Label>Deskripsi</Label>
            <Textarea
              value={description}
              onChange={(e) => setDescription(e.target.value)}
            />
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
            <Label>Due Date</Label>
            <Input
              type="date"
              value={dueDate}
              onChange={(e) => setDueDate(e.target.value)}
            />
          </div>

          <div className="flex justify-end gap-2">
            <Button
              type="button"
              variant="outline"
              onClick={() => setOpen(false)}>
              Batal
            </Button>

            <Button type="submit" disabled={isSubmitting}>
              {isSubmitting ? "Menyimpan..." : "Simpan Perubahan"}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}
