import { useNavigate, useLocation } from "react-router-dom";
import {
  LayoutDashboard,
  Users,
  ShoppingBag,
  BarChart3,
  Settings,
  LogOut,
} from "lucide-react";

export default function AdminSidebar() {
  const navigate = useNavigate();
  const location = useLocation();

  const handleLogout = () => {
    localStorage.removeItem("user");
    localStorage.removeItem("token");
    window.location.href = "/";
  };

  const menuItems = [
    {
      name: "Dashboard",
      path: "/admin",
      icon: <LayoutDashboard size={18} />,
    },
    {
      name: "Users",
      path: "/admin/users",
      icon: <Users size={18} />,
    },
    {
      name: "Products",
      path: "/admin/products",
      icon: <ShoppingBag size={18} />,
    },
    {
      name: "Analytics",
      path: "/admin/analytics",
      icon: <BarChart3 size={18} />,
    },
    {
      name: "Settings",
      path: "/admin/settings",
      icon: <Settings size={18} />,
    },
  ];

  return (
    <aside className="w-72 bg-[#0B1024] border-r border-white/10 p-6 flex flex-col">
      <div className="mb-10">
        <h1 className="text-2xl font-bold text-blue-400">PriceCompare AI</h1>
        <p className="text-sm text-white/50">Admin Panel</p>
      </div>

      <nav className="space-y-3 flex-1">
        {menuItems.map((item) => {
          const isActive = location.pathname === item.path;

          return (
            <button
              key={item.path}
              onClick={() => navigate(item.path)}
              className={`flex items-center gap-3 w-full rounded-xl px-4 py-3 ${
                isActive ? "bg-blue-600" : "hover:bg-white/5"
              }`}
            >
              {item.icon}
              {item.name}
            </button>
          );
        })}
      </nav>

      <button
        onClick={handleLogout}
        className="flex items-center gap-3 rounded-xl bg-red-500/20 px-4 py-3 text-red-400 hover:bg-red-500/30"
      >
        <LogOut size={18} />
        Logout
      </button>
    </aside>
  );
}