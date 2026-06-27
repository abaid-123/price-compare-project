import { useEffect, useMemo, useState } from "react";
import { Link, useNavigate, useSearchParams } from "react-router-dom";
import { FiSearch } from "react-icons/fi";
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
  query: string;
  analysisFound: boolean;
  bestProduct: Product | null;
  topMatch: Product | null;
  alternatives: Product[];
  results: Product[];
};

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

export default function ComparePage() {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();

  const searchQuery = searchParams.get("q") || "";

  const [products, setProducts] = useState<Product[]>([]);
  const [q, setQ] = useState(searchQuery);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [sort, setSort] = useState<"reviews" | "price">("reviews");

  useEffect(() => {
    setQ(searchQuery);
    setError("");

    if (!searchQuery.trim()) {
      setProducts([]);
      return;
    }

    const controller = new AbortController();

    async function loadProducts() {
      try {
        setLoading(true);

        const response = await fetch(
          API_URL +
            "/search/best?q=" +
            encodeURIComponent(searchQuery),
          {
            signal: controller.signal,
          }
        );

        if (!response.ok) {
          throw new Error("Products load nahi ho sake");
        }

        const data: SearchResponse = await response.json();

        setProducts(Array.isArray(data.results) ? data.results : []);
      } catch (err) {
        if (err instanceof Error && err.name === "AbortError") {
          return;
        }

        console.error("Search error:", err);
        setProducts([]);
        setError("Products load nahi ho sake. Backend check karein.");
      } finally {
        if (!controller.signal.aborted) {
          setLoading(false);
        }
      }
    }

    void loadProducts();

    return () => {
      controller.abort();
    };
  }, [searchQuery]);

  function searchAgain() {
    const query = q.trim();

    navigate(
      query ? "/compare?q=" + encodeURIComponent(query) : "/compare"
    );
  }

  const filteredProducts = useMemo(() => {
    const recommendedProduct = products.find(isRecommended);

    const otherProducts = products.filter(
      (product) => !isRecommended(product)
    );

    if (sort === "price") {
      otherProducts.sort(
        (first, second) =>
          getNumericPrice(first.price) - getNumericPrice(second.price)
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

  return (
    <section className="min-h-screen bg-[#050815] px-4 py-14">
      <div className="mx-auto max-w-7xl">
        <div className="flex items-center justify-between gap-4">
          <div>
            <h1 className="text-2xl font-extrabold text-white md:text-3xl">
              Product Comparison
            </h1>

            <p className="mt-1 text-sm text-white/55">
              Showing products for{" "}
              <span className="font-semibold text-blue-400">
                {searchQuery || "your search"}
              </span>
            </p>
          </div>

          <Link
            to="/categories"
            className="text-sm text-white/60 underline underline-offset-4 hover:text-white"
          >
            Browse Categories →
          </Link>
        </div>

        <div className="mt-6 grid gap-3 md:grid-cols-[1fr_220px]">
          <div className="flex items-center gap-2 rounded-xl border border-white/10 bg-white/5 px-4 py-3">
            <FiSearch className="text-white/50" />

            <input
              value={q}
              onChange={(event) => setQ(event.target.value)}
              onKeyDown={(event) => {
                if (event.key === "Enter") {
                  searchAgain();
                }
              }}
              placeholder="Search another product..."
              className="w-full bg-transparent text-sm text-white outline-none placeholder:text-white/35"
            />

            <button
              type="button"
              onClick={searchAgain}
              className="rounded-lg bg-blue-600 px-4 py-2 text-sm font-semibold text-white hover:bg-blue-700"
            >
              Search
            </button>
          </div>

          <select
            value={sort}
            onChange={(event) =>
              setSort(event.target.value as "reviews" | "price")
            }
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

        {loading && (
          <p className="mt-10 text-white/60">Products load ho rahe hain...</p>
        )}

        {!loading && error && (
          <div className="mt-8 rounded-2xl border border-red-500/30 bg-red-500/10 p-5 text-red-300">
            {error}
          </div>
        )}

        {!loading && !error && filteredProducts.length > 0 && (
          <div className="mt-7 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {filteredProducts.map((product) => (
              <div
                key={product.id}
                className={
                  "relative flex flex-col justify-between overflow-hidden rounded-3xl border bg-white/5 p-5 shadow-lg backdrop-blur " +
                  (product.isBest
                    ? "border-emerald-400/70 shadow-emerald-500/20"
                    : product.isTopMatch
                      ? "border-blue-400/70 shadow-blue-500/20"
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
                    ⭐ Top Match
                  </div>
                )}

                <div className="mb-4 flex h-56 items-center justify-center overflow-hidden rounded-2xl border border-white/10 bg-white/5 p-4">
                  <img
                    src={
                      product.image
                        ? API_URL +
                          "/image?url=" +
                          encodeURIComponent(product.image)
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
                      <p className="text-xs font-semibold text-white/40">
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
                    <div className="mt-4 rounded-xl border border-blue-400/20 bg-blue-500/10 p-3">
                      <p className="text-xs font-bold text-blue-300">
                        Database Top Match
                      </p>

                      <p className="mt-1 text-sm leading-6 text-white/75">
                        Exact Groq analysis available nahi. Yeh product reviews
                        aur price ranking ke basis par top match hai.
                      </p>
                    </div>
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
            ))}
          </div>
        )}

        {!loading &&
          !error &&
          searchQuery &&
          filteredProducts.length === 0 && (
            <div className="mt-10 rounded-2xl border border-white/10 bg-white/5 p-8 text-center">
              <p className="text-white/70">
                No products found for{" "}
                <span className="text-blue-400">{searchQuery}</span>
              </p>

              <Link
                to="/categories"
                className="mt-4 inline-block rounded-xl bg-blue-600 px-5 py-2 font-semibold text-white hover:bg-blue-700"
              >
                View Categories
              </Link>
            </div>
          )}

        {!loading && !searchQuery && (
          <div className="mt-10 rounded-2xl border border-white/10 bg-white/5 p-8 text-center">
            <p className="text-white/70">
              Search a product from the homepage to compare prices.
            </p>
          </div>
        )}
      </div>
    </section>
  );
}
