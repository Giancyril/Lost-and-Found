import { useState, useEffect, useMemo } from "react";
import { FaMapMarkerAlt, FaTimes, FaSlidersH, FaExclamationTriangle, FaSatellite, FaCheckCircle, FaExclamationCircle } from "react-icons/fa";
import { useGetFoundItemsQuery, useGetLostItemsQuery } from "../redux/api/api";
import { getCoordinates } from "../utils/campusLocations";

// Haversine formula to calculate distance in meters
const calculateDistance = (lat1: number, lon1: number, lat2: number, lon2: number): number => {
  const R = 6371e3; // Earth radius in meters
  const phi1 = (lat1 * Math.PI) / 180;
  const phi2 = (lat2 * Math.PI) / 180;
  const deltaPhi = ((lat2 - lat1) * Math.PI) / 180;
  const deltaLambda = ((lon2 - lon1) * Math.PI) / 180;

  const a =
    Math.sin(deltaPhi / 2) * Math.sin(deltaPhi / 2) +
    Math.cos(phi1) * Math.cos(phi2) * Math.sin(deltaLambda / 2) * Math.sin(deltaLambda / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));

  return R * c;
};

interface Hotspot {
  name: string;
  coords: [number, number];
  riskLevel: "CRITICAL" | "HIGH" | "MEDIUM" | "LOW";
  stats: string;
  advice: string;
}

const getDynamicAdvice = (name: string, riskLevel: string): string => {
  const lower = name.toLowerCase();
  if (lower.includes("canteen") || lower.includes("cafeteria")) {
    return "Check your dining table before leaving. Never leave backpacks or wallets unattended on chairs.";
  }
  if (lower.includes("court") || lower.includes("gym")) {
    return "Keep your gadgets inside locked bags and store bags on clear benches where you can see them.";
  }
  if (lower.includes("library")) {
    return "Ensure you do a workspace sweep for chargers, USB drives, or keys before you sign out.";
  }
  if (lower.includes("parking") || lower.includes("garage")) {
    return "Be mindful of loose keychains or pocket items falling out as you mount/dismount vehicles.";
  }

  if (riskLevel === "CRITICAL" || riskLevel === "HIGH") {
    return "This is a busy area on campus. Keep your phones and wallets secure in zipped pockets.";
  }
  return "Stay mindful of your personal belongings. Do a quick sweep of your surroundings when moving.";
};

