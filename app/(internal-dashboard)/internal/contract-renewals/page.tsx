import { requireInternalUser } from "@/app/lib/auth/require-internal-user";
import { redirect } from "next/navigation";
import ContractRenewalsClient from "./contract-renewals-client";

export default async function ContractRenewalsPage() {
  const user = await requireInternalUser();
  const permissions = user.permissions ?? [];

  if (!permissions.includes("contract.read")) {
    redirect("/internal");
  }

  return <ContractRenewalsClient permissions={permissions} />;
}
