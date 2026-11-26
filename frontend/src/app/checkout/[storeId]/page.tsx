import CheckoutDetails from "@/components/checkout/CheckoutDetails";
import { Metadata } from "next";

export const metadata: Metadata = {
  title: "Checkout - Ecomm",
  description: "Your checkout page in Ecomm",
};

type Props = {
  params: Promise<{ storeId: string }>;
};

export default async function CheckoutPage({ params }: Props) {
  const { storeId } = await params;

  return (
    <div className="mx-auto max-w-7xl px-4 pt-6 pb-12 sm:px-6 sm:pt-9">
      <header className="border-b-4 border-double border-(--brand) pb-6">
        <h1 className="mt-3 font-display text-[clamp(38px,6vw,60px)] leading-tight font-[650] tracking-[-0.035em]">
          Checkout.
        </h1>
      </header>

      <CheckoutDetails
        storeId={storeId}
        currency={process.env.STORE_CURRENCY || "AUD"}
      />
    </div>
  );
}
