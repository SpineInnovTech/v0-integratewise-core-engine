import React from "react";
import { Mail, Phone, MapPin, Linkedin, Twitter, Github } from "lucide-react";
// ── Logo: import from single source of truth ──
import { Logo } from "./logo";

export function Footer() {
  return (
    <footer className="bg-white border-t border-slate-100 pt-12 md:pt-20 pb-8 md:pb-10">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-10 md:gap-12 mb-12 md:mb-16">
          <div className="col-span-1 lg:col-span-1">
             <div className="flex items-center mb-6">
                <Logo width={120} />
              </div>
              <p className="text-slate-500 mb-6 leading-relaxed">
                The AI‑Native Integration Intelligence Platform that connects truth, context, and outcomes across your business.
              </p>
              <div className="flex gap-4">
                <a href="#" className="w-10 h-10 rounded-full bg-slate-50 flex items-center justify-center text-slate-400 hover:bg-[#4256AB] hover:text-white transition-all"><Twitter className="w-5 h-5" /></a>
                <a href="#" className="w-10 h-10 rounded-full bg-slate-50 flex items-center justify-center text-slate-400 hover:bg-[#4256AB] hover:text-white transition-all"><Linkedin className="w-5 h-5" /></a>
                <a href="#" className="w-10 h-10 rounded-full bg-slate-50 flex items-center justify-center text-slate-400 hover:bg-[#4256AB] hover:text-white transition-all"><Github className="w-5 h-5" /></a>
              </div>
          </div>

          <div>
            <h4 className="font-bold text-slate-900 mb-6">Product</h4>
            <ul className="space-y-4">
              <li><a href="/" className="text-slate-500 hover:text-[#4256AB] transition-colors">Platform Overview</a></li>
              <li><a href="/technical" className="text-slate-500 hover:text-[#4256AB] transition-colors">Architecture</a></li>
              <li><a href="/who-its-for" className="text-slate-500 hover:text-[#4256AB] transition-colors">Who It's For</a></li>
              <li><a href="/pricing" className="text-slate-500 hover:text-[#4256AB] transition-colors">Pricing</a></li>
              <li><a href="/security" className="text-slate-500 hover:text-[#4256AB] transition-colors">Security</a></li>
            </ul>
          </div>

          <div>
            <h4 className="font-bold text-slate-900 mb-6">Company</h4>
            <ul className="space-y-4">
              <li><a href="/story" className="text-slate-500 hover:text-[#4256AB] transition-colors">Our Story</a></li>
              <li><a href="/problem" className="text-slate-500 hover:text-[#4256AB] transition-colors">The Why</a></li>
              <li><a href="/demo" className="text-slate-500 hover:text-[#4256AB] transition-colors">Book a Demo</a></li>
              <li><a href="/contact" className="text-slate-500 hover:text-[#4256AB] transition-colors">Contact</a></li>
            </ul>
          </div>

          <div>
            <h4 className="font-bold text-slate-900 mb-6">Legal & Support</h4>
            <ul className="space-y-4">
              <li><a href="/privacy" className="text-slate-500 hover:text-[#4256AB] transition-colors">Privacy Policy</a></li>
              <li><a href="/terms" className="text-slate-500 hover:text-[#4256AB] transition-colors">Terms of Service</a></li>
              <li className="flex items-center gap-3 text-slate-500">
                <Mail className="w-5 h-5 text-[#D46780]" />
                <a href="mailto:connect@integratewise.ai" className="hover:text-[#4256AB]">connect@integratewise.ai</a>
              </li>
              <li className="flex items-center gap-3 text-slate-500">
                <Phone className="w-5 h-5 text-[#D46780]" />
                <a href="tel:+917026317111" className="hover:text-[#4256AB]">+91 7026317111</a>
              </li>
            </ul>
          </div>
        </div>

        <div className="border-t border-slate-100 pt-8 flex flex-col md:flex-row justify-between items-center text-sm text-slate-400 font-medium">
          <p>© 2026 IntegrateWise AI. All rights reserved.</p>
          <div className="flex gap-8 mt-4 md:mt-0">
            <a href="https://integratewise.ai" className="hover:text-[#4256AB]">www.integratewise.ai</a>
            <a href="https://app.integratewise.ai" className="hover:text-[#4256AB]">app.integratewise.ai</a>
          </div>
        </div>
      </div>
    </footer>
  );
}