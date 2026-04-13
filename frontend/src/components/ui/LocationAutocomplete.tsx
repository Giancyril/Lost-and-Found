import { useState, useRef, useEffect } from "react";
import { CAMPUS_COORDINATES } from "../../utils/campusLocations";

interface LocationAutocompleteProps {
  value: string;
  onChange: (val: string) => void;
  onBlur?: () => void;
  error?: string;
  placeholder?: string;
  className?: string;
}

// Generate common room suggestions for better UX
const ROOM_SUGGESTIONS = [
  ...Array.from({ length: 10 }, (_, i) => `SWDC Building - Room ${201 + i}`),
  ...Array.from({ length: 20 }, (_, i) => `Business Admin - Room ${301 + i}`),
];

// All eligible keys from the coordinate map, formatted for display
const BASE_SUGGESTIONS = Object.keys(CAMPUS_COORDINATES)
  .filter(k => k !== "unknown" && k.length > 2) // Filter out "unknown" and very short aliases
  .map(k => k.split(' ').map(word => word.charAt(0).toUpperCase() + word.slice(1)).join(' '));

const ALL_SUGGESTIONS = Array.from(new Set([...BASE_SUGGESTIONS, ...ROOM_SUGGESTIONS])).sort();

const LocationAutocomplete = ({
  value,
  onChange,
  onBlur,
  error,
  placeholder = "e.g. Library, Room 205",
  className = ""
}: LocationAutocompleteProps) => {
  const [isOpen, setIsOpen] = useState(false);
  const [filtered, setFiltered] = useState<string[]>([]);
  const [activeIndex, setActiveIndex] = useState(-1);
  const containerRef = useRef<HTMLDivElement>(null);

  // Handle typing filtering
  useEffect(() => {
    if (value.trim().length > 0) {
      const search = value.toLowerCase();
      const matches = ALL_SUGGESTIONS.filter(s => 
        s.toLowerCase().includes(search)
      ).slice(0, 8); // Limit to top 8
      setFiltered(matches);
      // Don't auto-open if it's already an exact match (user just selected it)
      if (matches.length === 1 && matches[0] === value) {
        setIsOpen(false);
      }
    } else {
      setFiltered([]);
    }
  }, [value]);

  // Click outside listener
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (!isOpen) return;

    if (e.key === "ArrowDown") {
      setActiveIndex(prev => (prev < filtered.length - 1 ? prev + 1 : prev));
      e.preventDefault();
    } else if (e.key === "ArrowUp") {
      setActiveIndex(prev => (prev > 0 ? prev - 1 : 0));
      e.preventDefault();
    } else if (e.key === "Enter" && activeIndex >= 0) {
      onChange(filtered[activeIndex]);
      setIsOpen(false);
      e.preventDefault();
    } else if (e.key === "Escape") {
      setIsOpen(false);
    }
  };

  const selectSuggestion = (suggestion: string) => {
    onChange(suggestion);
    setIsOpen(false);
    setActiveIndex(-1);
  };

  return (
    <div className="relative w-full" ref={containerRef} onKeyDown={handleKeyDown}>
      <input
        type="text"
        value={value}
        onChange={(e) => {
          onChange(e.target.value);
          setIsOpen(true);
        }}
        onFocus={() => {
          if (value.trim().length > 0 && filtered.length > 0) setIsOpen(true);
        }}
        onBlur={onBlur}
        placeholder={placeholder}
        className={className}
      />

      {/* Dropdown UI */}
      {isOpen && filtered.length > 0 && (
        <div className="absolute z-50 w-full mt-1 bg-gray-900 border border-gray-700 rounded-xl shadow-2xl overflow-hidden animate-in fade-in slide-in-from-top-1 duration-200">
          <div className="p-1.5 max-h-60 overflow-y-auto">
            {filtered.map((suggestion, idx) => (
              <div
                key={suggestion}
                onClick={() => selectSuggestion(suggestion)}
                onMouseEnter={() => setActiveIndex(idx)}
                className={`flex items-center gap-3 px-3 py-2.5 rounded-lg cursor-pointer transition-colors ${
                  idx === activeIndex 
                    ? "bg-blue-600 text-white" 
                    : "text-gray-300 hover:bg-gray-800"
                }`}
              >
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={idx === activeIndex ? "text-blue-100" : "text-gray-500"}>
                  <path d="M20 10c0 6-8 12-8 12s-8-6-8-12a8 8 0 0 1 16 0Z" /><circle cx="12" cy="10" r="3" />
                </svg>
                <span className="text-sm font-medium">{suggestion}</span>
              </div>
            ))}
          </div>
          <div className="bg-gray-800/50 px-3 py-1.5 border-t border-gray-700/50">
             <p className="text-[10px] text-gray-500 uppercase tracking-widest font-semibold flex items-center gap-1.5">
               <span className="w-1 h-1 bg-blue-500 rounded-full animate-pulse"></span>
               Campus Locations
             </p>
          </div>
        </div>
      )}
    </div>
  );
};

export default LocationAutocomplete;
