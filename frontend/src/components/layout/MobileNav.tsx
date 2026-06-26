"use client";

import { useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import type { NavGroup } from "@/config/siteConfig";
import { cn } from "@/lib/utils";
import { Icons } from "../ui/Icons";

type Props = { items: NavGroup[] };

export function MobileNav({ items }: Props) {
  const [isOpen, setIsOpen] = useState(false);
  const [openGroup, setOpenGroup] = useState<string | null>(null);
  const pathname = usePathname();

  return (
    <>
      <button
        onClick={() => setIsOpen(true)}
        className="p-2 rounded-md text-slate-600 hover:bg-slate-100 dark:text-slate-300 dark:hover:bg-slate-800"
        aria-label="Open menu"
      >
        <Icons.menu className="h-5 w-5" />
      </button>

      {/* Overlay */}
      {isOpen && (
        <div
          className="fixed inset-0 z-50 bg-black/40 backdrop-blur-sm"
          onClick={() => setIsOpen(false)}
        />
      )}

      {/* Drawer */}
      <div
        className={cn(
          "fixed top-0 right-0 z-50 h-full w-72 bg-white dark:bg-slate-900 shadow-xl",
          "transform transition-transform duration-300 ease-in-out",
          isOpen ? "translate-x-0" : "translate-x-full"
        )}
      >
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b border-slate-200 dark:border-slate-800">
          <span className="font-bold text-emerald-600 dark:text-emerald-400">
            🍃 FreshBite
          </span>
          <button
            onClick={() => setIsOpen(false)}
            className="p-1.5 rounded-md hover:bg-slate-100 dark:hover:bg-slate-800"
            aria-label="Close menu"
          >
            x
          </button>
        </div>

        {/* Nav items */}
        <nav className="p-3 overflow-y-auto h-[calc(100%-64px)]">
          {items.map((group) => (
            <div key={group.title} className="mb-1">
              <button
                onClick={() =>
                  setOpenGroup(openGroup === group.title ? null : group.title)
                }
                className="w-full flex items-center justify-between px-3 py-2.5 rounded-md text-sm font-medium text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800"
              >
                {group.title}
                <Icons.downArrow
                  className={cn(
                    "h-4 w-4 transition-transform duration-200",
                    openGroup === group.title && "rotate-180"
                  )}
                />
              </button>

              {openGroup === group.title && (
                <div className="ml-3 mt-1 border-l-2 border-emerald-200 dark:border-emerald-800 pl-3 space-y-0.5">
                  {group.items.map((item) => (
                    <Link
                      key={item.href}
                      href={item.href}
                      onClick={() => setIsOpen(false)}
                      className={cn(
                        "block px-3 py-2 rounded-md text-sm transition-colors",
                        pathname === item.href
                          ? "text-emerald-600 dark:text-emerald-400 font-medium bg-emerald-50 dark:bg-emerald-900/20"
                          : "text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800"
                      )}
                    >
                      {item.title}
                    </Link>
                  ))}
                </div>
              )}
            </div>
          ))}
        </nav>
      </div>
    </>
  );
}
