import { useState } from "react";
import { motion } from "motion/react";
import { Mail, ArrowLeft, ArrowRight, CheckCircle2, Loader2 } from "lucide-react";
import { Logo } from "../landing/logo";

interface ForgotPasswordPageProps {
  onBack: () => void;
  onResetComplete?: () => void;
}

const INTEGRATION_LOGOS = ["☁️", "🧡", "💬", "🎧", "💳", "🔵", "📊"];

export function ForgotPasswordPage({ onBack, onResetComplete }: ForgotPasswordPageProps) {
  const [email, setEmail] = useState("");
  const [loading, setLoading] = useState(false);
  const [sent, setSent] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    // Simulate API call
    await new Promise(r => setTimeout(r, 1500));
    
    setLoading(false);
    setSent(true);

    // Auto-redirect after 5 seconds
    setTimeout(() => {
      if (onResetComplete) {
        onResetComplete();
      } else {
        onBack();
      }
    }, 5000);
  };

  return (
    <div className="min-h-screen flex bg-[#F3F4F6]">
      {/* Left — Brand Panel */}
      <div className="hidden lg:flex lg:w-[480px] xl:w-[520px] bg-gradient-to-br from-[#1E2A4A] to-[#3F5185] flex-col justify-between p-10 relative overflow-hidden">
        <div className="absolute inset-0 opacity-5">
          {[...Array(6)].map((_, i) => (
            <div key={i} className="absolute rounded-full border border-white/20" style={{
              width: `${200 + i * 120}px`, height: `${200 + i * 120}px`,
              top: "50%", left: "50%", transform: "translate(-50%, -50%)",
            }} />
          ))}
        </div>

        <div className="relative z-10">
          <div className="flex items-center gap-3 mb-2">
            <Logo width={36} />
            <span className="text-xl font-bold text-white">
              Integrate<span className="text-white/70">Wise</span>
            </span>
          </div>
          <p className="text-white/40 text-xs">AI-Native Integration Intelligence</p>
        </div>

        <div className="relative z-10 space-y-6">
          <h2 className="text-3xl font-bold text-white leading-tight">
            No worries.<br />
            <span className="text-[#D46780]">We've got you covered.</span>
          </h2>
          <p className="text-white/60 text-sm leading-relaxed max-w-sm">
            Enter your email and we'll send you instructions to reset your password and get back to work.
          </p>

          {/* Integration orbit */}
          <div className="flex items-center gap-2 mt-8">
            <span className="text-[10px] text-white/40 uppercase font-bold tracking-wider">Connects with</span>
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

      {/* Right — Reset Form */}
      <div className="flex-1 flex items-center justify-center p-6 sm:p-12">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="w-full max-w-sm"
        >
          {/* Mobile Logo */}
          <div className="lg:hidden flex items-center gap-2 mb-8">
            <Logo width={32} />
            <span className="text-lg font-bold text-[#1E2A4A]">
              Integrate<span className="text-[#D46780]">Wise</span>
            </span>
          </div>

          {!sent ? (
            <>
              <div className="mb-8">
                <h1 className="text-2xl font-bold text-[#1E2A4A] mb-1">Reset your password</h1>
                <p className="text-sm text-slate-500">Enter your email and we'll send you a reset link</p>
              </div>

              <form onSubmit={handleSubmit} className="space-y-4">
                {/* Email */}
                <div>
                  <label className="text-xs font-semibold text-slate-600 mb-1.5 block">Email address</label>
                  <div className="relative">
                    <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                    <input
                      type="email"
                      value={email}
                      onChange={e => setEmail(e.target.value)}
                      placeholder="you@company.com"
                      className="w-full bg-white border border-slate-200 rounded-xl pl-10 pr-4 py-2.5 text-sm outline-none focus:ring-2 focus:ring-[#3F5185]/20 focus:border-[#3F5185] transition-all"
                      required
                    />
                  </div>
                </div>

                {/* Submit */}
                <button
                  type="submit"
                  disabled={loading}
                  className="w-full bg-[#3F5185] hover:bg-[#354775] text-white font-semibold py-2.5 rounded-xl transition-all flex items-center justify-center gap-2 disabled:opacity-50"
                >
                  {loading ? (
                    <Loader2 className="w-4 h-4 animate-spin" />
                  ) : (
                    <>
                      Send reset link <ArrowRight className="w-4 h-4" />
                    </>
                  )}
                </button>
              </form>

              {/* Back to login */}
              <button
                onClick={onBack}
                className="w-full mt-4 flex items-center justify-center gap-2 text-sm text-slate-500 hover:text-[#3F5185] font-medium transition-colors"
              >
                <ArrowLeft className="w-4 h-4" />
                Back to login
              </button>
            </>
          ) : (
            <motion.div
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.9 }}
              className="text-center space-y-6"
            >
              <div className="w-16 h-16 rounded-full bg-[#3F5185]/10 flex items-center justify-center mx-auto">
                <CheckCircle2 className="w-8 h-8 text-[#3F5185]" />
              </div>

              <div>
                <h1 className="text-2xl font-bold text-[#1E2A4A] mb-2">Check your email</h1>
                <p className="text-sm text-slate-500 leading-relaxed">
                  We've sent password reset instructions to<br />
                  <strong className="text-[#3F5185]">{email}</strong>
                </p>
              </div>

              <div className="bg-blue-50 border border-blue-200 rounded-xl p-4 text-left">
                <p className="text-xs text-blue-900 leading-relaxed">
                  <strong>Didn't receive the email?</strong> Check your spam folder or try again with a different email address.
                </p>
              </div>

              <button
                onClick={onBack}
                className="w-full flex items-center justify-center gap-2 bg-white border border-slate-200 rounded-xl py-2.5 text-sm font-medium hover:bg-slate-50 transition-all"
              >
                <ArrowLeft className="w-4 h-4" />
                Back to login
              </button>

              <p className="text-xs text-slate-400">
                Redirecting to login in 5 seconds...
              </p>
            </motion.div>
          )}
        </motion.div>
      </div>
    </div>
  );
}