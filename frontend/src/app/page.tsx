import Link from "next/link";
import {
  ArrowLeftIcon,
  ArrowRightIcon,
  MagnifyingGlassIcon,
} from "@radix-ui/react-icons";

import BrandFlower from "@/components/ui/BrandFlower";
import ProductCard, {
  type ProductSummary,
} from "@/components/products/ProductCard";

type Props = {
  searchParams: Promise<{
    keyword?: string | string[];
    page?: string | string[];
  }>;
};

type ProductResponse = {
  products: {
    totalProducts: number;
    page: number;
    limit: number;
    totalPages: number;
    data: ProductSummary[];
  };
};

const quickSearches = [
  { label: "Rice", keyword: "rice" },
  { label: "Dal", keyword: "dal" },
  { label: "Masala", keyword: "masala" },
  { label: "Noodles", keyword: "noodles" },
  { label: "Ghee", keyword: "ghee" },
  { label: "Chiura", keyword: "chiura" },
];

function getProductsHref(keyword: string, page = 1) {
  const params = new URLSearchParams();

  if (keyword) params.set("keyword", keyword);
  if (page > 1) params.set("page", String(page));

  const query = params.toString();

  return query ? `/?${query}#products` : "/#products";
}

async function getHomeProducts(keyword: string, page: number) {
  const baseUrl =
    process.env.BACKEND_API_URL ?? process.env.NEXT_PUBLIC_BACKEND_API_URL;

  const storeId = process.env.STOREFRONT_STORE_ID;

  //Never fall back to showing products from every store.
  if (!baseUrl || !storeId) {
    console.error("Homepage backend URL or storefront store ID is missing.");
    return null;
  }

  try {
    const url = new URL(`${baseUrl.replace(/\/+$/, "")}/api/v1/products`);

    url.searchParams.set("storeId", storeId);
    url.searchParams.set("page", String(page));
    url.searchParams.set("limit", "8");
    url.searchParams.set("sort", keyword ? "relevant" : "newest");

    if (keyword) {
      url.searchParams.set("keyword", keyword);
    }

    const response = await fetch(url, {
      cache: "no-store",
      signal: AbortSignal.timeout(10000),
    });

    if (!response.ok) {
      throw new Error(`Product request failed: ${response.status}`);
    }

    const data: ProductResponse = await response.json();

    if (!data.products || !Array.isArray(data.products.data)) {
      throw new Error("Unexpected product response.");
    }

    return data.products;
  } catch (error) {
    console.error("Could not load homepage products:", error);
    return null;
  }
}

