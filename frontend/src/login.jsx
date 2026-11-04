
import { useState } from "react";
import { Milk, Mail, Lock, Eye, EyeOff, ArrowRight } from "lucide-react";
import { api } from "./api/client";

export default function Login({ onLogin }) {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");
    setLoading(true);

    try {
      const user = await api.login({
        email: email.trim(),
        password,
      });

      onLogin(user);
    } catch (err) {
      setError(err.message || "Login failed. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-950 flex items-center justify-center p-4">
      <div className="w-full max-w-md">

        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-16 h-16 rounded-2xl bg-emerald-500/15 text-emerald-400 mb-4">
            <Milk size={34} />
          </div>

          <h1 className="text-3xl font-bold text-white">
            Dairy<span className="text-emerald-400">Sync</span>
          </h1>

          <p className="text-slate-400 mt-2">
            Cold-Chain Incident-to-Decision Support Platform
          </p>
        </div>

        <div className="bg-white rounded-2xl shadow-2xl p-8">
          <h2 className="text-2xl font-bold text-slate-900">
            Welcome Back
          </h2>

          <p className="text-slate-500 text-sm mt-2 mb-7">
            Sign in to access your DairySync dashboard.
          </p>

          <form onSubmit={handleSubmit} className="space-y-5">

            <div>
              <label className="block text-sm font-semibold text-slate-700 mb-2">
                Email Address
              </label>

              <div className="relative">
                <Mail
                  size={18}
                  className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400"
                />

                <input
                  type="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="Enter your email"
                  className="w-full border border-slate-200 rounded-xl py-3 pl-10 pr-4 outline-none focus:ring-2 focus:ring-emerald-500 focus:border-transparent"
                />
              </div>
            </div>

            <div>
              <label className="block text-sm font-semibold text-slate-700 mb-2">
                Password
              </label>

              <div className="relative">
                <Lock
                  size={18}
                  className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400"
                />

                <input
                  type={showPassword ? "text" : "password"}
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="Enter your password"
                  className="w-full border border-slate-200 rounded-xl py-3 pl-10 pr-12 outline-none focus:ring-2 focus:ring-emerald-500 focus:border-transparent"
                />

                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400"
                  aria-label={showPassword ? "Hide password" : "Show password"}
                >
                  {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                </button>
              </div>
            </div>

            {error && (
              <div className="bg-red-50 border border-red-200 text-red-600 rounded-lg p-3 text-sm">
                {error}
              </div>
            )}

            <button
              type="submit"
              disabled={loading}
              className="w-full bg-emerald-600 hover:bg-emerald-700 disabled:opacity-60 text-white font-semibold py-3 rounded-xl flex items-center justify-center gap-2 transition-colors"
            >
              {loading ? "Signing in..." : "Sign In"}
              {!loading && <ArrowRight size={18} />}
            </button>

          </form>

          <p className="text-center text-xs text-slate-400 mt-7">
            Secure access for authorized DairySync users
          </p>
        </div>

        <p className="text-center text-slate-500 text-xs mt-6">
          DairySync • Detect • Investigate • Decide • Recover
        </p>

      </div>
    </div>
  );
}
