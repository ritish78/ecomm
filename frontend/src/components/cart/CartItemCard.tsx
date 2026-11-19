"use client";

import { CartItem } from "@/types/cart.types";
import { useState } from "react";
import { Icons } from "../ui/Icons";
import Link from "next/dist/client/link";
import Image from "next/image";
import Button from "../ui/Button";

type Props = {
  item: CartItem;
  currency: string;
  isSubmitting: boolean;
  onUpdate: (item: CartItem, quantity: number) => Promise<void>;
  onRemove: (item: CartItem) => Promise<void>;
};

const issueMessages: Record<string, string> = {
  store_missing: "This store is no longer available.",
  store_inactive: "This store is currently not accepting orders.",
  product_missing: "This product is no longer available.",
  product_inactive: "This product is currently unavailable.",
  variant_missing: "This pack is no longer available.",
  variant_unavailable: "This pack is currently unavailable.",
  out_of_stock: "This pack is out of stock.",
  not_sold_by_store: "This product is no longer sold by this store.",
};

export default function CartItemCard({
  item,
  currency,
  isSubmitting,
  onUpdate,
  onRemove,
}: Props) {
  const [quantity, setQuantity] = useState(String(item.quantity));
  const [failedImageUrl, setFailedImageUrl] = useState("");

  const productName = item.product?.name ?? "Unavailable Product"; //"Could not fetch product name" //lets use "Unavailable Product" instead
  const imageUrl = item.primaryImage?.imageUrl; //imageUrl already has default image fallback
  const requestedQuantity = Number(quantity);

  //if the stock has decreased after the user has added the item to the cart
  //they can still select a quantity lower or equal to the stock count
  const canUpdate =
    item.variant !== null &&
    item.variant.stock > 0 &&
    item.issues.every((issue) => issue === "insufficient_stock");

  const validQuantity =
    Number.isInteger(requestedQuantity) &&
    requestedQuantity >= 1 &&
    requestedQuantity <= (item.variant?.stock ?? 0);

  const priceFormatter = new Intl.NumberFormat("en-AU", {
    style: "currency",
    currency,
    currencyDisplay: "code",
  });

  return (
    <article className="grid grid-cols-[112px_minmax(0,1fr)] gap-4.5 border-b border-(--brand-border) p-5.5 max-[600px]:grid-cols-[80px_minmax(0,1fr)] max-[600px]:gap-3.5 max-[600px]:px-4 max-[600px]:py-5">
      <div className="relative flex size-28 items-center justify-center overflow-hidden rounded-2xl border border-(--brand-border) bg-background text-(--brand-muted) max-[600px]:size-20 max-[600px]:rounded-xl">
        {imageUrl && failedImageUrl !== imageUrl ? (
          <Image
            src={imageUrl}
            alt={item.primaryImage?.altText || productName}
            fill
            sizes="(max-width: 600px) 80px, 112px"
            className="object-contain p-3"
            onError={() => setFailedImageUrl(imageUrl)}
          />
        ) : (
          <Icons.cart className="size-8" aria-hidden="true" />
        )}
      </div>

      <div className="min-w-0">
        <h3 className="mb-1.5 text-base leading-normal font-[650] wrap-anywhere max-[600px]:text-sm">
          {item.product?.isActive ? (
            <Link
              href={`/product/${encodeURIComponent(item.product.slug)}`}
              className="underline-offset-4 hover:underline"
            >
              {productName}
            </Link>
          ) : (
            productName
          )}
        </h3>

        <p className="text-[13px] leading-[1.7] text-(--brand-muted)">
          {item.variant
            ? `${Number(item.variant.weight)} ${item.variant.unit}`
            : "Pack unavailable"}
        </p>

        <p className="mt-2 text-[13px]">
          {item.unitPrice !== null
            ? `${priceFormatter.format(Number(item.unitPrice))} each`
            : "Price unavailable"}
        </p>

        {item.issues.length > 0 && (
          <ul className="mt-3 grid gap-1 text-xs leading-[1.6] text-[#a32135] wrap-anywhere">
            {item.issues.map((issue) => (
              <li key={issue}>
                {issue === "insufficient_stock"
                  ? `Only ${item.variant?.stock ?? 0} available. Please reduce your quantity.`
                  : (issueMessages[issue] ??
                    "This item is currently unavailable.")}
              </li>
            ))}
          </ul>
        )}

        <form
          className="mt-4 flex flex-wrap items-end gap-2.5"
          onSubmit={(event) => {
            event.preventDefault();

            if (!canUpdate || !validQuantity || isSubmitting) return;

            void onUpdate(item, requestedQuantity);
          }}
        >
          <div className="w-20">
            <label
              htmlFor={`quantity-${item.id}`}
              className="mb-1.5 block text-xs font-semibold"
            >
              Quantity
            </label>

            <input
              id={`quantity-${item.id}`}
              type="number"
              min={1}
              max={item.variant?.stock ?? 1}
              step={1}
              className="brand-input min-h-12! w-full px-2.5!"
              value={quantity}
              disabled={!canUpdate || isSubmitting}
              onChange={(event) => setQuantity(event.target.value)}
            />
          </div>

          <Button
            type="submit"
            variant="secondary"
            className="w-auto! px-3.5!"
            disabled={
              isSubmitting ||
              !canUpdate ||
              !validQuantity ||
              requestedQuantity === item.quantity
            }
          >
            Update
          </Button>

          <button
            type="button"
            className="min-h-11 p-2 text-xs font-semibold text-(--brand) underline underline-offset-4 disabled:cursor-not-allowed disabled:opacity-50"
            disabled={isSubmitting}
            aria-label={`Remove ${productName} from your cart`}
            onClick={() => void onRemove(item)}
          >
            Remove
          </button>
        </form>
      </div>

      <div className="col-start-2 flex flex-wrap items-baseline justify-between gap-x-3.5 gap-y-1.5 wrap-anywhere max-[600px]:col-span-full max-[600px]:justify-end">
        <strong className="text-base">
          {item.lineTotal !== null
            ? priceFormatter.format(Number(item.lineTotal))
            : "—"}
        </strong>

        {!item.purchaseable && (
          <span className="text-[11px] leading-[1.7] text-(--brand-muted)">
            Not included in subtotal
          </span>
        )}
      </div>
    </article>
  );
}
