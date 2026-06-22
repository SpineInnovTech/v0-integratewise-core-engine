import React, { useState } from "react";
import { Layout } from "./Layout";
import { Mail, Phone, MapPin, MessageSquare, Send, Clock } from "lucide-react";

export function ContactPage() {
  const [formData, setFormData] = useState({
    name: "",
    email: "",
    subject: "",
    message: ""
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    console.log("Contact form:", formData);
    alert("Thank you! We'll respond within 24 hours.");
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  return (
    <Layout>
      <div className="pt-16 md:pt-20">
        {/* Hero */}
        <div className="py-16 md:py-24 bg-gradient-to-br from-[#1E2A4A] to-[#3F5185] text-white">
          <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
            <h1 className="text-4xl md:text-5xl lg:text-6xl font-black mb-6">
              Let's <span className="text-[#D46780]">Talk</span>
            </h1>
            <p className="text-xl md:text-2xl text-white/80 max-w-3xl mx-auto">
              Questions about IntegrateWise? Want to explore a partnership? We're here to help.
            </p>
          </div>
        </div>

        {/* Main Content */}
        <div className="py-16 bg-white">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-12">
              {/* Left - Contact Info */}
              <div>
                <h2 className="text-3xl font-bold text-[#1E2A4A] mb-8">Get in Touch</h2>
                
                <div className="space-y-6 mb-10">
                  <div className="flex items-start gap-4">
                    <div className="w-12 h-12 rounded-xl bg-[#4256AB]/10 flex items-center justify-center shrink-0">
                      <Mail className="w-6 h-6 text-[#4256AB]" />
                    </div>
                    <div>
                      <h3 className="font-bold text-slate-900 mb-1">Email</h3>
                      <a href="mailto:connect@integratewise.ai" className="text-[#4256AB] hover:underline">
                        connect@integratewise.ai
                      </a>
                      <p className="text-sm text-slate-500 mt-1">We respond within 24 hours</p>
                    </div>
                  </div>

                  <div className="flex items-start gap-4">
                    <div className="w-12 h-12 rounded-xl bg-[#4256AB]/10 flex items-center justify-center shrink-0">
                      <Phone className="w-6 h-6 text-[#4256AB]" />
                    </div>
                    <div>
                      <h3 className="font-bold text-slate-900 mb-1">Phone</h3>
                      <a href="tel:+917026317111" className="text-[#4256AB] hover:underline">
                        +91 7026317111
                      </a>
                      <p className="text-sm text-slate-500 mt-1">Mon-Fri, 9am-6pm IST</p>
                    </div>
                  </div>

                  <div className="flex items-start gap-4">
                    <div className="w-12 h-12 rounded-xl bg-[#4256AB]/10 flex items-center justify-center shrink-0">
                      <MapPin className="w-6 h-6 text-[#4256AB]" />
                    </div>
                    <div>
                      <h3 className="font-bold text-slate-900 mb-1">Offices</h3>
                      <p className="text-slate-700">San Francisco, CA</p>
                      <p className="text-slate-700">Bangalore, India</p>
                    </div>
                  </div>

                  <div className="flex items-start gap-4">
                    <div className="w-12 h-12 rounded-xl bg-[#4256AB]/10 flex items-center justify-center shrink-0">
                      <Clock className="w-6 h-6 text-[#4256AB]" />
                    </div>
                    <div>
                      <h3 className="font-bold text-slate-900 mb-1">Response Time</h3>
                      <p className="text-slate-700">Sales inquiries: &lt; 4 hours</p>
                      <p className="text-slate-700">General questions: &lt; 24 hours</p>
                      <p className="text-slate-700">Support (customers): &lt; 2 hours</p>
                    </div>
                  </div>
                </div>

                {/* Quick Links */}
                <div className="bg-slate-50 rounded-2xl p-6 border border-slate-200">
                  <h3 className="font-bold text-slate-900 mb-4">Quick Links</h3>
                  <div className="space-y-2">
                    <a href="/demo" className="block text-[#4256AB] hover:underline">→ Book a Demo</a>
                    <a href="/pricing" className="block text-[#4256AB] hover:underline">→ See Pricing</a>
                    <a href="/technical" className="block text-[#4256AB] hover:underline">→ Technical Architecture</a>
                    <a href="/security" className="block text-[#4256AB] hover:underline">→ Security & Compliance</a>
                  </div>
                </div>
              </div>

              {/* Right - Form */}
              <div>
                <div className="bg-white border-2 border-slate-200 rounded-3xl p-8 shadow-xl">
                  <h3 className="text-2xl font-bold text-[#1E2A4A] mb-6">Send Us a Message</h3>
                  <form onSubmit={handleSubmit} className="space-y-5">
                    <div>
                      <label className="block text-sm font-semibold text-slate-700 mb-2">
                        Your Name *
                      </label>
                      <input
                        type="text"
                        name="name"
                        value={formData.name}
                        onChange={handleChange}
                        required
                        className="w-full px-4 py-3 border-2 border-slate-200 rounded-xl focus:border-[#4256AB] focus:ring-2 focus:ring-[#4256AB]/20 outline-none transition-all"
                        placeholder="John Doe"
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-semibold text-slate-700 mb-2">
                        Email *
                      </label>
                      <input
                        type="email"
                        name="email"
                        value={formData.email}
                        onChange={handleChange}
                        required
                        className="w-full px-4 py-3 border-2 border-slate-200 rounded-xl focus:border-[#4256AB] focus:ring-2 focus:ring-[#4256AB]/20 outline-none transition-all"
                        placeholder="john@company.com"
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-semibold text-slate-700 mb-2">
                        Subject *
                      </label>
                      <select
                        name="subject"
                        value={formData.subject}
                        onChange={handleChange}
                        required
                        className="w-full px-4 py-3 border-2 border-slate-200 rounded-xl focus:border-[#4256AB] focus:ring-2 focus:ring-[#4256AB]/20 outline-none transition-all"
                      >
                        <option value="">Select a subject...</option>
                        <option value="sales">Sales Inquiry</option>
                        <option value="support">Customer Support</option>
                        <option value="partnership">Partnership Opportunity</option>
                        <option value="press">Press & Media</option>
                        <option value="security">Security Question</option>
                        <option value="other">Other</option>
                      </select>
                    </div>

                    <div>
                      <label className="block text-sm font-semibold text-slate-700 mb-2">
                        Message *
                      </label>
                      <textarea
                        name="message"
                        value={formData.message}
                        onChange={handleChange}
                        required
                        rows={6}
                        className="w-full px-4 py-3 border-2 border-slate-200 rounded-xl focus:border-[#4256AB] focus:ring-2 focus:ring-[#4256AB]/20 outline-none transition-all resize-none"
                        placeholder="Tell us how we can help..."
                      />
                    </div>

                    <button
                      type="submit"
                      className="w-full bg-[#4256AB] hover:bg-[#3F5185] text-white font-bold py-4 rounded-xl transition-all hover:shadow-xl hover:shadow-[#4256AB]/20 flex items-center justify-center gap-2"
                    >
                      Send Message <Send className="w-5 h-5" />
                    </button>
                  </form>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </Layout>
  );
}
