import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { HiStar } from "react-icons/hi";
import { FiExternalLink, FiChevronLeft, FiChevronRight } from "react-icons/fi";
import { API_BASE_URL } from "../config/api";

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
  search_query?: string;
  scraped_at?: string;
};

const API_URL = `${API_BASE_URL}/api/products`;

function getReviewCount(reviews: number): number {
  const value = Number(reviews || 0);
  return Number.isFinite(value) ? value : 0;
}

function getReviewLabel(reviews: number): string {
  const count = getReviewCount(reviews);

  if (count === 0) {
    return "No reviews";
  }

  return count === 1 ? "1 review" : `${count} reviews`;
}

function Stars() {
  return (
    <div className="flex items-center gap-1">
      {Array.from({ length: 5 }).map((_, index) => (
        <HiStar key={index} className="h-4 w-4 text-yellow-400" />
      ))}
    </div>
  );
}

function ProductCard({ product }: { product: Product }) {
  return (
    <div className="rounded-2xl border border-white/10 bg-white/5 p-4 text-left shadow-lg backdrop-blur transition hover:border-blue-400/30 hover:bg-white/10">
      <div className="relative aspect-[4/3] overflow-hidden rounded-xl border border-white/10 bg-[#070A1A]/40 p-3">
        <img
          src={
            product.image
              ? `${API_URL}/image?url=${encodeURIComponent(product.image)}`
              : "https://via.placeholder.com/300x200?text=No+Image"
          }
          alt={product.title}
          className="h-full w-full object-contain transition duration-300 hover:scale-105"
          loading="lazy"
          onError={(event) => {
            event.currentTarget.src =
              "https://via.placeholder.com/300x200?text=No+Image";
          }}
        />
      </div>

      <div className="mt-4">
        <div className="mb-2 flex items-center justify-between gap-2">
          <p className="text-xs font-medium text-blue-400">
            {product.category}
          </p>

          <p className="text-xs text-white/45">
            {product.source || "Online Store"}
          </p>
        </div>

        <h3 className="line-clamp-2 min-h-[48px] text-base font-semibold text-white">
          {product.title}
        </h3>

        <div className="mt-3 flex items-center justify-between gap-3">
          <span className="text-lg font-bold text-white">{product.price}</span>

          <div className="text-right">
            <Stars />
            <p className="mt-1 text-xs text-white/50">
              {getReviewLabel(product.reviews)}
            </p>
          </div>
        </div>

        {product.discount && (
          <p className="mt-2 text-sm text-emerald-400">
            Previous price: {product.discount}
          </p>
        )}
      </div>

      <div className="mt-4 grid grid-cols-1 gap-2">
        <Link
          to={`/compare?q=${encodeURIComponent(product.title)}`}
          className="inline-flex w-full items-center justify-center rounded-lg bg-gradient-to-r from-blue-500 to-indigo-600 px-4 py-2.5 text-xs font-semibold text-white transition hover:from-blue-400 hover:to-indigo-500"
        >
          View Comparison →
        </Link>

        <a
          href={product.link}
          target="_blank"
          rel="noopener noreferrer"
          className="inline-flex w-full items-center justify-center gap-2 rounded-lg border border-white/10 bg-white/5 px-4 py-2.5 text-xs font-semibold text-white/80 transition hover:bg-white/10"
        >
          Visit Store <FiExternalLink className="h-3 w-3" />
        </a>
      </div>

      <p className="mt-3 text-center text-[10px] text-white/45">
        Prices can change on the seller’s website.
      </p>
    </div>
  );
}

