import Link from "next/link";
import {
  MagnifyingGlassIcon,
  BackpackIcon,
  CaretUpIcon,
} from "@radix-ui/react-icons";

import { siteConfig } from "@/config/siteConfig";
import { MainNav } from "./MainNav";
import { AuthNav } from "./AuthNav";
import { MobileNav } from "./MobileNav";
import BrandFlower from "../ui/BrandFlower";
import { Icons } from "../ui/Icons";

export default function SiteHeader() {
  return (
    <header className="store-header">
      <div className="store-header-top">
        <div className="store-header-inner">
          <Link
            href="/"
            className="store-logo"
            aria-label={`${siteConfig.name} home`}
          >
            <span className="brand-heading store-logo-name uppercase">
              {siteConfig.name}
            </span>

            <span className="store-logo-caption">
              Grocery &amp;
              <br />
              good things
            </span>
          </Link>

          {/* we will connect search when we build the product listing page */}
          <div className="store-search">
            <MagnifyingGlassIcon
              className="h-5 w-5 shrink-0"
              aria-hidden="true"
            />

            <input
              type="search"
              aria-label="Product search — coming soon"
              placeholder="Product search coming soon"
              disabled
            />
          </div>

          <div className="store-header-actions">
            <AuthNav />

            {/* the cart page will be connected with the shopping flow */}
            <button
              type="button"
              disabled
              title="Cart page coming soon"
              className="flex min-h-11 items-center gap-2 border-l border-white/30 pl-4 text-sm opacity-60"
            >
              <Icons.cart className="h-6 w-6" aria-hidden="true" />
              <span className="hidden sm:inline">Cart</span>
            </button>
          </div>
        </div>
      </div>

      {/* this section is taking too much of space, i will see if I can move it somewhere else later */}
      <div className="store-header-bottom">
        <div className="store-header-bottom-inner">
          <BrandFlower />

          <MainNav items={siteConfig.mainNav} />

          <BrandFlower />
        </div>
      </div>

      <MobileNav items={siteConfig.mainNav} />
    </header>
  );
}
