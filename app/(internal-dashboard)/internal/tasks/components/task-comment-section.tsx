"use client";

import { TaskCommentItem, taskService } from "@/app/services/task.service";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Check, MessageSquare, Pencil, Send, Trash2, X } from "lucide-react";
import { FormEvent, useState } from "react";
import { toast } from "sonner";
import { hasPermission, TASK_PERMISSIONS } from "./task-permissions";

interface TaskCommentSectionProps {
  taskId: string;
  comments: TaskCommentItem[];
  permissions: string[];
  onRefresh: () => void;
}

export function TaskCommentSection({
  taskId,
  comments,
  permissions,
  onRefresh,
}: TaskCommentSectionProps) {
  const [comment, setComment] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editComment, setEditComment] = useState("");
  const [isUpdating, setIsUpdating] = useState(false);

  const canCreate = hasPermission(permissions, TASK_PERMISSIONS.COMMENT_CREATE);

  const canUpdate = hasPermission(permissions, TASK_PERMISSIONS.COMMENT_UPDATE);

  const canDelete = hasPermission(permissions, TASK_PERMISSIONS.COMMENT_DELETE);

  const handleSubmit = async (event: FormEvent) => {
    event.preventDefault();

    if (!comment.trim()) return;

    try {
      setIsSubmitting(true);

      await taskService.createTaskComment(taskId, {
        comment: comment.trim(),
      });

      setComment("");
      toast.success("Komentar berhasil ditambahkan");
      onRefresh();
    } catch (error) {
      console.error(error);
      toast.error("Gagal menambahkan komentar");
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleStartEdit = (item: TaskCommentItem) => {
    setEditingId(item.id);
    setEditComment(item.comment);
  };

  const handleCancelEdit = () => {
    setEditingId(null);
    setEditComment("");
  };

  const handleUpdate = async (id: string) => {
    if (!editComment.trim()) return;

    try {
      setIsUpdating(true);

      await taskService.updateTaskComment(id, {
        comment: editComment.trim(),
      });

      toast.success("Komentar berhasil diperbarui");

      setEditingId(null);
      setEditComment("");

      onRefresh();
    } catch (error) {
      console.error(error);
      toast.error("Gagal memperbarui komentar");
    } finally {
      setIsUpdating(false);
    }
  };

  const handleDelete = async (id: string) => {
    try {
      setDeletingId(id);

      await taskService.deleteTaskComment(id);

      toast.success("Komentar berhasil dihapus");
      onRefresh();
    } catch (error) {
      console.error(error);
      toast.error("Gagal menghapus komentar");
    } finally {
      setDeletingId(null);
    }
  };

  return (
    <section className="space-y-3">
      <div className="flex items-center gap-2">
        <MessageSquare className="size-4" />

        <h3 className="font-medium">Comments</h3>

        <Badge variant="secondary">{comments.length}</Badge>
      </div>

      {canCreate && (
        <form onSubmit={handleSubmit} className="space-y-2">
          <Textarea
            value={comment}
            onChange={(e) => setComment(e.target.value)}
            placeholder="Tulis komentar..."
          />

          <div className="flex justify-end">
            <Button
              type="submit"
              size="sm"
              disabled={isSubmitting || !comment.trim()}>
              <Send className="mr-2 size-4" />

              {isSubmitting ? "Mengirim..." : "Kirim"}
            </Button>
          </div>
        </form>
      )}

      {!comments.length ? (
        <p className="text-sm text-muted-foreground">Belum ada komentar.</p>
      ) : (
        <div className="space-y-3">
          {comments.map((item) => {
            const isEditing = editingId === item.id;

            return (
              <div key={item.id} className="rounded-lg border p-3">
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <div className="text-sm font-medium">{item.user.name}</div>

                    <div className="text-xs text-muted-foreground">
                      {new Date(item.createdAt).toLocaleString("id-ID")}
                    </div>
                  </div>

                  {!isEditing && (
                    <div className="flex items-center gap-1">
                      {canUpdate && (
                        <Button
                          type="button"
                          variant="ghost"
                          size="icon"
                          onClick={() => handleStartEdit(item)}>
                          <Pencil className="size-4" />
                        </Button>
                      )}

                      {canDelete && (
                        <Button
                          type="button"
                          variant="ghost"
                          size="icon"
                          disabled={deletingId === item.id}
                          onClick={() => handleDelete(item.id)}>
                          <Trash2 className="size-4" />
                        </Button>
                      )}
                    </div>
                  )}
                </div>

                {isEditing ? (
                  <div className="mt-3 space-y-2">
                    <Textarea
                      value={editComment}
                      onChange={(e) => setEditComment(e.target.value)}
                    />

                    <div className="flex justify-end gap-2">
                      <Button
                        type="button"
                        variant="outline"
                        size="sm"
                        disabled={isUpdating}
                        onClick={handleCancelEdit}>
                        <X className="mr-2 size-4" />
                        Batal
                      </Button>

                      <Button
                        type="button"
                        size="sm"
                        disabled={isUpdating || !editComment.trim()}
                        onClick={() => handleUpdate(item.id)}>
                        <Check className="mr-2 size-4" />

                        {isUpdating ? "Menyimpan..." : "Simpan"}
                      </Button>
                    </div>
                  </div>
                ) : (
                  <p className="mt-2 whitespace-pre-wrap text-sm text-muted-foreground">
                    {item.comment}
                  </p>
                )}
              </div>
            );
          })}
        </div>
      )}
    </section>
  );
}
