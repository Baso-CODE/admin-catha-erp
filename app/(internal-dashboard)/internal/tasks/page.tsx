import { Metadata } from "next";
import { redirect } from "next/navigation";

import { getCurrentUser } from "@/app/lib/auth/get-current-user";
import { TasksClient } from "./tasks-client";

export const metadata: Metadata = {
  title: "Task Management",
};

export default async function TasksPage() {
  const user = await getCurrentUser();

  if (!user) {
    redirect("/login");
  }

  return <TasksClient permissions={user.permissions} />;
}
