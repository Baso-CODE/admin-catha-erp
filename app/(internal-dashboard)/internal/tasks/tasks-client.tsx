"use client";

import { projectService } from "@/app/services/project.service";
import { TaskItem, taskService } from "@/app/services/task.service";
import { userService } from "@/app/services/userManagement.service";
import { PermissionGuard } from "@/components/shared/permission-guard";
import { Button } from "@/components/ui/button";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { useCallback, useEffect, useMemo, useState } from "react";
import { CreateTaskModal } from "./components/create-task-modal";
import { TaskBoard } from "./components/task-board";
import { TASK_PERMISSIONS } from "./components/task-permissions";
import { TaskTable } from "./components/task-table";
import {
  TaskToolbar,
  TaskToolbarFilters,
  TaskViewMode,
} from "./components/task-toolbar";

const DEFAULT_FILTERS: TaskToolbarFilters = {
  search: "",
  status: "ALL",
  priority: "ALL",
  projectId: "",
  assigneeId: "",
  sortBy: "createdAt",
  sortOrder: "desc",
};

const DEFAULT_PAGE_SIZE = 20;

interface SelectOption {
  value: string;
  label: string;
}

interface TasksClientProps {
  permissions: string[];
}

export function TasksClient({ permissions }: TasksClientProps) {
  const [tasks, setTasks] = useState<TaskItem[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isFilterLoading, setIsFilterLoading] = useState(true);

  const [view, setView] = useState<TaskViewMode>("table");

  const [filters, setFilters] = useState<TaskToolbarFilters>(DEFAULT_FILTERS);

  const [debouncedSearch, setDebouncedSearch] = useState("");

  const [projects, setProjects] = useState<SelectOption[]>([]);

  const [assignees, setAssignees] = useState<SelectOption[]>([]);

  const [page, setPage] = useState(1);
  const [limit] = useState(DEFAULT_PAGE_SIZE);

  const [total, setTotal] = useState(0);
  const [totalPages, setTotalPages] = useState(1);

  useEffect(() => {
    const timeout = window.setTimeout(() => {
      setDebouncedSearch(filters.search.trim());
      setPage(1);
    }, 500);

    return () => window.clearTimeout(timeout);
  }, [filters.search]);

  const fetchFilterOptions = useCallback(async () => {
    try {
      setIsFilterLoading(true);

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

      setProjects(
        projectResponse.data.map((project) => ({
          value: project.id,
          label: project.name,
        })),
      );

      setAssignees(
        userResponse.data.map((user) => ({
          value: user.id,
          label: user.name || user.email,
        })),
      );
    } catch (error) {
      console.error("Gagal mengambil filter task:", error);
    } finally {
      setIsFilterLoading(false);
    }
  }, []);

  const fetchTasks = useCallback(async () => {
    try {
      setIsLoading(true);

      const response = await taskService.getTasks({
        search: debouncedSearch || undefined,

        status: filters.status === "ALL" ? undefined : filters.status,

        priority: filters.priority === "ALL" ? undefined : filters.priority,

        projectId: filters.projectId || undefined,

        assigneeId: filters.assigneeId || undefined,

        sortBy: filters.sortBy,

        sortOrder: filters.sortOrder,

        page,
        limit,
      });

      setTasks(response.data);

      setTotal(response.meta.total);

      setTotalPages(Math.max(response.meta.totalPages, 1));
    } catch (error) {
      console.error("Gagal mengambil task:", error);

      setTasks([]);
      setTotal(0);
      setTotalPages(1);
    } finally {
      setIsLoading(false);
    }
  }, [
    debouncedSearch,
    filters.status,
    filters.priority,
    filters.projectId,
    filters.assigneeId,
    filters.sortBy,
    filters.sortOrder,
    page,
    limit,
  ]);

  useEffect(() => {
    fetchFilterOptions();
  }, [fetchFilterOptions]);

  useEffect(() => {
    fetchTasks();
  }, [fetchTasks]);

  const handleFiltersChange = (nextFilters: TaskToolbarFilters) => {
    setFilters(nextFilters);

    const searchChanged = nextFilters.search !== filters.search;

    if (!searchChanged) {
      setPage(1);
    }
  };

  const handleResetFilters = () => {
    setFilters(DEFAULT_FILTERS);
    setDebouncedSearch("");
    setPage(1);
  };

  const handleViewChange = (nextView: TaskViewMode) => {
    setView(nextView);
    setPage(1);
  };

  const rangeLabel = useMemo(() => {
    if (total === 0) {
      return "0 task";
    }

    const start = (page - 1) * limit + 1;

    const end = Math.min(page * limit, total);

    return `${start}-${end} dari ${total} task`;
  }, [page, limit, total]);

  return (
    <div className="space-y-6 p-6">
      <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
        <div>
          <h1 className="text-2xl font-semibold">Task Management</h1>

          <p className="text-sm text-muted-foreground">
            Kelola task, assignee, deadline, checklist, komentar, attachment,
            dan workflow.
          </p>
        </div>
        <PermissionGuard
          permissions={permissions}
          required={TASK_PERMISSIONS.CREATE}>
          <CreateTaskModal onSuccess={fetchTasks} />
        </PermissionGuard>
      </div>

      <TaskToolbar
        view={view}
        filters={filters}
        projects={projects}
        assignees={assignees}
        onViewChange={handleViewChange}
        onFiltersChange={handleFiltersChange}
        onReset={handleResetFilters}
      />

      {isFilterLoading && (
        <p className="text-xs text-muted-foreground">
          Memuat pilihan project dan assignee...
        </p>
      )}

      {isLoading ? (
        <div className="rounded-lg border p-10 text-center text-sm text-muted-foreground">
          Memuat task...
        </div>
      ) : tasks.length === 0 ? (
        <div className="rounded-lg border border-dashed p-12 text-center">
          <h3 className="font-medium">Task tidak ditemukan</h3>

          <p className="mt-1 text-sm text-muted-foreground">
            Coba ubah pencarian atau filter yang digunakan.
          </p>
        </div>
      ) : view === "table" ? (
        <TaskTable
          tasks={tasks}
          permissions={permissions}
          onRefresh={fetchTasks}
        />
      ) : (
        <TaskBoard
          tasks={tasks}
          permissions={permissions}
          onRefresh={fetchTasks}
        />
      )}

      {!isLoading && total > 0 && (
        <div className="flex flex-col gap-3 border-t pt-4 sm:flex-row sm:items-center sm:justify-between">
          <p className="text-sm text-muted-foreground">{rangeLabel}</p>

          <div className="flex items-center gap-2">
            <Button
              type="button"
              variant="outline"
              size="sm"
              disabled={page <= 1}
              onClick={() => setPage((current) => Math.max(1, current - 1))}>
              <ChevronLeft className="mr-1 size-4" />
              Previous
            </Button>

            <div className="min-w-24 text-center text-sm">
              Page {page} / {totalPages}
            </div>

            <Button
              type="button"
              variant="outline"
              size="sm"
              disabled={page >= totalPages}
              onClick={() =>
                setPage((current) => Math.min(totalPages, current + 1))
              }>
              Next
              <ChevronRight className="ml-1 size-4" />
            </Button>
          </div>
        </div>
      )}
    </div>
  );
}
