import { useEffect, useMemo, useState } from "react";
import { Link, useParams } from "react-router-dom";
import { API_BASE_URL } from "../config/api";

type RecommendationType = "ai" | "top_match" | null;

type Product = {
  id: number;
  title: string;
  price: string;
  link: string;
  reviews: number;
  category: string;
  image: string;
  source?: string;
  discount?: string;
  review_text?: string;
  isBest?: boolean;
  isTopMatch?: boolean;
  recommendationType?: RecommendationType;
  aiReason?: string | null;
};

type SearchResponse = {
  analysisFound: boolean;
  bestProduct: Product | null;
  topMatch: Product | null;
  alternatives: Product[];
  results: Product[];
};

const PRODUCTS_PER_PAGE = 24;
const API_URL = `${API_BASE_URL}/api/products`;

function getNumericPrice(price: string): number {
  const match = String(price || "")
    .replace(/,/g, "")
    .match(/\d+(?:\.\d+)?/);

  return match ? Number(match[0]) : Number.POSITIVE_INFINITY;
}

function getReviewCount(reviews: number): number {
  const value = Number(reviews || 0);
  return Number.isFinite(value) ? value : 0;
}

function getReviewLabel(reviews: number): string {
  const count = getReviewCount(reviews);

  if (count === 0) {
    return "No reviews";
  }

  return count === 1 ? "⭐ 1 review" : `⭐ ${count} reviews`;
}

function isRecommended(product: Product): boolean {
  return Boolean(product.isBest || product.isTopMatch);
}

