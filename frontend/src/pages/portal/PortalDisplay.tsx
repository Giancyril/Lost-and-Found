import { useState, useEffect, useCallback, useRef } from "react";
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

function chunk<T>(arr: T[], size: number): T[][] {
  return Array.from({ length: Math.ceil(arr.length / size) }, (_, i) =>
    arr.slice(i * size, i * size + size)
  );
}

// ── Restricted category check ─────────────────────────────────────────────────
const RESTRICTED_CATEGORIES = ["wallets & purses", "wallet", "purse"];
const isRestrictedCategory = (cat?: string) =>
  RESTRICTED_CATEGORIES.some(c => cat?.toLowerCase().includes(c));

// ── QR Code Slide Component ───────────────────────────────────────────────────
const QRCodeSlide = () => {
  return (
    <div className="h-full w-full bg-slate-900 flex flex-col overflow-hidden">
      <div className="h-1 w-full bg-blue-500 shrink-0" />
      <div className="flex-1 flex items-center justify-center px-6 py-4 min-h-0">
        <div className="w-full max-w-5xl flex flex-col items-center gap-4">
          <div className="text-center">
            <p className="text-slate-400 text-xs font-bold uppercase tracking-[0.25em] mb-1">
              Northern Bukidnon State College
            </p>
            <h1 className="text-white text-2xl md:text-3xl font-black tracking-tight">
              Student Affairs Services
            </h1>
            <div className="flex items-center gap-3 justify-center mt-2">
              <div className="h-px w-16 bg-slate-600" />
              <span className="text-blue-400 text-xs font-bold uppercase tracking-widest">Lost &amp; Found System</span>
              <div className="h-px w-16 bg-slate-600" />
            </div>
          </div>
          <div className="flex flex-col md:flex-row items-center gap-6 w-full">
            <div className="flex flex-col items-center gap-3 shrink-0">
              <div className="bg-white p-4 rounded-2xl shadow-2xl border-4 border-slate-200">
                <img
                  src="/lost-items-qr.png"
                  alt="Lost Items QR Code"
                  className="w-44 h-44 md:w-52 md:h-52 object-contain"
                />
              </div>
              <div className="text-center">
                <p className="text-red-400 font-bold text-sm uppercase tracking-widest">Scan to Report</p>
                <p className="text-slate-400 text-xs mt-0.5">YOUR MISSING ITEMS</p>
              </div>
            </div>
            <div className="hidden md:block h-48 w-px bg-slate-700 shrink-0" />
            <div className="block md:hidden w-full h-px bg-slate-700 shrink-0" />
            <div className="flex-1 space-y-4 w-full">
              <div className="space-y-2">
                {[
                  { num: "01", title: "Scan the QR Code", desc: "Point your phone camera at the code to open the reporting form." },
                  { num: "02", title: "Fill in Item Details", desc: "Provide a description, location last seen, and date of loss." },
                  { num: "03", title: "Submit Your Report", desc: "Visit the SAS Office regularly to check for updates on your lost item." },
                ].map(step => (
                  <div key={step.num} className="flex items-start gap-3 bg-slate-800/60 border border-white/5 rounded-xl px-4 py-2.5">
                    <span className="text-blue-500 font-black text-sm shrink-0 mt-0.5">{step.num}</span>
                    <div>
                      <p className="text-white font-bold text-sm leading-tight">{step.title}</p>
                      <p className="text-slate-400 text-xs mt-0.5 leading-relaxed">{step.desc}</p>
                    </div>
                  </div>
                ))}
              </div>
              <div className="flex items-start gap-2 bg-blue-950/50 border border-blue-500/20 rounded-xl px-4 py-2.5">
                <svg width="14" height="14" className="shrink-0 text-blue-400 mt-0.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
                  <circle cx="12" cy="12" r="10" /><path d="M12 16v-4m0-4h.01" />
                </svg>
                <p className="text-blue-300 text-xs leading-relaxed">
                  <span className="font-bold">Claiming a found item?</span> Bring a valid school ID to the SAS Office during office hours.
                </p>
              </div>
            </div>
          </div>
          <div className="w-full flex items-center justify-center pt-2 border-t border-white/5">
            <p className="text-slate-500 text-[10px] uppercase tracking-widest font-semibold">NBSC • Student Affairs and Services</p>
          </div>
        </div>
      </div>
      <div className="h-1 w-full bg-blue-500 shrink-0" />
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
    <div className={`relative flex flex-col border rounded-2xl overflow-hidden h-full ${
      badgeColor === "red" ? "bg-slate-800 border-red-500/20" : "bg-slate-800 border-blue-400/30"
    }`}>
      <div className="relative h-32 sm:h-40 md:h-48 lg:h-56 bg-slate-900 shrink-0 overflow-hidden">
        {restricted ? (
          <div className="w-full h-full flex flex-col items-center justify-center gap-2 sm:gap-3 bg-slate-900">
            <div className="w-12 h-12 sm:w-16 sm:h-16 rounded-full bg-slate-800 border border-slate-700 flex items-center justify-center">
              <svg width="22" height="22" fill="none" viewBox="0 0 24 24" stroke="currentColor" className="text-slate-500" strokeWidth="1.5">
                <path strokeLinecap="round" strokeLinejoin="round" d="M3.98 8.223A10.477 10.477 0 001.934 12C3.226 16.338 7.244 19.5 12 19.5c.993 0 1.953-.138 2.863-.395M6.228 6.228A10.45 10.45 0 0112 4.5c4.756 0 8.773 3.162 10.065 7.498a10.523 10.523 0 01-4.293 5.774M6.228 6.228L3 3m3.228 3.228l3.65 3.65m7.894 7.894L21 21m-3.228-3.228l-3.65-3.65m0 0a3 3 0 10-4.243-4.243m4.242 4.242L9.88 9.88" />
              </svg>
            </div>
            <div className="text-center px-2 sm:px-3">
              <p className="text-slate-300 text-xs sm:text-sm font-bold">Image Hidden</p>
              <p className="text-slate-500 text-[10px] sm:text-xs mt-1 leading-relaxed">Claim in person at the SAS Office</p>
            </div>
          </div>
        ) : img ? (
          <img src={img} alt={name} onError={(e) => { (e.target as HTMLImageElement).src = "/bgimg.png"; }} className="w-full h-full object-cover" />
        ) : (
          <div className="w-full h-full flex items-center justify-center">
            <svg width="48" height="48" fill="none" viewBox="0 0 24 24" stroke="currentColor" className="text-slate-600" strokeWidth="1">
              <rect width="18" height="18" x="3" y="3" rx="2" /><circle cx="9" cy="9" r="2" />
              <path d="m21 15-3.086-3.086a2 2 0 0 0-2.828 0L6 21" />
            </svg>
          </div>
        )}
        <div className="absolute top-1.5 left-1.5 sm:top-2 sm:left-2">
          <span className={`px-1.5 py-0.5 sm:px-2 sm:py-1 text-[10px] sm:text-xs font-black uppercase tracking-widest rounded-full border backdrop-blur-sm ${
            badgeColor === "red"
              ? "bg-red-900/80 text-red-300 border-red-700/30"
              : "bg-blue-800/90 text-blue-200 border-blue-500/50"
          }`}>{badge}</span>
        </div>
        {category && (
          <div className="absolute top-1.5 right-1.5 sm:top-2 sm:right-2">
            <span className="px-1.5 py-0.5 text-[10px] sm:text-xs font-semibold bg-black/50 text-gray-300 border border-white/10 rounded-full backdrop-blur-sm">{category}</span>
          </div>
        )}
      </div>
      <div className="h-px bg-white/10 shrink-0" />
      <div className="flex flex-col flex-1 p-2 sm:p-3 md:p-4 lg:p-5 gap-1.5 sm:gap-2 md:gap-3">
        <h3 className={`font-black text-sm sm:text-base md:text-lg lg:text-xl leading-tight line-clamp-1 ${restricted ? "text-slate-400" : "text-white"}`}>
          {name}
        </h3>
        {restricted ? (
          <p className="text-slate-400 text-[10px] sm:text-xs leading-relaxed">Visit the SAS Office to claim this item.</p>
        ) : (
          <p className="text-slate-300 text-[10px] sm:text-xs md:text-sm leading-relaxed line-clamp-2">{description || "No description provided."}</p>
        )}
        <div className="mt-auto pt-1.5 sm:pt-2 md:pt-4 border-t border-white/5 space-y-1 sm:space-y-1.5 md:space-y-2.5">
          <div className="flex items-center gap-1.5 text-[10px] sm:text-xs md:text-sm text-slate-300">
            <svg width="10" height="10" className="sm:w-3 sm:h-3 shrink-0 text-blue-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
              <path d="M20 10c0 6-8 12-8 12s-8-6-8-12a8 8 0 0 1 16 0Z" /><circle cx="12" cy="10" r="3" />
            </svg>
            <span className="truncate">{location}</span>
          </div>
          <div className="flex items-center gap-1.5 text-[10px] sm:text-xs text-slate-400">
            <svg width="10" height="10" className="sm:w-3 sm:h-3 shrink-0 text-slate-500" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
              <rect width="18" height="18" x="3" y="4" rx="2" /><line x1="3" x2="21" y1="10" y2="10" />
            </svg>
            <span>{formatDate(date)}</span>
          </div>
        </div>
      </div>
    </div>
  );
};

