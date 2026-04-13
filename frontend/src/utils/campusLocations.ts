// Predefined coordinate map for NBSC campus locations
// Update these coordinates to match your actual campus map
export const CAMPUS_COORDINATES: Record<string, [number, number]> = {
  // ── Buildings ──
  "library":              [8.359250, 124.867972],
  "canteen":              [8.359417, 124.868389],
  "gymnasium":            [8.360000, 124.868861],
  "chapel":               [8.3540, 124.8608],
  "administration":       [8.3545, 124.8610],
  "admin":                [8.3545, 124.8610],
  "registrar":            [8.3544, 124.8611],
  "swdc":                 [8.360139, 124.867389],
  "sas":                  [8.3543, 124.8613],
  "sas office":           [8.3543, 124.8613],
  "clinic":               [8.3541, 124.8609],
  "cashier":              [8.3546, 124.8611],

  // ── Rooms / Floors ──
  // (Mapped dynamically in getCoordinates)


  // ── Areas ──
  "parking lot":          [8.3533, 124.8616],
  "parking":              [8.3533, 124.8616],
  "entrance":             [8.3532, 124.8612],
  "gate":                 [8.3531, 124.8612],
  "quadrangle":           [8.3538, 124.8613],
  "quad":                 [8.3538, 124.8613],
  "corridor":             [8.3539, 124.8612],
  "hallway":              [8.3539, 124.8612],
  "comfort room":         [8.3537, 124.8611],
  "cr":                   [8.3537, 124.8611],
  "restroom":             [8.3537, 124.8611],
  "cafeteria":            [8.359417, 124.868389],
  "grandstand":           [8.3534, 124.8619],
  "basketball court":     [8.360000, 124.868861],
  "court":                [8.360000, 124.868861],
  "field":                [8.359778, 124.868333],
  "oval":                 [8.359778, 124.868333],

  // ── Colleges / Departments ──
  "college of engineering":         [8.3542, 124.8618],
  "college of education":           [8.3544, 124.8616],
  "college of arts and sciences":   [8.3541, 124.8615],
  "college of business":            [8.359083, 124.868472],
  "business administration":        [8.359083, 124.868472],
  "ite building":                   [8.3540, 124.8619],
  "ics":                            [8.3540, 124.8619],

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
