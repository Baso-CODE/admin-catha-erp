"use client";

import { TaskAttachmentItem, taskService } from "@/app/services/task.service";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { FileText, Paperclip, Trash2, Upload } from "lucide-react";
import { ChangeEvent, useRef, useState } from "react";
import { toast } from "sonner";
import { hasPermission, TASK_PERMISSIONS } from "./task-permissions";

interface TaskAttachmentSectionProps {
  taskId: string;
  attachments: TaskAttachmentItem[];
  permissions: string[];
  onRefresh: () => void;
}

export function TaskAttachmentSection({
  taskId,
  attachments,
  permissions,
  onRefresh,
}: TaskAttachmentSectionProps) {
  const inputRef = useRef<HTMLInputElement | null>(null);

  const [isUploading, setIsUploading] = useState(false);
  const [deletingId, setDeletingId] = useState<string | null>(null);

  const canCreate = hasPermission(
    permissions,
    TASK_PERMISSIONS.ATTACHMENT_CREATE,
  );

  const canDelete = hasPermission(
    permissions,
    TASK_PERMISSIONS.ATTACHMENT_DELETE,
  );

  const handleFileChange = async (event: ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];

    if (!file || isUploading) return;

    const maxSize = 10 * 1024 * 1024;

    if (file.size > maxSize) {
      toast.error("Ukuran file maksimal 10 MB.");

      event.target.value = "";
      return;
    }

    try {
      setIsUploading(true);

      await taskService.uploadTaskAttachment(taskId, file);

      toast.success("Attachment berhasil diupload");

      onRefresh();
    } catch (error) {
      console.error("Task attachment upload failed:", error);

      toast.error("Gagal mengupload attachment", {
        description:
          error instanceof TypeError
            ? "Tidak dapat menjangkau API. Periksa koneksi dan konfigurasi server."
            : error instanceof Error
              ? error.message
              : "Terjadi kesalahan pada server.",
      });
    } finally {
      setIsUploading(false);

      if (inputRef.current) {
        inputRef.current.value = "";
      }
    }
  };

  const handleDelete = async (id: string) => {
    try {
      setDeletingId(id);

      await taskService.deleteTaskAttachment(id);

      toast.success("Attachment berhasil dihapus");

      onRefresh();
    } catch (error) {
      console.error(error);

      toast.error("Gagal menghapus attachment");
    } finally {
      setDeletingId(null);
    }
  };

  const formatFileSize = (bytes: number) => {
    if (bytes < 1024) {
      return `${bytes} B`;
    }

    if (bytes < 1024 * 1024) {
      return `${(bytes / 1024).toFixed(1)} KB`;
    }

    return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
  };

  return (
    <section className="space-y-3">
      <div className="flex items-center gap-2">
        <Paperclip className="size-4" />

        <h3 className="font-medium">Attachments</h3>

        <Badge variant="secondary">{attachments.length}</Badge>
      </div>

      {canCreate && (
        <>
          <input
            ref={inputRef}
            type="file"
            className="hidden"
            accept=".jpg,.jpeg,.png,.webp,.pdf,.doc,.docx,.xls,.xlsx"
            onChange={handleFileChange}
          />

          <Button
            type="button"
            variant="outline"
            size="sm"
            disabled={isUploading}
            onClick={() => inputRef.current?.click()}>
            <Upload className="mr-2 size-4" />

            {isUploading ? "Mengupload..." : "Upload File"}
          </Button>
          <p className="text-xs text-muted-foreground">
            JPG, PNG, WEBP, PDF, DOC, DOCX, XLS, dan XLSX. Maksimal 10 MB per
            file.
          </p>
        </>
      )}

      {!attachments.length ? (
        <p className="text-sm text-muted-foreground">Belum ada attachment.</p>
      ) : (
        <div className="space-y-2">
          {attachments.map((attachment) => (
            <div
              key={attachment.id}
              className="flex items-center gap-3 rounded-md border p-3">
              <FileText className="size-4 shrink-0" />

              <a
                href={attachment.fileUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="min-w-0 flex-1">
                <div className="truncate text-sm font-medium hover:underline">
                  {attachment.fileName}
                </div>

                <div className="text-xs text-muted-foreground">
                  {formatFileSize(attachment.fileSize)}
                </div>
              </a>

              {canDelete && (
                <Button
                  type="button"
                  variant="ghost"
                  size="icon"
                  disabled={deletingId === attachment.id}
                  onClick={() => handleDelete(attachment.id)}>
                  <Trash2 className="size-4" aria-label="Hapus attachment" />
                </Button>
              )}
            </div>
          ))}
        </div>
      )}
    </section>
  );
}
