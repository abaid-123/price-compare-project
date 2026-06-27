import { Link, useNavigate } from "react-router-dom";
import { HiArrowRight } from "react-icons/hi";
import { FiSearch, FiMic, FiCamera } from "react-icons/fi";
import { useEffect, useRef, useState } from "react";
import { API_BASE_URL } from "../config/api";

type WebsiteSettings = {
  websiteName: string;
  tagline: string;
  contactEmail: string;
  logoUrl: string;
  faviconUrl: string;
  primaryColor: string;
};

export default function HeroSection() {
  const [q, setQ] = useState("");
  const [imageLoading, setImageLoading] = useState(false);
  const [websiteSettings, setWebsiteSettings] =
    useState<WebsiteSettings | null>(null);

  const navigate = useNavigate();
  const fileInputRef = useRef<HTMLInputElement | null>(null);

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

  function goCompare() {
    const query = q.trim();
    navigate(query ? `/compare?q=${encodeURIComponent(query)}` : "/compare");
  }

  function startVoiceSearch() {
    const SpeechRecognition =
      (window as any).SpeechRecognition ||
      (window as any).webkitSpeechRecognition;

    if (!SpeechRecognition) {
      alert("Voice search is not supported in this browser.");
      return;
    }

    const recognition = new SpeechRecognition();
    recognition.lang = "en-US";
    recognition.start();

    recognition.onresult = (event: any) => {
      const transcript = event.results[0][0].transcript;
      setQ(transcript);
    };

    recognition.onerror = () => {
      alert("Voice search failed. Please try again.");
    };
  }

  async function handleImageUpload(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;

    setImageLoading(true);

    try {
      const base64 = await new Promise<string>((resolve, reject) => {
        const reader = new FileReader();
        reader.onload = () => {
          const result = reader.result as string;
          resolve(result.split(",")[1]);
        };
        reader.onerror = reject;
        reader.readAsDataURL(file);
      });

      const response = await fetch(
        `${API_BASE_URL}/api/products/image-search`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            imageBase64: base64,
            mimeType: file.type,
          }),
        },
      );

      const data = await response.json();

      if (data.productName) {
        setQ(data.productName);
        navigate(`/compare?q=${encodeURIComponent(data.productName)}`);
      } else {
        alert("Could not detect the product. Please try a clearer image.");
      }
    } catch (err) {
      console.error("Image search error:", err);
      alert("Something went wrong. Please try again.");
    } finally {
      setImageLoading(false);
      if (fileInputRef.current) fileInputRef.current.value = "";
    }
  }

  
  const tagline =
    websiteSettings?.tagline ||
    "Find the best deals across hundreds of online stores with AI-powered recommendations.";
  const primaryColor = websiteSettings?.primaryColor || "#2563eb";

  return (
    <section className="relative overflow-hidden">
      <div className="absolute inset-0 bg-gradient-to-b from-[#070A1A] via-[#060818] to-[#050815]" />

      <div className="pointer-events-none absolute left-1/2 top-[-120px] h-[380px] w-[380px] -translate-x-1/2 rounded-full bg-blue-600/20 blur-3xl" />
      <div className="pointer-events-none absolute left-[15%] top-[120px] h-[260px] w-[260px] rounded-full bg-indigo-500/15 blur-3xl" />
      <div className="pointer-events-none absolute right-[15%] top-[160px] h-[260px] w-[260px] rounded-full bg-cyan-500/10 blur-3xl" />

      <div className="relative mx-auto max-w-7xl px-4 pt-16 pb-12 md:pt-24 md:pb-20">
        <div className="mx-auto max-w-4xl text-center">
          <h1 className="text-4xl md:text-6xl font-extrabold tracking-tight text-white">
            Compare Prices{" "}
            <span className="bg-gradient-to-r from-blue-400 to-cyan-400 bg-clip-text text-transparent">
              Smartly
            </span>
            <br />
            <span className="text-white/85">Save Money Instantly</span>
          </h1>

          <p className="mx-auto mt-5 max-w-xl text-sm md:text-lg text-white/60 leading-relaxed">
            {tagline}
          </p>

          <div className="mx-auto mt-7 max-w-2xl">
            <div
              className="
                group relative flex items-center gap-2 rounded-2xl
                border border-white/10 bg-white/5 backdrop-blur
                px-3 py-3 shadow-lg shadow-blue-500/10
                transition-all duration-500 ease-out
                hover:border-blue-400/50 hover:bg-white/10
                hover:shadow-blue-500/30 hover:scale-[1.02]
                focus-within:border-cyan-400/60 focus-within:bg-white/10
                focus-within:shadow-cyan-500/30 focus-within:scale-[1.02]
              "
            >
              <div
                className="
                  pointer-events-none absolute inset-0 rounded-2xl
                  bg-gradient-to-r from-blue-500/0 via-cyan-400/10 to-indigo-500/0
                  opacity-0 blur-xl transition-opacity duration-500
                  group-hover:opacity-100 group-focus-within:opacity-100
                "
              />

              <div
                className="
                  pointer-events-none absolute inset-[1px] rounded-2xl
                  bg-gradient-to-r from-blue-500/10 via-cyan-400/10 to-indigo-500/10
                  opacity-0 transition-opacity duration-500
                  group-hover:opacity-100 group-focus-within:opacity-100
                "
              />

              <FiSearch
                className="
                  relative z-10 h-5 w-5 text-white/50
                  transition-all duration-300
                  group-hover:text-cyan-300 group-focus-within:text-cyan-300
                  group-hover:scale-110 group-focus-within:scale-110
                "
              />

              <input
                value={q}
                onChange={(e) => setQ(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === "Enter") goCompare();
                }}
                placeholder="Search a product e.g. laptop, mobile phone, airpods"
                className="
                  relative z-10 w-full bg-transparent text-sm md:text-base text-white
                  placeholder:text-white/35 outline-none
                  transition-all duration-300
                  focus:placeholder:text-white/20
                "
              />

              <button
                onClick={() => fileInputRef.current?.click()}
                disabled={imageLoading}
                className="
                  relative z-10 p-2 rounded-lg
                  transition-all duration-300
                  hover:bg-white/10 hover:scale-110 hover:text-cyan-300
                  active:scale-95 disabled:opacity-50 disabled:cursor-not-allowed
                "
                title="Upload image to search"
              >
                {imageLoading ? (
                  <div className="h-5 w-5 border-2 border-white/30 border-t-cyan-300 rounded-full animate-spin" />
                ) : (
                  <FiCamera className="h-5 w-5 text-white/70 transition-colors duration-300" />
                )}
              </button>

              <input
                type="file"
                accept="image/*"
                ref={fileInputRef}
                onChange={handleImageUpload}
                className="hidden"
              />

              <button
                onClick={startVoiceSearch}
                className="
                  relative z-10 p-2 rounded-lg
                  transition-all duration-300
                  hover:bg-white/10 hover:scale-110
                  active:scale-95
                "
                title="Voice search"
              >
                <FiMic className="h-5 w-5 text-white/70 transition-colors duration-300 hover:text-cyan-300" />
              </button>

              <button
                type="button"
                onClick={goCompare}
                className="
                  relative z-10 inline-flex items-center justify-center gap-2 rounded-xl
                  px-3 py-2 md:px-4 md:py-2
                  text-xs md:text-sm font-semibold text-white
                  transition-all duration-300 ease-out
                  hover:shadow-lg hover:shadow-cyan-500/30
                  hover:scale-105 active:scale-95
                  whitespace-nowrap
                "
                style={{
                  background: `linear-gradient(135deg, ${primaryColor}, #4f46e5)`,
                }}
              >
                <span className="hidden sm:inline">Search & Compare</span>
                <span className="sm:hidden">Search</span>
                <HiArrowRight className="w-4 h-4 transition-transform duration-300 group-hover:translate-x-1" />
              </button>
            </div>

            <div className="mt-3">
              <Link
                to="/how-it-works"
                className="text-xs md:text-sm text-white/55 hover:text-white/80 transition underline underline-offset-4"
              >
                How it works →
              </Link>
            </div>
          </div>
        </div>

        <div className="mt-12 h-px w-full bg-white/10" />
      </div>
    </section>
  );
}
