import { useEffect, useState } from "react";
import { Search, Bell, Package, Star, BarChart3, Users } from "lucide-react";
import AdminSidebar from "../../components/admin/AdminSidebar";
import { API_BASE_URL } from "../../config/api";

export default function AdminPage() {
  const [totalUsers, setTotalUsers] = useState(0);
  const [totalProducts, setTotalProducts] = useState(0);

  useEffect(() => {
    const fetchUserCount = async () => {
      const token = localStorage.getItem("token");

      if (!token) {
        window.location.href = "/";
        return;
      }

      const res = await fetch(`${API_BASE_URL}/api/admin/users/count`, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      const data = await res.json();

      if (res.ok) {
        setTotalUsers(data.totalUsers);
      }
    };

    const fetchProductCount = async () => {
      const res = await fetch(`${API_BASE_URL}/api/products/count/all`);
      const data = await res.json();

      if (res.ok) {
        setTotalProducts(data.totalProducts);
      }
    };

    fetchUserCount();
    fetchProductCount();
  }, []);

  return (
    <div className="min-h-screen bg-[#050815] text-white flex">
      <AdminSidebar />

      <main className="flex-1 w-full p-4 pt-24 md:p-6 md:pt-6 lg:p-8 overflow-x-hidden">
        <div className="flex items-start justify-between gap-4 mb-8">
          <div>
            <h2 className="text-2xl md:text-3xl font-bold">Admin Dashboard</h2>
            <p className="text-white/50 text-sm md:text-base">
              Manage users, products, and analytics
            </p>
          </div>

          {/* Hide on mobile, show on tablet/desktop */}
          <div className="hidden sm:flex items-center gap-3">
            <button className="p-3 rounded-xl bg-white/5 hover:bg-white/10">
              <Search size={18} />
            </button>

            <button className="p-3 rounded-xl bg-white/5 hover:bg-white/10">
              <Bell size={18} />
            </button>

            <div className="w-10 h-10 rounded-full bg-blue-500 flex items-center justify-center font-bold">
              A
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4 md:gap-6 mb-8">
          <div className="rounded-2xl bg-[#0B1024] p-5 md:p-6 border border-white/10">
            <Users className="mb-4 text-blue-400" />
            <p className="text-white/50 text-sm">Total Users</p>
            <h3 className="text-2xl font-bold">{totalUsers}</h3>
          </div>

          <div className="rounded-2xl bg-[#0B1024] p-5 md:p-6 border border-white/10">
            <Package className="mb-4 text-green-400" />
            <p className="text-white/50 text-sm">Products</p>
            <h3 className="text-2xl font-bold">{totalProducts}</h3>
          </div>

          <div className="rounded-2xl bg-[#0B1024] p-5 md:p-6 border border-white/10">
            <Star className="mb-4 text-yellow-400" />
            <p className="text-white/50 text-sm">Reviews</p>
            <h3 className="text-2xl font-bold">3,590</h3>
          </div>

          <div className="rounded-2xl bg-[#0B1024] p-5 md:p-6 border border-white/10">
            <BarChart3 className="mb-4 text-purple-400" />
            <p className="text-white/50 text-sm">Revenue</p>
            <h3 className="text-2xl font-bold">$12,450</h3>
          </div>
        </div>
      </main>
    </div>
  );
}
