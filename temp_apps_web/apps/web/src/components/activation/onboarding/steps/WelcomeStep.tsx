/**
 * Step 1: Welcome + Use Case Selection
 *
 * User selects how they'll use IntegrateWise:
 * - Personal: Organize personal work
 * - Work: Professional workflow
 * - Business: Company data & workflows
 */

import React, { useState } from "react";
import { Users, Briefcase, Building2, ArrowRight } from "lucide-react";

interface WelcomeStepProps {
  onComplete: (data: { useCase: "personal" | "work" | "business" }) => void;
}

const USE_CASES = [
  {
    id: "personal" as const,
    label: "Personal",
    description: "Organize personal work",
    icon: Users,
    iconClass: "text-iw-gold",
    selectedBorder: "border-iw-gold",
    selectedBg: "bg-iw-gold/5",
  },
  {
    id: "work" as const,
    label: "Work",
    description: "Professional workflow",
    icon: Briefcase,
    iconClass: "text-iw-forest",
    selectedBorder: "border-primary",
    selectedBg: "bg-primary/5",
  },
  {
    id: "business" as const,
    label: "Business",
    description: "Company data & workflows",
    icon: Building2,
    iconClass: "text-iw-slate",
    selectedBorder: "border-iw-slate",
    selectedBg: "bg-iw-slate/5",
  },
];

export function WelcomeStep({ onComplete }: WelcomeStepProps) {
  const [selected, setSelected] = useState<"personal" | "work" | "business" | null>(null);

  const handleContinue = () => {
    if (selected) {
      onComplete({ useCase: selected });
    }
  };

  return (
    <div className="max-w-5xl mx-auto w-full pt-2 font-iw-sans">
      <div className="text-center mb-10">
        <h2 className="text-[28px] md:text-[36px] leading-[1.06] font-iw-serif text-primary mb-3 tracking-[-0.02em]">
          Welcome to IntegrateWise
        </h2>
        <p className="text-[16px] md:text-[18px] leading-[1.14] font-medium text-muted-foreground mb-2">
          Your adaptive knowledge workspace
        </p>
        <p className="text-[15px] text-foreground font-semibold mt-4">
          How will you use IntegrateWise?
        </p>
      </div>

      <div className="mb-9 w-full">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
          {USE_CASES.map((useCase) => {
            const Icon = useCase.icon;
            const isSelected = selected === useCase.id;

            return (
              <button
                key={useCase.id}
                onClick={() => setSelected(useCase.id)}
                className={`min-h-[160px] rounded-2xl border-2 px-7 py-6 text-center transition-all duration-200 ${
                  isSelected
                    ? `${useCase.selectedBorder} ${useCase.selectedBg} shadow-xs`
                    : "border-border bg-card hover:border-muted-foreground/50"
                }`}
              >
                <Icon className={`w-9 h-9 mx-auto mb-4 ${useCase.iconClass}`} strokeWidth={2} />
                <div className="text-[18px] font-semibold text-foreground mb-2">
                  {useCase.label}
                </div>
                <div className="text-[14px] text-muted-foreground leading-[1.3]">
                  {useCase.description}
                </div>
              </button>
            );
          })}
        </div>
      </div>

      <button
        onClick={handleContinue}
        disabled={!selected}
        className={`w-full h-[48px] rounded-xl flex items-center justify-center gap-2 text-[15px] font-bold transition-all ${
          selected
            ? "bg-primary text-primary-foreground hover:bg-iw-forest-bright"
            : "bg-muted text-muted-foreground cursor-not-allowed border border-border"
        }`}
      >
        Continue
        <ArrowRight className="w-5 h-5" />
      </button>
    </div>
  );
}

export default WelcomeStep;
