"use client";

import { TaskItem, TaskStatus, taskService } from "@/app/services/task.service";
import { Badge } from "@/components/ui/badge";
import {
  DndContext,
  DragEndEvent,
  PointerSensor,
  closestCorners,
  useDroppable,
  useSensor,
  useSensors,
} from "@dnd-kit/core";
import {
  SortableContext,
  useSortable,
  verticalListSortingStrategy,
} from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import { CalendarDays, UserRound } from "lucide-react";
import { useEffect, useState } from "react";
import { toast } from "sonner";
import { TaskDetailModal } from "./task-detail-modal";
import { TASK_PERMISSIONS, hasPermission } from "./task-permissions";

interface TaskBoardProps {
  tasks: TaskItem[];
  permissions: string[];
  onRefresh?: () => void;
}

const columns: {
  status: TaskStatus;
  label: string;
}[] = [
  {
    status: "TODO",
    label: "Todo",
  },
  {
    status: "IN_PROGRESS",
    label: "In Progress",
  },
  {
    status: "REVIEW",
    label: "Review",
  },
  {
    status: "BLOCKED",
    label: "Blocked",
  },
  {
    status: "COMPLETED",
    label: "Completed",
  },
];

function getColumnId(status: TaskStatus) {
  return `column:${status}`;
}

function getStatusFromColumnId(id: string): TaskStatus | null {
  if (!id.startsWith("column:")) {
    return null;
  }

  const status = id.replace("column:", "") as TaskStatus;

  return columns.some((column) => column.status === status) ? status : null;
}

interface SortableTaskCardProps {
  task: TaskItem;
  canManage: boolean;
  permissions: string[];
}

function SortableTaskCard({
  task,
  canManage,
  permissions,
}: SortableTaskCardProps) {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({
    id: task.id,
    disabled: !canManage,
    data: {
      type: "task",
      task,
    },
  });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
  };

  return (
    <div
      ref={setNodeRef}
      style={style}
      {...(canManage ? attributes : {})}
      {...(canManage ? listeners : {})}
      className={isDragging ? "relative z-50 opacity-50" : ""}>
      <TaskDetailModal
        taskId={task.id}
        permissions={permissions}
        trigger={
          <button
            type="button"
            className={`w-full rounded-lg border bg-background p-3 text-left shadow-sm transition hover:bg-muted/50 ${
              canManage
                ? "cursor-grab active:cursor-grabbing"
                : "cursor-pointer"
            }`}>
            <div className="space-y-3">
              <div>
                <div className="text-xs text-muted-foreground">
                  {task.taskCode}
                </div>

                <div className="mt-1 text-sm font-medium">{task.title}</div>
              </div>

              <div className="flex flex-wrap gap-2">
                <Badge variant="outline">{task.priority}</Badge>

                {task._count.subtasks > 0 && (
                  <Badge variant="secondary">
                    {task._count.subtasks} subtasks
                  </Badge>
                )}
              </div>

              <div className="space-y-1.5 text-xs text-muted-foreground">
                <div className="flex items-center gap-2">
                  <UserRound className="size-3.5" />

                  <span className="truncate">
                    {task.assignee?.name ?? "Unassigned"}
                  </span>
                </div>

                {task.dueDate && (
                  <div className="flex items-center gap-2">
                    <CalendarDays className="size-3.5" />

                    {new Date(task.dueDate).toLocaleDateString("id-ID")}
                  </div>
                )}
              </div>
            </div>
          </button>
        }
      />
    </div>
  );
}

interface TaskColumnProps {
  status: TaskStatus;
  label: string;
  tasks: TaskItem[];
  canManage: boolean;
  permissions: string[];
}

function TaskColumn({
  status,
  label,
  tasks,
  canManage,
  permissions,
}: TaskColumnProps) {
  const { setNodeRef, isOver } = useDroppable({
    id: getColumnId(status),
    disabled: !canManage,
    data: {
      type: "column",
      status,
    },
  });

  return (
    <div
      ref={setNodeRef}
      className={`min-h-125 rounded-lg border bg-muted/20 transition ${
        canManage && isOver ? "border-primary bg-primary/5" : ""
      }`}>
      <div className="flex items-center justify-between border-b p-3">
        <h3 className="text-sm font-medium">{label}</h3>

        <Badge variant="secondary">{tasks.length}</Badge>
      </div>

      <SortableContext
        items={tasks.map((task) => task.id)}
        strategy={verticalListSortingStrategy}>
        <div className="min-h-110 space-y-3 p-3">
          {tasks.length === 0 ? (
            <div className="flex min-h-32 items-center justify-center rounded-md border border-dashed p-6 text-center text-xs text-muted-foreground">
              {canManage ? "Drop task di sini" : "Belum ada task"}
            </div>
          ) : (
            tasks.map((task) => (
              <SortableTaskCard
                key={task.id}
                task={task}
                canManage={canManage}
                permissions={permissions}
              />
            ))
          )}
        </div>
      </SortableContext>
    </div>
  );
}

