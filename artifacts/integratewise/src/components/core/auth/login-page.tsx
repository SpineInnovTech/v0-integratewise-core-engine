import { useState } from "react";
import { motion } from "motion/react";
import { Mail, Lock, Eye, EyeOff, ArrowRight, Loader2 } from "lucide-react";
import { Logo } from "@/components/common/brand/logo";

interface LoginPageProps {
  onLogin: (email: string, password: string) => void;
  onSignUp: () => void;
  onForgotPassword: (email: string) => Promise<boolean>;
  error?: string;
  loading?: boolean;
  googleLoading?: boolean;
  githubLoading?: boolean;
  forgotLoading?: boolean;
  onGoogleLogin?: () => void;
  onGitHubLogin?: () => void;
}

const INTEGRATION_LOGOS = ["☁️", "🧡", "💬", "🎧", "💳", "🔵", "📊"];

export function LoginPage({
  onLogin,
  onSignUp,
  onForgotPassword,
  error,
  loading,
  googleLoading,
  githubLoading,
  forgotLoading,
  onGoogleLogin,
  onGitHubLogin,
}: LoginPageProps) {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onLogin(email, password);
  };

  return (
    <div className="min-h-screen flex bg-background font-iw-sans">
      {/* Left — Brand Panel */}
      <div className="hidden lg:flex lg:w-[480px] xl:w-[520px] bg-iw-forest flex-col justify-between p-10 relative overflow-hidden">
        <div className="absolute inset-0 opacity-5">
          {[...Array(6)].map((_, i) => (
            <div
              key={i}
              className="absolute rounded-full border border-white/20"
              style={{
                width: `${200 + i * 120}px`,
                height: `${200 + i * 120}px`,
                top: "50%",
                left: "50%",
                transform: "translate(-50%, -50%)",
              }}
            />
          ))}
        </div>

        <div className="relative z-10">
          <div className="flex items-center gap-3 mb-2">
            <Logo width={36} />
            <span className="text-xl font-bold text-white">
              Integrate<span className="text-white/70">Wise</span>
            </span>
          </div>
          <p className="text-white/60 text-[10px] font-iw-mono uppercase tracking-wider">
            AI that thinks in context. Waits for approvals.
          </p>
        </div>

        <div className="relative z-10 space-y-6">
          <h2 className="text-3xl font-iw-serif text-white leading-tight">
            Unify your tools.
            <br />
            <span className="text-iw-gold">Amplify your growth.</span>
          </h2>
          <p className="text-white/60 text-sm leading-relaxed max-w-sm">
            Connect every tool in your stack. IntegrateWise turns fragmented data into goal-aligned
            intelligence — from reality to action.
          </p>

          {/* Integration orbit */}
          <div className="flex items-center gap-2 mt-8">
            <span className="text-[10px] text-white/40 uppercase font-bold tracking-wider">
              Connects with
            </span>
            <div className="flex -space-x-1">
              {INTEGRATION_LOGOS.map((logo, i) => (
                <motion.div
                  key={i}
                  initial={{ scale: 0, opacity: 0 }}
                  animate={{ scale: 1, opacity: 1 }}
                  transition={{ delay: 0.5 + i * 0.1 }}
                  className="w-7 h-7 rounded-lg bg-white/10 flex items-center justify-center text-sm border border-white/10"
                >
                  {logo}
                </motion.div>
              ))}
              <motion.div
                initial={{ scale: 0 }}
                animate={{ scale: 1 }}
                transition={{ delay: 1.2 }}
                className="w-7 h-7 rounded-lg bg-white/5 flex items-center justify-center text-[9px] text-white/40 font-bold border border-white/10"
              >
                +40
              </motion.div>
            </div>
          </div>
        </div>

        <div className="relative z-10 text-white/30 text-[10px]">
          &copy; 2026 IntegrateWise. All rights reserved.
        </div>
      </div>

      {/* Right — Login Form */}
      <div className="flex-1 flex items-center justify-center p-6 sm:p-12">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="w-full max-w-sm"
        >
          {/* Mobile Logo */}
          <div className="lg:hidden flex items-center gap-2 mb-8">
            <Logo width={32} />
            <span className="text-lg font-bold text-foreground">
              Integrate<span className="text-iw-gold">Wise</span>
            </span>
          </div>

          <div className="mb-8">
            <h1 className="text-2xl font-bold text-foreground mb-1">Welcome back</h1>
            <p className="text-sm text-muted-foreground">Sign in to your workspace</p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-4">
            {/* Email */}
            <div>
              <label className="text-xs font-semibold text-muted-foreground mb-1.5 block">
                Email
              </label>
              <div className="relative">
                <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground/60" />
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="you@company.com"
                  autoComplete="email"
                  className="w-full bg-card border border-border rounded-xl pl-10 pr-4 py-2.5 text-sm outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all text-foreground"
                  required
                />
              </div>
            </div>

            {/* Password */}
            <div>
              <label className="text-xs font-semibold text-muted-foreground mb-1.5 block">
                Password
              </label>
              <div className="relative">
                <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground/60" />
                <input
                  type={showPassword ? "text" : "password"}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="Enter your password"
                  autoComplete="current-password"
                  className="w-full bg-card border border-border rounded-xl pl-10 pr-10 py-2.5 text-sm outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all text-foreground"
                  required
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground/60 hover:text-foreground"
                >
                  {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
            </div>

            {/* Forgot */}
            <div className="flex justify-end">
              <button
                type="button"
                onClick={() => onForgotPassword(email)}
                disabled={!email || forgotLoading}
                className="text-xs text-primary font-medium hover:underline disabled:opacity-50"
              >
                {forgotLoading ? "Sending..." : "Forgot password?"}
              </button>
            </div>

            {/* Error */}
            {error && (
              <div className="bg-destructive/10 border border-destructive/20 rounded-lg px-3 py-2 text-xs text-destructive">
                {error}
              </div>
            )}

            {/* Submit */}
            <button
              type="submit"
              disabled={loading}
              className="w-full bg-primary hover:bg-iw-forest-bright text-primary-foreground font-semibold py-2.5 rounded-xl transition-all flex items-center justify-center gap-2 disabled:opacity-50"
            >
              {loading ? (
                <Loader2 className="w-4 h-4 animate-spin" />
              ) : (
                <>
                  Sign In <ArrowRight className="w-4 h-4" />
                </>
              )}
            </button>
          </form>

          {/* Divider */}
          <div className="flex items-center gap-3 my-6">
            <div className="flex-1 h-px bg-border" />
            <span className="text-[10px] text-muted-foreground uppercase font-bold">
              or continue with
            </span>
            <div className="flex-1 h-px bg-border" />
          </div>

          {/* Social */}
          <div className="grid grid-cols-2 gap-2">
            <button
              type="button"
              onClick={onGoogleLogin}
              disabled={googleLoading}
              className="flex items-center justify-center gap-2 bg-card border border-border rounded-xl py-2 text-sm font-medium hover:bg-muted transition-all disabled:opacity-50 text-foreground"
            >
              {googleLoading ? (
                <Loader2 className="w-4 h-4 animate-spin" />
              ) : (
                <>
                  <span className="text-lg">G</span> Google
                </>
              )}
            </button>
            <button
              type="button"
              onClick={onGitHubLogin}
              disabled={githubLoading}
              className="flex items-center justify-center gap-2 bg-card border border-border rounded-xl py-2 text-sm font-medium hover:bg-muted transition-all disabled:opacity-50 text-foreground"
            >
              {githubLoading ? <Loader2 className="w-4 h-4 animate-spin" /> : "GitHub"}
            </button>
          </div>

          {/* Sign up */}
          <p className="text-center text-sm text-muted-foreground mt-6">
            Don't have an account?{" "}
            <button onClick={onSignUp} className="text-iw-gold font-semibold hover:underline">
              Sign Up
            </button>
          </p>
        </motion.div>
      </div>
    </div>
  );
}
