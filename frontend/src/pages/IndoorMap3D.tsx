
import { useMemo, useState, useEffect, createContext, useContext } from "react";
import { Canvas, useFrame, useThree } from "@react-three/fiber";
import {
  OrbitControls,
  PerspectiveCamera,
  Text,
  ContactShadows,
  Environment,
  Float,
} from "@react-three/drei";
import * as THREE from "three";
import { useRef } from "react";

// ─────────────────────────────────────────────────────────────────────────────
// Architectural Configuration (units ≈ meters)
// ─────────────────────────────────────────────────────────────────────────────
const ROOM_W = 2.2;                 // along X (width of one room)
const ROOM_D = 2.4;                 // along Z (depth of one room)
const ROOM_H = 2.4;                 // wall height per floor
const LOBBY_W = 2.8;                // central lobby width (X)
const CORRIDOR_W = 1.4;             // front balcony corridor width (Z)
const WALL_T = 0.06;
const SLAB_T = 0.18;
const ROOMS_PER_WING = 5;
const WING_W = ROOMS_PER_WING * ROOM_W;
const CORNER_SPACE = 2.5; // Tightened for a compact, efficient stairwell
const TOTAL_W = 2 * (WING_W + CORNER_SPACE) + LOBBY_W;
const BUILDING_DEPTH = ROOM_D + CORRIDOR_W;
const FLOOR_HEIGHT = ROOM_H + SLAB_T;
const FLOORS = 3;
const TOTAL_HEIGHT = FLOORS * FLOOR_HEIGHT;
const DOOR_W = 0.55;
const DOOR_H = 1.7;

// Light minimal architectural palette
const PALETTE = {
  ground: "#d8ddd2",
  groundEdge: "#c5cdbd",
  plaza: "#ece9e0",
  path: "#e2dfd5",
  slab: "#ebe7df",
  slabEdge: "#cfcabe",
  wallActive: "#ffffff",
  wallDim: "#dadcdc",
  divider: "#e6e2d8",
  door: "#94a3b8",
  doorActive: "#3b82f6",
  doorSelected: "#1d4ed8",
  doorFrame: "#64748b",
  selectedTint: "#3b82f6",
  hoverTint: "#60a5fa",
  itemMarker: "#f59e0b",
  itemGlow: "#fbbf24",
  coreShaft: "#9aa3ad",
  coreAccent: "#475569",
  stair: "#b6bcc4",
  roof: "#d2d6dc",
  parapet: "#bfc4c9",
  glass: "#a8c5d6",
  text: "#1e293b",
  textDim: "#94a3b8",
  accentBlue: "#1e40af", // Professional blue trim
};

// Night-mode palette overrides
const NIGHT_PALETTE = {
  ground: "#1c2233",
  groundEdge: "#141927",
  plaza: "#252b3d",
  path: "#2c334a",
  slab: "#2d3346",
  slabEdge: "#1d2233",
  wallActive: "#454d65",
  wallDim: "#2a3045",
  divider: "#2f3548",
  door: "#5b6478",
  doorActive: "#60a5fa",
  doorSelected: "#3b82f6",
  doorFrame: "#3a4258",
  selectedTint: "#60a5fa",
  hoverTint: "#93c5fd",
  itemMarker: "#fbbf24",
  itemGlow: "#fde68a",
  coreShaft: "#3a4258",
  coreAccent: "#5b6478",
  stair: "#1e293b",
  roof: "#0f172a",
  parapet: "#1e293b",
  glass: "#fcd34d", // warm interior glow at night
  text: "#e2e8f0",
  textDim: "#64748b",
  accentBlue: "#3b82f6", // Brighter blue for night
};

const usePalette = (isNight: boolean) =>
  useMemo(() => (isNight ? NIGHT_PALETTE : PALETTE), [isNight]);

// ─────────────────────────────────────────────────────────────────────────────
// Theme Context (so 3D components can read palette + night flag)
// ─────────────────────────────────────────────────────────────────────────────
type Palette = typeof PALETTE;
const ThemeContext = createContext<{ palette: Palette; isNight: boolean }>({
  palette: PALETTE,
  isNight: false,
});
const useTheme = () => useContext(ThemeContext);

// ─────────────────────────────────────────────────────────────────────────────
// Helpers
// ─────────────────────────────────────────────────────────────────────────────
const floorIdxFromId = (id: string | null): number | null => {
  if (!id) return null;
  if (id.startsWith("Floor-")) return parseInt(id.split("-")[1], 10) - 1;
  if (id.startsWith("SC-")) return parseInt(id.charAt(3), 10) - 1;
  return null;
};

interface RoomLayout {
  id: string;
  floorIdx: number;
  side: "L" | "R";
  col: number;
  x: number;
  z: number;
}

const buildLayout = (): RoomLayout[] => {
  const rooms: RoomLayout[] = [];
  for (let f = 0; f < FLOORS; f++) {
    const prefix = `${f + 1}`;
    // Left Wing (Rooms 01 - 05)
    for (let i = 0; i < ROOMS_PER_WING; i++) {
      const num = i + 1;
      const id = `SC-${prefix}0${num}`;
      // index 0 is far left, index 4 is next to lobby
      const x = -(LOBBY_W / 2 + (ROOMS_PER_WING - i - 0.5) * ROOM_W);
      rooms.push({ id, floorIdx: f, side: "L", col: i, x, z: -CORRIDOR_W / 2 });
    }
    // Right Wing (Rooms 06 - 10)
    for (let i = 0; i < ROOMS_PER_WING; i++) {
      const num = i + 6;
      const numStr = num < 10 ? `0${num}` : `${num}`;
      const id = `SC-${prefix}${numStr}`;
      // index 0 is next to lobby, index 4 is far right
      const x = +(LOBBY_W / 2 + (i + 0.5) * ROOM_W);
      rooms.push({ id, floorIdx: f, side: "R", col: i, x, z: -CORRIDOR_W / 2 });
    }
  }
  return rooms;
};

// ─────────────────────────────────────────────────────────────────────────────
// Room furniture (rendered only when room is selected)
// ─────────────────────────────────────────────────────────────────────────────
const RoomFurniture = ({
  x,
  z,
  baseY,
  side,
}: {
  x: number;
  z: number;
  baseY: number;
  side: "L" | "R";
}) => {
  const { palette, isNight } = useTheme();
  // All rooms face the front balcony corridor (+z)
  const facing = 1;
  const deskColor = isNight ? "#5b6478" : "#cdb89a";
  const deskTopColor = isNight ? "#2f3548" : "#9c8a73";
  const chairColor = isNight ? "#3a4258" : "#475569";
  const screenColor = isNight ? "#fde68a" : "#1e293b";
  const screenEmissive = isNight ? "#fbbf24" : "#000000";
  const screenIntensity = isNight ? 1.4 : 0;

  // 2 desks per room, arranged perpendicular to corridor
  const deskOffsets: [number, number][] = [
    [-ROOM_W * 0.22, ROOM_D * 0.18 * facing],
    [+ROOM_W * 0.22, ROOM_D * 0.18 * facing],
  ];

  return (
    <group>
      {deskOffsets.map(([dx, dz], i) => {
        const dWorld: [number, number, number] = [x + dx, baseY, z + dz];
        return (
          <group key={`desk-${i}`} position={dWorld}>
            {/* desk top */}
            <mesh position={[0, 0.55, 0]} castShadow receiveShadow>
              <boxGeometry args={[0.7, 0.05, 0.45]} />
              <meshStandardMaterial color={deskTopColor} roughness={0.7} />
            </mesh>
            {/* desk legs (single pedestal block for simplicity) */}
            <mesh position={[0, 0.27, 0]} castShadow receiveShadow>
              <boxGeometry args={[0.62, 0.55, 0.38]} />
              <meshStandardMaterial color={deskColor} roughness={0.85} />
            </mesh>
            {/* monitor */}
            <mesh position={[0, 0.78, -0.12 * facing]} castShadow>
              <boxGeometry args={[0.35, 0.22, 0.025]} />
              <meshStandardMaterial
                color={screenColor}
                emissive={screenEmissive}
                emissiveIntensity={screenIntensity}
                roughness={0.4}
              />
            </mesh>
            {/* monitor stand */}
            <mesh position={[0, 0.62, -0.1 * facing]}>
              <boxGeometry args={[0.07, 0.12, 0.04]} />
              <meshStandardMaterial color={chairColor} />
            </mesh>
            {/* chair (offset toward corridor side) */}
            <group position={[0, 0, 0.5 * facing]}>
              {/* seat */}
              <mesh position={[0, 0.42, 0]} castShadow>
                <boxGeometry args={[0.4, 0.06, 0.4]} />
                <meshStandardMaterial color={chairColor} roughness={0.6} />
              </mesh>
              {/* back */}
              <mesh
                position={[0, 0.7, 0.18 * facing]}
                castShadow
              >
                <boxGeometry args={[0.4, 0.5, 0.06]} />
                <meshStandardMaterial color={chairColor} roughness={0.6} />
              </mesh>
              {/* leg pole */}
              <mesh position={[0, 0.21, 0]}>
                <cylinderGeometry args={[0.04, 0.04, 0.42, 8]} />
                <meshStandardMaterial color={chairColor} />
              </mesh>
              {/* base */}
              <mesh position={[0, 0.04, 0]}>
                <cylinderGeometry args={[0.18, 0.22, 0.06, 16]} />
                <meshStandardMaterial color={chairColor} />
              </mesh>
            </group>
          </group>
        );
      })}
      {/* small rug under desks for warmth */}
      <mesh
        position={[x, baseY + 0.005, z]}
        rotation={[-Math.PI / 2, 0, 0]}
        receiveShadow
      >
        <planeGeometry args={[ROOM_W * 0.78, ROOM_D * 0.7]} />
        <meshStandardMaterial
          color={isNight ? "#3b4665" : "#e2dfd5"}
          roughness={0.95}
        />
      </mesh>
    </group>
  );
};

