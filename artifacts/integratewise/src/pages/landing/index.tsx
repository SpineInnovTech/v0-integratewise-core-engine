import { Link } from "wouter";

export default function LandingPage() {
  return (
    <div className="min-h-screen bg-[#f5faf5] text-[#1a1a1a] font-sans overflow-hidden">
      {/* Radial green blob — top left */}
      <div
        aria-hidden
        style={{
          position: "fixed",
          top: -120,
          left: -120,
          width: 560,
          height: 560,
          borderRadius: "50%",
          background: "radial-gradient(circle, rgba(134,200,134,0.35) 0%, rgba(134,200,134,0.0) 70%)",
          pointerEvents: "none",
          zIndex: 0,
        }}
      />

      <div style={{ position: "relative", zIndex: 1 }}>
        {/* Nav */}
        <header className="flex items-center justify-between px-8 py-5 max-w-7xl mx-auto">
          <Link href="/" className="flex items-center gap-2.5">
            <SnowflakeIcon />
            <span className="font-bold text-[17px] tracking-tight text-[#1a1a1a]">IntegrateWise</span>
          </Link>
          <nav className="hidden md:flex items-center gap-8 text-[14px] text-[#555]">
            <a href="#features" className="hover:text-[#1a1a1a] transition-colors">Features</a>
            <a href="#integrations" className="hover:text-[#1a1a1a] transition-colors">Integrations</a>
            <a href="#pricing" className="hover:text-[#1a1a1a] transition-colors">Pricing</a>
            <a href="#customers" className="hover:text-[#1a1a1a] transition-colors">Customers</a>
          </nav>
          <div className="flex items-center gap-4">
            <Link href="/app" className="text-[14px] text-[#555] hover:text-[#1a1a1a] transition-colors font-medium">
              Sign In
            </Link>
            <Link
              href="/app"
              className="flex items-center gap-1.5 bg-[#1e4620] text-white text-[14px] font-semibold px-5 py-2.5 rounded-xl hover:bg-[#275429] transition-colors shadow-sm"
            >
              Get Started Free
              <svg width="14" height="14" viewBox="0 0 14 14" fill="none"><path d="M2.5 7h9M8 3.5 11.5 7 8 10.5" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"/></svg>
            </Link>
          </div>
        </header>

        {/* Hero */}
        <main className="max-w-4xl mx-auto px-8 pt-14 pb-10 text-center">
          {/* Badge */}
          <div className="inline-flex items-center gap-2 bg-[#e8f5e8] border border-[#b8ddb8] text-[#2d6a2d] text-[13px] font-semibold px-4 py-2 rounded-full mb-10 shadow-sm">
            <svg width="11" height="11" viewBox="0 0 11 11" fill="currentColor">
              <path d="M5.5 0l.6 3.9L10 5.5l-3.9.6L5.5 11l-.6-3.9L1 5.5l3.9-.6z"/>
            </svg>
            AI-Powered Business OS
          </div>

          {/* Headline */}
          <h1 className="text-[64px] sm:text-[76px] font-black leading-[1.0] tracking-[-0.025em] mb-7">
            Your Business
            <br />
            <span className="text-[#2a7a2a]">Command Center</span>
          </h1>

          <p className="text-[17px] text-[#666] max-w-[520px] mx-auto mb-10 leading-[1.65]">
            Connect all your tools, automate workflows, and get AI-powered insights.
            IntegrateWise is the operating system for modern businesses.
          </p>

          {/* CTAs */}
          <div className="flex items-center justify-center gap-3 mb-8">
            <Link
              href="/app"
              className="flex items-center gap-2 bg-[#1e4620] text-white text-[15px] font-bold px-7 py-3.5 rounded-xl hover:bg-[#275429] transition-colors shadow-md"
            >
              Start for Free
              <svg width="16" height="16" viewBox="0 0 16 16" fill="none"><path d="M3 8h10M9 4.5 13 8l-4 3.5" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/></svg>
            </Link>
            <button className="flex items-center gap-2.5 bg-white border border-[#ddd] text-[#1a1a1a] text-[15px] font-semibold px-7 py-3.5 rounded-xl hover:bg-[#f7f7f7] transition-colors shadow-sm">
              <svg width="13" height="13" viewBox="0 0 13 13" fill="currentColor"><path d="M2.5 1.5l9 5-9 5V1.5z"/></svg>
              Watch Demo
            </button>
          </div>

          {/* Trust pills */}
          <div className="flex items-center justify-center gap-7 text-[13px] text-[#777]">
            {["Free 14-day trial", "No credit card required", "Cancel anytime"].map((t) => (
              <span key={t} className="flex items-center gap-1.5">
                <svg width="15" height="15" viewBox="0 0 15 15" fill="none">
                  <circle cx="7.5" cy="7.5" r="6.5" stroke="#aaa" strokeWidth="1.3"/>
                  <path d="M4.5 7.5l2 2 4-4" stroke="#2a7a2a" strokeWidth="1.4" strokeLinecap="round" strokeLinejoin="round"/>
                </svg>
                {t}
              </span>
            ))}
          </div>
        </main>

        {/* Dashboard mockup */}
        <div className="max-w-[840px] mx-auto px-8 pb-32 relative">
          {/* Floating widget — Revenue */}
          <div className="absolute left-2 sm:left-8 top-10 z-10 bg-white rounded-2xl shadow-xl border border-[#e8e8e8] px-4 py-3 flex items-center gap-3">
            <div className="w-8 h-8 rounded-full bg-[#e8f5e8] flex items-center justify-center">
              <svg width="16" height="16" viewBox="0 0 16 16" fill="none"><path d="M2 11L6 7l3 3 5-6" stroke="#2a7a2a" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"/></svg>
            </div>
            <div>
              <div className="text-[11px] text-[#999] font-medium">Revenue</div>
              <div className="text-[15px] font-bold text-[#1a1a1a]">+42%</div>
            </div>
          </div>

          {/* Floating widget — Active Users */}
          <div className="absolute right-2 sm:right-8 top-16 z-10 bg-white rounded-2xl shadow-xl border border-[#e8e8e8] px-4 py-3 flex items-center gap-3">
            <div className="w-8 h-8 rounded-full bg-[#e8f5e8] flex items-center justify-center">
              <svg width="16" height="16" viewBox="0 0 16 16" fill="none"><circle cx="8" cy="5.5" r="2.5" stroke="#2a7a2a" strokeWidth="1.5"/><path d="M2.5 13c0-3.038 2.462-5.5 5.5-5.5s5.5 2.462 5.5 5.5" stroke="#2a7a2a" strokeWidth="1.5" strokeLinecap="round"/></svg>
            </div>
            <div>
              <div className="text-[11px] text-[#999] font-medium">Active Users</div>
              <div className="text-[15px] font-bold text-[#1a1a1a]">2,847</div>
            </div>
          </div>

          {/* Main mockup card */}
          <div className="bg-white rounded-3xl border border-[#e0e0e0] shadow-2xl overflow-hidden">
            {/* Browser chrome */}
            <div className="flex items-center gap-2 px-5 py-4 bg-[#f8f8f8] border-b border-[#ebebeb]">
              <span className="w-3 h-3 rounded-full bg-[#ff5f57]" />
              <span className="w-3 h-3 rounded-full bg-[#febc2e]" />
              <span className="w-3 h-3 rounded-full bg-[#28c840]" />
              <div className="flex-1 mx-5 h-5 bg-[#e8e8e8] rounded-full" />
            </div>

            {/* App layout */}
            <div className="flex h-64">
              {/* Sidebar */}
              <div className="w-44 bg-[#f9faf9] border-r border-[#f0f0f0] p-3 space-y-1 flex-shrink-0">
                {[
                  { label: "Dashboard", active: true },
                  { label: "Pipeline" },
                  { label: "Clients" },
                  { label: "Analytics" },
                  { label: "Tasks" },
                ].map(({ label, active }) => (
                  <div
                    key={label}
                    className={`flex items-center gap-2 px-3 py-2 rounded-lg ${active ? "bg-[#d4ecd4]" : ""}`}
                  >
                    <div className={`w-2 h-2 rounded-sm ${active ? "bg-[#2a7a2a]" : "bg-[#ddd]"}`} />
                    <div className={`h-2 rounded flex-1 ${active ? "bg-[#5aaa5a]" : "bg-[#e5e5e5]"}`} />
                  </div>
                ))}
              </div>

              {/* Main content */}
              <div className="flex-1 bg-white p-5">
                {/* Top KPI row */}
                <div className="grid grid-cols-4 gap-2.5 mb-4">
                  {["", "", "", ""].map((_, i) => (
                    <div key={i} className="bg-[#f5faf5] rounded-lg p-2.5 border border-[#eaf3ea]">
                      <div className="w-12 h-1.5 bg-[#c5e0c5] rounded mb-2" />
                      <div className="w-8 h-3 bg-[#8dca8d] rounded" />
                    </div>
                  ))}
                </div>

                {/* Bar chart */}
                <div className="bg-[#f9faf9] rounded-xl border border-[#efefef] p-3 h-28 flex flex-col">
                  <div className="w-20 h-2 bg-[#ddd] rounded mb-3" />
                  <div className="flex items-end gap-1.5 flex-1">
                    {[35, 55, 42, 68, 52, 75, 60, 82, 65, 90, 72, 88].map((h, i) => (
                      <div
                        key={i}
                        className="flex-1 rounded-t"
                        style={{
                          height: `${h}%`,
                          background: i === 11 ? "#2a7a2a" : `rgba(90, 170, 90, ${0.3 + h / 200})`,
                        }}
                      />
                    ))}
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

function SnowflakeIcon() {
  return (
    <svg width="32" height="32" viewBox="0 0 32 32" fill="none" xmlns="http://www.w3.org/2000/svg">
      <circle cx="16" cy="16" r="16" fill="white"/>
      <g stroke="#2a7a2a" strokeWidth="2" strokeLinecap="round">
        <line x1="16" y1="7" x2="16" y2="25" />
        <line x1="7" y1="16" x2="25" y2="16" />
        <line x1="9.5" y1="9.5" x2="22.5" y2="22.5" />
        <line x1="22.5" y1="9.5" x2="9.5" y2="22.5" />
        <line x1="16" y1="7" x2="13.5" y2="10" />
        <line x1="16" y1="7" x2="18.5" y2="10" />
        <line x1="16" y1="25" x2="13.5" y2="22" />
        <line x1="16" y1="25" x2="18.5" y2="22" />
        <line x1="7" y1="16" x2="10" y2="13.5" />
        <line x1="7" y1="16" x2="10" y2="18.5" />
        <line x1="25" y1="16" x2="22" y2="13.5" />
        <line x1="25" y1="16" x2="22" y2="18.5" />
      </g>
    </svg>
  );
}
