import Link from "next/link";
import { ArrowRightIcon, HomeIcon } from "@radix-ui/react-icons";

import BrandFlower from "@/components/ui/BrandFlower";

export default function NotFound() {
  return (
    <section className="not-found-page" aria-labelledby="not-found-title">
      <div className="not-found-card brand-tiles">
        <div className="not-found-decoration" aria-hidden="true">
          <BrandFlower />
          <span>A little off the shelf</span>
          <BrandFlower />
        </div>

        <p className="brand-heading not-found-code">404</p>

        <h1 id="not-found-title" className="brand-heading not-found-title">
          This shelf is empty.
        </h1>

        <p className="not-found-description">
          We could not find the page you are looking for. It may have moved, or
          the link might be incorrect.
        </p>

        <div className="not-found-actions">
          <Link href="/" className="brand-button">
            <HomeIcon className="size-5" aria-hidden="true" />
            Back to home
          </Link>

          <Link
            href="/#products"
            className="brand-button brand-button-secondary tracking-wide group"
          >
            Explore groceries
            <ArrowRightIcon
              className="size-4 transition-transform group-hover:translate-x-1 motion-reduce:transform-none"
              aria-hidden="true"
            />
          </Link>
        </div>

        <p className="not-found-caption">
          Your everyday favourites are still on our shelves.
        </p>
      </div>
    </section>
  );
}
