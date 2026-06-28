import { useEffect, useState } from "react";
import type { ComponentType } from "react";
import { Link } from "react-router-dom";
import {
  HiOutlineSearch,
  HiOutlineCheckCircle,
  HiOutlineShoppingCart,
  HiOutlineSparkles,
} from "react-icons/hi";

type Step = {
  title: string;
  desc: string;
  badge: string;
  Icon: ComponentType<{ className?: string }>;
};

const steps: Step[] = [
  {
    badge: "Step 01",
    title: "Search Products",
    desc: "Search any product or browse categories like electronics, fashion, beauty, gaming, and more.",
    Icon: HiOutlineSearch,
  },
  {
    badge: "Step 02",
    title: "Get Smart Matches",
    desc: "CompareSmartly finds relevant products and highlights strong matches using price, reviews, and product data.",
    Icon: HiOutlineSparkles,
  },
  {
    badge: "Step 03",
    title: "Compare Options",
    desc: "View price, reviews, store source, discounts, and product details in one clean comparison screen.",
    Icon: HiOutlineCheckCircle,
  },
  {
    badge: "Step 04",
    title: "Visit Store",
    desc: "Open the original seller link and buy directly from the online store with more confidence.",
    Icon: HiOutlineShoppingCart,
  },
];

export default function HowItWorks() {
  const [activeStep, setActiveStep] = useState(0);

  useEffect(() => {
    const interval = setInterval(() => {
      setActiveStep((prev) => (prev + 1) % steps.length);
    }, 3000);

    return () => clearInterval(interval);
  }, []);

  const ActiveIcon = steps[activeStep].Icon;

  return (
    <section className="relative min-h-screen overflow-hidden">
      <div className="absolute inset-0 z-0 bg-gradient-to-b from-[#070A1A] via-[#060818] to-[#050815]" />

      <div className="pointer-events-none absolute inset-0 z-10 opacity-70">
        <div className="absolute left-1/2 top-[-220px] h-[520px] w-[900px] -translate-x-1/2 rounded-full bg-indigo-600/15 blur-3xl" />
        <div className="absolute left-[15%] top-[140px] h-[300px] w-[300px] rounded-full bg-blue-500/10 blur-3xl" />
        <div className="absolute right-[12%] top-[120px] h-[300px] w-[300px] rounded-full bg-cyan-500/10 blur-3xl" />
      </div>

      <div className="relative z-20 mx-auto max-w-7xl px-4 py-16 sm:px-6 lg:px-8">
        <div className="grid items-center gap-8 lg:grid-cols-[1fr_520px]">
          <div>
            <div className="inline-flex items-center gap-2 rounded-full border border-blue-400/20 bg-blue-500/10 px-4 py-2 text-sm font-semibold text-blue-300">
              <HiOutlineSparkles className="h-4 w-4" />
              Smart Price Comparison
            </div>

            <h1 className="mt-5 max-w-2xl text-3xl font-extrabold leading-tight text-white md:text-5xl">
              Compare products faster and choose the better deal.
            </h1>

            <p className="mt-4 max-w-2xl text-sm leading-7 text-white/60 md:text-base">
              CompareSmartly helps users find products, check prices, review
              ratings, and open the original store link from one simple place.
            </p>

            <div className="mt-7 flex flex-col gap-3 sm:flex-row">
              <Link
                to="/categories"
                className="inline-flex items-center justify-center rounded-xl bg-gradient-to-r from-blue-500 to-indigo-600 px-5 py-3 text-sm font-semibold text-white transition hover:from-blue-400 hover:to-indigo-500"
              >
                Browse Categories
              </Link>
            </div>
          </div>

          <div className="rounded-3xl border border-white/10 bg-white/5 p-5 backdrop-blur">
            <div className="rounded-2xl border border-white/10 bg-[#070A1A]/50 p-6">
              <div className="flex items-center justify-between gap-4">
                <span className="rounded-full border border-blue-400/20 bg-blue-500/10 px-3 py-1 text-xs font-bold text-blue-300">
                  {steps[activeStep].badge}
                </span>

                <div className="flex gap-2">
                  {steps.map((step, index) => (
                    <button
                      key={step.title}
                      type="button"
                      onClick={() => setActiveStep(index)}
                      className={`h-2.5 rounded-full transition-all ${
                        activeStep === index
                          ? "w-8 bg-blue-400"
                          : "w-2.5 bg-white/20 hover:bg-white/40"
                      }`}
                    />
                  ))}
                </div>
              </div>

              <div className="mt-8 flex h-20 w-20 items-center justify-center rounded-3xl border border-blue-400/20 bg-blue-500/10">
                <ActiveIcon className="h-10 w-10 text-blue-300" />
              </div>

              <h2 className="mt-6 text-2xl font-bold text-white">
                {steps[activeStep].title}
              </h2>

              <p className="mt-3 min-h-[84px] text-sm leading-7 text-white/60">
                {steps[activeStep].desc}
              </p>

              <div className="mt-6 rounded-2xl border border-white/10 bg-white/5 p-4">
                <div className="flex items-center justify-between text-xs text-white/50">
                  <span>Process progress</span>
                  <span>{activeStep + 1}/4</span>
                </div>

                <div className="mt-3 h-2 overflow-hidden rounded-full bg-white/10">
                  <div
                    className="h-full rounded-full bg-gradient-to-r from-blue-500 to-indigo-500 transition-all duration-500"
                    style={{
                      width: `${((activeStep + 1) / steps.length) * 100}%`,
                    }}
                  />
                </div>
              </div>
            </div>
          </div>
        </div>

        <div className="mt-12 rounded-3xl border border-white/10 bg-white/5 px-4 py-6 backdrop-blur sm:px-6 sm:py-8 lg:p-10">
          <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-4">
            {steps.map(({ title, desc, Icon }, index) => (
              <button
                key={title}
                type="button"
                onClick={() => setActiveStep(index)}
                className={`group relative rounded-2xl border px-5 py-7 text-center transition duration-300 hover:-translate-y-1 ${
                  activeStep === index
                    ? "border-blue-400/50 bg-blue-500/10"
                    : "border-white/10 bg-[#070A1A]/40 hover:border-blue-400/40 hover:bg-white/10"
                }`}
              >
                <div className="absolute left-4 top-4 flex h-7 w-7 items-center justify-center rounded-full border border-white/10 bg-white/5 text-xs font-bold text-white/50">
                  {index + 1}
                </div>

                <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl border border-white/10 bg-white/5 transition group-hover:border-blue-400/40 group-hover:bg-blue-500/10">
                  <Icon className="h-7 w-7 text-blue-400 transition group-hover:text-blue-300" />
                </div>

                <h3 className="mt-5 text-lg font-semibold text-white">
                  {title}
                </h3>

                <p className="mt-2 text-sm leading-6 text-white/60">
                  {desc}
                </p>
              </button>
            ))}
          </div>
        </div>

        {/* <div className="mt-10 grid gap-4 rounded-3xl border border-white/10 bg-white/5 p-5 backdrop-blur md:grid-cols-3">
          <div>
            <p className="text-2xl font-bold text-white">Real Products</p>
            <p className="mt-1 text-sm text-white/55">
              Product data comes from your database and scraped store results.
            </p>
          </div>

          <div>
            <p className="text-2xl font-bold text-white">Smart Ranking</p>
            <p className="mt-1 text-sm text-white/55">
              Products are sorted using reviews, prices, and matching accuracy.
            </p>
          </div>

          <div>
            <p className="text-2xl font-bold text-white">Store Redirect</p>
            <p className="mt-1 text-sm text-white/55">
              Users can visit the original store page to purchase directly.
            </p>
          </div>
        </div> */}

        <div className="mt-12 h-px w-full bg-white/10" />
      </div>
    </section>
  );
}