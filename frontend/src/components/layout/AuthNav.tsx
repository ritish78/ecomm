"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useAuthStore } from "@/store/authStore";
import { Icons } from "../ui/Icons";
import Image from "next/image";
import Button from "../ui/Button";

export function AuthNav() {
  const pathname = usePathname();
  const router = useRouter();
  const { user, clearAuth } = useAuthStore();

  const getInitials = (firstName: string, lastName: string) =>
    `${firstName.charAt(0)}${lastName.charAt(0)}`.toUpperCase();

  const handleLogout = async () => {
    try {
      await fetch(
        `${process.env.NEXT_PUBLIC_BACKEND_API_URL}/api/v1/auth/logout`,
        {
          method: "POST",
          credentials: "include",
        }
      );
    } finally {
      clearAuth();
      router.push("/login");
    }
  };

  if (!user) {
    return (
      <Link
        href={`/login?redirect=${encodeURIComponent(pathname)}`}
        className="flex items-center gap-1.5 px-3 py-1.5 rounded-md text-sm font-medium bg-emerald-500 hover:bg-emerald-600 text-white transition-colors"
      >
        Login
      </Link>
    );
  }

  return (
    <div className="relative group">
      <button className="flex items-center gap-2 px-2 py-1.5 rounded-md hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors">
        <div className="h-8 w-8 rounded-full bg-emerald-500 text-white text-xs font-bold flex items-center justify-center overflow-hidden">
          {user.avatarUrl ? (
            <Image
              src={user.avatarUrl}
              alt={user.firstName}
              width={32}
              height={32}
              className="rounded-full object-cover"
            />
          ) : (
            getInitials(user.firstName, user.lastName)
          )}
        </div>
        <span className="text-sm font-medium text-slate-700 dark:text-slate-300 hidden md:block">
          {user.firstName}
        </span>
      </button>

      <div className="absolute right-0 top-full mt-1 w-52 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 shadow-lg py-1 z-50 opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all duration-150">
        <div className="px-4 py-2.5 border-b border-slate-100 dark:border-slate-800">
          <p className="text-sm font-medium text-slate-800 dark:text-slate-200">
            {user.firstName} {user.lastName}
          </p>
          <p className="text-xs text-slate-500 dark:text-slate-400 truncate mt-0.5">
            {user.email}
          </p>
        </div>

        <Link
          href="/orders"
          className="flex items-center gap-2.5 px-4 py-2.5 text-sm text-slate-600 dark:text-slate-400 hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors"
        >
          <Icons.cart className="h-4 w-4" />
          My Orders
        </Link>
        <Button
          onClick={handleLogout}
          variant="destructive"
          className="w-full flex items-center gap-2.5 px-4 py-2.5 text-sm justify-start"
        >
          <Icons.logout className="h-4 w-4" />
          Log out
        </Button>
      </div>
    </div>
  );
}
