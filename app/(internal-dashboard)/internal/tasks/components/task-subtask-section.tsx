"use client";

import {
  TaskDetail,
  taskService,
  TaskSubtask,
} from "@/app/services/task.service";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { ListTree, Plus } from "lucide-react";
import { FormEvent, useState } from "react";
import { toast } from "sonner";
import { hasPermission, TASK_PERMISSIONS } from "./task-permissions";

interface TaskSubtaskSectionProps {
  task: TaskDetail;
  subtasks: TaskSubtask[];
  permissions: string[];
  onRefresh: () => void;
}

export function TaskSubtaskSection({
  task,
  subtasks,
  permissions,
  onRefresh,
}: TaskSubtaskSectionProps) {
  const [title, setTitle] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const canCreate = hasPermission(permissions, TASK_PERMISSIONS.CREATE);

  const handleSubmit = async (event: FormEvent) => {
    event.preventDefault();

    if (!title.trim()) return;

    try {
      setIsSubmitting(true);

      await taskService.createSubtask(task, {
        title: title.trim(),
        priority: "MEDIUM",
        status: "TODO",
      });

      setTitle("");
      toast.success("Subtask berhasil dibuat");
      onRefresh();
    } catch (error) {
      console.error(error);
      toast.error("Gagal membuat subtask");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <section className="space-y-3">
      <div className="flex items-center gap-2">
        <ListTree className="size-4" />

        <h3 className="font-medium">Subtasks</h3>

        <Badge variant="secondary">{subtasks.length}</Badge>
      </div>

      {canCreate && (
        <form onSubmit={handleSubmit} className="flex gap-2">
          <Input
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            placeholder="Tambah subtask..."
          />

          <Button
            type="submit"
            size="icon"
            disabled={isSubmitting || !title.trim()}>
            <Plus className="size-4" />
          </Button>
        </form>
      )}

      {!subtasks.length ? (
        <p className="text-sm text-muted-foreground">Belum ada subtask.</p>
      ) : (
        <div className="space-y-2">
          {subtasks.map((subtask) => (
            <div
              key={subtask.id}
              className="flex items-center justify-between gap-3 rounded-md border p-3">
              <div className="min-w-0">
                <div className="truncate text-sm font-medium">
                  {subtask.title}
                </div>

                <div className="text-xs text-muted-foreground">
                  {subtask.taskCode}
                </div>
              </div>

              <div className="flex items-center gap-2">
                <Badge variant="outline">{subtask.status}</Badge>

                <Badge variant="secondary">{subtask.priority}</Badge>
              </div>
            </div>
          ))}
        </div>
      )}
    </section>
  );
}
