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
    <h1>
      Order confirmation page for {orderId}. Will implement order confirmation
      component.
    </h1>
  );
}