// ─────────────────────────────────────────────────────────────────────────────
// Reusable Wall
// ─────────────────────────────────────────────────────────────────────────────
const Wall = ({
  position,
  size,
  color,
  opacity,
}: {
  position: [number, number, number];
  size: [number, number, number];
  color: string;
  opacity: number;
}) => (
  <mesh position={position} castShadow receiveShadow>
    <boxGeometry args={size} />
    <meshStandardMaterial
      color={color}
      transparent={opacity < 1}
      opacity={opacity}
      roughness={0.85}
      metalness={0.05}
    />
  </mesh>
);

// ─────────────────────────────────────────────────────────────────────────────
// Floor Shell – walls, dividers, doors
// ─────────────────────────────────────────────────────────────────────────────
interface FloorShellProps {
  floorIdx: number;
  isActive: boolean;
  isTopFloor: boolean;
}

const FloorShell = ({ floorIdx, isActive, isTopFloor }: FloorShellProps) => {
  const { palette } = useTheme();
  const y = floorIdx * FLOOR_HEIGHT;
  const wallColor = isActive ? palette.wallActive : palette.wallDim;
  const wallOpacity = isActive ? 1 : 0.08;
  const slabOpacity = isActive ? 1 : 0.35;
  const wallY = y + SLAB_T + ROOM_H / 2;
  const halfDepth = BUILDING_DEPTH / 2;

  return (
    <group>
      {/* ── Floor slab - Split into sections to create stair openings ── */}
      {/* Central Wing Slab (Rooms) */}
      <mesh position={[0, y + SLAB_T / 2, -0.05]} receiveShadow castShadow>
        <boxGeometry args={[TOTAL_W - (CORNER_SPACE * 2), SLAB_T, BUILDING_DEPTH + 0.3]} />
        <meshStandardMaterial color={palette.slab} transparent={!isActive} opacity={slabOpacity} roughness={0.9} />
      </mesh>
      {/* Corner Slabs (Providing a floor around the stairs but leaving a hole) */}
      {[-1, 1].map(side => (
        <mesh key={`corner-slab-${side}`} position={[side * (TOTAL_W / 2 - CORNER_SPACE / 2), y + SLAB_T / 2, -halfDepth + 0.4]} receiveShadow castShadow>
          <boxGeometry args={[CORNER_SPACE, SLAB_T, BUILDING_DEPTH - 0.8]} />
          <meshStandardMaterial color={palette.slab} transparent={!isActive} opacity={slabOpacity} />
        </mesh>
      ))}

      {/* Corner landings removed to keep facade clear */}
      {/* slab trim */}
      {/* slab trim - Full width but recessed */}
      <mesh position={[0, y + SLAB_T + 0.001, -0.05]} receiveShadow>
        <boxGeometry args={[TOTAL_W + 0.5, 0.005, BUILDING_DEPTH + 0.3]} />
        <meshStandardMaterial
          color={palette.slabEdge}
          transparent={!isActive}
          opacity={slabOpacity}
        />
      </mesh>

      {/* ── Outer walls (Back and End walls) ────────────────────────────── */}
      {/* Back wall (Main wings) */}
      <Wall
        position={[0, wallY, -halfDepth]}
        size={[TOTAL_W - (CORNER_SPACE * 2), ROOM_H, WALL_T]}
        color={wallColor}
        opacity={wallOpacity}
      />
      {/* End walls of the wings (separating rooms from stairs) */}
      <Wall
        position={[-(TOTAL_W / 2 - CORNER_SPACE), wallY, -CORRIDOR_W / 2]}
        size={[WALL_T, ROOM_H, ROOM_D + CORRIDOR_W]}
        color={wallColor}
        opacity={wallOpacity}
      />
      <Wall
        position={[TOTAL_W / 2 - CORNER_SPACE, wallY, -CORRIDOR_W / 2]}
        size={[WALL_T, ROOM_H, ROOM_D + CORRIDOR_W]}
        color={wallColor}
        opacity={wallOpacity}
      />

      {/* ── Solid Stairwell Enclosure (Always visible) ───────────────── */}
      {/* Back walls of corners */}
      {[-1, 1].map(side => (
        <mesh key={`corner-back-${side}`} position={[side * (TOTAL_W / 2 - CORNER_SPACE / 2), wallY, -halfDepth]}>
          <boxGeometry args={[CORNER_SPACE, ROOM_H, WALL_T]} />
          <meshStandardMaterial color={palette.wallActive} transparent opacity={isActive ? 1 : 0.4} />
        </mesh>
      ))}
      {/* Side walls of corners (the very ends) */}
      {[-1, 1].map(side => (
        <mesh key={`corner-end-${side}`} position={[side * (TOTAL_W / 2), wallY, -CORRIDOR_W / 2]}>
          <boxGeometry args={[WALL_T, ROOM_H, BUILDING_DEPTH]} />
          <meshStandardMaterial color={palette.wallActive} transparent opacity={isActive ? 1 : 0.4} />
        </mesh>
      ))}

      {/* Blue trim band around building facade - Restricted to room areas */}
      <mesh position={[0, y + SLAB_T / 2, halfDepth + 0.01]} castShadow>
        <boxGeometry args={[TOTAL_W - (CORNER_SPACE * 2) + 0.08, SLAB_T + 0.02, 0.05]} />
        <meshStandardMaterial color={palette.accentBlue} />
      </mesh>



      {/* ── Floor internal walls ─────────────────────────────────────────── */}
      {/* Dividers for Left Wing */}
      {Array.from({ length: ROOMS_PER_WING + 1 }).map((_, i) => {
        const x = -(LOBBY_W / 2 + i * ROOM_W);
        return (
          <Wall
            key={`div-l-${i}`}
            position={[x, wallY, -CORRIDOR_W / 2]}
            size={[WALL_T, ROOM_H, ROOM_D]}
            color={wallColor}
            opacity={wallOpacity}
          />
        );
      })}
      {/* Dividers for Right Wing */}
      {Array.from({ length: ROOMS_PER_WING + 1 }).map((_, i) => {
        const x = +(LOBBY_W / 2 + i * ROOM_W);
        return (
          <Wall
            key={`div-r-${i}`}
            position={[x, wallY, -CORRIDOR_W / 2]}
            size={[WALL_T, ROOM_H, ROOM_D]}
            color={wallColor}
            opacity={wallOpacity}
          />
        );
      })}

      {/* ── Front Walls with Door Openings (Wing Rooms) ─────────────────── */}
      {/* Left Wing Front Walls */}
      {Array.from({ length: ROOMS_PER_WING }).map((_, i) => {
        const x = -(LOBBY_W / 2 + (i + 0.5) * ROOM_W);
        const z = -CORRIDOR_W / 2 + ROOM_D / 2;
        const segW = (ROOM_W - DOOR_W) / 2;
        return (
          <group key={`fw-l-${i}`}>
            <Wall position={[x - (DOOR_W / 2 + segW / 2), wallY, z]} size={[segW, ROOM_H, WALL_T]} color={wallColor} opacity={wallOpacity} />
            <Wall position={[x + (DOOR_W / 2 + segW / 2), wallY, z]} size={[segW, ROOM_H, WALL_T]} color={wallColor} opacity={wallOpacity} />
            <Wall position={[x, y + SLAB_T + DOOR_H + (ROOM_H - DOOR_H) / 2, z]} size={[DOOR_W, ROOM_H - DOOR_H, WALL_T]} color={wallColor} opacity={wallOpacity} />
          </group>
        );
      })}
      {/* Right Wing Front Walls */}
      {Array.from({ length: ROOMS_PER_WING }).map((_, i) => {
        const x = +(LOBBY_W / 2 + (i + 0.5) * ROOM_W);
        const z = -CORRIDOR_W / 2 + ROOM_D / 2;
        const segW = (ROOM_W - DOOR_W) / 2;
        return (
          <group key={`fw-r-${i}`}>
            <Wall position={[x - (DOOR_W / 2 + segW / 2), wallY, z]} size={[segW, ROOM_H, WALL_T]} color={wallColor} opacity={wallOpacity} />
            <Wall position={[x + (DOOR_W / 2 + segW / 2), wallY, z]} size={[segW, ROOM_H, WALL_T]} color={wallColor} opacity={wallOpacity} />
            <Wall position={[x, y + SLAB_T + DOOR_H + (ROOM_H - DOOR_H) / 2, z]} size={[DOOR_W, ROOM_H - DOOR_H, WALL_T]} color={wallColor} opacity={wallOpacity} />
          </group>
        );
      })}

      {/* ── Lobby Feature (Entrance Canopy & Signage) ─────────────────── */}
      {/* Restrict to upper floors only as requested */}
      {floorIdx > 0 && (
        <group position={[0, y + SLAB_T + 0.1, halfDepth + 1.2]}>
          <mesh castShadow receiveShadow>
            <boxGeometry args={[LOBBY_W + 1.2, 0.4, 2.4]} />
            <meshStandardMaterial color="#ffffff" metalness={0.1} roughness={0.5} />
          </mesh>
          {/* Silver edge trim for canopy */}
          <mesh position={[0, 0, 1.2]} castShadow>
            <boxGeometry args={[LOBBY_W + 1.22, 0.42, 0.05]} />
            <meshStandardMaterial color="#94a3b8" metalness={0.5} roughness={0.2} />
          </mesh>
        </group>
      )}

      {/* Vertical Fins in Central Section - Restrict to upper floors */}
      {floorIdx > 0 && Array.from({ length: 14 }).map((_, i) => {
        const x = -(LOBBY_W / 2 - 0.4) + (i * (LOBBY_W - 0.8) / 13);
        const finH = ROOM_H + 1.2; // Raised
        return (
          <mesh key={`vfin-${i}`} position={[x, wallY + 0.6, halfDepth + 0.05]} castShadow>
            <boxGeometry args={[0.04, finH, 0.4]} />
            <meshStandardMaterial color="#64748b" metalness={0.3} roughness={0.4} />
          </mesh>
        );
      })}

      {/* Corridor Railings (Front) - Restricted to room areas, Ladder takes over corners */}
      <group position={[0, y + SLAB_T + 0.4, halfDepth + 0.35]}>
        {/* Horizontal rails */}
        {[0, 0.4, 0.8].map(ry => (
          <mesh key={`rail-h-${ry}`} position={[0, ry, 0]}>
            <boxGeometry args={[TOTAL_W - (CORNER_SPACE * 2) - 0.1, 0.02, 0.02]} />
            <meshStandardMaterial color="#94a3b8" metalness={0.8} roughness={0.2} />
          </mesh>
        ))}
        {/* Vertical balusters */}
        {Array.from({ length: 32 }).map((_, i) => {
          const innerW = TOTAL_W - (CORNER_SPACE * 2) - 0.2;
          return (
            <mesh key={`bal-${i}`} position={[-(innerW / 2) + (i * innerW / 31), 0.4, 0]}>
              <boxGeometry args={[0.02, 0.8, 0.02]} />
              <meshStandardMaterial color="#94a3b8" metalness={0.8} roughness={0.2} />
            </mesh>
          );
        })}
      </group>

      {/* Round support columns as seen in photo */}
      {[-1.8, 1.8].map(sx => (
        <mesh key={`col-${sx}`} position={[sx, wallY, halfDepth + 0.25]} castShadow>
          <cylinderGeometry args={[0.18, 0.18, ROOM_H, 16]} />
          <meshStandardMaterial color="#ffffff" />
        </mesh>
      ))}

      {/* ── Windows on outer back walls (one per room) ────────────────── */}
      {/* Left Wing Windows */}
      {Array.from({ length: ROOMS_PER_WING }).map((_, i) => {
        const x = -(LOBBY_W / 2 + (i + 0.5) * ROOM_W);
        const z = -halfDepth;
        const sillH = 0.55;
        const headerH = 0.35;
        const winH = ROOM_H - sillH - headerH;
        const winW = ROOM_W * 0.78;
        const winY = y + SLAB_T + sillH + winH / 2;
        return (
          <group key={`win-l-${i}`}>
            <mesh position={[x, winY, z - 0.025]} castShadow>
              <boxGeometry args={[winW, winH, 0.02]} />
              <meshStandardMaterial color={palette.glass} transparent opacity={isActive ? 0.55 : 0.18} roughness={0.08} metalness={0.45} emissive={palette.glass} emissiveIntensity={isActive ? 0.18 : 0.04} />
            </mesh>
            <mesh position={[x, y + SLAB_T + sillH - 0.04, z - 0.03]}><boxGeometry args={[winW + 0.12, 0.08, 0.07]} /><meshStandardMaterial color={palette.parapet} transparent={!isActive} opacity={wallOpacity} /></mesh>
          </group>
        );
      })}
      {/* Right Wing Windows */}
      {Array.from({ length: ROOMS_PER_WING }).map((_, i) => {
        const x = +(LOBBY_W / 2 + (i + 0.5) * ROOM_W);
        const z = -halfDepth;
        const sillH = 0.55;
        const winH = ROOM_H - sillH - 0.35;
        const winW = ROOM_W * 0.78;
        const winY = y + SLAB_T + sillH + winH / 2;
        return (
          <group key={`win-r-${i}`}>
            <mesh position={[x, winY, z - 0.025]} castShadow>
              <boxGeometry args={[winW, winH, 0.02]} />
              <meshStandardMaterial color={palette.glass} transparent opacity={isActive ? 0.55 : 0.18} roughness={0.08} metalness={0.45} emissive={palette.glass} emissiveIntensity={isActive ? 0.18 : 0.04} />
            </mesh>
            <mesh position={[x, y + SLAB_T + sillH - 0.04, z - 0.03]}><boxGeometry args={[winW + 0.12, 0.08, 0.07]} /><meshStandardMaterial color={palette.parapet} transparent={!isActive} opacity={wallOpacity} /></mesh>
          </group>
        );
      })}

      {/* ── End-wall vertical window strips - Restricted to room areas ── */}
      {[-1, 1].map((sx) => (
        <group key={`endwin-${sx}`}>
          <mesh position={[sx * (TOTAL_W / 2 - CORNER_SPACE), y + SLAB_T + ROOM_H / 2, -CORRIDOR_W / 2]} castShadow>
            <boxGeometry args={[0.02, ROOM_H * 0.7, ROOM_D * 0.8]} />
            <meshStandardMaterial color={palette.glass} transparent opacity={isActive ? 0.5 : 0.16} roughness={0.08} metalness={0.45} emissive={palette.glass} emissiveIntensity={isActive ? 0.15 : 0.03} />
          </mesh>
        </group>
      ))}

      {/* ── Roof slab on top floor ──────────────────────────────────────── */}
      {isTopFloor && (
        <group>
          {/* Main roof - Full width coverage for rooms and stairs */}
          <mesh position={[0, y + SLAB_T + ROOM_H + SLAB_T / 2, -0.05]} castShadow receiveShadow>
            <boxGeometry args={[TOTAL_W + 0.6, SLAB_T, BUILDING_DEPTH + 0.3]} />
            <meshStandardMaterial color={palette.roof} roughness={0.95} />
          </mesh>

          {/* Raised Central Roof Section */}
          <mesh position={[0, y + SLAB_T + ROOM_H + 0.8, 0]} castShadow receiveShadow>
            <boxGeometry args={[LOBBY_W + 0.6, 1.2, BUILDING_DEPTH + 0.8]} />
            <meshStandardMaterial color={palette.roof} roughness={0.9} />
          </mesh>
          <mesh position={[0, y + SLAB_T + ROOM_H + 1.45, 0]}>
            <boxGeometry args={[LOBBY_W + 1.0, 0.1, BUILDING_DEPTH + 1.0]} />
            <meshStandardMaterial color={palette.accentBlue} />
          </mesh>

          {/* Parapet edges - Full width but recessed */}
          {[
            [0, 0, halfDepth + 0.3, TOTAL_W + 0.5, 0.2, 0.06], // Front
            [0, 0, -halfDepth - 0.3, TOTAL_W + 0.5, 0.2, 0.06], // Back
          ].map((p, idx) => (
            <mesh key={`parapet-${idx}`} position={[p[0], y + SLAB_T + ROOM_H + SLAB_T + 0.1, p[2]]} receiveShadow>
              <boxGeometry args={[p[3], p[4], p[5]]} />
              <meshStandardMaterial color={palette.parapet} />
            </mesh>
          ))}
        </group>
      )}
    </group>
  );
};
// ─────────────────────────────────────────────────────────────────────────────
// Room hitbox + visual highlight + door panel
// ─────────────────────────────────────────────────────────────────────────────
interface RoomTileProps {
  layout: RoomLayout;
  isActiveFloor: boolean;
  isSelected: boolean;
  isHovered: boolean;
  hasItems: boolean;
  itemCount: number;
  foundCount?: number;
  lostCount?: number;
  onHover: (id: string | null) => void;
  onClick: (id: string) => void;
}

