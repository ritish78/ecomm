"use client";

import { apiFetch } from "@/lib/api";
import { useAuthStore } from "@/store/authStore";
import { CartDetailsData, CartItem } from "@/types/cart.types";
import { useRouter } from "next/navigation";
import { useCallback, useEffect, useRef, useState } from "react";
import Button from "../ui/Button";
import { Icons } from "../ui/Icons";
import Link from "next/link";
import CartItemCard from "./CartItemCard";

type Props = {
  currency: string;
};

type CartResponse = {
  cart?: CartDetailsData;
  message?: string;
};

export default function CartDetails({ currency }: Props) {
  const isRestoring = useAuthStore((state) => state.isRestoring);
  const currentUserId = useAuthStore((state) => state.user?.id);

  if (isRestoring) {
    return (
      <div className="mt-7 rounded-[22px] border border-dashed border-(--brand-border) px-6 py-14 text-center">
        <p className="mt-3 text-sm leading-[1.7] text-(--brand-muted)">
          Getting your cart ready!
        </p>
      </div>
    );
  }

  return <CartContent key={currentUserId ?? "guest"} currency={currency} />;
}

function CartContent({ currency }: Props) {
  const router = useRouter();

  const [cart, setCart] = useState<CartDetailsData | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [confirmClear, setConfirmClear] = useState(false);
  const [error, setError] = useState("");
  const [message, setMessage] = useState("");

  const submittingRef = useRef(false);

  const priceFormatter = new Intl.NumberFormat("en-AU", {
    style: "currency",
    currency,
    currencyDisplay: "code",
  });

  const loadCart = useCallback(
    (signal?: AbortSignal) => {
      return apiFetch("/api/v1/cart", { cache: "no-store", signal })
        .then(async (response) => {
          if (signal?.aborted) return false;

          if (response.status === 401) {
            setCart(null);
            router.replace("/login?redirect=%2Fcart");
            return false;
          }

          const data: CartResponse | null = await response
            .json()
            .catch(() => null);

          if (signal?.aborted) return false;

          if (!response.ok) {
            throw new Error(
              data?.message ?? "Could not load your cart. Please try again."
            );
          }

          if (!data?.cart || !Array.isArray(data.cart.stores)) {
            throw new Error("Could not read your cart. Please try again.");
          }

          setCart(data.cart);
          return true;
        })
        .catch((error: unknown) => {
          if (signal?.aborted) return false;

          //we do not show old totals if we could not retrieve the latest cart
          setCart(null);
          setError(
            error instanceof Error
              ? error.message
              : "Could not connect to the server. Please try again."
          );

          return false;
        })
        .finally(() => {
          if (!signal?.aborted) {
            setIsLoading(false);
          }
        });
    },
    [router]
  );

  useEffect(() => {
    const controller = new AbortController();

    void loadCart(controller.signal);

    return () => controller.abort();
  }, [loadCart]);

  async function changeCart(
    endpoint: string,
    options: RequestInit,
    successMessage: string
  ) {
    if (submittingRef.current) return;

    submittingRef.current = true;
    setIsSubmitting(true);
    setError("");
    setMessage("");
    setConfirmClear(false);

    try {
      const response = await apiFetch(endpoint, options);

      if (response.status === 401) {
        setCart(null);
        router.replace("/login?redirect=%2Fcart");
        return;
      }

      const data: { message?: string } | null = await response
        .json()
        .catch(() => null);

      if (!response.ok) {
        setError(
          data?.message ?? "Could not update your cart. Please try again."
        );

        //the stock or cart item could have changed since we loaded the page
        if (response.status === 409 || response.status === 404) {
          setIsLoading(true);
          await loadCart();
        }

        return;
      }

      //the backend calculates the latest totals and checks availability again
      setIsLoading(true);
      const loaded = await loadCart();

      if (loaded) {
        setMessage(successMessage);
      } else {
        setMessage("Your change was saved, but we couldn't reload your cart.");
      }
    } catch {
      //the request might have reached the server before the connection failed
      setCart(null);
      setError(
        "We couldn't confirm the change. Reload your cart to check before trying again."
      );
    } finally {
      submittingRef.current = false;
      setIsSubmitting(false);
    }
  }

  async function updateCartItem(item: CartItem, quantity: number) {
    await changeCart(
      "/api/v1/cart/items",
      {
        method: "PUT",
        body: JSON.stringify({
          storeId: item.storeId,
          variantId: item.variantId,
          quantity,
        }),
      },
      `Updated the quantity of ${item.product?.name ?? "this item"}.`
    );
  }

  async function removeCartItem(item: CartItem) {
    await changeCart(
      `/api/v1/cart/items/${encodeURIComponent(item.id)}`,
      { method: "DELETE" },
      `Removed ${item.product?.name ?? "the item"} from your cart.`
    );
  }

  async function clearCart() {
    await changeCart(
      "/api/v1/cart",
      { method: "DELETE" },
      "Your cart has been cleared."
    );
  }

  function retryLoadingCart() {
    setError("");
    setMessage("");
    setIsLoading(true);
    void loadCart();
  }

  return (
    <>
      {error && (
        <div
          role="alert"
          className="mt-4.5 rounded-xl border border-(--brand-border) bg-[#fff0ed] p-3.5 text-[13px] leading-[1.6] text-[#a32135] wrap-anywhere"
        >
          {error}
        </div>
      )}

      <p
        role="status"
        className={
          message
            ? "mt-4.5 rounded-xl border border-(--brand-border) bg-(--brand-blue) p-3.5 text-[13px] leading-[1.6] wrap-anywhere"
            : "sr-only"
        }
      >
        {message}
      </p>

      {isLoading ? (
        <div
          role="status"
          className="mt-7 rounded-[22px] border border-dashed border-(--brand-border) px-6 py-14 text-center"
        >
          <p className="text-sm leading-[1.7] text-(--brand-muted)">
            Loading your cart
          </p>
        </div>
      ) : !cart ? (
        <section className="mt-7 rounded-[22px] border border-dashed border-(--brand-border) px-6 py-14 text-center">
          <h2 className="mx-auto max-w-120 font-display text-[clamp(28px,4vw,38px)] leading-[1.05] font-[650] tracking-[-0.035em]">
            Can you please again!
          </h2>

          <p className="mt-3 text-sm leading-[1.7] text-(--brand-muted)">
            We could not display your cart.
          </p>

          <Button
            type="button"
            className="mt-6 w-auto!"
            disabled={isSubmitting}
            onClick={retryLoadingCart}
          >
            Reload cart
          </Button>
        </section>
      ) : cart.itemCount === 0 ? (
        <section className="mt-7 rounded-[22px] border border-dashed border-(--brand-border) px-6 py-14 text-center">
          <Icons.cart className="mx-auto size-12" aria-hidden="true" />

          <h2 className="mx-auto mt-4.5 max-w-120 font-display text-[clamp(28px,4vw,38px)] leading-[1.05] font-[650] tracking-[-0.035em]">
            Your cart is feeling a little empty.
          </h2>

          <p className="mt-3 text-sm leading-[1.7] text-(--brand-muted)">
            Find something delicious to bring home.
          </p>

          <Link
            href="/"
            className="mt-6 inline-flex min-h-12 items-center justify-center rounded-xl border border-(--brand) bg-(--brand) px-5 py-3 font-semibold text-background transition-colors hover:bg-(--brand-dark)"
          >
            Browse groceries
          </Link>
        </section>
      ) : (
        <div
          aria-busy={isSubmitting}
          className="mt-7 grid grid-cols-1 items-start gap-7 min-[901px]:grid-cols-[minmax(0,1fr)_320px]"
        >
          <div className="grid min-w-0 gap-6">
            {cart.stores.map((store) => (
              <section
                key={store.storeId}
                aria-labelledby={`store-${store.storeId}`}
                className="min-w-0 overflow-hidden rounded-[22px] border border-(--brand-border) bg-white"
              >
                <div className="flex items-center justify-between gap-5 border-b border-(--brand-border) bg-background px-4 py-4.5 min-[601px]:p-5.5">
                  <div className="min-w-0">
                    <p className="text-[10px] font-semibold tracking-[0.15em] uppercase">
                      From your local shelves
                    </p>

                    <h2
                      id={`store-${store.storeId}`}
                      className="mt-2 font-display text-[26px] leading-[1.05] font-[650] tracking-[-0.035em] wrap-anywhere"
                    >
                      {store.store?.name ?? "Unavailable store"}
                    </h2>
                  </div>

                  <span className="shrink-0 text-xs">
                    {store.items.length}{" "}
                    {store.items.length === 1 ? "item" : "items"}
                  </span>
                </div>

                {store.items.map((item) => (
                  <CartItemCard
                    key={`${item.id}-${item.quantity}`}
                    item={item}
                    currency={currency}
                    isSubmitting={isSubmitting}
                    onUpdate={updateCartItem}
                    onRemove={removeCartItem}
                  />
                ))}

                <div className="flex flex-wrap items-baseline justify-between gap-x-4 gap-y-1 px-4 py-4.5 text-[13px] min-[601px]:px-5.5">
                  <span>Available items subtotal</span>

                  <strong className="text-right wrap-anywhere">
                    {priceFormatter.format(Number(store.purchaseableTotal))}
                  </strong>
                </div>
              </section>
            ))}
          </div>

          <aside
            aria-labelledby="cart-summary-title"
            className="min-w-0 overflow-hidden rounded-[22px] border border-(--brand-border) bg-white"
          >
            <div className="border-b border-(--brand-border) bg-(--brand-blue) bg-[linear-gradient(to_right,#ffffff80_1px,transparent_1px),linear-gradient(to_bottom,#ffffff80_1px,transparent_1px)] bg-size-[56px_56px] p-6">
              <p className="text-[10px] font-semibold tracking-[0.15em] uppercase">
                A little closer to home
              </p>

              <h2
                id="cart-summary-title"
                className="mt-2.5 font-display text-[32px] leading-[1.05] font-[650] tracking-[-0.035em]"
              >
                Your basket
              </h2>
            </div>

            <div className="p-6">
              <dl>
                <div className="mb-3.5 flex items-baseline justify-between gap-4 text-[13px]">
                  <dt>Different items</dt>
                  <dd className="text-right">{cart.itemCount}</dd>
                </div>

                <div className="mb-3.5 flex items-baseline justify-between gap-4 text-[13px]">
                  <dt>Total quantity</dt>
                  <dd className="text-right">{cart.totalQuantity}</dd>
                </div>

                <div className="mt-5 mb-3.5 flex items-baseline justify-between gap-4 border-t border-(--brand-border) pt-5 text-lg font-[650]">
                  <dt>Subtotal</dt>
                  <dd className="min-w-0 text-right wrap-anywhere">
                    {priceFormatter.format(Number(cart.purchaseableSubtotal))}
                  </dd>
                </div>
              </dl>

              <p className="mt-3.5 text-xs leading-[1.7] text-(--brand-muted)">
                Subtotal includes available items only. Delivery charges are not
                included.
              </p>

              {!cart.readyForCheckOut && (
                <p className="mt-4.5 rounded-xl border border-(--brand-border) bg-[#fff0ed] p-3.5 text-[13px] leading-[1.6] text-[#a32135] wrap-anywhere">
                  Some items need your attention. Update their quantities or
                  remove unavailable items before checkout.
                </p>
              )}

              <p className="mt-3.5 text-xs leading-[1.7] text-(--brand-muted)">
                Items are not reserved while they are in your cart.
              </p>

              <Link
                href="/"
                className="mt-5.5 inline-flex min-h-12 w-full items-center justify-center rounded-xl border border-(--brand) bg-(--brand) px-5 py-3 text-sm font-semibold text-background transition-colors hover:bg-(--brand-dark)"
              >
                Continue shopping
              </Link>

              <p className="mt-3 text-center text-xs text-(--brand-muted)">
                Checkout is coming next.
              </p>

              {confirmClear ? (
                <div className="mt-5 grid gap-2.5 border-t border-(--brand-border) pt-5 text-[13px] leading-[1.6]">
                  <p>Remove all items from your cart?</p>

                  <Button
                    type="button"
                    variant="destructive"
                    disabled={isSubmitting}
                    onClick={() => void clearCart()}
                  >
                    Yes, clear cart
                  </Button>

                  <Button
                    type="button"
                    variant="secondary"
                    disabled={isSubmitting}
                    onClick={() => setConfirmClear(false)}
                  >
                    Keep my items
                  </Button>
                </div>
              ) : (
                <button
                  type="button"
                  className="mx-auto mt-3 block min-h-11 p-2 text-xs font-semibold text-(--brand) underline underline-offset-4 disabled:cursor-not-allowed disabled:opacity-50"
                  disabled={isSubmitting}
                  onClick={() => setConfirmClear(true)}
                >
                  Clear cart
                </button>
              )}
            </div>
          </aside>
        </div>
      )}
    </>
  );
}