export function TaskBoard({ tasks, permissions, onRefresh }: TaskBoardProps) {
  const canManage = hasPermission(permissions, TASK_PERMISSIONS.MANAGE);

  const [localTasks, setLocalTasks] = useState<TaskItem[]>(tasks);

  const sensors = useSensors(
    useSensor(PointerSensor, {
      activationConstraint: {
        distance: 8,
      },
    }),
  );

  useEffect(() => {
    setLocalTasks(tasks);
  }, [tasks]);

  const handleDragEnd = async (event: DragEndEvent) => {
    if (!canManage) {
      return;
    }

    const { active, over } = event;

    if (!over) return;

    const activeId = String(active.id);

    const overId = String(over.id);

    const activeTask = localTasks.find((task) => task.id === activeId);

    if (!activeTask) return;

    const overTask = localTasks.find((task) => task.id === overId);

    const columnStatus = getStatusFromColumnId(overId);

    let targetStatus: TaskStatus;
    let beforeTaskId: string | null = null;

    let afterTaskId: string | null = null;

    if (overTask) {
      targetStatus = overTask.status;

      const targetTasks = localTasks
        .filter(
          (task) => task.status === targetStatus && task.id !== activeTask.id,
        )
        .sort((a, b) => a.position - b.position);

      const overIndex = targetTasks.findIndex(
        (task) => task.id === overTask.id,
      );

      if (overIndex === -1) {
        return;
      }

      beforeTaskId = targetTasks[overIndex - 1]?.id ?? null;

      afterTaskId = overTask.id;
    } else if (columnStatus) {
      targetStatus = columnStatus;

      const targetTasks = localTasks
        .filter(
          (task) => task.status === targetStatus && task.id !== activeTask.id,
        )
        .sort((a, b) => a.position - b.position);

      beforeTaskId = targetTasks.at(-1)?.id ?? null;

      afterTaskId = null;
    } else {
      return;
    }

    const previousTasks = localTasks;

    const targetTasks = localTasks
      .filter(
        (task) => task.status === targetStatus && task.id !== activeTask.id,
      )
      .sort((a, b) => a.position - b.position);

    const beforeTask = beforeTaskId
      ? targetTasks.find((task) => task.id === beforeTaskId)
      : null;

    const afterTask = afterTaskId
      ? targetTasks.find((task) => task.id === afterTaskId)
      : null;

    let optimisticPosition: number;

    if (beforeTask && afterTask) {
      optimisticPosition = (beforeTask.position + afterTask.position) / 2;
    } else if (beforeTask) {
      optimisticPosition = beforeTask.position + 1024;
    } else if (afterTask) {
      optimisticPosition = afterTask.position - 1024;
    } else {
      optimisticPosition = 1024;
    }

    setLocalTasks((current) =>
      current.map((task) =>
        task.id === activeTask.id
          ? {
              ...task,
              status: targetStatus,
              position: optimisticPosition,
            }
          : task,
      ),
    );

    try {
      await taskService.moveTask(activeTask.id, {
        status: targetStatus,
        beforeTaskId,
        afterTaskId,
      });

      toast.success("Task berhasil dipindahkan");

      onRefresh?.();
    } catch (error) {
      console.error(error);

      setLocalTasks(previousTasks);

      toast.error("Gagal memindahkan task");
    }
  };

  return (
    <DndContext
      sensors={sensors}
      collisionDetection={closestCorners}
      onDragEnd={handleDragEnd}>
      <div className="overflow-x-auto">
        <div className="grid min-w-350 grid-cols-5 gap-4">
          {columns.map((column) => {
            const columnTasks = localTasks
              .filter((task) => task.status === column.status)
              .sort((a, b) => a.position - b.position);

            return (
              <TaskColumn
                key={column.status}
                status={column.status}
                label={column.label}
                tasks={columnTasks}
                canManage={canManage}
                permissions={permissions}
              />
            );
          })}
        </div>
      </div>
    </DndContext>
  );
}