export default function Featured() {
  const [products, setProducts] = useState<Product[]>([]);
  const [activeIndex, setActiveIndex] = useState(0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    const loadFeaturedProducts = async () => {
      try {
        setLoading(true);
        setError("");

        const res = await fetch(`${API_URL}/featured`);
        const data = await res.json();

        if (res.ok && Array.isArray(data)) {
          setProducts(data);
          setActiveIndex(0);
        } else {
          setProducts([]);
          setError(data.error || "Featured products load nahi ho sake.");
        }
      } catch (error) {
        console.error("Featured products error:", error);
        setProducts([]);
        setError("Featured products load nahi ho sake.");
      } finally {
        setLoading(false);
      }
    };

    void loadFeaturedProducts();
  }, []);

  const nextProduct = () => {
    setActiveIndex((prev) => (prev + 1) % products.length);
  };

  const prevProduct = () => {
    setActiveIndex((prev) =>
      prev === 0 ? products.length - 1 : prev - 1,
    );
  };

  const activeProduct = products[activeIndex];

  return (
    <section className="relative overflow-hidden">
      <div className="absolute inset-0 z-0 bg-gradient-to-b from-[#070A1A] via-[#060818] to-[#050815]" />

      <div className="pointer-events-none absolute inset-0 z-10 opacity-70">
        <div className="absolute left-1/2 top-[-220px] h-[520px] w-[900px] -translate-x-1/2 rounded-full bg-indigo-600/15 blur-3xl" />
        <div className="absolute left-[15%] top-[140px] h-[300px] w-[300px] rounded-full bg-blue-500/10 blur-3xl" />
        <div className="absolute right-[12%] top-[120px] h-[300px] w-[300px] rounded-full bg-cyan-500/10 blur-3xl" />
      </div>

      <div className="relative z-20 mx-auto max-w-7xl px-4 py-16 text-center">
        <h2 className="mb-4 text-3xl font-extrabold text-white md:text-4xl">
          Featured Products
        </h2>

        <p className="text-sm text-white/55">
          Explore popular products and compare prices instantly.
        </p>

        {loading && (
          <p className="mt-10 text-white/60">Featured products loading...</p>
        )}

        {!loading && error && (
          <div className="mt-10 rounded-2xl border border-red-500/30 bg-red-500/10 p-5 text-red-300">
            {error}
          </div>
        )}

        {!loading && !error && products.length === 0 && (
          <div className="mt-10 rounded-2xl border border-white/10 bg-white/5 p-8">
            <p className="text-white/60">No featured products found.</p>
          </div>
        )}

        {!loading && !error && products.length > 0 && (
          <>
            {/* Mobile Slider */}
            <div className="mt-10 sm:hidden">
              {activeProduct && <ProductCard product={activeProduct} />}

              {products.length > 1 && (
                <div className="mt-5 flex items-center justify-between gap-4">
                  <button
                    type="button"
                    onClick={prevProduct}
                    className="inline-flex h-11 w-11 items-center justify-center rounded-full border border-white/10 bg-white/5 text-white hover:bg-white/10"
                  >
                    <FiChevronLeft size={20} />
                  </button>

                  <div className="flex items-center gap-2">
                    {products.map((product, index) => (
                      <button
                        key={product.id}
                        type="button"
                        onClick={() => setActiveIndex(index)}
                        className={`h-2.5 rounded-full transition-all ${
                          activeIndex === index
                            ? "w-7 bg-blue-400"
                            : "w-2.5 bg-white/25"
                        }`}
                      />
                    ))}
                  </div>

                  <button
                    type="button"
                    onClick={nextProduct}
                    className="inline-flex h-11 w-11 items-center justify-center rounded-full border border-white/10 bg-white/5 text-white hover:bg-white/10"
                  >
                    <FiChevronRight size={20} />
                  </button>
                </div>
              )}

              <p className="mt-3 text-xs text-white/45">
                {activeIndex + 1} of {products.length}
              </p>
            </div>

            {/* Tablet/Desktop Grid */}
            <div className="mt-10 hidden gap-6 sm:grid sm:grid-cols-2 lg:grid-cols-4">
              {products.map((product) => (
                <ProductCard key={product.id} product={product} />
              ))}
            </div>
          </>
        )}
      </div>
    </section>
  );
}