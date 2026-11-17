"use client";

import Link from "next/link";

type Props = {
  error: Error & { digest?: string };
  reset: () => void;
};

export default function ProductError({ reset }: Props) {
  return (
    <section className="not-found-page" aria-labelledby="product-error-title">
      <div className="not-found-card brand-tiles">
        <h1 id="product-error-title" className="brand-heading not-found-title">
          We could not load this product.
        </h1>

        <p className="not-found-description">Please try again in a moment!</p>

        <div className="not-found-actions">
          <button type="button" onClick={reset} className="brand-button">
            Try again
          </button>

          <Link href="/" className="brand-button brand-button-secondary">
            Back to home
          </Link>
        </div>
      </div>
    </section>
  );
}
