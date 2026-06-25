import { useState } from "react";
import { motion, AnimatePresence } from "motion/react";
import {
  CheckCircle2,
  ChevronRight,
  Rocket,
  Database,
  Zap,
  Shield,
  Globe,
  Loader2,
  Lock,
  Factory,
  Briefcase,
  Target,
  Building2,
  Users,
  TrendingUp,
  ArrowUpRight,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { type CTXEnum, type OrgType } from "@/components/l2/spine/types";
import { LogoMark } from "@/components/common/brand/logo";

interface OnboardingFlowProps {
  onComplete: (data: {
    userName: string;
    role: string;
    activeCtx: CTXEnum;
    connectedApps: string[];
    orgType: OrgType;
  }) => void;
}

const STEPS = [
  { id: "identity", label: "Identity", icon: Rocket },
  { id: "orgtype", label: "Org DNA", icon: Target },
  { id: "context", label: "Context", icon: Globe },
  { id: "connect", label: "Connect", icon: Database },
  { id: "spine", label: "Spine", icon: Zap },
];

const CONNECTORS = [
  { id: "salesforce", name: "Salesforce", icon: "☁️" },
  { id: "hubspot", name: "HubSpot", icon: "🎯" },
  { id: "slack", name: "Slack", icon: "💬" },
  { id: "jira", name: "Jira", icon: "🛠️" },
  { id: "stripe", name: "Stripe", icon: "💳" },
  { id: "github", name: "GitHub", icon: "🐙" },
];

export function OnboardingFlow({ onComplete }: OnboardingFlowProps) {
  const [step, setStep] = useState(0);
  const [userName, setUserName] = useState("");
  const [role, setRole] = useState("Operations Lead");
  const [orgType, setOrgType] = useState<OrgType>("PRODUCT");
  const [activeCtx, setActiveCtx] = useState<CTXEnum>("CTX_BIZOPS");
  const [connectedApps, setConnectedApps] = useState<string[]>(["slack"]);
  const [isInitializing, setIsInitializing] = useState(false);

  const handleNext = () => {
    if (step < STEPS.length - 1) {
      setStep(step + 1);
    } else {
      handleComplete();
    }
  };

  const handleComplete = async () => {
    setIsInitializing(true);
    setTimeout(() => {
      onComplete({
        userName: userName || "Arun Kumar",
        role,
        activeCtx,
        connectedApps,
        orgType,
      });
    }, 2000);
  };

  return (
    <div className="min-h-screen bg-[#f5f3ef] text-[#2f2c28] flex flex-col items-center justify-center p-6 font-sans">
      {/* Background Glow */}
      <div className="fixed inset-0 overflow-hidden pointer-events-none opacity-30">
        <div className="absolute top-[-10%] left-[-10%] w-[40%] h-[40%] bg-[#1a3a2a] rounded-full blur-[120px] animate-pulse" />
        <div className="absolute bottom-[-10%] right-[-10%] w-[40%] h-[40%] bg-[#b8943f] rounded-full blur-[120px] animate-pulse delay-700" />
      </div>

      <div className="w-full max-w-xl relative z-10">
        {/* Logo */}
        <div className="flex items-center gap-2 justify-center mb-8">
          <LogoMark size={100} />
        </div>

        {/* Progress Stepper */}
        <div className="flex items-center justify-between mb-12 px-2">
          {STEPS.map((s, i) => (
            <div key={s.id} className="flex flex-col items-center gap-2">
              <div
                className={`w-8 h-8 rounded-full flex items-center justify-center border-2 transition-all ${
                  i <= step
                    ? "bg-[#1a3a2a] border-[#1a3a2a] text-white"
                    : "border-[#d8d2c6] text-[#6b665f]"
                }`}
              >
                {i < step ? <CheckCircle2 className="w-5 h-5" /> : <s.icon className="w-4 h-4" />}
              </div>
              <span
                className={`text-[9px] uppercase font-bold tracking-widest ${i <= step ? "text-[#1a3a2a]" : "text-[#C4BAA8]"}`}
              >
                {s.label}
              </span>
            </div>
          ))}
        </div>

        <AnimatePresence mode="wait">
          {/* Step 0: Identity */}
          {step === 0 && (
            <motion.div
              key="step0"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              className="space-y-8"
            >
              <div className="space-y-2">
                <h1 className="text-4xl font-bold tracking-tight text-[#142e20]">
                  Welcome to IntegrateWise.
                </h1>
                <p className="text-[#6b665f]">
                  Establish your operational identity to begin Spine normalization.
                </p>
              </div>
              <div className="space-y-4">
                <div className="space-y-1">
                  <label className="text-[10px] uppercase font-bold text-[#6b665f] tracking-wider">
                    Full Name
                  </label>
                  <Input
                    value={userName}
                    onChange={(e) => setUserName(e.target.value)}
                    placeholder="e.g. Arun Kumar"
                    className="bg-white border-[#d8d2c6] h-14 text-lg focus:ring-[#1a3a2a] focus:border-[#1a3a2a] text-[#2f2c28]"
                  />
                </div>
                <div className="space-y-1">
                  <label className="text-[10px] uppercase font-bold text-[#6b665f] tracking-wider">
                    Job Role
                  </label>
                  <Input
                    value={role}
                    onChange={(e) => setRole(e.target.value)}
                    placeholder="e.g. Revenue Operations Manager"
                    className="bg-white border-[#d8d2c6] h-14 text-lg focus:ring-[#1a3a2a] focus:border-[#1a3a2a] text-[#2f2c28]"
                  />
                </div>
              </div>
            </motion.div>
          )}

          {/* Step 1: Org Type — THE NON-NEGOTIABLE */}
          {step === 1 && (
            <motion.div
              key="step1-orgtype"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              className="space-y-8"
            >
              <div className="space-y-2">
                <h1 className="text-4xl font-bold tracking-tight text-[#142e20]">Your Org DNA.</h1>
                <p className="text-[#6b665f]">
                  Every metric, view, and entity will trace to your organization's growth model.
                  <span className="text-[#1a3a2a] font-semibold">
                    {" "}
                    If it doesn't track growth, it's noise.
                  </span>
                </p>
              </div>

              <div className="space-y-4">
                {[
                  {
                    id: "PRODUCT" as OrgType,
                    icon: Factory,
                    title: "Product-Based Organization",
                    subtitle: "SaaS, Platform, or Product Company",
                    northStar: "Product-Led Growth",
                    metrics: [
                      "ARR / MRR",
                      "Net Revenue Retention",
                      "Feature Adoption",
                      "Time to Value",
                      "DAU/MAU",
                    ],
                    description:
                      "All data drills down to product growth — adoption, retention, and expansion revenue.",
                    selectedClass: "bg-[#1a3a2a]/10 border-[#1a3a2a] ring-4 ring-[#1a3a2a]/20",
                  },
                  {
                    id: "SERVICES" as OrgType,
                    icon: Briefcase,
                    title: "Services-Based Organization",
                    subtitle: "Consulting, IT Services, or Agency",
                    northStar: "Service Delivery Excellence",
                    metrics: [
                      "Revenue per Engagement",
                      "Billable Utilization",
                      "Client Outcome Score",
                      "On-Time Delivery",
                      "Repeat Rate",
                    ],
                    description:
                      "All data drills down to service delivery — client outcomes, utilization, and margins.",
                    selectedClass: "bg-[#3d7a50]/10 border-[#3d7a50] ring-4 ring-[#3d7a50]/20",
                  },
                ].map((option) => {
                  const Icon = option.icon;
                  const isSelected = orgType === option.id;
                  return (
                    <button
                      key={option.id}
                      onClick={() => setOrgType(option.id)}
                      className={`w-full p-5 rounded-2xl border-2 text-left transition-all ${
                        isSelected
                          ? option.selectedClass
                          : "bg-white border-[#d8d2c6] hover:border-[#1a3a2a]/40"
                      }`}
                    >
                      <div className="flex items-start gap-4">
                        <div
                          className={`w-12 h-12 rounded-xl flex items-center justify-center ${
                            isSelected ? "bg-[#1a3a2a] text-white" : "bg-[#e9e5dd] text-[#6b665f]"
                          }`}
                        >
                          <Icon className="w-6 h-6" />
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2 mb-0.5">
                            <h3 className="font-bold text-lg text-[#142e20]">{option.title}</h3>
                            {isSelected && (
                              <CheckCircle2 className="w-5 h-5 text-[#1a3a2a] shrink-0" />
                            )}
                          </div>
                          <div className="text-xs text-[#6b665f] mb-2">{option.subtitle}</div>
                          <div className="text-sm text-[#6b665f] mb-3">{option.description}</div>

                          {/* Primary Focus */}
                          <div className="flex items-center gap-2 mb-2">
                            <Target className="w-3.5 h-3.5 text-[#1a3a2a]" />
                            <span className="text-[10px] uppercase font-bold text-[#1a3a2a] tracking-wider">
                              Primary Focus:
                            </span>
                            <span className="text-xs font-semibold text-[#142e20]">
                              {option.northStar}
                            </span>
                          </div>

                          {/* Key Metrics */}
                          <div className="flex flex-wrap gap-1.5">
                            {option.metrics.map((m) => (
                              <span
                                key={m}
                                className="px-2 py-0.5 rounded-full bg-[#e9e5dd] text-[9px] font-medium text-[#1a3a2a]"
                              >
                                {m}
                              </span>
                            ))}
                          </div>
                        </div>
                      </div>
                    </button>
                  );
                })}
              </div>

              {/* Two Lenses Explanation */}
              <div className="p-4 rounded-xl bg-white border border-[#d8d2c6]">
                <div className="text-[10px] uppercase font-bold text-[#6b665f] tracking-wider mb-3">
                  Every view serves two measurement lenses
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <div className="flex items-start gap-2">
                    <Building2 className="w-4 h-4 text-[#1a3a2a] mt-0.5 shrink-0" />
                    <div>
                      <div className="text-xs font-bold text-[#142e20]">Provider Lens</div>
                      <div className="text-[10px] text-[#6b665f]">How is YOUR org growing?</div>
                    </div>
                  </div>
                  <div className="flex items-start gap-2">
                    <Users className="w-4 h-4 text-[#3d7a50] mt-0.5 shrink-0" />
                    <div>
                      <div className="text-xs font-bold text-[#142e20]">Client Lens</div>
                      <div className="text-[10px] text-[#6b665f]">Is the CLIENT getting value?</div>
                    </div>
                  </div>
                </div>
              </div>
            </motion.div>
          )}

          {/* Step 2: Operating Context */}
          {step === 2 && (
            <motion.div
              key="step2"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              className="space-y-8"
            >
              <div className="space-y-2">
                <h1 className="text-4xl font-bold tracking-tight text-[#142e20]">
                  Operating Context.
                </h1>
                <p className="text-[#6b665f]">
                  Choose the lens through which you'll view the unified workspace. Every view will
                  show goal-aligned data for this context.
                </p>
              </div>
              <div className="grid grid-cols-2 gap-3">
                {[
                  { id: "CTX_BIZOPS", label: "Business Ops", icon: "🌏" },
                  { id: "CTX_CS", label: "Customer Success", icon: "💚" },
                  { id: "CTX_SALES", label: "Sales Ops", icon: "🎯" },
                  { id: "CTX_PM", label: "Project Management", icon: "📁" },
                  { id: "CTX_MARKETING", label: "Marketing", icon: "📣" },
                  { id: "CTX_TECH", label: "Engineering", icon: "💻" },
                ].map((ctx) => (
                  <button
                    key={ctx.id}
                    onClick={() => setActiveCtx(ctx.id as CTXEnum)}
                    className={`p-4 rounded-2xl border-2 text-left transition-all ${
                      activeCtx === ctx.id
                        ? "bg-[#1a3a2a]/10 border-[#1a3a2a] ring-4 ring-[#1a3a2a]/20"
                        : "bg-white border-[#d8d2c6] hover:border-[#1a3a2a]/40"
                    }`}
                  >
                    <div className="text-2xl mb-2">{ctx.icon}</div>
                    <div className="font-bold text-[#142e20]">{ctx.label}</div>
                    <div className="text-[10px] text-[#6b665f] uppercase font-mono mt-1">
                      {ctx.id}
                    </div>
                  </button>
                ))}
              </div>
            </motion.div>
          )}

          {/* Step 3: Connect */}
          {step === 3 && (
            <motion.div
              key="step3"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              className="space-y-8"
            >
              <div className="space-y-2">
                <h1 className="text-4xl font-bold tracking-tight text-[#142e20]">Connect Nodes.</h1>
                <p className="text-[#6b665f]">
                  Select the data sources to be ingested into the L3 Normalization Pipeline.
                </p>
              </div>
              <div className="grid grid-cols-3 gap-3">
                {CONNECTORS.map((conn) => (
                  <button
                    key={conn.id}
                    onClick={() => {
                      if (connectedApps.includes(conn.id)) {
                        setConnectedApps(connectedApps.filter((a) => a !== conn.id));
                      } else {
                        setConnectedApps([...connectedApps, conn.id]);
                      }
                    }}
                    className={`p-4 rounded-xl border-2 flex flex-col items-center gap-2 transition-all ${
                      connectedApps.includes(conn.id)
                        ? "bg-[#1a3a2a] border-[#1a3a2a] text-white shadow-lg shadow-[#1a3a2a]/20"
                        : "bg-white border-[#d8d2c6] text-[#2f2c28] hover:border-[#1a3a2a]/40"
                    }`}
                  >
                    <span className="text-2xl">{conn.icon}</span>
                    <span className="text-xs font-bold">{conn.name}</span>
                  </button>
                ))}
              </div>
            </motion.div>
          )}

          {/* Step 4: Ignite Spine */}
          {step === 4 && (
            <motion.div
              key="step4"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              className="space-y-8"
            >
              <div className="space-y-2">
                <h1 className="text-4xl font-bold tracking-tight text-[#142e20]">
                  Ignite the Spine.
                </h1>
                <p className="text-[#6b665f]">
                  The L3 8-stage normalization pipeline will now build your Goal-Anchored Single
                  Source of Truth.
                  <span className="text-[#1a3a2a] font-semibold">
                    {" "}
                    Every entity will trace to{" "}
                    {orgType === "PRODUCT" ? "product growth" : "service delivery"}.
                  </span>
                </p>
              </div>

              <div className="p-6 rounded-3xl bg-white border border-[#d8d2c6] shadow-sm space-y-6">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-full bg-[#1a3a2a]/10 text-[#1a3a2a] flex items-center justify-center">
                      <Zap className="w-5 h-5" />
                    </div>
                    <div>
                      <div className="font-bold text-[#142e20]">Goal-Anchored Spine Ready</div>
                      <div className="text-[10px] text-[#1a3a2a] font-mono">
                        Normalization_v4.2 + GoalAnchor_v1.0
                      </div>
                    </div>
                  </div>
                  <Lock className="w-4 h-4 text-[#d8d2c6]" />
                </div>

                <div className="space-y-2">
                  <div className="flex justify-between text-[10px] font-bold text-[#6b665f] uppercase tracking-widest">
                    <span>Provenance Confidence</span>
                    <span>98.4%</span>
                  </div>
                  <div className="h-2 w-full bg-[#e9e5dd] rounded-full overflow-hidden">
                    <div className="h-full bg-[#1a3a2a] w-[98.4%]" />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4 pt-4 border-t border-[#d8d2c6]">
                  <div>
                    <div className="text-[10px] text-[#6b665f] uppercase font-bold mb-1">
                      Identity
                    </div>
                    <div className="text-sm font-medium text-[#142e20]">
                      {userName || "Arun Kumar"}
                    </div>
                  </div>
                  <div>
                    <div className="text-[10px] text-[#6b665f] uppercase font-bold mb-1">
                      Org Type
                    </div>
                    <div className="text-sm font-medium flex items-center gap-1 text-[#142e20]">
                      {orgType === "PRODUCT" ? (
                        <Factory className="w-3.5 h-3.5 text-[#1a3a2a]" />
                      ) : (
                        <Briefcase className="w-3.5 h-3.5 text-[#3d7a50]" />
                      )}
                      {orgType === "PRODUCT" ? "Product" : "Services"}
                    </div>
                  </div>
                  <div>
                    <div className="text-[10px] text-[#6b665f] uppercase font-bold mb-1">
                      Active Context
                    </div>
                    <div className="text-sm font-medium text-[#142e20]">{activeCtx}</div>
                  </div>
                  <div>
                    <div className="text-[10px] text-[#6b665f] uppercase font-bold mb-1">
                      Primary Focus
                    </div>
                    <div className="text-sm font-medium text-[#1a3a2a] flex items-center gap-1">
                      <Target className="w-3.5 h-3.5" />
                      {orgType === "PRODUCT" ? "Product-Led Growth" : "Service Delivery"}
                    </div>
                  </div>
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        <div className="mt-12 flex justify-between items-center">
          <button
            onClick={() => setStep(Math.max(0, step - 1))}
            className={`text-[#6b665f] hover:text-[#2f2c28] transition-colors font-bold uppercase text-xs tracking-widest ${step === 0 ? "opacity-0 pointer-events-none" : ""}`}
          >
            Back
          </button>
          <Button
            onClick={handleNext}
            disabled={isInitializing || (step === 0 && !userName)}
            className="h-14 px-8 rounded-2xl bg-[#b8943f] text-white hover:bg-[#9a7a34] transition-all font-bold gap-3 shadow-lg shadow-[#b8943f]/20"
          >
            {isInitializing ? (
              <>
                <Loader2 className="w-5 h-5 animate-spin" />
                Normalizing...
              </>
            ) : (
              <>
                {step === STEPS.length - 1 ? "Complete Setup" : "Next Phase"}
                <ChevronRight className="w-5 h-5" />
              </>
            )}
          </Button>
        </div>
      </div>
    </div>
  );
}
