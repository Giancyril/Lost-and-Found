import { useEffect, useRef, useState } from "react";
import { useAdminStatsQuery } from "../../redux/api/api";

// ── Count-up hook ─────────────────────────────────────────────────────────────
const useCountUp = (target: number, duration = 1800, start = false) => {
  const [value, setValue] = useState(0);
  useEffect(() => {
    if (!start || target === 0) return;
    let startTime: number | null = null;
    const step = (timestamp: number) => {
      if (!startTime) startTime = timestamp;
      const progress = Math.min((timestamp - startTime) / duration, 1);
      // ease-out cubic
      const eased = 1 - Math.pow(1 - progress, 3);
      setValue(Math.floor(eased * target));
      if (progress < 1) requestAnimationFrame(step);
      else setValue(target);
    };
    requestAnimationFrame(step);
  }, [target, duration, start]);
  return value;
};

// ── Intersection observer hook ────────────────────────────────────────────────
const useInView = (threshold = 0.3) => {
  const ref = useRef<HTMLDivElement>(null);
  const [inView, setInView] = useState(false);
  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const obs = new IntersectionObserver(
      ([entry]) => { if (entry.isIntersecting) { setInView(true); obs.disconnect(); } },
      { threshold }
    );
    obs.observe(el);
    return () => obs.disconnect();
  }, [threshold]);
  return { ref, inView };
};

// ── Animated stat ─────────────────────────────────────────────────────────────
const AnimatedStat = ({
  value, suffix = "", label, started,
}: {
  value: number; suffix?: string; label: string; started: boolean;
}) => {
  const count = useCountUp(value, 1800, started);
  return (
    <div className="text-center">
      <p className="text-blue-400 font-black text-2xl sm:text-3xl leading-none mb-1 tabular-nums">
        {value > 0 ? `${count}${suffix}` : "—"}
      </p>
      <p className="text-gray-500 text-[10px] sm:text-xs leading-tight">{label}</p>
    </div>
  );
};

// ── Tilt card (3D hover) ──────────────────────────────────────────────────────
const TiltImage = ({ src, fillHeight = false }: { src: string; fillHeight?: boolean }) => {
  const cardRef = useRef<HTMLDivElement>(null);

  const handleMouseMove = (e: React.MouseEvent<HTMLDivElement>) => {
    const el = cardRef.current;
    if (!el) return;
    const rect = el.getBoundingClientRect();
    const x = (e.clientX - rect.left) / rect.width - 0.5;
    const y = (e.clientY - rect.top) / rect.height - 0.5;
    el.style.transform = `perspective(800px) rotateX(${-y * 12}deg) rotateY(${x * 12}deg) scale3d(1.02,1.02,1.02)`;
  };

  const handleMouseLeave = () => {
    const el = cardRef.current;
    if (!el) return;
    el.style.transform = "perspective(800px) rotateX(0deg) rotateY(0deg) scale3d(1,1,1)";
  };

  return (
    <div
      ref={cardRef}
      onMouseMove={handleMouseMove}
      onMouseLeave={handleMouseLeave}
      className={`relative rounded-2xl overflow-hidden shadow-2xl cursor-pointer${fillHeight ? " h-full" : ""}`}
      style={{
        transition: "transform 0.15s ease-out",
        transformStyle: "preserve-3d",
        border: "1px solid rgba(59,130,246,0.15)",
        minHeight: fillHeight ? 280 : undefined,
      }}
    >
      <img
        src={src}
        alt="Student Affairs, Services, and Development Division"
        className={`w-full block object-cover ${fillHeight ? "h-full" : ""}`}
        style={fillHeight ? { position: "absolute", inset: 0, height: "100%", width: "100%" } : { maxHeight: 420 }}
      />
      {/* Subtle overlay */}
      <div
        className="absolute inset-0 pointer-events-none"
        style={{
          background: "linear-gradient(135deg, rgba(59,130,246,0.08) 0%, transparent 60%)",
        }}
      />
    </div>
  );
};

