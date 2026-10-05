export const TASK_PERMISSIONS = {
  READ: "task.read",
  CREATE: "task.create",
  UPDATE: "task.update",
  DELETE: "task.delete",
  ASSIGN: "task.assign",
  MANAGE: "task.manage",

  CHECKLIST_CREATE: "task.checklist.create",
  CHECKLIST_UPDATE: "task.checklist.update",
  CHECKLIST_DELETE: "task.checklist.delete",

  COMMENT_CREATE: "task.comment.create",
  COMMENT_UPDATE: "task.comment.update",
  COMMENT_DELETE: "task.comment.delete",

  ATTACHMENT_CREATE: "task.attachment.create",
  ATTACHMENT_DELETE: "task.attachment.delete",
} as const;

export type TaskPermission =
  (typeof TASK_PERMISSIONS)[keyof typeof TASK_PERMISSIONS];

export function hasPermission(
  permissions: string[],
  permission: TaskPermission,
) {
  return permissions.includes(permission);
}
