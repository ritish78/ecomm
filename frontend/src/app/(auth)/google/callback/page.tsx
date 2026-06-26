"use client";

import { useEffect } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { useAuthStore } from "@/store/authStore";

export default function GoogleCallbackPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const setAuth = useAuthStore((state) => state.setAuth);

  useEffect(() => {
    const code = searchParams.get("code");
    const error = searchParams.get("error");

    if (error || !code) {
      router.replace("/login?error=google_cancelled");
      return;
    }

    const exchange = async () => {
      try {
        const res = await fetch(
          `${process.env.NEXT_PUBLIC_BACKEND_API_URL}/api/v1/auth/google`,
          {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            credentials: "include",
            body: JSON.stringify({ code }),
          }
        );

        if (!res.ok) {
          const data = await res.json();
          throw new Error(data.message ?? "Google login failed");
        }

        const data = await res.json();
        setAuth(data.user, "");
        router.replace("/");
      } catch {
        router.replace("/login?error=google_failed");
      }
    };

    exchange();
  }, []);

  return (
    <div className="min-h-screen flex items-center justify-center">
      <div className="text-center space-y-3">
        <div className="h-8 w-8 border-2 border-emerald-500 border-t-transparent rounded-full animate-spin mx-auto" />
        <p className="text-sm text-slate-500">Logging in!</p>
      </div>
    </div>
  );
}
