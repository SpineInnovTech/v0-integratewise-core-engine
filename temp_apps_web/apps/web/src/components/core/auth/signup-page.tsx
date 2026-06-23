import { useState } from "react";
import { motion } from "motion/react";
import {
  Mail,
  Lock,
  Eye,
  EyeOff,
  ArrowRight,
  Loader2,
  User,
  CheckCircle2,
  Shield,
  Zap,
  Database,
  Brain,
  Key,
} from "lucide-react";
import { LogoMark } from "@/components/common/brand/logo";

interface SignUpPageProps {
  onSignUp?: (name: string, email: string, password: string) => void;
  onGoToLogin?: () => void;
  onGoogleSignUp?: () => void;
  onGitHubSignUp?: () => void;
  error?: string;
  loading?: boolean;
  googleLoading?: boolean;
  githubLoading?: boolean;
}

const VALUE_PROPS = [
  { icon: Database, label: "Unified Data Spine", desc: "All your tools, one truth" },
  { icon: Brain, label: "AI Intelligence Loop", desc: "From reality to action" },
  { icon: Shield, label: "Governance Built-in", desc: "Human-in-the-loop always" },
  { icon: Zap, label: "Instant Integrations", desc: "40+ connectors, 2 min setup" },
];

export function SignUpPage({
  onSignUp = () => {},
  onGoToLogin = () => {},
  onGoogleSignUp,
  onGitHubSignUp,
  error,
  loading,
  googleLoading,
  githubLoading,
}: SignUpPageProps) {
  const [fullName, setFullName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [agreedToTerms, setAgreedToTerms] = useState(false);
  const [validationError, setValidationError] = useState("");

  const passwordStrength = (() => {
    if (!password) return { score: 0, label: "", color: "" };
    let score = 0;
    if (password.length >= 8) score++;
    if (/[A-Z]/.test(password)) score++;
    if (/[0-9]/.test(password)) score++;
    if (/[^A-Za-z0-9]/.test(password)) score++;
    if (score <= 1) return { score, label: "Weak", color: "bg-red-500" };
    if (score <= 2) return { score, label: "Fair", color: "bg-iw-gold" };
    if (score <= 3) return { score, label: "Good", color: "bg-iw-forest-bright" };
    return { score, label: "Strong", color: "bg-iw-forest" };
  })();

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setValidationError("");

    if (!fullName.trim()) {
      setValidationError("Please enter your full name.");
      return;
    }
    if (password.length < 8) {
      setValidationError("Password must be at least 8 characters.");
      return;
    }
    if (password !== confirmPassword) {
      setValidationError("Passwords do not match.");
      return;
    }
    if (!agreedToTerms) {
      setValidationError("Please agree to the terms & conditions.");
      return;
    }

    onSignUp(fullName.trim(), email, password);
  };

  const displayError = validationError || error;

  return (
    <div className="min-h-screen flex bg-background font-iw-sans">
      {/* Left — Brand Panel */}
      <div className="hidden lg:flex lg:w-[480px] xl:w-[560px] bg-iw-forest flex-col justify-between p-12 relative overflow-hidden">
        {/* Subtle background concentric rings overlay */}
        <div className="absolute inset-0 opacity-[0.05] pointer-events-none flex items-center justify-center">
          {[...Array(6)].map((_, i) => (
            <div
              key={i}
              className="absolute rounded-full border border-white"
              style={{
                width: `${200 + i * 160}px`,
                height: `${200 + i * 160}px`,
              }}
            />
          ))}
        </div>

        {/* Logo and Subheadline */}
        <div className="relative z-10">
          <div className="flex items-center gap-3 mb-2">
            <LogoMark size={28} color="#FFFFFF" />
            <span className="text-xl font-bold text-white tracking-tight">IntegrateWise</span>
          </div>
          <p className="text-white/60 text-[10px] font-iw-mono uppercase tracking-wider">
            AI that thinks in context. Waits for approvals.
          </p>
        </div>

        <div className="relative z-10 space-y-8 mt-[-40px]">
          <div>
            <h2 className="text-[38px] font-iw-serif text-white leading-[1.15] tracking-tight mb-4">
              Start building your
              <br />
              <span className="text-iw-gold">Intelligence Spine.</span>
            </h2>
            <p className="text-white/70 text-sm leading-relaxed max-w-sm">
              One Spine. All your tools connected. AI that works for your team — governed by humans,
              grounded in reality.
            </p>
          </div>

          {/* Value props */}
          <div className="space-y-3">
            {VALUE_PROPS.map((vp, i) => (
              <motion.div
                key={i}
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: 0.2 + i * 0.1 }}
                className="flex items-center gap-4 p-3 rounded-lg bg-white/5 border border-white/10 backdrop-blur-sm"
              >
                <div className="w-10 h-10 rounded bg-white/10 flex items-center justify-center shrink-0">
                  <vp.icon className="w-5 h-5 text-white/80" />
                </div>
                <div>
                  <div className="text-sm font-bold text-white tracking-wide">{vp.label}</div>
                  <div className="text-[11px] text-white/60 mt-0.5">{vp.desc}</div>
                </div>
              </motion.div>
            ))}
          </div>
        </div>

        {/* Footer info */}
        <div className="relative z-10 text-white/40 text-[10px]">
          &copy; 2026 IntegrateWise. All rights reserved.
        </div>
      </div>

      {/* Right — Sign Up Form Area */}
      <div className="flex-1 flex items-center justify-center p-6 sm:p-12 relative overflow-y-auto">
        <motion.div
          initial={{ opacity: 0, x: 20 }}
          animate={{ opacity: 1, x: 0 }}
          className="w-full max-w-[400px] my-auto py-8"
        >
          {/* Mobile Logo fallback */}
          <div className="lg:hidden mb-10 flex items-center gap-3">
            <LogoMark size={28} color="#1A3A2A" />
            <span className="text-xl font-bold text-foreground tracking-tight">IntegrateWise</span>
          </div>

          <div className="mb-6">
            <h1 className="text-2xl font-bold text-foreground mb-2 tracking-tight">Sign Up</h1>
            <p className="text-sm text-muted-foreground">
              Tell us about yourself — our team will set up your workspace
            </p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-4">
            {/* Full Name */}
            <div>
              <label className="text-xs font-bold text-muted-foreground mb-1.5 block">
                Full Name
              </label>
              <div className="relative">
                <User className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground/60" />
                <input
                  type="text"
                  value={fullName}
                  onChange={(e: React.ChangeEvent<HTMLInputElement>) => setFullName(e.target.value)}
                  placeholder="e.g. Arun Kumar"
                  className="w-full bg-card border border-border rounded-lg pl-10 pr-4 py-3 text-sm outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all placeholder:text-muted-foreground/60 text-foreground"
                  required
                />
              </div>
            </div>

            {/* Email */}
            <div>
              <label className="text-xs font-bold text-muted-foreground mb-1.5 block">
                Work Email
              </label>
              <div className="relative">
                <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground/60" />
                <input
                  type="email"
                  value={email}
                  onChange={(e: React.ChangeEvent<HTMLInputElement>) => setEmail(e.target.value)}
                  placeholder="you@company.com"
                  className="w-full bg-card border border-border rounded-lg pl-10 pr-4 py-3 text-sm outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all placeholder:text-muted-foreground/60 text-foreground"
                  required
                />
              </div>
            </div>

            {/* Password */}
            <div>
              <label className="text-xs font-bold text-muted-foreground mb-1.5 block">
                Password
              </label>
              <div className="relative">
                <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground/60" />
                <input
                  type={showPassword ? "text" : "password"}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="Min. 8 characters"
                  className="w-full bg-card border border-border rounded-lg pl-10 pr-10 py-3 text-sm outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all placeholder:text-muted-foreground/60 text-foreground"
                  required
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground/60 hover:text-foreground focus:outline-none"
                >
                  {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
              {/* Password strength meter */}
              {password && (
                <div className="mt-2 space-y-1">
                  <div className="flex gap-1">
                    {[1, 2, 3, 4].map((i) => (
                      <div
                        key={i}
                        className={`h-1 flex-1 rounded-full transition-all ${i <= passwordStrength.score ? passwordStrength.color : "bg-border"}`}
                      />
                    ))}
                  </div>
                  <div className="text-[10px] text-muted-foreground font-medium">
                    {passwordStrength.label}
                  </div>
                </div>
              )}
            </div>

            {/* Confirm Password */}
            <div>
              <label className="text-xs font-bold text-muted-foreground mb-1.5 block">
                Confirm Password
              </label>
              <div className="relative">
                <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground/60" />
                <input
                  type={showPassword ? "text" : "password"}
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  placeholder="Re-enter your password"
                  className={`w-full bg-card border rounded-lg pl-10 pr-10 py-3 text-sm outline-none focus:ring-2 focus:ring-primary/20 transition-all text-foreground placeholder:text-muted-foreground/60 ${
                    confirmPassword && confirmPassword !== password
                      ? "border-destructive focus:border-destructive"
                      : confirmPassword && confirmPassword === password
                        ? "border-iw-forest-bright focus:border-iw-forest-bright"
                        : "border-border focus:border-primary"
                  }`}
                  required
                />
                {confirmPassword && confirmPassword === password && (
                  <CheckCircle2 className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-iw-forest-bright" />
                )}
              </div>
            </div>

            {/* Terms */}
            <label className="flex items-start gap-2.5 cursor-pointer group pt-1">
              <input
                type="checkbox"
                checked={agreedToTerms}
                onChange={(e) => setAgreedToTerms(e.target.checked)}
                className="mt-0.5 rounded border-border text-primary focus:ring-primary"
              />
              <span className="text-xs text-muted-foreground leading-relaxed">
                I agree to the{" "}
                <span className="text-primary font-bold hover:underline">Terms of Service</span> and{" "}
                <span className="text-primary font-bold hover:underline">Privacy Policy</span>
              </span>
            </label>

            {/* Error Message */}
            {displayError && (
              <div className="bg-destructive/10 border border-destructive/20 rounded-lg px-3 py-2 text-xs text-destructive">
                {displayError}
              </div>
            )}

            {/* Submit Button */}
            <button
              type="submit"
              disabled={loading}
              className="w-full bg-primary hover:bg-iw-forest-bright text-primary-foreground font-medium py-3 rounded-lg transition-all flex items-center justify-center gap-2 disabled:opacity-50 mt-2"
            >
              {loading ? (
                <Loader2 className="w-4 h-4 animate-spin" />
              ) : (
                <>
                  Sign Up <ArrowRight className="w-4 h-4" />
                </>
              )}
            </button>
          </form>

          {/* Social Divider */}
          <div className="flex items-center gap-3 my-8">
            <div className="flex-1 h-px bg-border" />
            <span className="text-[10px] text-muted-foreground uppercase font-bold tracking-wider">
              OR CONTINUE WITH
            </span>
            <div className="flex-1 h-px bg-border" />
          </div>

          {/* Social Logins */}
          <div className="grid grid-cols-2 gap-3">
            <button
              type="button"
              onClick={() => onGoogleSignUp?.()}
              disabled={googleLoading}
              className="flex items-center justify-center gap-2 bg-card border border-border rounded-lg py-2.5 text-xs font-semibold text-foreground hover:bg-muted transition-all disabled:opacity-50"
            >
              {googleLoading ? (
                <Loader2 className="w-4 h-4 animate-spin text-muted-foreground" />
              ) : (
                <svg className="w-4 h-4" viewBox="0 0 24 24">
                  <path
                    d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92a5.06 5.06 0 0 1-2.2 3.32v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.1z"
                    fill="#5e9277"
                  />
                  <path
                    d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
                    fill="#34A853"
                  />
                  <path
                    d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"
                    fill="#FBBC05"
                  />
                  <path
                    d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
                    fill="#EA4335"
                  />
                </svg>
              )}
              Google
            </button>
            <button
              type="button"
              onClick={() => onGitHubSignUp?.()}
              disabled={githubLoading}
              className="flex items-center justify-center gap-2 bg-card border border-border rounded-lg py-2.5 text-xs font-semibold text-foreground hover:bg-muted transition-all disabled:opacity-50"
            >
              {githubLoading ? (
                <Loader2 className="w-4 h-4 animate-spin text-muted-foreground" />
              ) : (
                <svg className="w-4 h-4" viewBox="0 0 24 24" fill="currentColor">
                  <path d="M12 0c-6.626 0-12 5.373-12 12 0 5.302 3.438 9.8 8.207 11.387.599.111.793-.261.793-.577v-2.234c-3.338.726-4.033-1.416-4.033-1.416-.546-1.387-1.333-1.756-1.333-1.756-1.089-.745.083-.729.083-.729 1.205.084 1.839 1.237 1.839 1.237 1.07 1.834 2.807 1.304 3.492.997.107-.775.418-1.305.762-1.604-2.665-.305-5.467-1.334-5.467-5.931 0-1.311.469-2.381 1.236-3.221-.124-.303-.535-1.524.117-3.176 0 0 1.008-.322 3.301 1.23.957-.266 1.983-.399 3.003-.404 1.02.005 2.047.138 3.006.404 2.291-1.552 3.297-1.23 3.297-1.23.653 1.653.242 2.874.118 3.176.77.84 1.235 1.911 1.235 3.221 0 4.609-2.807 5.624-5.479 5.921.43.372.823 1.102.823 2.222v3.293c0 .319.192.694.801.576 4.765-1.589 8.199-6.086 8.199-11.386 0-6.627-5.373-12-12-12z" />
                </svg>
              )}
              GitHub
            </button>
          </div>

          {/* Login Link */}
          <p className="text-center text-[13px] text-muted-foreground mt-8">
            Already have an account?{" "}
            <button onClick={onGoToLogin} className="text-iw-gold font-semibold hover:underline">
              Sign in
            </button>
          </p>
        </motion.div>
      </div>
    </div>
  );
}
