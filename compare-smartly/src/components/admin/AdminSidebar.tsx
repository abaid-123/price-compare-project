import { useState } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import {
  LayoutDashboard,
  Users,
  ShoppingBag,
  Settings,
  LogOut,
  Menu,
  X,
} from "lucide-react";

export default function AdminSidebar() {
  const navigate = useNavigate();
  const location = useLocation();
  const [isOpen, setIsOpen] = useState(false);

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
      name: "Settings",
      path: "/admin/settings",
      icon: <Settings size={18} />,
    },
  ];

  const handleNavigate = (path: string) => {
    navigate(path);
    setIsOpen(false);
  };

  return (
    <>
      {/* Mobile Top Bar */}
      <div className="md:hidden fixed top-0 left-0 right-0 z-[60] h-16 bg-[#0B1024] border-b border-white/10 px-4 flex items-center justify-between">
        <div>
          <h1 className="text-lg font-bold text-blue-400">PriceCompare AI</h1>
          <p className="text-xs text-white/50">Admin Panel</p>
        </div>

        <button
          onClick={() => setIsOpen(!isOpen)}
          className="rounded-lg bg-white/10 p-2 text-white hover:bg-white/20 transition"
        >
          {isOpen ? <X size={22} /> : <Menu size={22} />}
        </button>
      </div>

      {/* Mobile Overlay */}
      {isOpen && (
        <div
          onClick={() => setIsOpen(false)}
          className="fixed top-16 left-0 right-0 bottom-0 z-40 bg-black/60 md:hidden"
        />
      )}

      {/* Sidebar */}
      <aside
        className={`fixed md:sticky
        top-16 md:top-0 left-0 z-50
        h-[calc(100vh-4rem)] md:h-screen
        w-72 md:w-20 lg:w-72
        bg-[#0B1024] border-r border-white/10
        p-4 lg:p-6 flex flex-col
        transition-transform duration-300 ease-in-out
        ${isOpen ? "translate-x-0" : "-translate-x-full"}
        md:translate-x-0`}
      >
        {/* Desktop / Tablet Logo Area */}
        <div className="mb-8 hidden md:flex items-center md:justify-center lg:justify-between">
          <div className="hidden lg:block">
            <h1 className="text-2xl font-bold text-blue-400">
              PriceCompare AI
            </h1>
            <p className="text-sm text-white/50">Admin Panel</p>
          </div>

          <div className="hidden md:flex lg:hidden h-11 w-11 items-center justify-center rounded-xl bg-blue-600 text-white font-bold">
            AI
          </div>
        </div>

        {/* Navigation */}
        <nav className="space-y-3 flex-1">
          {menuItems.map((item) => {
            const isActive =
              item.path === "/admin"
                ? location.pathname === "/admin"
                : location.pathname.startsWith(item.path);

            return (
              <button
                key={item.path}
                onClick={() => handleNavigate(item.path)}
                className={`flex items-center gap-3 w-full rounded-xl px-4 py-3 text-left transition
                md:justify-center lg:justify-start
                ${
                  isActive
                    ? "bg-blue-600 text-white"
                    : "text-white/80 hover:bg-white/5 hover:text-white"
                }`}
                title={item.name}
              >
                {item.icon}
                <span className="md:hidden lg:inline">{item.name}</span>
              </button>
            );
          })}
        </nav>

        {/* Logout */}
        <button
          onClick={handleLogout}
          className="flex items-center gap-3 rounded-xl bg-red-500/20 px-4 py-3 text-red-400 hover:bg-red-500/30 transition md:justify-center lg:justify-start"
          title="Logout"
        >
          <LogOut size={18} />
          <span className="md:hidden lg:inline">Logout</span>
        </button>
      </aside>
    </>
  );
}