import type { Metadata } from "next";
import type { ReactNode } from "react";

export const metadata: Metadata = {
  title: "User Management",
};

export default function UsersLayout({ children }: { children: ReactNode }) {
  return children;
}
