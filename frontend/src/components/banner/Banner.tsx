import { useState, useEffect } from "react";
import { useGetLostItemsQuery, useGetFoundItemsQuery, useAdminStatsQuery } from "../../redux/api/api";
import { PointsTeaserBanner } from "../../components/home/PointsTeaserBanner";
import { useUserVerification } from "../../auth/auth";
import { useGetMyPointsQuery } from "../../redux/api/api";

const Banner = () => {
  const [currentSlide, setCurrentSlide] = useState(0);

  const user: any = useUserVerification();
  const isAuthenticated = !!user?.id || !!user?.email;
  const { data: pointsData } = useGetMyPointsQuery(undefined, { skip: !isAuthenticated });
  const totalPoints = pointsData?.data?.totalPoints ?? 0;

  const { data: lostItems }  = useGetLostItemsQuery({ limit: 3, sortBy: "date", sortOrder: "desc" });
  const { data: foundItems } = useGetFoundItemsQuery({ limit: 3, sortBy: "date", sortOrder: "desc" });
  const { data: stats }      = useAdminStatsQuery("");

  const slides = [
    {
      badge: "SAS Lost & Found System",
      title: "SAS Lost & Found",
      subtitle: "Management System",
      description: "The official lost and found platform for SAS students, staff, and faculty. Report missing belongings or help return found items quickly and securely within our school community.",
      primaryButton:   { text: "Report a Lost Item",    href: "/reportlostItem" },
      secondaryButton: { text: "Check Recovered items", href: "/FoundItems"     },
    },
    {
      badge: "Found something on campus?",
      title: "Help a Fellow",
      subtitle: "Student?",
      description: "If you've found something on school grounds, please report it here. Your act of honesty helps reunite students and staff with their belongings and strengthens our school community.",
      primaryButton:   { text: "Report a Lost Item",    href: "/reportlostItem" },
      secondaryButton: { text: "Check Recovered items", href: "/FoundItems"     },
    },
    {
      badge: "Track your reports anytime",
      title: "Stay Updated on",
      subtitle: "Your Reports",
      description: "Monitor the status of your lost item reports and claim requests in real time. Our lost and found system ensures you're notified the moment your item is located.",
      primaryButton:   { text: "Report a Lost Item",    href: "/reportlostItem" },
      secondaryButton: { text: "Check Recovered items", href: "/FoundItems"     },
    },
  ];

  useEffect(() => {
    const timer = setInterval(() => {
      setCurrentSlide((prev) => (prev + 1) % slides.length);
    }, 5000);
    return () => clearInterval(timer);
  }, [slides.length]);

  const s = slides[currentSlide];

  const RecentLostPanel = () => (
    <div className="bg-white/5 border border-white/10 rounded-2xl p-4 backdrop-blur-sm">
      <div className="flex items-center justify-between mb-3">
        <p className="text-white font-semibold text-sm flex items-center gap-2">Recent Lost Items</p>
        <a href="/lostItems" className="text-blue-400 text-xs hover:text-blue-300 transition-colors">View all</a>
      </div>
      {lostItems?.data?.length > 0 ? (
        <div className="space-y-2 max-h-36 overflow-y-auto pr-1 custom-scrollbar">
          {lostItems.data.map((item: any) => (
            <div key={item.id} className="flex items-center justify-between bg-white/5 rounded-lg px-3 py-2">
              <div className="min-w-0">
                <p className="text-white text-xs font-medium truncate">{item.lostItemName}</p>
                <p className="text-gray-500 text-xs truncate">{item.date?.split("T")[0]} · {item.location}</p>
              </div>
              <span className="ml-2 shrink-0 text-xs bg-yellow-500/20 text-yellow-400 px-2 py-0.5 rounded-full border border-yellow-500/20">
                {item.isFound ? "✓ Found" : "Pending"}
              </span>
            </div>
          ))}
        </div>
      ) : (
        <p className="text-gray-500 text-xs text-center py-3">No lost items reported yet.</p>
      )}
    </div>
  );

  const RecentFoundPanel = () => (
    <div className="bg-white/5 border border-white/10 rounded-2xl p-4 backdrop-blur-sm">
      <div className="flex items-center justify-between mb-3">
        <p className="text-white font-semibold text-sm flex items-center gap-2">Recent Found Items</p>
        <a href="/foundItems" className="text-blue-400 text-xs hover:text-blue-300 transition-colors">View all</a>
      </div>
      {foundItems?.data?.length > 0 ? (
        <div className="space-y-2 max-h-36 overflow-y-auto pr-1 custom-scrollbar">
          {foundItems.data.map((item: any) => (
            <div key={item.id} className="flex items-center justify-between bg-white/5 rounded-lg px-3 py-2">
              <div className="min-w-0">
                <p className="text-white text-xs font-medium truncate">
                  {item.foundItemName || item.lostItemName || item.name}
                </p>
                <p className="text-gray-500 text-xs truncate">{item.date?.split("T")[0]} · {item.location}</p>
              </div>
              {item.isClaimed ? (
                <span className="ml-2 shrink-0 text-xs bg-green-500/20 text-green-400 px-2 py-0.5 rounded-full border border-green-500/20">✓ Claimed</span>
              ) : (
                <span className="ml-2 shrink-0 text-xs bg-blue-500/20 text-blue-400 px-2 py-0.5 rounded-full border border-blue-500/20">Available</span>
              )}
            </div>
          ))}
        </div>
      ) : (
        <p className="text-gray-500 text-xs text-center py-3">No found items submitted yet.</p>
      )}
    </div>
  );

  const StatsRow = () => (
    <div className="grid grid-cols-3 gap-3">
      {[
        [stats?.data?.lostItems   ?? lostItems?.data?.length  ?? 0, "Lost Reports" ],
        [stats?.data?.foundItems  ?? foundItems?.data?.length ?? 0, "Found Reports"],
        [stats?.data?.claimedItems ?? "—",                          "Claimed Items"],
      ].map(([num, label]) => (
        <div key={label as string} className="bg-white/5 border border-white/10 rounded-xl p-3 text-center backdrop-blur-sm">
          <p className="text-blue-400 font-black text-xl">{num as React.ReactNode}</p>
          <p className="text-gray-500 text-xs mt-0.5">{label as React.ReactNode}</p>
        </div>
      ))}
    </div>
  );

  return (
    <>
      <style>{`
        .custom-scrollbar::-webkit-scrollbar { width: 6px; }
        .custom-scrollbar::-webkit-scrollbar-track { background: rgba(255,255,255,0.05); border-radius: 3px; }
        .custom-scrollbar::-webkit-scrollbar-thumb { background: rgba(255,255,255,0.2); border-radius: 3px; }
        .custom-scrollbar::-webkit-scrollbar-thumb:hover { background: rgba(255,255,255,0.3); }
      `}</style>

      <section className="relative overflow-hidden bg-gray-950">
        {/* Background */}
        <div className="absolute inset-0 z-0">
          <div className="absolute inset-0 bg-gradient-to-br from-blue-950 via-gray-950 to-gray-900" />
          <div className="absolute inset-0 opacity-5" style={{
            backgroundImage: `repeating-linear-gradient(0deg, transparent, transparent 60px, rgba(255,255,255,0.05) 60px, rgba(255,255,255,0.05) 61px), repeating-linear-gradient(90deg, transparent, transparent 60px, rgba(255,255,255,0.05) 60px, rgba(255,255,255,0.05) 61px)`,
          }} />
          <div className="absolute top-0 right-0 w-96 h-96 bg-blue-600/10 rounded-full blur-3xl" />
          <div className="absolute bottom-0 left-0 w-96 h-96 bg-cyan-600/10 rounded-full blur-3xl" />
        </div>

        <div className="relative z-10 px-4 sm:px-6 lg:px-16 mx-auto max-w-7xl w-full py-12 lg:py-0 lg:min-h-[calc(100vh-64px)] lg:flex lg:items-center">
          <div className="grid lg:grid-cols-2 gap-8 lg:gap-12 items-start w-full">

            {/* Left content */}
            <div key={currentSlide} className="flex flex-col justify-center pt-4 lg:pt-8">
              <div className="inline-flex items-center gap-2 py-1.5 px-4 mb-5 text-xs font-semibold bg-blue-600/20 border border-blue-500/30 rounded-full text-blue-300 uppercase tracking-widest w-fit">
                <span className="w-1.5 h-1.5 rounded-full bg-blue-400 animate-pulse" />
                {s.badge}
              </div>

              <h1 className="mb-4 text-3xl sm:text-4xl lg:text-5xl font-black tracking-tight leading-tight text-white">
                {s.title}
                <br />
                <span className="bg-gradient-to-r from-blue-400 via-cyan-400 to-blue-300 bg-clip-text text-transparent">
                  {s.subtitle}
                </span>
              </h1>

              <div className="w-16 h-1 bg-gradient-to-r from-blue-500 to-cyan-400 mb-5 rounded-full" />

              <p className="mb-6 text-base lg:text-lg font-light text-gray-400 max-w-lg leading-relaxed">
                {s.description}
              </p>

              {/* ── Points Teaser Banner ── */}
              <div className="mb-6">
                <PointsTeaserBanner
                  isAuthenticated={isAuthenticated}
                  totalPoints={totalPoints}
                />
              </div>

              <div className="flex flex-row gap-3 mb-6">
                <a href={s.primaryButton.href}
                  className="inline-flex items-center justify-center bg-white/5 hover:bg-white/10 border border-white/10 hover:border-white/20 text-white font-semibold py-3 px-5 sm:px-7 rounded-lg transition-all duration-300 hover:-translate-y-0.5 text-sm sm:text-base">
                  {s.primaryButton.text}
                </a>
                <a href={s.secondaryButton.href}
                  className="inline-flex items-center justify-center bg-white/5 hover:bg-white/10 border border-white/10 hover:border-white/20 text-white font-semibold py-3 px-5 sm:px-7 rounded-lg transition-all duration-300 hover:-translate-y-0.5 text-sm sm:text-base">
                  {s.secondaryButton.text}
                </a>
              </div>

              <div className="flex items-center gap-3">
                {slides.map((_, i) => (
                  <button key={i} onClick={() => setCurrentSlide(i)}
                    className={`transition-all duration-300 rounded-full ${
                      i === currentSlide ? "w-8 h-2 bg-blue-400" : "w-2 h-2 bg-gray-600 hover:bg-gray-400"
                    }`}
                  />
                ))}
              </div>
            </div>

            {/* Right panel — desktop */}
            <div className="hidden lg:flex flex-col gap-4 pt-8 pb-8">
              <RecentLostPanel />
              <RecentFoundPanel />
              <StatsRow />
            </div>

          </div>
        </div>

        {/* Mobile panels — below the hero */}
        <div className="lg:hidden px-4 sm:px-6 pb-10 space-y-4 relative z-10">
          <RecentLostPanel />
          <RecentFoundPanel />
          <StatsRow />
        </div>
      </section>
    </>
  );
};

export default Banner;