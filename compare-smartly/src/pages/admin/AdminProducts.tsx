import AdminSidebar from "../../components/admin/AdminSidebar";
import { Play, Square } from "lucide-react";
import { API_BASE_URL } from "../../config/api";

export default function AdminProducts() {
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

  return (
    <div className="min-h-screen bg-[#050815] text-white flex">
      <AdminSidebar />

      <main className="flex-1 p-8">
        <div className="mb-8">
          <h2 className="text-3xl font-bold">Products</h2>
          <p className="text-white/50">Manage product section</p>
        </div>

        <div className="rounded-2xl bg-[#0B1024] border border-white/10 p-6 max-w-xl">
          <h3 className="text-xl font-bold mb-2">Daraz Scraper</h3>

          <p className="text-white/50 text-sm mb-6">
            Start or stop Daraz product scraping from admin panel.
          </p>

          <div className="flex gap-4">
            <button
              onClick={startDarazScraper}
              className="flex items-center gap-2 rounded-xl bg-green-600 px-5 py-3 font-medium hover:bg-green-700"
            >
              <Play size={18} />
              Start Daraz Scraper
            </button>

            <button
              onClick={stopDarazScraper}
              className="flex items-center gap-2 rounded-xl bg-red-600 px-5 py-3 font-medium hover:bg-red-700"
            >
              <Square size={18} />
              Stop Daraz Scraper
            </button>
          </div>
        </div>
      </main>
    </div>
  );
}