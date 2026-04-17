import { useState, useEffect, useRef } from "react";
import { MapContainer, TileLayer, useMap, ZoomControl } from "react-leaflet";
import { useGetLocationStatsQuery } from "../../redux/api/api";
import {
  FaMapMarkedAlt, FaSearch, FaExclamationTriangle,
  FaCheckCircle, FaLayerGroup, FaThermometerHalf, FaList, FaMap,
} from "react-icons/fa";
import { getCoordinates, CAMPUS_CENTER, CAMPUS_ZOOM } from "../../utils/campusLocations";
import "leaflet/dist/leaflet.css";
import L from "leaflet";

// Fix Leaflet default icon issue with bundlers
delete (L.Icon.Default.prototype as unknown as { _getIconUrl?: string })._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: "https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-icon-2x.png",
  iconUrl:       "https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-icon.png",
  shadowUrl:     "https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-shadow.png",
});

type Filter = "all" | "found" | "lost";
type ViewMode = "map" | "list";

interface LocationStat {
  location: string;
  found:    number;
  lost:     number;
  total:    number;
  lat?:     number;
  lng?:     number;
}

// ── Heat color helpers ────────────────────────────────────────────────────────
const getHeatColor = (val: number, max: number) => {
  const pct = val / max;
  if (pct >= 0.75) return { hex: "#ef4444", label: "Hot",  badge: "bg-red-500/10 text-red-400 border-red-500/20",          bar: "bg-red-500"    };
  if (pct >= 0.5)  return { hex: "#f97316", label: "Warm", badge: "bg-orange-400/10 text-orange-400 border-orange-400/20", bar: "bg-orange-400" };
  if (pct >= 0.25) return { hex: "#eab308", label: "Mild", badge: "bg-yellow-400/10 text-yellow-400 border-yellow-400/20", bar: "bg-yellow-400" };
  return               { hex: "#06b6d4", label: "Low",  badge: "bg-cyan-500/10 text-cyan-400 border-cyan-500/20",         bar: "bg-cyan-500"   };
};

