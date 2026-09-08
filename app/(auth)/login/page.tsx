"use client";

import { authService } from "@/app/services/auth.service";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { toast } from "sonner";

export default function LoginPage() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      const response = await authService.login({ email, password });

      // Token sudah otomatis disimpan sebagai HTTP-Only Cookie oleh browser saat menerima respons API
      // Kita cukup mengambil data user dari respons
      const user = response.data.user;

      toast.success("Login Berhasil!", {
        description: `Selamat datang kembali, ${user.name || "User"}!`,
      });

      // Arahkan halaman berdasarkan role yang ada di objek user
      setTimeout(() => {
        if (user.role === "CLIENT") {
          router.push("/portal");
        } else {
          router.push("/internal");
        }
      }, 500);
    } catch (err: any) {
      toast.error("Gagal Masuk", {
        description: err.message || "Periksa kembali email dan password Anda.",
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex min-h-screen items-center justify-center bg-background px-4">
      <Card className="w-full max-w-md shadow-xl border border-border/40 bg-card rounded-2xl p-2">
        <CardHeader className="space-y-1 text-center">
          <CardTitle className="text-2xl font-bold tracking-tight">
            Catha Digital Agency
          </CardTitle>
          <CardDescription className="text-muted-foreground">
            Silakan masuk ke akun Anda untuk melanjutkan
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleLogin} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="email">Email</Label>
              <Input
                id="email"
                type="email"
                placeholder="nama@catha.co.id"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="password">Password</Label>
              <Input
                id="password"
                type="password"
                placeholder="••••••••"
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
              />
            </div>

            <Button
              type="submit"
              className="w-full font-medium"
              disabled={loading}>
              {loading ? "Memproses..." : "Masuk"}
            </Button>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}
