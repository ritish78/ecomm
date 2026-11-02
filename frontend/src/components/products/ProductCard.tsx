"use client";

import { useState } from "react";
import { Icons } from "../ui/Icons";

export type ProductSummary = {
  id: string;
  name: string;
  slug: string;
  description: string | null;
  brand: {
    id: string;
    name: string;
  };
  category: {
    id: string;
    name: string;
    slug: string;
  };
  primaryImage: {
    imageUrl: string;
    altText: string | null;
  } | null;
  minPrice: string | null;
  maxPrice: string | null;
  variantCount: number;
};

type Props = {
  product: ProductSummary;
  currency: string;
};

export default function ProductCard({ product, currency }: Props) {
  const [failedImageUrl, setFailedImageUrl] = useState<string | null>(null);

  const imageUrl = product.primaryImage?.imageUrl;
  const showImage = imageUrl && failedImageUrl !== imageUrl;

  const price = product.minPrice === null ? null : Number(product.minPrice);

  const formattedPrice =
    price !== null && Number.isFinite(price)
      ? new Intl.NumberFormat("en-AU", {
          style: "currency",
          currency,
          currencyDisplay: "code",
        }).format(price)
      : null;

  const hasPriceRange =
    product.minPrice !== null &&
    product.maxPrice !== null &&
    Number(product.minPrice) !== Number(product.maxPrice);

  return (
    <article className="home-product-card">
      <div className="home-product-image">
        {showImage ? (
          //Product images come from the backend's configured image URLs.
          //eslint-disable-next-line @next/next/no-img-element
          <img
            src={imageUrl}
            alt={product.primaryImage?.altText || product.name}
            width={320}
            height={240}
            loading="lazy"
            onError={() => setFailedImageUrl(imageUrl)}
          />
        ) : (
          <div className="home-image-placeholder">
            <Icons.cart className="h-10 w-10" aria-hidden="true" />
            <span>Image coming soon</span>
          </div>
        )}
      </div>

      <div className="home-product-content">
        <p className="home-eyebrow">{product.brand.name}</p>

        <h3 className="home-product-name">{product.name}</h3>

        <p className="home-product-category">{product.category.name}</p>

        <div className="home-product-price">
          {formattedPrice ? (
            <>
              {hasPriceRange && <span>From </span>}
              <strong>{formattedPrice}</strong>
            </>
          ) : (
            <span>Currently unavailable</span>
          )}
        </div>

        {product.description && (
          <details className="home-product-description">
            <summary>About this product</summary>
            <p>{product.description}</p>
          </details>
        )}
      </div>
    </article>
  );
}
