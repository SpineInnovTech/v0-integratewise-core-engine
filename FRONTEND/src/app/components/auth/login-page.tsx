import { useState } from "react";
import { motion } from "motion/react";
import { Mail, Lock, Eye, EyeOff, ArrowRight, Loader2 } from "lucide-react";
import { Logo } from "../landing/logo";

interface LoginPageProps {
  onLogin: (email: string, password: string) => void;
  onSignUp: () => void;
  onForgotPassword: () => void;
  error?: string;
  loading?: boolean;
}

const INTEGRATION_LOGOS = ["☁️", "🧡", "💬", "🎧", "💳", "🔵", "📊"];
const DEMO_USER = { email: "nirmal@integratewise.ai", password: "demo1234" };

export function LoginPage({ onLogin, onSignUp, onForgotPassword, error, loading }: LoginPageProps) {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onLogin(email, password);
  };

  const handleDemoLogin = () => {
    setEmail(DEMO_USER.email);
    setPassword(DEMO_USER.password);
    onLogin(DEMO_USER.email, DEMO_USER.password);
  };

  return (
    <div className="min-h-screen flex" style={{ background: "var(--background)" }}>
      {/* Left — Brand Panel */}
      <div className="hidden lg:flex lg:w-[480px] xl:w-[520px] flex-col justify-between p-10 relative overflow-hidden"
        style={{ background: "linear-gradient(135deg, var(--iw-blue-900) 0%, var(--iw-blue) 100%)" }}>
        {/* Decorative rings */}
        <div className="absolute inset-0 opacity-5">
          {[...Array(6)].map((_, i) => (
            <div key={i} className="absolute rounded-full border border-white/20" style={{
              width: `${200 + i * 120}px`, height: `${200 + i * 120}px`,
              top: "50%", left: "50%", transform: "translate(-50%, -50%)",
            }} />
          ))}
        </div>

        <div className="relative z-10">
          <div className="flex items-center gap-3 mb-1">
            <Logo width={36} />
            <span className="text-xl font-bold text-white">
              Integrate<span style={{ color: "rgba(255,255,255,0.6)" }}>Wise</span>
            </span>
          </div>
          <p className="text-[11px]" style={{ color: "rgba(255,255,255,0.35)" }}>
            AI THAT THINKS IN CONTEXT. WAITS FOR APPROVALS.
          </p>
        </div>

        <div className="relative z-10 space-y-5">
          <h2 className="text-3xl font-bold text-white leading-tight">
            Unify your tools.<br />
            <span style={{ color: "var(--iw-pink)" }}>Amplify your growth.</span>
          </h2>
          <p className="text-sm leading-relaxed max-w-sm" style={{ color: "rgba(255,255,255,0.55)" }}>
            Connect every tool in your stack. IntegrateWise turns fragmented data into goal-aligned intelligence — from reality to action.
          </p>

          <div className="flex items-center gap-2 pt-2">
            <span className="text-[9px] uppercase font-bold tracking-wider" style={{ color: "rgba(255,255,255,0.35)" }}>Connects with</span>
            <div className="flex -space-x-1">
              {INTEGRATION_LOGOS.map((logo, i) => (
                <motion.div key={i} initial={{ scale: 0, opacity: 0 }} animate={{ scale: 1, opacity: 1 }}
                  transition={{ delay: 0.5 + i * 0.1 }}
                  className="w-7 h-7 rounded-lg flex items-center justify-center text-sm"
                  style={{ background: "rgba(255,255,255,0.1)", border: "1px solid rgba(255,255,255,0.12)" }}>
                  {logo}
                </motion.div>
              ))}
              <motion.div initial={{ scale: 0 }} animate={{ scale: 1 }} transition={{ delay: 1.2 }}
                className="w-7 h-7 rounded-lg flex items-center justify-center text-[9px] font-bold"
                style={{ background: "rgba(255,255,255,0.06)", border: "1px solid rgba(255,255,255,0.1)", color: "rgba(255,255,255,0.4)" }}>
                +40
              </motion.div>
            </div>
          </div>
        </div>

        <div className="relative z-10 text-[10px]" style={{ color: "rgba(255,255,255,0.25)" }}>
          &copy; 2026 IntegrateWise. All rights reserved.
        </div>
      </div>

      {/* Right — Login Form */}
      <div className="flex-1 flex items-center justify-center p-6 sm:p-12">
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="w-full max-w-sm">

          {/* Mobile Logo */}
          <div className="lg:hidden flex items-center gap-2 mb-8">
            <Logo width={32} />
            <span className="text-lg font-bold" style={{ color: "var(--iw-blue-900)" }}>
              Integrate<span style={{ color: "var(--iw-pink)" }}>Wise</span>
            </span>
          </div>

          <div className="mb-8">
            <h1 className="text-2xl font-bold mb-1" style={{ color: "var(--foreground)" }}>Welcome back</h1>
            <p className="text-sm" style={{ color: "var(--muted-foreground)" }}>Sign in to your workspace</p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-4">
            {/* Email */}
            <div>
              <label className="text-xs font-semibold mb-1.5 block" style={{ color: "var(--muted-foreground)" }}>Email</label>
              <div className="relative">
                <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4" style={{ color: "var(--muted-foreground)" }} />
                <input type="email" value={email} onChange={e => setEmail(e.target.value)}
                  placeholder="you@company.com"
                  className="w-full rounded-xl pl-10 pr-4 py-2.5 text-sm outline-none transition-all"
                  style={{ background: "var(--card)", border: "1px solid var(--border)", color: "var(--foreground)" }}
                  onFocus={e => { (e.target as HTMLElement).style.borderColor = "var(--iw-blue)"; (e.target as HTMLElement).style.boxShadow = `0 0 0 3px rgba(66,86,171,0.12)`; }}
                  onBlur={e => { (e.target as HTMLElement).style.borderColor = "var(--border)"; (e.target as HTMLElement).style.boxShadow = "none"; }}
                  required />
              </div>
            </div>

            {/* Password */}
            <div>
              <label className="text-xs font-semibold mb-1.5 block" style={{ color: "var(--muted-foreground)" }}>Password</label>
              <div className="relative">
                <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4" style={{ color: "var(--muted-foreground)" }} />
                <input type={showPassword ? "text" : "password"} value={password} onChange={e => setPassword(e.target.value)}
                  placeholder="Enter your password"
                  className="w-full rounded-xl pl-10 pr-10 py-2.5 text-sm outline-none transition-all"
                  style={{ background: "var(--card)", border: "1px solid var(--border)", color: "var(--foreground)" }}
                  onFocus={e => { (e.target as HTMLElement).style.borderColor = "var(--iw-blue)"; (e.target as HTMLElement).style.boxShadow = `0 0 0 3px rgba(66,86,171,0.12)`; }}
                  onBlur={e => { (e.target as HTMLElement).style.borderColor = "var(--border)"; (e.target as HTMLElement).style.boxShadow = "none"; }}
                  required />
                <button type="button" onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 transition-colors"
                  style={{ color: "var(--muted-foreground)" }}>
                  {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
            </div>

            {/* Forgot */}
            <div className="flex justify-end">
              <button type="button" onClick={onForgotPassword} className="text-xs font-medium hover:underline"
                style={{ color: "var(--iw-blue)" }}>
                Forgot password?
              </button>
            </div>

            {/* Error */}
            {error && (
              <div className="rounded-lg px-3 py-2 text-xs" style={{ background: "rgba(220,74,74,0.06)", border: "1px solid rgba(220,74,74,0.2)", color: "var(--iw-danger)" }}>
                {error}
              </div>
            )}

            {/* Demo login */}
            <button type="button" onClick={handleDemoLogin} disabled={loading}
              className="w-full font-semibold py-2.5 rounded-xl transition-all flex items-center justify-center gap-2 disabled:opacity-50 text-sm"
              style={{ background: "rgba(61,139,110,0.08)", border: "1px solid rgba(61,139,110,0.2)", color: "var(--iw-success)" }}
              onMouseEnter={e => { (e.currentTarget as HTMLElement).style.background = "rgba(61,139,110,0.14)"; }}
              onMouseLeave={e => { (e.currentTarget as HTMLElement).style.background = "rgba(61,139,110,0.08)"; }}>
              ✦ Enter as Nirmal (super_admin demo)
            </button>

            {/* Submit */}
            <button type="submit" disabled={loading}
              className="w-full text-white font-semibold py-2.5 rounded-xl transition-all flex items-center justify-center gap-2 disabled:opacity-50"
              style={{ background: "var(--iw-blue)" }}
              onMouseEnter={e => { (e.currentTarget as HTMLElement).style.background = "var(--iw-blue-dark)"; }}
              onMouseLeave={e => { (e.currentTarget as HTMLElement).style.background = "var(--iw-blue)"; }}>
              {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : <>Sign In <ArrowRight className="w-4 h-4" /></>}
            </button>
          </form>

          {/* Divider */}
          <div className="flex items-center gap-3 my-6">
            <div className="flex-1 h-px" style={{ background: "var(--border)" }} />
            <span className="text-[10px] uppercase font-bold" style={{ color: "var(--muted-foreground)" }}>or continue with</span>
            <div className="flex-1 h-px" style={{ background: "var(--border)" }} />
          </div>

          {/* Social */}
          <div className="grid grid-cols-2 gap-2">
            {["G  Google", "🔑  GitHub"].map(label => (
              <button key={label}
                className="flex items-center justify-center gap-2 rounded-xl py-2 text-sm font-medium transition-all"
                style={{ background: "var(--card)", border: "1px solid var(--border)", color: "var(--foreground)" }}
                onMouseEnter={e => { (e.currentTarget as HTMLElement).style.background = "var(--secondary)"; }}
                onMouseLeave={e => { (e.currentTarget as HTMLElement).style.background = "var(--card)"; }}>
                {label}
              </button>
            ))}
          </div>

          <p className="text-center text-sm mt-6" style={{ color: "var(--muted-foreground)" }}>
            Don't have an account?{" "}
            <button onClick={onSignUp} className="font-semibold hover:underline" style={{ color: "var(--iw-pink)" }}>
              Start free trial
            </button>
          </p>
        </motion.div>
      </div>
    </div>
  );
}
