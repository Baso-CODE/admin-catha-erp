"use client";

import { TaskItem } from "@/app/services/task.service";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { MoreHorizontal, Pencil, Trash2 } from "lucide-react";

import { DeleteTaskDialog } from "./delete-task-dialog";
import { EditTaskModal } from "./edit-task-modal";
import { TaskDetailModal } from "./task-detail-modal";
import { hasPermission, TASK_PERMISSIONS } from "./task-permissions";

interface TaskTableProps {
  tasks: TaskItem[];
  permissions: string[];
  onRefresh: () => void;
}

const statusLabel: Record<TaskItem["status"], string> = {
  TODO: "Todo",
  IN_PROGRESS: "In Progress",
  REVIEW: "Review",
  BLOCKED: "Blocked",
  COMPLETED: "Completed",
};

const priorityLabel: Record<TaskItem["priority"], string> = {
  LOW: "Low",
  MEDIUM: "Medium",
  HIGH: "High",
};

export function TaskTable({ tasks, permissions, onRefresh }: TaskTableProps) {
  const canUpdate = hasPermission(permissions, TASK_PERMISSIONS.UPDATE);

  const canDelete = hasPermission(permissions, TASK_PERMISSIONS.DELETE);

  const hasActions = canUpdate || canDelete;

  if (!tasks.length) {
    return (
      <div className="rounded-lg border p-8 text-center text-sm text-muted-foreground">
        Belum ada task.
      </div>
    );
  }

  return (
    <div className="overflow-hidden rounded-lg border">
      <div className="overflow-x-auto">
        <table className="w-full text-sm">
          <thead className="border-b bg-muted/40">
            <tr>
              <th className="px-4 py-3 text-left font-medium">Task</th>

              <th className="px-4 py-3 text-left font-medium">Project</th>

              <th className="px-4 py-3 text-left font-medium">Assignee</th>

              <th className="px-4 py-3 text-left font-medium">Status</th>

              <th className="px-4 py-3 text-left font-medium">Priority</th>

              <th className="px-4 py-3 text-left font-medium">Due Date</th>

              {hasActions && <th className="w-14 px-4 py-3" />}
            </tr>
          </thead>

          <tbody>
            {tasks.map((task) => (
              <tr
                key={task.id}
                className="border-b last:border-0 hover:bg-muted/30">
                <td className="px-4 py-3">
                  <TaskDetailModal
                    taskId={task.id}
                    permissions={permissions}
                    trigger={
                      <button
                        type="button"
                        className="text-left font-medium hover:underline">
                        {task.title}
                      </button>
                    }
                  />

                  <div className="text-xs text-muted-foreground">
                    {task.taskCode}
                  </div>
                </td>

                <td className="px-4 py-3">{task.project?.name ?? "-"}</td>

                <td className="px-4 py-3">
                  {task.assignee?.name ?? "Unassigned"}
                </td>

                <td className="px-4 py-3">
                  <Badge variant="outline">{statusLabel[task.status]}</Badge>
                </td>

                <td className="px-4 py-3">
                  <Badge variant="secondary">
                    {priorityLabel[task.priority]}
                  </Badge>
                </td>

                <td className="px-4 py-3">
                  {task.dueDate
                    ? new Date(task.dueDate).toLocaleDateString("id-ID")
                    : "-"}
                </td>

                {hasActions && (
                  <td className="px-4 py-3">
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button type="button" variant="ghost" size="icon">
                          <MoreHorizontal className="size-4" />
                        </Button>
                      </DropdownMenuTrigger>

                      <DropdownMenuContent
                        align="end"
                        className="min-w-44 border bg-popover p-1 shadow-lg">
                        {canUpdate && (
                          <EditTaskModal
                            task={task}
                            onSuccess={onRefresh}
                            trigger={
                              <DropdownMenuItem
                                onSelect={(e) => e.preventDefault()}>
                                <Pencil className="mr-2 size-4" />
                                Edit Task
                              </DropdownMenuItem>
                            }
                          />
                        )}

                        {canDelete && (
                          <DeleteTaskDialog
                            task={task}
                            onSuccess={onRefresh}
                            trigger={
                              <DropdownMenuItem
                                onSelect={(e) => e.preventDefault()}
                                className="text-destructive focus:text-destructive">
                                <Trash2 className="mr-2 size-4" />
                                Hapus Task
                              </DropdownMenuItem>
                            }
                          />
                        )}
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </td>
                )}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
