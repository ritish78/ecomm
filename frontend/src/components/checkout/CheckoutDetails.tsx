"use client";

import { useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";

import AddressForm, { type DeliveryAddress } from "./AddressForm";
import Button from "@/components/ui/Button";
import { apiFetch } from "@/lib/api";
import { useAuthStore } from "@/store/authStore";

type Props = {
  storeId: string;
  currency: string;
};

type QuoteItem = {
  cartItemId: string;
  variantId: string;
  productName: string;
  quantity: number;
  unitPrice: string;
  additionalShippingFee: string;
  lineTotal: string;
};

type ShippingQuote = {
  storeId: string;
  items: QuoteItem[];
  subtotal: string;
  totalShippingFee: string;
  total: string;
};

export default function CheckoutDetails({ storeId, currency }: Props) {
  const isRestoring = useAuthStore((state) => state.isRestoring);
  const currentUserId = useAuthStore((state) => state.user?.id);

  if (isRestoring) {
    return (
      <p role="status" className="py-6">
        Getting your checkout ready
      </p>
    );
  }

  //if the signed in user changes, we do not keep the previous user's checkout
  return (
    <CheckoutContent
      key={`${currentUserId ?? "guest"}-${storeId}`}
      storeId={storeId}
      currency={currency}
      currentUserId={currentUserId}
    />
  );
}

function CheckoutContent({
  storeId,
  currency,
  currentUserId,
}: Props & { currentUserId?: string }) {
  const router = useRouter();
  const loginUrl = `/login?redirect=${encodeURIComponent(`/checkout/${storeId}`)}`;
  const storageKey = `pending-order:${currentUserId}:${storeId}`;

  const [quote, setQuote] = useState<ShippingQuote | null>(null);
  const [addresses, setAddresses] = useState<DeliveryAddress[]>([]);
  const [selectedAddressId, setSelectedAddressId] = useState("");
  const [showAddressForm, setShowAddressForm] = useState(false);

  const [loadError, setLoadError] = useState("");
  const [orderMessage, setOrderMessage] = useState("");
  const [pendingBody, setPendingBody] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [attempt, setAttempt] = useState(0);
  const submittingRef = useRef(false);

  const priceFormatter = new Intl.NumberFormat("en-AU", {
    style: "currency",
    currency,
    currencyDisplay: "code",
  });

  useEffect(() => {
    const controller = new AbortController();
    const options = { signal: controller.signal, cache: "no-store" } as const;

    async function loadCheckout() {
      if (!currentUserId) {
        router.replace(loginUrl);
        return;
      }

      try {
        //we check for an earlier submission before asking for a new cart quote
        const savedBody = sessionStorage.getItem(storageKey);

        if (savedBody) {
          return savedBody;
        }

        const quoteResponse = await apiFetch(
          `/api/v1/stores/${encodeURIComponent(storeId)}/shipping-quote`,
          options
        );

        if (controller.signal.aborted) return;

        if (quoteResponse.status === 401) {
          router.replace(loginUrl);
          return;
        }

        const quoteData = await quoteResponse.json();

        if (!quoteResponse.ok) {
          throw new Error(
            quoteData.message || "Could not load the shipping quote."
          );
        }

        if (
          quoteData.quote?.storeId !== storeId ||
          !Array.isArray(quoteData.quote.items) ||
          quoteData.quote.items.length === 0
        ) {
          throw new Error("Could not read the shipping quote.");
        }

        const addressResponse = await apiFetch("/api/v1/addresses", options);

        if (controller.signal.aborted) return;

        if (addressResponse.status === 401) {
          router.replace(loginUrl);
          return;
        }

        const addressData = await addressResponse.json();

        if (!addressResponse.ok || !Array.isArray(addressData.addresses)) {
          throw new Error(
            addressData.message || "Could not load your addresses."
          );
        }

        if (controller.signal.aborted) return;

        const savedAddresses: DeliveryAddress[] = addressData.addresses;
        const defaultAddress = savedAddresses.find(
          (address) => address.isDefault
        );

        setAddresses(savedAddresses);

        //if we refresh the quote, we keep the selected address if it still exists
        setSelectedAddressId((previous) =>
          savedAddresses.some((address) => address.id === previous)
            ? previous
            : (defaultAddress?.id ?? savedAddresses[0]?.id ?? "")
        );

        setShowAddressForm(savedAddresses.length === 0);
        setQuote(quoteData.quote);
      } catch (error) {
        if (controller.signal.aborted) return;

        setLoadError(
          error instanceof Error ? error.message : "Could not load checkout."
        );
      }
    }

    void loadCheckout().then((savedBody) => {
      if (savedBody && !controller.signal.aborted) {
        setPendingBody(savedBody);
      }
    });

    return () => controller.abort();
  }, [currentUserId, storeId, storageKey, loginUrl, router, attempt]);

  function reloadCheckout() {
    setLoadError("");
    setQuote(null);
    setAttempt((previous) => previous + 1);
  }

  function handleSavedAddress(address: DeliveryAddress) {
    setAddresses((previous) => [...previous, address]);
    setSelectedAddressId(address.id);
    setShowAddressForm(false);
  }

  async function placeOrder() {
    if (submittingRef.current || !currentUserId) return;

    let body = pendingBody;

    if (!body) {
      if (!quote || !selectedAddressId || showAddressForm) return;

      //we send the prices and quantities that the user reviewed
      body = JSON.stringify({
        storeId,
        addressId: selectedAddressId,
        requestId: crypto.randomUUID(),
        totalShippingFee: quote.totalShippingFee,
        total: quote.total,
        items: quote.items.map((item) => ({
          cartItemId: item.cartItemId,
          variantId: item.variantId,
          quantity: item.quantity,
          unitPrice: item.unitPrice,
          additionalShippingFee: item.additionalShippingFee,
        })),
      });
    }

    submittingRef.current = true;
    setIsSubmitting(true);
    setOrderMessage("");

    try {
      //we save the exact body before sending it so a retry uses the same request id
      try {
        sessionStorage.setItem(storageKey, body);
      } catch {
        setOrderMessage(
          "Could not save the order request in this tab. Please enable browser storage and try again."
        );
        return;
      }

      setPendingBody(body);

      const response = await apiFetch("/api/v1/orders", {
        method: "POST",
        body,
      });

      if (response.status === 401) {
        router.replace(loginUrl);
        return;
      }

      const data = await response.json().catch(() => null);

      if (response.ok && typeof data?.order?.id === "string") {
        sessionStorage.removeItem(storageKey);
        router.replace(`/orders/${encodeURIComponent(data.order.id)}`);
        return;
      }

      if ([400, 403, 404, 409, 422].includes(response.status)) {
        //the server rejected this order, so we ask the user to review checkout again
        sessionStorage.removeItem(storageKey);
        setPendingBody("");
        setOrderMessage(
          `${data?.message || "The order could not be placed."} Please review checkout before placing your order again.`
        );
        reloadCheckout();
        return;
      }

      //the server may have saved the order even if we could not read its response
      setOrderMessage(
        "We could not confirm your order. Please retry the same request below."
      );
    } catch {
      setOrderMessage(
        "We could not confirm your order. Please retry the same request below."
      );
    } finally {
      submittingRef.current = false;
      setIsSubmitting(false);
    }
  }

  if (pendingBody) {
    return (
      <section className="mt-6 rounded-[22px] border border-(--brand-border) bg-white p-6">
        <h2 className="font-display text-3xl font-[650]">
          {isSubmitting ? "Placing your order" : "Confirm your order status"}
        </h2>

        <p role="status" className="my-4 text-sm text-(--brand-muted)">
          {orderMessage ||
            (isSubmitting
              ? "Waiting for the store to confirm your order."
              : "You have a previous submission in this tab. Retry it to retrieve the result.")}
        </p>

        <Button type="button" disabled={isSubmitting} onClick={placeOrder}>
          {isSubmitting ? "Please wait" : "Retry order request"}
        </Button>
      </section>
    );
  }

  if (loadError) {
    return (
      <section className="mt-6 rounded-[22px] border border-(--brand-border) bg-white p-6">
        <p role="alert" className="mb-4 text-sm text-[#a32135]">
          {loadError}
        </p>
        <Button type="button" onClick={reloadCheckout}>
          Try again
        </Button>
      </section>
    );
  }

  if (!quote) {
    return (
      <p role="status" className="py-6">
        Loading checkout
      </p>
    );
  }

  return (
    <div className="mt-6 grid items-start gap-6 lg:grid-cols-[minmax(0,1fr)_minmax(320px,0.65fr)]">
      <section className="min-w-0 rounded-[22px] border border-(--brand-border) bg-white p-5 sm:p-6">
        <h2 className="font-display text-3xl font-[650]">Delivery address</h2>

        {addresses.length > 0 && (
          <fieldset className="mt-4 grid gap-3">
            <legend className="sr-only">Select a delivery address</legend>

            {addresses.map((address) => (
              <label
                key={address.id}
                className="flex cursor-pointer items-start gap-3 rounded-xl border border-(--brand-border) p-4 has-checked:border-(--brand) has-checked:bg-background"
              >
                <input
                  type="radio"
                  name="deliveryAddress"
                  checked={selectedAddressId === address.id}
                  onChange={() => setSelectedAddressId(address.id)}
                  className="mt-1 accent-(--brand)"
                />

                <span className="min-w-0 text-sm wrap-anywhere">
                  <strong>{address.recipientName}</strong>
                  {address.isDefault && " (default)"}

                  <span className="mt-1 block text-(--brand-muted)">
                    {[
                      address.addressLineOne,
                      address.addressLineTwo,
                      address.locality,
                      address.wardNumber && `Ward ${address.wardNumber}`,
                      address.district,
                      address.region,
                      address.postalCode,
                      address.countryCode,
                    ]
                      .filter(Boolean)
                      .join(", ")}
                  </span>
                </span>
              </label>
            ))}
          </fieldset>
        )}

        {showAddressForm ? (
          <>
            <AddressForm
              onSaved={handleSavedAddress}
              onLogin={() => router.replace(loginUrl)}
            />

            {addresses.length > 0 && (
              <button
                type="button"
                onClick={() => setShowAddressForm(false)}
                className="mt-4 text-sm font-semibold underline underline-offset-4"
              >
                Use a saved address
              </button>
            )}
          </>
        ) : (
          <button
            type="button"
            onClick={() => setShowAddressForm(true)}
            className="mt-4 text-sm font-semibold underline underline-offset-4"
          >
            Add a delivery address
          </button>
        )}
      </section>

      <aside className="min-w-0 overflow-hidden rounded-[22px] border border-(--brand-border) bg-white">
        <h2 className="border-b border-(--brand-border) bg-(--brand-blue) p-6 font-display text-3xl font-[650]">
          Order review
        </h2>

        <div className="p-5 sm:p-6">
          <ul className="divide-y divide-(--brand-border)">
            {quote.items.map((item) => (
              <li
                key={item.cartItemId}
                className="flex justify-between gap-4 py-3 text-sm"
              >
                <span className="min-w-0 wrap-anywhere">
                  <strong>{item.productName}</strong>
                  <span className="mt-1 block text-(--brand-muted)">
                    {item.quantity} x{" "}
                    {priceFormatter.format(Number(item.unitPrice))}
                  </span>
                </span>

                <strong>{priceFormatter.format(Number(item.lineTotal))}</strong>
              </li>
            ))}
          </ul>

          <dl className="mt-4 grid gap-3 border-t border-(--brand-border) pt-4 text-sm">
            <div className="flex justify-between gap-3">
              <dt>Subtotal</dt>
              <dd>{priceFormatter.format(Number(quote.subtotal))}</dd>
            </div>

            <div className="flex justify-between gap-3">
              <dt>Delivery</dt>
              <dd>{priceFormatter.format(Number(quote.totalShippingFee))}</dd>
            </div>

            <div className="flex justify-between gap-3 border-t border-(--brand-border) pt-4 text-lg font-bold">
              <dt>Total</dt>
              <dd>{priceFormatter.format(Number(quote.total))}</dd>
            </div>
          </dl>

          {orderMessage && (
            <p
              role="alert"
              className="mt-4 rounded-xl bg-[#fff0ed] p-3 text-sm text-[#a32135]"
            >
              {orderMessage}
            </p>
          )}

          <div className="mt-5">
            <Button
              type="button"
              disabled={isSubmitting || !selectedAddressId || showAddressForm}
              onClick={placeOrder}
            >
              Place order
            </Button>
          </div>
        </div>
      </aside>
    </div>
  );
}
