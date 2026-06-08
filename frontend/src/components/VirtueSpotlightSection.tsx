import React, { useState, useCallback, useEffect, useMemo, useRef } from "react";
import { FaStar, FaHeart, FaTimes } from "react-icons/fa";
import { useTransition, animated } from "@react-spring/web";
import useMeasure from "react-use-measure";
import { useGetVirtueSpotlightsQuery } from "../redux/api/api";

type Spotlight = {
  id: string;
  title: string;
  description?: string;
  imageUrl?: string;
  students: string[];
  createdAt?: string;
  likeCount?: number;
};

type SortTab = "all" | "recent" | "liked";

// ── Responsive columns ───────────────────────────────────────────────────────
const useColumns = (): number => {
  const get = () => {
    if (typeof window === "undefined") return 2;
    if (window.matchMedia("(min-width: 1024px)").matches) return 3;
    return 2;
  };
  const [cols, setCols] = useState(get);
  useEffect(() => {
    const handler = () => setCols(get);
    window.addEventListener("resize", handler);
    return () => window.removeEventListener("resize", handler);
  }, []);
  return cols;
};

// ── Like state ───────────────────────────────────────────────────────────────
const useLikes = () => {
  const [likedIds, setLikedIds] = useState<string[]>(() => {
    try { return JSON.parse(localStorage.getItem("virtue_liked_posts") || "[]"); }
    catch { return []; }
  });
  const [counts, setCounts] = useState<Record<string, number>>(() => {
    try { return JSON.parse(localStorage.getItem("virtue_like_counts") || "{}"); }
    catch { return {}; }
  });

  const likedIdsRef = useRef(likedIds);
  likedIdsRef.current = likedIds;

  const toggle = useCallback((id: string) => {
    const isLiked = likedIdsRef.current.includes(id);
    setLikedIds(prev => {
      const next = isLiked ? prev.filter(x => x !== id) : [...prev, id];
      localStorage.setItem("virtue_liked_posts", JSON.stringify(next));
      return next;
    });
    setCounts(prev => {
      const next = { ...prev, [id]: Math.max(0, (prev[id] ?? 0) + (isLiked ? -1 : 1)) };
      localStorage.setItem("virtue_like_counts", JSON.stringify(next));
      return next;
    });
  }, []);

  return { likedIds, counts, toggle };
};

// ── Avatar stack ─────────────────────────────────────────────────────────────
const AvatarStack = ({ students }: { students: string[] }) => {
  const show = students.slice(0, 3);
  return (
    <div className="flex items-center">
      {show.map((name, i) => (
        <div
          key={i}
          title={name}
          style={{ marginLeft: i === 0 ? 0 : -4, zIndex: show.length - i }}
          className="w-3.5 h-3.5 sm:w-5 sm:h-5 rounded-full bg-blue-900/80 border border-gray-900 flex items-center justify-center text-[5px] sm:text-[7px] font-bold text-blue-300 shrink-0"
        >
          {name.charAt(0).toUpperCase()}
        </div>
      ))}
      {students.length > 3 && (
        <div
          style={{ marginLeft: -4, zIndex: 0 }}
          className="w-3.5 h-3.5 sm:w-5 sm:h-5 rounded-full bg-gray-700 border border-gray-900 flex items-center justify-center text-[5px] sm:text-[7px] font-bold text-gray-300 shrink-0"
        >
          +{students.length - 3}
        </div>
      )}
    </div>
  );
};

