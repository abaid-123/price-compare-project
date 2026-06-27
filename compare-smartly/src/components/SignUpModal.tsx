import { useEffect, useState } from "react";
import { API_BASE_URL } from "../config/api";

type Props = {
  open: boolean;
  onClose: () => void;
  onOpenSignIn: () => void; // switch back to sign in
};

export default function SignUpModal({ open, onClose, onOpenSignIn }: Props) {
  // Close on ESC
  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    document.addEventListener("keydown", onKey);
    return () => document.removeEventListener("keydown", onKey);
  }, [open, onClose]);
  const [full_name, setFullName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");

  // Lock scroll
  useEffect(() => {
    if (!open) return;
    const prev = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.body.style.overflow = prev;
    };
  }, [open]);

  if (!open) return null;

  const handleSignup = async () => {
    try {
      const response = await fetch(`${API_BASE_URL}/api/auth/signup`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          full_name,
          email,
          password,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        alert(data.message || "Signup failed");
        return;
      }

      alert(data.message || "Account created successfully");

      resetForm();
      onClose();
      onOpenSignIn();
    } catch (error) {
      alert("Signup failed");
    }
  };
  const resetForm = () => {
    setFullName("");
    setEmail("");
    setPassword("");
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
            onClick={onClose}
            className="absolute right-4 top-4 text-white/50 hover:text-white transition"
            aria-label="Close"
          >
            ✕
          </button>

          {/* Logo */}
          <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-xl bg-gradient-to-br from-blue-500 to-indigo-600 shadow-sm">
            <span className="text-white text-lg">⚡</span>
          </div>

          {/* Title */}
          <h2 className="mt-4 text-center text-2xl font-extrabold text-white">
            Create Account
          </h2>
          <p className="mt-1 text-center text-sm text-white/55">
            Join millions of smart shoppers
          </p>

          {/* Form */}
          <form className="mt-6 space-y-4">
            <div>
              <label className="block text-xs text-white/60 mb-2">
                Full Name
              </label>
              <input
                type="text"
                placeholder="John Doe"
                value={full_name}
                onChange={(e) => setFullName(e.target.value)}
                className="w-full rounded-lg border border-white/10 bg-white/5 px-4 py-3 text-sm text-white/80 placeholder:text-white/35 outline-none focus:border-white/20"
              />
            </div>

            <div>
              <label className="block text-xs text-white/60 mb-2">Email</label>
              <input
                type="email"
                placeholder="you@example.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full rounded-lg border border-white/10 bg-white/5 px-4 py-3 text-sm text-white/80 placeholder:text-white/35 outline-none focus:border-white/20"
              />
            </div>

            <div>
              <label className="block text-xs text-white/60 mb-2">
                Password
              </label>
              <input
                type="password"
                placeholder="••••••••"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full rounded-lg border border-white/10 bg-white/5 px-4 py-3 text-sm text-white/80 placeholder:text-white/35 outline-none focus:border-white/20"
              />
            </div>

            <button
              type="button"
              onClick={handleSignup}
              className="w-full rounded-lg py-3 text-sm font-semibold text-white
             bg-gradient-to-r from-blue-500 to-indigo-600 hover:from-blue-400 hover:to-indigo-500
             transition shadow-lg shadow-blue-500/15"
            >
              Create Account
            </button>

            <p className="pt-1 text-center text-xs text-white/50">
              Already have an account?{" "}
              <button
                type="button"
                onClick={() => {
                  onClose();
                  onOpenSignIn();
                }}
                className="text-blue-400 hover:text-blue-300"
              >
                Sign in
              </button>
            </p>
          </form>
        </div>
      </div>
    </div>
  );
}