export default function ProximityAlertSystem() {
  const [gpsEnabled, setGpsEnabled] = useState(false);
  const [realLocation, setRealLocation] = useState<[number, number] | null>(null);
  const [simulatedLocation, setSimulatedLocation] = useState<[number, number] | null>(null);
  const [activeAlert, setActiveAlert] = useState<Hotspot | null>(null);
  const [dismissedAlerts, setDismissedAlerts] = useState<Record<string, boolean>>({});
  const [isSimulatorExpanded, setIsSimulatorExpanded] = useState(false);
  const [simulatedZoneName, setSimulatedZoneName] = useState<string>("Outside Campus");
  const [currentDistances, setCurrentDistances] = useState<Record<string, number>>({});

  const activeCoords = simulatedLocation || realLocation;

  // Real Database Queries for dynamic AI Hotspot analysis
  const { data: foundData } = useGetFoundItemsQuery({});
  const { data: lostData } = useGetLostItemsQuery({});

  const allItems = useMemo(() => {
    const found = ((foundData as any)?.data || []).filter((i: any) => !i.isClaimed && i.status !== "Claimed");
    const lost = (lostData as any)?.data || [];
    return [
      ...found.map((i: any) => ({ ...i, type: "found" })),
      ...lost.map((i: any) => ({ ...i, type: "lost" })),
    ];
  }, [foundData, lostData]);

  // Aggregate items dynamically to calculate real hotspot metrics based purely on database records
  const HOTSPOTS = useMemo(() => {
    const counts: Record<string, { lost: number; found: number; total: number }> = {};

    allItems.forEach((item) => {
      const loc = item.location || item.foundLocation || "";
      if (!loc || loc.toLowerCase() === "unknown") return;

      const coords = getCoordinates(loc);
      if (!coords) return;

      const name = loc.trim();
      if (!counts[name]) {
        counts[name] = { lost: 0, found: 0, total: 0 };
      }
      if (item.type === "lost") counts[name].lost++;
      else counts[name].found++;
      counts[name].total++;
    });

    const totals = Object.values(counts).map((c) => c.total);
    const maxTotal = totals.length > 0 ? Math.max(...totals) : 1;

    return Object.entries(counts).map(([name, stat]) => {
      const coords = getCoordinates(name) as [number, number];
      const pct = stat.total / maxTotal;

      let riskLevel: "CRITICAL" | "HIGH" | "MEDIUM" | "LOW" = "LOW";
      if (pct >= 0.75) riskLevel = "CRITICAL";
      else if (pct >= 0.45) riskLevel = "HIGH";
      else if (pct >= 0.2) riskLevel = "MEDIUM";

      return {
        name,
        coords,
        riskLevel,
        stats: `${stat.lost} lost & ${stat.found} found reports currently in database.`,
        advice: getDynamicAdvice(name, riskLevel),
      };
    });
  }, [allItems]);

  // 1. Real GPS Geolocation Tracking
  useEffect(() => {
    if (!gpsEnabled) {
      setRealLocation(null);
      return;
    }

    if (!navigator.geolocation) {
      alert("Geolocation is not supported by your browser");
      setGpsEnabled(false);
      return;
    }

    const watchId = navigator.geolocation.watchPosition(
      (position) => {
        setRealLocation([position.coords.latitude, position.coords.longitude]);
      },
      (error) => {
        console.error("GPS Tracking Error:", error);
        setGpsEnabled(false);
      },
      { enableHighAccuracy: true }
    );

    return () => navigator.geolocation.clearWatch(watchId);
  }, [gpsEnabled]);

  // 2. Active Coordinate Distance checking loop
  useEffect(() => {
    if (!activeCoords) {
      setCurrentDistances({});
      return;
    }

    const distances: Record<string, number> = {};
    let triggeredZone: Hotspot | null = null;

    HOTSPOTS.forEach((spot) => {
      const distance = calculateDistance(activeCoords[0], activeCoords[1], spot.coords[0], spot.coords[1]);
      distances[spot.name] = distance;

      // 40 meters proximity threshold for building entrance
      if (distance < 40) {
        triggeredZone = spot;
      }
    });

    setCurrentDistances(distances);

    if (triggeredZone) {
      const zoneName = (triggeredZone as Hotspot).name;
      // If we haven't dismissed this zone yet in this session, trigger alert
      if (!dismissedAlerts[zoneName]) {
        setActiveAlert(triggeredZone);
        // Mobile Haptic Feedback Simulation
        if ("vibrate" in navigator) {
          navigator.vibrate([200, 100, 200]);
        }
      }
    } else {
      // Clear alert if we leave all zones
      setActiveAlert(null);
    }
  }, [activeCoords, dismissedAlerts, HOTSPOTS]);

  // 3. Simulating Locations
  const handleSimulateLocation = (zoneName: string) => {
    setSimulatedZoneName(zoneName);
    if (zoneName === "Outside Campus") {
      setSimulatedLocation(null);
      setActiveAlert(null);
      return;
    }

    const spot = HOTSPOTS.find((h) => h.name === zoneName);
    if (spot) {
      // Teleport right inside the zone (10 meters offset to trigger)
      setSimulatedLocation([spot.coords[0] + 0.00005, spot.coords[1] + 0.00005]);
      // Reset dismissed state for this specific zone so it alerts again
      setDismissedAlerts((prev) => ({ ...prev, [spot.name]: false }));

      // AUTO CLOSE the simulator panel so the warning card is fully visible!
      setIsSimulatorExpanded(false);
    }
  };

  const handleDismissAlert = () => {
    if (activeAlert) {
      setDismissedAlerts((prev) => ({ ...prev, [activeAlert.name]: true }));
      setActiveAlert(null);
    }
  };

  const getRiskTheme = (level: string) => {
    switch (level) {
      case "CRITICAL":
        return {
          border: "border-red-500/30",

          badge: "bg-red-500/10 text-red-400 border-red-500/20",
          statsBg: "bg-red-950/30 border-red-500/15",
          textAccent: "text-red-400",
          dotColor: "bg-red-500",
          topBar: "from-red-500 to-red-700",
          labelText: "CRITICAL RISK",
          textColor: "text-red-400"
        };
      case "HIGH":
        return {
          border: "border-amber-500/30",

          badge: "bg-amber-500/10 text-amber-400 border-amber-500/20",
          statsBg: "bg-amber-950/30 border-amber-500/15",
          textAccent: "text-amber-400",
          dotColor: "bg-amber-500",
          topBar: "from-amber-500 to-amber-700",
          labelText: "HIGH RISK",
          textColor: "text-amber-400"
        };
      case "MEDIUM":
        return {
          border: "border-yellow-500/30",
          badge: "bg-yellow-500/10 text-yellow-400 border-yellow-500/20",
          statsBg: "bg-yellow-950/30 border-yellow-500/15",
          textAccent: "text-yellow-400",
          dotColor: "bg-yellow-500",
          topBar: "from-yellow-500 to-yellow-700",
          labelText: "MEDIUM RISK",
          textColor: "text-yellow-400"
        };
      default:
        return {
          border: "border-emerald-500/30",
          badge: "bg-emerald-500/10 text-emerald-400 border-emerald-500/20",
          statsBg: "bg-emerald-950/30 border-emerald-500/15",
          textAccent: "text-emerald-400",
          dotColor: "bg-emerald-500",
          topBar: "from-emerald-500 to-emerald-700",
          labelText: "LOW RISK",
          textColor: "text-emerald-400"
        };
    }
  };

  const theme = activeAlert ? getRiskTheme(activeAlert.riskLevel) : null;

  return (
    <>
      {/* ── 1. Floating GPS Simulator Control Panel ── */}
      <div className="fixed bottom-20 right-6 z-[100] flex flex-col items-end gap-3 pointer-events-none">

        {/* Expanded Simulator Panel */}
        {isSimulatorExpanded && (
          <div className="pointer-events-auto w-72 sm:w-80 bg-gray-900/90 backdrop-blur-xl border border-white/10 p-5 rounded-2xl shadow-2xl shadow-black/80 flex flex-col gap-4 animate-fadeIn">
            <div className="flex items-center justify-between border-b border-white/5 pb-3">
              <div className="flex items-center gap-2">
                <FaSatellite className="text-cyan-400 animate-pulse" size={15} />
                <h4 className="text-white text-xs font-black uppercase tracking-wider">GPS Hotspot Simulator</h4>
              </div>
              <button
                onClick={() => setIsSimulatorExpanded(false)}
                className="text-gray-500 hover:text-white transition-colors"
              >
                <FaTimes size={12} />
              </button>
            </div>

            {/* Simulated Locations Select */}
            <div className="flex flex-col gap-1.5">
              <label className="text-[9px] font-black text-gray-500 uppercase tracking-widest">
                Select Simulated Position
              </label>
              <select
                value={simulatedZoneName}
                onChange={(e) => handleSimulateLocation(e.target.value)}
                className="w-full bg-gray-800/80 border border-gray-700 rounded-xl px-3 py-2.5 text-white text-xs focus:outline-none focus:ring-2 focus:ring-cyan-500/50"
              >
                <option value="Outside Campus">Outside NBSC Campus (No Alert)</option>
                {HOTSPOTS.map((h) => (
                  <option key={h.name} value={h.name}>
                    Teleport into {h.name}
                  </option>
                ))}
              </select>
            </div>

            {/* Real GPS Toggle */}
            <div className="flex items-center justify-between bg-white/[0.02] border border-white/5 p-3 rounded-xl">
              <div className="flex flex-col">
                <span className="text-xs font-bold text-white leading-none">Use Real Device GPS</span>
                <span className="text-[9px] text-gray-500 mt-1 font-medium">Tracks active physical location</span>
              </div>
              <button
                onClick={() => {
                  setGpsEnabled(!gpsEnabled);
                  if (!gpsEnabled) handleSimulateLocation("Outside Campus");
                }}
                className={`w-11 h-6 rounded-full p-1 transition-all duration-300 ${gpsEnabled ? "bg-cyan-500" : "bg-gray-800"
                  }`}
              >
                <div className={`w-4 h-4 rounded-full bg-white transition-transform duration-300 ${gpsEnabled ? "translate-x-5" : "translate-x-0"
                  }`} />
              </button>
            </div>

            {/* Live GPS / Hotspot Distances Dashboard */}
            <div className="bg-black/25 rounded-xl p-3 border border-white/5 space-y-2">
              <p className="text-[9px] font-black text-gray-500 uppercase tracking-widest border-b border-white/5 pb-1">
                Active Telemetry
              </p>

              <div className="flex items-center justify-between text-[10px]">
                <span className="text-gray-400">Position Status:</span>
                <span className={`font-bold ${simulatedLocation ? "text-cyan-400" : gpsEnabled ? "text-emerald-400 animate-pulse" : "text-gray-500"}`}>
                  {simulatedLocation ? " Simulated GPS" : gpsEnabled ? " Real GPS Active" : " GPS Offline"}
                </span>
              </div>

              {activeCoords ? (
                <>
                  <div className="flex items-center justify-between text-[10px]">
                    <span className="text-gray-400">Active Coordinates:</span>
                    <span className="font-mono text-gray-300">
                      {activeCoords[0].toFixed(5)}, {activeCoords[1].toFixed(5)}
                    </span>
                  </div>

                  <div className="space-y-1.5 pt-1.5 border-t border-white/5 max-h-40 overflow-y-auto custom-scrollbar">
                    <p className="text-[9px] font-bold text-gray-500 uppercase">AI-Hotspot Distances:</p>
                    {HOTSPOTS.length === 0 ? (
                      <p className="text-[10px] text-gray-500 italic py-1">No active reports on campus.</p>
                    ) : (
                      HOTSPOTS.map((spot) => {
                        const dist = currentDistances[spot.name];
                        const isNear = dist < 40;
                        return (
                          <div key={spot.name} className="flex justify-between items-center text-[10px] gap-2">
                            <span className="text-gray-400 truncate max-w-[150px]">{spot.name}:</span>
                            <span className={`font-mono font-bold shrink-0 ${isNear ? "text-red-400" : "text-gray-300"}`}>
                              {dist !== undefined ? `${dist.toFixed(0)}m` : "Checking..."} {isNear && ""}
                            </span>
                          </div>
                        );
                      })
                    )}
                  </div>
                </>
              ) : (
                <p className="text-[10px] text-gray-500 text-center py-2 italic">
                  Turn on Device GPS or select a simulated position to test proximity.
                </p>
              )}
            </div>
          </div>
        )}

        {/* Floating Bubble Trigger */}
        <button
          type="button"
          onClick={() => setIsSimulatorExpanded(!isSimulatorExpanded)}
          className={`pointer-events-auto p-3.5 rounded-full bg-cyan-600 hover:bg-cyan-500 text-white shadow-2xl transition-all duration-300 hover:scale-105 active:scale-95 flex items-center justify-center border-2 border-white/20
            ${isSimulatorExpanded ? "rotate-90 bg-gray-800 border-cyan-500" : "animate-bounce"}`}
          title="Toggle Proximity Alert Simulator"
        >
          <FaSatellite size={16} />
        </button>
      </div>

      {/* ── 2. Real-time Proximity Warning Alert Banner ── */}
      {activeAlert && theme && (
        <div className="fixed top-24 sm:top-20 left-1/2 -translate-x-1/2 z-[90] w-[calc(100%-1.5rem)] xs:w-[calc(100%-2rem)] max-w-md pointer-events-none animate-slideDown">
          <div className={`pointer-events-auto bg-gray-950/95 backdrop-blur-md border ${theme.border} p-4 sm:p-5 rounded-2xl shadow-2xl flex flex-col gap-4 relative overflow-hidden`}>

            {/* Top Linear Gradient Accenting the Danger Level */}
            <div className={`absolute top-0 left-0 right-0 h-[3.5px] bg-gradient-to-r ${theme.topBar}`} />

            <div className="flex gap-4 items-start">


              {/* Title & Content */}
              <div className="flex-1 min-w-0">
                <div className="flex flex-col">
                  <h3 className="text-white text-[13px] sm:text-[14px] font-black uppercase tracking-wider leading-none">
                    High-Risk Hotspot Entry
                  </h3>
                  <div className="mt-1.5 flex items-center gap-1.5">
                    <span className={`w-1.5 h-1.5 rounded-full ${theme.dotColor} animate-ping shrink-0`} />
                    <span className={`text-[9px] font-black uppercase tracking-widest ${theme.textColor}`}>
                      {theme.labelText}
                    </span>
                  </div>
                </div>

                <p className="text-gray-300 text-[11px] sm:text-xs mt-3 leading-relaxed">
                  You have entered the <span className={`font-black ${theme.textAccent}`}>{activeAlert.name}</span> proximity zone.
                </p>

                {/* AI Statistics Callout Box */}
                <div className={`${theme.statsBg} rounded-xl p-3 flex gap-2.5 mt-3.5 border border-white/5 items-start`}>
                  <FaExclamationCircle className={`${theme.textAccent} shrink-0 mt-0.5`} size={13} />
                  <div className="min-w-0">
                    <p className={`text-[9px] font-black uppercase tracking-widest ${theme.textColor}`}>
                      AI Crime & Loss Stats
                    </p>
                    <p className="text-gray-200 text-[10.5px] leading-relaxed mt-1 font-semibold">
                      {activeAlert.stats}
                    </p>
                  </div>
                </div>

                {/* Safety Advice Pro-Tip */}
                <div className="mt-4 flex gap-2 items-start">
                  <span className="shrink-0 text-xs mt-0.5"></span>
                  <p className="text-gray-400 text-[10.5px] leading-relaxed">
                    <span className="text-white font-bold">Pro-Tip:</span> {activeAlert.advice}
                  </p>
                </div>
              </div>
            </div>

            {/* Actions Button */}
            <div className="border-t border-white/5 pt-3.5 mt-1 flex justify-end">
              <button
                onClick={handleDismissAlert}
                className="w-full sm:w-auto px-6 py-2.5 bg-white/5 hover:bg-white/10 border border-white/10 hover:border-white/20 text-white text-[11px] font-black uppercase tracking-wider rounded-xl transition-all duration-200 active:scale-95 text-center shadow-lg shadow-black/30"
              >
                I'll be careful
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
