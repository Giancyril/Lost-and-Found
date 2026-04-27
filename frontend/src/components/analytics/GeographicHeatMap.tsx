import React from 'react';
import { MapContainer, TileLayer, CircleMarker, Popup } from 'react-leaflet';
import 'leaflet/dist/leaflet.css';
import { FaMapMarkerAlt, FaInfoCircle } from 'react-icons/fa';

interface GeographicHeatMapProps {
  data?: any[];
  isLoading?: boolean;
}

const GeographicHeatMap: React.FC<GeographicHeatMapProps> = ({ data = [], isLoading }) => {
  // Coordinates derived from plus code 9V59+X6X, Kihare, Manolo Fortich, Bukidnon
  // 9V59+X6X decodes to approximately 8.3656°N, 124.8656°E
  const campusCenter: [number, number] = [8.3656, 124.8656];

  const campusLocations: Record<string, [number, number]> = {
    'Main Building':        [8.3660, 124.8652],
    'Library':              [8.3654, 124.8660],
    'Science Laboratory':   [8.3648, 124.8655],
    'Gymnasium':            [8.3663, 124.8665],
    'Student Center':       [8.3651, 124.8648],
    'Administration':       [8.3657, 124.8643],
    'Covered Court':        [8.3668, 124.8658],
    'Canteen':              [8.3644, 124.8662],
  };

  // Default mock data when none is provided
  const defaultData = Object.entries(campusLocations).map(([name]) => ({
    location: name,
    activityScore: Math.floor(Math.random() * 18) + 2,
    lostItemCount: Math.floor(Math.random() * 8),
    foundItemCount: Math.floor(Math.random() * 10),
  }));

  const displayData = data.length > 0 ? data : defaultData;

  return (
    <div className="bg-gray-900 border border-white/5 rounded-2xl overflow-hidden h-full flex flex-col">
      <div className="flex items-center justify-between px-5 py-4 border-b border-white/5">
        <div>
          <h3 className="text-white text-sm font-semibold flex items-center gap-2">
            <FaMapMarkerAlt className="text-red-400" size={12} />
            Campus Activity Map
          </h3>
          <p className="text-gray-500 text-xs mt-0.5">
            Kihare, Manolo Fortich, Bukidnon · lost &amp; found hotspots
          </p>
        </div>
      </div>

      <div className="flex-1 relative min-h-[400px]">
        {isLoading ? (
          <div className="absolute inset-0 flex items-center justify-center text-gray-600 text-sm">
            Mapping campus data...
          </div>
        ) : (
          <MapContainer
            center={campusCenter}
            zoom={18}
            style={{
              height: '100%',
              width: '100%',
              filter: 'invert(100%) hue-rotate(180deg) brightness(85%) contrast(85%) saturate(0.7)',
            }}
            scrollWheelZoom={false}
          >
            <TileLayer
              attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
              url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
            />

            {displayData.map((item: any, i: number) => {
              const coords: [number, number] =
                campusLocations[item.location] ||
                [
                  campusCenter[0] + (Math.random() * 0.004 - 0.002),
                  campusCenter[1] + (Math.random() * 0.004 - 0.002),
                ];
              const radius = Math.min(22, Math.max(8, item.activityScore * 1.3));
              const isHigh = item.activityScore > 10;

              return (
                <CircleMarker
                  key={i}
                  center={coords}
                  radius={radius}
                  pathOptions={{
                    fillColor: isHigh ? '#f87171' : '#facc15',
                    color: isHigh ? '#ef4444' : '#f59e0b',
                    weight: 1.5,
                    fillOpacity: 0.55,
                  }}
                >
                  <Popup>
                    <div style={{ fontFamily: 'sans-serif', minWidth: 140 }}>
                      <p style={{ fontWeight: 700, marginBottom: 4, borderBottom: '1px solid #e5e7eb', paddingBottom: 4 }}>
                        {item.location}
                      </p>
                      <p style={{ fontSize: 11, color: '#6b7280', margin: '2px 0' }}>
                        Activity Score: <strong>{item.activityScore}</strong>
                      </p>
                      <p style={{ fontSize: 11, color: '#6b7280', margin: '2px 0' }}>
                        Lost: <strong>{item.lostItemCount}</strong> &nbsp;·&nbsp; Found: <strong>{item.foundItemCount}</strong>
                      </p>
                    </div>
                  </Popup>
                </CircleMarker>
              );
            })}
          </MapContainer>
        )}

        {/* Legend */}
        <div className="absolute bottom-4 right-4 bg-gray-900/95 border border-white/10 px-3 py-2.5 rounded-xl z-[1000] shadow-2xl backdrop-blur-sm">
          <p className="text-[9px] font-semibold text-gray-500 uppercase tracking-widest mb-2 flex items-center gap-1">
            <FaInfoCircle size={8} /> Activity Level
          </p>
          <div className="space-y-1.5">
            <div className="flex items-center gap-2">
              <div className="w-2.5 h-2.5 rounded-full bg-red-400 opacity-70" />
              <span className="text-[10px] text-gray-400">High (&gt;10)</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-2.5 h-2.5 rounded-full bg-yellow-400 opacity-70" />
              <span className="text-[10px] text-gray-400">Moderate</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default GeographicHeatMap;