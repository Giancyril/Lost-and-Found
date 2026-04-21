import { useState, useEffect, useRef, useCallback } from "react";
import { useGetLostItemsQuery, useGetFoundItemsQuery } from "../../redux/api/api";

// ── Types ─────────────────────────────────────────────────────────────────────
interface LostItem {
  id: string;
  lostItemName: string;
  description: string;
  location: string;
  date: string;
  img?: string;
  category?: { name: string };
  reporterName?: string;
}

interface FoundItem {
  id: string;
  foundItemName: string;
  description: string;
  location: string;
  date: string;
  img?: string;
  images?: any[];
  category?: { name: string };
  isClaimed?: boolean;
}

// ── Helpers ───────────────────────────────────────────────────────────────────
const getFoundImg = (item: FoundItem) =>
  (Array.isArray(item?.images) && item.images.length > 0
    ? typeof item.images[0] === "string"
      ? item.images[0]
      : item.images[0]?.url ?? ""
    : "") ||
  item?.img ||
  "";

const formatDate = (d: string) =>
  new Date(d).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" });

// Fixed: avoid <T,> generic arrow in TSX to prevent parse errors
function chunk<T>(arr: T[], size: number): T[][] {
  return Array.from({ length: Math.ceil(arr.length / size) }, (_, i) =>
    arr.slice(i * size, i * size + size)
  );
}

// ── Restricted category check ─────────────────────────────────────────────────
const RESTRICTED_CATEGORIES = ["wallets & purses", "wallet", "purse"];
const isRestrictedCategory = (cat?: string) =>
  RESTRICTED_CATEGORIES.some(c => cat?.toLowerCase().includes(c));

// ── Progress bar ──────────────────────────────────────────────────────────────
const ProgressBar = ({ duration, active }: { duration: number; active: boolean }) => {
  const [width, setWidth] = useState(0);
  const startRef = useRef<number | null>(null);
  const rafRef = useRef<number | null>(null);

  useEffect(() => {
    if (!active) {
      setWidth(0);
      return;
    }
    setWidth(0);
    startRef.current = null;
    const animate = (ts: number) => {
      if (!startRef.current) startRef.current = ts;
      const elapsed = ts - startRef.current;
      setWidth(Math.min((elapsed / duration) * 100, 100));
      if (elapsed < duration) rafRef.current = requestAnimationFrame(animate);
    };
    rafRef.current = requestAnimationFrame(animate);
    return () => {
      if (rafRef.current) cancelAnimationFrame(rafRef.current);
    };
  }, [active, duration]); // always 2 deps — stable

  return (
    <div className="absolute top-0 left-0 right-0 h-1 bg-white/10 z-10">
      <div
        className="h-full transition-none"
        style={{ width: `${width}%`, background: "linear-gradient(90deg, #3b82f6, #06b6d4)" }}
      />
    </div>
  );
};

