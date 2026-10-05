"use client";

import { TaskPriority, TaskStatus } from "@/app/services/task.service";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { LayoutGrid, List, RotateCcw, Search } from "lucide-react";

export type TaskViewMode = "table" | "board";

export interface TaskToolbarFilters {
  search: string;
  status: TaskStatus | "ALL";
  priority: TaskPriority | "ALL";
  projectId: string;
  assigneeId: string;
  sortBy: "createdAt" | "dueDate" | "position";
  sortOrder: "asc" | "desc";
}

interface Option {
  value: string;
  label: string;
}

interface TaskToolbarProps {
  view: TaskViewMode;
  filters: TaskToolbarFilters;
  projects: Option[];
  assignees: Option[];
  onViewChange: (view: TaskViewMode) => void;
  onFiltersChange: (filters: TaskToolbarFilters) => void;
  onReset: () => void;
}

export function TaskToolbar({
  view,
  filters,
  projects,
  assignees,
  onViewChange,
  onFiltersChange,
  onReset,
}: TaskToolbarProps) {
  const updateFilter = <K extends keyof TaskToolbarFilters>(
    key: K,
    value: TaskToolbarFilters[K],
  ) => {
    onFiltersChange({
      ...filters,
      [key]: value,
    });
  };

  return (
    <div className="space-y-4">
      <div className="flex flex-col gap-3 rounded-lg border p-4 xl:flex-row xl:items-center">
        <div className="relative min-w-0 flex-1">
          <Search className="absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />

          <Input
            value={filters.search}
            onChange={(e) => updateFilter("search", e.target.value)}
            placeholder="Cari task atau task code..."
            className="pl-9"
          />
        </div>

        <Select
          value={filters.status}
          onValueChange={(value) =>
            updateFilter("status", value as TaskStatus | "ALL")
          }>
          <SelectTrigger className="w-full xl:w-44">
            <SelectValue placeholder="Status" />
          </SelectTrigger>

          <SelectContent>
            <SelectItem value="ALL">Semua Status</SelectItem>
            <SelectItem value="TODO">Todo</SelectItem>
            <SelectItem value="IN_PROGRESS">In Progress</SelectItem>
            <SelectItem value="REVIEW">Review</SelectItem>
            <SelectItem value="BLOCKED">Blocked</SelectItem>
            <SelectItem value="COMPLETED">Completed</SelectItem>
          </SelectContent>
        </Select>

        <Select
          value={filters.priority}
          onValueChange={(value) =>
            updateFilter("priority", value as TaskPriority | "ALL")
          }>
          <SelectTrigger className="w-full xl:w-40">
            <SelectValue placeholder="Priority" />
          </SelectTrigger>

          <SelectContent>
            <SelectItem value="ALL">Semua Priority</SelectItem>
            <SelectItem value="LOW">Low</SelectItem>
            <SelectItem value="MEDIUM">Medium</SelectItem>
            <SelectItem value="HIGH">High</SelectItem>
          </SelectContent>
        </Select>

        <Select
          value={filters.projectId || "ALL"}
          onValueChange={(value) =>
            updateFilter("projectId", value === "ALL" ? "" : value)
          }>
          <SelectTrigger className="w-full xl:w-52">
            <SelectValue placeholder="Project" />
          </SelectTrigger>

          <SelectContent>
            <SelectItem value="ALL">Semua Project</SelectItem>

            {projects.map((project) => (
              <SelectItem key={project.value} value={project.value}>
                {project.label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>

        <Select
          value={filters.assigneeId || "ALL"}
          onValueChange={(value) =>
            updateFilter("assigneeId", value === "ALL" ? "" : value)
          }>
          <SelectTrigger className="w-full xl:w-52">
            <SelectValue placeholder="Assignee" />
          </SelectTrigger>

          <SelectContent>
            <SelectItem value="ALL">Semua Assignee</SelectItem>

            {assignees.map((assignee) => (
              <SelectItem key={assignee.value} value={assignee.value}>
                {assignee.label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>

        <Select
          value={`${filters.sortBy}:${filters.sortOrder}`}
          onValueChange={(value) => {
            const [sortBy, sortOrder] = value.split(":");

            onFiltersChange({
              ...filters,
              sortBy: sortBy as TaskToolbarFilters["sortBy"],
              sortOrder: sortOrder as TaskToolbarFilters["sortOrder"],
            });
          }}>
          <SelectTrigger className="w-full xl:w-48">
            <SelectValue placeholder="Urutkan" />
          </SelectTrigger>

          <SelectContent>
            <SelectItem value="createdAt:desc">Terbaru</SelectItem>
            <SelectItem value="createdAt:asc">Terlama</SelectItem>
            <SelectItem value="dueDate:asc">Deadline Terdekat</SelectItem>
            <SelectItem value="dueDate:desc">Deadline Terjauh</SelectItem>
            <SelectItem value="position:asc">Posisi Board</SelectItem>
          </SelectContent>
        </Select>

        <Button
          type="button"
          variant="outline"
          size="icon"
          onClick={onReset}
          title="Reset filter">
          <RotateCcw className="size-4" />
        </Button>
      </div>

      <div className="flex items-center gap-2">
        <Button
          type="button"
          size="sm"
          variant={view === "table" ? "default" : "outline"}
          onClick={() => onViewChange("table")}>
          <List className="mr-2 size-4" />
          Table
        </Button>

        <Button
          type="button"
          size="sm"
          variant={view === "board" ? "default" : "outline"}
          onClick={() => onViewChange("board")}>
          <LayoutGrid className="mr-2 size-4" />
          Board
        </Button>
      </div>
    </div>
  );
}
