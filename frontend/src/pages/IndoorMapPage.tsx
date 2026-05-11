import { useState, useMemo, useEffect, useRef } from "react";
import { useNavigate } from "react-router-dom";
import { MapContainer, TileLayer, useMap, ZoomControl } from "react-leaflet";
import L from "leaflet";
import "leaflet/dist/leaflet.css";
import {
  FaMapMarkerAlt, FaChevronRight, FaInfoCircle,
  FaBoxOpen, FaExclamationTriangle, FaCheckCircle,
  FaBuilding, FaChevronDown, FaChevronUp, FaTimes,
  FaMap, FaThermometerHalf, FaSearch, FaLayerGroup
} from "react-icons/fa";
import { useGetFoundItemsQuery, useGetLostItemsQuery, useGetLocationStatsQuery } from "../redux/api/api";
import { getCoordinates, CAMPUS_CENTER, CAMPUS_ZOOM } from "../utils/campusLocations";
import IndoorMap3D from "./IndoorMap3D";

// Fix Leaflet default icon issue with bundlers
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

// ── Heat color helpers ──
const getHeatColor = (val: number, max: number) => {
  const pct = val / max;
  if (pct >= 0.75) return { hex: "#4f46e5", label: "Critical", badge: "bg-indigo-50 text-indigo-600 border-indigo-200", bar: "bg-indigo-600" };
  if (pct >= 0.5)  return { hex: "#4f46e5", label: "High",     badge: "bg-indigo-50 text-indigo-600 border-indigo-200", bar: "bg-indigo-600" };
  if (pct >= 0.25) return { hex: "#4f46e5", label: "Medium",   badge: "bg-indigo-50 text-indigo-600 border-indigo-200", bar: "bg-indigo-600" };
  return               { hex: "#4f46e5", label: "Low",      badge: "bg-indigo-50 text-indigo-600 border-indigo-200", bar: "bg-indigo-600" };
};

// ── Heatmap layer using canvas circles (White Markers with Indigo Outlines) ──
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
      const radius = 12 + pct * 25;

      L.circleMarker([p.lat, p.lng], {
        radius:      radius + 10,
        color:       "transparent",
        fillColor:   color.hex,
        fillOpacity: 0.1,
        weight:      0,
      }).addTo(layer);

      L.circleMarker([p.lat, p.lng], {
        radius,
        color:       "#ffffff",
        fillColor:   color.hex,
        fillOpacity: 0.75,
        weight:      2,
      })
        .bindPopup(`
          <div style="font-family:'Inter',sans-serif;min-width:140px;padding:4px 0">
            <p style="font-weight:700;font-size:12px;margin:0 0 4px;color:#1e293b">${p.location}</p>
            <div style="display:flex;gap:8px;font-size:10px;color:#64748b">
              <span>Found: <b style="color:#10b981">${p.found}</b></span>
              <span>Lost: <b style="color:#ef4444">${p.lost}</b></span>
            </div>
          </div>
        `, {
          className: "custom-popup",
          maxWidth:  200,
        })
        .addTo(layer);
    });

    layer.addTo(map);
    layerRef.current = layer;
    return () => { map.removeLayer(layer); };
  }, [points, filter, max, map]);

  return null;
}

function FlyTo({ lat, lng }: { lat: number; lng: number }) {
  const map = useMap();
  useEffect(() => { map.flyTo([lat, lng], 19, { duration: 1.2 }); }, [lat, lng, map]);
  return null;
}

interface RoomInfo {
  id: string;
  name: string;
  type: "classroom" | "office" | "lab" | "other";
  floor: number;
  coords: string;
}

interface BuildingInfo {
  id: string;
  name: string;
  floors: number[];
  rooms: RoomInfo[];
}

