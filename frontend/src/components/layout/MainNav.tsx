"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { ChevronDownIcon } from "@radix-ui/react-icons";

import type { NavGroup } from "@/config/siteConfig";

type Props = {
  items: NavGroup[];
};

export function MainNav({ items }: Props) {
  const pathname = usePathname();

  return (
    <nav className="store-main-nav" aria-label="Main navigation">
      {items.map((group) => (
        <details
          key={group.title}
          name="desktop-navigation"
          className="store-nav-group"
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
                  const menu = e.currentTarget.closest("details");

                  if (menu) {
                    menu.open = false;
                  }
                }}
              >
                <span>{item.title}</span>

                {item.description && (
                  <span className="store-nav-description">
                    {item.description}
                  </span>
                )}
              </Link>
            ))}
          </div>
        </details>
      ))}
    </nav>
  );
}
