import { siteConfig } from "@/config/siteConfig";

import Link from "next/link";
import { MainNav } from "./MainNav";
import { AuthNav } from "./AuthNav";
import { MobileNav } from "./MobileNav";

export default function SiteHeader() {
  return (
    <header className="sticky top-0 z-50 w-full border-b border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900">
      <div className="max-w-7xl mx-auto px-4 flex h-16 items-center">
        <Link
          href="/"
          className="flex items-center gap-2 font-bold text-lg text-emerald-600 dark:text-emerald-400 shrink-0"
        >
          {siteConfig.name}
        </Link>

        <div className="hidden lg:flex ml-8">
          <MainNav items={siteConfig.mainNav} />
        </div>

        <div className="flex flex-1 items-center justify-end gap-2">
          <AuthNav />
          <div className="lg:hidden">
            <MobileNav items={siteConfig.mainNav} />
          </div>
        </div>
      </div>
    </header>
  );
}
