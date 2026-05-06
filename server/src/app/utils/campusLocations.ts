export const CAMPUS_COORDINATES: Record<string, [number, number]> = {
  // ── Buildings ──
  "library":              [8.359281, 124.867780],
  "canteen":              [8.359419, 124.868418],
  "admin":                [8.360750, 124.869363],
  "registrar":            [8.359873, 124.867330],
  "swdc":                 [8.360139, 124.867389],
  "clinic":               [8.359184, 124.868153],
  "cashier":              [8.360674, 124.869340],

  // ── Rooms / Floors ──
  // (Mapped dynamically in getCoordinates)

  // ── Areas ──
  "parking lot":          [8.360900, 124.867650],
  "parking":              [8.360900, 124.867650],
  "entrance":             [8.361211, 124.867778],
  "gate":                 [8.361242, 124.867601],
  "cafeteria":            [8.359424, 124.868400],
  "basketball court":     [8.360030, 124.868857],
  "court":                [8.360030, 124.868857],
  "field":                [8.359778, 124.868333],
  "oval":                 [8.359778, 124.868333],

  // ── Colleges / Departments ──
  "business administration":        [8.359024, 124.868586],
  "ics building":                   [8.361053, 124.868808],

  // ── Default fallback — center of campus ──
  "unknown":              [8.3596, 124.8682],
};

// Campus center for initial map view
export const CAMPUS_CENTER: [number, number] = [8.3596, 124.8682];
export const CAMPUS_ZOOM = 17;

// Fuzzy match — finds best coordinate for a location string
export const getCoordinates = (location: string): [number, number] | null => {
  const lower = location.toLowerCase().trim();

  // Exact match
  if (CAMPUS_COORDINATES[lower]) return CAMPUS_COORDINATES[lower];

  // Partial match — check if any key is contained in the location string
  for (const [key, coords] of Object.entries(CAMPUS_COORDINATES)) {
    if (lower.includes(key) || key.includes(lower)) return coords;
  }

  // Room number pattern — e.g. "Room 205", "Rm 101"
  const roomMatch = lower.match(/(?:room|rm\.?)\s*(\d+)/i);
  if (roomMatch) {
    const num = parseInt(roomMatch[1], 10);

    // Dynamic Range Mapping
    // SWDC Building: Rooms 201 - 210
    if (num >= 201 && num <= 210) return CAMPUS_COORDINATES["swdc"];
    // Business Administration: Rooms 301 - 320
    if (num >= 301 && num <= 320) return CAMPUS_COORDINATES["college of business"];

    const roomKey = `room ${num}`;
    if (CAMPUS_COORDINATES[roomKey]) return CAMPUS_COORDINATES[roomKey];
    
    // Unknown room — place near building center with small offset
    return [CAMPUS_CENTER[0] + Math.random() * 0.0002, CAMPUS_CENTER[1] + Math.random() * 0.0002];
  }

  return null;
};