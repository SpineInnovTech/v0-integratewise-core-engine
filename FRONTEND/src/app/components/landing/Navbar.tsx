import React from "react";
import { Menu, X } from "lucide-react";
// ── Logo: import from single source of truth ──
import { Logo } from "./logo";

interface NavbarProps {
  onNavigate: (page: "home" | "technical" | "problem" | "audience" | "pricing" | "app") => void;
  currentPage: string;
}

export function Navbar({ onNavigate, currentPage }: NavbarProps) {
  const [isMobileMenuOpen, setIsMobileMenuOpen] = React.useState(false);

  return (
    <nav className="fixed top-0 left-0 right-0 z-50 bg-white/80 backdrop-blur-md border-b border-slate-100">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center h-16 md:h-20">
          {/* Logo */}
          <div 
            className="flex items-center cursor-pointer" 
            onClick={() => {
              onNavigate("home");
              window.location.hash = "";
            }}
          >
            <Logo width={36} className="mr-2 md:mr-3" />
            <div className="flex flex-col">
              <span className="text-xl md:text-2xl font-bold tracking-tight text-[#1E2A4A]">
                Integrate<span className="text-[#D46780]">Wise</span>
              </span>
              <span className="hidden lg:block text-[9px] text-slate-400 uppercase tracking-wider -mt-0.5">
                Knowledge Workspace
              </span>
            </div>
          </div>

          {/* Desktop Nav */}
          <div className="hidden md:flex items-center space-x-8">
            <button 
              onClick={() => { onNavigate("problem"); window.location.hash = "problem"; }}
              className={`font-medium transition-colors ${currentPage === 'problem' ? 'text-[#4256AB]' : 'text-slate-600 hover:text-[#4256AB]'}`}
            >
              The Why
            </button>
            <button 
              onClick={() => { onNavigate("audience"); window.location.hash = "audience"; }}
              className={`font-medium transition-colors ${currentPage === 'audience' ? 'text-[#4256AB]' : 'text-slate-600 hover:text-[#4256AB]'}`}
            >
              Who It's For
            </button>
            <button 
              onClick={() => { onNavigate("technical"); window.location.hash = "technical"; }}
              className={`font-medium transition-colors ${currentPage === 'technical' ? 'text-[#4256AB]' : 'text-slate-600 hover:text-[#4256AB]'}`}
            >
              Architecture
            </button>
            <button 
              onClick={() => { onNavigate("pricing"); window.location.hash = "pricing"; }}
              className={`font-medium transition-colors ${currentPage === 'pricing' ? 'text-[#4256AB]' : 'text-slate-600 hover:text-[#4256AB]'}`}
            >
              Pricing
            </button>
            <button 
              onClick={() => { onNavigate("app"); window.location.hash = "app"; }}
              className="bg-[#4256AB] hover:bg-[#4152A1] text-white px-6 py-2.5 rounded-full font-semibold transition-all hover:shadow-lg hover:shadow-[#4256AB]/20"
            >
              Go to App
            </button>
          </div>

          {/* Mobile Menu Toggle */}
          <div className="md:hidden">
            <button onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)} className="text-slate-600 p-2">
              {isMobileMenuOpen ? <X /> : <Menu />}
            </button>
          </div>
        </div>
      </div>

      {/* Mobile Menu */}
      {isMobileMenuOpen && (
        <div className="md:hidden bg-white border-b border-slate-100 p-4 space-y-4 shadow-xl">
          <button 
            className="block text-slate-600 font-medium py-2 w-full text-left" 
            onClick={() => { onNavigate("problem"); window.location.hash = "problem"; setIsMobileMenuOpen(false); }}
          >
            The Why
          </button>
          <button 
            className="block text-slate-600 font-medium py-2 w-full text-left" 
            onClick={() => { onNavigate("audience"); window.location.hash = "audience"; setIsMobileMenuOpen(false); }}
          >
            Who It's For
          </button>
          <button 
            className="block text-slate-600 font-medium py-2 w-full text-left" 
            onClick={() => { onNavigate("technical"); window.location.hash = "technical"; setIsMobileMenuOpen(false); }}
          >
            Architecture
          </button>
          <button 
            className="block text-slate-600 font-medium py-2 w-full text-left" 
            onClick={() => { onNavigate("pricing"); window.location.hash = "pricing"; setIsMobileMenuOpen(false); }}
          >
            Pricing
          </button>
          <button 
            onClick={() => { onNavigate("app"); window.location.hash = "app"; setIsMobileMenuOpen(false); }}
            className="w-full bg-[#4256AB] text-white px-6 py-3 rounded-xl font-semibold text-center"
          >
            Launch App
          </button>
        </div>
      )}
    </nav>
  );
}