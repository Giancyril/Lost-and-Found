import { BiSupport } from "react-icons/bi";
import { TbReport } from "react-icons/tb";
import { FaSearch } from "react-icons/fa";
import { IoLocationSharp, IoShieldCheckmark } from "react-icons/io5";
import { FaGift } from "react-icons/fa6";
import React from "react";

interface Service {
  title: string;
  description: string;
  accent: string;
  tag: string;
  link: string;
}

const getServiceIcon = (title: string): React.ReactElement => {
  const iconMapping: { [key: string]: React.ReactElement } = {
    "Lost Item Reporting":        <TbReport size="26" />,
    "Search for Lost Items":      <FaSearch size="22" />,
    "Location-Based Services":    <IoLocationSharp size="26" />,
    "Help Desk Support":          <BiSupport size="26" />,
    "Item Claiming":              <FaGift size="22" />,
    "Data Encryption & Privacy":  <IoShieldCheckmark size="26" />,
    
  };
  return iconMapping[title] || <FaSearch size="22" />;
};

const services: Service[] = [
  {
    title: "Lost Item Reporting",
    description: "Submit descriptions, locations, and photos directly through the school portal. Fast, simple, and tracked from day one.",
    accent: "from-blue-500 to-blue-700",
    tag: "Core",
    link: "/reportlostItem",
  },
  {
    title: "Search for Lost Items",
    description: "Search the campus lost-and-found database by keyword, category, or location to find a match for your missing item.",
    accent: "from-blue-500 to-blue-700",
    tag: "Core",
    link: "/lostItems",
  },
  {
    title: "Location-Based Services",
    description: "Browse items by campus area classrooms, cafeteria, library to narrow down where your belongings were found.",
    accent: "from-blue-500 to-blue-700",
    tag: "Browse",
    link: "/foundItems",
  },
  {
    title: "Item Claiming",
    description: "Claim found items through a secure verified process. Only the rightful owner confirmed by school ID can retrieve belongings.",
    accent: "from-blue-500 to-blue-700",
    tag: "Core",
    link: "/claimItem",
  },
  {
    title: "Smart AI Search",
    description: "Describe your lost item in plain words. The system finds the closest matches from the database instantly.",
    accent: "from-blue-500 to-blue-700",
    tag: "Beta",
    link: "/aiSearch",
  },
  {
    title: "Item Status Tracking",
    description: "Monitor your lost item report in real time from submission and review to recovery and return.",
    accent: "from-blue-500 to-blue-700",
    tag: "Soon",
    link: "/itemStatus",
  },
  
];

const tagStyles: Record<string, string> = {
  Core:   "bg-blue-500/15 text-blue-300 border-blue-500/25",
  Beta:   "bg-blue-500/15 text-blue-300 border-blue-500/25",
  Soon:   "bg-blue-500/15 text-blue-300 border-blue-500/25",
  Browse: "bg-blue-500/15 text-blue-300 border-blue-500/25",
};

