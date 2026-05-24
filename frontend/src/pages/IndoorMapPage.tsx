import { useState, useMemo, useEffect, useRef } from "react";
import { useNavigate } from "react-router-dom";
import { MapContainer, TileLayer, useMap, ZoomControl } from "react-leaflet";
import L from "leaflet";
import "leaflet/dist/leaflet.css";
import {
  FaInfoCircle,
  FaBuilding,
  FaTimes,
  FaMap,
  FaLayerGroup
} from "react-icons/fa";
import { useGetFoundItemsQuery, useGetLostItemsQuery, useGetLocationStatsQuery } from "../redux/api/api";
import { getCoordinates, CAMPUS_CENTER, CAMPUS_ZOOM } from "../utils/campusLocations";
import IndoorMap3D from "./IndoorMap3D";

// Fix Leaflet default icon issue
delete (L.Icon.Default.prototype as unknown as { _getIconUrl?: string })._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: "https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-icon-2x.png",
  iconUrl:       "https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-icon.png",
  shadowUrl:     "https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-shadow.png",
});

type Filter = "all" | "found" | "lost";

interface LocationStat {
  location: string;
  found:    number;
  lost:     number;
  total:    number;
  lat?:     number;
  lng?:     number;
}

interface AggregatedLocation {
  lat: number;
  lng: number;
  totalFound: number;
  totalLost: number;
  totalItems: number;
  rooms: {
    name: string;
    found: number;
    lost: number;
  }[];
}

const HEAT_SCALE = [
  { label: "High",    hex: "#1d4ed8", badge: "bg-blue-500/10 text-blue-300 border-blue-500/20", bar: "bg-blue-500", dot: "bg-blue-500" },
  { label: "Medium",  hex: "#3b82f6", badge: "bg-sky-500/10 text-sky-300 border-sky-500/20", bar: "bg-sky-500", dot: "bg-sky-500" },
  { label: "Low",     hex: "#60a5fa", badge: "bg-sky-400/10 text-sky-200 border-sky-400/20", bar: "bg-sky-400", dot: "bg-sky-400" },
  { label: "Minimal", hex: "#dbeafe", badge: "bg-sky-200/10 text-sky-200 border-sky-200/20", bar: "bg-sky-200", dot: "bg-sky-200" },
];

const getHeatColor = (val: number, max: number) => {
  const pct = val / max;
  if (pct >= 0.75) return HEAT_SCALE[0];
  if (pct >= 0.5)  return HEAT_SCALE[1];
  if (pct >= 0.25) return HEAT_SCALE[2];
  return HEAT_SCALE[3];
};