const RoomTile = ({
  layout,
  isActiveFloor,
  isSelected,
  isHovered,
  hasItems,
  itemCount,
  foundCount = 0,
  lostCount = 0,
  onHover,
  onClick,
}: RoomTileProps) => {
  const { palette } = useTheme();
  const y = layout.floorIdx * FLOOR_HEIGHT + SLAB_T + ROOM_H / 2;
  const baseY = layout.floorIdx * FLOOR_HEIGHT + SLAB_T;
  const halfDepth = BUILDING_DEPTH / 2;
  const roomZ = -halfDepth + ROOM_D / 2;
  const corridorZ = halfDepth - CORRIDOR_W / 2;
  const wallZ = roomZ + ROOM_D / 2; // Z position of the front wall of the room

  const tint = isSelected ? palette.selectedTint : isHovered ? palette.hoverTint : null;
  const tintOpacity = isSelected ? 0.35 : isHovered ? 0.22 : 0;
  const opacityMod = isActiveFloor ? 1 : 0.15; // Deeper room dimming

  return (
    <group>
      {/* invisible hitbox covering the room volume */}
      <mesh
        position={[layout.x, y, roomZ]}
        onPointerOver={(e) => { e.stopPropagation(); onHover(layout.id); document.body.style.cursor = "pointer"; }}
        onPointerOut={(e) => { e.stopPropagation(); onHover(null); document.body.style.cursor = "auto"; }}
        onClick={(e) => { e.stopPropagation(); onClick(layout.id); }}
        visible={tint !== null}
      >
        <boxGeometry args={[ROOM_W - 0.1, ROOM_H - 0.1, ROOM_D - 0.1]} />
        <meshStandardMaterial color={tint ?? "#ffffff"} transparent opacity={tintOpacity * opacityMod} emissive={tint ?? "#000000"} emissiveIntensity={isSelected ? 0.35 : 0.15} />
      </mesh>

      {/* furniture appears when the room is selected */}
      {isSelected && (
        <RoomFurniture x={layout.x} z={roomZ} baseY={baseY} side={layout.side} />
      )}

      {/* door panel */}
      <mesh position={[layout.x, baseY + DOOR_H / 2, wallZ + (WALL_T * 0.5)]} castShadow>
        <boxGeometry args={[DOOR_W * 0.92, DOOR_H, WALL_T * 0.5]} />
        <meshStandardMaterial color={isSelected ? palette.doorSelected : isActiveFloor ? palette.door : palette.doorFrame} transparent={!isActiveFloor} opacity={isActiveFloor ? 1 : 0.35} roughness={0.6} emissive={isSelected ? palette.doorSelected : "#000000"} emissiveIntensity={isSelected ? 0.4 : 0} />
      </mesh>
      {/* door knob */}
      <mesh position={[layout.x + DOOR_W * 0.32, baseY + DOOR_H / 2, wallZ + (WALL_T * 1.1)]}>
        <sphereGeometry args={[0.04, 12, 12]} />
        <meshStandardMaterial color="#fbbf24" metalness={0.6} roughness={0.3} />
      </mesh>

      {/* room number plaque on door */}
      <Text
        position={[layout.x, baseY + DOOR_H + 0.18, wallZ + (WALL_T * 1.15)]}
        rotation={[0, 0, 0]}
        fontSize={0.13}
        color={isActiveFloor ? palette.text : palette.textDim}
        anchorX="center"
        anchorY="middle"
        fillOpacity={isActiveFloor ? 1 : 0.4}
      >
        {layout.id.replace("SC-", "")}
      </Text>

      {/* item markers float above selected/active rooms */}
      {hasItems && isActiveFloor && (
        <group position={[layout.x, baseY + ROOM_H + 0.55, roomZ]}>
          {/* Lost Item Pin (Red) */}
          {lostCount > 0 && (
            <Float speed={4} rotationIntensity={1.5} floatIntensity={1.5}>
              <group position={[foundCount > 0 ? -0.22 : 0, 0, 0]}>
                <mesh castShadow>
                  <sphereGeometry args={[0.13, 18, 18]} />
                  <meshStandardMaterial color="#ef4444" emissive="#f87171" emissiveIntensity={2.8} />
                </mesh>
                <Text position={[0, 0, 0.18]} fontSize={0.12} color="#ffffff" anchorX="center" anchorY="middle" fontWeight="bold">
                  {lostCount}
                </Text>
                <mesh position={[0, -0.18, 0]}>
                  <coneGeometry args={[0.04, 0.18, 12]} />
                  <meshStandardMaterial color="#ef4444" emissive="#ef4444" emissiveIntensity={1.2} />
                </mesh>
              </group>
            </Float>
          )}

          {/* Found Item Pin (Emerald) */}
          {foundCount > 0 && (
            <Float speed={3.5} rotationIntensity={1.5} floatIntensity={1.4}>
              <group position={[lostCount > 0 ? 0.22 : 0, 0, 0]}>
                <mesh castShadow>
                  <sphereGeometry args={[0.13, 18, 18]} />
                  <meshStandardMaterial color="#10b981" emissive="#34d399" emissiveIntensity={2.8} />
                </mesh>
                <Text position={[0, 0, 0.18]} fontSize={0.12} color="#ffffff" anchorX="center" anchorY="middle" fontWeight="bold">
                  {foundCount}
                </Text>
                <mesh position={[0, -0.18, 0]}>
                  <coneGeometry args={[0.04, 0.18, 12]} />
                  <meshStandardMaterial color="#10b981" emissive="#10b981" emissiveIntensity={1.2} />
                </mesh>
              </group>
            </Float>
          )}
        </group>
      )}
    </group>
  );
};

