import { requireInternalUser } from "@/app/lib/auth/require-internal-user";
import { Metadata } from "next";
import { redirect } from "next/navigation";
import ContractRenewalsClient from "./contract-renewals-client";

export const metadata: Metadata = {
  title: "Contracts & Renwals",
};

export default async function ContractRenewalsPage() {
  const user = await requireInternalUser();
  const permissions = user.permissions ?? [];

  if (!permissions.includes("contract.read")) {
    redirect("/internal");
  }

  return <ContractRenewalsClient permissions={permissions} />;
}
