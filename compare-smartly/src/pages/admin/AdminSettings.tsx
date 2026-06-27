import { useEffect, useState } from "react";
import AdminSidebar from "../../components/admin/AdminSidebar";
import {
  User,
  Globe,
  Bot,
  Package,
  Tags,
  Shield,
  Bell,
  KeyRound,
  Save,
  ArrowLeft,
} from "lucide-react";
import { API_BASE_URL } from "../../config/api";

type SettingKey =
  | "website"
  | "profile"
  | "scraper"
  | "product"
  | "category"
  | "security"
  | "notification"
  | "api";

type WebsiteSettings = {
  websiteName: string;
  tagline: string;
  contactEmail: string;
  logoUrl: string;
  faviconUrl: string;
  primaryColor: string;
};

type AdminProfile = {
  id: number;
  full_name: string;
  email: string;
  role: string;
};

const defaultWebsiteSettings: WebsiteSettings = {
  websiteName: "PriceCompare AI",
  tagline: "Compare prices smartly and save money instantly.",
  contactEmail: "support@pricecompareai.com",
  logoUrl: "",
  faviconUrl: "/favicon.svg",
  primaryColor: "#2563eb",
};

const settings = [
  {
    key: "website" as SettingKey,
    title: "Website Settings",
    description: "Website name, logo, favicon, tagline, and contact email.",
    icon: <Globe size={22} className="text-cyan-400" />,
  },
  {
    key: "profile" as SettingKey,
    title: "Profile Settings",
    description: "Admin name, email, password change, and avatar management.",
    icon: <User size={22} className="text-blue-400" />,
  },
  {
    key: "scraper" as SettingKey,
    title: "Scraper Settings",
    description:
      "Enable or disable Daraz scraper, set max pages, products per search, and scraping interval.",
    icon: <Bot size={22} className="text-green-400" />,
  },
  {
    key: "product" as SettingKey,
    title: "Product Settings",
    description:
      "Manage products per page, default sorting, reviews visibility, and category labels.",
    icon: <Package size={22} className="text-purple-400" />,
  },
  {
    key: "category" as SettingKey,
    title: "Category Settings",
    description:
      "Enable or disable categories, manage category name, slug, and search terms.",
    icon: <Tags size={22} className="text-yellow-400" />,
  },
  {
    key: "security" as SettingKey,
    title: "Security Settings",
    description:
      "Change password, manage token expiry, logout from all devices, and two-factor authentication.",
    icon: <Shield size={22} className="text-red-400" />,
  },
  {
    key: "notification" as SettingKey,
    title: "Notification Settings",
    description:
      "Email alerts for new users, scraper failures, and low product count.",
    icon: <Bell size={22} className="text-orange-400" />,
  },
  {
    key: "api" as SettingKey,
    title: "API / Integration Settings",
    description:
      "Manage Daraz scraper status, Apify API key, OpenAI API key, and image search API key.",
    icon: <KeyRound size={22} className="text-indigo-400" />,
  },
];

