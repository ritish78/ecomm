import CartDetails from "@/components/cart/CartDetails";
import { Metadata } from "next";

export const metadat: Metadata = {
  title: "Your Cart - Ecomm",
  description: "Your cart items",
};

export default function CartPage() {
  return (
    <div className="mx-auto max-w-7xl px-4 pt-6 pb-10 min-[601px]:px-6 min-[601px]:pt-9 min-[601px]:pb-16">
      <header className="border-b-4 border-double border-(--brand) pb-7">
        <p className="text-[10px] font-semibold tracking-[0.15em] uppercase">
          Good things, gathered together
        </p>

        <h1 className="my-3 font-display text-[clamp(38px,6vw,60px)] leading-[1.05] font-[650] tracking-[-0.035em]">
          Your cart.
        </h1>

        <p className="text-[13px] leading-[1.7] text-(--brand-muted)">
          Check your favourites before bringing them home.
        </p>
      </header>

      <CartDetails currency={process.env.STOREFRONT_CURRENCY || "AUD"} />
    </div>
  );
}
