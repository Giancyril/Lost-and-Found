import { useState, useEffect, useRef, useMemo } from "react";
import { MapContainer, TileLayer, useMap, ZoomControl, Polyline } from "react-leaflet";
import { useGetHeatmapStatsQuery } from "../../redux/api/api";
import {
  FaMapMarkedAlt, FaSearch, FaExclamationTriangle,
  FaCheckCircle, FaLayerGroup, FaThermometerHalf, FaList, FaMap,
  FaClipboardList, FaPlay, FaPause, FaBrain, FaRoute, FaChevronDown,
  FaFire, FaEye,
} from "react-icons/fa";
import { getCoordinates, CAMPUS_COORDINATES, CAMPUS_CENTER, CAMPUS_ZOOM } from "../../utils/campusLocations";
import "leaflet/dist/leaflet.css";
import L from "leaflet";

// ── CustomSelect ───────────────────────────────────────────────────────────────
const CustomSelect = ({
  options, value, onChange, placeholder = "Select…",
}: {
  options: { value: string; label: string }[];
  value: string;
  onChange: (val: string) => void;
  placeholder?: string;
}) => {
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);
  const selected = options.find(o => o.value === value);

  useEffect(() => {
    const fn = (e: MouseEvent) => { if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false); };
    document.addEventListener("mousedown", fn);
    return () => document.removeEventListener("mousedown", fn);
  }, []);

  return (
    <div ref={ref} className="relative">
      <div onClick={() => setOpen(o => !o)}
        className={`w-full flex items-center gap-2 bg-gray-800/60 border rounded-lg cursor-pointer select-none transition-all duration-200 px-3 py-2 ${open ? "ring-2 ring-cyan-500/30 border-cyan-500/40" : "border-gray-700 hover:border-gray-600"
          } ${value ? "text-white" : "text-gray-500"}`}>
        <span className="flex-1 text-xs truncate">{selected ? selected.label : placeholder}</span>
        <svg width="10" height="6" viewBox="0 0 10 6" className={`text-gray-500 shrink-0 transition-transform duration-200 ${open ? "rotate-180" : ""}`}>
          <path d="M1 1l4 4 4-4" stroke="currentColor" strokeWidth="1.5" fill="none" strokeLinecap="round" />
        </svg>
      </div>
      {open && (
        <div className="absolute top-full mt-1.5 left-0 right-0 bg-gray-900 border border-white/10 rounded-xl overflow-hidden z-50 shadow-2xl shadow-black/40 max-h-48 overflow-y-auto">
          {options.map((opt, i) => (
            <div key={opt.value} onClick={() => { onChange(opt.value); setOpen(false); }}
              className={`px-3 py-2 cursor-pointer text-xs font-medium transition-colors select-none ${i < options.length - 1 ? "border-b border-white/[0.04]" : ""
                } ${opt.value === value ? "bg-cyan-500/10 text-cyan-300" : "text-gray-400 hover:bg-white/[0.04] hover:text-white"}`}>
              {opt.label}
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

// Fix Leaflet default icon issue with bundlers
delete (L.Icon.Default.prototype as unknown as { _getIconUrl?: string })._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: "https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-icon-2x.png",
  iconUrl: "https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-icon.png",
  shadowUrl: "https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-shadow.png",
});

// ── Types ─────────────────────────────────────────────────────────────────────
type Filter = "all" | "found" | "lost";
type ViewMode = "map" | "list";

interface HeatItem {
  id: string;
  type: "found" | "lost";
  location: string;
  date: string;
  category: string;
  name: string;
}

interface LocationStat {
  location: string;
  found: number;
  lost: number;
  total: number;
  lat?: number;
  lng?: number;
}

// ── Time slots ────────────────────────────────────────────────────────────────
const TIME_SLOTS = [
  { label: "8–10 AM", from: 8, to: 10 },
  { label: "10AM–12", from: 10, to: 12 },
  { label: "12–2 PM", from: 12, to: 14 },
  { label: "2–4 PM", from: 14, to: 16 },
  { label: "4–6 PM", from: 16, to: 18 },
  { label: "6–8 PM", from: 18, to: 20 },
];

// ── High-risk transit corridors ───────────────────────────────────────────────
const CORRIDORS: Array<{ name: string; path: [number, number][] }> = [
  { name: "Library ↔ Canteen", path: [CAMPUS_COORDINATES["library"] as [number, number], CAMPUS_COORDINATES["canteen"] as [number, number]] },
  { name: "SWDC ↔ ICS Building", path: [CAMPUS_COORDINATES["SWDC"] as [number, number], CAMPUS_COORDINATES["ics building"] as [number, number]] },
  { name: "Entrance ↔ Admin", path: [CAMPUS_COORDINATES["entrance"] as [number, number], CAMPUS_COORDINATES["admin"] as [number, number]] },
  { name: "Canteen ↔ Basketball Court", path: [CAMPUS_COORDINATES["canteen"] as [number, number], CAMPUS_COORDINATES["basketball court"] as [number, number]] },
];

// ── Heat color helpers ────────────────────────────────────────────────────────
const getHeatColor = (val: number, max: number) => {
  const pct = val / max;
  if (pct >= 0.75) return { hex: "#ef4444", label: "Hot", badge: "bg-red-500/10 text-red-400 border-red-500/20", bar: "bg-red-500" };
  if (pct >= 0.5) return { hex: "#f97316", label: "Warm", badge: "bg-orange-400/10 text-orange-400 border-orange-400/20", bar: "bg-orange-400" };
  if (pct >= 0.25) return { hex: "#eab308", label: "Mild", badge: "bg-yellow-400/10 text-yellow-400 border-yellow-400/20", bar: "bg-yellow-400" };
  return { hex: "#06b6d4", label: "Low", badge: "bg-cyan-500/10 text-cyan-400 border-cyan-500/20", bar: "bg-cyan-500" };
};

// ── Heatmap layer ─────────────────────────────────────────────────────────────
function HeatLayer({ points, filter, max }: { points: LocationStat[]; filter: Filter; max: number }) {
  const map = useMap();
  const layerRef = useRef<L.LayerGroup | null>(null);

  useEffect(() => {
    if (layerRef.current) map.removeLayer(layerRef.current);
    const layer = L.layerGroup();

    points.forEach(p => {
      if (!p.lat || !p.lng) return;
      const value = filter === "found" ? p.found : filter === "lost" ? p.lost : p.total;
      if (value === 0) return;

      const pct = value / max;
      const color = getHeatColor(value, max);
      const radius = 20 + pct * 40;

      L.circleMarker([p.lat, p.lng], { radius: radius + 12, color: "transparent", fillColor: color.hex, fillOpacity: 0.07, weight: 0 }).addTo(layer);
      L.circleMarker([p.lat, p.lng], { radius, color: color.hex, fillColor: color.hex, fillOpacity: 0.3, weight: 2 })
        .bindPopup(`
          <div style="font-family:sans-serif;min-width:160px;padding:4px 0">
            <p style="font-weight:700;font-size:13px;margin:0 0 6px;color:#fff">${p.location}</p>
            <div style="display:flex;gap:12px;font-size:11px">
              <span style="color:#22d3ee">Found: <b>${p.found}</b></span>
              <span style="color:#f87171">Lost: <b>${p.lost}</b></span>
              <span style="color:#a3a3a3">Total: <b>${p.total}</b></span>
            </div>
          </div>
        `, { className: "custom-popup", maxWidth: 220 })
        .addTo(layer);
    });

    layer.addTo(map);
    layerRef.current = layer;
    return () => { map.removeLayer(layer); };
  }, [points, filter, max, map]);

  return null;
}

// ── Fly-to control ────────────────────────────────────────────────────────────
function FlyTo({ lat, lng }: { lat: number; lng: number }) {
  const map = useMap();
  useEffect(() => { map.flyTo([lat, lng], 19, { duration: 1.2 }); }, [lat, lng, map]);
  return null;
}

// ── Transit corridor polylines ────────────────────────────────────────────────
function CorridorLayer({ corridors }: { corridors: typeof CORRIDORS }) {
  return (
    <>
      {corridors.map((c, i) => (
        <Polyline key={i} positions={c.path} pathOptions={{ color: "#f97316", weight: 3, opacity: 0.75, dashArray: "8 6" }} />
      ))}
    </>
  );
}

// ── AI Predictor Card ─────────────────────────────────────────────────────────
function AiPredictorCard({ locationStats }: { locationStats: LocationStat[] }) {
  const locationNames = useMemo(() => locationStats.map(l => l.location).slice(0, 20), [locationStats]);
  const categories = ["All Categories", "Electronics", "ID/Cards", "Bag/Backpack", "Clothing", "Keys", "Books", "Jewelry", "Other"];

  const [selLoc, setSelLoc] = useState(locationNames[0] || "");
  const [selTime, setSelTime] = useState(2);
  const [selCat, setSelCat] = useState("All Categories");
  const [expanded, setExpanded] = useState(true);

  const prediction = useMemo(() => {
    const locStat = locationStats.find(l => l.location === selLoc);
    if (!locStat) return null;

    const maxTotal = Math.max(...locationStats.map(l => l.total), 1);
    const freqScore = locStat.total / maxTotal;
    const slot = TIME_SLOTS[selTime];
    const isPeak = slot.from >= 10 && slot.to <= 16;
    const isHighPeak = slot.from >= 12 && slot.to <= 14;
    const timeMultiplier = isHighPeak ? 1.3 : isPeak ? 1.1 : 0.7;
    const catMultiplier = selCat === "ID/Cards" ? 1.2 : selCat === "Electronics" ? 1.15 : 1.0;
    const probability = Math.round(Math.min(freqScore * timeMultiplier * catMultiplier, 1) * 100);

    const riskLevel = probability >= 70 ? "High Risk" : probability >= 40 ? "Moderate Risk" : "Low Risk";
    const riskColor = probability >= 70 ? "text-red-400" : probability >= 40 ? "text-orange-400" : "text-emerald-400";
    const riskBg = probability >= 70 ? "bg-red-500/10 border-red-500/20" : probability >= 40 ? "bg-orange-400/10 border-orange-400/20" : "bg-emerald-500/10 border-emerald-500/20";
    const barColor = probability >= 70 ? "bg-red-500" : probability >= 40 ? "bg-orange-400" : "bg-emerald-400";

    const recommendations: string[] = [];
    if (probability >= 70) {
      recommendations.push(`Increase patrol presence at ${selLoc} during ${slot.label}`);
      recommendations.push("Consider adding a reminder announcement for this time slot");
    } else if (probability >= 40) {
      recommendations.push(`Monitor ${selLoc} during ${slot.label}`);
      recommendations.push("Remind students to secure belongings in this area");
    } else {
      recommendations.push(`${selLoc} is relatively low-risk during ${slot.label}`);
      recommendations.push("Maintain standard monitoring protocols");
    }
    if (selCat !== "All Categories") recommendations.push(`Keep an eye out for ${selCat} items specifically`);

    return { probability, riskLevel, riskColor, riskBg, barColor, recommendations };
  }, [selLoc, selTime, selCat, locationStats]);

  return (
    <div className="bg-gray-900 border border-white/5 rounded-2xl overflow-hidden flex flex-col">
      {/* Header */}
      <button
        onClick={() => setExpanded(v => !v)}
        className="w-full flex items-center justify-between px-4 py-3 border-b border-white/5 hover:bg-white/[0.02] transition-colors shrink-0"
      >
        <div className="flex items-center gap-2">
          <div className="text-left">
            <p className="text-xs font-bold text-white">AI Sighting Predictor</p>
            <p className="text-[10px] text-gray-500">Loss probability estimator</p>
          </div>
        </div>
        <FaChevronDown size={11} className={`text-gray-500 transition-transform duration-200 ${expanded ? "rotate-180" : ""}`} />
      </button>

      {expanded && (
        <div className="p-4 space-y-3 overflow-y-auto flex-1 min-h-0">
          <div>
            <label className="text-[10px] text-gray-500 uppercase tracking-widest font-semibold mb-1 block">Location</label>
            <CustomSelect options={locationNames.map(loc => ({ value: loc, label: loc }))} value={selLoc} onChange={setSelLoc} placeholder="Select location…" />
          </div>

          <div>
            <label className="text-[10px] text-gray-500 uppercase tracking-widest font-semibold mb-1 block">Time of Day</label>
            <div className="grid grid-cols-3 gap-1">
              {TIME_SLOTS.map((slot, i) => (
                <button key={i} onClick={() => setSelTime(i)}
                  className={`px-2 py-1.5 rounded-lg text-[10px] font-semibold transition-all ${selTime === i ? "bg-violet-500/15 text-violet-300 border border-violet-500/30" : "bg-gray-800/60 text-gray-500 border border-white/5 hover:text-gray-300"
                    }`}>
                  {slot.label}
                </button>
              ))}
            </div>
          </div>

          <div>
            <label className="text-[10px] text-gray-500 uppercase tracking-widest font-semibold mb-1 block">Category</label>
            <CustomSelect options={categories.map(c => ({ value: c, label: c }))} value={selCat} onChange={setSelCat} placeholder="Select category…" />
          </div>

          {prediction && (
            <div className={`rounded-xl border p-3 space-y-2.5 ${prediction.riskBg}`}>
              <div className="flex items-center justify-between">
                <span className={`text-xs font-bold ${prediction.riskColor} flex items-center gap-1.5`}>
                  <FaFire size={10} /> {prediction.riskLevel}
                </span>
                <span className={`text-xl font-black ${prediction.riskColor}`}>{prediction.probability}%</span>
              </div>
              <div className="w-full bg-gray-800 rounded-full h-2 overflow-hidden">
                <div className={`h-2 rounded-full transition-all duration-700 ${prediction.barColor}`} style={{ width: `${prediction.probability}%` }} />
              </div>
              <p className="text-[10px] text-gray-400">
                Estimated loss/sighting probability at <span className="text-white font-semibold">{selLoc}</span> during <span className="text-white font-semibold">{TIME_SLOTS[selTime].label}</span>
              </p>
              <div className="border-t border-white/10 pt-2 space-y-1">
                <p className="text-[9px] text-gray-500 uppercase tracking-widest font-semibold">Recommendations</p>
                {prediction.recommendations.map((r, i) => (
                  <div key={i} className="flex items-start gap-1.5">
                    <span className={`shrink-0 mt-0.5 ${prediction.riskColor}`}>•</span>
                    <p className="text-[10px] text-gray-400 leading-snug">{r}</p>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}

// ── Main component ────────────────────────────────────────────────────────────
const HeatmapPage = () => {
  const { data, isLoading } = useGetHeatmapStatsQuery(undefined);
  const [filter, setFilter] = useState<Filter>("all");
  const [search, setSearch] = useState("");
  const [viewMode, setViewMode] = useState<ViewMode>("list");
  const [focusPoint, setFocusPoint] = useState<{ lat: number; lng: number } | null>(null);
  const [timeSlot, setTimeSlot] = useState<number | null>(null);
  const [playing, setPlaying] = useState(false);
  const [showCorridors, setShowCorridors] = useState(false);
  const playRef = useRef<ReturnType<typeof setInterval> | null>(null);

  const allLocations: LocationStat[] = useMemo(() => {
    const rawLocations: Array<{ location: string; found: number; lost: number; total: number }> = (data as any)?.data?.locations ?? [];
    return rawLocations.map(r => {
      const coords = getCoordinates(r.location);
      return { ...r, lat: coords?.[0], lng: coords?.[1] };
    });
  }, [data]);

  const allItems: HeatItem[] = useMemo(() => (data as any)?.data?.items ?? [], [data]);

  const timeFilteredLocations = useMemo(() => {
    if (timeSlot === null) return allLocations;
    const slot = TIME_SLOTS[timeSlot];
    const filtered = allItems.filter(item => {
      const hour = new Date(item.date).getHours();
      return hour >= slot.from && hour < slot.to;
    });
    const counts: Record<string, { found: number; lost: number; total: number }> = {};
    for (const item of filtered) {
      const loc = item.location;
      if (!counts[loc]) counts[loc] = { found: 0, lost: 0, total: 0 };
      if (item.type === "found") counts[loc].found++;
      else counts[loc].lost++;
      counts[loc].total++;
    }
    return allLocations.map(l => ({ ...l, ...(counts[l.location] ?? { found: 0, lost: 0, total: 0 }) }));
  }, [timeSlot, allItems, allLocations]);

  const filtered = useMemo(() =>
    timeFilteredLocations
      .filter(r => r.location.toLowerCase().includes(search.toLowerCase()))
      .filter(r => { if (filter === "found") return r.found > 0; if (filter === "lost") return r.lost > 0; return true; }),
    [timeFilteredLocations, search, filter]
  );

  const mappable = useMemo(() => filtered.filter(r => r.lat && r.lng), [filtered]);
  const unmapped = useMemo(() => filtered.filter(r => !r.lat || !r.lng), [filtered]);
  const maxTotal = useMemo(() => Math.max(...filtered.map(r => r.total), 1), [filtered]);
  const maxFilter = useMemo(() =>
    Math.max(...filtered.map(r => filter === "found" ? r.found : filter === "lost" ? r.lost : r.total), 1),
    [filtered, filter]
  );
  const totals = useMemo(() =>
    allLocations.reduce((acc, r) => ({ found: acc.found + r.found, lost: acc.lost + r.lost, total: acc.total + r.total }), { found: 0, lost: 0, total: 0 }),
    [allLocations]
  );

  useEffect(() => {
    if (playing) {
      playRef.current = setInterval(() => {
        setTimeSlot(prev => prev === null ? 0 : (prev + 1) % TIME_SLOTS.length);
      }, 1800);
    } else {
      if (playRef.current) clearInterval(playRef.current);
    }
    return () => { if (playRef.current) clearInterval(playRef.current); };
  }, [playing]);

  if (isLoading) return (
    <div className="space-y-4 sm:space-y-6 max-w-7xl mx-auto animate-pulse">
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 sm:gap-4">
        {[1, 2, 3].map(i => <div key={i} className="h-24 bg-gray-800/60 rounded-2xl" />)}
      </div>
      <div className="h-[520px] bg-gray-800/60 rounded-2xl" />
    </div>
  );

  return (
    <div className="space-y-4 sm:space-y-6 max-w-7xl mx-auto">

      <style>{`
        .custom-popup .leaflet-popup-content-wrapper { background: #18181b; border: 1px solid rgba(255,255,255,0.1); border-radius: 12px; box-shadow: 0 20px 60px rgba(0,0,0,0.5); }
        .custom-popup .leaflet-popup-tip { background: #18181b; }
        .custom-popup .leaflet-popup-content { margin: 12px 14px; }
        .leaflet-container { background: #0f172a; }
      `}</style>

      {/* ── Stats ── */}
      <div className="grid grid-cols-3 gap-2 sm:gap-4">
        {[
          { label: "Total Reports", value: totals.total, icon: <FaClipboardList size={12} className="text-cyan-400" />, accent: "bg-cyan-500/10", sub: "all locations", subColor: "text-gray-500" },
          { label: "Total Found", value: totals.found, icon: <FaCheckCircle size={12} className="text-emerald-400" />, accent: "bg-emerald-500/10", sub: "mapped locations", subColor: "text-emerald-400" },
          { label: "Total Lost", value: totals.lost, icon: <FaExclamationTriangle size={12} className="text-red-400" />, accent: "bg-red-500/10", sub: "reported hotspots", subColor: "text-red-400" },
        ].map(s => (
          <div key={s.label} className="relative bg-gray-900 border border-white/5 rounded-2xl p-3 sm:p-5 flex flex-col items-start gap-4 overflow-hidden min-h-[130px] sm:min-h-[160px]">
            <div className={`w-8 h-8 rounded-full flex items-center justify-center ${s.accent} shrink-0`}>{s.icon}</div>
            <div className="flex flex-col gap-1.5 w-full">
              <p className="text-xl sm:text-2xl font-bold text-white tracking-tight leading-none">{s.value}</p>
              <div className="space-y-1">
                <p className="text-gray-500 text-[10px] sm:text-xs font-semibold leading-tight">{s.label}</p>
                <p className={`text-[9px] sm:text-[10px] font-bold ${s.subColor} leading-tight uppercase tracking-wider`}>{s.sub}</p>
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* ── Controls ── */}
      <div className="flex flex-col space-y-3">
        <div className="flex flex-col sm:flex-row items-start sm:items-center gap-3">
          <div className="relative w-full sm:flex-grow">
            <FaSearch size={12} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-500" />
            <input value={search} onChange={e => setSearch(e.target.value)} placeholder="Explore locations..."
              className="w-full bg-gray-900 border border-white/5 rounded-xl pl-9 pr-4 py-2.5 text-sm text-white placeholder-gray-600 focus:border-cyan-500/40 focus:outline-none transition-colors" />
          </div>
          <div className="flex items-center gap-2 w-full sm:w-auto sm:ml-auto">
            <div className="flex gap-1 bg-gray-900 border border-white/5 rounded-xl p-1 flex-1 sm:flex-none">
              {(["all", "found", "lost"] as Filter[]).map(f => (
                <button key={f} onClick={() => setFilter(f)}
                  className={`px-3 sm:px-4 py-1.5 rounded-lg text-xs font-medium capitalize transition-all ${filter === f ? "bg-cyan-500/10 text-cyan-400" : "text-gray-500 hover:text-white"}`}>
                  {f}
                </button>
              ))}
            </div>
            <div className="flex gap-1 bg-gray-900 border border-white/5 rounded-xl p-1 flex-1 sm:flex-none justify-end">
              <button onClick={() => setViewMode("list")}
                className={`flex-1 justify-center px-3 py-1.5 rounded-lg text-xs font-medium transition-all flex items-center gap-1.5 ${viewMode === "list" ? "bg-cyan-500/10 text-cyan-400" : "text-gray-500 hover:text-white"}`}>
                <FaList size={10} /> List
              </button>
              <button onClick={() => setViewMode("map")}
                className={`flex-1 justify-center px-3 py-1.5 rounded-lg text-xs font-medium transition-all flex items-center gap-1.5 ${viewMode === "map" ? "bg-cyan-500/10 text-cyan-400" : "text-gray-500 hover:text-white"}`}>
                <FaMap size={10} /> Map
              </button>
            </div>
          </div>
        </div>

        {/* ── Timeline ── */}
        <div className="bg-gray-900 border border-white/5 rounded-2xl px-4 py-3 space-y-2">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <span className="text-[10px] uppercase tracking-widest font-semibold text-gray-500">Timeline Filter</span>
            </div>
            <div className="flex items-center gap-2">
              <button onClick={() => setShowCorridors(v => !v)}
                className={`flex items-center gap-1.5 px-3 py-1 rounded-lg text-[10px] font-semibold transition-all border ${showCorridors ? "bg-orange-400/10 border-orange-400/20 text-orange-400" : "bg-gray-800 border-white/10 text-gray-500 hover:text-white"
                  }`}>
                <FaRoute size={9} /> Corridors
              </button>
              <button onClick={() => setPlaying(v => !v)}
                className={`flex items-center gap-1.5 px-3 py-1 rounded-lg text-[10px] font-semibold transition-all border ${playing ? "bg-cyan-500/10 border-cyan-500/20 text-cyan-400" : "bg-gray-800 border-white/10 text-gray-400 hover:text-white"
                  }`}>
                {playing ? <FaPause size={9} /> : <FaPlay size={9} />}
                {playing ? "Pause" : "Play"}
              </button>
              <button onClick={() => { setTimeSlot(null); setPlaying(false); }}
                className="text-[10px] text-gray-600 hover:text-gray-400 transition-colors px-2">
                Reset
              </button>
            </div>
          </div>
          <div className="flex gap-1 flex-wrap">
            <button onClick={() => { setTimeSlot(null); setPlaying(false); }}
              className={`px-3 py-1 rounded-lg text-[10px] font-semibold transition-all border ${timeSlot === null ? "bg-cyan-500/10 border-cyan-500/20 text-cyan-400" : "bg-gray-800 border-white/5 text-gray-500 hover:text-white"
                }`}>
              All Day
            </button>
            {TIME_SLOTS.map((slot, i) => (
              <button key={i} onClick={() => { setTimeSlot(i); setPlaying(false); }}
                className={`px-3 py-1 rounded-lg text-[10px] font-semibold transition-all border ${timeSlot === i ? "bg-cyan-500/10 border-cyan-500/20 text-cyan-400" : "bg-gray-800 border-white/5 text-gray-500 hover:text-white"
                  }`}>
                {slot.label}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* ── Map View ── */}
      {viewMode === "map" && (
        // CHANGED: outer grid uses items-stretch so both columns share the same height
        <div className="grid grid-cols-1 lg:grid-cols-[1fr_300px] gap-4 items-stretch">

          {/* Left column: map (fixed height) + locations card (stretches to fill remaining) */}
          {/* CHANGED: was "space-y-3" — now flex flex-col gap-3 so flex-1 works on the child */}
          <div className="flex flex-col gap-3">

            {/* Map — CHANGED: added flex-none to pin it at exactly 520px */}
            <div className="bg-gray-900 border border-white/5 rounded-2xl overflow-hidden flex-none" style={{ height: 520 }}>
              <MapContainer
                center={CAMPUS_CENTER}
                zoom={CAMPUS_ZOOM}
                style={{ height: "100%", width: "100%" }}
                zoomControl={false}
                attributionControl={false}
              >
                <ZoomControl position="bottomright" />
                <TileLayer
                  url="https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png"
                  attribution='&copy; <a href="https://carto.com/">CARTO</a>'
                  maxZoom={20}
                />
                <HeatLayer points={mappable} filter={filter} max={maxFilter} />
                {showCorridors && <CorridorLayer corridors={CORRIDORS} />}
                {focusPoint && <FlyTo lat={focusPoint.lat} lng={focusPoint.lng} />}
              </MapContainer>
            </div>

            {/* Locations card
                CHANGED: removed style={{ height: 250 }}
                CHANGED: added flex-1 so it stretches to fill remaining column height
                (the inner overflow-y-auto flex-1 min-h-0 handles scrolling inside) */}
            <div className="bg-gray-900 border border-white/5 rounded-2xl overflow-hidden flex flex-col flex-1">
              <div className="px-4 py-3 border-b border-white/5 flex items-center justify-between shrink-0">
                <div className="flex items-center gap-2">
                  <FaLayerGroup size={11} className="text-cyan-400" />
                  <p className="text-xs font-bold text-gray-300 uppercase tracking-widest">Locations</p>
                </div>
                <span className="text-[10px] text-gray-600">{mappable.length} mapped</span>
              </div>
              <div className="overflow-y-auto flex-1 min-h-0 p-4">
                {mappable.length === 0 ? (
                  <div className="py-10 text-center text-gray-600 text-sm">No locations found</div>
                ) : (
                  <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3">
                    {mappable.map(r => {
                      const heat = getHeatColor(r.total, maxTotal);
                      const value = filter === "found" ? r.found : filter === "lost" ? r.lost : r.total;
                      const pct = Math.round((value / maxFilter) * 100);
                      return (
                        <button key={r.location} onClick={() => setFocusPoint({ lat: r.lat!, lng: r.lng! })}
                          className="text-left p-3.5 bg-white/[0.02] border border-white/[0.04] rounded-xl hover:bg-white/[0.05] hover:border-white/[0.08] transition-all duration-200 group">
                          <div className="flex items-center justify-between mb-2">
                            <p className="text-white text-xs font-bold truncate group-hover:text-cyan-400 transition-colors">{r.location}</p>
                            <span className={`shrink-0 ml-2 px-1.5 py-0.5 rounded-full text-[8px] font-bold border ${heat.badge}`}>{heat.label}</span>
                          </div>
                          <div className="flex items-center gap-2 mb-2">
                            <div className="flex-1 bg-gray-800 rounded-full h-1 overflow-hidden">
                              <div className={`h-1 rounded-full ${heat.bar} transition-all duration-500`} style={{ width: `${pct}%` }} />
                            </div>
                            <span className="text-gray-600 text-[9px] shrink-0">{pct}%</span>
                          </div>
                          <div className="flex gap-3 text-[9px]">
                            <span className="text-cyan-400 font-medium">F: {r.found}</span>
                            <span className="text-red-400 font-medium">L: {r.lost}</span>
                            <span className="text-gray-500 font-medium">Total: {r.total}</span>
                          </div>
                        </button>
                      );
                    })}
                  </div>
                )}
                {unmapped.length > 0 && (
                  <div className="mt-4 pt-4 border-t border-white/5">
                    <p className="text-gray-600 text-[10px] uppercase tracking-widest mb-2 font-semibold">Unmapped ({unmapped.length})</p>
                    <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3">
                      {unmapped.map(r => (
                        <div key={r.location} className="flex items-center justify-between p-3.5 bg-white/[0.01] border border-white/[0.02] rounded-xl">
                          <p className="text-gray-500 text-xs font-semibold truncate">{r.location}</p>
                          <span className="text-gray-600 text-[10px] ml-2 font-mono font-bold bg-white/5 px-2 py-0.5 rounded-md">{r.total}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Sidebar — CHANGED: was "space-y-3", now flex flex-col gap-3 so AI card can use flex-1 */}
          <div className="flex flex-col gap-3">

            {/* Corridor legend */}
            {showCorridors && (
              <div className="bg-gray-900 border border-white/5 rounded-2xl overflow-hidden flex flex-col shrink-0">
                <div className="px-4 py-3 border-b border-white/5 flex items-center shrink-0">
                  <div className="flex items-center gap-2">
                    <FaRoute size={11} className="text-orange-400" />
                    <p className="text-xs font-bold text-gray-300 uppercase tracking-widest">High-Risk Corridors</p>
                  </div>
                </div>
                <div className="p-4 flex flex-col gap-2.5">
                  {CORRIDORS.map((c, i) => (
                    <div key={i} className="flex items-center gap-2">
                      <div className="w-6 h-0.5 bg-orange-400 rounded-full shrink-0"
                        style={{ backgroundImage: "repeating-linear-gradient(90deg, #f97316 0, #f97316 4px, transparent 4px, transparent 8px)" }} />
                      <span className="text-gray-400 text-xs font-medium">{c.name}</span>
                    </div>
                  ))}
                  <p className="text-gray-600 text-[9px] mt-1 leading-relaxed">Transit paths with historically high item loss rates</p>
                </div>
              </div>
            )}

            {/* AI Predictor — CHANGED: added flex-1 so it stretches to match the left column height */}
            <div className="flex-1 flex flex-col min-h-0">
              <AiPredictorCard locationStats={allLocations} />
            </div>
          </div>
        </div>
      )}

      {/* ── List View ── */}
      {viewMode === "list" && (
        <div className="grid grid-cols-1 lg:grid-cols-[1fr_300px] gap-4 items-stretch">
          <div className="bg-gray-900 border border-white/5 rounded-2xl overflow-hidden">
            <div className="hidden sm:grid grid-cols-12 gap-4 px-5 py-3 border-b border-white/5 text-[11px] uppercase tracking-widest text-gray-600 font-medium">
              <div className="col-span-1 text-center">#</div>
              <div className="col-span-4">Location</div>
              <div className="col-span-3">Frequency</div>
              <div className="col-span-1 text-center">Found</div>
              <div className="col-span-1 text-center">Lost</div>
              <div className="col-span-1 text-center">Heat</div>
              <div className="col-span-1 text-center">View</div>
            </div>
            {filtered.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-20 text-gray-600">
                <FaMapMarkedAlt size={28} className="mb-3 opacity-40" />
                <p className="text-sm">No locations found</p>
              </div>
            ) : (
              <div className="divide-y divide-white/5">
                {filtered.map((row, idx) => {
                  const heat = getHeatColor(row.total, maxTotal);
                  const pct = Math.round((row.total / maxTotal) * 100);
                  const hasPt = !!(row.lat && row.lng);
                  return (
                    <div key={row.location} className="flex flex-col sm:grid sm:grid-cols-12 gap-3 sm:gap-4 items-start sm:items-center px-4 sm:px-5 py-4 hover:bg-white/[0.02] transition-colors group relative">
                      <div className="hidden sm:block col-span-1 text-center">
                        {idx === 0
                          ? <span className="text-gray-400 text-sm font-bold font-mono">#1</span>
                          : <span className="text-gray-600 text-sm font-mono">{idx + 1}</span>}
                      </div>
                      <div className="col-span-12 sm:col-span-4 w-full">
                        <div className="flex items-center justify-between sm:block">
                          <p className="text-white text-sm font-medium truncate group-hover:text-cyan-400 transition-colors">{row.location}</p>
                          <span className={`sm:hidden px-2 py-0.5 rounded-full text-[9px] font-bold border ${heat.badge}`}>{heat.label}</span>
                        </div>
                        <p className="text-gray-600 text-[11px] mt-0.5">{row.total} report{row.total !== 1 ? "s" : ""}</p>
                      </div>
                      <div className="col-span-12 sm:col-span-3 flex items-center gap-2 w-full">
                        <div className="flex-1 bg-gray-800 rounded-full h-1.5 sm:h-2 overflow-hidden">
                          <div className={`h-full rounded-full transition-all duration-700 ${heat.bar}`} style={{ width: `${pct}%` }} />
                        </div>
                        <span className="text-gray-500 text-[10px] sm:text-[11px] w-8 text-right shrink-0">{pct}%</span>
                      </div>
                      <div className="col-span-12 sm:col-span-2 flex sm:contents gap-4 w-full sm:w-auto">
                        <div className="flex-1 sm:col-span-1 sm:text-center">
                          <p className="sm:hidden text-[9px] text-gray-600 uppercase mb-1">Found</p>
                          {row.found > 0
                            ? <span className="inline-flex items-center gap-1 text-emerald-400 text-xs font-semibold"><FaCheckCircle size={9} /> {row.found}</span>
                            : <span className="text-gray-700 text-xs">—</span>}
                        </div>
                        <div className="flex-1 sm:col-span-1 sm:text-center">
                          <p className="sm:hidden text-[9px] text-gray-600 uppercase mb-1">Lost</p>
                          {row.lost > 0
                            ? <span className="inline-flex items-center gap-1 text-red-400 text-xs font-semibold"><FaExclamationTriangle size={9} /> {row.lost}</span>
                            : <span className="text-gray-700 text-xs">—</span>}
                        </div>
                      </div>
                      <div className="hidden sm:block col-span-1 text-center">
                        <span className={`inline-block px-2 py-0.5 rounded-full text-[10px] font-medium border ${heat.badge}`}>{heat.label}</span>
                      </div>
                      <div className="col-span-12 sm:col-span-1 w-full sm:text-center">
                        {hasPt ? (
                          <button onClick={() => { setViewMode("map"); setFocusPoint({ lat: row.lat!, lng: row.lng! }); }}
                            className="w-full sm:w-auto text-[10px] bg-cyan-500/10 sm:bg-transparent py-2 sm:py-0 rounded-lg text-cyan-400 hover:text-cyan-300 transition-colors uppercase sm:capitalize font-bold sm:font-normal flex items-center justify-center gap-1">
                            <FaEye size={9} /> View
                          </button>
                        ) : (
                          <span className="text-gray-700 text-[10px]">—</span>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
          <div>
            <AiPredictorCard locationStats={allLocations} />
          </div>
        </div>
      )}

      {/* ── Legend ── */}
      <div className="flex flex-wrap gap-3 justify-between items-center">
        <div className="flex items-center gap-2 text-[11px] text-gray-500">
          <FaThermometerHalf size={11} className="text-gray-400" />
          <span>Circle size and color indicate report frequency</span>
        </div>
        <div className="flex flex-wrap gap-3">
          {[
            { label: "Hot (≥75%)", bar: "bg-red-500" },
            { label: "Warm (≥50%)", bar: "bg-orange-400" },
            { label: "Mild (≥25%)", bar: "bg-yellow-400" },
            { label: "Low (<25%)", bar: "bg-cyan-500" },
          ].map(l => (
            <div key={l.label} className="flex items-center gap-2 text-[11px] text-gray-500">
              <div className={`w-3 h-3 rounded-full ${l.bar}`} /> {l.label}
            </div>
          ))}
        </div>
      </div>

    </div>
  );
};

export default HeatmapPage;