// ─────────────────────────────────────────────────────────────────────────────
// Staircase Component (Placed at wings/corners)
// ─────────────────────────────────────────────────────────────────────────────
// Corner Facade ('The Ladder')
// ─────────────────────────────────────────────────────────────────────────────
const CornerFacade = ({ x }: { x: number }) => {
  const { palette } = useTheme();
  const halfDepth = BUILDING_DEPTH / 2;
  // Ladder starts from second floor (FLOOR_HEIGHT)
  const ladderStartY = FLOOR_HEIGHT;
  const ladderHeight = TOTAL_HEIGHT - FLOOR_HEIGHT;
  const ladderCenterY = ladderStartY + ladderHeight / 2;

  return (
    <group position={[x, 0, halfDepth + 0.45]}>
      {/* Vertical poles - Starting from 2nd floor */}
      <mesh position={[-CORNER_SPACE / 2 + 0.2, ladderCenterY, 0]}>
        <boxGeometry args={[0.1, ladderHeight + 0.4, 0.1]} />
        <meshStandardMaterial color="#2563eb" metalness={0.6} roughness={0.3} />
      </mesh>
      <mesh position={[CORNER_SPACE / 2 - 0.2, ladderCenterY, 0]}>
        <boxGeometry args={[0.1, ladderHeight + 0.4, 0.1]} />
        <meshStandardMaterial color="#2563eb" metalness={0.6} roughness={0.3} />
      </mesh>

      {/* Dense horizontal bars - Only above ground floor */}
      {Array.from({ length: 12 }).map((_, i) => (
        <mesh key={`hbar-${i}`} position={[0, ladderStartY + (i + 0.5) * (ladderHeight / 11), 0]}>
          <boxGeometry args={[CORNER_SPACE, 0.03, 0.03]} />
          <meshStandardMaterial color="#f1f5f9" metalness={0.8} roughness={0.2} />
        </mesh>
      ))}
    </group>
  );
};

