import { HiStar } from "react-icons/hi";

type Review = {
  quote: string;
  name: string;
  role: string;
};

const reviews: Review[] = [
  {
    quote:
      "Saved over $500 on my new laptop! The price history feature is amazing.",
    name: "Michael Chen",
    role: "Tech Enthusiast",
  },
  {
    quote:
      "As a busy mom, this saves me so much time. The price alerts are a game-changer!",
    name: "Sarah Johnson",
    role: "Parent & Blogger",
  },
  {
    quote:
      "Found designer items at 60% off retail. The reviews helped me avoid counterfeits!",
    name: "Emma Williams",
    role: "Fashion Stylist",
  },
];

export default function ReviewsPage() {
  return (
    <section className="relative overflow-hidden">
      {/* Base gradient (bottom layer) */}
      <div className="absolute inset-0 z-0 bg-gradient-to-b from-[#070A1A] via-[#060818] to-[#050815]" />

      {/* Glow blobs (same as other sections) */}
      <div className="pointer-events-none absolute inset-0 z-10 opacity-70">
        <div className="absolute left-1/2 top-[-220px] h-[520px] w-[900px] -translate-x-1/2 rounded-full bg-indigo-600/15 blur-3xl" />
        <div className="absolute left-[15%] top-[140px] h-[300px] w-[300px] rounded-full bg-blue-500/10 blur-3xl" />
        <div className="absolute right-[12%] top-[120px] h-[300px] w-[300px] rounded-full bg-cyan-500/10 blur-3xl" />
      </div>

      {/* Content */}
      <div className="relative z-20 mx-auto max-w-7xl px-4 py-16">
        {/* Header */}
        <div className="text-center">
          <div className="inline-flex items-center rounded-full border border-white/10 bg-white/5 px-3 py-1 text-xs text-white/70">
            Reviews
          </div>

          <h2 className="mt-4 text-3xl md:text-4xl font-extrabold text-white">
            Loved by Smart Shoppers
          </h2>
        </div>

        {/* Cards */}
        <div className="mt-12 grid gap-6 md:grid-cols-3">
          {reviews.map((r) => (
            <div
              key={r.name}
              className="rounded-2xl border border-white/10 bg-[#070A1A]/40 backdrop-blur px-8 py-10 shadow-lg"
            >
              {/* Stars */}
              <div className="flex gap-1 text-yellow-400">
                {Array.from({ length: 5 }).map((_, i) => (
                  <HiStar key={i} className="h-4 w-4" />
                ))}
              </div>

              {/* Quote */}
              <p className="mt-4 text-sm leading-relaxed text-white/75">
                “{r.quote}”
              </p>

              {/* Profile */}
              <div className="mt-8 flex items-center gap-3">
                <div className="h-10 w-10 rounded-full bg-gradient-to-br from-blue-500 to-indigo-600 flex items-center justify-center">
                  <span className="text-white text-sm">👤</span>
                </div>
                <div>
                  <p className="text-sm font-semibold text-white">{r.name}</p>
                  <p className="text-xs text-white/50">{r.role}</p>
                </div>
              </div>
            </div>
          ))}
        </div>

        {/* Bottom spacing */}
        <div className="mt-14" />
      </div>
    </section>
  );
}