// ── Item Card ─────────────────────────────────────────────────────────────────
const ItemCard = ({
  name, description, location, date, img, category, badge, badgeColor,
}: {
  name: string; description: string; location: string; date: string;
  img: string; category?: string; badge: string; badgeColor: string;
}) => {
  const restricted = badgeColor === "blue" && isRestrictedCategory(category);

  return (
    <div
      className={`relative flex flex-col border rounded-2xl overflow-hidden h-full ${
        badgeColor === "red"
          ? "bg-slate-800 border-red-500/20"
          : "bg-slate-800 border-blue-400/30"
      }`}
    >
      <div className="relative h-40 sm:h-48 md:h-56 bg-slate-900 shrink-0 overflow-hidden">
        {restricted ? (
          <div className="w-full h-full flex flex-col items-center justify-center gap-2 sm:gap-3 bg-slate-900">
            <div className="w-12 h-12 sm:w-16 sm:h-16 rounded-full bg-slate-800 border border-slate-700 flex items-center justify-center">
              <svg width="22" height="22" fill="none" viewBox="0 0 24 24" stroke="currentColor" className="text-slate-500" strokeWidth="1.5">
                <path strokeLinecap="round" strokeLinejoin="round" d="M3.98 8.223A10.477 10.477 0 001.934 12C3.226 16.338 7.244 19.5 12 19.5c.993 0 1.953-.138 2.863-.395M6.228 6.228A10.45 10.45 0 0112 4.5c4.756 0 8.773 3.162 10.065 7.498a10.523 10.523 0 01-4.293 5.774M6.228 6.228L3 3m3.228 3.228l3.65 3.65m7.894 7.894L21 21m-3.228-3.228l-3.65-3.65m0 0a3 3 0 10-4.243-4.243m4.242 4.242L9.88 9.88" />
              </svg>
            </div>
            <div className="text-center px-3">
              <p className="text-slate-300 text-sm sm:text-base font-bold">Image Hidden</p>
              <p className="text-slate-500 text-xs sm:text-sm mt-1 leading-relaxed">Claim in person at the SAS Office</p>
            </div>
          </div>
        ) : img ? (
          <img
            src={img}
            alt={name}
            onError={(e) => { (e.target as HTMLImageElement).src = "/bgimg.png"; }}
            className="w-full h-full object-cover"
          />
        ) : (
          <div className="w-full h-full flex items-center justify-center">
            <svg width="48" height="48" fill="none" viewBox="0 0 24 24" stroke="currentColor" className="text-slate-600" strokeWidth="1">
              <rect width="18" height="18" x="3" y="3" rx="2" /><circle cx="9" cy="9" r="2" />
              <path d="m21 15-3.086-3.086a2 2 0 0 0-2.828 0L6 21" />
            </svg>
          </div>
        )}

        <div className="absolute top-2 left-2 sm:top-3 sm:left-3">
          <span className={`px-2 py-1 sm:px-3 sm:py-1.5 text-xs sm:text-sm font-black uppercase tracking-widest rounded-full border backdrop-blur-sm ${
            badgeColor === "red"
              ? "bg-red-900/80 text-red-300 border-red-700/30"
              : "bg-blue-800/90 text-blue-200 border-blue-500/50"
          }`}>
            {badge}
          </span>
        </div>

        {category && (
          <div className="absolute top-2 right-2 sm:top-3 sm:right-3">
            <span className="px-2 py-1 text-xs font-semibold bg-black/50 text-gray-300 border border-white/10 rounded-full backdrop-blur-sm">
              {category}
            </span>
          </div>
        )}
      </div>

      <div className="h-px bg-white/10 shrink-0" />

      <div className="flex flex-col flex-1 p-3 sm:p-4 md:p-5 gap-2 sm:gap-3">
        <h3 className={`font-black text-base sm:text-lg md:text-xl lg:text-2xl leading-tight line-clamp-1 ${restricted ? "text-slate-400" : "text-white"}`}>
          {name}
        </h3>
        {restricted ? (
          <p className="text-slate-400 text-xs sm:text-sm leading-relaxed">Visit the SAS Office to claim this item.</p>
        ) : (
          <p className="text-slate-300 text-xs sm:text-sm md:text-base leading-relaxed line-clamp-2">{description || "No description provided."}</p>
        )}
        <div className="mt-auto pt-2 sm:pt-4 border-t border-white/5 space-y-1.5 sm:space-y-2.5">
          <div className="flex items-center gap-2 text-xs sm:text-sm md:text-base text-slate-300">
            <svg width="12" height="12" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2" className="shrink-0 text-blue-400">
              <path d="M20 10c0 6-8 12-8 12s-8-6-8-12a8 8 0 0 1 16 0Z" /><circle cx="12" cy="10" r="3" />
            </svg>
            <span className="truncate">{location}</span>
          </div>
          <div className="flex items-center gap-2 text-xs sm:text-sm text-slate-400">
            <svg width="12" height="12" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2" className="shrink-0 text-slate-500">
              <rect width="18" height="18" x="3" y="4" rx="2" /><line x1="3" x2="21" y1="10" y2="10" />
            </svg>
            <span>{formatDate(date)}</span>
          </div>
        </div>
      </div>
    </div>
  );
};