// ─────────────────────────────────────────────────────────────────────────────
// Half-turn (U-shaped) staircase
// ─────────────────────────────────────────────────────────────────────────────
const Staircase = ({ x, z, mirrored = false }: { x: number; z: number; mirrored?: boolean }) => {
  const { palette } = useTheme();
  const stepsPerFlight = 8;
  // Total rise must equal FLOOR_HEIGHT to arrive flush at the next level
  const totalRise = FLOOR_HEIGHT;
  const stepH = totalRise / (stepsPerFlight * 2);
  const stepD = 0.22;
  const landingY = stepsPerFlight * stepH;
  const flightW = 0.7;
  const startZ = BUILDING_DEPTH / 2 - 0.3; // start near front wall

  // Mirror the flight positions if needed
  const flight1X = mirrored ? -(flightW / 2 + 0.05) : (flightW / 2 + 0.05);
  const flight2X = mirrored ? (flightW / 2 + 0.05) : -(flightW / 2 + 0.05);

  return (
    <group position={[x, 0, z]}>
      {Array.from({ length: FLOORS - 1 }).map((_, f) => {
        // Stairs start exactly at the current floor's slab surface
        const baseY = f * FLOOR_HEIGHT + (f === 0 ? 0 : SLAB_T);
        // They must rise to reach the NEXT floor's slab surface
        const targetY = (f + 1) * FLOOR_HEIGHT + SLAB_T;
        const currentTotalRise = targetY - baseY;
        const currentStepH = currentTotalRise / (stepsPerFlight * 2);

        const maxZ = startZ;
        const flightDepth = stepsPerFlight * stepD;
        const currentLandingY = stepsPerFlight * currentStepH;

        return (
          <group key={`stair-set-${f}`} position={[0, baseY, 0]}>
            {/* First flight — front to back */}
            {Array.from({ length: stepsPerFlight }).map((_, s) => (
              <mesh
                key={`s1-${s}`}
                position={[
                  flight1X,
                  (s + 1) * currentStepH - currentStepH / 2,
                  maxZ - (s + 0.5) * stepD,
                ]}
                castShadow receiveShadow>
                <boxGeometry args={[flightW, currentStepH, stepD]} />
                <meshStandardMaterial color={palette.stair} />
              </mesh>
            ))}

            {/* Landing - bridging the two flights */}
            <mesh
              position={[0, currentLandingY - 0.05, maxZ - flightDepth - 0.3]}
              receiveShadow castShadow>
              <boxGeometry args={[flightW * 2 + 0.2, 0.1, 0.6]} />
              <meshStandardMaterial color={palette.coreAccent} />
            </mesh>

            {/* Second flight — back to front */}
            {Array.from({ length: stepsPerFlight }).map((_, s) => (
              <mesh
                key={`s2-${s}`}
                position={[
                  flight2X,
                  currentLandingY + (s + 1) * currentStepH - currentStepH / 2,
                  maxZ - flightDepth - 0.3 + (s + 0.5) * stepD,
                ]}
                castShadow receiveShadow>
                <boxGeometry args={[flightW, currentStepH, stepD]} />
                <meshStandardMaterial color={palette.stair} />
              </mesh>
            ))}
          </group>
        );
      })}
    </group>
  );
};

// ─────────────────────────────────────────────────────────────────────────────
// Central core: elevator shaft (placed at X=0)
// ─────────────────────────────────────────────────────────────────────────────
const CentralCore = ({
  activeFloorIdx,
  onFloorClick,
  selectedFloorId,
}: {
  activeFloorIdx: number | null;
  onFloorClick: (id: string) => void;
  selectedFloorId: string | null;
}) => {
  const { palette } = useTheme();
  const coreX = 0;
  const coreZ = 0;
  const shaftW = 1.0;
  const shaftD = 1.2;

  return (
    <group position={[coreX, 0, coreZ]}>
      {/* base pad */}
      <mesh position={[0, -SLAB_T / 2, 0]} receiveShadow>
        <boxGeometry args={[LOBBY_W - 0.2, SLAB_T, 3.0]} />
        <meshStandardMaterial color={palette.plaza} />
      </mesh>

      {/* Elevator shaft */}
      <mesh position={[0, TOTAL_HEIGHT / 2, 0]} castShadow receiveShadow>
        <boxGeometry args={[shaftW, TOTAL_HEIGHT + 0.4, shaftD]} />
        <meshStandardMaterial
          color={palette.coreShaft}
          roughness={0.45}
          metalness={0.25}
        />
      </mesh >
      {/* shaft top cap */}
      < mesh position={[0, TOTAL_HEIGHT + 0.25, 0]} >
        <boxGeometry args={[shaftW + 0.08, 0.1, shaftD + 0.08]} />
        <meshStandardMaterial color={palette.coreAccent} />
      </mesh >

      {/* Elevator doors per floor + clickable floor markers */}
      {
        Array.from({ length: FLOORS }).map((_, f) => {
          const id = `Floor-${f + 1}`;
          const isActive = f === activeFloorIdx;
          const isSelected = selectedFloorId === id;
          const yMid = f * FLOOR_HEIGHT + SLAB_T + ROOM_H / 2;
          return (
            <group key={`floor-marker-${f}`}>
              {/* elevator door */}
              <mesh
                position={[shaftW / 2 + 0.005, yMid, 0]}
                onClick={(e) => {
                  e.stopPropagation();
                  onFloorClick(id);
                }}
                onPointerOver={() => (document.body.style.cursor = "pointer")}
                onPointerOut={() => (document.body.style.cursor = "auto")}
              >
                <boxGeometry args={[0.02, ROOM_H * 0.75, shaftD * 0.7]} />
                <meshStandardMaterial
                  color={
                    isSelected
                      ? palette.doorSelected
                      : isActive
                        ? palette.doorActive
                        : palette.door
                  }
                  emissive={
                    isSelected || isActive
                      ? palette.doorActive
                      : "#000000"
                  }
                  emissiveIntensity={isSelected ? 0.6 : isActive ? 0.3 : 0}
                  metalness={0.6}
                  roughness={0.3}
                />
              </mesh>
              {/* floor number plate */}
              <Text
                position={[shaftW / 2 + 0.06, yMid + ROOM_H * 0.45, 0]}
                fontSize={0.18}
                color={isActive ? palette.text : palette.textDim}
                anchorX="left"
                anchorY="middle"
                rotation={[0, Math.PI / 2, 0]}
              >
                {`F${f + 1}`}
              </Text>
            </group>
          );
        })
      }
    </group >
  );
};