// ── Card ─────────────────────────────────────────────────────────────────────
const SpotlightCard = ({
  spotlight, isLiked, likeCount, onLike, onOpen,
}: {
  spotlight: Spotlight; isLiked: boolean; likeCount: number;
  onLike: () => void; onOpen: () => void;
}) => (
  <div
    onClick={onOpen}
    className="group relative rounded-2xl overflow-hidden cursor-pointer border border-white/[0.06] hover:border-blue-500/40 transition-all duration-300 shadow-xl w-full"
  >
    {spotlight.imageUrl ? (
      <img
        src={spotlight.imageUrl}
        alt={spotlight.title}
        className="w-full block transition-transform duration-500 ease-out group-hover:scale-105"
        loading="lazy"
      />
    ) : (
      <div className="w-full flex items-center justify-center bg-[#0d1117]" style={{ aspectRatio: "4/3" }}>
        <FaStar size={40} className="text-blue-500/20" />
      </div>
    )}

    {/* Dark overlay on hover */}
    <div className="absolute inset-0 bg-gradient-to-t from-black/90 via-black/40 to-black/10 opacity-0 group-hover:opacity-100 transition-opacity duration-300" />

    {/* Title on hover */}
    <div className="absolute inset-x-0 bottom-9 px-2 translate-y-2 opacity-0 group-hover:translate-y-0 group-hover:opacity-100 transition-all duration-300 ease-out">
      <p className="text-white text-[9px] sm:text-[12px] font-bold leading-snug line-clamp-2 drop-shadow-lg">
        {spotlight.title}
      </p>
    </div>

    {/* Student count pill on hover */}
    {spotlight.students.length > 0 && (
      <div className="absolute top-1.5 left-1.5 -translate-y-1 opacity-0 group-hover:translate-y-0 group-hover:opacity-100 transition-all duration-300 ease-out">
        <span className="inline-flex items-center gap-0.5 px-1.5 py-0.5 sm:px-2.5 sm:py-1 bg-blue-500/90 border border-blue-400/30 rounded-full text-[7px] sm:text-[10px] text-white font-bold shadow-lg backdrop-blur-sm">
          <span>{spotlight.students.length}</span>
          <span className="hidden sm:inline"> student{spotlight.students.length !== 1 ? "s" : ""}</span>
        </span>
      </div>
    )}

    {/* Bottom bar — always visible */}
    <div className="absolute bottom-0 left-0 right-0 p-1.5 sm:p-3 flex items-center justify-between bg-gradient-to-t from-black/80 to-transparent">
      <AvatarStack students={spotlight.students} />
      <button
        type="button"
        onClick={e => { e.stopPropagation(); onLike(); }}
        className={`flex items-center gap-0.5 sm:gap-1 text-[9px] sm:text-[11px] font-bold transition-all duration-200 ${
          isLiked ? "text-red-400 scale-110" : "text-gray-300 hover:text-white hover:scale-110"
        }`}
        aria-label={isLiked ? "Unlike" : "Congratulate"}
      >
        <FaHeart size={9} className="sm:hidden" />
        <FaHeart size={11} className="hidden sm:block" />
        <span>{likeCount}</span>
      </button>
    </div>
  </div>
);

// ── Masonry Grid ──────────────────────────────────────────────────────────────
type GridItem = Spotlight & { x: number; y: number; w: number; h: number };

const CSSMasonryGrid = ({
  spotlights, likedIds, counts, onLike, onOpen, columns,
}: {
  spotlights: Spotlight[]; likedIds: string[]; counts: Record<string, number>;
  onLike: (id: string) => void; onOpen: (s: Spotlight) => void; columns: number;
}) => (
  <div style={{ columnCount: columns, columnGap: "12px" }}>
    {spotlights.map(s => (
      <div key={s.id} style={{ breakInside: "avoid", marginBottom: "12px" }}>
        <SpotlightCard
          spotlight={s}
          isLiked={likedIds.includes(s.id)}
          likeCount={counts[s.id] ?? 0}
          onLike={() => onLike(s.id)}
          onOpen={() => onOpen(s)}
        />
      </div>
    ))}
  </div>
);

const SpringMasonryGrid = ({
  spotlights, likedIds, counts, onLike, onOpen,
}: {
  spotlights: Spotlight[]; likedIds: string[]; counts: Record<string, number>;
  onLike: (id: string) => void; onOpen: (s: Spotlight) => void;
}) => {
  const [containerRef, { width }] = useMeasure();
  const columns = 3;
  const gap = 12;
  const [heights, setHeights] = useState<Record<string, number>>({});

  const handleImageLoad = useCallback((id: string, e: React.SyntheticEvent<HTMLImageElement>) => {
    const img = e.currentTarget;
    if (!width) return;
    const colWidth = (width - gap * (columns - 1)) / columns;
    setHeights(prev => {
      if (prev[id]) return prev;
      return { ...prev, [id]: colWidth * (img.naturalHeight / img.naturalWidth) };
    });
  }, [width]);

  const [gridItems, containerHeight] = useMemo<[GridItem[], number]>(() => {
    if (!width) return [[], 0];
    const colWidth = (width - gap * (columns - 1)) / columns;
    const colHeights = new Array(columns).fill(0);
    const items = spotlights.map(s => {
      const col = colHeights.indexOf(Math.min(...colHeights));
      const x = col * (colWidth + gap);
      const y = colHeights[col];
      const h = heights[s.id] ?? colWidth * 0.75;
      colHeights[col] += h + gap;
      return { ...s, x, y, w: colWidth, h };
    });
    return [items, Math.max(...colHeights)];
  }, [spotlights, width, heights]);

  const transitions = useTransition(gridItems, {
    key: (item: GridItem) => item.id,
    from: (item: GridItem) => ({
      transform: `translate3d(${item.x}px,${item.y + 20}px,0)`,
      width: item.w, height: item.h, opacity: 0,
    }),
    enter: (item: GridItem) => ({
      transform: `translate3d(${item.x}px,${item.y}px,0)`,
      width: item.w, height: item.h, opacity: 1,
    }),
    update: (item: GridItem) => ({
      transform: `translate3d(${item.x}px,${item.y}px,0)`,
      width: item.w, height: item.h,
    }),
    leave: { opacity: 0 },
    config: { mass: 1, tension: 280, friction: 30 },
    trail: 30,
  });

  return (
    <div ref={containerRef} className="relative w-full" style={{ height: containerHeight }}>
      {transitions((style, item) => (
        <animated.div style={{ position: "absolute", willChange: "transform, opacity", ...style }}>
          {item.imageUrl && (
            <img
              src={item.imageUrl}
              alt=""
              style={{ position: "absolute", opacity: 0, pointerEvents: "none", width: 1, height: 1 }}
              onLoad={e => handleImageLoad(item.id, e)}
            />
          )}
          <SpotlightCard
            spotlight={item}
            isLiked={likedIds.includes(item.id)}
            likeCount={counts[item.id] ?? 0}
            onLike={() => onLike(item.id)}
            onOpen={() => onOpen(item)}
          />
        </animated.div>
      ))}
    </div>
  );
};

