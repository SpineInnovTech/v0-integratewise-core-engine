import React from "react";
import { 
  Database, 
  MessageSquare, 
  CreditCard, 
  BarChart, 
  Slack, 
  Github,
  Component,
  Activity
} from "lucide-react";

export function Integrations() {
  const categories = [
    {
      name: "CRM & Revenue",
      icon: <Database className="w-5 h-5" />,
      platforms: ["Salesforce", "HubSpot", "Pipedrive"]
    },
    {
      name: "Customer Support",
      icon: <MessageSquare className="w-5 h-5" />,
      platforms: ["Zendesk", "Intercom", "Freshdesk"]
    },
    {
      name: "Billing & Finance",
      icon: <CreditCard className="w-5 h-5" />,
      platforms: ["Stripe", "Chargebee", "Recurly"]
    },
    {
      name: "Product & Data",
      icon: <BarChart className="w-5 h-5" />,
      platforms: ["Mixpanel", "Segment", "Amplitude"]
    }
  ];

  return (
    <section className="py-16 md:py-24 bg-white border-y border-slate-100">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center mb-12 md:mb-16">
          <h2 className="text-3xl md:text-4xl font-extrabold text-[#4152A1] mb-4">Integrate with your entire ecosystem</h2>
          <p className="text-slate-600 max-w-2xl mx-auto">
            IntegrateWise connects to over 100+ platforms out of the box, unifying their data into our Canonical Spine for L3 intelligence.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
          {categories.map((cat, i) => (
            <div key={i} className="p-8 rounded-3xl bg-slate-50 hover:bg-white hover:shadow-xl transition-all border border-transparent hover:border-slate-200 group">
              <div className="flex items-center gap-3 mb-6 text-[#4256AB]">
                <div className="p-2 bg-white rounded-lg shadow-sm group-hover:bg-[#4256AB] group-hover:text-white transition-colors">
                  {cat.icon}
                </div>
                <h3 className="font-bold text-slate-800">{cat.name}</h3>
              </div>
              <ul className="space-y-3">
                {cat.platforms.map((platform, j) => (
                  <li key={j} className="flex items-center gap-2 text-slate-500 font-medium">
                    <div className="w-1.5 h-1.5 rounded-full bg-slate-300" />
                    {platform}
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>

        <div className="mt-12 md:mt-16 flex flex-wrap justify-center items-center gap-6 md:gap-12 opacity-40 grayscale group-hover:grayscale-0 transition-all">
           {/* We can use icons as logos here too */}
           <div className="flex items-center gap-2 font-bold text-base md:text-xl"><Slack className="w-5 h-5 md:w-6 md:h-6" /> Slack</div>
           <div className="flex items-center gap-2 font-bold text-base md:text-xl"><Github className="w-5 h-5 md:w-6 md:h-6" /> GitHub</div>
           <div className="flex items-center gap-2 font-bold text-base md:text-xl"><Component className="w-5 h-5 md:w-6 md:h-6" /> Jira</div>
           <div className="flex items-center gap-2 font-bold text-base md:text-xl"><Activity className="w-5 h-5 md:w-6 md:h-6" /> Mixpanel</div>
           <div className="flex items-center gap-2 font-bold text-base md:text-xl">Stripe</div>
           <div className="flex items-center gap-2 font-bold text-base md:text-xl">Segment</div>
        </div>
      </div>
    </section>
  );
}