export default async function Home({ searchParams }: Props) {
  const params = await searchParams;

  const keyword =
    typeof params.keyword === "string" ? params.keyword.trim() : "";

  const requestedPage =
    typeof params.page === "string" ? Number(params.page) : 1;

  const page =
    Number.isSafeInteger(requestedPage) && requestedPage > 0
      ? requestedPage
      : 1;

  const products = await getHomeProducts(keyword, page);
  const currency = process.env.STOREFRONT_CURRENCY || "AUD";

  return (
    <div className="home-page">
      <section className="home-hero brand-tiles" aria-labelledby="home-title">
        <div className="home-hero-copy">
          <p className="home-eyebrow">
            Familiar flavours. Everyday favourites.
          </p>

          <h1 id="home-title" className="brand-heading home-title">
            Your pantry.
            <br />
            A little closer
            <br />
            to home.
          </h1>

          <p className="home-hero-description">
            From your everyday dal bhat to a late-night bowl of noodles. Find
            familiar favourites for your kitchen.
          </p>

          <a href="#products" className="brand-button tracking-wide group">
            Explore groceries
            <ArrowRightIcon
              className="size-4 transition-transform group-hover:translate-x-1 motion-reduce:transform-none"
              aria-hidden="true"
            />
          </a>
        </div>

        <div className="home-pantry" aria-hidden="true">
          <div className="home-pantry-heading">
            <BrandFlower />
            <span>A shelf full of favourites</span>
            <BrandFlower />
          </div>

          <div className="home-pantry-packages">
            <div className="home-package home-package-rice">
              <span>Everyday essential</span>
              <strong className="brand-heading">Rice</strong>
              <span>For the family table</span>
            </div>

            <div className="home-package home-package-masala">
              <span>A little warmth</span>
              <strong className="brand-heading">Masala</strong>
              <span>A lot of flavour</span>
            </div>

            <div className="home-package home-package-noodles">
              <span>Your comfort bowl</span>
              <strong className="brand-heading">Noodles</strong>
              <span>Make yourself at home</span>
            </div>
          </div>

          <p className="home-pantry-caption">
            GOOD THINGS BELONG IN YOUR CUPBOARD.
          </p>
        </div>
      </section>

      <nav className="home-quick-searches" aria-label="Quick grocery searches">
        <span>Looking for something?</span>

        <div className="home-search-pills">
          <Link
            href={getProductsHref("")}
            className={`home-search-pill ${!keyword ? "is-active" : ""}`}
            aria-current={!keyword ? "page" : undefined}
          >
            All groceries
          </Link>

          {quickSearches.map((item) => (
            <Link
              key={item.keyword}
              href={getProductsHref(item.keyword)}
              className={`home-search-pill ${
                keyword === item.keyword ? "is-active" : ""
              }`}
              aria-current={keyword === item.keyword ? "page" : undefined}
            >
              {item.label}
            </Link>
          ))}
        </div>
      </nav>

      <section
        id="products"
        className="home-products"
        aria-labelledby="products-title"
      >
        <div className="home-section-heading">
          <div>
            <p className="home-eyebrow">For your next pantry refill</p>

            <h2 id="products-title" className="brand-heading">
              {keyword ? `Results for “${keyword}”` : "On our shelves."}
            </h2>

            <p className="home-section-description">
              {products
                ? `${products.totalProducts} ${
                    products.totalProducts === 1 ? "product" : "products"
                  }${keyword ? " found" : " to explore"}.`
                : "Find your everyday favourites."}
            </p>
          </div>

          <form action="/#products" method="get" className="home-search-form">
            <label htmlFor="home-search" className="sr-only">
              Search groceries
            </label>

            <input
              key={keyword}
              id="home-search"
              name="keyword"
              type="search"
              defaultValue={keyword}
              placeholder="Search your favourites"
              className="brand-input"
            />

            <button
              type="submit"
              className="brand-button"
              aria-label="Search groceries"
            >
              <MagnifyingGlassIcon className="h-5 w-5" aria-hidden="true" />
            </button>
          </form>
        </div>

        {!products ? (
          <div className="home-empty-state" role="status">
            <h3 className="brand-heading">We could not load the shelves.</h3>
            <p>Please try again in a moment.</p>

            <a href={getProductsHref(keyword, page)} className="brand-button">
              Try again
            </a>
          </div>
        ) : products.data.length === 0 ? (
          <div className="home-empty-state">
            <h3 className="brand-heading">
              {keyword || page > 1
                ? "No products found here."
                : "Our shelves are being stocked."}
            </h3>

            <p>
              {keyword || page > 1
                ? "Try another search or return to all groceries."
                : "Check back soon for your everyday favourites."}
            </p>

            {(keyword || page > 1) && (
              <Link href="/#products" className="brand-button">
                Browse all groceries
              </Link>
            )}
          </div>
        ) : (
          <>
            <div className="home-product-grid">
              {products.data.map((product) => (
                <ProductCard
                  key={product.id}
                  product={product}
                  currency={currency}
                />
              ))}
            </div>

            {products.totalPages > 1 && (
              <nav className="home-pagination" aria-label="Product pages">
                {page > 1 && (
                  <Link
                    href={getProductsHref(keyword, page - 1)}
                    className="brand-button brand-button-secondary tracking-wide group"
                  >
                    <ArrowLeftIcon
                      aria-hidden="true"
                      className="transition-transform group-hover:-translate-x-1 motion-reduce:transform-none"
                    />
                    Previous
                  </Link>
                )}

                <span>
                  Page {page} of {products.totalPages}
                </span>

                {page < products.totalPages && (
                  <Link
                    href={getProductsHref(keyword, page + 1)}
                    className="brand-button brand-button-secondary tracking-wide group"
                  >
                    Next
                    <ArrowRightIcon
                      aria-hidden="true"
                      className="transition-transform group-hover:translate-x-1 motion-reduce:transform-none"
                    />
                  </Link>
                )}
              </nav>
            )}
          </>
        )}
      </section>

      <div className="home-closing-note">
        <BrandFlower />
        <p className="brand-heading">
          Familiar ingredients. Your own kind of home.
        </p>
        <BrandFlower />
      </div>
    </div>
  );
}
