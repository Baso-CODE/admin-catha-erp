import { requireClientPortalUser } from "@/app/lib/auth/require-client-portal-user";
import { ClientPortalShell } from "./components/client-portal-shell";

interface PortalLayoutProps {
  children: React.ReactNode;
}

export default async function PortalLayout({ children }: PortalLayoutProps) {
  const { clientContext } = await requireClientPortalUser();

  return (
    <ClientPortalShell
      client={{
        companyName: clientContext.client.companyName,
        clientCode: clientContext.client.clientCode,
        contactName: clientContext.contact.name,
        contactEmail: clientContext.contact.email,
      }}>
      {children}
    </ClientPortalShell>
  );
}