const MasonryGrid = (props: {
  spotlights: Spotlight[]; likedIds: string[]; counts: Record<string, number>;
  onLike: (id: string) => void; onOpen: (s: Spotlight) => void;
}) => {
  const columns = useColumns();
  const isDesktop = columns >= 3;
  if (isDesktop) return <SpringMasonryGrid {...props} />;
  return <CSSMasonryGrid {...props} columns={columns} />;
};

// ── Modal ─────────────────────────────────────────────────────────────────────
const SpotlightModal = ({
  spotlight, isLiked, likeCount, onLike, onClose,
}: {
  spotlight: Spotlight; isLiked: boolean; likeCount: number;
  onLike: () => void; onClose: () => void;
}) => {
  const [showAll, setShowAll] = useState(false);
  const visibleStudents = showAll ? spotlight.students : spotlight.students.slice(0, 3);

  const imgRef = useRef<HTMLImageElement>(null);
  const [imgHeight, setImgHeight] = useState<number | null>(null);

  const measure = useCallback(() => {
    if (imgRef.current) setImgHeight(imgRef.current.offsetHeight);
  }, []);

  useEffect(() => {
    window.addEventListener("resize", measure);
    return () => window.removeEventListener("resize", measure);
  }, [measure]);

  const CloseBtn = ({ className = "" }: { className?: string }) => (
    <button
      onClick={onClose}
      className={className}
      style={{
        width: 28, height: 28, borderRadius: 8,
        background: "rgba(255,255,255,0.05)",
        border: "1px solid rgba(255,255,255,0.1)",
        display: "flex", alignItems: "center", justifyContent: "center",
        color: "#6b7280", cursor: "pointer", flexShrink: 0,
        transition: "all .15s",
      }}
      onMouseEnter={e => {
        (e.currentTarget as HTMLButtonElement).style.background = "rgba(255,255,255,0.1)";
        (e.currentTarget as HTMLButtonElement).style.color = "#d1d5db";
      }}
      onMouseLeave={e => {
        (e.currentTarget as HTMLButtonElement).style.background = "rgba(255,255,255,0.05)";
        (e.currentTarget as HTMLButtonElement).style.color = "#6b7280";
      }}
    >
      <FaTimes size={11} />
    </button>
  );

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4 sm:p-6"
      style={{
        background: "rgba(0,0,0,0.85)",
        backdropFilter: "blur(8px)",
        WebkitBackdropFilter: "blur(8px)",
      }}
      onClick={onClose}
    >
      <style>{`
        @keyframes modalIn {
          from { opacity: 0; transform: scale(.96); }
          to   { opacity: 1; transform: scale(1); }
        }
        .spotlight-right-scroll::-webkit-scrollbar { width: 4px; }
        .spotlight-right-scroll::-webkit-scrollbar-track { background: transparent; }
        .spotlight-right-scroll::-webkit-scrollbar-thumb {
          background: rgba(255,255,255,0.12); border-radius: 99px;
        }
        .spotlight-right-scroll::-webkit-scrollbar-thumb:hover {
          background: rgba(255,255,255,0.22);
        }
        .spotlight-right-scroll {
          scrollbar-width: thin;
          scrollbar-color: rgba(255,255,255,0.12) transparent;
        }
      `}</style>

      <div
        className="relative w-full max-w-sm sm:max-w-lg lg:max-w-4xl shadow-2xl"
        style={{
          background: "#0d1117",
          border: "1px solid rgba(255,255,255,0.08)",
          borderRadius: "16px",
          animation: "modalIn .2s ease",
          boxShadow: "0 25px 60px rgba(0,0,0,0.8)",
          overflow: "hidden",
          display: "flex",
          flexDirection: "column",
        }}
        onClick={e => e.stopPropagation()}
      >
        {/* Mobile header — hidden on desktop */}
        <div
          className="flex items-center justify-between shrink-0 px-5 py-3 lg:hidden"
          style={{ borderBottom: "1px solid rgba(255,255,255,0.05)" }}
        >
          <span style={{
            fontSize: 10, fontWeight: 700, letterSpacing: "0.12em",
            textTransform: "uppercase", color: "#378ADD",
          }}>
            SASDD post
          </span>
          <CloseBtn />
        </div>

        {/* Body — stacked on mobile, side-by-side on desktop */}
        <div className="flex flex-col lg:flex-row flex-1 min-h-0">

          {/* LEFT: Image */}
          <div
            className="w-full lg:w-[52%] shrink-0"
            style={{ background: "#0d1117", lineHeight: 0 }}
          >
            {spotlight.imageUrl ? (
              <img
                ref={imgRef}
                src={spotlight.imageUrl}
                alt={spotlight.title}
                onLoad={measure}
                style={{ display: "block", width: "100%", height: "auto", objectFit: "fill" }}
              />
            ) : (
              <div style={{ minHeight: 200, display: "flex", alignItems: "center", justifyContent: "center" }}>
                <FaStar size={48} className="text-blue-500/20" />
              </div>
            )}
          </div>

          {/* RIGHT: Desktop header + scrollable content */}
          <div
            className="flex flex-col flex-1 min-w-0"
            style={{
              height: imgHeight ? imgHeight : "auto",
              maxHeight: imgHeight ? imgHeight : "80dvh",
            }}
          >
            {/* Desktop-only header */}
            <div
              className="hidden lg:flex items-center justify-between shrink-0 px-6 py-3"
              style={{ borderBottom: "1px solid rgba(255,255,255,0.05)" }}
            >
              <span style={{
                fontSize: 10, fontWeight: 700, letterSpacing: "0.12em",
                textTransform: "uppercase", color: "#378ADD",
              }}>
                SASDD post
              </span>
              <CloseBtn />
            </div>

            {/* Scrollable content */}
            <div
              className="spotlight-right-scroll overflow-y-auto flex-1"
              style={{
                overscrollBehavior: "contain",
                padding: "20px 24px",
                paddingBottom: "calc(24px + env(safe-area-inset-bottom, 0px))",
              }}
            >
              <h3 style={{
                color: "#fff", fontWeight: 800, fontSize: 22,
                lineHeight: 1.25, marginBottom: 14,
              }}>
                {spotlight.title}
              </h3>

              {spotlight.description && (
                <p style={{ color: "#9ca3af", fontSize: 14, lineHeight: 1.75, marginBottom: 20 }}>
                  {spotlight.description}
                </p>
              )}

              {spotlight.students.length > 0 && (
                <div style={{ marginBottom: 24 }}>
                  <p style={{
                    fontSize: 10, fontWeight: 700, letterSpacing: "0.1em",
                    textTransform: "uppercase", color: "#4b5563", marginBottom: 10,
                  }}>
                    Recognized students
                  </p>
                  <div style={{ display: "flex", flexWrap: "wrap", gap: 6 }}>
                    {visibleStudents.map((name, i) => (
                      <span key={i} style={{
                        padding: "5px 12px",
                        background: "rgba(55,138,221,0.12)",
                        border: "1px solid rgba(55,138,221,0.25)",
                        borderRadius: 8, fontSize: 11, fontWeight: 700,
                        color: "#85B7EB", letterSpacing: "0.04em",
                        textTransform: "uppercase",
                      }}>
                        {name}
                      </span>
                    ))}
                    {spotlight.students.length > 3 && (
                      <button
                        type="button"
                        onClick={() => setShowAll(s => !s)}
                        style={{
                          padding: "5px 12px",
                          background: "rgba(255,255,255,0.05)",
                          border: "1px solid rgba(255,255,255,0.1)",
                          borderRadius: 8, fontSize: 11, fontWeight: 700,
                          color: "#6b7280", cursor: "pointer",
                        }}
                      >
                        {showAll ? "Show less" : `+${spotlight.students.length - 3} More`}
                      </button>
                    )}
                  </div>
                </div>
              )}

              <button
                type="button"
                onClick={onLike}
                style={{
                  display: "inline-flex", alignItems: "center", gap: 6,
                  padding: "7px 14px", borderRadius: 10,
                  background: isLiked ? "rgba(239,68,68,0.1)" : "rgba(255,255,255,0.05)",
                  border: isLiked ? "1px solid rgba(239,68,68,0.25)" : "1px solid rgba(255,255,255,0.08)",
                  color: isLiked ? "#f87171" : "#9ca3af",
                  fontSize: 12, fontWeight: 700, cursor: "pointer", transition: "all .15s",
                }}
              >
                <FaHeart size={11} style={{ color: isLiked ? "#f87171" : "inherit" }} />
                {likeCount} Congratulate
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

// ── Main ──────────────────────────────────────────────────────────────────────
const VirtueSpotlightSection: React.FC = () => {
  const { data, isLoading } = useGetVirtueSpotlightsQuery({});
  const spotlights: Spotlight[] = (data?.data ?? []).filter((s: any) => s.isActive !== false);

  const { likedIds, counts, toggle } = useLikes();
  const [tab, setTab] = useState<SortTab>("all");
  const [selected, setSelected] = useState<Spotlight | null>(null);

  if (isLoading || !spotlights.length) return null;

  const sorted = [...spotlights].sort((a, b) => {
    if (tab === "liked") {
      const aLikes = (counts[a.id] ?? 0) + (a.likeCount ?? 0);
      const bLikes = (counts[b.id] ?? 0) + (b.likeCount ?? 0);
      return bLikes - aLikes;
    }
    if (tab === "recent") {
      const aTime = a.createdAt ? new Date(a.createdAt).getTime() : 0;
      const bTime = b.createdAt ? new Date(b.createdAt).getTime() : 0;
      return bTime - aTime;
    }
    return 0;
  });

  return (
    <section className="relative w-full bg-gray-950 py-16 overflow-hidden">
      <div className="pointer-events-none absolute inset-0">
        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[700px] h-[300px] bg-blue-600/5 rounded-full blur-3xl" />
        <div className="absolute bottom-0 right-0 w-64 h-64 bg-yellow-500/5 rounded-full blur-3xl" />
      </div>

      <div className="relative z-10 max-w-6xl mx-auto px-4">
        {/* Header */}
        <div className="flex flex-col mb-8">
          <div className="inline-flex items-center gap-2 px-3 py-1 bg-blue-500/10 border border-blue-500/20 rounded-full w-fit mb-4">
            <span className="w-1.5 h-1.5 bg-blue-400 rounded-full" />
            <span className="text-blue-400 text-[10px] sm:text-xs font-bold uppercase tracking-widest">
              SASDD Initiative
            </span>
          </div>
          <h2 className="text-2xl sm:text-3xl lg:text-5xl font-black text-white leading-tight tracking-tight mb-2">
            SASDD <span className="text-blue-400">Bulletin Board</span>
          </h2>
          <p className="text-gray-400 text-sm max-w-lg leading-relaxed">
            Stay updated with the latest announcements, reminders, and student recognitions from the Student Services & Affairs and Development Division.
          </p>
        </div>

        {/* Tabs */}
        <div className="flex gap-2 mb-6 flex-wrap">
          {(["all", "recent", "liked"] as SortTab[]).map(t => (
            <button
              key={t}
              type="button"
              onClick={() => setTab(t)}
              className={`px-4 py-1.5 rounded-full text-xs font-bold border transition-all ${
                tab === t
                  ? "bg-blue-500/10 border-blue-500/25 text-blue-400"
                  : "bg-transparent border-white/5 text-gray-500 hover:text-gray-300 hover:border-white/10"
              }`}
            >
              {t === "all" ? "All posts" : t === "recent" ? "Most recent" : "Most liked"}
            </button>
          ))}
        </div>

        <MasonryGrid
          spotlights={sorted}
          likedIds={likedIds}
          counts={counts}
          onLike={toggle}
          onOpen={setSelected}
        />

        <p className="text-center text-gray-700 text-[10px] mt-8 uppercase tracking-widest font-semibold">
          We proudly recognize acts of incredible honesty and integrity
        </p>
      </div>

      {selected && (
        <SpotlightModal
          spotlight={selected}
          isLiked={likedIds.includes(selected.id)}
          likeCount={counts[selected.id] ?? 0}
          onLike={() => toggle(selected.id)}
          onClose={() => setSelected(null)}
        />
      )}
    </section>
  );
};

export default VirtueSpotlightSection;