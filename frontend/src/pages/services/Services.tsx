import { BiSupport } from "react-icons/bi";
import { TbReport } from "react-icons/tb";
import { FaSearch, FaRobot, FaTrophy, FaComments, FaMapMarkedAlt, FaTasks } from "react-icons/fa";
import { IoLocationSharp, IoShieldCheckmark } from "react-icons/io5";
import { FaGift } from "react-icons/fa6";
import React from "react";
import { Link } from "react-router-dom";
import { useScrollReveal } from "../../hooks/useScrollReveal";

interface Service {
  title: string;
  description: string;
  accent: string;
  tag: string;
  link: string;
}

const getServiceIcon = (title: string): React.ReactElement => {
  const iconMapping: { [key: string]: React.ReactElement } = {
    "AI-Powered Search & Recognition": <FaRobot size="20" />,
    "Secure Item Claiming": <FaGift size="18" />,
    "Gamified Rewards System": <FaTrophy size="18" />,
    "Real-time Status Tracking": <FaTasks size="18" />,
    "Lost & Found Reporting": <TbReport size="20" />,
    "Interactive Campus Map": <FaMapMarkedAlt size="18" />,
  };
  return iconMapping[title] || <FaSearch size="22" />;
};

const services: Service[] = [
  {
    title: "AI-Powered Search & Recognition",
    description: "Describe a missing item or upload a photo of a found one. Our Gemini AI instantly analyzes details to find perfect matches in seconds.",
    accent: "from-blue-500 to-indigo-600",
    tag: "Smart",
    link: "/ai-search",
  },
  {
    title: "Secure Item Claiming",
    description: "Submit claims with proof of ownership. Communicate securely with finders or admins using our built-in real-time messaging system.",
    accent: "from-emerald-500 to-teal-600",
    tag: "Core",
    link: "/foundItems",
  },
  {
    title: "Gamified Rewards System",
    description: "Be a campus hero! Earn points, unlock exclusive achievements, and climb the global leaderboard for returning found belongings.",
    accent: "from-yellow-400 to-orange-500",
    tag: "Engaging",
    link: "/dashboard/student",
  },
  {
    title: "Real-time Status Tracking",
    description: "Receive live notifications on your reports. Track exactly where your item is—from initial report and verification to final recovery.",
    accent: "from-violet-500 to-purple-600",
    tag: "Core",
    link: "/itemStatus",
  },
  {
    title: "Lost & Found Reporting",
    description: "Quickly log missing or recovered items with precise descriptions and categories in a centralized, easily accessible database.",
    accent: "from-cyan-500 to-blue-500",
    tag: "Core",
    link: "/reportLostItem",
  },
  {
    title: "Interactive Campus Map",
    description: "Visualize where items are frequently lost or found using our indoor map. Pinpoint exact locations to narrow down your search.",
    accent: "from-pink-500 to-rose-600",
    tag: "Explore",
    link: "/indoor-map",
  },
];

const tagStyles: Record<string, string> = {
  Core: "bg-gray-800 text-gray-300 border-gray-700",
  Smart: "bg-indigo-500/15 text-indigo-300 border-indigo-500/25",
  Engaging: "bg-yellow-500/15 text-yellow-400 border-yellow-500/25",
  Explore: "bg-pink-500/15 text-pink-300 border-pink-500/25",
};