const BUILDINGS: BuildingInfo[] = [
  {
    id: "SWDC",
    name: "SWDC Building",
    floors: [1, 2, 3],
    rooms: [
      ...Array.from({ length: 5 }, (_, i) => ({ id: `SC-10${i + 1}`, name: `Room SC-10${i + 1}`, type: "classroom" as any, floor: 1, coords: "" })),
      ...Array.from({ length: 5 }, (_, i) => ({ id: `SC-1${i + 6 < 10 ? '0' + (i + 6) : (i + 6)}`, name: `Room SC-1${i + 6 < 10 ? '0' + (i + 6) : (i + 6)}`, type: "classroom" as any, floor: 1, coords: "" })),
      ...Array.from({ length: 5 }, (_, i) => ({ id: `SC-20${i + 1}`, name: `Room SC-20${i + 1}`, type: "classroom" as any, floor: 2, coords: "" })),
      ...Array.from({ length: 5 }, (_, i) => ({ id: `SC-2${i + 6 < 10 ? '0' + (i + 6) : (i + 6)}`, name: `Room SC-2${i + 6 < 10 ? '0' + (i + 6) : (i + 6)}`, type: "classroom" as any, floor: 2, coords: "" })),
      ...Array.from({ length: 5 }, (_, i) => ({ id: `SC-30${i + 1}`, name: `Room SC-30${i + 1}`, type: "classroom" as any, floor: 3, coords: "" })),
      ...Array.from({ length: 5 }, (_, i) => ({ id: `SC-3${i + 6 < 10 ? '0' + (i + 6) : (i + 6)}`, name: `Room SC-3${i + 6 < 10 ? '0' + (i + 6) : (i + 6)}`, type: "classroom" as any, floor: 3, coords: "" })),
    ]
  },
];