export default function AdminSettings() {
  const [activeSetting, setActiveSetting] = useState<SettingKey | null>(null);

  const [websiteSettings, setWebsiteSettings] = useState<WebsiteSettings>(
    defaultWebsiteSettings,
  );

  const [adminProfile, setAdminProfile] = useState<AdminProfile>({
    id: 0,
    full_name: "",
    email: "",
    role: "admin",
  });

  const [passwordForm, setPasswordForm] = useState({
    currentPassword: "",
    newPassword: "",
  });

  const [loading, setLoading] = useState(false);
  const [saved, setSaved] = useState("");

  useEffect(() => {
    fetchWebsiteSettings();
  }, []);

  useEffect(() => {
    if (activeSetting === "profile") {
      fetchAdminProfile();
    }
  }, [activeSetting]);

  const getToken = () => {
    return localStorage.getItem("token");
  };

  const fetchWebsiteSettings = async () => {
    try {
      const res = await fetch(`${API_BASE_URL}/api/settings/website`);
      const data = await res.json();

      if (res.ok) {
        setWebsiteSettings(data);
      }
    } catch (error) {
      console.error("Fetch website settings error:", error);
    }
  };

  const fetchAdminProfile = async () => {
    try {
      const token = getToken();

      const res = await fetch(`${API_BASE_URL}/api/admin/profile`, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      const data = await res.json();

      if (res.ok) {
        setAdminProfile(data);
      } else {
        alert(data.message || "Failed to fetch admin profile");
      }
    } catch (error) {
      console.error("Fetch admin profile error:", error);
      alert("Something went wrong while fetching profile");
    }
  };

  const handleWebsiteChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>,
  ) => {
    const { name, value } = e.target;

    setWebsiteSettings((prev) => ({
      ...prev,
      [name]: value,
    }));

    setSaved("");
  };

  const handleWebsiteSave = async () => {
    try {
      setLoading(true);

      const res = await fetch(`${API_BASE_URL}/api/settings/website`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(websiteSettings),
      });

      const data = await res.json();

      if (res.ok) {
        setWebsiteSettings(data.settings);
        setSaved("Website settings saved in database");
      } else {
        alert(data.message || "Failed to save website settings");
      }
    } catch (error) {
      console.error("Save website settings error:", error);
      alert("Something went wrong while saving website settings");
    } finally {
      setLoading(false);
    }
  };

  const handleWebsiteReset = () => {
    setWebsiteSettings(defaultWebsiteSettings);
    setSaved("");
  };

  const handleProfileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;

    setAdminProfile((prev) => ({
      ...prev,
      [name]: value,
    }));

    setSaved("");
  };

  const handleProfileSave = async () => {
    try {
      setLoading(true);
      const token = getToken();

      const res = await fetch(`${API_BASE_URL}/api/admin/profile`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          full_name: adminProfile.full_name,
          email: adminProfile.email,
        }),
      });

      const data = await res.json();

      if (res.ok) {
        setAdminProfile(data.user);
        setSaved("Profile updated successfully");
      } else {
        alert(data.message || "Failed to update profile");
      }
    } catch (error) {
      console.error("Update profile error:", error);
      alert("Something went wrong while updating profile");
    } finally {
      setLoading(false);
    }
  };

  const handlePasswordChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;

    setPasswordForm((prev) => ({
      ...prev,
      [name]: value,
    }));

    setSaved("");
  };

  const handlePasswordSave = async () => {
    try {
      setLoading(true);
      const token = getToken();

      const res = await fetch(`${API_BASE_URL}/api/admin/profile/password`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify(passwordForm),
      });

      const data = await res.json();

      if (res.ok) {
        setPasswordForm({
          currentPassword: "",
          newPassword: "",
        });

        setSaved("Password changed successfully");
      } else {
        alert(data.message || "Failed to change password");
      }
    } catch (error) {
      console.error("Change password error:", error);
      alert("Something went wrong while changing password");
    } finally {
      setLoading(false);
    }
  };

  const renderWebsiteSettings = () => {
    return (
      <div className="max-w-4xl rounded-2xl bg-[#0B1024] border border-white/10 p-6">
        <button
          onClick={() => {
            setActiveSetting(null);
            setSaved("");
          }}
          className="mb-6 inline-flex items-center gap-2 text-sm text-white/60 hover:text-white"
        >
          <ArrowLeft size={18} />
          Back to Settings
        </button>

        <div className="mb-6 flex items-center gap-3">
          <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-blue-500/10 border border-blue-500/20">
            <Globe className="text-blue-400" size={24} />
          </div>

          <div>
            <h3 className="text-xl font-bold">Website Settings</h3>
            <p className="text-sm text-white/50">
              Update website name, tagline, logo, favicon, and contact email
            </p>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
          <div>
            <label className="mb-2 block text-sm text-white/70">
              Website Name
            </label>
            <input
              type="text"
              name="websiteName"
              value={websiteSettings.websiteName}
              onChange={handleWebsiteChange}
              className="w-full rounded-xl border border-white/10 bg-white/5 px-4 py-3 text-sm text-white outline-none focus:border-blue-500"
            />
          </div>

          <div>
            <label className="mb-2 block text-sm text-white/70">
              Contact Email
            </label>
            <input
              type="email"
              name="contactEmail"
              value={websiteSettings.contactEmail}
              onChange={handleWebsiteChange}
              className="w-full rounded-xl border border-white/10 bg-white/5 px-4 py-3 text-sm text-white outline-none focus:border-blue-500"
            />
          </div>

          <div className="md:col-span-2">
            <label className="mb-2 block text-sm text-white/70">
              Website Tagline
            </label>
            <textarea
              name="tagline"
              value={websiteSettings.tagline}
              onChange={handleWebsiteChange}
              rows={3}
              className="w-full resize-none rounded-xl border border-white/10 bg-white/5 px-4 py-3 text-sm text-white outline-none focus:border-blue-500"
            />
          </div>

          <div>
            <label className="mb-2 block text-sm text-white/70">Logo URL</label>
            <input
              type="text"
              name="logoUrl"
              value={websiteSettings.logoUrl}
              onChange={handleWebsiteChange}
              className="w-full rounded-xl border border-white/10 bg-white/5 px-4 py-3 text-sm text-white outline-none focus:border-blue-500"
            />
          </div>

          <div>
            <label className="mb-2 block text-sm text-white/70">
              Favicon URL
            </label>
            <input
              type="text"
              name="faviconUrl"
              value={websiteSettings.faviconUrl}
              onChange={handleWebsiteChange}
              className="w-full rounded-xl border border-white/10 bg-white/5 px-4 py-3 text-sm text-white outline-none focus:border-blue-500"
            />
          </div>

          <div>
            <label className="mb-2 block text-sm text-white/70">
              Primary Color
            </label>
            <input
              type="color"
              name="primaryColor"
              value={websiteSettings.primaryColor}
              onChange={handleWebsiteChange}
              className="h-12 w-full cursor-pointer rounded-xl border border-white/10 bg-white/5 px-2 py-2"
            />
          </div>
        </div>

        <div className="mt-8 rounded-2xl border border-white/10 bg-white/5 p-5">
          <h4 className="mb-3 text-lg font-bold">Preview</h4>

          <div className="flex items-center gap-4">
            {websiteSettings.logoUrl ? (
              <img
                src={websiteSettings.logoUrl}
                alt="Website Logo"
                className="h-12 w-12 rounded-xl object-cover"
              />
            ) : (
              <div
                className="flex h-12 w-12 items-center justify-center rounded-xl text-white font-bold"
                style={{ backgroundColor: websiteSettings.primaryColor }}
              >
                ⚡
              </div>
            )}

            <div>
              <h5 className="text-lg font-bold">
                {websiteSettings.websiteName}
              </h5>
              <p className="text-sm text-white/50">{websiteSettings.tagline}</p>
              <p className="text-xs text-white/40 mt-1">
                {websiteSettings.contactEmail}
              </p>
            </div>
          </div>
        </div>

        <div className="mt-6 flex items-center gap-4">
          <button
            onClick={handleWebsiteSave}
            disabled={loading}
            className="inline-flex items-center gap-2 rounded-xl bg-blue-600 px-5 py-3 text-sm font-semibold text-white hover:bg-blue-700 transition disabled:opacity-50"
          >
            <Save size={18} />
            {loading ? "Saving..." : "Save Website Settings"}
          </button>

          <button
            onClick={handleWebsiteReset}
            className="rounded-xl bg-white/10 px-5 py-3 text-sm font-semibold text-white hover:bg-white/15 transition"
          >
            Reset
          </button>

          {saved && <span className="text-sm text-green-400">{saved}</span>}
        </div>
      </div>
    );
  };

  const renderProfileSettings = () => {
    return (
      <div className="max-w-4xl rounded-2xl bg-[#0B1024] border border-white/10 p-6">
        <button
          onClick={() => {
            setActiveSetting(null);
            setSaved("");
          }}
          className="mb-6 inline-flex items-center gap-2 text-sm text-white/60 hover:text-white"
        >
          <ArrowLeft size={18} />
          Back to Settings
        </button>

        <div className="mb-6 flex items-center gap-3">
          <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-blue-500/10 border border-blue-500/20">
            <User className="text-blue-400" size={24} />
          </div>

          <div>
            <h3 className="text-xl font-bold">Profile Settings</h3>
            <p className="text-sm text-white/50">
              Update admin name, email, and password
            </p>
          </div>
        </div>

        <div className="rounded-2xl border border-white/10 bg-white/5 p-5">
          <h4 className="mb-5 text-lg font-bold">Admin Information</h4>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
            <div>
              <label className="mb-2 block text-sm text-white/70">
                Full Name
              </label>
              <input
                type="text"
                name="full_name"
                value={adminProfile.full_name}
                onChange={handleProfileChange}
                className="w-full rounded-xl border border-white/10 bg-white/5 px-4 py-3 text-sm text-white outline-none focus:border-blue-500"
                placeholder="Admin name"
              />
            </div>

            <div>
              <label className="mb-2 block text-sm text-white/70">
                Email Address
              </label>
              <input
                type="email"
                name="email"
                value={adminProfile.email}
                onChange={handleProfileChange}
                className="w-full rounded-xl border border-white/10 bg-white/5 px-4 py-3 text-sm text-white outline-none focus:border-blue-500"
                placeholder="admin@gmail.com"
              />
            </div>

            <div>
              <label className="mb-2 block text-sm text-white/70">Role</label>
              <input
                type="text"
                value={adminProfile.role}
                disabled
                className="w-full rounded-xl border border-white/10 bg-white/5 px-4 py-3 text-sm text-white/50 outline-none cursor-not-allowed"
              />
            </div>
          </div>

          <div className="mt-6">
            <button
              onClick={handleProfileSave}
              disabled={loading}
              className="inline-flex items-center gap-2 rounded-xl bg-blue-600 px-5 py-3 text-sm font-semibold text-white hover:bg-blue-700 transition disabled:opacity-50"
            >
              <Save size={18} />
              {loading ? "Saving..." : "Save Profile"}
            </button>
          </div>
        </div>

        <div className="mt-6 rounded-2xl border border-white/10 bg-white/5 p-5">
          <h4 className="mb-5 text-lg font-bold">Change Password</h4>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
            <div>
              <label className="mb-2 block text-sm text-white/70">
                Current Password
              </label>
              <input
                type="password"
                name="currentPassword"
                value={passwordForm.currentPassword}
                onChange={handlePasswordChange}
                className="w-full rounded-xl border border-white/10 bg-white/5 px-4 py-3 text-sm text-white outline-none focus:border-blue-500"
                placeholder="Enter current password"
              />
            </div>

            <div>
              <label className="mb-2 block text-sm text-white/70">
                New Password
              </label>
              <input
                type="password"
                name="newPassword"
                value={passwordForm.newPassword}
                onChange={handlePasswordChange}
                className="w-full rounded-xl border border-white/10 bg-white/5 px-4 py-3 text-sm text-white outline-none focus:border-blue-500"
                placeholder="Enter new password"
              />
            </div>
          </div>

          <div className="mt-6">
            <button
              onClick={handlePasswordSave}
              disabled={loading}
              className="inline-flex items-center gap-2 rounded-xl bg-red-600 px-5 py-3 text-sm font-semibold text-white hover:bg-red-700 transition disabled:opacity-50"
            >
              <Save size={18} />
              {loading ? "Saving..." : "Change Password"}
            </button>
          </div>
        </div>

        {saved && (
          <div className="mt-5 rounded-xl bg-green-500/10 border border-green-500/20 p-4 text-sm text-green-400">
            {saved}
          </div>
        )}
      </div>
    );
  };

  const renderComingSoon = () => {
    const selected = settings.find((item) => item.key === activeSetting);

    return (
      <div className="max-w-3xl rounded-2xl bg-[#0B1024] border border-white/10 p-6">
        <button
          onClick={() => {
            setActiveSetting(null);
            setSaved("");
          }}
          className="mb-6 inline-flex items-center gap-2 text-sm text-white/60 hover:text-white"
        >
          <ArrowLeft size={18} />
          Back to Settings
        </button>

        <div className="mb-4 flex h-12 w-12 items-center justify-center rounded-xl bg-white/5 border border-white/10">
          {selected?.icon}
        </div>

        <h3 className="text-xl font-bold">{selected?.title}</h3>
        <p className="mt-2 text-white/50">{selected?.description}</p>

        <div className="mt-6 rounded-xl bg-yellow-500/10 border border-yellow-500/20 p-4 text-sm text-yellow-300">
          This settings section will be connected later.
        </div>
      </div>
    );
  };

  return (
    <div className="min-h-screen bg-[#050815] text-white flex">
      <AdminSidebar />

      <main className="flex-1 p-8">
        <div className="mb-8">
          <h2 className="text-3xl font-bold">Settings</h2>
          <p className="text-white/50">
            Manage website, profile, scraper, products, security, and
            integrations
          </p>
        </div>

        {activeSetting === "website" && renderWebsiteSettings()}

        {activeSetting === "profile" && renderProfileSettings()}

        {activeSetting &&
          activeSetting !== "website" &&
          activeSetting !== "profile" &&
          renderComingSoon()}

        {!activeSetting && (
          <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
            {settings.map((item) => (
              <div
                key={item.key}
                className="rounded-2xl bg-[#0B1024] border border-white/10 p-6 hover:bg-white/5 transition"
              >
                <div className="mb-4 flex h-12 w-12 items-center justify-center rounded-xl bg-white/5 border border-white/10">
                  {item.icon}
                </div>

                <h3 className="text-lg font-bold mb-2">{item.title}</h3>

                <p className="text-sm text-white/55 leading-relaxed">
                  {item.description}
                </p>

                <button
                  onClick={() => {
                    setActiveSetting(item.key);
                    setSaved("");
                  }}
                  className="mt-5 rounded-xl bg-blue-600 px-4 py-2 text-sm font-semibold text-white hover:bg-blue-700 transition"
                >
                  Manage
                </button>
              </div>
            ))}
          </div>
        )}
      </main>
    </div>
  );
}
