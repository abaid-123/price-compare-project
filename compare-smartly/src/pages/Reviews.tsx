import { Link } from "react-router-dom";
import { HiStar } from "react-icons/hi";

type Review = {
  quote: string;
  name: string;
  role: string;
};

const reviews: Review[] = [
  {
    quote:
      "This website makes product comparison very easy. I can check price, reviews, and store link in one place.",
    name: "Ayesha Khan",
    role: "Online Shopper",
  },
  {
    quote:
      "I like the clean design. It helps me find products quickly without opening many different websites.",
    name: "Hamza Ali",
    role: "Tech Buyer",
  },
  {
    quote:
      "Category browsing and price comparison are simple. It saves time and helps me choose better products.",
    name: "Mariam Ahmed",
    role: "Smart Shopper",
  },
];

function Stars() {
  return (
    <div className="flex gap-1 text-yellow-400">
      {Array.from({ length: 5 }).map((_, index) => (
        <HiStar key={index} className="h-4 w-4" />
      ))}
    </div>
  );
}

export default function ReviewsPage() {
  return (
    <section className="relative min-h-screen overflow-hidden">
      <div className="absolute inset-0 z-0 bg-gradient-to-b from-[#070A1A] via-[#060818] to-[#050815]" />

      <div className="pointer-events-none absolute inset-0 z-10 opacity-70">
        <div className="absolute left-1/2 top-[-220px] h-[520px] w-[900px] -translate-x-1/2 rounded-full bg-indigo-600/15 blur-3xl" />
        <div className="absolute left-[15%] top-[140px] h-[300px] w-[300px] rounded-full bg-blue-500/10 blur-3xl" />
        <div className="absolute right-[12%] top-[120px] h-[300px] w-[300px] rounded-full bg-cyan-500/10 blur-3xl" />
      </div>

      <div className="relative z-20 mx-auto max-w-7xl px-4 py-16">
        <div className="text-center">
          <div className="inline-flex rounded-full border border-white/10 bg-white/5 px-4 py-2 text-sm text-white/70">
            Customer Reviews
          </div>

          <h2 className="mt-4 text-3xl font-extrabold text-white md:text-4xl">
            What Shoppers Say
          </h2>

          <p className="mx-auto mt-3 max-w-2xl text-sm text-white/60 md:text-base">
            People use CompareSmartly to compare prices, check reviews, and
            visit the right store faster.
          </p>
        </div>

        <div className="mt-10 grid gap-6 md:grid-cols-3">
          {reviews.map((review) => (
            <div
              key={review.name}
              className="rounded-2xl border border-white/10 bg-white/5 p-6 backdrop-blur transition hover:border-blue-400/30 hover:bg-white/10"
            >
              <Stars />

              <p className="mt-4 text-sm leading-7 text-white/70">
                “{review.quote}”
              </p>

              <div className="mt-6 flex items-center gap-3">
                <div className="flex h-11 w-11 items-center justify-center rounded-full bg-gradient-to-br from-blue-500 to-indigo-600 font-bold text-white">
                  {review.name.charAt(0)}
                </div>

                <div>
                  <p className="text-sm font-semibold text-white">
                    {review.name}
                  </p>
                  <p className="text-xs text-white/50">{review.role}</p>
                </div>
              </div>
            </div>
          ))}
        </div>

        <div className="mt-12 text-center">
          <Link
            to="/categories"
            className="inline-flex rounded-xl bg-gradient-to-r from-blue-500 to-indigo-600 px-6 py-3 text-sm font-semibold text-white transition hover:from-blue-400 hover:to-indigo-500"
          >
            Start Comparing
          </Link>
        </div>

        <div className="mt-14 h-px w-full bg-white/10" />
      </div>
    </section>
  );
}