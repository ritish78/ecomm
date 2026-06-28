"use client";

import { useRestoreAuth } from "@/hooks/useRestoreAuth";
import { useAuthStore } from "@/store/authStore";
import { useRouter } from "next/navigation";
import { useEffect } from "react";

export default function AuthRestorer() {
  useRestoreAuth();

  const router = useRouter();

  const clearAuth = useAuthStore((state) => state.clearAuth);

  useEffect(() => {
    const handleLogout = () => {
      clearAuth();
      router.push("/login");
    };

    window.addEventListener("auth:logout", handleLogout);

    return () => window.removeEventListener("auth:logout", handleLogout);
  }, []);

  return null;
}
