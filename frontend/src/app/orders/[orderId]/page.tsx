import OrderConfirmation from "@/components/orders/OrderConfirmation";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Order confirmation - Ecomm",
};

type Props = {
  params: Promise<{ orderId: string }>;
};

export default async function OrderPage({ params }: Props) {
  const { orderId } = await params;

  return (
    <OrderConfirmation
      orderId={orderId}
      currency={process.env.STOREFRONT_CURRENCY || "AUD"}
    />
  );
}