const Services = () => {
  useScrollReveal();
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

      <section id="features" className="relative overflow-hidden bg-gray-950 py-10 lg:py-24 reveal">

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
          <div className="flex flex-col lg:flex-row lg:items-end lg:justify-between gap-6 mb-10 lg:mb-16">
            <div className="max-w-xl">
              <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-blue-500/10 border border-blue-500/20 mb-4 lg:mb-5">
                <span className="w-1.5 h-1.5 rounded-full bg-blue-400 animate-pulse" />
                <span className="text-blue-300 text-[10px] lg:text-[11px] font-bold uppercase tracking-widest">Platform Features</span>
              </div>
              <h2 className="text-2xl sm:text-3xl lg:text-5xl font-black text-white leading-tight lg:leading-[1.1] tracking-tight mb-2 lg:mb-4">
                School Services
                <span className="block bg-gradient-to-r from-blue-400 via-cyan-300 to-blue-400 bg-clip-text text-transparent">
                  &amp; Features
                </span>
              </h2>
              <p className="text-gray-400 text-sm lg:text-base leading-relaxed text-justify">
                Everything SAS students and staff need to report, search, and recover lost items all in one place.
              </p>
            </div>


          </div>

          <div className="grid grid-cols-2 sm:grid-cols-2 md:grid-cols-2 lg:grid-cols-2 xl:grid-cols-3 gap-2 sm:gap-3 md:gap-4">
            {services.map((service, index) => {
              const Content = (
                <>
                  {/* Top row: icon + tag */}
                  <div className="flex items-start justify-between">
                    <div className={`relative w-9 xs:w-11 h-9 xs:h-11 rounded-2xl bg-gradient-to-br ${service.accent} flex items-center justify-center text-white shadow-lg`}>
                      {/* inner shine */}
                      <div className="absolute inset-0 rounded-2xl bg-white/10" />
                      <span className="relative z-10">{getServiceIcon(service.title)}</span>
                    </div>
                    <span className={`text-[10px] font-black uppercase tracking-widest px-2.5 py-1 rounded-full border ${tagStyles[service.tag] ?? tagStyles.Core}`}>
                      {service.tag}
                    </span>
                  </div>

                  {/* Text */}
                  <div className="flex-1 mt-4">
                    <h3 className="text-white font-bold text-sm xs:text-base mb-2 group-hover:text-blue-200 transition-colors duration-200 leading-snug">
                      {service.title}
                    </h3>
                    <p className="text-gray-500 text-xs xs:text-sm leading-relaxed text-justify group-hover:text-gray-400 transition-colors duration-200">
                      {service.description}
                    </p>
                  </div>

                  {/* Bottom link */}
                  <div className="flex items-center justify-between pt-4 mt-4 border-t border-white/[0.05]">
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
                </>
              );

              const className = `svc-card reveal reveal-delay-${(index % 3) + 1} group relative bg-gray-900 border border-gray-800 rounded-2xl p-3 xs:p-4 sm:p-6 flex flex-col transition-all duration-300 ${
                service.tag === "Soon"
                  ? "cursor-default opacity-75"
                  : "cursor-pointer hover:bg-gray-800 hover:border-blue-700/50 hover:-translate-y-1 hover:shadow-xl hover:shadow-blue-900/20"
              }`;

              if (service.tag === "Soon") {
                return (
                  <div key={index} className={className}>
                    {Content}
                  </div>
                );
              }

              return (
                <Link key={index} to={service.link} className={className}>
                  {Content}
                </Link>
              );
            })}
          </div>

          {/* ── Bottom CTA strip ── */}
          <div className="mt-10 flex flex-row items-center justify-between gap-2 bg-gray-900/60 border border-white/5 rounded-2xl px-3 py-3 sm:px-4 sm:py-4">
            <div className="flex items-center gap-2 sm:gap-3">
              
              <div>
                <p className="text-white text-[11px] sm:text-xs font-semibold">Need Assistance?</p>
                <p className="text-gray-500 text-[9px] sm:text-[10px]">Visit our office or message us for support.</p>
              </div>
            </div>
            <Link to="/support"
              className="shrink-0 inline-flex items-center gap-1 px-2.5 py-2 sm:px-3 sm:py-2 bg-blue-600 hover:bg-blue-500 text-white text-[10px] sm:text-xs font-semibold rounded-xl transition-all duration-200 hover:shadow-lg hover:shadow-blue-900/40">
              Contact Support
              <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                <path d="M5 12h14M12 5l7 7-7 7" />
              </svg>
            </Link>
          </div>

        </div>
      </section>
    </>
  );
};

export default Services;