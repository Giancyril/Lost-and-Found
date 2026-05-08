import { useState, useMemo } from "react";
import { useNavigate } from "react-router-dom";
import {
  FaMapMarkerAlt, FaChevronRight, FaInfoCircle,
  FaBoxOpen, FaExclamationTriangle, FaCheckCircle,
  FaBuilding, FaChevronDown, FaChevronUp, FaTimes,
} from "react-icons/fa";
import { useGetFoundItemsQuery, useGetLostItemsQuery } from "../redux/api/api";
import IndoorMap3D from "./IndoorMap3D";

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

  // Sheet heights
  const sheetHeightMap = {
    peek: "h-[72px]",    // just drag handle + header peeking
    half: "h-[52vh]",
    full: "h-[88vh]",
  };
  const sheetH = sheetHeightMap[bottomSheetHeight];
  // Map fills remaining space above the fixed sheet
  const sheetPx = bottomSheetHeight === "full" ? 88 : bottomSheetHeight === "half" ? 52 : 72;
  const mapStyle = { height: `calc(100vh - ${sheetPx}vh - 4rem)`, minHeight: "160px" };

  return (
    <div className="min-h-screen bg-gray-950 flex flex-col">

      {/* ── Page Header — matches FoundItems style ── */}
      <div className="border-b border-white/5 bg-gray-900/50">
        <div className="px-6 sm:px-10 lg:px-16 py-6 sm:py-8">
          <div>
              <div className="flex items-center gap-2 mb-2">
                <div className="w-1.5 h-5 bg-blue-500 rounded-full" />
                <p className="text-blue-400 text-[11px] font-bold uppercase tracking-widest">Indoor Maps</p>
              </div>
              <h1 className="text-white text-2xl sm:text-3xl font-bold tracking-tight">Interactive Floor Plans</h1>
              <p className="text-gray-500 text-sm mt-1 max-w-lg">
                Tap a room to view active lost and found reports for that location.
              </p>
          </div>
        </div>
      </div>

      {/* ── DESKTOP LAYOUT (lg+) ── */}
      <div className="hidden lg:flex px-6 sm:px-10 lg:px-16 py-6 flex-1 gap-6">
        {/* 3D Map — fixed height so it doesn't overflow */}
        <div className="flex-1 min-w-0">
          <div className="bg-gray-900 border border-white/5 rounded-2xl overflow-hidden" style={{ height: "600px" }}>
            <IndoorMap3D
              onRoomSelect={handleRoomSelect}
              selectedRoomId={selectedRoom?.id || `Floor-${currentFloor}`}
              items={allItems}
              currentFloor={currentFloor}
            />
          </div>
        </div>

        {/* Sidebar — Room Details */}
        <div className="w-80 shrink-0 flex flex-col gap-4">
          <div className="bg-gray-900 border border-white/5 rounded-2xl overflow-hidden flex-1">
            <div className="px-5 py-4 border-b border-white/5">
              <h3 className="text-white text-sm font-semibold">Room Details</h3>
              <p className="text-gray-500 text-xs mt-0.5">
                {selectedRoom ? `${selectedRoom.name} · Floor ${selectedRoom.floor}` : "Select a room on the map"}
              </p>
            </div>
            {!selectedRoom ? (
              <div className="flex flex-col items-center justify-center py-16 px-5 text-center">
                <div className="w-12 h-12 rounded-2xl bg-white/[0.03] border border-white/5 flex items-center justify-center text-gray-700 mb-3">
                  <FaInfoCircle size={22} />
                </div>
                <p className="text-white text-sm font-semibold mb-1">No Room Selected</p>
                <p className="text-gray-500 text-xs leading-relaxed">Click any room on the floor plan to view active reports for that location.</p>
              </div>
            ) : (
              <DesktopRoomDetails selectedRoom={selectedRoom} roomItems={roomItems} navigate={navigate} />
            )}
          </div>

          {/* Summary cards */}
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

      {/* ── MOBILE LAYOUT (<lg) ── */}
      <div className="lg:hidden flex flex-col flex-1">

        {/* 3D Map — height is whatever remains above the fixed sheet */}
        <div
          className="w-full relative transition-all duration-500 ease-in-out"
          style={mapStyle}
        >
          <IndoorMap3D
            onRoomSelect={handleRoomSelect}
            selectedRoomId={selectedRoom?.id || `Floor-${currentFloor}`}
            items={allItems}
            currentFloor={currentFloor}
          />
          {/* Tap hint overlay */}
          {!selectedRoom && bottomSheetHeight === "peek" && (
            <div className="absolute bottom-4 left-4 pointer-events-none">
              <div className="bg-gray-900/85 backdrop-blur-md border border-white/10 rounded-xl px-3 py-2 shadow-lg">
                <p className="text-gray-300 text-[10px] font-semibold">👆 Tap a room to see reports</p>
              </div>
            </div>
          )}
        </div>

        {/* ── Unified Bottom Sheet: Floor Plan + Room Details ── */}
        <div
          className={`
            fixed bottom-0 left-0 right-0 z-30
            bg-gray-900 border-t border-white/10
            rounded-t-3xl shadow-2xl
            transition-all duration-500 ease-in-out
            flex flex-col
            ${sheetH}
          `}
          style={{ maxHeight: "88vh" }}
        >
          {/* Drag handle — always tappable to expand/collapse */}
          <div
            className="flex justify-center pt-3 pb-2 cursor-pointer active:bg-white/5 rounded-t-3xl shrink-0"
            onClick={() => {
              if (bottomSheetHeight === "peek") setBottomSheetHeight(selectedRoom ? "half" : "half");
              else if (bottomSheetHeight === "half") setBottomSheetHeight("full");
              else setBottomSheetHeight(selectedRoom ? "half" : "peek");
            }}
          >
            <div className="w-10 h-1 bg-white/20 rounded-full" />
          </div>

          {/* Sheet Header — tapping also cycles height */}
          <div
            className="px-4 pb-2 flex items-center justify-between border-b border-white/5 cursor-pointer"
            onClick={() => {
              if (bottomSheetHeight === "peek") setBottomSheetHeight("half");
              else if (bottomSheetHeight === "half") setBottomSheetHeight("full");
              else setBottomSheetHeight(selectedRoom ? "half" : "peek");
            }}
          >
            {selectedRoom ? (
              <div className="flex items-center gap-3 flex-1 min-w-0">
                <div className="w-8 h-8 rounded-xl bg-blue-500/10 border border-blue-500/20 flex items-center justify-center shrink-0">
                  <FaBuilding size={12} className="text-blue-400" />
                </div>
                <div className="min-w-0">
                  <p className="text-white text-sm font-bold truncate">{selectedRoom.name}</p>
                  <p className="text-gray-500 text-[10px] capitalize">{selectedRoom.type} · Floor {selectedRoom.floor}</p>
                </div>
                <span className={`ml-auto shrink-0 text-[9px] font-black uppercase px-2 py-0.5 rounded-full border ${roomItems.length > 0
                  ? "bg-red-500/10 text-red-400 border-red-500/20"
                  : "bg-emerald-500/10 text-emerald-400 border-emerald-500/20"}`}>
                  {roomItems.length} {roomItems.length === 1 ? "report" : "reports"}
                </span>
              </div>
            ) : (
              <div className="flex items-center gap-2">
                <div className="w-1 h-4 bg-blue-500 rounded-full" />
                <p className="text-white text-sm font-bold">Floor Plan</p>
                <span className="text-gray-500 text-[10px]">· Floor {currentFloor}</span>
              </div>
            )}
            <div className="flex items-center gap-2 ml-3 shrink-0">
              <div className="w-7 h-7 rounded-lg bg-white/5 flex items-center justify-center text-gray-500">
                {bottomSheetHeight === "full" ? <FaChevronDown size={9} /> : <FaChevronUp size={9} />}
              </div>
              {selectedRoom && (
                <button
                  onClick={(e) => { e.stopPropagation(); closeSheet(); }}
                  className="w-7 h-7 rounded-lg bg-white/5 flex items-center justify-center text-gray-500 active:bg-white/10 transition-colors"
                  aria-label="Close"
                >
                  <FaTimes size={9} />
                </button>
              )}
            </div>
          </div>

          {/* Scrollable content */}
          <div className="flex-1 overflow-y-auto overscroll-contain" style={{ scrollbarWidth: "none" }}>
            {/* Room details section — shown only when a room is selected */}
            {selectedRoom && (
              <div className="px-4 pt-4 pb-3 space-y-3">
                <p className="text-[10px] font-bold text-gray-600 uppercase tracking-widest">Active Reports</p>
                {roomItems.length === 0 ? (
                  <div className="flex flex-col items-center justify-center py-10 bg-white/[0.02] border border-dashed border-white/10 rounded-2xl">
                    <FaCheckCircle size={20} className="text-blue-500/40 mb-2" />
                    <p className="text-gray-400 text-sm font-semibold">No active reports</p>
                    <p className="text-gray-600 text-xs mt-1">This room is clear</p>
                  </div>
                ) : (
                  <div className="space-y-2.5">
                    {roomItems.map(item => (
                      <button
                        key={item.id}
                        onClick={() => navigate(`/${item.type === "found" ? "foundItems" : "lostItems"}/${item.id}`)}
                        className="w-full bg-gray-800/60 border border-white/5 active:border-white/20 active:bg-gray-800 rounded-2xl p-4 text-left transition-all"
                      >
                        <div className="flex items-center gap-3">
                          <div className={`w-10 h-10 rounded-xl flex items-center justify-center shrink-0 ${item.type === "found"
                            ? "bg-blue-500/10 text-blue-400 border border-blue-500/20"
                            : "bg-red-500/10 text-red-400 border border-red-500/20"}`}>
                            {item.type === "found" ? <FaCheckCircle size={15} /> : <FaExclamationTriangle size={15} />}
                          </div>
                          <div className="min-w-0 flex-1">
                            <p className="text-white font-bold text-sm truncate">{item.foundItemName || item.lostItemName}</p>
                            <div className="flex items-center gap-2 mt-1">
                              <span className={`text-[9px] font-black uppercase tracking-tighter px-1.5 py-0.5 rounded ${item.type === 'found' ? 'bg-blue-500/20 text-blue-400' : 'bg-red-500/20 text-red-400'}`}>
                                {item.type}
                              </span>
                              <p className="text-gray-500 text-[10px]">{new Date(item.date || item.createdAt).toLocaleDateString()}</p>
                            </div>
                          </div>
                          <div className="w-8 h-8 rounded-lg bg-white/5 flex items-center justify-center text-gray-600 shrink-0">
                            <FaChevronRight size={10} />
                          </div>
                        </div>
                      </button>
                    ))}
                  </div>
                )}
              </div>
            )}

            {/* No room selected — show summary stats */}
            {!selectedRoom && (
              <div className="px-4 pt-4 pb-6">
                <p className="text-[10px] font-bold text-gray-600 uppercase tracking-widest mb-3">Summary</p>
                <div className="grid grid-cols-3 gap-2">
                  {[
                    { icon: <FaBuilding size={12} className="text-blue-400" />, iconBg: "bg-blue-500/10 border-blue-500/20", value: BUILDINGS.length, label: "Buildings" },
                    { icon: <FaBoxOpen size={12} className="text-emerald-400" />, iconBg: "bg-emerald-500/10 border-emerald-500/20", value: foundCount, label: "Found" },
                    { icon: <FaExclamationTriangle size={12} className="text-red-400" />, iconBg: "bg-red-500/10 border-red-500/20", value: lostCount, label: "Lost" },
                  ].map((card, i) => (
                    <div key={i} className="bg-gray-800/50 border border-white/5 rounded-xl p-3 flex items-center gap-2">
                      <div className={`w-7 h-7 rounded-lg border flex items-center justify-center shrink-0 ${card.iconBg}`}>
                        {card.icon}
                      </div>
                      <div>
                        <p className="text-white text-sm font-black leading-none">{card.value}</p>
                        <p className="text-gray-600 text-[9px] font-bold uppercase tracking-wider mt-0.5">{card.label}</p>
                      </div>
                    </div>
                  ))}
                </div>
                <p className="text-gray-600 text-[10px] text-center mt-4">
                  Tap a room on the map above to view its reports
                </p>
              </div>
            )}

            <div className="h-8" />
          </div>
        </div>
      </div>
    </div>
  );
};