// ── Slide renderer (a single "page" of 2 cards) ──────────────────────────────
const SlideContent = ({
  pair, accentColor, accent,
}: {
  pair: { name: string; description: string; location: string; date: string; img: string; category?: string }[];
  accentColor: "red" | "blue";
  accent: { border: string; text: string; dot: string };
}) => (
  <div className="w-full h-full grid grid-cols-2 gap-2 sm:gap-3 md:gap-4 content-start shrink-0">
    {pair.length === 0 ? (
      <div className="col-span-2 flex flex-col items-center justify-center h-full opacity-30">
        <svg width="40" height="40" fill="none" viewBox="0 0 24 24" stroke="currentColor" className="text-slate-500 mb-2 sm:mb-3" strokeWidth="1">
          <circle cx="11" cy="11" r="8" /><path d="m21 21-4.3-4.3" />
        </svg>
        <p className="text-slate-400 text-sm sm:text-base md:text-lg">No items to display</p>
      </div>
    ) : (
      pair.map((item, i) => (
        <ItemCard
          key={i}
          {...item}
          badge={accentColor === "red" ? "Lost" : "Found"}
          badgeColor={accentColor}
        />
      ))
    )}
    {pair.length === 1 && (
      <div className={`rounded-2xl border border-dashed ${accent.border} opacity-20 flex items-center justify-center`}>
        <p className={`text-xs sm:text-sm ${accent.text} font-semibold uppercase tracking-widest`}>No more items</p>
      </div>
    )}
  </div>
);

// ── Panel ─────────────────────────────────────────────────────────────────────
const Panel = ({
  title, accentColor, items, slideIndex, total,
}: {
  title: string;
  accentColor: "red" | "blue";
  items: { name: string; description: string; location: string; date: string; img: string; category?: string }[];
  slideIndex: number;
  total: number;
}) => {
  const accent = accentColor === "red"
    ? { border: "border-red-500/30", text: "text-red-400", dot: "bg-red-500" }
    : { border: "border-blue-400/40", text: "text-blue-300", dot: "bg-blue-400" };

  const pairs = chunk(items, 2);
  const totalPairs = Math.max(pairs.length, 1);
  const activeIdx = slideIndex % totalPairs;

  return (
    <div className="flex flex-col h-full bg-slate-900">
      <div className={`flex items-center justify-between px-3 sm:px-4 md:px-6 py-2 sm:py-3 md:py-4 border-b ${accent.border} bg-slate-800/50`}>
        <div>
          <h2 className={`text-sm sm:text-base md:text-lg font-black uppercase tracking-[0.15em] sm:tracking-[0.2em] ${accent.text}`}>{title}</h2>
          <p className="text-slate-500 text-xs sm:text-sm mt-0.5">{total} item{total !== 1 ? "s" : ""} on record</p>
        </div>
        <div className="flex items-center gap-1 sm:gap-1.5">
          {pairs.map((_, i) => (
            <div
              key={i}
              className={`rounded-full transition-all duration-300 ${
                i === activeIdx
                  ? `w-3 sm:w-4 h-1 sm:h-1.5 ${accent.dot}`
                  : "w-1 sm:w-1.5 h-1 sm:h-1.5 bg-slate-600"
              }`}
            />
          ))}
        </div>
      </div>

      {/* Horizontal sliding carousel */}
      <div className="flex-1 min-h-0 overflow-hidden relative">
        {(pairs.length === 0 ? [[]] : pairs).map((pair, i) => {
          const offset = i - activeIdx;
          return (
            <div
              key={i}
              className="absolute inset-0 p-2 sm:p-3 md:p-5"
              style={{
                transform: `translateX(${offset * 100}%)`,
                transition: "transform 0.6s cubic-bezier(0.4, 0, 0.2, 1)",
                willChange: "transform",
              }}
            >
              <SlideContent pair={pair} accentColor={accentColor} accent={accent} />
            </div>
          );
        })}
      </div>
    </div>
  );
};

// ── Ticker ────────────────────────────────────────────────────────────────────
const Ticker = ({ lostCount, foundCount }: {
  lostCount: number;
  foundCount: number;
}) => {
  const items = [
    `${lostCount} item${lostCount !== 1 ? "s" : ""} currently reported lost`,
    `${foundCount} item${foundCount !== 1 ? "s" : ""} recovered and awaiting claim`,
    "Visit the SAS Office to report or claim an item",
    "Bring a valid school ID when claiming found items",
    "NBSC Student Affairs Office — Lost & Found Management System",
  ];
  const repeated = [...items, ...items];

  return (
    <div className="h-9 sm:h-11 md:h-12 bg-slate-800 border-t border-white/10 flex items-center overflow-hidden shrink-0">
      <div className="flex-1 overflow-hidden">
        <div className="flex gap-8 sm:gap-12 animate-ticker whitespace-nowrap">
          {repeated.map((text, i) => (
            <span key={i} className="text-slate-300 text-xs sm:text-sm font-medium shrink-0">
              {text}
              <span className="mx-4 sm:mx-6 text-slate-600">•</span>
            </span>
          ))}
        </div>
      </div>
    </div>
  );
};

