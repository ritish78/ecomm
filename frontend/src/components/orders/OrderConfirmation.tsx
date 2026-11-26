"use client";

import { apiFetch } from "@/lib/api";
import { useAuthStore } from "@/store/authStore";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";

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

  //need to add ConfirmationComponent after we create that component
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
}
