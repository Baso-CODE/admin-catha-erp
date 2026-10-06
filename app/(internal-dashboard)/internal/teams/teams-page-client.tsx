"use client";

import { TeamTable } from "./components/team-table";

interface TeamsPageClientProps {
  permissions: string[];
}

export function TeamsPageClient({ permissions }: TeamsPageClientProps) {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight">
          Team Management
        </h1>

        <p className="text-sm text-muted-foreground">
          Kelola struktur team dan anggota untuk mendukung akses data berbasis
          TEAM.
        </p>
      </div>

      <TeamTable permissions={permissions} />
    </div>
  );
}
