"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/contexts/AuthContext";
import Sidebar from "@/components/Sidebar";

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const { user, loading } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (!loading && !user) {
      router.replace("/login");
    }
  }, [user, loading, router]);

  if (loading || !user) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-paper">
        <p className="font-sans text-sm text-muted">Chargement…</p>
      </div>
    );
  }

  return (
    <div className="flex min-h-screen bg-paper">
      <Sidebar user={user} />
      <main className="flex-1 px-10 py-10 lg:px-14">{children}</main>
    </div>
  );
}