// ── Desktop room details ──
const DesktopRoomDetails = ({
  selectedRoom,
  roomItems,
  navigate,
}: {
  selectedRoom: any;
  roomItems: any[];
  navigate: (path: string) => void;
}) => (
  <div className="p-5 space-y-4">
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
        : "bg-emerald-500/10 text-emerald-400 border-emerald-500/20"}`}>
        {roomItems.length} {roomItems.length === 1 ? "report" : "reports"}
      </span>
    </div>
    <div>
      <p className="text-[10px] font-bold text-gray-600 uppercase tracking-widest mb-3">Active Reports</p>
      {roomItems.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-8 bg-white/[0.02] border border-dashed border-white/10 rounded-xl">
          <FaCheckCircle size={18} className="text-blue-500/40 mb-2" />
          <p className="text-gray-500 text-xs font-medium">No active reports</p>
          <p className="text-gray-700 text-[10px] mt-0.5">This room is clear</p>
        </div>
      ) : (
        <div className="space-y-2 max-h-[340px] overflow-y-auto pr-1" style={{ scrollbarWidth: "thin", scrollbarColor: "rgba(255,255,255,0.1) transparent" }}>
          {roomItems.map(item => (
            <div
              key={item.id}
              onClick={() => navigate(`/${item.type === "found" ? "foundItems" : "lostItems"}/${item.id}`)}
              className="bg-gray-800/40 border border-white/5 hover:border-white/20 hover:bg-gray-800/80 rounded-xl p-3.5 group transition-all cursor-pointer"
            >
              <div className="flex items-center gap-4">
                <div className={`w-9 h-9 rounded-xl flex items-center justify-center shrink-0 ${item.type === "found" ? "bg-blue-500/10 text-blue-400 border border-blue-500/20" : "bg-red-500/10 text-red-400 border border-red-500/20"}`}>
                  {item.type === "found" ? <FaCheckCircle size={14} /> : <FaExclamationTriangle size={14} />}
                </div>
                <div className="min-w-0 flex-1">
                  <p className="text-white font-bold text-[13px] group-hover:text-blue-400 transition-colors truncate">{item.foundItemName || item.lostItemName}</p>
                  <div className="flex items-center gap-2 mt-0.5">
                    <span className={`text-[9px] font-black uppercase tracking-tighter px-1.5 py-0.5 rounded ${item.type === 'found' ? 'bg-blue-500/20 text-blue-400' : 'bg-red-500/20 text-red-400'}`}>
                      {item.type}
                    </span>
                    <p className="text-gray-500 text-[10px] font-medium">{new Date(item.date || item.createdAt).toLocaleDateString()}</p>
                  </div>
                </div>
                <div className="w-7 h-7 rounded-lg bg-white/5 flex items-center justify-center text-gray-700 group-hover:text-blue-400 group-hover:bg-blue-500/10 transition-all">
                  <FaChevronRight size={10} />
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  </div>
);

export default IndoorMapPage;