import { useState, useMemo } from "react";
import {
  FaMapMarkerAlt, FaChevronRight, FaInfoCircle,
  FaBoxOpen, FaExclamationTriangle, FaCheckCircle,
  FaBuilding, FaLayerGroup, FaSearch,
} from "react-icons/fa";
import { useGetFoundItemsQuery, useGetLostItemsQuery } from "../redux/api/api";
import IndoorMap3D from "./IndoorMap3D";

// ── Types ──────────────────────────────────────────────────────────────────
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

// ── Mock Floor Plan Data ───────────────────────────────────────────────────
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
  const [selectedBuilding, setSelectedBuilding] = useState(BUILDINGS[0]);
  const [currentFloor, setCurrentFloor] = useState(2);
  const [selectedRoom, setSelectedRoom] = useState<RoomInfo | null>(null);

  const { data: foundData } = useGetFoundItemsQuery({});
  const { data: lostData } = useGetLostItemsQuery({});

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
      const loc = item.location.toLowerCase();
      return loc.includes(targetId) || loc.includes(targetName) || targetId.includes(loc) || targetName.includes(loc);
    });
  }, [selectedRoom, allItems]);

  const foundCount = allItems.filter(i => i.type === "found").length;
  const lostCount = allItems.filter(i => i.type === "lost").length;

  return (
    <div className="min-h-screen bg-gray-950 pb-16">

      {/* ── Page Header ── matches LostItemsPage / FoundItemsPage style */}
      <div className="border-b border-white/5 bg-gray-900/50">
        <div className="px-6 sm:px-10 lg:px-16 py-6 sm:py-8">
          <div className="flex flex-col sm:flex-row sm:items-end sm:justify-between gap-4">
            <div>
              <div className="flex items-center gap-2 mb-2">
                <div className="w-1.5 h-5 bg-blue-500 rounded-full" />
                <p className="text-blue-400 text-[11px] font-bold uppercase tracking-widest">Indoor Maps</p>
              </div>
              <h1 className="text-white text-2xl sm:text-3xl font-bold tracking-tight">Interactive Floor Plans</h1>
              <p className="text-gray-500 text-sm mt-1 max-w-lg">
                Locate lost and found items by building and room. Select a room on the map to see active reports.
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* ── Stats Banner ── matches CommunityStatsBanner style */}
      <div className="px-6 sm:px-10 lg:px-16 mt-5 mb-2">
        <div className="grid grid-cols-3 gap-3">
          {[
            { icon: <FaBuilding size={15} className="text-blue-400" />, iconBg: "bg-blue-500/10 border border-blue-500/20", value: BUILDINGS.length, label: "Buildings", sub: "mapped on campus", subColor: "text-blue-400" },
            { icon: <FaBoxOpen size={15} className="text-emerald-400" />, iconBg: "bg-emerald-500/10 border border-emerald-500/20", value: foundCount, label: "Found Items", sub: "total in database", subColor: "text-emerald-400" },
            { icon: <FaExclamationTriangle size={15} className="text-red-400" />, iconBg: "bg-red-500/10 border border-red-500/20", value: lostCount, label: "Lost Items", sub: "still missing", subColor: "text-red-400" },
          ].map((card, i) => (
            <div key={i} className="relative bg-gray-900 border border-white/5 rounded-xl sm:rounded-2xl p-3 sm:p-5 flex flex-col gap-2 sm:gap-3 overflow-hidden">
              <div className="flex items-start justify-between gap-2">
                <div className={`w-7 h-7 sm:w-9 sm:h-9 rounded-lg sm:rounded-xl flex items-center justify-center shrink-0 ${card.iconBg}`}>
                  {card.icon}
                </div>
                <span className="text-2xl sm:text-3xl font-black text-white leading-none tabular-nums">{card.value}</span>
              </div>
              <div>
                <p className="text-xs sm:text-sm font-semibold text-white leading-tight">{card.label}</p>
                <p className={`text-[10px] sm:text-xs mt-0.5 font-medium ${card.subColor} hidden sm:block`}>{card.sub}</p>
              </div>
            </div>
          ))}
        </div>
      </div>


      {/* ── Main Content ── */}
      <div className="px-6 sm:px-10 lg:px-16 mt-5">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-5">

          {/* Map */}
          <div className="lg:col-span-8">
            <div className="rounded-2xl overflow-hidden">
              <div className="aspect-[4/3] w-full">
                <IndoorMap3D
                  onRoomSelect={(id) => {
                    if (!id) { setSelectedRoom(null); return; }
                    const room = selectedBuilding.rooms.find(r => r.id === id);
                    if (room) setSelectedRoom(room);
                    else if (id.includes("Floor")) {
                      const level = parseInt(id.split("-")[1]);
                      setCurrentFloor(level);
                      setSelectedRoom(null);
                    }
                  }}
                  selectedRoomId={selectedRoom?.id || `Floor-${currentFloor}`}
                  items={allItems}
                />
              </div>
            </div>
          </div>

          {/* Sidebar */}
          <div className="lg:col-span-4 space-y-4">

            {/* Room Details Card */}
            <div className="bg-gray-900 border border-white/5 rounded-2xl overflow-hidden">
              <div className="px-5 py-3.5 border-b border-white/5">
                <h3 className="text-white text-sm font-semibold">Room Details</h3>
                <p className="text-gray-500 text-xs mt-0.5">
                  {selectedRoom ? `${selectedRoom.name} · Floor ${selectedRoom.floor}` : "Select a room on the map"}
                </p>
              </div>

              {!selectedRoom ? (
                <div className="flex flex-col items-center justify-center py-14 px-5 text-center">
                  <div className="w-12 h-12 rounded-2xl bg-white/[0.03] border border-white/5 flex items-center justify-center text-gray-700 mb-3">
                    <FaInfoCircle size={22} />
                  </div>
                  <p className="text-white text-sm font-semibold mb-1">No Room Selected</p>
                  <p className="text-gray-500 text-xs leading-relaxed">Click any room on the floor plan to view active reports for that location.</p>
                </div>
              ) : (
                <div className="p-5 space-y-4">
                  {/* Room meta */}
                  <div className="flex items-center gap-3 p-3 bg-white/[0.03] border border-white/5 rounded-xl">
                    <div className="w-9 h-9 rounded-xl bg-blue-500/10 border border-blue-500/20 flex items-center justify-center shrink-0">
                      <FaBuilding size={13} className="text-blue-400" />
                    </div>
                    <div>
                      <p className="text-white text-sm font-semibold">{selectedRoom.name}</p>
                      <p className="text-gray-500 text-[11px] capitalize">{selectedRoom.type} · Floor {selectedRoom.floor}</p>
                    </div>
                    <span className={`ml-auto text-[10px] font-bold px-2 py-0.5 rounded-full border ${roomItems.length > 0
                      ? "bg-red-500/10 text-red-400 border-red-500/20"
                      : "bg-emerald-500/10 text-emerald-400 border-emerald-500/20"
                      }`}>
                      {roomItems.length} {roomItems.length === 1 ? "report" : "reports"}
                    </span>
                  </div>

                  {/* Reports list */}
                  <div>
                    <p className="text-[10px] font-bold text-gray-600 uppercase tracking-widest mb-3">Active Reports</p>
                    {roomItems.length === 0 ? (
                      <div className="flex flex-col items-center justify-center py-8 bg-white/[0.02] border border-dashed border-white/10 rounded-xl">
                        <FaCheckCircle size={18} className="text-emerald-500/40 mb-2" />
                        <p className="text-gray-500 text-xs font-medium">No active reports</p>
                        <p className="text-gray-700 text-[10px] mt-0.5">This room is clear</p>
                      </div>
                    ) : (
                      <div className="space-y-2 max-h-[320px] overflow-y-auto pr-1" style={{ scrollbarWidth: "thin", scrollbarColor: "rgba(255,255,255,0.1) transparent" }}>
                        {roomItems.map(item => (
                          <div key={item.id} className="bg-gray-800/50 border border-white/5 hover:border-white/10 rounded-xl p-3 group transition-all cursor-pointer">
                            <div className="flex items-center gap-3">
                              <div className={`w-8 h-8 rounded-lg flex items-center justify-center shrink-0 ${item.type === "found" ? "bg-emerald-500/10 text-emerald-400" : "bg-red-500/10 text-red-400"
                                }`}>
                                {item.type === "found" ? <FaCheckCircle size={12} /> : <FaExclamationTriangle size={12} />}
                              </div>
                              <div className="min-w-0 flex-1">
                                <p className="text-white font-semibold text-xs truncate">{item.foundItemName || item.lostItemName}</p>
                                <p className="text-gray-500 text-[10px] capitalize">{item.type} · {new Date(item.date).toLocaleDateString()}</p>
                              </div>
                              <FaChevronRight className="text-gray-700 group-hover:text-blue-400 transition-colors shrink-0" size={10} />
                            </div>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                </div>
              )}
            </div>

            {/* Quick Stats */}
            <div className="grid grid-cols-2 gap-3">
              <div className="bg-gray-900 border border-white/5 rounded-2xl p-4 space-y-2">
                <div className="w-8 h-8 rounded-lg bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center">
                  <FaBoxOpen size={13} className="text-emerald-400" />
                </div>
                <p className="text-2xl font-black text-white">{foundCount}</p>
                <p className="text-[10px] font-bold text-gray-500 uppercase tracking-widest">Total Found</p>
              </div>
              <div className="bg-gray-900 border border-white/5 rounded-2xl p-4 space-y-2">
                <div className="w-8 h-8 rounded-lg bg-red-500/10 border border-red-500/20 flex items-center justify-center">
                  <FaExclamationTriangle size={13} className="text-red-400" />
                </div>
                <p className="text-2xl font-black text-white">{lostCount}</p>
                <p className="text-[10px] font-bold text-gray-500 uppercase tracking-widest">Total Lost</p>
              </div>
            </div>

          </div>
        </div>
      </div>
    </div>
  );
};

export default IndoorMapPage;