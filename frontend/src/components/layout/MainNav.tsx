"use client";

import { useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import type { NavGroup } from "@/config/siteConfig";
import { cn } from "@/lib/utils";
import { Icons } from "../ui/Icons";

type Props = { items: NavGroup[] };

export function MainNav({ items }: Props) {
  const pathname = usePathname();
  const [openMenu, setOpenMenu] = useState<string | null>(null);

  return (
    <nav className="flex items-center gap-1">
      {items.map((group) => (
        <div
          key={group.title}
          className="relative"
          onMouseEnter={() => setOpenMenu(group.title)}
          onMouseLeave={() => setOpenMenu(null)}
        >
          <button
            className={cn(
              "flex items-center gap-1 px-3 py-2 rounded-md text-sm font-medium transition-colors",
              "text-slate-600 hover:text-slate-900 hover:bg-slate-100",
              "dark:text-slate-300 dark:hover:text-white dark:hover:bg-slate-800",
              openMenu === group.title && "bg-slate-100 dark:bg-slate-800"
            )}
          >
            {group.title}
            <Icons.downArrow
              className={cn(
                "h-3.5 w-3.5 transition-transform duration-200",
                openMenu === group.title && "rotate-180"
              )}
            />
          </button>

          {openMenu === group.title && (
            <div className="absolute top-full left-0 mt-1 w-56 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 shadow-lg py-1 z-50">
              {group.items.map((item) => (
                <Link
                  key={item.href}
                  href={item.href}
                  onClick={() => setOpenMenu(null)}
                  className={cn(
                    "flex flex-col px-4 py-2.5 hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors",
                    pathname === item.href &&
                      "bg-emerald-50 dark:bg-emerald-900/20"
                  )}
                >
                  <span
                    className={cn(
                      "text-sm font-medium",
                      pathname === item.href
                        ? "text-emerald-600 dark:text-emerald-400"
                        : "text-slate-800 dark:text-slate-200"
                    )}
                  >
                    {item.title}
                  </span>
                  {item.description && (
                    <span className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                      {item.description}
                    </span>
                  )}
                </Link>
              ))}
            </div>
          )}
        </div>
      ))}
    </nav>
  );
}
