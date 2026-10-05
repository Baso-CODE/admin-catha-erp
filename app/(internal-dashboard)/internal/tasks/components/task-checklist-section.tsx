"use client";

import { TaskChecklistItem, taskService } from "@/app/services/task.service";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Input } from "@/components/ui/input";
import { CheckSquare, Plus, Trash2 } from "lucide-react";
import { FormEvent, useState } from "react";
import { toast } from "sonner";
import { hasPermission, TASK_PERMISSIONS } from "./task-permissions";

interface TaskChecklistSectionProps {
  taskId: string;
  items: TaskChecklistItem[];
  permissions: string[];
  onRefresh: () => void;
}

export function TaskChecklistSection({
  taskId,
  items,
  permissions,
  onRefresh,
}: TaskChecklistSectionProps) {
  const [description, setDescription] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [updatingId, setUpdatingId] = useState<string | null>(null);

  const completed = items.filter((item) => item.isCompleted).length;

  const canCreate = hasPermission(
    permissions,
    TASK_PERMISSIONS.CHECKLIST_CREATE,
  );

  const canUpdate = hasPermission(
    permissions,
    TASK_PERMISSIONS.CHECKLIST_UPDATE,
  );

  const canDelete = hasPermission(
    permissions,
    TASK_PERMISSIONS.CHECKLIST_DELETE,
  );

  const handleCreate = async (event: FormEvent) => {
    event.preventDefault();

    if (!description.trim()) return;

    try {
      setIsSubmitting(true);

      await taskService.createTaskChecklist(taskId, {
        description: description.trim(),
      });

      setDescription("");
      toast.success("Checklist berhasil ditambahkan");
      onRefresh();
    } catch (error) {
      console.error(error);
      toast.error("Gagal menambahkan checklist");
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleToggle = async (item: TaskChecklistItem) => {
    try {
      setUpdatingId(item.id);

      await taskService.updateTaskChecklist(item.id, {
        isCompleted: !item.isCompleted,
      });

      onRefresh();
    } catch (error) {
      console.error(error);
      toast.error("Gagal memperbarui checklist");
    } finally {
      setUpdatingId(null);
    }
  };

  const handleDelete = async (id: string) => {
    try {
      setUpdatingId(id);

      await taskService.deleteTaskChecklist(id);

      toast.success("Checklist berhasil dihapus");
      onRefresh();
    } catch (error) {
      console.error(error);
      toast.error("Gagal menghapus checklist");
    } finally {
      setUpdatingId(null);
    }
  };

  return (
    <section className="space-y-3">
      <div className="flex items-center gap-2">
        <CheckSquare className="size-4" />

        <h3 className="font-medium">Checklist</h3>

        <Badge variant="secondary">
          {completed}/{items.length}
        </Badge>
      </div>

      {canCreate && (
        <form onSubmit={handleCreate} className="flex gap-2">
          <Input
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            placeholder="Tambah checklist..."
          />

          <Button
            type="submit"
            size="icon"
            disabled={isSubmitting || !description.trim()}>
            <Plus className="size-4" />
          </Button>
        </form>
      )}

      {!items.length ? (
        <p className="text-sm text-muted-foreground">Belum ada checklist.</p>
      ) : (
        <div className="space-y-2">
          {items.map((item) => (
            <div
              key={item.id}
              className="flex items-center gap-3 rounded-md border p-3">
              <Checkbox
                checked={item.isCompleted}
                disabled={!canUpdate || updatingId === item.id}
                onCheckedChange={() => {
                  if (canUpdate) {
                    handleToggle(item);
                  }
                }}
              />

              <span
                className={
                  item.isCompleted
                    ? "flex-1 text-sm text-muted-foreground line-through"
                    : "flex-1 text-sm"
                }>
                {item.description}
              </span>

              {canDelete && (
                <Button
                  type="button"
                  size="icon"
                  variant="ghost"
                  disabled={updatingId === item.id}
                  onClick={() => handleDelete(item.id)}>
                  <Trash2 className="size-4" />
                </Button>
              )}
            </div>
          ))}
        </div>
      )}
    </section>
  );
}
