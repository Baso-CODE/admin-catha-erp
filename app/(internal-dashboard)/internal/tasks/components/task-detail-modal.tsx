"use client";

import { TaskDetail, taskService } from "@/app/services/task.service";
import { Badge } from "@/components/ui/badge";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Separator } from "@/components/ui/separator";
import { CalendarDays, UserRound } from "lucide-react";
import { ReactNode, useEffect, useState } from "react";
import { TaskActivitySection } from "./task-activity-section";
import { TaskAttachmentSection } from "./task-attachment-section";
import { TaskChecklistSection } from "./task-checklist-section";
import { TaskCommentSection } from "./task-comment-section";
import { TaskSubtaskSection } from "./task-subtask-section";

interface TaskDetailModalProps {
  taskId: string;
  permissions: string[];
  trigger: ReactNode;
}

export function TaskDetailModal({
  taskId,
  trigger,
  permissions,
}: TaskDetailModalProps) {
  const [open, setOpen] = useState(false);
  const [task, setTask] = useState<TaskDetail | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  const fetchTask = async () => {
    try {
      setIsLoading(true);

      const response = await taskService.getTaskById(taskId);

      setTask(response);
    } catch (error) {
      console.error("Gagal mengambil detail task:", error);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    if (!open) return;

    fetchTask();
  }, [open, taskId]);

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>{trigger}</DialogTrigger>

      <DialogContent className="max-h-[90vh] overflow-y-auto sm:max-w-6xl">
        {isLoading ? (
          <div className="py-12 text-center text-sm text-muted-foreground">
            Memuat detail task...
          </div>
        ) : !task ? (
          <div className="py-12 text-center text-sm text-muted-foreground">
            Task tidak ditemukan.
          </div>
        ) : (
          <>
            <DialogHeader>
              <div className="text-xs text-muted-foreground">
                {task.taskCode}
              </div>

              <DialogTitle className="text-2xl">{task.title}</DialogTitle>
            </DialogHeader>

            <div className="grid gap-6 lg:grid-cols-[1fr_260px]">
              <div className="space-y-6">
                <section className="space-y-2">
                  <h3 className="font-medium">Deskripsi</h3>

                  <p className="whitespace-pre-wrap text-sm text-muted-foreground">
                    {task.description || "Belum ada deskripsi."}
                  </p>
                </section>

                <Separator />

                <TaskSubtaskSection
                  task={task}
                  subtasks={task.subtasks}
                  permissions={permissions}
                  onRefresh={fetchTask}
                />

                <Separator />

                <TaskChecklistSection
                  taskId={task.id}
                  items={task.checklists}
                  permissions={permissions}
                  onRefresh={fetchTask}
                />

                <Separator />

                <TaskCommentSection
                  taskId={task.id}
                  comments={task.comments}
                  permissions={permissions}
                  onRefresh={fetchTask}
                />

                <Separator />

                <TaskAttachmentSection
                  taskId={task.id}
                  permissions={permissions}
                  attachments={task.attachments}
                  onRefresh={fetchTask}
                />

                <Separator />

                <TaskActivitySection taskId={task.id} />
              </div>

              <aside className="space-y-4 rounded-lg border p-4">
                <div className="space-y-1">
                  <div className="text-xs text-muted-foreground">Project</div>
                  <div className="text-sm font-medium">{task.project.name}</div>
                </div>

                <div className="space-y-1">
                  <div className="text-xs text-muted-foreground">Status</div>
                  <Badge variant="outline">{task.status}</Badge>
                </div>

                <div className="space-y-1">
                  <div className="text-xs text-muted-foreground">Priority</div>
                  <Badge variant="secondary">{task.priority}</Badge>
                </div>

                <div className="space-y-1">
                  <div className="flex items-center gap-1 text-xs text-muted-foreground">
                    <UserRound className="size-3" />
                    Assignee
                  </div>

                  <div className="text-sm">
                    {task.assignee?.name ?? "Unassigned"}
                  </div>
                </div>

                <div className="space-y-1">
                  <div className="flex items-center gap-1 text-xs text-muted-foreground">
                    <CalendarDays className="size-3" />
                    Due Date
                  </div>

                  <div className="text-sm">
                    {task.dueDate
                      ? new Date(task.dueDate).toLocaleDateString("id-ID")
                      : "-"}
                  </div>
                </div>
              </aside>
            </div>
          </>
        )}
      </DialogContent>
    </Dialog>
  );
}