// ── Slide Content ─────────────────────────────────────────────────────────────
const SlideContent = ({
  pair, accentColor, accent,
}: {
  pair: { name: string; description: string; location: string; date: string; img: string; category?: string }[];
  accentColor: "red" | "blue";
  accent: { border: string; text: string; dot: string };
}) => (
  <div className="w-full h-full grid grid-cols-1 sm:grid-cols-2 gap-2 sm:gap-3 md:gap-4 content-start shrink-0">
    {pair.length === 0 ? (
      <div className="col-span-1 sm:col-span-2 flex flex-col items-center justify-center h-full opacity-30">
        <svg width="40" height="40" fill="none" viewBox="0 0 24 24" stroke="currentColor" className="text-slate-500 mb-2 sm:mb-3" strokeWidth="1">
          <circle cx="11" cy="11" r="8" /><path d="m21 21-4.3-4.3" />
        </svg>
        <p className="text-slate-400 text-sm sm:text-base md:text-lg">No items to display</p>
      </div>
    ) : (
      pair.map((item, i) => (
        <ItemCard key={i} {...item} badge={accentColor === "red" ? "Lost" : "Found"} badgeColor={accentColor} />
      ))
    )}
    {pair.length === 1 && (
      <div className={`col-span-1 sm:col-span-2 rounded-2xl border border-dashed ${accent.border} opacity-20 flex items-center justify-center`}>
        <p className={`text-xs sm:text-sm ${accent.text} font-semibold uppercase tracking-widest`}>No more items</p>
      </div>
    )}
  </div>
);