// ─────────────────────────────────────────────────────────────────────────────
// Ground / Landscape
// ─────────────────────────────────────────────────────────────────────────────
const Landscape = () => {
  const { palette, isNight } = useTheme();
  const halfDepth = BUILDING_DEPTH / 2;
  return (
    <group position={[0, -SLAB_T - 0.06, 0]}>
      {/* grass */}
      <mesh rotation={[-Math.PI / 2, 0, 0]} receiveShadow>
        <circleGeometry args={[26, 64]} />
        <meshStandardMaterial color={palette.ground} roughness={1} />
      </mesh>
      {/* grass darker ring */}
      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, 0.001, 0]}>
        <ringGeometry args={[20, 26, 64]} />
        <meshStandardMaterial color={palette.groundEdge} roughness={1} />
      </mesh>
      {/* concrete plaza around building */}
      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, 0.005, 0]}>
        <planeGeometry args={[TOTAL_W + 6, BUILDING_DEPTH + 4]} />
        <meshStandardMaterial color={palette.plaza} roughness={0.95} />
      </mesh>
      {/* main entrance pathway extending south (front) */}
      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, 0.008, halfDepth + 4]}>
        <planeGeometry args={[2.8, 8]} />
        <meshStandardMaterial color={palette.path} roughness={0.95} />
      </mesh>
      {/* Round trees for life */}
      {[
        [-TOTAL_W / 2 - 4, 0, halfDepth + 2],
        [TOTAL_W / 2 + 4, 0, halfDepth + 2],
        [TOTAL_W / 2 + 5, 0, -halfDepth - 3],
        [-TOTAL_W / 2 - 5, 0, -halfDepth - 3],
      ].map((p, i) => (
        <group key={`tree-${i}`} position={[p[0], 0, p[2]]}>
          <mesh position={[0, 0.35, 0]} castShadow>
            <cylinderGeometry args={[0.08, 0.1, 0.7, 8]} />
            <meshStandardMaterial color={isNight ? "#3a2e21" : "#8b6f4d"} roughness={0.9} />
          </mesh>
          <mesh position={[0, 1.2, 0]} castShadow>
            <sphereGeometry args={[0.65, 16, 16]} />
            <meshStandardMaterial color={isNight ? "#2f3a32" : "#94a487"} roughness={0.95} />
          </mesh>
        </group>
      ))}


    </group>
  );
};

// ─────────────────────────────────────────────────────────────────────────────
// Slow rotating "compass" light helper – not visible, just animates
// ─────────────────────────────────────────────────────────────────────────────
const SunLight = ({ isNight }: { isNight: boolean }) => {
  const ref = useRef<THREE.DirectionalLight>(null!);
  useFrame((state) => {
    if (!ref.current) return;
    const t = state.clock.getElapsedTime() * 0.04;
    ref.current.position.set(Math.cos(t) * 14, 18, Math.sin(t) * 14);
  });
  return (
    <directionalLight
      ref={ref}
      position={[10, 18, 8]}
      intensity={isNight ? 0.25 : 1.3}
      color={isNight ? "#9bb5ff" : "#fffbe8"}
      castShadow
      shadow-bias={-0.0005} // Fixed shadow acne
      shadow-mapSize-width={2048}
      shadow-mapSize-height={2048}
      shadow-camera-far={60}
      shadow-camera-left={-20}
      shadow-camera-right={20}
      shadow-camera-top={20}
      shadow-camera-bottom={-20}
    />
  );
};

// ─────────────────────────────────────────────────────────────────────────────
// Camera fly-to controller
// ─────────────────────────────────────────────────────────────────────────────
const DEFAULT_CAM_POS = new THREE.Vector3(18, 14, 18);
const DEFAULT_LOOK = new THREE.Vector3(0, 3, 0);

const CameraController = ({
  selectedRoomId,
  layout,
}: {
  selectedRoomId: string | null;
  layout: RoomLayout[];
}) => {
  const { camera, controls } = useThree() as any;
  const targetPos = useRef(camera.position.clone());
  const targetLook = useRef(new THREE.Vector3(0, 3, 0));
  const animating = useRef(false);

  // Stop animating if user interacts
  useEffect(() => {
    if (!controls) return;
    const onStart = () => {
      animating.current = false;
    };
    controls.addEventListener("start", onStart);
    return () => controls.removeEventListener("start", onStart);
  }, [controls]);

  useEffect(() => {
    let pos: THREE.Vector3;
    let look: THREE.Vector3;

    if (!selectedRoomId) {
      pos = DEFAULT_CAM_POS.clone();
      look = DEFAULT_LOOK.clone();
    } else if (selectedRoomId.startsWith("Floor-")) {
      const f = parseInt(selectedRoomId.split("-")[1], 10) - 1;
      const y = f * FLOOR_HEIGHT + ROOM_H / 2;
      look = new THREE.Vector3(0, y, 0);
      pos = new THREE.Vector3(15, y + 7, 15);
    } else {
      const room = layout.find((r) => r.id === selectedRoomId);
      if (!room) return;
      const y = room.floorIdx * FLOOR_HEIGHT + ROOM_H / 2;
      look = new THREE.Vector3(room.x, y, room.z);
      pos = new THREE.Vector3(room.x + 3.2, y + 3.2, room.z + 5.5);
    }

    targetPos.current.copy(pos);
    targetLook.current.copy(look);
    animating.current = true;
  }, [selectedRoomId, layout]);

  useFrame(() => {
    if (!animating.current) return;
    camera.position.lerp(targetPos.current, 0.08);
    if (controls?.target) {
      controls.target.lerp(targetLook.current, 0.08);
      controls.update();
    }
    if (
      camera.position.distanceTo(targetPos.current) < 0.01 &&
      (!controls?.target || controls.target.distanceTo(targetLook.current) < 0.01)
    ) {
      animating.current = false;
    }
  });

  return null;
};

// ─────────────────────────────────────────────────────────────────────────────
// MiniMap — 2D top-down floor plan synced with 3D selection
// ─────────────────────────────────────────────────────────────────────────────
interface MiniMapProps {
  layout: RoomLayout[];
  activeFloorIdx: number;
  selectedRoomId: string | null;
  hoveredRoom: string | null;
  onSelect: (id: string) => void;
  onHover: (id: string | null) => void;
  items: any[];
  isNight: boolean;
}