// ── Main component ────────────────────────────────────────────────────────────
const AboutUs = () => {
  const { data: statsData } = useAdminStatsQuery({});
  const stats = statsData?.data;

  const totalItems = (stats?.foundItems ?? 0) + (stats?.lostItems ?? 0);
  const avgResolutionRaw = stats?.avgClaimResolutionDays ?? 0;
  const recoveryRateRaw = stats?.lostFoundMatchRate?.matchRate ?? 0;

  const { ref: statsRef, inView: statsInView } = useInView(0.4);

  return (
    <>
      <style>{`
        @keyframes fadeUp {
          from { opacity: 0; transform: translateY(24px); }
          to   { opacity: 1; transform: translateY(0); }
        }
        @keyframes fadeIn {
          from { opacity: 0; }
          to   { opacity: 1; }
        }
        .au-animate { animation: fadeUp 0.55s ease both; }
        .au-animate:nth-child(1) { animation-delay: 0.05s; }
        .au-animate:nth-child(2) { animation-delay: 0.13s; }
        .au-animate:nth-child(3) { animation-delay: 0.21s; }

        .au-value-card { transition: border-color 0.2s, transform 0.2s; }
        .au-value-card:hover {
          border-color: rgba(59,130,246,0.4);
          transform: translateY(-2px);
        }
        .au-audience-card { transition: border-color 0.2s, background 0.2s; }
        .au-audience-card:hover {
          border-color: rgba(59,130,246,0.35);
          background: rgb(17,24,39);
        }

      `}</style>

      <section id="aboutUs" className="py-16 sm:py-24 bg-gray-950 relative overflow-hidden">

        {/* Background blobs */}
        <div className="absolute inset-0 pointer-events-none overflow-hidden">
          <div className="absolute -top-24 -left-24 w-80 h-80 bg-blue-900/10 rounded-full blur-3xl" />
          <div className="absolute bottom-0 right-0 w-64 h-64 bg-cyan-900/8 rounded-full blur-3xl" />
        </div>

        <div className="px-4 sm:px-6 lg:px-16 mx-auto max-w-7xl relative z-10">

          {/* ── Top: header + image ── */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-10 lg:gap-16 items-stretch mb-14 sm:mb-20">

            {/* Left: header text */}
            <div>
              <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-blue-500/10 border border-blue-500/20 mb-5">
                <span className="w-1.5 h-1.5 rounded-full bg-blue-400 animate-pulse" />
                <span className="text-blue-300 text-[11px] font-bold uppercase tracking-widest">About the System</span>
              </div>
              <h2 className="text-3xl sm:text-4xl md:text-5xl font-black text-white leading-tight tracking-tight mb-4">
                Built for the{" "}
                <span className="bg-gradient-to-r from-blue-400 to-cyan-400 bg-clip-text text-transparent">
                  SAS Community
                </span>
              </h2>
              <div className="w-12 h-1 bg-gradient-to-r from-blue-500 to-cyan-400 rounded-full mb-5" />
              <p className="text-gray-400 text-sm sm:text-base leading-relaxed max-w-2xl text-justify">
                The <strong className="text-white font-semibold">SAS Lost & Found Management System</strong> is designed exclusively for students, faculty, and staff — providing a safe, organized, and transparent way to report, track, and recover lost items within campus premises.
              </p>
            </div>

            {/* Right: SASDD image with 3D tilt */}
            <div className="w-full max-w-md mx-auto lg:max-w-none h-full" style={{ animation: "fadeIn 0.7s ease 0.2s both" }}>
              <TiltImage src="/sasdd.jpg" fillHeight />
            </div>
          </div>

          {/* ── Bottom: audience + mission/values ── */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 lg:gap-16 items-stretch">

            {/* Left — audience cards + stats */}
            <div className="flex flex-col h-full">
              <p className="text-gray-400 text-sm leading-relaxed mb-6 text-justify">
                We believe a well-managed lost and found system reflects the integrity and care of our school community. Every item reported and returned strengthens the trust we hold for one another as part of SAS.
              </p>

              <div className="flex flex-col gap-3 text-justify">
                {[
                  { title: "For Students", desc: "Easily report or claim lost items from classrooms or school grounds." },
                  { title: "For Faculty & Staff", desc: "Manage found items and coordinate with the admin office through the system." },
                  { title: "School-Wide Coverage", desc: "Covers all campus areas including classrooms, cafeteria, and library." },
                ].map((item) => (
                  <div
                    key={item.title}
                    className="au-audience-card au-animate flex items-start gap-3 bg-gray-900/70 border border-gray-800 rounded-xl p-4"
                  >
                    <div>
                      <p className="text-white font-semibold text-sm mb-0.5">{item.title}</p>
                      <p className="text-gray-500 text-xs sm:text-sm leading-relaxed">{item.desc}</p>
                    </div>
                  </div>
                ))}
              </div>

              {/* Stats strip — below audience cards, same width */}
              <div
                ref={statsRef}
                className="grid grid-cols-3 rounded-xl overflow-hidden mt-3 flex-1"
                style={{
                  border: "1px solid rgba(59,130,246,0.12)",
                  background: "linear-gradient(135deg, rgba(17,24,39,0.9) 0%, rgba(15,23,42,0.95) 100%)",
                  minHeight: 72,
                }}
              >
                {[
                  { value: totalItems, suffix: "+", label: "Items Tracked" },
                  { value: avgResolutionRaw, suffix: "d", label: "Avg. Resolution" },
                  { value: recoveryRateRaw, suffix: "%", label: "Recovery Rate" },
                ].map((stat, i) => (
                  <div
                    key={stat.label}
                    className="py-4 px-3 flex flex-col items-center justify-center"
                    style={{ borderRight: i < 2 ? "1px solid rgba(255,255,255,0.06)" : "none" }}
                  >
                    <AnimatedStat
                      value={stat.value}
                      suffix={stat.suffix}
                      label={stat.label}
                      started={statsInView}
                    />
                  </div>
                ))}
              </div>
            </div>

            {/* Right — mission + values */}
            <div className="flex flex-col gap-5">

              {/* Mission card */}
              <div className="relative bg-gray-900 border border-blue-800/30 rounded-2xl p-5 sm:p-7 overflow-hidden">
                <div className="absolute -top-8 -right-8 w-40 h-40 bg-blue-600/8 rounded-full blur-2xl pointer-events-none" />
                <div className="relative z-10">
                  <h3 className="text-white font-bold text-base sm:text-lg mb-4">Our Mission</h3>
                  <p className="text-gray-400 text-sm leading-relaxed text-justify">
                    To provide SAS with a reliable, school-appropriate lost and found system that promotes honesty, responsibility, and respect for each other's belongings — core values at the heart of our school culture.
                  </p>
                </div>
              </div>

              {/* Values grid — 2 value cards + 3 stat cards in same grid */}
              <div className="grid grid-cols-2 gap-3">
                {/* Value cards */}
                {[
                  { emoji: "🔍", label: "Transparency", desc: "Real-time status updates on every reported item" },
                  { emoji: "🛡️", label: "Privacy", desc: "Sensitive items are blurred; only verified claimants see details" },
                  { emoji: "⚡", label: "Efficiency", desc: "Streamlined SAS office workflow for faster item resolution" },
                  { emoji: "🤝", label: "Integrity", desc: "Claims are verified by the SAS office before release" },
                ].map((v) => (
                  <div key={v.label} className="au-value-card bg-gray-900 border border-gray-800 rounded-xl p-4">
                    <div className="text-xl mb-2">{v.emoji}</div>
                    <p className="text-white font-semibold text-xs sm:text-sm mb-1">{v.label}</p>
                    <p className="text-gray-500 text-[11px] sm:text-xs leading-relaxed text-justify">{v.desc}</p>
                  </div>
                ))}

              </div>
            </div>
          </div>

        </div>
      </section>
    </>
  );
};

export default AboutUs;