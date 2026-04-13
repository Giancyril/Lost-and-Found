// Predefined coordinate map for NBSC campus locations
// Update these coordinates to match your actual campus map
export const CAMPUS_COORDINATES: Record<string, [number, lat: number]> = {
  // ── Buildings ──
  "library":              [8.3542, 124.8612],
  "canteen":              [8.3538, 124.8615],
  "gymnasium":            [8.3535, 124.8618],
  "chapel":               [8.3540, 124.8608],
  "administration":       [8.3545, 124.8610],
  "admin":                [8.3545, 124.8610],
  "registrar":            [8.3544, 124.8611],
  "swdc":                 [8.3536, 124.8620],
  "sas":                  [8.3543, 124.8613],
  "sas office":           [8.3543, 124.8613],
  "clinic":               [8.3541, 124.8609],
  "cashier":              [8.3546, 124.8611],

  // ── Rooms / Floors ──
  "room 205":             [8.3540, 124.8614],
  "room 101":             [8.3539, 124.8613],
  "room 102":             [8.3539, 124.8614],
  "room 103":             [8.3539, 124.8615],
  "room 201":             [8.3540, 124.8613],
  "room 202":             [8.3540, 124.8614],
  "room 203":             [8.3540, 124.8615],
  "room 301":             [8.3541, 124.8613],
  "room 302":             [8.3541, 124.8614],

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
  "cafeteria":            [8.3538, 124.8616],
  "grandstand":           [8.3534, 124.8619],
  "basketball court":     [8.3535, 124.8617],
  "court":                [8.3535, 124.8617],

  // ── Colleges / Departments ──
  "college of engineering":         [8.3542, 124.8618],
  "college of education":           [8.3544, 124.8616],
  "college of arts and sciences":   [8.3541, 124.8615],
  "college of business":            [8.3543, 124.8617],
  "ite building":                   [8.3540, 124.8619],
  "ics":                            [8.3540, 124.8619],

  // ── Default fallback — center of campus ──
  "unknown":              [8.3540, 124.8614],
};

// Campus center for initial map view
export const CAMPUS_CENTER: [number, number] = [8.3540, 124.8614];
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
    const roomKey = `room ${roomMatch[1]}`;
    if (CAMPUS_COORDINATES[roomKey]) return CAMPUS_COORDINATES[roomKey];
    // Unknown room — place near building center with small offset
    return [CAMPUS_CENTER[0] + Math.random() * 0.0002, CAMPUS_CENTER[1] + Math.random() * 0.0002];
  }

  return null;
};