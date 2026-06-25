import { Link } from "wouter";

export default function LandingPage() {
  return (
    <div className="min-h-screen bg-[#f6faf6] text-[#1a1a1a] font-sans">
      {/* Nav */}
      <header className="flex items-center justify-between px-8 py-4 max-w-7xl mx-auto">
        <Link href="/" className="flex items-center gap-2">
          <IWIcon />
          <span className="font-semibold text-[17px] tracking-tight text-[#1a1a1a]">IntegrateWise</span>
        </Link>
        <nav className="hidden md:flex items-center gap-8 text-[14px] text-[#444]">
          <a href="#features" className="hover:text-[#1a1a1a] transition-colors">Features</a>
          <a href="#integrations" className="hover:text-[#1a1a1a] transition-colors">Integrations</a>
          <a href="#pricing" className="hover:text-[#1a1a1a] transition-colors">Pricing</a>
          <a href="#customers" className="hover:text-[#1a1a1a] transition-colors">Customers</a>
        </nav>
        <div className="flex items-center gap-3">
          <Link href="/app" className="text-[14px] text-[#444] hover:text-[#1a1a1a] transition-colors">
            Sign In
          </Link>
          <Link
            href="/app"
            className="flex items-center gap-1.5 bg-[#1a3d1a] text-white text-[14px] font-medium px-4 py-2 rounded-lg hover:bg-[#234a23] transition-colors"
          >
            Get Started Free
            <svg width="14" height="14" viewBox="0 0 14 14" fill="none"><path d="M3 7h8M7.5 4l3.5 3-3.5 3" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/></svg>
          </Link>
        </div>
      </header>

      {/* Hero */}
      <main className="max-w-7xl mx-auto px-8 pt-16 pb-8 text-center">
        {/* Badge */}
        <div className="inline-flex items-center gap-2 bg-white border border-[#c8e6c8] text-[#2d6a2d] text-[13px] font-medium px-4 py-1.5 rounded-full mb-8 shadow-sm">
          <svg width="12" height="12" viewBox="0 0 12 12" fill="currentColor">
            <path d="M6 0l.75 4.5L11 6l-4.25 1.5L6 12l-.75-4.5L1 6l4.25-1.5z"/>
          </svg>
          AI-Powered Business OS
        </div>

        {/* Headline */}
        <h1 className="text-[56px] sm:text-[68px] font-bold leading-[1.05] tracking-[-0.02em] mb-6 max-w-3xl mx-auto">
          Your Business{" "}
          <span className="text-[#2d6a2d]">Command Center</span>
        </h1>

        <p className="text-[18px] text-[#555] max-w-xl mx-auto mb-10 leading-relaxed">
          Connect all your tools, automate workflows, and get AI-powered insights.
          IntegrateWise is the operating system for modern businesses.
        </p>

        {/* CTAs */}
        <div className="flex items-center justify-center gap-4 mb-8">
          <Link
            href="/app"
            className="flex items-center gap-2 bg-[#1a3d1a] text-white text-[15px] font-semibold px-6 py-3 rounded-xl hover:bg-[#234a23] transition-colors shadow-sm"
          >
            Start for Free
            <svg width="16" height="16" viewBox="0 0 16 16" fill="none"><path d="M3 8h10M8.5 4.5 13 8l-4.5 3.5" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"/></svg>
          </Link>
          <button className="flex items-center gap-2 bg-white border border-[#ddd] text-[#1a1a1a] text-[15px] font-medium px-6 py-3 rounded-xl hover:bg-[#f5f5f5] transition-colors shadow-sm">
            <svg width="14" height="14" viewBox="0 0 14 14" fill="currentColor"><path d="M3 2l9 5-9 5V2z"/></svg>
            Watch Demo
          </button>
        </div>

        {/* Trust pills */}
        <div className="flex items-center justify-center gap-6 text-[13px] text-[#666]">
          <span className="flex items-center gap-1.5">
            <svg width="14" height="14" viewBox="0 0 14 14" fill="#2d6a2d"><path d="M2 7l3.5 3.5L12 3.5" stroke="#2d6a2d" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" fill="none"/></svg>
            Free 14-day trial
          </span>
          <span className="flex items-center gap-1.5">
            <svg width="14" height="14" viewBox="0 0 14 14" fill="none"><path d="M2 7l3.5 3.5L12 3.5" stroke="#2d6a2d" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"/></svg>
            No credit card required
          </span>
          <span className="flex items-center gap-1.5">
            <svg width="14" height="14" viewBox="0 0 14 14" fill="none"><path d="M2 7l3.5 3.5L12 3.5" stroke="#2d6a2d" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"/></svg>
            Cancel anytime
          </span>
        </div>
      </main>

      {/* Dashboard mockup */}
      <div className="max-w-5xl mx-auto px-8 pt-12 pb-24">
        <div className="bg-white rounded-2xl border border-[#e0e0e0] shadow-xl overflow-hidden">
          {/* Browser chrome */}
          <div className="flex items-center gap-2 px-4 py-3 bg-[#f7f7f7] border-b border-[#e5e5e5]">
            <span className="w-3 h-3 rounded-full bg-[#ff5f57]" />
            <span className="w-3 h-3 rounded-full bg-[#febc2e]" />
            <span className="w-3 h-3 rounded-full bg-[#28c840]" />
            <div className="flex-1 mx-4 h-5 bg-[#e8e8e8] rounded-md" />
          </div>
          {/* Mock dashboard content */}
          <div className="flex h-56">
            {/* Sidebar */}
            <div className="w-48 bg-[#f9faf9] border-r border-[#efefef] p-3 flex flex-col gap-2">
              {["Dashboard", "Leads", "Pipeline", "Clients", "Tasks", "Metrics"].map((item) => (
                <div key={item} className="flex items-center gap-2 px-2 py-1.5 rounded">
                  <div className="w-3.5 h-3.5 rounded bg-[#c8e0c8]" />
                  <div className="h-2.5 bg-[#ddd] rounded flex-1" />
                </div>
              ))}
            </div>
            {/* Main area */}
            <div className="flex-1 p-5 bg-white">
              <div className="grid grid-cols-4 gap-3 mb-4">
                {[["#dcf0dc","#a8d5a8"],["#fef3c7","#fcd34d"],["#dbeafe","#93c5fd"],["#fce7f3","#f9a8d4"]].map(([bg, accent], i) => (
                  <div key={i} className="rounded-lg p-3" style={{ background: bg }}>
                    <div className="w-8 h-1.5 rounded mb-2" style={{ background: accent }} />
                    <div className="w-12 h-4 rounded font-bold" style={{ background: accent, opacity: 0.7 }} />
                  </div>
                ))}
              </div>
              <div className="grid grid-cols-3 gap-3">
                {[0,1,2].map(i => (
                  <div key={i} className="h-16 rounded-lg bg-[#f5f5f5] border border-[#ebebeb] p-2.5">
                    <div className="w-16 h-2 bg-[#ddd] rounded mb-2" />
                    <div className="w-10 h-3 bg-[#c8dfc8] rounded" />
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Footer */}
      <footer className="border-t border-[#e5e5e5] py-8">
        <div className="max-w-7xl mx-auto px-8 flex items-center justify-between text-[13px] text-[#888]">
          <div className="flex items-center gap-2">
            <IWIcon size={20} />
            <span>© 2026 IntegrateWise. All rights reserved.</span>
          </div>
          <div className="flex gap-6">
            <a href="#pricing" className="hover:text-[#1a1a1a] transition-colors">Pricing</a>
            <a href="#integrations" className="hover:text-[#1a1a1a] transition-colors">Integrations</a>
            <a href="#" className="hover:text-[#1a1a1a] transition-colors">Contact</a>
          </div>
        </div>
      </footer>
    </div>
  );
}

function IWIcon({ size = 28 }: { size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 28 28" fill="none" xmlns="http://www.w3.org/2000/svg">
      <rect width="28" height="28" rx="8" fill="#1a3d1a"/>
      <path d="M14 5v18M5 14h18M8.05 8.05l11.9 11.9M19.95 8.05L8.05 19.95" stroke="white" strokeWidth="2.2" strokeLinecap="round"/>
    </svg>
  );
}
