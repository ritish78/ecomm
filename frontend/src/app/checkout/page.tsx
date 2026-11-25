import { Metadata } from "next";
import Link from "next/link";

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
        <Link href="/cart" className="text-sm underline underline-offset-4">
          Back to cart
        </Link>

        <h1 className="mt-3 font-display text-[clamp(38px,6vw,60px)] leading-tight font-[650] tracking-[-0.035em]">
          Checkout.
        </h1>
      </header>

      {/* TODO: Need to implement Checkout here */}
    </div>
  );
}