function HeatLayer({ points, filter, max }: {
  points: LocationStat[];
  filter: Filter;
  max:    number;
}) {
  const map = useMap();
  const layerRef = useRef<L.LayerGroup | null>(null);

  const aggregated = useMemo(() => {
    const groups: { [key: string]: AggregatedLocation } = {};
    points.forEach(p => {
      if (!p.lat || !p.lng) return;
      const key = `${p.lat.toFixed(5)},${p.lng.toFixed(5)}`;
      if (!groups[key]) {
        groups[key] = { lat: p.lat, lng: p.lng, totalFound: 0, totalLost: 0, totalItems: 0, rooms: [] };
      }
      groups[key].totalFound += p.found;
      groups[key].totalLost += p.lost;
      groups[key].totalItems += p.total;
      groups[key].rooms.push({ name: p.location, found: p.found, lost: p.lost });
    });
    return Object.values(groups);
  }, [points]);

  useEffect(() => {
    if (layerRef.current) map.removeLayer(layerRef.current);
    const layer = L.layerGroup();

    aggregated.forEach(group => {
      const value = filter === "found" ? group.totalFound : filter === "lost" ? group.totalLost : group.totalItems;
      if (value === 0) return;

      const pct    = value / max;
      const color  = getHeatColor(value, max);
      const radius = 12 + pct * 25;

      L.circleMarker([group.lat, group.lng], {
        radius:      radius + 10,
        color:       "transparent",
        fillColor:   color.hex,
        fillOpacity: 0.1,
        weight:      0,
      }).addTo(layer);

      const marker = L.circleMarker([group.lat, group.lng], {
        radius,
        color:       "#ffffff",
        fillColor:   color.hex,
        fillOpacity: 0.85,
        weight:      2.5,
      }).addTo(layer);

      const roomsHtml = group.rooms.map(r => `
        <div style="display: flex; justify-content: space-between; align-items: center; gap: 16px; margin-top: 8px; padding-top: 8px; border-top: 1px solid rgba(0,0,0,0.04);">
          <span style="font-size: 11px; font-weight: 600; color: #334155; white-space: nowrap;">${r.name}</span>
          <div style="display: flex; gap: 12px; font-size: 11px; font-weight: 800;">
            <span style="color: #10b981;">Found: ${r.found}</span>
            <span style="color: #ef4444;">Lost: ${r.lost}</span>
          </div>
        </div>
      `).join("");

      marker.bindTooltip(`
        <div style="font-family:'Inter',sans-serif;min-width:240px;padding:16px;background:white;border-radius:16px;box-shadow:0 20px 40px rgba(0,0,0,0.18)">
          <div style="display: flex; align-items: center; justify-content: space-between; margin-bottom: 10px;">
            <span style="font-size: 10px; font-weight: 900; color: #64748b; text-transform: uppercase; letter-spacing: 0.05em;">Location Activity</span>
            <span style="font-size: 10px; font-weight: 800; color: #4f46e5; background: rgba(79,70,229,0.08); padding: 2px 8px; border-radius: 6px;">${group.rooms.length} Areas</span>
          </div>
          <div style="margin-bottom: 12px; display: flex; align-items: center; gap: 10px;">
             <span style="font-size: 28px; font-weight: 900; color: #1e293b; line-height: 1;">${value}</span>
             <div style="display: flex; flex-direction: column;">
                <span style="font-size: 10px; font-weight: 800; color: #94a3b8; text-transform: uppercase; letter-spacing: 0.02em; line-height: 1.2;">Reports</span>
                <span style="font-size: 10px; font-weight: 800; color: #4f46e5; text-transform: uppercase; letter-spacing: 0.02em; line-height: 1.2;">Found & Lost Items</span>
             </div>
          </div>
          <div style="max-height: 140px; overflow-y: auto; padding-right: 4px;">
             ${roomsHtml}
          </div>
        </div>
      `, {
        className: "custom-tooltip",
        direction: "top",
        sticky: true
      });
    });

    layer.addTo(map);
    layerRef.current = layer;
    return () => { map.removeLayer(layer); };
  }, [aggregated, filter, max, map]);

  return null;
}

const BUILDINGS = [
  {
    id: "SWDC",
    name: "SWDC Building",
    floors: [1, 2, 3],
    rooms: [
      ...Array.from({ length: 10 }, (_, i) => ({ id: `SC-10${i + 1}`, name: `Room SC-10${i + 1}`, type: "classroom" as any, floor: 1 })),
      ...Array.from({ length: 10 }, (_, i) => ({ id: `SC-20${i + 1}`, name: `Room SC-20${i + 1}`, type: "classroom" as any, floor: 2 })),
      ...Array.from({ length: 10 }, (_, i) => ({ id: `SC-30${i + 1}`, name: `Room SC-30${i + 1}`, type: "classroom" as any, floor: 3 })),
    ]
  },
  {
    id: "BAB",
    name: "Business Administration Building",
    floors: [],
    rooms: [],
    isComingSoon: true
  }
];

