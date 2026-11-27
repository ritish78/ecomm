import { Metadata } from "next";

export const metadata: Metadata = {
  title: "My Orders - Ecomm",
};

type Props = {
  searchParams: Promise<{ page?: string | string[] }>;
};

export default async function MyOrdersPage({ searchParams }: Props) {
  const { page } = await searchParams;

  const currentPage = typeof page === "string" ? Number(page) : 1;

  return (
    <div className="mx-auto max-w-4xl px-4 py-8 sm:px-6">
      <header className="border-b-4 border-double border-(--brand) pb-6">
        <h1 className="font-display text-[clamp(36px,6vw,56px)] leading-tight font-[650]">
          My orders
        </h1>
      </header>
      {/* Need to implement Order History component */}
    </div>
  );
}
