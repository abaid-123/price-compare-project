import {
  HiOutlineSearch,
  HiOutlineCheckCircle,
  HiOutlineShoppingCart,
} from "react-icons/hi";
type Step = {
  title: string;
  desc: string;
  Icon: React.ComponentType<{ className?: string }>;
};
const steps: Step[] = [
  {
    title: "Search for Products",
    desc: "Find the best prices from trusted online stores and discover deals instantly.",
    Icon: HiOutlineSearch,
  },
  {
    title: "Compare Prices",
    desc: "Compare options across stores, check history, and pick the best value.",
    Icon: HiOutlineCheckCircle,
  },
  {
    title: "Shop Smart",
    desc: "Save money with alerts and recommendations, then buy confidently.",
    Icon: HiOutlineShoppingCart,
  },
];
export default function HowItWorks() {
  return (
    <div className="min-h-screen bg-gradient-to-b from-[#070A1A] via-[#060818] to-[#050815]">
      {" "}
      {/* space/glow background */}{" "}
      <div className="relative overflow-hidden">
        {" "}
        <div className="pointer-events-none absolute inset-0 opacity-70">
          {" "}
          <div className="absolute left-1/2 top-[-220px] h-[520px] w-[900px] -translate-x-1/2 rounded-full bg-indigo-600/15 blur-3xl" />{" "}
          <div className="absolute left-[15%] top-[140px] h-[300px] w-[300px] rounded-full bg-blue-500/10 blur-3xl" />{" "}
          <div className="absolute right-[12%] top-[120px] h-[300px] w-[300px] rounded-full bg-cyan-500/10 blur-3xl" />{" "}
        </div>{" "}
        <div className="relative mx-auto max-w-7xl px-4 py-16">
          {" "}
          {/* Header */}{" "}
          <div className="text-center">
            {" "}
            <h1 className="text-3xl md:text-4xl font-extrabold text-white">
              {" "}
              How It Works{" "}
            </h1>{" "}
            <p className="mx-auto mt-3 max-w-xl text-sm md:text-base text-white/60">
              {" "}
              Choose from our categories, compare prices, and shop smarter with
              confidence.{" "}
            </p>{" "}
          </div>{" "}
          {/* Card container */}{" "}
          <div className="mt-10 rounded-3xl border border-white/10 bg-white/5 backdrop-blur px-6 py-10">
            {" "}
            <div className="grid gap-6 md:grid-cols-3">
              {" "}
              {steps.map(({ title, desc, Icon }) => (
                <div
                  key={title}
                  className="rounded-2xl border border-white/10 bg-[#070A1A]/30 px-6 py-8 text-center"
                >
                  {" "}
                  <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl border border-white/10 bg-white/5">
                    {" "}
                    <Icon className="h-7 w-7 text-blue-400" />{" "}
                  </div>{" "}
                  <h3 className="mt-5 text-lg font-semibold text-white">
                    {" "}
                    {title}{" "}
                  </h3>{" "}
                  <p className="mt-2 text-sm leading-relaxed text-white/60">
                    {" "}
                    {desc}{" "}
                  </p>{" "}
                </div>
              ))}{" "}
            </div>{" "}
          </div>{" "}
          {/* bottom divider line */}{" "}
          <div className="mt-12 h-px w-full bg-white/10" />{" "}
        </div>{" "}
      </div>{" "}
    </div>
  );
}
