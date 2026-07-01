import AdminSidebar from "../../components/admin/AdminSidebar";
// import { Play, Square } from "lucide-react";
// import { API_BASE_URL } from "../../config/api";

export default function AdminProducts() {
  /*
  Start/Stop scraper feature disabled.
  Ab scraper manual command ya GitHub Actions cron job se run hoga.

  const startDarazScraper = async () => {
    try {
      const token = localStorage.getItem("token");

      const res = await fetch(`${API_BASE_URL}/api/admin/scraper/start`, {
        method: "POST",
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      const data = await res.json();

      if (res.ok) {
        alert(data.message || "Daraz scraper started");
      } else {
        alert(data.message || "Failed to start scraper");
      }
    } catch (error) {
      console.error(error);
      alert("Something went wrong while starting scraper");
    }
  };

  const stopDarazScraper = async () => {
    try {
      const token = localStorage.getItem("token");

      const res = await fetch(`${API_BASE_URL}/api/admin/scraper/stop`, {
        method: "POST",
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      const data = await res.json();

      if (res.ok) {
        alert(data.message || "Daraz scraper stopped");
      } else {
        alert(data.message || "Failed to stop scraper");
      }
    } catch (error) {
      console.error(error);
      alert("Something went wrong while stopping scraper");
    }
  };
  */

  return (
    <div className="min-h-screen bg-[#050815] text-white flex">
      <AdminSidebar />

      <main className="flex-1 w-full p-4 pt-24 md:p-6 md:pt-6 lg:p-8 overflow-x-hidden">
        <div className="mb-8">
          <h2 className="text-2xl md:text-3xl font-bold">Products</h2>
          <p className="text-white/50 text-sm md:text-base">
            Manage product section
          </p>
        </div>

        <div className="rounded-2xl bg-[#0B1024] border border-white/10 p-5 md:p-6 w-full max-w-2xl">
          <h3 className="text-lg md:text-xl font-bold mb-2">
            Product Scraper
          </h3>

          <p className="text-white/50 text-sm">
            Start/stop scraper feature is disabled. Scraper will be run manually
            from terminal or automatically through GitHub Actions cron job.
          </p>

          {/*
          Start/Stop buttons disabled.

          <div className="flex flex-col sm:flex-row gap-4">
            <button
              onClick={startDarazScraper}
              className="w-full sm:w-auto flex items-center justify-center gap-2 rounded-xl bg-green-600 px-5 py-3 font-medium hover:bg-green-700"
            >
              <Play size={18} />
              Start Daraz Scraper
            </button>

            <button
              onClick={stopDarazScraper}
              className="w-full sm:w-auto flex items-center justify-center gap-2 rounded-xl bg-red-600 px-5 py-3 font-medium hover:bg-red-700"
            >
              <Square size={18} />
              Stop Daraz Scraper
            </button>
          </div>
          */}
        </div>
      </main>
    </div>
  );
}