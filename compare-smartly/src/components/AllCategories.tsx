import { Link } from "react-router-dom";
import {
  HiDeviceMobile,
  HiOutlineSparkles,
  HiOutlineTruck,
  HiOutlineBookOpen,
  HiOutlinePuzzle,
  HiHome,
} from "react-icons/hi";
import { FaBaby } from "react-icons/fa";

type Category = {
  title: string;
  subtitle: string;
  to: string;
  Icon: React.ComponentType<{ className?: string }>;
};

const categories: Category[] = [
  {
    title: "Electronics",
    subtitle: "Phones, Laptops, TVs",
    to: "/categories/electronics",
    Icon: HiDeviceMobile,
  },
  {
    title: "Fashion",
    subtitle: "Clothing, Shoes",
    to: "/categories/fashion",
    Icon: HiOutlineSparkles,
  },
  {
    title: "Sports",
    subtitle: "Fitness, Camping",
    to: "/categories/sports",
    Icon: HiOutlinePuzzle,
  },
  {
    title: "Beauty",
    subtitle: "Skincare, Makeup",
    to: "/categories/beauty",
    Icon: HiOutlineSparkles,
  },
  {
    title: "Automotive",
    subtitle: "Parts, Accessories",
    to: "/categories/automotive",
    Icon: HiOutlineTruck,
  },
  {
    title: "Gaming",
    subtitle: "Consoles, Games",
    to: "/categories/gaming",
    Icon: HiOutlinePuzzle,
  },
  {
    title: "Books",
    subtitle: "Books, Music",
    to: "/categories/books",
    Icon: HiOutlineBookOpen,
  },
  {
    title: "Baby & Kids",
    subtitle: "Toys, Clothing",
    to: "/categories/baby-kids",
    Icon: FaBaby,
  },
  {
    title: "Home & Living",
    subtitle: "Furniture, Decor",
    to: "/categories/home-living",
    Icon: HiHome,
  },
];

const AllCategories = () => {
  return (
    <section className="relative overflow-hidden min-h-screen">
      <div className="absolute inset-0 z-0 bg-gradient-to-b from-[#070A1A] via-[#060818] to-[#050815]" />

      <div className="pointer-events-none absolute inset-0 z-10 opacity-70">
        <div className="absolute left-1/2 top-[-220px] h-[520px] w-[900px] -translate-x-1/2 rounded-full bg-indigo-600/15 blur-3xl" />
        <div className="absolute left-[15%] top-[140px] h-[300px] w-[300px] rounded-full bg-blue-500/10 blur-3xl" />
        <div className="absolute right-[12%] top-[120px] h-[300px] w-[300px] rounded-full bg-cyan-500/10 blur-3xl" />
      </div>

      <div className="relative z-20 mx-auto max-w-7xl px-4 py-16">
        <div className="text-center">
          <h2 className="text-3xl md:text-4xl font-extrabold text-white">
            Shop by Category
          </h2>

          <p className="mx-auto mt-3 max-w-2xl text-sm md:text-base text-white/60">
            Explore our product categories with real-time price comparisons.
          </p>
        </div>

        <div className="mt-10 grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-4">
          {categories.map(({ title, subtitle, to, Icon }) => (
            <Link
              key={title}
              to={to}
              className="group relative flex h-full min-h-[150px] sm:min-h-[170px] lg:min-h-[190px]
              flex-col items-center justify-center rounded-2xl border border-white/10
              bg-white/5 px-4 py-5 text-center backdrop-blur
              transition hover:border-white/20 hover:bg-white/10"
            >
              <div className="relative mx-auto flex h-12 w-12 items-center justify-center rounded-xl bg-white/5 border border-white/10">
                <Icon className="h-6 w-6 text-white/80 group-hover:text-white transition" />
              </div>

              <div className="relative mt-3">
                <p className="text-sm font-semibold text-white">{title}</p>
                <p className="mt-1 text-xs text-white/50">{subtitle}</p>
              </div>
            </Link>
          ))}
        </div>

        <div className="mt-12 h-px w-full bg-white/10" />
      </div>
    </section>
  );
};

export default AllCategories;