// ── Heatmap layer using canvas circles ───────────────────────────────────────
function HeatLayer({ points, filter, max }: {
  points: LocationStat[];
  filter: Filter;
  max:    number;
}) {
  const map = useMap();
  const layerRef = useRef<L.LayerGroup | null>(null);

  useEffect(() => {
    if (layerRef.current) map.removeLayer(layerRef.current);
    const layer = L.layerGroup();

    points.forEach(p => {
      if (!p.lat || !p.lng) return;
      const value = filter === "found" ? p.found : filter === "lost" ? p.lost : p.total;
      if (value === 0) return;

      const pct    = value / max;
      const color  = getHeatColor(value, max);
      const radius = 20 + pct * 40;

      // Outer glow
      L.circleMarker([p.lat, p.lng], {
        radius:      radius + 10,
        color:       "transparent",
        fillColor:   color.hex,
        fillOpacity: 0.08,
        weight:      0,
      }).addTo(layer);

      // Main circle
      L.circleMarker([p.lat, p.lng], {
        radius,
        color:       color.hex,
        fillColor:   color.hex,
        fillOpacity: 0.35,
        weight:      1.5,
      })
        .bindPopup(`
          <div style="font-family:sans-serif;min-width:160px;padding:4px 0">
            <p style="font-weight:700;font-size:13px;margin:0 0 6px;color:#fff">${p.location}</p>
            <div style="display:flex;gap:12px;font-size:11px">
              <span style="color:#22d3ee">Found: <b>${p.found}</b></span>
              <span style="color:#f87171">Lost: <b>${p.lost}</b></span>
              <span style="color:#a3a3a3">Total: <b>${p.total}</b></span>
            </div>
          </div>
        `, {
          className: "custom-popup",
          maxWidth:  220,
        })
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

// ── Main component ────────────────────────────────────────────────────────────
const HeatmapPage = () => {
  const { data, isLoading } = useGetLocationStatsQuery(undefined);
  const [filter, setFilter]   = useState<Filter>("all");
  const [search, setSearch]   = useState("");
  const [viewMode, setViewMode] = useState<ViewMode>("list");
  const [focusPoint, setFocusPoint] = useState<{ lat: number; lng: number } | null>(null);

  const stats = (data as any)?.data ?? [];

  const raw: LocationStat[] = stats.map((r: LocationStat) => {
    let location = r.location;
    const roomMatch = location.match(/(?:room|rm\.?)\s*(\d+)/i);
    if (roomMatch) {
      const num = parseInt(roomMatch[1], 10);
      if (num >= 201 && num <= 210) location = `SWDC Building - Room ${num}`;
      else if (num >= 301 && num <= 320) location = `Business Admin - Room ${num}`;
    }

    const coords = getCoordinates(r.location);
    return {
      ...r,
      location,
      lat: coords?.[0],
      lng: coords?.[1],
    };
  });

  const filtered = raw
    .filter(r => r.location.toLowerCase().includes(search.toLowerCase()))
    .filter(r => {
      if (filter === "found") return r.found > 0;
      if (filter === "lost")  return r.lost  > 0;
      return true;
    });

  const mappable  = filtered.filter(r => r.lat && r.lng);
  const unmapped  = filtered.filter(r => !r.lat || !r.lng);
  const maxTotal  = Math.max(...filtered.map(r => r.total), 1);
  const maxFilter = Math.max(...filtered.map(r =>
    filter === "found" ? r.found : filter === "lost" ? r.lost : r.total
  ), 1);

  const totals = raw.reduce(
    (acc, r) => ({ found: acc.found + r.found, lost: acc.lost + r.lost, total: acc.total + r.total }),
    { found: 0, lost: 0, total: 0 }
  );

  if (isLoading) return (
    <div className="space-y-4 sm:space-y-6 max-w-7xl mx-auto animate-pulse">
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 sm:gap-4">
        {[1,2,3].map(i => <div key={i} className="h-24 bg-gray-800/60 rounded-2xl" />)}
      </div>
      <div className="h-[520px] bg-gray-800/60 rounded-2xl" />
    </div>
  );

  return (
    <div className="space-y-4 sm:space-y-6 max-w-7xl mx-auto">

      {/* Custom popup styles */}
      <style>{`
        .custom-popup .leaflet-popup-content-wrapper {
          background: #18181b;
          border: 1px solid rgba(255,255,255,0.1);
          border-radius: 12px;
          box-shadow: 0 20px 60px rgba(0,0,0,0.5);
        }
        .custom-popup .leaflet-popup-tip { background: #18181b; }
        .custom-popup .leaflet-popup-content { margin: 12px 14px; }
        .leaflet-container { background: #0f172a; }
      `}</style>

      {/* ── Stats ── */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 sm:gap-4">
        {[
          { label: "Total Reports", value: totals.total, color: "text-cyan-400",    bg: "bg-cyan-500/10 border-cyan-500/20"      },
          { label: "Found Items",   value: totals.found, color: "text-emerald-400", bg: "bg-cyan-500/10 border-cyan-500/20" },
          { label: "Lost Items",    value: totals.lost,  color: "text-red-400",     bg: "bg-cyan-500/10 border-cyan-500/20"         },
        ].map(s => (
          <div key={s.label} className={`rounded-2xl border p-4 flex flex-col gap-1 ${s.bg} bg-gray-900`}>
            <p className={`text-2xl sm:text-3xl font-bold ${s.color}`}>{s.value}</p>
            <p className="text-gray-500 text-xs font-medium">{s.label}</p>
          </div>
        ))}
      </div>

      {/* ── Controls ── */}
      <div className="flex flex-col space-y-3">
        <div className="flex flex-col sm:flex-row items-center gap-3">
          <div className="relative flex-grow">
            <FaSearch size={12} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-500" />
            <input value={search} onChange={e => setSearch(e.target.value)} placeholder="Explore locations..."
              className="w-full bg-gray-900 border border-white/5 rounded-xl pl-9 pr-4 py-2.5 text-sm text-white placeholder-gray-600 focus:border-cyan-500/40 focus:outline-none transition-colors" />
          </div>
          <div className="flex flex-wrap items-center gap-2 sm:ml-auto">
            {/* Filter */}
            <div className="flex gap-1 bg-gray-900 border border-white/5 rounded-xl p-1 shrink-0">
              {(["all", "found", "lost"] as Filter[]).map(f => (
                <button key={f} onClick={() => setFilter(f)}
                  className={`px-3 sm:px-4 py-1.5 rounded-lg text-xs font-medium capitalize transition-all ${
                    filter === f ? "bg-cyan-500/10 text-cyan-400" : "text-gray-500 hover:text-white"
                  }`}>
                  {f}
                </button>
              ))}
            </div>
            {/* View toggle */}
            <div className="flex gap-1 bg-gray-900 border border-white/5 rounded-xl p-1 shrink-0">
              <button onClick={() => setViewMode("map")}
                className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-all flex items-center gap-1.5 ${viewMode === "map" ? "bg-cyan-500/10 text-cyan-400" : "text-gray-500 hover:text-white"}`}>
                <FaMap size={10} /> Map
              </button>
              <button onClick={() => setViewMode("list")}
                className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-all flex items-center gap-1.5 ${viewMode === "list" ? "bg-cyan-500/10 text-cyan-400" : "text-gray-500 hover:text-white"}`}>
                <FaList size={10} /> List
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* ── Map View ── */}
      {viewMode === "map" && (
        <div className="grid grid-cols-1 lg:grid-cols-[1fr_280px] gap-4 items-start">

          {/* Map */}
          <div className="bg-gray-900 border border-white/5 rounded-2xl overflow-hidden" style={{ height: 520 }}>
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
              {focusPoint && <FlyTo lat={focusPoint.lat} lng={focusPoint.lng} />}
            </MapContainer>
          </div>

          {/* Location sidebar */}
          <div className="bg-gray-900 border border-white/5 rounded-2xl overflow-hidden">
            <div className="px-4 py-3 border-b border-white/5 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <FaLayerGroup size={11} className="text-cyan-400" />
                <p className="text-xs font-bold text-gray-300 uppercase tracking-widest">Locations</p>
              </div>
              <span className="text-[10px] text-gray-600">{mappable.length} mapped</span>
            </div>
            <div className="overflow-y-auto" style={{ maxHeight: 460 }}>
              {mappable.length === 0 ? (
                <div className="py-10 text-center text-gray-600 text-sm">No locations found</div>
              ) : mappable.map(r => {
                const heat  = getHeatColor(r.total, maxTotal);
                const value = filter === "found" ? r.found : filter === "lost" ? r.lost : r.total;
                const pct   = Math.round((value / maxFilter) * 100);
                return (
                  <button key={r.location} onClick={() => setFocusPoint({ lat: r.lat!, lng: r.lng! })}
                    className="w-full text-left px-4 py-3 border-b border-white/[0.04] hover:bg-white/[0.03] transition-colors group">
                    <div className="flex items-center justify-between mb-1.5">
                      <p className="text-white text-xs font-semibold truncate group-hover:text-cyan-400 transition-colors">{r.location}</p>
                      <span className={`shrink-0 ml-2 px-1.5 py-0.5 rounded-full text-[9px] font-bold border ${heat.badge}`}>{heat.label}</span>
                    </div>
                    <div className="flex items-center gap-2 mb-1.5">
                      <div className="flex-1 bg-gray-800 rounded-full h-1 overflow-hidden">
                        <div className={`h-1 rounded-full ${heat.bar} transition-all duration-500`} style={{ width: `${pct}%` }} />
                      </div>
                      <span className="text-gray-600 text-[10px] shrink-0 w-7 text-right">{pct}%</span>
                    </div>
                    <div className="flex gap-3 text-[10px]">
                      <span className="text-cyan-400">F: {r.found}</span>
                      <span className="text-red-400">L: {r.lost}</span>
                      <span className="text-gray-500">Total: {r.total}</span>
                    </div>
                  </button>
                );
              })}
              {unmapped.length > 0 && (
                <div className="px-4 py-3 border-t border-white/5">
                  <p className="text-gray-600 text-[10px] uppercase tracking-widest mb-2">Unmapped ({unmapped.length})</p>
                  {unmapped.map(r => (
                    <div key={r.location} className="flex items-center justify-between py-1.5">
                      <p className="text-gray-500 text-xs truncate">{r.location}</p>
                      <span className="text-gray-600 text-[10px] ml-2">{r.total}</span>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* ── List View ── */}
      {viewMode === "list" && (
        <div className="bg-gray-900 border border-white/5 rounded-2xl overflow-hidden">
          <div className="hidden sm:grid grid-cols-12 gap-4 px-5 py-3 border-b border-white/5 text-[11px] uppercase tracking-widest text-gray-600 font-medium">
            <div className="col-span-1 text-center">#</div>
            <div className="col-span-4">Location</div>
            <div className="col-span-3">Frequency</div>
            <div className="col-span-1 text-center">Found</div>
            <div className="col-span-1 text-center">Lost</div>
            <div className="col-span-1 text-center">Heat</div>
            <div className="col-span-1 text-center">On Map</div>
          </div>
          {filtered.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-20 text-gray-600">
              <FaMapMarkedAlt size={28} className="mb-3 opacity-40" />
              <p className="text-sm">No locations found</p>
            </div>
          ) : (
            <div className="divide-y divide-white/5">
              {filtered.map((row, idx) => {
                const heat  = getHeatColor(row.total, maxTotal);
                const pct   = Math.round((row.total / maxTotal) * 100);
                const hasPt = !!(row.lat && row.lng);
                return (
                  <div key={row.location} className="flex flex-col sm:grid sm:grid-cols-12 gap-3 sm:gap-4 items-start sm:items-center px-4 sm:px-5 py-4 hover:bg-white/[0.02] transition-colors group relative">
                    {/* Index - hidden on mobile */}
                    <div className="hidden sm:block col-span-1 text-center">
                      {idx === 0
                        ? <span className="text-gray-400 text-sm font-bold font-mono">#1</span>
                        : <span className="text-gray-600 text-sm font-mono">{idx + 1}</span>}
                    </div>

                    {/* Location Info */}
                    <div className="col-span-12 sm:col-span-4 w-full">
                      <div className="flex items-center justify-between sm:block">
                        <p className="text-white text-sm font-medium truncate group-hover:text-cyan-400 transition-colors">{row.location}</p>
                        <span className={`sm:hidden px-2 py-0.5 rounded-full text-[9px] font-bold border ${heat.badge}`}>{heat.label}</span>
                      </div>
                      <p className="text-gray-600 text-[11px] mt-0.5">{row.total} report{row.total !== 1 ? "s" : ""}</p>
                    </div>

                    {/* Frequency Bar - Simplified on mobile */}
                    <div className="col-span-12 sm:col-span-3 flex items-center gap-2 w-full">
                      <div className="flex-1 bg-gray-800 rounded-full h-1.5 sm:h-2 overflow-hidden">
                        <div className={`h-full rounded-full transition-all duration-700 ${heat.bar}`} style={{ width: `${pct}%` }} />
                      </div>
                      <span className="text-gray-500 text-[10px] sm:text-[11px] w-8 text-right shrink-0">{pct}%</span>
                    </div>

                    {/* Statistics - Stacked on mobile */}
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

                    {/* Heat Badge - Desktop only */}
                    <div className="hidden sm:block col-span-1 text-center">
                      <span className={`inline-block px-2 py-0.5 rounded-full text-[10px] font-medium border ${heat.badge}`}>{heat.label}</span>
                    </div>

                    {/* Action */}
                    <div className="col-span-12 sm:col-span-1 w-full sm:text-center">
                      {hasPt ? (
                        <button onClick={() => { setViewMode("map"); setFocusPoint({ lat: row.lat!, lng: row.lng! }); }}
                          className="w-full sm:w-auto text-[10px] bg-cyan-500/10 sm:bg-transparent py-2 sm:py-0 rounded-lg text-cyan-400 hover:text-cyan-300 transition-colors uppercase sm:capitalize font-bold sm:font-normal">
                          View
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
      )}

      {/* ── Legend ── */}
      <div className="flex flex-wrap gap-3 justify-between items-center">
        <div className="flex items-center gap-2 text-[11px] text-gray-500">
          <FaThermometerHalf size={11} className="text-gray-400" />
          <span>Circle size and color indicate report frequency</span>
        </div>
        <div className="flex flex-wrap gap-3">
          {[
            { label: "Hot (≥75%)",  bar: "bg-red-500"    },
            { label: "Warm (≥50%)", bar: "bg-orange-400" },
            { label: "Mild (≥25%)", bar: "bg-yellow-400" },
            { label: "Low (<25%)",  bar: "bg-cyan-500"   },
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
