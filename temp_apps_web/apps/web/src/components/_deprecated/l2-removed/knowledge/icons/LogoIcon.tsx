import React from "react";
import { LogoMark } from "@/components/common/brand/logo";

export const LogoIcon: React.FC<{ className?: string }> = ({ className }) => (
  <LogoMark size={32} className={className} />
);
