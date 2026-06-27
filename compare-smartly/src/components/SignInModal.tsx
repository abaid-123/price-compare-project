import { useEffect, useState } from "react";
import { API_BASE_URL } from "../config/api";

type Props = {
  open: boolean;
  onClose: () => void;
  onOpenSignUp: () => void;
};

export default function SignInModal({ open, onClose, onOpenSignUp }: Props) {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");

  // ESC close
  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    document.addEventListener("keydown", onKey);
    return () => document.removeEventListener("keydown", onKey);
  }, [open, onClose]);

  // lock scroll
  useEffect(() => {
    if (!open) return;
    const prev = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.body.style.overflow = prev;
    };
  }, [open]);

  if (!open) return null;

  const resetForm = () => {
    setEmail("");
    setPassword("");
  };

  const handleLogin = async () => {
    try {
      const response = await fetch(`${API_BASE_URL}/api/auth/login`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          email,
          password,
        }),
      });

      const data = await response.json();

      // ❌ stop if error
      if (!response.ok) {
        alert(data.message);
        return;
      }

      // ✅ save user
      localStorage.setItem("user", JSON.stringify(data.user));
      localStorage.setItem("token", data.token);

      // ✅ clear fields
      resetForm();

      // close modal
      onClose();

      // ✅ role-based redirect
      if (data.user.role === "admin") {
        window.location.href = "/admin";
      } else {
        window.location.href = "/";
      }
    } catch (error) {
      alert("Login failed");
    }
  };

  return (
    <div className="fixed inset-0 z-[999]">
      {/* Overlay */}
      <div
        className="absolute inset-0 bg-black/70 backdrop-blur-sm"
        onClick={onClose}
      />

      {/* Modal */}
      <div className="absolute inset-0 flex items-center justify-center px-4">
        <div className="relative w-full max-w-md rounded-2xl border border-white/10 bg-[#0B1024]/90 backdrop-blur p-8 shadow-2xl">
          {/* Close */}
          <button
            onClick={() => {
              resetForm();
              onClose();
            }}
            className="absolute right-4 top-4 text-white/50 hover:text-white transition"
          >
            ✕
          </button>

          {/* Logo */}
          <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-xl bg-gradient-to-br from-blue-500 to-indigo-600">
            <span className="text-white text-lg">⚡</span>
          </div>

          {/* Title */}
          <h2 className="mt-4 text-center text-2xl font-extrabold text-white">
            Welcome Back
          </h2>

          <p className="mt-1 text-center text-sm text-white/55">
            Sign in to continue
          </p>

          {/* Form */}
          <form className="mt-6 space-y-4">
            {/* Email */}
            <div>
              <label className="block text-xs text-white/60 mb-2">Email</label>
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="you@example.com"
                className="w-full rounded-lg border border-white/10 bg-white/5 px-4 py-3 text-sm text-white"
              />
            </div>

            {/* Password */}
            <div>
              <label className="block text-xs text-white/60 mb-2">
                Password
              </label>
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••"
                className="w-full rounded-lg border border-white/10 bg-white/5 px-4 py-3 text-sm text-white"
              />
            </div>

            {/* Button */}
            <button
              type="button"
              onClick={handleLogin}
              className="w-full rounded-lg py-3 text-sm font-semibold text-white
              bg-gradient-to-r from-blue-500 to-indigo-600"
            >
              Sign In
            </button>

            {/* Switch */}
            <p className="text-center text-xs text-white/50">
              Don&apos;t have an account?{" "}
              <button
                type="button"
                onClick={() => {
                  resetForm();
                  onClose();
                  onOpenSignUp();
                }}
                className="text-blue-400"
              >
                Sign up
              </button>
            </p>
          </form>
        </div>
      </div>
    </div>
  );
}
