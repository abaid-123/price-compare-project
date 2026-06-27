import { useEffect, useRef, useState } from "react";
import { Link } from "react-router-dom";
import { HiOutlineMenu, HiX, HiChevronDown } from "react-icons/hi";
import { API_BASE_URL } from "../config/api";

type NavBarProps = {
  onOpenSignIn: () => void;
  onOpenSignUp: () => void;
};

type WebsiteSettings = {
  websiteName: string;
  tagline: string;
  contactEmail: string;
  logoUrl: string;
  faviconUrl: string;
  primaryColor: string;
};

const Navbar = ({ onOpenSignIn, onOpenSignUp }: NavBarProps) => {
  const [open, setOpen] = useState(false);
  const [catOpen, setCatOpen] = useState(false);
  const [websiteSettings, setWebsiteSettings] =
    useState<WebsiteSettings | null>(null);

  const catRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    const fetchWebsiteSettings = async () => {
      try {
        const res = await fetch(`${API_BASE_URL}/api/settings/website`);
        const data = await res.json();

        if (res.ok) {
          setWebsiteSettings(data);
        }
      } catch (error) {
        console.error("Website settings fetch error:", error);
      }
    };

    fetchWebsiteSettings();
  }, []);

  useEffect(() => {
    const onDown = (e: MouseEvent) => {
      if (!catRef.current) return;
      if (!catRef.current.contains(e.target as Node)) setCatOpen(false);
    };

    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") setCatOpen(false);
    };

    document.addEventListener("mousedown", onDown);
    document.addEventListener("keydown", onKey);

    return () => {
      document.removeEventListener("mousedown", onDown);
      document.removeEventListener("keydown", onKey);
    };
  }, []);

  const websiteName = websiteSettings?.websiteName || "CompareSmartly";
  const logoUrl = websiteSettings?.logoUrl || "";
  const primaryColor = websiteSettings?.primaryColor || "#2563eb";

  return (
    <header className="relative z-50 w-full">
      <div className="bg-gradient-to-r from-[#070A1A] via-[#0A0F2A] to-[#070A1A] border-b border-white/10">
        <div className="mx-auto max-w-7xl px-4">
          <div className="grid h-16 grid-cols-2 md:grid-cols-3 items-center">
            <div className="flex items-center">
              <Link to="/" className="flex items-center gap-2">
                {logoUrl ? (
                  <img
                    src={logoUrl}
                    alt={websiteName}
                    className="h-8 w-8 rounded-lg object-cover"
                  />
                ) : (
                  <div
                    className="h-8 w-8 rounded-lg flex items-center justify-center"
                    style={{ backgroundColor: primaryColor }}
                  >
                    <span className="text-white">⚡</span>
                  </div>
                )}

                <span className="text-white font-bold tracking-wide">
                  {websiteName}
                </span>
              </Link>
            </div>

            <nav className="hidden md:flex items-center justify-center gap-4">
              <Link
                to="/"
                className="text-sm text-white/70 hover:text-white transition"
              >
                Home
              </Link>

              <div className="relative" ref={catRef}>
                <button
                  type="button"
                  onClick={() => setCatOpen((v) => !v)}
                  className="text-sm text-white/70 hover:text-white transition inline-flex items-center gap-1"
                  aria-haspopup="menu"
                  aria-expanded={catOpen}
                >
                  Categories <HiChevronDown className="text-white/50 w-4 h-4" />
                </button>

                {catOpen && (
                  <div
                    role="menu"
                    className="absolute left-0 top-full mt-3 w-56 rounded-xl border border-white/10 bg-[#070A1A]/95 backdrop-blur shadow-lg p-2 z-50"
                  >
                    <Link
                      to="/categories/electronics"
                      className="block rounded-lg px-3 py-2 text-sm text-white/80 hover:text-white hover:bg-white/5 transition"
                      onClick={() => setCatOpen(false)}
                      role="menuitem"
                    >
                      Electronics
                    </Link>

                    <Link
                      to="/categories/fashion"
                      className="block rounded-lg px-3 py-2 text-sm text-white/80 hover:text-white hover:bg-white/5 transition"
                      onClick={() => setCatOpen(false)}
                      role="menuitem"
                    >
                      Fashion
                    </Link>

                    <Link
                      to="/categories/sports"
                      className="block rounded-lg px-3 py-2 text-sm text-white/80 hover:text-white hover:bg-white/5 transition"
                      onClick={() => setCatOpen(false)}
                      role="menuitem"
                    >
                      Sports
                    </Link>

                    <Link
                      to="/categories/beauty"
                      className="block rounded-lg px-3 py-2 text-sm text-white/80 hover:text-white hover:bg-white/5 transition"
                      onClick={() => setCatOpen(false)}
                      role="menuitem"
                    >
                      Beauty
                    </Link>

                    <Link
                      to="/categories/gaming"
                      className="block rounded-lg px-3 py-2 text-sm text-white/80 hover:text-white hover:bg-white/5 transition"
                      onClick={() => setCatOpen(false)}
                      role="menuitem"
                    >
                      Gaming
                    </Link>

                    <div className="my-2 h-px bg-white/10" />

                    <Link
                      to="/categories"
                      className="block rounded-lg px-3 py-2 text-sm text-white/80 hover:text-white hover:bg-white/5 transition"
                      onClick={() => setCatOpen(false)}
                      role="menuitem"
                    >
                      View all categories →
                    </Link>
                  </div>
                )}
              </div>

              <Link
                to="/features"
                className="text-sm text-white/70 hover:text-white transition"
              >
                Features
              </Link>

              <Link
                to="/how-it-works"
                className="text-sm text-white/70 hover:text-white transition"
              >
                How it Works
              </Link>

              <Link
                to="/reviews"
                className="text-sm text-white/70 hover:text-white transition"
              >
                Reviews
              </Link>
            </nav>

            <div className="hidden md:flex items-center justify-end gap-4">
              <button
                onClick={() => onOpenSignIn()}
                className="text-sm text-white/70 hover:text-white transition"
              >
                Sign In
              </button>

              <button
                onClick={() => onOpenSignUp()}
                className="text-sm font-semibold text-white px-4 py-2 rounded-lg bg-gradient-to-r from-blue-500 to-indigo-600 hover:from-blue-400 hover:to-indigo-500 transition"
              >
                Get Started
              </button>
            </div>

            <div className="md:hidden flex justify-end">
              <button
                onClick={() => setOpen((v) => !v)}
                className="border border-white/10 rounded-lg px-3 py-2 text-white"
                aria-label="Toggle menu"
              >
                {open ? <HiX size={22} /> : <HiOutlineMenu size={22} />}
              </button>
            </div>
          </div>

          {open && (
            <div className="md:hidden pb-4">
              <div className="mt-2 rounded-xl bg-white/5 border border-white/10 p-4 space-y-3">
                <Link
                  to="/"
                  className="block text-sm text-white/80 hover:text-white transition"
                  onClick={() => setOpen(false)}
                >
                  Home
                </Link>

                <Link
                  to="/categories"
                  className="block text-sm text-white/80 hover:text-white transition"
                  onClick={() => setOpen(false)}
                >
                  Categories
                </Link>

                <Link
                  to="/features"
                  className="block text-sm text-white/80 hover:text-white transition"
                  onClick={() => setOpen(false)}
                >
                  Features
                </Link>

                <Link
                  to="/how-it-works"
                  className="block text-sm text-white/80 hover:text-white transition"
                  onClick={() => setOpen(false)}
                >
                  How it Works
                </Link>

                <Link
                  to="/reviews"
                  className="block text-sm text-white/80 hover:text-white transition"
                  onClick={() => setOpen(false)}
                >
                  Reviews
                </Link>

                <div className="h-px bg-white/10 my-2" />

                <div className="flex justify-between items-center">
                  <button
                    onClick={() => onOpenSignIn()}
                    className="text-sm text-white/70 hover:text-white transition"
                  >
                    Sign In
                  </button>

                  <button
                    onClick={() => {
                      onOpenSignUp();
                      setOpen(false);
                    }}
                    className="block text-center font-semibold text-white px-4 py-2 rounded-lg bg-gradient-to-r from-blue-500 to-indigo-600"
                  >
                    Get Started
                  </button>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </header>
  );
};

export default Navbar;
