"use client";

import { TaskItem, taskService } from "@/app/services/task.service";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import { Button } from "@/components/ui/button";
import { ReactNode, useState } from "react";
import { toast } from "sonner";

interface DeleteTaskDialogProps {
  task: TaskItem;
  trigger: ReactNode;
  onSuccess?: () => void;
}

export function DeleteTaskDialog({
  task,
  trigger,
  onSuccess,
}: DeleteTaskDialogProps) {
  const [isDeleting, setIsDeleting] = useState(false);

  const handleDelete = async () => {
    try {
      setIsDeleting(true);

      await taskService.deleteTask(task.id);

      toast.success("Task berhasil dihapus");
      onSuccess?.();
    } catch (error) {
      console.error(error);
      toast.error("Gagal menghapus task");
    } finally {
      setIsDeleting(false);
    }
  };

  return (
    <AlertDialog>
      <AlertDialogTrigger asChild>{trigger}</AlertDialogTrigger>

      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>Hapus Task?</AlertDialogTitle>

          <AlertDialogDescription>
            Task &ldquo;{task.title}&ldquo; akan dihapus. Task yang masih
            memiliki subtask tidak dapat dihapus.
          </AlertDialogDescription>
        </AlertDialogHeader>

        <AlertDialogFooter>
          <AlertDialogCancel>Batal</AlertDialogCancel>

          <AlertDialogAction asChild>
            <Button
              variant="destructive"
              disabled={isDeleting}
              onClick={handleDelete}>
              {isDeleting ? "Menghapus..." : "Hapus Task"}
            </Button>
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}
