"use client";

import { useRef, useState } from "react";
import Image from "next/image";
import Link from "next/link";

import Button from "@/components/ui/Button";
import { Icons } from "../ui/Icons";

type ProductVariant = {
  id: string;
  weight: string;
  unit: "g" | "kg" | "ml" | "l" | "pc";
  price: string;
  stock: number;
  isAvailable: boolean;
  discontinuedAt: string | null;
};

export type ProductDetailsData = {
  id: string;
  storeId: string;
  name: string;
  slug: string;
  description: string | null;
  isActive: boolean;
  brand: {
    id: string;
    name: string;
  };
  category: {
    id: string;
    name: string;
    slug: string;
  };
  images: {
    id: string;
    imageUrl: string;
    altText: string | null;
    isPrimary: boolean;
    displayOrder: number;
  }[];
  variants: ProductVariant[];
};

type Props = {
  product: ProductDetailsData;
  currency: string;
};

function canPurchase(variant: ProductVariant) {
  return variant.isAvailable && variant.stock > 0;
}

export default function ProductDetails({ product, currency }: Props) {
  const initialImage =
    product.images.find((image) => image.isPrimary) ?? product.images[0];

  const initialVariant =
    product.variants.find(canPurchase) ?? product.variants[0];

  const [imageId, setImageId] = useState(initialImage?.id ?? "");
  const [variantId, setVariantId] = useState(initialVariant?.id ?? "");
  const [quantity, setQuantity] = useState("1");
  const [failedImages, setFailedImages] = useState<string[]>([]);

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState("");
  const [message, setMessage] = useState("");
  const [needsLogin, setNeedsLogin] = useState(false);

  const submittingRef = useRef(false);

  const selectedImage = product.images.find((image) => image.id === imageId);
  const selectedVariant = product.variants.find(
    (variant) => variant.id === variantId
  );

  const available =
    product.isActive &&
    selectedVariant !== undefined &&
    canPurchase(selectedVariant);

  const requestedQuantity = Number(quantity);

  const validQuantity =
    Number.isInteger(requestedQuantity) &&
    requestedQuantity >= 1 &&
    requestedQuantity <= (selectedVariant?.stock ?? 0);

  const priceFormatter = new Intl.NumberFormat("en-AU", {
    style: "currency",
    currency,
    currencyDisplay: "code",
  });

  function clearFeedback() {
    setError("");
    setMessage("");
    setNeedsLogin(false);
  }

  function selectVariant(id: string) {
    setVariantId(id);
    setQuantity("1");
    clearFeedback();
  }

  async function saveToCart() {
    if (submittingRef.current || !selectedVariant) return;

    clearFeedback();

    if (!available || !validQuantity) {
      setError("Please select an available pack and a valid quantity.");
      return;
    }

    const baseUrl = process.env.NEXT_PUBLIC_BACKEND_API_URL;

    if (!baseUrl) {
      setError("We couldn't connect to the store. Please try again later.");
      return;
    }

    submittingRef.current = true;
    setIsSubmitting(true);

    try {
      const response = await fetch(
        `${baseUrl.replace(/\/+$/, "")}/api/v1/cart/items`,
        {
          method: "PUT",
          credentials: "include",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            storeId: product.storeId,
            variantId: selectedVariant.id,
            quantity: requestedQuantity,
          }),
        }
      );

      if (response.status === 401) {
        setNeedsLogin(true);
        setError("Please log in to save items to your cart.");
        return;
      }

      const data: { message?: string } | null = await response
        .json()
        .catch(() => null);

      if (!response.ok) {
        setError(
          data?.message ?? "Could not save this item. Please try again."
        );
        return;
      }

      setMessage(
        `Saved to your cart: ${requestedQuantity} × ${Number(
          selectedVariant.weight
        )} ${selectedVariant.unit}.`
      );
    } catch {
      setError("Could not connect to the server. Please try again.");
    } finally {
      submittingRef.current = false;
      setIsSubmitting(false);
    }
  }

  return (
    <div className="product-detail-grid">
      <section className="product-gallery" aria-label="Product images">
        <div className="product-main-image">
          {selectedImage && !failedImages.includes(selectedImage.id) ? (
            <Image
              key={selectedImage.id}
              src={selectedImage.imageUrl}
              alt={selectedImage.altText || product.name}
              fill
              sizes="(max-width: 767px) 100vw, 50vw"
              className="object-contain p-8"
              onError={() => {
                setFailedImages((previous) => [...previous, selectedImage.id]);
              }}
            />
          ) : (
            <div className="home-image-placeholder">
              <Icons.cart className="h-12 w-12" aria-hidden="true" />
              <span>Image coming soon</span>
            </div>
          )}
        </div>

        {product.images.length > 1 && (
          <div className="product-thumbnails">
            {product.images.map((image, index) => (
              <button
                key={image.id}
                type="button"
                className="product-thumbnail"
                aria-label={`View image ${index + 1} of ${product.name}`}
                aria-pressed={image.id === imageId}
                onClick={() => setImageId(image.id)}
              >
                {failedImages.includes(image.id) ? (
                  <Icons.cart className="h-12 w-12" aria-hidden="true" />
                ) : (
                  <Image
                    src={image.imageUrl}
                    alt=""
                    fill
                    sizes="72px"
                    className="object-contain p-2"
                    onError={() => {
                      setFailedImages((previous) => [...previous, image.id]);
                    }}
                  />
                )}
              </button>
            ))}
          </div>
        )}
      </section>

      <section className="product-information" aria-labelledby="product-title">
        <p className="home-eyebrow">{product.brand.name}</p>

        <h1 id="product-title" className="brand-heading product-title">
          {product.name}
        </h1>

        <p className="product-category">{product.category.name}</p>

        <p className="product-detail-price" aria-live="polite">
          {selectedVariant
            ? priceFormatter.format(Number(selectedVariant.price))
            : "Currently unavailable"}
        </p>

        {product.variants.length > 0 && (
          <fieldset className="product-pack-fieldset" disabled={isSubmitting}>
            <legend>Choose your pack</legend>

            <div className="product-pack-options">
              {product.variants.map((variant) => (
                <label key={variant.id} className="product-pack-label">
                  <input
                    type="radio"
                    name="product-pack"
                    value={variant.id}
                    checked={variantId === variant.id}
                    onChange={() => selectVariant(variant.id)}
                  />

                  <span>
                    {Number(variant.weight)} {variant.unit}
                    {!canPurchase(variant) && <small>Unavailable</small>}
                  </span>
                </label>
              ))}
            </div>
          </fieldset>
        )}

        <p className="product-stock" aria-live="polite">
          {available
            ? `${selectedVariant.stock} in stock`
            : "This pack is currently unavailable."}
        </p>

        <div className="product-purchase-row">
          <div className="product-quantity">
            <label htmlFor="product-quantity">Quantity</label>

            <input
              id="product-quantity"
              type="number"
              min={1}
              max={selectedVariant?.stock ?? 1}
              step={1}
              value={quantity}
              disabled={!available || isSubmitting}
              aria-describedby="cart-quantity-hint"
              className="brand-input"
              onChange={(event) => {
                setQuantity(event.target.value);
                clearFeedback();
              }}
            />
          </div>

          <Button
            type="button"
            onClick={saveToCart}
            disabled={!available || !validQuantity}
            isLoading={isSubmitting}
            loadingText="Saving to cart"
          >
            Save to cart
            <Icons.cart className="h-5 w-5" aria-hidden="true" />
          </Button>
        </div>

        <p id="cart-quantity-hint" className="product-hint">
          Sets the total quantity of this pack in your cart. Items are not
          reserved until checkout.
        </p>

        {error && (
          <div className="product-feedback product-feedback-error" role="alert">
            <p>{error}</p>

            {needsLogin && (
              <Link href="/login" className="mt-2 inline-block underline">
                Log in
              </Link>
            )}
          </div>
        )}

        <p
          role="status"
          aria-live="polite"
          className={message ? "product-feedback" : "sr-only"}
        >
          {message}
        </p>

        <div className="product-about">
          <h2 className="brand-heading">About this product</h2>

          <p>
            {product.description || "More product information is coming soon."}
          </p>
        </div>
      </section>
    </div>
  );
}
