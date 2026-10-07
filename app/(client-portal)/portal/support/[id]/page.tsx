import { ClientSupportDetailPage } from "./support-detail-client";

interface PageProps {
  params: Promise<{
    id: string;
  }>;
}

export default async function PortalSupportDetailPage({ params }: PageProps) {
  const { id } = await params;

  return <ClientSupportDetailPage ticketId={id} />;
}