const MiniMap = ({
  layout,
  activeFloorIdx,
  selectedRoomId,
  hoveredRoom,
  onSelect,
  onHover,
  items,
  isNight,
}: MiniMapProps) => {
  const SCALE = 14;            // px per world unit
  const PAD = 16;
  const w = (TOTAL_W + 2) * SCALE + PAD * 2;
  const h = (BUILDING_DEPTH + 1.6) * SCALE + PAD * 2 + 24;

  const floorRooms = layout.filter((r) => r.floorIdx === activeFloorIdx);

  // world (X,Z) → svg (cx, cy). Building is centered on (0,0); SVG origin is top-left.
  const toX = (x: number) => PAD + (x + TOTAL_W / 2 + 1) * SCALE;
  const toY = (z: number) => PAD + 24 + (z + BUILDING_DEPTH / 2 + 0.8) * SCALE;

  const itemCount = (id: string) =>
    items.filter((it) => {
      const loc = (it?.location || "").toLowerCase();
      return (
        loc.includes(id.toLowerCase()) ||
        loc.includes(id.replace("SC-", "").toLowerCase())
      );
    }).length;

  const stroke = isNight ? "#475569" : "#cbd5e1";
  const fillRoom = isNight ? "#1e2638" : "#f1efe8";
  const corridor = isNight ? "#0f172a" : "#e6e2d8";
  const accent = "#3b82f6";
  const accentSoft = isNight ? "#1d4ed8" : "#dbeafe";
  const textCol = isNight ? "#cbd5e1" : "#475569";
  const titleCol = isNight ? "#f1f5f9" : "#0f172a";

  const halfDepth = BUILDING_DEPTH / 2;
  const roomZ = -halfDepth + ROOM_D / 2;
  const corridorZ = halfDepth - CORRIDOR_W / 2;
  const [isCollapsed, setIsCollapsed] = useState(false);

  // Auto-expand if the selection changes to a new room
  useEffect(() => {
    if (selectedRoomId) setIsCollapsed(false);
  }, [selectedRoomId]);

  if (!selectedRoomId) return null;

  return (
    <div 
      className="absolute bottom-6 left-6 pointer-events-auto" 
      data-testid="indoor-minimap"
      style={{
        animation: "slideUpFade 0.4s cubic-bezier(0.16, 1, 0.3, 1) forwards",
        transition: "all 0.6s cubic-bezier(0.16, 1, 0.3, 1)",
        transform: isCollapsed ? "scale(0.9) translateY(8px)" : "scale(1) translateY(0)",
      }}
    >
      <style>{`
        @keyframes slideUpFade {
          from { opacity: 0; transform: translateY(12px) scale(0.98); }
          to { opacity: 1; transform: translateY(0) scale(1); }
        }
      `}</style>

      <div 
        className={`backdrop-blur-md border rounded-2xl shadow-md transition-all duration-700 relative overflow-hidden ${
          isNight ? "bg-slate-900/85 border-white/10" : "bg-white/90 border-black/5"
        }`}
        style={{
          width: isCollapsed ? "32px" : `${w + 16}px`,
          height: isCollapsed ? "32px" : "auto",
          padding: isCollapsed ? "0" : "8px 8px 4px 8px",
          opacity: isCollapsed ? 0.4 : 1
        }}
      >
        {/* Toggle Button (Arrow) */}
        <button
          onClick={() => setIsCollapsed(!isCollapsed)}
          className={`absolute top-0 right-0 w-8 h-8 rounded-full flex items-center justify-center transition-all duration-300 hover:scale-110 active:scale-95 z-10 ${
            isNight ? "text-white hover:bg-white/5" : "text-slate-600 hover:bg-black/5"
          }`}
          title={isCollapsed ? "Expand Floor Plan" : "Minimize Floor Plan"}
        >
          <span 
            className="text-[10px] transition-transform duration-500" 
            style={{ 
              transform: isCollapsed ? "rotate(180deg)" : "rotate(0deg)",
              marginTop: isCollapsed ? "-1px" : "1px"
            }}
          >
            ▼
          </span>
        </button>

        <div className="transition-all duration-500" style={{ opacity: isCollapsed ? 0 : 1, visibility: isCollapsed ? "hidden" : "visible", pointerEvents: isCollapsed ? "none" : "auto" }}>
          <svg width={w} height={h} className="block">
            <text x={PAD} y={16} fontSize="10" fontWeight="700" fill={titleCol} style={{ letterSpacing: "1.5px", textTransform: "uppercase" }}>
              Floor Plan · F{activeFloorIdx + 1}
            </text>

          {/* corridor (Front) */}
          <rect x={toX(-TOTAL_W / 2)} y={toY(corridorZ - CORRIDOR_W / 2)} width={TOTAL_W * SCALE} height={CORRIDOR_W * SCALE} fill={corridor} rx={2} />

          {/* Lobby Core (Center) */}
          <rect x={toX(-LOBBY_W / 2)} y={toY(roomZ - ROOM_D / 2)} width={LOBBY_W * SCALE} height={ROOM_D * SCALE} fill={isNight ? "#475569" : "#cbd5e1"} stroke={stroke} strokeWidth={1} rx={2} />
          <text x={toX(0)} y={toY(roomZ) + 3} fontSize="8" fontWeight="700" fill={titleCol} textAnchor="middle">▼▲</text>

          {/* rooms */}
          {floorRooms.map((r) => {
            const isSel = selectedRoomId === r.id;
            const isHov = hoveredRoom === r.id;
            const x = toX(r.x - ROOM_W / 2);
            const y = toY(roomZ - ROOM_D / 2);
            const ww = ROOM_W * SCALE;
            const hh = ROOM_D * SCALE;
            const count = itemCount(r.id);
            return (
              <g key={r.id} onClick={() => onSelect(r.id)} onMouseEnter={() => onHover(r.id)} onMouseLeave={() => onHover(null)} style={{ cursor: "pointer" }}>
                <rect x={x} y={y} width={ww} height={hh} fill={isSel ? accent : isHov ? accentSoft : fillRoom} stroke={isSel ? accent : stroke} strokeWidth={isSel ? 1.5 : 1} rx={2} />
                <text x={x + ww / 2} y={y + hh / 2 + 3} fontSize="8" fontWeight="700" fill={isSel ? "#ffffff" : textCol} textAnchor="middle">{r.id.replace("SC-", "")}</text>
                {count > 0 && (
                  <g>
                    <circle cx={x + ww - 5} cy={y + 5} r={4} fill="#f59e0b" stroke={isNight ? "#0b1020" : "#ffffff"} strokeWidth={1} />
                    <text x={x + ww - 5} y={y + 7.5} fontSize="6" fontWeight="800" fill="#1e293b" textAnchor="middle">{count}</text>
                  </g>
                )}
              </g>
            );
          })}

          <text x={toX(-TOTAL_W / 2 + 1)} y={toY(-halfDepth - 0.5)} fontSize="7" fontWeight="700" fill={textCol} textAnchor="start">LEFT WING</text>
          <text x={toX(TOTAL_W / 2 - 1)} y={toY(-halfDepth - 0.5)} fontSize="7" fontWeight="700" fill={textCol} textAnchor="end">RIGHT WING</text>
          </svg>
        </div>
      </div>
    </div>
  );
};

// ─────────────────────────────────────────────────────────────────────────────
// Public API
// ─────────────────────────────────────────────────────────────────────────────
interface IndoorMap3DProps {
  onRoomSelect: (roomId: string | null) => void;
  selectedRoomId: string | null;
  items: any[];
}

