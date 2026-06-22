import React, { useState } from "react";
import { Layout } from "./Layout";
import { Calendar, Mail, Building2, User, Phone, MessageSquare, CheckCircle2, Clock, Zap } from "lucide-react";

export function DemoPage() {
  const [formData, setFormData] = useState({
    name: "",
    email: "",
    company: "",
    phone: "",
    role: "",
    companySize: "",
    useCase: "",
    message: ""
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    // Handle form submission
    console.log("Demo request:", formData);
    alert("Thank you! We'll be in touch within 24 hours to schedule your demo.");
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  return (
    <Layout>
      <div className="pt-16 md:pt-20">
        {/* Hero */}
        <div className="py-16 md:py-24 bg-gradient-to-br from-[#1E2A4A] to-[#3F5185] text-white">
          <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
            <div className="inline-flex items-center gap-2 bg-white/10 backdrop-blur-sm border border-white/20 rounded-full px-4 py-2 mb-6">
              <Calendar className="w-4 h-4" />
              <span className="text-sm font-semibold">Book Your 30-Minute Demo</span>
            </div>
            <h1 className="text-4xl md:text-5xl lg:text-6xl font-black mb-6">
              See IntegrateWise <span className="text-[#D46780]">Live in Action</span>
            </h1>
            <p className="text-xl md:text-2xl text-white/80 mb-8 max-w-3xl mx-auto">
              Watch how IntegrateWise unifies your data, surfaces hidden insights, and prevents revenue leakage—tailored to your specific stack.
            </p>
          </div>
        </div>

        {/* Main Content */}
        <div className="py-16 md:py-24 bg-white">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-12">
              {/* Left - What to Expect */}
              <div>
                <h2 className="text-3xl font-bold text-[#1E2A4A] mb-8">What You'll See in Your Demo</h2>
                <div className="space-y-6 mb-10">
                  {[
                    {
                      icon: Zap,
                      title: "Live Data Integration",
                      desc: "We'll connect to your Salesforce, HubSpot, or Zendesk (your choice) and show live data flowing into the Spine in real-time."
                    },
                    {
                      icon: CheckCircle2,
                      title: "Canonical Entity Resolution",
                      desc: "Watch as IntegrateWise automatically merges duplicate accounts, contacts, and deals across your tools."
                    },
                    {
                      icon: MessageSquare,
                      title: "Dual-Context Intelligence",
                      desc: "See how our AI detects mismatches between your vendor CRM data and client reality (support tickets, usage, payments)."
                    },
                    {
                      icon: Clock,
                      title: "Human-in-the-Loop Gates",
                      desc: "See AI-proposed actions (like adjusting renewal probabilities) awaiting your approval—no black box automations."
                    }
                  ].map((item, i) => (
                    <div key={i} className="flex items-start gap-4">
                      <div className="w-12 h-12 rounded-xl bg-[#4256AB]/10 flex items-center justify-center shrink-0">
                        <item.icon className="w-6 h-6 text-[#4256AB]" />
                      </div>
                      <div>
                        <h3 className="text-lg font-bold text-slate-900 mb-1">{item.title}</h3>
                        <p className="text-slate-600">{item.desc}</p>
                      </div>
                    </div>
                  ))}
                </div>

                {/* Testimonial */}
                <div className="bg-slate-50 rounded-2xl p-6 border-l-4 border-[#4256AB]">
                  <p className="text-slate-700 italic mb-4">
                    "The demo sold itself. We saw our actual Salesforce and Zendesk data merging in real-time. 
                    Within 10 minutes I knew this would save us 15 hours a week."
                  </p>
                  <div className="flex items-center gap-3">
                    <div className="w-12 h-12 rounded-full bg-[#4256AB]/20 flex items-center justify-center font-bold text-[#4256AB]">
                      SK
                    </div>
                    <div>
                      <div className="font-bold text-slate-900">Sarah K.</div>
                      <div className="text-sm text-slate-500">VP Customer Success, B2B SaaS</div>
                    </div>
                  </div>
                </div>
              </div>

              {/* Right - Form */}
              <div>
                <div className="bg-white border-2 border-slate-200 rounded-3xl p-8 shadow-xl">
                  <h3 className="text-2xl font-bold text-[#1E2A4A] mb-6">Request Your Demo</h3>
                  <form onSubmit={handleSubmit} className="space-y-5">
                    <div>
                      <label className="block text-sm font-semibold text-slate-700 mb-2">
                        Full Name *
                      </label>
                      <div className="relative">
                        <User className="absolute left-3 top-3 w-5 h-5 text-slate-400" />
                        <input
                          type="text"
                          name="name"
                          value={formData.name}
                          onChange={handleChange}
                          required
                          className="w-full pl-11 pr-4 py-3 border-2 border-slate-200 rounded-xl focus:border-[#4256AB] focus:ring-2 focus:ring-[#4256AB]/20 outline-none transition-all"
                          placeholder="John Doe"
                        />
                      </div>
                    </div>

                    <div>
                      <label className="block text-sm font-semibold text-slate-700 mb-2">
                        Work Email *
                      </label>
                      <div className="relative">
                        <Mail className="absolute left-3 top-3 w-5 h-5 text-slate-400" />
                        <input
                          type="email"
                          name="email"
                          value={formData.email}
                          onChange={handleChange}
                          required
                          className="w-full pl-11 pr-4 py-3 border-2 border-slate-200 rounded-xl focus:border-[#4256AB] focus:ring-2 focus:ring-[#4256AB]/20 outline-none transition-all"
                          placeholder="john@company.com"
                        />
                      </div>
                    </div>

                    <div>
                      <label className="block text-sm font-semibold text-slate-700 mb-2">
                        Company *
                      </label>
                      <div className="relative">
                        <Building2 className="absolute left-3 top-3 w-5 h-5 text-slate-400" />
                        <input
                          type="text"
                          name="company"
                          value={formData.company}
                          onChange={handleChange}
                          required
                          className="w-full pl-11 pr-4 py-3 border-2 border-slate-200 rounded-xl focus:border-[#4256AB] focus:ring-2 focus:ring-[#4256AB]/20 outline-none transition-all"
                          placeholder="Acme Inc."
                        />
                      </div>
                    </div>

                    <div>
                      <label className="block text-sm font-semibold text-slate-700 mb-2">
                        Phone Number
                      </label>
                      <div className="relative">
                        <Phone className="absolute left-3 top-3 w-5 h-5 text-slate-400" />
                        <input
                          type="tel"
                          name="phone"
                          value={formData.phone}
                          onChange={handleChange}
                          className="w-full pl-11 pr-4 py-3 border-2 border-slate-200 rounded-xl focus:border-[#4256AB] focus:ring-2 focus:ring-[#4256AB]/20 outline-none transition-all"
                          placeholder="+1 (555) 000-0000"
                        />
                      </div>
                    </div>

                    <div>
                      <label className="block text-sm font-semibold text-slate-700 mb-2">
                        Your Role *
                      </label>
                      <select
                        name="role"
                        value={formData.role}
                        onChange={handleChange}
                        required
                        className="w-full px-4 py-3 border-2 border-slate-200 rounded-xl focus:border-[#4256AB] focus:ring-2 focus:ring-[#4256AB]/20 outline-none transition-all"
                      >
                        <option value="">Select your role...</option>
                        <option value="vp-cs">VP/Head of Customer Success</option>
                        <option value="revops">RevOps / Sales Ops</option>
                        <option value="vp-sales">VP/Head of Sales</option>
                        <option value="ceo">CEO / Founder</option>
                        <option value="cto">CTO / VP Engineering</option>
                        <option value="other">Other</option>
                      </select>
                    </div>

                    <div>
                      <label className="block text-sm font-semibold text-slate-700 mb-2">
                        Company Size *
                      </label>
                      <select
                        name="companySize"
                        value={formData.companySize}
                        onChange={handleChange}
                        required
                        className="w-full px-4 py-3 border-2 border-slate-200 rounded-xl focus:border-[#4256AB] focus:ring-2 focus:ring-[#4256AB]/20 outline-none transition-all"
                      >
                        <option value="">Select company size...</option>
                        <option value="1-10">1-10 employees</option>
                        <option value="11-50">11-50 employees</option>
                        <option value="51-200">51-200 employees</option>
                        <option value="201-500">201-500 employees</option>
                        <option value="500+">500+ employees</option>
                      </select>
                    </div>

                    <div>
                      <label className="block text-sm font-semibold text-slate-700 mb-2">
                        Primary Use Case
                      </label>
                      <textarea
                        name="message"
                        value={formData.message}
                        onChange={handleChange}
                        rows={4}
                        className="w-full px-4 py-3 border-2 border-slate-200 rounded-xl focus:border-[#4256AB] focus:ring-2 focus:ring-[#4256AB]/20 outline-none transition-all resize-none"
                        placeholder="Tell us what you're hoping to solve (e.g., 'Reduce churn', 'Speed up expansion deals', 'Unify CRM + support data')"
                      />
                    </div>

                    <button
                      type="submit"
                      className="w-full bg-[#4256AB] hover:bg-[#3F5185] text-white font-bold py-4 rounded-xl transition-all hover:shadow-xl hover:shadow-[#4256AB]/20 flex items-center justify-center gap-2"
                    >
                      Request Demo <Calendar className="w-5 h-5" />
                    </button>

                    <p className="text-xs text-slate-500 text-center">
                      We'll respond within 24 hours to schedule your personalized demo.
                    </p>
                  </form>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Trust Bar */}
        <div className="py-12 bg-slate-50 border-t border-slate-200">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="grid grid-cols-2 md:grid-cols-4 gap-8 text-center">
              {[
                { stat: "< 24hr", label: "Response Time" },
                { stat: "30 min", label: "Demo Duration" },
                { stat: "Tailored", label: "To Your Stack" },
                { stat: "No Pressure", label: "Zero Sales Push" }
              ].map((item, i) => (
                <div key={i}>
                  <div className="text-3xl font-black text-[#4256AB] mb-1">{item.stat}</div>
                  <div className="text-sm text-slate-600">{item.label}</div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </Layout>
  );
}