const IndoorMapPage = () => {
  const navigate = useNavigate();
  const [selectedBuilding, setSelectedBuilding] = useState(BUILDINGS[0]);
  const [currentFloor, setCurrentFloor] = useState(2);
  const [selectedRoom, setSelectedRoom] = useState<any>(null);
  const [bottomSheetHeight, setBottomSheetHeight] = useState<"peek" | "half" | "full">("peek");
  const [mapMode, setMapMode] = useState<"indoor" | "heatmap">("indoor");
  const [heatmapFilter, setHeatmapFilter] = useState<Filter>("all");
  const { data: foundData } = useGetFoundItemsQuery({ limit: 1000 });
  const { data: lostData } = useGetLostItemsQuery({ limit: 1000 });

  const allItems = useMemo(() => {
    const found = ((foundData as any)?.data || []).filter((i: any) => !i.isClaimed && !i.isDeleted && !i.isArchived);
    const lost = ((lostData as any)?.data || []).filter((i: any) => !i.isFound && !i.isDeleted);
    return [
      ...found.map((i: any) => ({ ...i, type: "found" })),
      ...lost.map((i: any) => ({ ...i, type: "lost" })),
    ];
  }, [foundData, lostData]);

  const rawStats: LocationStat[] = useMemo(() => {
    const statsMap: { [key: string]: LocationStat } = {};
    
    allItems.forEach(item => {
      const loc = item.location || item.foundLocation || "Unknown";
      if (!statsMap[loc]) {
        statsMap[loc] = { location: loc, found: 0, lost: 0, total: 0 };
      }
      if (item.type === "found") statsMap[loc].found++;
      else statsMap[loc].lost++;
      statsMap[loc].total++;
    });

    return Object.values(statsMap).map(r => {
      const coords = getCoordinates(r.location);
      return { ...r, lat: coords?.[0], lng: coords?.[1] };
    });
  }, [allItems]);

  const mappableStats = useMemo(() => rawStats.filter(r => r.lat && r.lng), [rawStats]);
  const maxTotal = useMemo(() => Math.max(...rawStats.map(r => r.total), 1), [rawStats]);
  const maxFilter = useMemo(() => Math.max(...rawStats.map(r =>
    heatmapFilter === "found" ? r.found : heatmapFilter === "lost" ? r.lost : r.total
  ), 1), [rawStats, heatmapFilter]);

  const roomItems = useMemo(() => {
    if (!selectedRoom) return [];
    const targetId = selectedRoom.id.toLowerCase().replace("sc-", "");
    const targetName = selectedRoom.name.toLowerCase().replace("room ", "");
    return allItems.filter(item => {
      const loc = (item.location || item.foundLocation || "").toLowerCase();
      return loc.includes(targetId) || loc.includes(targetName) || targetId.includes(loc) || targetName.includes(loc);
    });
  }, [selectedRoom, allItems]);

  const handleRoomSelect = (id: string | null) => {
    if (!id) {
      setSelectedRoom(null);
      setBottomSheetHeight("peek");
      return;
    }
    const room = selectedBuilding.rooms.find(r => r.id === id);
    if (room) {
      setSelectedRoom(room);
      setBottomSheetHeight("half");
    } else if (id.includes("Floor")) {
      const level = parseInt(id.split("-")[1]);
      setCurrentFloor(level);
      setSelectedRoom(null);
    }
  };

  const sheetPx = bottomSheetHeight === "full" ? 88 : bottomSheetHeight === "half" ? 52 : 72;
  const mapStyle = { height: `calc(100vh - ${sheetPx}vh - 4rem)`, minHeight: "160px" };

  return (
    <div className="min-h-screen bg-gray-950 flex flex-col">
      <div className="border-b border-white/5 bg-gray-900/50">
        <div className="px-6 sm:px-10 lg:px-16 py-6 sm:py-8">
          <div className="flex items-center gap-2 mb-2">
            <div className="w-1.5 h-5 bg-blue-500 rounded-full" />
            <p className="text-blue-400 text-[11px] font-bold uppercase tracking-widest">Campus Maps</p>
          </div>
          <h1 className="text-white text-2xl sm:text-3xl font-bold tracking-tight">
            {mapMode === "indoor" ? "Interactive Floor Plans" : "Campus Activity Heatmap"}
          </h1>
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mt-1">
            <p className="text-gray-500 text-sm max-w-lg">
              {mapMode === "indoor" ? "Tap a room to view active reports." : "View campus activity hotspots."}
            </p>
            <div className="flex p-1 bg-gray-900 border border-white/5 rounded-xl self-start sm:self-auto shrink-0">
              <button onClick={() => setMapMode("indoor")} className={`px-4 py-1.5 rounded-lg text-[11px] font-bold transition-all flex items-center gap-2 ${mapMode === "indoor" ? "bg-blue-500/10 text-blue-400" : "text-gray-500"}`}><FaBuilding size={10} /> Indoor</button>
              <button onClick={() => setMapMode("heatmap")} className={`px-4 py-1.5 rounded-lg text-[11px] font-bold transition-all flex items-center gap-2 ${mapMode === "heatmap" ? "bg-blue-500/10 text-blue-400" : "text-gray-500"}`}><FaMap size={10} /> Heatmap</button>
            </div>
          </div>

          {mapMode === "indoor" && (
            <div className="mt-6 flex items-center gap-2 overflow-x-auto no-scrollbar pb-1">
              {BUILDINGS.map((b: any) => (
                <button
                  key={b.id}
                  onClick={() => {
                    setSelectedBuilding(b);
                    setSelectedRoom(null);
                  }}
                  className={`px-4 py-2 rounded-xl text-xs font-bold transition-all whitespace-nowrap flex items-center gap-2 ${
                    selectedBuilding.id === b.id
                      ? "bg-blue-600 text-white shadow-lg shadow-blue-900/20 border border-blue-500"
                      : "bg-gray-900 border border-white/5 text-gray-500 hover:text-white hover:bg-gray-800"
                  }`}
                >
                  {b.name}
                  {b.isComingSoon && (
                    <span className={`text-[9px] font-black px-1.5 py-0.5 rounded-md uppercase tracking-widest ${
                      selectedBuilding.id === b.id ? "bg-white/20 text-blue-100" : "bg-white/10 text-gray-400"
                    }`}>
                      Coming Soon
                    </span>
                  )}
                </button>
              ))}
            </div>
          )}
        </div>
      </div>

      <div className="flex-1 flex flex-col overflow-hidden">
        <div className="hidden lg:flex flex-1 gap-6 p-6 overflow-hidden">
          {mapMode === "indoor" ? (
            <>
              {(selectedBuilding as any).isComingSoon ? (
                <div className="flex-1 bg-[#0f1522] border border-white/5 rounded-2xl overflow-hidden flex items-center justify-center flex-col p-12">
                   <FaBuilding className="text-gray-800/50 text-6xl mb-6" />
                   <h2 className="text-2xl font-bold text-white mb-2">{selectedBuilding.name}</h2>
                   <p className="text-gray-500 text-center max-w-md mb-6">We are currently mapping the {selectedBuilding.name}. Check back later for its full 3D interactive layout!</p>
                   <span className="px-4 py-1.5 bg-white/5 border border-white/10 text-gray-400 text-xs font-black rounded-lg uppercase tracking-widest">Coming Soon</span>
                </div>
              ) : (
                <div className="flex-1 bg-gray-900 border border-white/5 rounded-2xl overflow-hidden">
                  <IndoorMap3D onRoomSelect={handleRoomSelect} selectedRoomId={selectedRoom?.id || `Floor-${currentFloor}`} items={allItems} currentFloor={currentFloor} />
                </div>
              )}
              <div className="w-80 bg-gray-900 border border-white/5 rounded-2xl overflow-hidden flex flex-col shrink-0">
                <div className="p-4 border-b border-white/5 flex items-center gap-2">
                  <h3 className="text-white text-[11px] font-bold uppercase tracking-widest">Room Details</h3>
                </div>
                {!selectedRoom || (selectedBuilding as any).isComingSoon ? (
                  <div className="flex-1 flex flex-col items-center justify-center p-8 text-center text-gray-500"><FaInfoCircle size={22} className="mb-3" /><p className="text-sm">Select a room</p></div>
                ) : (
                  <DesktopRoomDetails selectedRoom={selectedRoom} roomItems={roomItems} navigate={navigate} />
                )}
              </div>
            </>
          ) : (
            <div className="flex-1 flex flex-col gap-6 overflow-hidden">
              <style>{`.custom-tooltip { background: white !important; border: none !important; box-shadow: 0 10px 25px rgba(0,0,0,0.15) !important; border-radius: 14px !important; }`}</style>
              <div className="grid grid-cols-1 lg:grid-cols-[1fr_320px] gap-6 flex-1 overflow-hidden">
                <div className="flex flex-col gap-4">
                  <div className="flex gap-1 bg-gray-900 border border-white/5 rounded-xl p-1 w-fit">
                    {(["all", "found", "lost"] as Filter[]).map(f => (
                      <button key={f} onClick={() => setHeatmapFilter(f)} className={`px-4 py-1.5 rounded-lg text-[10px] font-bold capitalize transition-all ${heatmapFilter === f ? "bg-indigo-600 text-white" : "text-gray-500"}`}>{f}</button>
                    ))}
                  </div>
                  <div className="flex-1 bg-gray-900 border border-white/5 rounded-2xl overflow-hidden relative">
                    <MapContainer center={CAMPUS_CENTER} zoom={CAMPUS_ZOOM} style={{ height: "100%", width: "100%" }} zoomControl={false} attributionControl={false}>
                      <ZoomControl position="bottomright" />
                      <TileLayer url="https://{s}.basemaps.cartocdn.com/rastertiles/voyager/{z}/{x}/{y}{r}.png" maxZoom={20} />
                      <HeatLayer points={mappableStats} filter={heatmapFilter} max={maxFilter} />
                    </MapContainer>
                    <div className="absolute bottom-6 left-6 p-4 bg-gray-900/90 backdrop-blur-md border border-white/10 rounded-2xl z-[1000] pointer-events-none">
                       <p className="text-[9px] font-black text-gray-500 uppercase tracking-widest mb-3">Intensity</p>
                       <div className="flex gap-3">
                         {HEAT_SCALE.map((level) => (
                           <div key={level.label} className="flex items-center gap-2">
                             <div className={`w-2 h-2 rounded-full ${level.dot}`} />
                             <span className="text-[10px] font-bold text-gray-300">{level.label}</span>
                           </div>
                         ))}
                       </div>
                    </div>
                  </div>
                </div>
                <div className="bg-gray-900 border border-white/5 rounded-2xl overflow-hidden flex flex-col">
                  <div className="p-4 border-b border-white/5 flex items-center justify-between">
                    <div className="flex items-center gap-2"><h3 className="text-white text-[11px] font-bold uppercase tracking-widest">Active Hotspots</h3></div>
                    <span className="text-[10px] text-gray-500 font-bold">{mappableStats.length}</span>
                  </div>
                  <div className="flex-1 overflow-y-auto p-4 space-y-2">
                    {mappableStats.sort((a, b) => b.total - a.total).map(loc => {
                      const heat = getHeatColor(loc.total, maxTotal);
                      const val = heatmapFilter === "found" ? loc.found : heatmapFilter === "lost" ? loc.lost : loc.total;
                      const pct = Math.round((val / maxFilter) * 100);
                      return (
                        <div key={loc.location} className="p-3 bg-white/[0.03] border border-white/5 rounded-xl space-y-2 group">
                          <div className="flex items-center justify-between"><p className="text-gray-200 text-xs font-bold truncate pr-2 group-hover:text-indigo-400 transition-colors">{loc.location}</p><span className={`text-[9px] font-black uppercase px-1.5 py-0.5 rounded border ${heat.badge}`}>{heat.label}</span></div>
                          <div className="flex items-center gap-2"><div className="flex-1 h-1 bg-white/5 rounded-full overflow-hidden"><div className={`h-full ${heat.bar} transition-all duration-500`} style={{ width: `${pct}%` }} /></div><span className="text-gray-500 text-[10px] font-bold">{pct}%</span></div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>

        <div className="lg:hidden flex-1 flex flex-col p-4 overflow-hidden">
          {mapMode === "indoor" ? (
            <div className="flex-1 relative transition-all duration-500" style={mapStyle}>
              {(selectedBuilding as any).isComingSoon ? (
                <div className="w-full h-full bg-[#0f1522] border border-white/5 rounded-2xl overflow-hidden flex items-center justify-center flex-col p-6 text-center">
                   <FaBuilding className="text-gray-800/50 text-4xl mb-4" />
                   <h2 className="text-xl font-bold text-white mb-2">{selectedBuilding.name}</h2>
                   <p className="text-gray-500 text-xs mb-5">We are currently mapping the {selectedBuilding.name}. Check back later for its full 3D interactive layout!</p>
                   <span className="px-3 py-1 bg-white/5 border border-white/10 text-gray-400 text-[10px] font-black rounded-md uppercase tracking-widest">Coming Soon</span>
                </div>
              ) : (
                <IndoorMap3D onRoomSelect={handleRoomSelect} selectedRoomId={selectedRoom?.id || `Floor-${currentFloor}`} items={allItems} currentFloor={currentFloor} />
              )}
            </div>
          ) : (
            <div className="flex-1 bg-gray-900 border border-white/5 rounded-2xl overflow-hidden relative">
              <MapContainer center={CAMPUS_CENTER} zoom={CAMPUS_ZOOM - 1} style={{ height: "100%", width: "100%" }} zoomControl={false} attributionControl={false}>
                <TileLayer url="https://{s}.basemaps.cartocdn.com/rastertiles/voyager/{z}/{x}/{y}{r}.png" />
                <HeatLayer points={mappableStats} filter={heatmapFilter} max={maxFilter} />
              </MapContainer>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

const DesktopRoomDetails = ({ selectedRoom, roomItems, navigate }: any) => (
  <div className="p-5 space-y-4">
    <div className="flex items-center gap-3 p-3 bg-white/[0.03] border border-white/5 rounded-xl">
      <div className="w-9 h-9 rounded-xl bg-blue-500/10 border border-blue-500/20 flex items-center justify-center shrink-0"><FaBuilding size={13} className="text-blue-400" /></div>
      <div><p className="text-white text-sm font-semibold">{selectedRoom.name}</p><p className="text-gray-500 text-[11px] capitalize">Floor {selectedRoom.floor}</p></div>
    </div>
    <div className="space-y-2">
      <p className="text-[10px] font-bold text-gray-600 uppercase tracking-widest mb-3">Active Reports</p>
      {roomItems.map((item: any) => (
        <button key={item.id} onClick={() => navigate(`/${item.type}Items/${item.id}`)} className="w-full bg-gray-800/40 border border-white/5 hover:border-white/20 rounded-xl p-3 text-left">
          <div className="flex items-center justify-between gap-2">
            <p className="text-white font-bold text-[13px] truncate">{item.foundItemName || item.lostItemName}</p>
            <span className={`shrink-0 px-2 py-0.5 rounded border text-[9px] font-black uppercase tracking-widest ${item.type === 'found' ? 'bg-blue-500/10 text-blue-400 border-blue-500/20' : 'bg-red-500/10 text-red-400 border-red-500/20'}`}>
              {item.type}
            </span>
          </div>
        </button>
      ))}
    </div>
  </div>
);

export default IndoorMapPage;