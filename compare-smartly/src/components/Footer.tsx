import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { HiMail } from "react-icons/hi";
import { FaGithub, FaLinkedinIn, FaTwitter } from "react-icons/fa";
import { API_BASE_URL } from "../config/api";

type WebsiteSettings = {
  websiteName: string;
  tagline: string;
  contactEmail: string;
  logoUrl: string;
  faviconUrl: string;
  primaryColor: string;
};

export default function Footer() {
  const [websiteSettings, setWebsiteSettings] =
    useState<WebsiteSettings | null>(null);

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

  const websiteName = websiteSettings?.websiteName || "CompareSmartly";
  const tagline =
    websiteSettings?.tagline ||
    "Compare prices from top marketplaces, track deals, and shop smarter with confidence.";
  const contactEmail = websiteSettings?.contactEmail || "support@example.com";
  const logoUrl = websiteSettings?.logoUrl || "";
  const primaryColor = websiteSettings?.primaryColor || "#2563eb";

  return (
    <footer className="relative overflow-hidden">
      <div className="absolute inset-0 z-0 bg-gradient-to-b from-[#070A1A] via-[#060818] to-[#050815]" />

      <div className="pointer-events-none absolute inset-0 z-10 opacity-70">
        <div className="absolute left-1/2 top-[-220px] h-[520px] w-[900px] -translate-x-1/2 rounded-full bg-indigo-600/15 blur-3xl" />
        <div className="absolute left-[12%] top-[160px] h-[260px] w-[260px] rounded-full bg-blue-500/10 blur-3xl" />
        <div className="absolute right-[12%] top-[140px] h-[260px] w-[260px] rounded-full bg-cyan-500/10 blur-3xl" />
      </div>

      <div className="relative z-20 mx-auto max-w-7xl px-4 pt-14">
        <div className="h-px w-full bg-white/10" />

        <div className="grid gap-10 py-12 md:grid-cols-4">
          <div>
            <Link to="/" className="flex items-center gap-2">
              {logoUrl ? (
                <img
                  src={logoUrl}
                  alt={websiteName}
                  className="h-9 w-9 rounded-xl object-cover shadow-sm"
                />
              ) : (
                <div
                  className="h-9 w-9 rounded-xl flex items-center justify-center shadow-sm"
                  style={{ backgroundColor: primaryColor }}
                >
                  <span className="text-white font-bold">⚡</span>
                </div>
              )}

              <span className="text-white font-semibold tracking-wide">
                {websiteName}
              </span>
            </Link>

            <p className="mt-4 text-sm text-white/55 leading-relaxed">
              {tagline}
            </p>

            <div className="mt-5 flex items-center gap-3">
              <a
                href="#"
                className="h-9 w-9 rounded-lg border border-white/10 bg-white/5 backdrop-blur flex items-center justify-center text-white/70 hover:text-white hover:border-white/20 transition"
                aria-label="Twitter"
              >
                <FaTwitter className="h-4 w-4" />
              </a>

              <a
                href="#"
                className="h-9 w-9 rounded-lg border border-white/10 bg-white/5 backdrop-blur flex items-center justify-center text-white/70 hover:text-white hover:border-white/20 transition"
                aria-label="LinkedIn"
              >
                <FaLinkedinIn className="h-4 w-4" />
              </a>

              <a
                href="#"
                className="h-9 w-9 rounded-lg border border-white/10 bg-white/5 backdrop-blur flex items-center justify-center text-white/70 hover:text-white hover:border-white/20 transition"
                aria-label="GitHub"
              >
                <FaGithub className="h-4 w-4" />
              </a>
            </div>
          </div>

          <div>
            <h4 className="text-sm font-semibold text-white">Quick Links</h4>

            <ul className="mt-4 space-y-3 text-sm">
              <li>
                <Link
                  to="/categories"
                  className="text-white/60 hover:text-white transition"
                >
                  Categories
                </Link>
              </li>

              <li>
                <Link
                  to="/features"
                  className="text-white/60 hover:text-white transition"
                >
                  Featured
                </Link>
              </li>

              <li>
                <Link
                  to="/how-it-works"
                  className="text-white/60 hover:text-white transition"
                >
                  How it Works
                </Link>
              </li>

              <li>
                <Link
                  to="/reviews"
                  className="text-white/60 hover:text-white transition"
                >
                  Reviews
                </Link>
              </li>
            </ul>
          </div>

          <div>
            <h4 className="text-sm font-semibold text-white">Company</h4>

            <ul className="mt-4 space-y-3 text-sm">
              <li>
                <Link
                  to="/about"
                  className="text-white/60 hover:text-white transition"
                >
                  About
                </Link>
              </li>

              <li>
                <Link
                  to="/contact"
                  className="text-white/60 hover:text-white transition"
                >
                  Contact
                </Link>
              </li>

              <li>
                <Link
                  to="/support"
                  className="text-white/60 hover:text-white transition"
                >
                  Support
                </Link>
              </li>

              <li>
                <Link
                  to="/privacy"
                  className="text-white/60 hover:text-white transition"
                >
                  Privacy Policy
                </Link>
              </li>
            </ul>
          </div>

          <div>
            <h4 className="text-sm font-semibold text-white">Stay Updated</h4>

            <p className="mt-4 text-sm text-white/55">
              Get deal alerts and new feature updates in your inbox.
            </p>

            <form className="mt-4">
              <div className="flex items-center gap-2 rounded-xl border border-white/10 bg-white/5 backdrop-blur px-3 py-2">
                <HiMail className="h-5 w-5 text-white/50" />

                <input
                  type="email"
                  placeholder={contactEmail}
                  className="w-full bg-transparent text-sm text-white/80 placeholder:text-white/40 outline-none"
                />

                <button
                  type="button"
                  className="rounded-lg px-3 py-2 text-xs font-semibold text-white transition"
                  style={{
                    background: `linear-gradient(135deg, ${primaryColor}, #4f46e5)`,
                  }}
                >
                  Subscribe
                </button>
              </div>
            </form>

            <p className="mt-3 text-xs text-white/40">
              No spam. Unsubscribe anytime.
            </p>
          </div>
        </div>

        <div className="h-px w-full bg-white/10" />

        <div className="flex flex-col gap-2 py-6 text-xs text-white/45 md:flex-row md:items-center md:justify-between">
          <span>
            © {new Date().getFullYear()} {websiteName}. All rights reserved.
          </span>

          <div className="flex gap-4">
            <Link to="/terms" className="hover:text-white transition">
              Terms
            </Link>

            <Link to="/privacy" className="hover:text-white transition">
              Privacy
            </Link>

            <Link to="/cookies" className="hover:text-white transition">
              Cookies
            </Link>
          </div>
        </div>
      </div>
    </footer>
  );
}