const IndoorMap3D = ({
  onRoomSelect,
  selectedRoomId,
  items,
}: IndoorMap3DProps) => {
  const [hoveredRoom, setHoveredRoom] = useState<string | null>(null);
  const wallY = ROOM_H / 2 + SLAB_T;
  const halfDepth = BUILDING_DEPTH / 2;
  const [isNight, setIsNight] = useState(false);
  const palette = usePalette(isNight);

  const layout = useMemo(buildLayout, []);
  const activeFloorIdx = useMemo(
    () => floorIdxFromId(selectedRoomId) ?? 0,
    [selectedRoomId]
  );

  const getRoomItemStats = (roomId: string) => {
    const rid = roomId.toLowerCase();
    const ridShort = roomId.replace("SC-", "").toLowerCase();

    const roomItems = items.filter((item) => {
      // Fuzzy match for location strings (e.g. "SC-201" or "201" or "room 201")
      const loc = (item.foundLocation || item.location || "").toLowerCase();
      return loc === rid || loc === ridShort || loc.includes(ridShort);
    });
    return {
      foundCount: roomItems.filter((i) => i.type === "found").length,
      lostCount: roomItems.filter((i) => i.type === "lost").length,
    };
  };

  const sceneBg = isNight ? "#0b1020" : "#f4f3ee";
  const hudBg = isNight ? "bg-slate-900/80" : "bg-white/85";
  const hudBorder = isNight ? "border-white/10" : "border-black/5";
  const hudTextStrong = isNight ? "text-slate-100" : "text-slate-900";
  const hudTextSoft = isNight ? "text-slate-400" : "text-slate-500";
  const hudTextSofter = isNight ? "text-slate-500" : "text-slate-500";

  return (
    <div
      className="w-full h-full rounded-3xl overflow-hidden border relative transition-colors duration-700"
      style={{
        backgroundColor: sceneBg,
        borderColor: isNight ? "rgba(255,255,255,0.06)" : "rgba(0,0,0,0.05)",
      }}
      data-testid="indoor-map-3d"
    >
      <ThemeContext.Provider value={{ palette, isNight }}>
        <Canvas shadows dpr={[1, 2]}>
          <color attach="background" args={[sceneBg]} />
          <fog
            attach="fog"
            args={[sceneBg, 30, isNight ? 60 : 80]}
          />
          <PerspectiveCamera
            makeDefault
            position={[18, 14, 18]}
            fov={32}
          />
          <OrbitControls
            enablePan
            maxPolarAngle={Math.PI / 2.15}
            minDistance={8}
            maxDistance={36}
            makeDefault
          />

          <CameraController
            selectedRoomId={selectedRoomId}
            layout={layout}
          />

          {/* Lighting – soft architectural daylight or moonlight */}
          <ambientLight
            intensity={isNight ? 0.18 : 0.55}
            color={isNight ? "#5b6b9c" : "#fff8ec"}
          />
          <hemisphereLight
            args={[
              isNight ? "#3b4a72" : "#ffffff",
              isNight ? "#0a0d18" : "#cdd5c0",
              isNight ? 0.25 : 0.45,
            ]}
          />
          <SunLight isNight={isNight} />

          {/* Warm interior point lights at night – one per floor */}
          {isNight &&
            Array.from({ length: FLOORS }).map((_, f) => (
              <pointLight
                key={`int-l-${f}`}
                position={[0, f * FLOOR_HEIGHT + ROOM_H * 0.6, 0]}
                intensity={0.55}
                distance={TOTAL_W}
                color="#fbbf24"
              />
            ))}

          <Environment preset={isNight ? "night" : "apartment"} />

          {/* World */}
          <Landscape />

          {/* Floors */}
          {Array.from({ length: FLOORS }).map((_, f) => (
            <FloorShell
              key={`floor-${f}`}
              floorIdx={f}
              isActive={f === activeFloorIdx}
              isTopFloor={f === FLOORS - 1}
            />
          ))}



          {/* Rooms */}
          {layout.map((room) => {
            const { foundCount, lostCount } = getRoomItemStats(room.id);
            return (
              <RoomTile
                key={room.id}
                layout={room}
                isActiveFloor={room.floorIdx === activeFloorIdx}
                isSelected={selectedRoomId === room.id}
                isHovered={hoveredRoom === room.id}
                hasItems={foundCount > 0 || lostCount > 0}
                itemCount={foundCount + lostCount}
                foundCount={foundCount}
                lostCount={lostCount}
                onHover={setHoveredRoom}
                onClick={onRoomSelect}
              />
            );
          })}

          {/* Floor labels at west end */}
          {Array.from({ length: FLOORS }).map((_, f) => (
            <Text
              key={`label-${f}`}
              position={[
                -TOTAL_W / 2 - 3.2,
                f * FLOOR_HEIGHT + SLAB_T + ROOM_H / 2,
                -BUILDING_DEPTH / 2 - 0.2,
              ]}
              fontSize={0.22}
              color={f === activeFloorIdx ? palette.text : palette.textDim}
              anchorX="left"
              anchorY="middle"
              fillOpacity={f === activeFloorIdx ? 1 : 0.5}
            >
              {["Ground Floor", "Second Floor", "Third Floor"][f]}
            </Text>
          ))}

          {/* Central elevator core */}
          <CentralCore
            activeFloorIdx={activeFloorIdx}
            onFloorClick={onRoomSelect}
            selectedFloorId={selectedRoomId}
          />

          {/* Corner Facade (The Ladder structure covering the stairs) */}
          <CornerFacade x={-TOTAL_W / 2 + CORNER_SPACE / 2} />
          <CornerFacade x={TOTAL_W / 2 - CORNER_SPACE / 2} />

          {/* Corner Staircases — Clung tightly to room walls (0.8 units offset) */}
          <Staircase x={-(TOTAL_W / 2 - CORNER_SPACE + 0.8)} z={-BUILDING_DEPTH / 2 + ROOM_D * 0.5} mirrored={false} />
          <Staircase x={TOTAL_W / 2 - CORNER_SPACE + 0.8} z={-BUILDING_DEPTH / 2 + ROOM_D * 0.5} mirrored={true} />

          {/* Building name sign on roof */}
          <Text
            position={[
              0,
              FLOORS * FLOOR_HEIGHT + 0.55,
              -BUILDING_DEPTH / 2 - 0.05,
            ]}
            fontSize={0.34}
            color={palette.text}
            anchorX="center"
            anchorY="middle"
            letterSpacing={0.08}
          >
            SWDC
          </Text>

          <ContactShadows
            position={[0, -SLAB_T - 0.04, 0]} // More offset
            opacity={isNight ? 0.55 : 0.35}
            scale={40}
            blur={2.6}
            far={6}
          />
        </Canvas>
      </ThemeContext.Provider>

      {/* HUD: Title */}
      <div
        className="absolute top-6 left-6 pointer-events-none"
        data-testid="map-hud-title"
      >
        <div
          className={`${hudBg} backdrop-blur-md border ${hudBorder} px-4 py-2.5 rounded-2xl shadow-sm transition-colors duration-500`}
        >
          <h3
            className={`${hudTextStrong} font-black text-xs uppercase tracking-tighter`}
          >
            SWDC - Building
          </h3>
          <p
            className={`${hudTextSofter} text-[10px] font-medium mt-0.5`}
          >
            Drag to rotate • Scroll to zoom • Click rooms or floor doors
          </p>
        </div>
      </div>

      {/* HUD: Floor switcher + Day/Night toggle */}
      <div
        className="absolute top-6 right-6 flex flex-col gap-1.5"
        data-testid="map-hud-floors"
      >
        <button
          data-testid="day-night-toggle"
          onClick={() => setIsNight((v) => !v)}
          className={`px-3 py-1.5 rounded-xl text-[10px] font-bold uppercase tracking-widest transition-all border flex items-center justify-center gap-1.5 mb-1 ${isNight
            ? "bg-amber-400 text-slate-900 border-amber-400"
            : "bg-slate-900 text-amber-200 border-slate-900"
            }`}
          title={isNight ? "Switch to day" : "Switch to night"}
        >
          <span aria-hidden>{isNight ? "☀" : "☾"}</span>
          {isNight ? "Day" : "Night"}
        </button>
        {[3, 2, 1].map((lvl) => {
          const id = `Floor-${lvl}`;
          const isActive = activeFloorIdx === lvl - 1;
          return (
            <button
              key={id}
              data-testid={`floor-btn-${lvl}`}
              onClick={() => onRoomSelect(id)}
              className={`px-3 py-1.5 rounded-xl text-[10px] font-bold uppercase tracking-widest transition-all border ${isActive
                ? "bg-blue-600 text-white border-blue-600 shadow"
                : `${hudBg} ${hudTextSoft} ${hudBorder} hover:${hudTextStrong}`
                }`}
            >
              F{lvl}
            </button>
          );
        })}
      </div>

      {/* MiniMap overlay (bottom-left) */}
      <MiniMap
        layout={layout}
        activeFloorIdx={activeFloorIdx}
        selectedRoomId={selectedRoomId}
        hoveredRoom={hoveredRoom}
        onSelect={onRoomSelect}
        onHover={setHoveredRoom}
        items={items}
        isNight={isNight}
      />

      {/* HUD: legend */}
      <div className="absolute bottom-6 right-6 pointer-events-none">
        <div
          className={`${hudBg} backdrop-blur-md border ${hudBorder} px-4 py-2 rounded-2xl flex items-center gap-3 shadow-sm transition-colors duration-500`}
        >
          <div className="flex items-center gap-2">
            <div className="w-3 h-3 rounded-full bg-blue-500 shadow-[0_0_10px_rgba(59,130,246,0.5)]" />
            <span
              className={`text-[10px] font-bold ${hudTextSoft} uppercase tracking-widest`}
            >
              Selected
            </span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-3 h-3 rounded-full bg-amber-400 shadow-[0_0_10px_rgba(251,191,36,0.5)]" />
            <span
              className={`text-[10px] font-bold ${hudTextSoft} uppercase tracking-widest`}
            >
              Reports
            </span>
          </div>
        </div>
      </div>
    </div>
  );
};

export default IndoorMap3D;

