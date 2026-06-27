import { useEffect, useState } from "react";

type Stat = {
  value: number;
  suffix?: string;
  label: string;
};

export default function StatsStrip() {
  const stats: Stat[] = [
    { value: 500, suffix: "+", label: "Stores" },
    { value: 2_000_000, suffix: "+", label: "Products" },
    { value: 50_000_000, suffix: "+", label: "Saved" },
    { value: 4.9, suffix: "★", label: "Rating" },
  ];

  const [counts, setCounts] = useState(stats.map(() => 0));

  useEffect(() => {
    const duration = 1200; // animation time (ms)
    const start = performance.now();

    const animate = (now: number) => {
      const progress = Math.min((now - start) / duration, 1);

      setCounts(
        stats.map((stat) => {
          const value = stat.value * progress;
          return stat.value % 1 === 0
            ? Math.floor(value)
            : Number(value.toFixed(1));
        })
      );

      if (progress < 1) requestAnimationFrame(animate);
    };

    requestAnimationFrame(animate);
  }, []);

  return (
    <section className="relative">
      <div className="mx-auto max-w-7xl px-4 py-10 md:py-0">
        <div className="mx-auto max-w-3xl min-h-[92px]   ">
          <div className="grid grid-cols-2 gap-6 sm:grid-cols-4">
            {stats.map((stat, i) => (
              <div key={stat.label} className="text-center">
                <div className="text-2xl md:text-3xl font-extrabold bg-gradient-to-r from-indigo-400 to-indigo-600 bg-clip-text text-transparent">
                  {stat.label === "Products"
                    ? `${Math.floor(counts[i] / 1_000_000)}M${stat.suffix}`
                    : stat.label === "Saved"
                    ? `$${Math.floor(counts[i] / 1_000_000)}M${stat.suffix}`
                    : `${counts[i]}${stat.suffix}`}
                </div>
                <div className="mt-1 text-xs text-white/55">
                  {stat.label}
                </div>
              </div>
            ))}
          </div>
        </div>

        <div className="mt-10 h-px w-full bg-white/10" />
      </div>
    </section>
  );
}
