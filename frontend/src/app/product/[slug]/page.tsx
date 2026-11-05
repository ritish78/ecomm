import { notFound } from "next/navigation";

import ProductDetails, {
  type ProductDetailsData,
} from "@/components/products/ProductDetails";

type Props = {
  params: Promise<{ slug: string }>;
};

export default async function ProductPage({ params }: Props) {
  const { slug } = await params;

  const baseUrl =
    process.env.BACKEND_API_URL ?? process.env.NEXT_PUBLIC_BACKEND_API_URL;

  const storeId = process.env.STOREFRONT_STORE_ID;

  if (!baseUrl || !storeId) {
    throw new Error("Product page storefront configuration is missing.");
  }

  const response = await fetch(
    `${baseUrl.replace(/\/+$/, "")}/api/v1/products/${encodeURIComponent(slug)}`,
    {
      cache: "no-store",
      signal: AbortSignal.timeout(10000),
    }
  );

  if (response.status === 404) {
    notFound();
  }

  if (!response.ok) {
    throw new Error(`Could not load product: ${response.status}`);
  }

  const data: { product: ProductDetailsData } = await response.json();
  const product = data.product;

  if (
    !product ||
    !Array.isArray(product.images) ||
    !Array.isArray(product.variants)
  ) {
    throw new Error("Unexpected product response.");
  }

  if (!product.isActive || product.storeId !== storeId) {
    notFound();
  }

  return (
    <div className="product-page">
      <ProductDetails
        key={product.id}
        product={product}
        currency={process.env.STOREFRONT_CURRENCY || "AUD"}
      />
    </div>
  );
}
