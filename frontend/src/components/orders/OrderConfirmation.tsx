"use client";

import { apiFetch } from "@/lib/api";
import { useAuthStore } from "@/store/authStore";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import Button from "../ui/Button";
import Link from "next/link";

type Props = {
  orderId: string;
  currency: string;
};

type OrderResponse = Partial<OrderDetails> & {
  message?: string;
};

type OrderDetails = {
  order: {
    id: string;
    storeName: string;
    status: string;
    paymentStatus: string;
    subtotal: string;
    totalShippingFee: string;
    total: string;
    addressSnapshot: {
      recipientName: string;
      phoneNumber: string;
      addressLineOne: string;
      addressLineTwo: string | null;
      locality: string;
      district: string | null;
      wardNumber: number | null;
      region: string;
      postalCode: string | null;
      countryCode: string;
      landmark: string | null;
      deliveryInstruction: string | null;
    };
  };
  items: {
    id: string;
    productName: string;
    weight: string;
    unit: string;
    quantity: number;
    unitPrice: string;
    lineTotal: string;
  }[];
};

export default function OrderConfirmation(props: Props) {
  const isRestoring = useAuthStore((state) => state.isRestoring);
  const currentUserId = useAuthStore((state) => state.user?.id);

  if (isRestoring) {
    return (
      <p role="status" className="mx-auto max-w-4xl p-6">
        Checking your account
      </p>
    );
  }

  return (
    <ConfirmationComponent
      key={`${currentUserId ?? "guest"}-${props.orderId}`}
      {...props}
    />
  );
}

function ConfirmationComponent({ orderId, currency }: Props) {
  const router = useRouter();
  const [details, setDetails] = useState<OrderDetails | null>(null);
  const [error, setError] = useState("");
  const [attempt, setAttempt] = useState(0);

  useEffect(() => {
    const controller = new AbortController();

    async function loadOrder() {
      try {
        const response = await apiFetch(
          `/api/v1/orders/${encodeURIComponent(orderId)}`,
          { cache: "no-store", signal: controller.signal }
        );

        if (controller.signal.aborted) return;

        if (response.status === 401) {
          router.replace(
            `/login?redirect=${encodeURIComponent(`/orders/${orderId}`)}`
          );
        }

        const data: OrderResponse = await response.json();

        if (!response.ok) {
          throw new Error(data.message || "Could not load your order!");
        }

        const { order, items } = data;

        if (
          !order ||
          order.id !== orderId ||
          !order.addressSnapshot ||
          !Array.isArray(items)
        ) {
          throw new Error("Could not read your order details!");
        }

        if (!controller.signal.aborted) {
          setDetails({ order, items });
        }
      } catch (error) {
        if (!controller.signal.aborted) {
          setError(
            error instanceof Error ? error.message : "Could not load your order"
          );
        }
      }
    }

    void loadOrder();

    return () => controller.abort();
  }, [orderId, attempt, router]);

  if (error) {
    return (
      <section className="mx-auto max-w-4xl px-4 py-10">
        <p role="alert" className="mb-4 text-sm text-[#a32135]">
          {error}
        </p>
        <Button
          type="button"
          onClick={() => {
            setError("");
            setAttempt((previous) => previous + 1);
          }}
        >
          Reload order
        </Button>
      </section>
    );
  }

  if (!details) {
    return (
      <p role="status" className="mx-auto max-w-4xl p-6">
        Loading your order
      </p>
    );
  }

  const { order, items } = details;
  const address = order.addressSnapshot;
  const priceFormatter = new Intl.NumberFormat("en-AU", {
    style: "currency",
    currency,
    currencyDisplay: "code",
  });

  return (
    <div className="mx-auto max-w-4xl px-4 py-8 sm:px-6">
      <header className="border-b-4 border-double border-(--brand) pb-6">
        <h1 className="font-display text-[clamp(36px,6vw,56px)] leading-tight font-[650]">
          Order confirmation
        </h1>

        <p className="mt-2 text-sm">{order.storeName}</p>
        <p className="mt-1 text-xs text-(--brand-muted) wrap-anywhere">
          Order number: {order.id}
        </p>
      </header>

      <section className="mt-6 overflow-hidden rounded-[22px] border border-(--brand-border) bg-white">
        <div className="bg-(--brand-blue) px-5 py-4 sm:px-6">
          <h2 className="font-display text-2xl font-[650]">Your order</h2>
          <p className="mt-1 text-sm">
            Order status: <span className="capitalize">{order.status}</span>
            {" - "}
            Payment: <span className="capitalize">{order.paymentStatus}</span>
          </p>
        </div>

        <div className="p-5 sm:p-6">
          <ul className="divide-y divide-(--brand-border)">
            {items.map((item) => (
              <li
                key={item.id}
                className="flex justify-between gap-4 py-3 text-sm"
              >
                <div className="min-w-0 wrap-anywhere">
                  <strong>{item.productName}</strong>
                  <p className="mt-1 text-(--brand-muted)">
                    {Number(item.weight)} {item.unit} - {item.quantity} x{" "}
                    {priceFormatter.format(Number(item.unitPrice))}
                  </p>
                </div>

                <strong>{priceFormatter.format(Number(item.lineTotal))}</strong>
              </li>
            ))}
          </ul>

          <dl className="mt-4 grid gap-3 border-t border-(--brand-border) pt-4 text-sm">
            <div className="flex justify-between gap-3">
              <dt>Subtotal</dt>
              <dd>{priceFormatter.format(Number(order.subtotal))}</dd>
            </div>
            <div className="flex justify-between gap-3">
              <dt>Delivery</dt>
              <dd>{priceFormatter.format(Number(order.totalShippingFee))}</dd>
            </div>
            <div className="flex justify-between gap-3 text-lg font-bold">
              <dt>Total</dt>
              <dd>{priceFormatter.format(Number(order.total))}</dd>
            </div>
          </dl>
        </div>
      </section>

      <section className="mt-5 rounded-[22px] border border-(--brand-border) bg-white p-5 sm:p-6">
        <h2 className="font-display text-2xl font-[650]">Delivery address</h2>

        <address className="mt-3 text-sm leading-6 wrap-anywhere not-italic">
          <strong>{address.recipientName}</strong>
          <p>{address.addressLineOne}</p>
          {address.addressLineTwo && <p>{address.addressLineTwo}</p>}
          <p>
            {[
              address.locality,
              address.wardNumber && `Ward ${address.wardNumber}`,
              address.district,
              address.region,
              address.postalCode,
              address.countryCode,
            ]
              .filter(Boolean)
              .join(", ")}
          </p>
          <p>{address.phoneNumber}</p>
        </address>

        {address.landmark && (
          <p className="mt-3 text-sm">Landmark: {address.landmark}</p>
        )}
        {address.deliveryInstruction && (
          <p className="mt-2 text-sm wrap-anywhere">
            Delivery instructions: {address.deliveryInstruction}
          </p>
        )}
      </section>

      <Link
        href="/cart"
        className="mt-6 inline-block text-sm font-semibold underline underline-offset-4"
      >
        Return to cart
      </Link>
    </div>
  );
} 