const IndoorMapPage = () => {
  const navigate = useNavigate();
  const [selectedBuilding] = useState(BUILDINGS[0]);
  const [currentFloor, setCurrentFloor] = useState(2);
  const [selectedRoom, setSelectedRoom] = useState<RoomInfo | null>(null);
  const [bottomSheetHeight, setBottomSheetHeight] = useState<"peek" | "half" | "full">("peek");
  const [mapMode, setMapMode] = useState<"indoor" | "heatmap">("indoor");
  const [heatmapFilter, setHeatmapFilter] = useState<Filter>("all");

  const { data: foundData } = useGetFoundItemsQuery({});
  const { data: lostData } = useGetLostItemsQuery({});
  const { data: statsData } = useGetLocationStatsQuery(undefined, { skip: mapMode !== "heatmap" });

  const rawStats: LocationStat[] = useMemo(() => {
    const stats = (statsData as any)?.data ?? [];
    return stats.map((r: LocationStat) => {
      const coords = getCoordinates(r.location);
      return { ...r, lat: coords?.[0], lng: coords?.[1] };
    });
  }, [statsData]);

  const mappableStats = useMemo(() => rawStats.filter(r => r.lat && r.lng), [rawStats]);
  const maxTotal = useMemo(() => Math.max(...rawStats.map(r => r.total), 1), [rawStats]);
  const maxFilter = useMemo(() => Math.max(...rawStats.map(r =>
    heatmapFilter === "found" ? r.found : heatmapFilter === "lost" ? r.lost : r.total
  ), 1), [rawStats, heatmapFilter]);

  const allItems = useMemo(() => {
    const found = (foundData as any)?.data || [];
    const lost = (lostData as any)?.data || [];
    return [
      ...found.map((i: any) => ({ ...i, type: "found" })),
      ...lost.map((i: any) => ({ ...i, type: "lost" })),
    ];
  }, [foundData, lostData]);

  const roomItems = useMemo(() => {
    if (!selectedRoom) return [];
    const targetId = selectedRoom.id.toLowerCase().replace("sc-", "");
    const targetName = selectedRoom.name.toLowerCase().replace("room ", "");
    return allItems.filter(item => {
      const loc = (item.location || item.foundLocation || "").toLowerCase();
      return loc.includes(targetId) || loc.includes(targetName) || targetId.includes(loc) || targetName.includes(loc);
    });
  }, [selectedRoom, allItems]);

  const foundCount = allItems.filter(i => i.type === "found").length;
  const lostCount = allItems.filter(i => i.type === "lost").length;

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

  const closeSheet = () => {
    setSelectedRoom(null);
    setBottomSheetHeight("peek");
  };

  const sheetHeightMap = {
    peek: "h-[72px]",
    half: "h-[52vh]",
    full: "h-[88vh]",
  };
  const sheetH = sheetHeightMap[bottomSheetHeight];
  const sheetPx = bottomSheetHeight === "full" ? 88 : bottomSheetHeight === "half" ? 52 : 72;
  const mapStyle = { height: `calc(100vh - ${sheetPx}vh - 4rem)`, minHeight: "160px" };

  return (
    <div className="min-h-screen bg-gray-950 flex flex-col">
      <div className="border-b border-white/5 bg-gray-900/50">
        <div className="px-6 sm:px-10 lg:px-16 py-6 sm:py-8">
          <div>
            <div className="flex items-center gap-2 mb-2">
              <div className="w-1.5 h-5 bg-blue-500 rounded-full" />
              <p className="text-blue-400 text-[11px] font-bold uppercase tracking-widest">Campus Maps</p>
            </div>
            <h1 className="text-white text-2xl sm:text-3xl font-bold tracking-tight">
              {mapMode === "indoor" ? "Interactive Floor Plans" : "Campus Activity Heatmap"}
            </h1>
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mt-1">
              <p className="text-gray-500 text-sm max-w-lg">
                {mapMode === "indoor"
                  ? "Tap a room to view active lost and found reports for that location."
                  : "View campus activity hotspots based on reported items."}
              </p>
              <div className="flex items-center gap-2 self-start sm:self-auto">
                <div className="flex p-1 bg-gray-900 border border-white/5 rounded-xl">
                  <button
                    onClick={() => setMapMode("indoor")}
                    className={`px-4 py-1.5 rounded-lg text-[11px] font-bold transition-all flex items-center gap-2 ${mapMode === "indoor" ? "bg-blue-500/10 text-blue-400" : "text-gray-500 hover:text-gray-300"
                      }`}
                  >
                    <FaBuilding size={10} /> Indoor Map
                  </button>
                  <button
                    onClick={() => setMapMode("heatmap")}
                    className={`px-4 py-1.5 rounded-lg text-[11px] font-bold transition-all flex items-center gap-2 ${mapMode === "heatmap" ? "bg-blue-500/10 text-blue-400" : "text-gray-500 hover:text-gray-300"
                      }`}
                  >
                    <FaMap size={10} /> Heatmap
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className="flex-1 flex flex-col">
        <div className="hidden lg:flex flex-1 flex-col overflow-hidden">
          {mapMode === "indoor" ? (
            <div className="flex px-6 sm:px-10 lg:px-16 py-6 flex-1 gap-6 overflow-hidden">
              <div className="flex-1 min-w-0">
                <div className="bg-gray-900 border border-white/5 rounded-2xl overflow-hidden h-[600px]">
                  <IndoorMap3D onRoomSelect={handleRoomSelect} selectedRoomId={selectedRoom?.id || `Floor-${currentFloor}`} items={allItems} currentFloor={currentFloor} />
                </div>
              </div>
              <div className="w-80 shrink-0 flex flex-col gap-4">
                <div className="bg-gray-900 border border-white/5 rounded-2xl overflow-hidden flex-1">
                  <div className="px-5 py-4 border-b border-white/5">
                    <h3 className="text-white text-sm font-semibold">Room Details</h3>
                    <p className="text-gray-500 text-xs mt-0.5">{selectedRoom ? `${selectedRoom.name} · Floor ${selectedRoom.floor}` : "Select a room"}</p>
                  </div>
                  {!selectedRoom ? (
                    <div className="flex flex-col items-center justify-center py-16 px-5 text-center text-gray-500">
                      <FaInfoCircle size={22} className="mb-3" />
                      <p className="text-sm">Click a room on the map</p>
                    </div>
                  ) : (
                    <DesktopRoomDetails selectedRoom={selectedRoom} roomItems={roomItems} navigate={navigate} />
                  )}
                </div>
              </div>
            </div>
          ) : (
            <div className="px-6 sm:px-10 lg:px-16 py-6 flex-1 flex flex-col gap-6 animate-in fade-in duration-500 overflow-hidden">
              <style>{`
                .custom-popup .leaflet-popup-content-wrapper { background: #ffffff; border: 1px solid rgba(0,0,0,0.05); border-radius: 12px; box-shadow: 0 10px 30px rgba(0,0,0,0.08); }
                .custom-popup .leaflet-popup-tip { background: #ffffff; }
                .leaflet-container { background: #111827; border-radius: 1.5rem; }
              `}</style>
              <div className="grid grid-cols-1 lg:grid-cols-[1fr_320px] gap-6 items-start h-full">
                <div className="space-y-4 h-full flex flex-col">
                  <div className="flex items-center justify-between">
                    <div className="flex gap-1 bg-gray-900 border border-white/5 rounded-xl p-1 shadow-sm">
                      {(["all", "found", "lost"] as Filter[]).map(f => (
                        <button key={f} onClick={() => setHeatmapFilter(f)} className={`px-4 py-1.5 rounded-lg text-[10px] font-bold capitalize transition-all ${heatmapFilter === f ? "bg-indigo-600 text-white shadow-md shadow-indigo-500/20" : "text-gray-500 hover:text-gray-300"}`}>{f}</button>
                      ))}
                    </div>
                  </div>
                  <div className="flex-1 bg-gray-900 border border-white/5 rounded-2xl overflow-hidden relative min-h-[400px]">
                    <MapContainer center={CAMPUS_CENTER} zoom={CAMPUS_ZOOM} style={{ height: "100%", width: "100%" }} zoomControl={false} attributionControl={false}>
                      <ZoomControl position="bottomright" />
                      <TileLayer url="https://{s}.basemaps.cartocdn.com/rastertiles/voyager/{z}/{x}/{y}{r}.png" maxZoom={20} />
                      <HeatLayer points={mappableStats} filter={heatmapFilter} max={maxFilter} />
                    </MapContainer>
                  </div>
                </div>
                <div className="bg-gray-900 border border-white/5 rounded-2xl overflow-hidden flex flex-col h-[540px]">
                  <div className="px-5 py-4 border-b border-white/5 flex items-center justify-between bg-white/[0.02]">
                    <div className="flex items-center gap-2"><FaLayerGroup size={12} className="text-indigo-400" /><h3 className="text-white text-[11px] font-bold uppercase tracking-widest">Active Hotspots</h3></div>
                    <span className="text-[10px] text-gray-500 font-bold">{mappableStats.length} Mapped</span>
                  </div>
                  <div className="flex-1 overflow-y-auto p-4 space-y-2">
                    {mappableStats.sort((a, b) => b.total - a.total).map(loc => {
                      const heat = getHeatColor(loc.total, maxTotal);
                      const val = heatmapFilter === "found" ? loc.found : heatmapFilter === "lost" ? loc.lost : loc.total;
                      const pct = Math.round((val / maxFilter) * 100);
                      return (
                        <div key={loc.location} className="p-3 bg-white/[0.03] border border-white/5 rounded-xl space-y-2 hover:border-indigo-500/30 transition-colors group">
                          <div className="flex items-center justify-between"><p className="text-gray-200 text-xs font-bold truncate pr-2 group-hover:text-indigo-400 transition-colors">{loc.location}</p><span className={`text-[9px] font-black uppercase px-1.5 py-0.5 rounded border ${heat.badge.replace("bg-indigo-50", "bg-indigo-500/10").replace("text-indigo-600", "text-indigo-400").replace("border-indigo-200", "border-indigo-500/20")}`}>{heat.label}</span></div>
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

        <div className="lg:hidden flex-1 flex flex-col overflow-hidden">
          {mapMode === "indoor" ? (
            <div className="flex-1 flex flex-col overflow-hidden">
              <div className="w-full relative transition-all duration-500" style={mapStyle}>
                <IndoorMap3D onRoomSelect={handleRoomSelect} selectedRoomId={selectedRoom?.id || `Floor-${currentFloor}`} items={allItems} currentFloor={currentFloor} />
              </div>
              <div className={`fixed bottom-0 left-0 right-0 z-30 bg-gray-900 border-t border-white/10 rounded-t-3xl shadow-2xl transition-all duration-500 flex flex-col ${sheetH}`}>
                <div className="flex justify-center pt-3 pb-2 cursor-pointer" onClick={() => setBottomSheetHeight(bottomSheetHeight === "peek" ? "half" : bottomSheetHeight === "half" ? "full" : "peek")}>
                  <div className="w-10 h-1 bg-white/20 rounded-full" />
                </div>
                <div className="px-4 pb-2 flex items-center justify-between border-b border-white/5">
                  {selectedRoom ? (
                    <div className="flex items-center gap-3"><p className="text-white text-sm font-bold">{selectedRoom.name}</p></div>
                  ) : (
                    <div className="flex items-center gap-2"><p className="text-white text-sm font-bold">Floor Plan</p><span className="text-gray-500 text-[10px]">· Floor {currentFloor}</span></div>
                  )}
                  <div className="flex items-center gap-2">
                    {selectedRoom && <button onClick={closeSheet} className="w-7 h-7 bg-white/5 rounded-lg flex items-center justify-center"><FaTimes size={10} /></button>}
                  </div>
                </div>
                <div className="flex-1 overflow-y-auto p-4">
                  {selectedRoom && (
                    <div className="space-y-3">
                      {roomItems.map(item => (
                        <button key={item.id} onClick={() => navigate(`/${item.type}Items/${item.id}`)} className="w-full bg-gray-800 border border-white/5 rounded-2xl p-4 text-left">
                          <p className="text-white font-bold text-sm">{item.foundItemName || item.lostItemName}</p>
                        </button>
                      ))}
                    </div>
                  )}
                  {!selectedRoom && (
                    <div className="grid grid-cols-2 gap-2">
                      <div className="bg-gray-800 p-3 rounded-xl"><p className="text-white font-black">{foundCount}</p><p className="text-gray-500 text-[10px] uppercase font-bold">Found</p></div>
                      <div className="bg-gray-800 p-3 rounded-xl"><p className="text-white font-black">{lostCount}</p><p className="text-gray-500 text-[10px] uppercase font-bold">Lost</p></div>
                    </div>
                  )}
                </div>
              </div>
            </div>
          ) : (
            <div className="flex-1 flex flex-col p-4 space-y-4 overflow-hidden">
              <div className="flex-1 bg-gray-900 border border-white/5 rounded-2xl overflow-hidden relative shadow-sm">
                <MapContainer center={CAMPUS_CENTER} zoom={CAMPUS_ZOOM - 1} style={{ height: "100%", width: "100%" }} zoomControl={false} attributionControl={false}>
                  <TileLayer url="https://{s}.basemaps.cartocdn.com/rastertiles/voyager/{z}/{x}/{y}{r}.png" />
                  <HeatLayer points={mappableStats} filter={heatmapFilter} max={maxFilter} />
                </MapContainer>
                <div className="absolute top-3 left-3 flex gap-1 bg-gray-900/90 border border-white/10 rounded-xl p-1 z-[1000] shadow-md backdrop-blur-sm">
                  {(["all", "found", "lost"] as Filter[]).map(f => (
                    <button key={f} onClick={() => setHeatmapFilter(f)} className={`px-3 py-1 rounded-lg text-[9px] font-bold transition-all ${heatmapFilter === f ? "bg-indigo-600 text-white shadow-sm" : "text-gray-500"}`}>{f}</button>
                  ))}
                </div>
              </div>
              <div className="bg-gray-900 border border-white/5 rounded-2xl p-4 shadow-sm">
                <div className="flex items-center gap-2 mb-3">
                  <FaLayerGroup size={11} className="text-indigo-400" />
                  <p className="text-[10px] font-bold text-gray-500 uppercase tracking-widest">Campus Hotspots</p>
                </div>
                <div className="space-y-2.5 max-h-[160px] overflow-y-auto">
                  {mappableStats.sort((a, b) => b.total - a.total).slice(0, 5).map(loc => (
                    <div key={loc.location} className="flex justify-between items-center text-[11px]">
                      <p className="text-gray-300 font-medium truncate pr-2">{loc.location}</p>
                      <span className="text-indigo-400 font-black">{loc.total}</span>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

const DesktopRoomDetails = ({ selectedRoom, roomItems, navigate }: { selectedRoom: any; roomItems: any[]; navigate: any; }) => (
  <div className="p-5 space-y-4">
    <div className="flex items-center gap-3 p-3 bg-white/[0.03] border border-white/5 rounded-xl">
      <div className="w-9 h-9 rounded-xl bg-blue-500/10 border border-blue-500/20 flex items-center justify-center shrink-0"><FaBuilding size={13} className="text-blue-400" /></div>
      <div><p className="text-white text-sm font-semibold">{selectedRoom.name}</p><p className="text-gray-500 text-[11px] capitalize">{selectedRoom.type} · Floor {selectedRoom.floor}</p></div>
    </div>
    <div className="space-y-2">
      <p className="text-[10px] font-bold text-gray-600 uppercase tracking-widest mb-3">Active Reports</p>
      {roomItems.map(item => (
        <button key={item.id} onClick={() => navigate(`/${item.type}Items/${item.id}`)} className="w-full bg-gray-800/40 border border-white/5 hover:border-white/20 rounded-xl p-3 text-left">
          <p className="text-white font-bold text-[13px] truncate">{item.foundItemName || item.lostItemName}</p>
        </button>
      ))}
    </div>
  </div>
);

export default IndoorMapPage;