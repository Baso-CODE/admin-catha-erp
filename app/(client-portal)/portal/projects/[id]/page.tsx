import { ClientProjectDetailPage } from "./project-detail-client";

interface PageProps {
  params: Promise<{
    id: string;
  }>;
}

export default async function PortalProjectDetailPage({ params }: PageProps) {
  const { id } = await params;

  return <ClientProjectDetailPage projectId={id} />;
}
