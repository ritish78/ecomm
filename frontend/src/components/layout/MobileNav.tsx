"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { ChevronDownIcon, HamburgerMenuIcon } from "@radix-ui/react-icons";

import type { NavGroup } from "@/config/siteConfig";

type Props = {
  items: NavGroup[];
};

export function MobileNav({ items }: Props) {
  const pathname = usePathname();

  return (
    <details
      className="store-mobile-nav"
      onKeyDown={(e) => {
        if (e.key === "Escape") {
          e.currentTarget.open = false;
          e.currentTarget.querySelector("summary")?.focus();
        }
      }}
    >
      <summary>
        <span className="flex items-center gap-2">
          <HamburgerMenuIcon className="h-4 w-4" aria-hidden="true" />
          Browse groceries
        </span>

        <ChevronDownIcon className="h-4 w-4" aria-hidden="true" />
      </summary>

      <nav className="store-mobile-panel" aria-label="Mobile navigation">
        {items.map((group) => (
          <details key={group.title} name="mobile-navigation">
            <summary className="store-nav-trigger">
              {group.title}
              <ChevronDownIcon className="h-4 w-4" aria-hidden="true" />
            </summary>

            <div className="store-nav-panel">
              {group.items.map((item) => (
                <Link
                  key={item.href}
                  href={item.href}
                  className="store-nav-link"
                  aria-current={pathname === item.href ? "page" : undefined}
                  onClick={(e) => {
                    const menu =
                      e.currentTarget.closest<HTMLDetailsElement>(
                        ".store-mobile-nav"
                      );

                    if (menu) {
                      menu.open = false;
                    }
                  }}
                >
                  {item.title}
                </Link>
              ))}
            </div>
          </details>
        ))}
      </nav>
    </details>
  );
}