// ── Main Portal Display ───────────────────────────────────────────────────────
const PortalDisplay = () => {
  const SLIDE_DURATION = 5000;
  const REFETCH_INTERVAL = 60000;

  const { data: lostData } = useGetLostItemsQuery(
    { page: 1, limit: 50, sortBy: "date", sortOrder: "desc" },
    { pollingInterval: REFETCH_INTERVAL }
  );
  const { data: foundData } = useGetFoundItemsQuery(
    { page: 1, limit: 50, sortBy: "date", sortOrder: "desc" },
    { pollingInterval: REFETCH_INTERVAL }
  );

  const [slideIndex, setSlideIndex] = useState(0);
  const [isActive, setIsActive] = useState(true);

  const lostItems: LostItem[] = (lostData?.data ?? []).filter((i: LostItem) => !(i as any).isFound);
  const foundItems: FoundItem[] = (foundData?.data ?? []).filter((i: FoundItem) => !i.isClaimed);

  const lostMapped = lostItems.map(i => ({
    name: i.lostItemName,
    description: i.description,
    location: i.location,
    date: i.date,
    img: i.img || "",
    category: i.category?.name,
  }));

  const foundMapped = foundItems.map(i => ({
    name: i.foundItemName,
    description: i.description,
    location: i.location,
    date: i.date,
    img: getFoundImg(i),
    category: i.category?.name,
  }));

  // Advance slide — just update the index, CSS handles the transition
  const advanceSlide = useCallback(() => {
  setIsActive(false);
  setSlideIndex(prev => prev + 1);
  setTimeout(() => setIsActive(true), 100);
}, []);

  useEffect(() => {
    setIsActive(true);
    const slideTimer = setInterval(advanceSlide, SLIDE_DURATION);
    return () => {
      clearInterval(slideTimer);
    };
  }, [advanceSlide]);

  return (
    <>
      <style>{`
        html, body, #root {
          background-color: #0f172a !important;
          margin: 0; padding: 0;
          width: 100%; height: 100%;
          overflow: hidden;
          scrollbar-gutter: auto;
        }
        :fullscreen, ::backdrop { background-color: #0f172a !important; }
        :-webkit-full-screen { background-color: #0f172a !important; }
        @keyframes ticker {
          from { transform: translateX(0); }
          to   { transform: translateX(-50%); }
        }
        .animate-ticker { animation: ticker 30s linear infinite; }

        /* Mobile: stack panels vertically */
        @media (max-width: 639px) {
          .portal-panels {
            grid-template-columns: 1fr !important;
            grid-template-rows: 1fr 1fr;
            overflow-y: auto;
          }
          .portal-panels > *:first-child {
            border-right: none !important;
            border-bottom: 1px solid rgba(255,255,255,0.05);
          }
        }
      `}</style>

      <div className="fixed inset-0 bg-slate-900 flex flex-col overflow-hidden select-none">
        {/* Progress bar */}
        <div className="relative h-1 shrink-0">
          <ProgressBar duration={SLIDE_DURATION} active={isActive} />
        </div>

        {/* Split panels — fills all remaining space, stacks on mobile */}
        <div className="flex-1 grid grid-cols-2 portal-panels min-h-0 divide-x divide-white/5">
          <Panel
            title="Lost Items"
            accentColor="red"
            items={lostMapped}
            slideIndex={slideIndex}
            total={lostItems.length}
          />
          <Panel
            title="Found Items"
            accentColor="blue"
            items={foundMapped}
            slideIndex={slideIndex}
            total={foundItems.length}
          />
        </div>

        {/* Ticker */}
        <Ticker
          lostCount={lostItems.length}
          foundCount={foundItems.length}
        />
      </div>
    </>
  );
};

export default PortalDisplay;