export default function CategoryPage() {
  const { category } = useParams();

  const [products, setProducts] = useState<Product[]>([]);
  const [currentPage, setCurrentPage] = useState(1);
  const [loading, setLoading] = useState(true);
  const [searching, setSearching] = useState(false);
  const [q, setQ] = useState("");
  const [error, setError] = useState("");
  const [sort, setSort] = useState<"reviews" | "price">("reviews");

  useEffect(() => {
    const categorySlug = category || "";

    if (!categorySlug) {
      setProducts([]);
      setLoading(false);
      return;
    }

    const controller = new AbortController();

    async function loadCategoryProducts() {
      try {
        setLoading(true);
        setError("");
        setCurrentPage(1);

        const response = await fetch(
          `${API_URL}/${encodeURIComponent(categorySlug)}`,
          { signal: controller.signal },
        );

        if (!response.ok) {
          throw new Error("Category products failed to load");
        }

        const data: unknown = await response.json();

        setProducts(Array.isArray(data) ? (data as Product[]) : []);
      } catch (err) {
        if (err instanceof Error && err.name === "AbortError") {
          return;
        }

        console.error("Category products error:", err);
        setProducts([]);
        setError("Category products could not be loaded.");
      } finally {
        if (!controller.signal.aborted) {
          setLoading(false);
        }
      }
    }

    void loadCategoryProducts();

    return () => {
      controller.abort();
    };
  }, [category]);

  async function loadCategoryProductsAgain() {
    const categorySlug = category || "";

    if (!categorySlug) {
      return;
    }

    try {
      setLoading(true);
      setError("");
      setCurrentPage(1);

      const response = await fetch(
        `${API_URL}/${encodeURIComponent(categorySlug)}`,
      );

      if (!response.ok) {
        throw new Error("Category products failed to load");
      }

      const data: unknown = await response.json();

      setProducts(Array.isArray(data) ? (data as Product[]) : []);
    } catch (err) {
      console.error("Category products error:", err);
      setProducts([]);
      setError("Category products could not be loaded.");
    } finally {
      setLoading(false);
    }
  }

  async function searchProducts() {
    const query = q.trim();
    const categorySlug = category || "";

    if (!query) {
      await loadCategoryProductsAgain();
      return;
    }

    if (!categorySlug) {
      return;
    }

    try {
      setSearching(true);
      setError("");
      setCurrentPage(1);

      const response = await fetch(
        `${API_URL}/search/best?q=${encodeURIComponent(
          query,
        )}&category=${encodeURIComponent(categorySlug)}`,
      );

      if (!response.ok) {
        throw new Error("Search request failed");
      }

      const data: SearchResponse = await response.json();

      setProducts(Array.isArray(data.results) ? data.results : []);
    } catch (err) {
      console.error("Product search error:", err);
      setProducts([]);
      setError("Product Could not be searched.");
    } finally {
      setSearching(false);
    }
  }

  function clearSearch() {
    setQ("");
    void loadCategoryProductsAgain();
  }

  const filtered = useMemo(() => {
    const recommendedProduct = products.find(isRecommended);

    const otherProducts = products.filter((product) => !isRecommended(product));

    if (sort === "price") {
      otherProducts.sort(
        (first, second) =>
          getNumericPrice(first.price) - getNumericPrice(second.price),
      );
    } else {
      otherProducts.sort((first, second) => {
        const reviewDifference =
          getReviewCount(second.reviews) - getReviewCount(first.reviews);

        if (reviewDifference !== 0) {
          return reviewDifference;
        }

        return getNumericPrice(first.price) - getNumericPrice(second.price);
      });
    }

    return recommendedProduct
      ? [recommendedProduct, ...otherProducts]
      : otherProducts;
  }, [products, sort]);

  const totalPages = Math.ceil(filtered.length / PRODUCTS_PER_PAGE);

  const visibleProducts = filtered.slice(
    (currentPage - 1) * PRODUCTS_PER_PAGE,
    currentPage * PRODUCTS_PER_PAGE,
  );

  function handlePageChange(page: number) {
    const safePage = Math.max(1, Math.min(page, totalPages || 1));

    setCurrentPage(safePage);
    window.scrollTo({ top: 0, behavior: "smooth" });
  }

  function getPageNumbers() {
    const pages: number[] = [];
    let start = Math.max(1, currentPage - 2);
    const end = Math.min(totalPages, start + 4);

    if (end - start < 4) {
      start = Math.max(1, end - 4);
    }

    for (let page = start; page <= end; page += 1) {
      pages.push(page);
    }

    return pages;
  }

  const pageNums = getPageNumbers();

  return (
    <section className="min-h-screen bg-[#050815] px-4 py-14">
      <div className="mx-auto max-w-7xl">
        <div className="flex items-center justify-between gap-4">
          <div>
            <h1 className="text-2xl font-extrabold capitalize text-white md:text-3xl">
              {category?.replace("-", " ")}
            </h1>

            <p className="mt-1 text-sm text-white/55">
              Showing {visibleProducts.length} of {filtered.length} products
            </p>
          </div>

          <Link
            to="/categories"
            className="text-sm text-white/60 underline underline-offset-4 hover:text-white"
          >
            ← Back
          </Link>
        </div>

        <div className="mt-6 grid gap-3 md:grid-cols-[1fr_auto_220px]">
          <input
            value={q}
            onChange={(event) => setQ(event.target.value)}
            onKeyDown={(event) => {
              if (event.key === "Enter") {
                void searchProducts();
              }
            }}
            placeholder="Search best product in this category..."
            className="rounded-xl border border-white/10 bg-white/5 px-4 py-3 text-sm text-white outline-none placeholder:text-white/35"
          />

          <div className="flex gap-2">
            <button
              type="button"
              onClick={() => void searchProducts()}
              disabled={searching}
              className="rounded-xl bg-blue-600 px-5 py-3 text-sm font-semibold text-white hover:bg-blue-700 disabled:opacity-50"
            >
              {searching ? "Searching..." : "Search"}
            </button>

            {q.trim() && (
              <button
                type="button"
                onClick={clearSearch}
                className="rounded-xl border border-white/10 bg-white/5 px-4 py-3 text-sm text-white/70 hover:bg-white/10"
              >
                Clear
              </button>
            )}
          </div>

          <select
            value={sort}
            onChange={(event) => {
              setSort(event.target.value as "reviews" | "price");
              setCurrentPage(1);
            }}
            className="rounded-xl border border-white/10 bg-white/5 px-4 py-3 text-sm text-white outline-none"
          >
            <option value="reviews" className="bg-[#050815]">
              Top Reviews
            </option>

            <option value="price" className="bg-[#050815]">
              Lowest Price
            </option>
          </select>
        </div>

        {(loading || searching) && (
          <p className="mt-10 text-white/60">
            {searching ? "Searching products..." : "Loading products..."}
          </p>
        )}

        {!loading && !searching && error && (
          <div className="mt-8 rounded-2xl border border-red-500/30 bg-red-500/10 p-5 text-red-300">
            {error}
          </div>
        )}

        {!loading && !searching && !error && visibleProducts.length > 0 && (
          <>
            <div className="mt-7 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
              {visibleProducts.map((product) => {
                const recommended = isRecommended(product);

                return (
                  <div
                    key={product.id}
                    className={
                      "relative flex flex-col justify-between overflow-hidden rounded-3xl border bg-white/5 p-5 shadow-lg backdrop-blur " +
                      (recommended
                        ? "border-emerald-400/70 shadow-emerald-500/20"
                        : "border-white/10 shadow-blue-500/10")
                    }
                  >
                    {product.isBest && (
                      <div className="absolute left-4 top-4 z-10 rounded-full bg-emerald-500 px-3 py-1 text-xs font-bold text-white">
                        🏆 AI Best Product
                      </div>
                    )}

                    {product.isTopMatch && (
                      <div className="absolute left-4 top-4 z-10 rounded-full bg-blue-600 px-3 py-1 text-xs font-bold text-white">
                        Top Match
                      </div>
                    )}

                    <div className="mb-4 flex h-56 items-center justify-center overflow-hidden rounded-2xl border border-white/10 bg-white/5 p-4">
                      <img
                        src={
                          product.image
                            ? `${API_URL}/image?url=${encodeURIComponent(
                                product.image,
                              )}`
                            : "https://via.placeholder.com/300x200?text=No+Image"
                        }
                        alt={product.title}
                        className="max-h-full max-w-full object-contain transition-transform duration-300 hover:scale-105"
                        onError={(event) => {
                          event.currentTarget.src =
                            "https://via.placeholder.com/300x200?text=No+Image";
                        }}
                      />
                    </div>

                    <div>
                      <div className="mb-2 flex items-center justify-between gap-2">
                        <p className="text-xs font-medium text-blue-400">
                          {product.category}
                        </p>

                        <p className="text-xs text-white/50">
                          {product.source || "Online Store"}
                        </p>
                      </div>

                      <h3 className="line-clamp-2 font-semibold text-white">
                        {product.title}
                      </h3>

                      <div className="mt-3 flex items-center justify-between gap-3">
                        <span className="text-lg font-bold text-white">
                          {product.price}
                        </span>

                        <span className="text-sm text-yellow-400">
                          {getReviewLabel(product.reviews)}
                        </span>
                      </div>

                      {product.discount && (
                        <p className="mt-2 text-sm text-emerald-400">
                          Previous price: {product.discount}
                        </p>
                      )}

                      {product.review_text && (
                        <div className="mt-3">
                          <p className="text-xs font-semibold text-white/45">
                            Review samples
                          </p>

                          <p className="mt-1 line-clamp-3 text-sm leading-6 text-white/60">
                            {product.review_text}
                          </p>
                        </div>
                      )}

                      {product.isBest && product.aiReason && (
                        <div className="mt-4 rounded-xl border border-emerald-400/20 bg-emerald-500/10 p-3">
                          <p className="text-xs font-bold text-emerald-300">
                            Groq Analysis
                          </p>

                          <p className="mt-1 text-sm leading-6 text-white/75">
                            {product.aiReason}
                          </p>
                        </div>
                      )}

                      {product.isTopMatch && (
                        <p className="mt-4 text-xs text-blue-300/80">
                          Exact Groq analysis is not available; this top match
                          is based on reviews and price.
                        </p>
                      )}
                    </div>

                    <a
                      href={product.link}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="mt-4 block w-full rounded-xl bg-gradient-to-r from-blue-500 to-indigo-600 py-2.5 text-center text-sm font-semibold text-white shadow-lg shadow-blue-500/15 transition hover:from-blue-400 hover:to-indigo-500"
                    >
                      Visit on {product.source || "Store"} →
                    </a>
                  </div>
                );
              })}
            </div>

            {totalPages > 1 && (
              <div className="mt-10 flex flex-wrap items-center justify-center gap-2">
                <button
                  type="button"
                  onClick={() => handlePageChange(currentPage - 1)}
                  disabled={currentPage === 1}
                  className="rounded-xl border border-white/10 bg-white/5 px-3 py-2 text-sm text-white/70 hover:bg-white/10 hover:text-white disabled:cursor-not-allowed disabled:opacity-30"
                >
                  Prev
                </button>

                {pageNums.map((page) => (
                  <button
                    type="button"
                    key={page}
                    onClick={() => handlePageChange(page)}
                    className={
                      "rounded-xl border px-3 py-2 text-sm font-semibold " +
                      (page === currentPage
                        ? "border-blue-500 bg-blue-500/20 text-white"
                        : "border-white/10 bg-white/5 text-white/70 hover:bg-white/10 hover:text-white")
                    }
                  >
                    {page}
                  </button>
                ))}

                <button
                  type="button"
                  onClick={() => handlePageChange(currentPage + 1)}
                  disabled={currentPage === totalPages}
                  className="rounded-xl border border-white/10 bg-white/5 px-3 py-2 text-sm text-white/70 hover:bg-white/10 hover:text-white disabled:cursor-not-allowed disabled:opacity-30"
                >
                  Next
                </button>
              </div>
            )}
          </>
        )}

        {!loading && !searching && !error && filtered.length === 0 && (
          <div className="mt-10 rounded-2xl border border-white/10 bg-white/5 p-8 text-center">
            <p className="text-white/70">No products found.</p>
          </div>
        )}
      </div>
    </section>
  );
}