const Services = () => {
  return (
    <>
      <style>{`
        @keyframes fadeSlideUp {
          from { opacity: 0; transform: translateY(24px); }
          to   { opacity: 1; transform: translateY(0); }
        }
        .svc-card {
          animation: fadeSlideUp 0.5s ease both;
        }
        .svc-card:nth-child(1) { animation-delay: 0.05s; }
        .svc-card:nth-child(2) { animation-delay: 0.10s; }
        .svc-card:nth-child(3) { animation-delay: 0.15s; }
        .svc-card:nth-child(4) { animation-delay: 0.20s; }
        .svc-card:nth-child(5) { animation-delay: 0.25s; }
        .svc-card:nth-child(6) { animation-delay: 0.30s; }

        .svc-card .svc-arrow {
          transition: transform 0.25s ease, opacity 0.25s ease;
          opacity: 0;
          transform: translateX(-6px);
        }
        .svc-card:hover .svc-arrow {
          opacity: 1;
          transform: translateX(0);
        }
        .svc-glow {
          transition: opacity 0.3s ease;
          opacity: 0;
        }
        .svc-card:hover .svc-glow {
          opacity: 1;
        }
        .svc-number {
          font-variant-numeric: tabular-nums;
          line-height: 1;
        }
      `}</style>

      <section id="features" className="py-24 bg-gray-950 relative overflow-hidden">

        {/* ── Ambient background blobs ── */}
        <div className="absolute inset-0 pointer-events-none overflow-hidden">
          <div className="absolute -top-32 -right-32 w-[480px] h-[480px] bg-blue-600/6 rounded-full blur-3xl" />
          <div className="absolute bottom-0 left-0 w-[400px] h-[400px] bg-cyan-600/5 rounded-full blur-3xl" />
          <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[300px] bg-blue-900/8 rounded-full blur-3xl" />
          {/* Subtle grid */}
          <div className="absolute inset-0 opacity-[0.025]" style={{
            backgroundImage: `linear-gradient(rgba(99,179,237,0.4) 1px, transparent 1px), linear-gradient(90deg, rgba(99,179,237,0.4) 1px, transparent 1px)`,
            backgroundSize: "64px 64px",
          }} />
        </div>

        <div className="relative z-10 px-4 sm:px-6 lg:px-16 mx-auto max-w-7xl">

          {/* ── Section header ── */}
          <div className="flex flex-col lg:flex-row lg:items-end lg:justify-between gap-6 mb-16">
            <div className="max-w-xl">
              <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-blue-500/10 border border-blue-500/20 mb-5">
                <span className="w-1.5 h-1.5 rounded-full bg-blue-400 animate-pulse" />
                <span className="text-blue-300 text-[11px] font-bold uppercase tracking-widest">Platform Features</span>
              </div>
              <h2 className="text-4xl sm:text-5xl font-black text-white leading-[1.1] tracking-tight mb-4">
                School Services
                <span className="block bg-gradient-to-r from-blue-400 via-cyan-300 to-blue-400 bg-clip-text text-transparent">
                  &amp; Features
                </span>
              </h2>
              <p className="text-gray-400 text-base leading-relaxed">
                Everything SAS students and staff need to report, search, and recover lost items — all in one place.
              </p>
            </div>

            
          </div>

          {/* ── Services grid ── */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {services.map((service, index) => (
              <a
                key={index}
                href={service.tag === "Soon" ? undefined : service.link}
                className={`svc-card group relative bg-gray-900 border border-gray-800 rounded-2xl p-7 flex flex-col gap-5 transition-all duration-300
                  ${service.tag === "Soon"
                    ? "cursor-default opacity-75"
                    : "cursor-pointer hover:bg-gray-800 hover:border-blue-700/50 hover:-translate-y-1 hover:shadow-xl hover:shadow-blue-900/20"}`}
              >
                {/* Top row: icon + tag */}
                <div className="flex items-start justify-between">
                  <div className={`relative w-12 h-12 rounded-2xl bg-gradient-to-br ${service.accent} flex items-center justify-center text-white shadow-lg`}>
                    {/* inner shine */}
                    <div className="absolute inset-0 rounded-2xl bg-white/10" />
                    <span className="relative z-10">{getServiceIcon(service.title)}</span>
                  </div>
                  <span className={`text-[10px] font-black uppercase tracking-widest px-2.5 py-1 rounded-full border ${tagStyles[service.tag] ?? tagStyles.Core}`}>
                    {service.tag}
                  </span>
                </div>

                {/* Text */}
                <div className="flex-1">
                  <h3 className="text-white font-bold text-base mb-2 group-hover:text-blue-200 transition-colors duration-200 leading-snug">
                    {service.title}
                  </h3>
                  <p className="text-gray-500 text-sm leading-relaxed text-justify group-hover:text-gray-400 transition-colors duration-200">
                    {service.description}
                  </p>
                </div>

                {/* Bottom link */}
                <div className="flex items-center justify-between pt-4 border-t border-white/[0.05]">
                  {service.tag === "Soon" ? (
                    <span className="text-gray-600 text-xs font-semibold">Coming soon</span>
                  ) : (
                    <span className="text-blue-400 text-xs font-semibold group-hover:text-blue-300 transition-colors">
                      Access service
                    </span>
                  )}
                  {service.tag !== "Soon" && (
                    <span className="svc-arrow text-blue-400">
                      <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                        <path d="M5 12h14M12 5l7 7-7 7" />
                      </svg>
                    </span>
                  )}
                </div>

                {/* Index number — decorative */}
                <span className="absolute bottom-5 right-6 text-[64px] font-black text-white/[0.025] leading-none select-none pointer-events-none svc-number">
                  {String(index + 1).padStart(2, "0")}
                </span>
              </a>
            ))}
          </div>

          {/* ── Bottom CTA strip ── */}
          <div className="mt-10 flex flex-col sm:flex-row items-center justify-between gap-4 bg-gray-900/60 border border-white/5 rounded-2xl px-6 py-5">
            <div className="flex items-center gap-3">
              <div className="w-9 h-9 rounded-xl bg-blue-500/10 border border-blue-500/20 flex items-center justify-center shrink-0">
                <BiSupport className="text-blue-400 w-5 h-5" />
              </div>
              <div>
                <p className="text-white text-sm font-semibold">Need help with any service?</p>
                <p className="text-gray-500 text-xs">Our office is available during school hours.</p>
              </div>
            </div>
            <a href="/support"
              className="shrink-0 inline-flex items-center gap-2 px-5 py-2.5 bg-blue-600 hover:bg-blue-500 text-white text-sm font-semibold rounded-xl transition-all duration-200 hover:shadow-lg hover:shadow-blue-900/40">
              Contact Support
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                <path d="M5 12h14M12 5l7 7-7 7" />
              </svg>
            </a>
          </div>

        </div>
      </section>
    </>
  );
};

export default Services;