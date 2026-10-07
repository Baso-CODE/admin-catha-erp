"use client";

import { useCallback, useEffect, useState } from "react";
import { toast } from "sonner";

import {
  ClientProfile,
  clientPortalService,
} from "@/app/services/client-portal.service";
import { AccountCard } from "./components/account-card";
import { ChangePasswordForm } from "./components/change-password-form";
import { CompanyCard } from "./components/company-card";
import { ContactPersonCard } from "./components/contact-person-card";

export function ClientProfilePage() {
  const [profile, setProfile] = useState<ClientProfile | null>(null);

  const [isLoading, setIsLoading] = useState(true);

  const loadProfile = useCallback(async () => {
    try {
      setIsLoading(true);

      const response = await clientPortalService.getProfile();

      setProfile(response.data);
    } catch (error) {
      toast.error("Gagal mengambil profile.", {
        description:
          error instanceof Error
            ? error.message
            : "Terjadi kesalahan pada server.",
      });
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    void loadProfile();
  }, [loadProfile]);

  if (isLoading) {
    return (
      <div className="p-6 text-sm text-muted-foreground">Memuat profile...</div>
    );
  }

  if (!profile) {
    return (
      <div className="p-6 text-sm text-muted-foreground">
        Profile tidak tersedia.
      </div>
    );
  }

  return (
    <div className="space-y-6 p-6">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight">Profile</h1>

        <p className="text-sm text-muted-foreground">
          Informasi akun, contact person, perusahaan, dan keamanan akun Anda.
        </p>
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        <AccountCard profile={profile} />

        <ContactPersonCard profile={profile} />
      </div>

      <CompanyCard profile={profile} />

      <ChangePasswordForm />
    </div>
  );
}
