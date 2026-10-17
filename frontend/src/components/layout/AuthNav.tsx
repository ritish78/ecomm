"use client";

import Link from "next/link";
import Image from "next/image";
import { usePathname, useRouter } from "next/navigation";
import { PersonIcon, ExitIcon, ReaderIcon } from "@radix-ui/react-icons";

import { useAuthStore } from "@/store/authStore";
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
        className="store-account-trigger"
      >
        <PersonIcon className="h-5 w-5" aria-hidden="true" />
        Account
      </Link>
    );
  }

  return (
    <details
      className="relative"
      onKeyDown={(e) => {
        if (e.key === "Escape") {
          e.currentTarget.open = false;
          e.currentTarget.querySelector("summary")?.focus();
        }
      }}
      onBlur={(e) => {
        if (!e.currentTarget.contains(e.relatedTarget)) {
          e.currentTarget.open = false;
        }
      }}
    >
      <summary
        className="store-account-trigger"
        aria-label={`Account for ${user.firstName}`}
      >
        <span className="flex h-8 w-8 items-center justify-center overflow-hidden rounded-full bg-[#d9edf5] text-xs font-bold text-[#701634]">
          {user.avatarUrl ? (
            <Image
              src={user.avatarUrl}
              alt=""
              width={32}
              height={32}
              className="h-full w-full object-cover"
            />
          ) : (
            getInitials(user.firstName, user.lastName)
          )}
        </span>

        <span className="hidden sm:inline">{user.firstName}</span>
      </summary>

      <div className="store-account-panel">
        <div className="mb-2 border-b border-[#dcc8cc] px-3 py-3">
          <p className="text-sm font-semibold">
            {user.firstName} {user.lastName}
          </p>

          <p className="mt-1 truncate text-xs text-[#795b65]">{user.email}</p>
        </div>

        <Link
          href="/orders"
          className="store-nav-link"
          onClick={(e) => {
            const menu = e.currentTarget.closest("details");

            if (menu) {
              menu.open = false;
            }
          }}
        >
          <span className="flex items-center gap-2">
            <ReaderIcon className="h-4 w-4" aria-hidden="true" />
            My orders
          </span>
        </Link>

        <Button
          type="button"
          variant="destructive"
          onClick={handleLogout}
          className="mt-1"
        >
          <ExitIcon className="h-4 w-4" aria-hidden="true" />
          Log out
        </Button>
      </div>
    </details>
  );
}