// ── Infinite Panel ────────────────────────────────────────────────────────────
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

  const realPairs = chunk(items, 2);
  const n = realPairs.length;

  const [pos, setPos]           = useState(1);
  const [animated, setAnimated] = useState(true);
  const isSnapping              = useRef(false);

  const prevSlideIndex = useRef(slideIndex);
  useEffect(() => {
    if (n === 0) return;
    if (slideIndex === prevSlideIndex.current) return;
    prevSlideIndex.current = slideIndex;
    setAnimated(true);
    setPos(p => p + 1);
  }, [slideIndex, n]);

  const handleTransitionEnd = useCallback(() => {
    if (n === 0 || isSnapping.current) return;
    setPos(p => {
      if (p === n + 1 || p === 0) {
        isSnapping.current = true;
        return p === n + 1 ? 1 : n;
      }
      return p;
    });
    setAnimated(false);
    requestAnimationFrame(() => {
      requestAnimationFrame(() => {
        isSnapping.current = false;
        setAnimated(true);
      });
    });
  }, [n]);

  const dotIdx = ((pos - 1 + n) % n + n) % n;
  const extendedPairs = n > 0 ? [realPairs[n - 1], ...realPairs, realPairs[0]] : [];

  return (
    <div className="flex flex-col h-full bg-slate-900 overflow-hidden">
      <div className={`flex items-center justify-between px-2 sm:px-3 md:px-4 py-1.5 sm:py-2 md:py-3 border-b ${accent.border} bg-slate-800/50 h-[60px] sm:h-[80px] md:h-[100px] shrink-0`}>
        <div className="flex-1 min-w-0 pr-2 sm:pr-4">
          <h2 className={`text-[10px] sm:text-xs md:text-base font-black uppercase tracking-widest ${accent.text} truncate`}>
            {title}
          </h2>
          <p className="text-slate-300 text-[9px] sm:text-[10px] md:text-xs font-semibold leading-tight mt-0.5 sm:mt-1 line-clamp-1">
            {accentColor === "red"
              ? "Reported Missing: Not held at SAS Office"
              : "Recovered Items: Held at SAS Office"}
          </p>
          <p className="text-slate-500 text-[8px] sm:text-[9px] md:text-[10px] mt-0.5 sm:mt-1 font-bold uppercase tracking-tight">
            {total} {total === 1 ? "item" : "items"} on record
          </p>
        </div>
        <div className="flex items-center gap-0.5 sm:gap-1 md:gap-1.5 shrink-0">
          {realPairs.map((_, i) => (
            <div key={i} className={`rounded-full transition-all duration-300 ${
              i === dotIdx
                ? `w-2 sm:w-3 md:w-4 h-0.5 sm:h-1 md:h-1.5 ${accent.dot}`
                : "w-0.5 sm:w-1 md:w-1.5 h-0.5 sm:h-1 md:h-1.5 bg-slate-600"
            }`} />
          ))}
        </div>
      </div>
      <div className="flex-1 min-h-0 overflow-hidden relative">
        {n === 0 ? (
          <div className="absolute inset-0 flex flex-col items-center justify-center opacity-20">
            <svg width="40" height="40" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="1">
              <circle cx="11" cy="11" r="8" /><path d="m21 21-4.3-4.3" />
            </svg>
            <p className="mt-2 text-sm">No records found</p>
          </div>
        ) : (
          <div
            className="absolute inset-0 flex"
            style={{
              width: `${extendedPairs.length * 100}%`,
              transform: `translateX(${-(pos / extendedPairs.length) * 100}%)`,
              transition: animated ? "transform 0.6s cubic-bezier(0.4, 0, 0.2, 1)" : "none",
            }}
            onTransitionEnd={handleTransitionEnd}
          >
            {extendedPairs.map((pair, i) => (
              <div
                key={i}
                className="p-1.5 sm:p-2 md:p-3 lg:p-4"
                style={{ width: `${100 / extendedPairs.length}%`, flexShrink: 0 }}
              >
                <SlideContent pair={pair} accentColor={accentColor} accent={accent} />
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

// ── Header Component ──────────────────────────────────────────────────────────
const Header = () => {
  const [currentTime, setCurrentTime] = useState(new Date());
  const [weather, setWeather] = useState<{
    temp: number;
    condition: string;
    icon: string;
  } | null>(null);
  const [weatherLoading, setWeatherLoading] = useState(true);

  useEffect(() => {
    const timer = setInterval(() => setCurrentTime(new Date()), 1000);
    return () => clearInterval(timer);
  }, []);

  useEffect(() => {
    const fetchWeather = async () => {
      try {
        const response = await fetch(
          `https://api.openweathermap.org/data/2.5/weather?q=Manolo Fortich&appid=8e2117fb762222012f8606202d5df1fd&units=metric`
        );
        if (!response.ok) throw new Error("Weather API unavailable");
        const data = await response.json();
        setWeather({
          temp: Math.round(data.main.temp),
          condition: data.weather[0].main,
          icon: data.weather[0].icon,
        });
      } catch {
        setWeather({ temp: 30, condition: "Cloudy", icon: "03d" });
      } finally {
        setWeatherLoading(false);
      }
    };

    fetchWeather();
    const weatherTimer = setInterval(fetchWeather, 600000);
    return () => clearInterval(weatherTimer);
  }, []);

  const formatTime = (date: Date) =>
    date.toLocaleTimeString("en-US", { hour: "2-digit", minute: "2-digit", second: "2-digit", hour12: true });

  const formatDateStr = (date: Date) =>
    date.toLocaleDateString("en-US", { weekday: "long", month: "long", day: "numeric", year: "numeric" });

  const getWeatherEmoji = (icon: string) => {
    const iconMap: Record<string, string> = {
      "01d": "☀️", "01n": "🌙", "02d": "⛅", "02n": "☁️",
      "03d": "☁️", "03n": "☁️", "04d": "☁️", "04n": "☁️",
      "09d": "🌧️", "09n": "🌧️", "10d": "🌦️", "10n": "🌧️",
      "11d": "⛈️", "11n": "⛈️", "13d": "❄️", "13n": "❄️",
      "50d": "🌫️", "50n": "🌫️",
    };
    return iconMap[icon] || "🌤️";
  };

  return (
    <div className="h-20 md:h-24 bg-slate-800 border-b border-white/10 px-4 sm:px-6 md:px-8 flex items-center justify-between shrink-0">
      <div />

      <div className="flex items-center gap-4 sm:gap-6">

        {/* Date & Time */}
        <div className="flex flex-col items-end">
          <span className="text-slate-400 text-[10px] sm:text-xs font-medium tracking-wide">
            {formatDateStr(currentTime)}
          </span>
          <span className="text-white text-xl sm:text-2xl font-bold tabular-nums leading-tight mt-0.5 tracking-[0.15em]">
            {formatTime(currentTime)}
          </span>
        </div>

        {/* Divider */}
        <div className="w-px h-10 bg-white/10 shrink-0" />

        {/* Weather */}
        {weatherLoading ? (
          <div className="flex items-center justify-center w-8 h-8">
            <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-slate-400" />
          </div>
        ) : (
          <div className="flex items-center gap-3">
            {/* Weather emoji */}
            <span className="text-3xl sm:text-4xl leading-none select-none">
              {getWeatherEmoji(weather?.icon || "")}
            </span>

            {/* Temp + label */}
            <div className="flex flex-col">
              <div className="flex items-baseline gap-1">
                <span className="text-white text-2xl sm:text-3xl font-bold tabular-nums leading-none">
                  {weather?.temp ?? "--"}°
                </span>
                <span className="text-slate-500 text-xs font-medium">C</span>
              </div>
              <span className="text-slate-400 text-[10px] sm:text-xs font-medium mt-0.5 whitespace-nowrap">
                {weather?.condition ?? "—"} · Manolo Fortich
              </span>
            </div>
          </div>
        )}

      </div>
    </div>
  );
};

// ── Ticker ────────────────────────────────────────────────────────────────────
const Ticker = ({ lostCount, foundCount }: { lostCount: number; foundCount: number }) => {
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

  const { data: lostData, error: lostError, isLoading: lostLoading } = useGetLostItemsQuery(
    { page: 1, limit: 10, sortBy: "date", sortOrder: "desc" },
    { pollingInterval: REFETCH_INTERVAL, refetchOnFocus: true, refetchOnReconnect: true }
  );
  const { data: foundData, error: foundError, isLoading: foundLoading } = useGetFoundItemsQuery(
    { page: 1, limit: 10, sortBy: "date", sortOrder: "desc" },
    { pollingInterval: REFETCH_INTERVAL, refetchOnFocus: true, refetchOnReconnect: true }
  );

  const [slideIndex, setSlideIndex] = useState(0);

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

  const totalLostSlides = Math.max(Math.ceil(lostMapped.length / 4), 1);
  const totalFoundSlides = Math.max(Math.ceil(foundMapped.length / 4), 1);
  const totalSlides = totalLostSlides + totalFoundSlides + 1;

  const advanceSlide = useCallback(() => {
    setSlideIndex(prev => (prev + 1) % totalSlides);
  }, [totalSlides]);

  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    if (timerRef.current) clearTimeout(timerRef.current);
    const isQRCodeSlide = slideIndex >= totalLostSlides + totalFoundSlides;
    const duration = isQRCodeSlide ? 15000 : SLIDE_DURATION;
    timerRef.current = setTimeout(() => { advanceSlide(); }, duration);
    return () => { if (timerRef.current) clearTimeout(timerRef.current); };
  }, [slideIndex, totalLostSlides, totalFoundSlides, advanceSlide]);

  const sharedStyles = `
    html, body, #root {
      background-color: #0f172a !important;
      margin: 0; padding: 0;
      width: 100%; height: 100%;
      overflow: hidden;
    }
  `;

  if (lostLoading || foundLoading) {
    return (
      <>
        <style>{sharedStyles}</style>
        <div className="fixed inset-0 bg-slate-900 flex items-center justify-center">
          <div className="text-white text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-white mx-auto mb-4" />
            <p className="text-lg">Loading portal data...</p>
          </div>
        </div>
      </>
    );
  }

  if (lostError || foundError) {
    return (
      <>
        <style>{sharedStyles}</style>
        <div className="fixed inset-0 bg-slate-900 flex items-center justify-center">
          <div className="text-white text-center max-w-md px-4">
            <div className="text-red-400 text-6xl mb-4">!</div>
            <h2 className="text-xl font-bold mb-2">Portal Loading Error</h2>
            <p className="text-gray-400 mb-4">
              {lostError && `Lost items: ${"message" in lostError ? lostError.message : "Unknown error"}`}
              {foundError && `Found items: ${"message" in foundError ? foundError.message : "Unknown error"}`}
            </p>
            <button onClick={() => window.location.reload()} className="px-4 py-2 bg-blue-600 hover:bg-blue-500 text-white rounded-lg transition-colors">
              Refresh Page
            </button>
          </div>
        </div>
      </>
    );
  }

  if (lostItems.length === 0 && foundItems.length === 0) {
    return (
      <>
        <style>{sharedStyles}</style>
        <div className="fixed inset-0 bg-slate-900 flex items-center justify-center">
          <div className="text-white text-center max-w-md px-4">
            <div className="text-gray-400 text-6xl mb-4">[]</div>
            <h2 className="text-xl font-bold mb-2">No Items Available</h2>
            <p className="text-gray-400 mb-4">There are currently no lost or found items to display.</p>
            <button onClick={() => window.location.reload()} className="px-4 py-2 bg-blue-600 hover:bg-blue-500 text-white rounded-lg transition-colors">
              Refresh Page
            </button>
          </div>
        </div>
      </>
    );
  }

  const isQRSlide = slideIndex >= totalLostSlides + totalFoundSlides;

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
        <Header />
        <div className="flex-1 grid grid-cols-2 portal-panels min-h-0 divide-x divide-white/5">
          {isQRSlide ? (
            <div className="col-span-2 h-full overflow-hidden">
              <QRCodeSlide />
            </div>
          ) : (
            <>
              <Panel title="Lost Items"  accentColor="red"  items={lostMapped}  slideIndex={slideIndex} total={lostItems.length} />
              <Panel title="Found Items" accentColor="blue" items={foundMapped} slideIndex={slideIndex} total={foundItems.length} />
            </>
          )}
        </div>
        <Ticker lostCount={lostItems.length} foundCount={foundItems.length} />
      </div>
    </>
  );
};

export default PortalDisplay;