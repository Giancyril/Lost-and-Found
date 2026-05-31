import React, { useState, useRef, useEffect } from "react";
import { FaStar, FaChevronLeft, FaChevronRight, FaShieldAlt, FaHeart } from "react-icons/fa";
import { useGetVirtueSpotlightsQuery } from "../redux/api/api";

const VirtueSpotlightSection: React.FC = () => {
  const { data, isLoading } = useGetVirtueSpotlightsQuery({});
  const spotlights: any[] = data?.data || [];
  const [activeIdx, setActiveIdx] = useState(0);
  const [expandedCardId, setExpandedCardId] = useState<string | null>(null);
  const sectionRef = useRef<HTMLDivElement>(null);
  const scrollContainerRef = useRef<HTMLDivElement>(null);

  const [likedPosts, setLikedPosts] = useState<string[]>(() => {
    try {
      const saved = localStorage.getItem("virtue_liked_posts");
      return saved ? JSON.parse(saved) : [];
    } catch { return []; }
  });

  const [likeCounts, setLikeCounts] = useState<Record<string, number>>(() => {
    try {
      const saved = localStorage.getItem("virtue_like_counts");
      return saved ? JSON.parse(saved) : {};
    } catch { return {}; }
  });

  if (isLoading) return null;
  if (!spotlights.length) return null;

  const handleLike = (spotlightId: string) => {
    const isLiked = likedPosts.includes(spotlightId);
    let newLikes: string[];
    let newCounts = { ...likeCounts };

    if (isLiked) {
      newLikes = likedPosts.filter((id) => id !== spotlightId);
      newCounts[spotlightId] = Math.max(0, (likeCounts[spotlightId] || 1) - 1);
    } else {
      newLikes = [...likedPosts, spotlightId];
      newCounts[spotlightId] = (likeCounts[spotlightId] || 0) + 1;
    }

    setLikedPosts(newLikes);
    setLikeCounts(newCounts);
    localStorage.setItem("virtue_liked_posts", JSON.stringify(newLikes));
    localStorage.setItem("virtue_like_counts", JSON.stringify(newCounts));
  };

  const handleScroll = () => {
    if (!scrollContainerRef.current) return;
    const container = scrollContainerRef.current;
    const scrollLeft = container.scrollLeft;
    const width = container.clientWidth;
    const gap = 24; // gap-6
    if (width === 0) return;

    const index = Math.round(scrollLeft / (width + gap));
    if (index !== activeIdx && index >= 0 && index < spotlights.length) {
      setActiveIdx(index);
      setExpandedCardId(null);
    }
  };

  const scrollToIndex = (index: number) => {
    if (!scrollContainerRef.current) return;
    const container = scrollContainerRef.current;
    const width = container.clientWidth;
    const gap = 24;
    container.scrollTo({
      left: index * (width + gap),
      behavior: "smooth",
    });
    setActiveIdx(index);
    setExpandedCardId(null);
  };

  const prev = () => {
    const newIdx = activeIdx === 0 ? spotlights.length - 1 : activeIdx - 1;
    scrollToIndex(newIdx);
  };

  const next = () => {
    const newIdx = activeIdx === spotlights.length - 1 ? 0 : activeIdx + 1;
    scrollToIndex(newIdx);
  };

  return (
    <section ref={sectionRef} className="relative w-full bg-gray-950 py-16 overflow-hidden">

      {/* Ambient background glow */}
      <div className="pointer-events-none absolute inset-0">
        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[700px] h-[300px] bg-blue-600/5 rounded-full blur-3xl" />
        <div className="absolute bottom-0 right-0 w-64 h-64 bg-yellow-500/5 rounded-full blur-3xl" />
      </div>

      <div className="relative z-10 max-w-6xl mx-auto px-4">

        {/* Section label */}
        <div className="flex flex-col mb-10">
          <div className="inline-flex items-center gap-2 px-3 py-1 bg-blue-500/10 border border-blue-500/20 rounded-full w-fit mb-4">
            <span className="w-1.5 h-1.5 bg-blue-400 rounded-full" />
            <span className="text-blue-400 text-[10px] sm:text-xs font-bold uppercase tracking-widest">SASDD Initiative</span>
          </div>
          <h2 className="text-2xl sm:text-3xl lg:text-5xl font-black text-white leading-tight lg:leading-[1.1] tracking-tight mb-2 lg:mb-4">
            VIRTUE <span className="text-blue-400">Spotlight</span>
          </h2>
          <p className="text-gray-400 text-sm max-w-lg leading-relaxed text-justify">
            Valuing Integrity, Responsibility, and Trustworthiness recognizing students who demonstrate exceptional moral character.
          </p>
        </div>

        {/* Carousel Wrapper */}
        <div className="relative max-w-6xl mx-auto">
          <div
            ref={scrollContainerRef}
            onScroll={handleScroll}
            className="flex overflow-x-auto scroll-smooth snap-x snap-mandatory scrollbar-none gap-6 pb-4"
            style={{ scrollbarWidth: "none", msOverflowStyle: "none" }}
          >
            {spotlights.map((spotlight: any, idx: number) => {
              const isLiked = likedPosts.includes(spotlight.id);
              const isExpanded = expandedCardId === spotlight.id;

              return (
                <div
                  key={spotlight.id || idx}
                  className="w-full shrink-0 snap-start snap-always bg-gray-900 border border-white/[0.06] rounded-2xl overflow-hidden shadow-2xl shadow-black/40"
                >
                  <div className="flex flex-col lg:flex-row h-full">

                    {/* Image */}
                    <div className="relative lg:w-[40%] h-64 lg:h-auto shrink-0 overflow-hidden border-b lg:border-b-0 lg:border-r border-white/[0.08]">
                      {spotlight.imageUrl ? (
                        <img
                          src={spotlight.imageUrl}
                          alt={spotlight.title}
                          className="w-full h-full object-cover object-top"
                        />
                      ) : (
                        <div className="w-full h-full bg-gradient-to-br from-blue-900/40 to-gray-900 flex items-center justify-center">
                          <FaStar size={48} className="text-blue-400/30" />
                        </div>
                      )}
                    </div>

                    {/* Content */}
                    <div className="flex-1 p-6 lg:p-8 flex flex-col justify-between">
                      <div>
                        {/* Title */}
                        <div className="mb-1">
                          <span className="text-[10px] font-bold text-blue-400 uppercase tracking-widest">Recognition Post</span>
                        </div>
                        <h3 className="text-white text-xl sm:text-2xl font-bold leading-tight mb-3">
                          {spotlight.title}
                        </h3>

                        {spotlight.description && (
                          <p className="text-gray-400 text-sm leading-relaxed mb-5">
                            {spotlight.description}
                          </p>
                        )}

                        {/* Recognized students */}
                        {spotlight.students?.length > 0 && (
                          <div className="mb-6">
                            <p className="text-[10px] font-bold text-gray-500 uppercase tracking-widest mb-3">
                              Recognized Students
                            </p>
                            <div className="flex flex-wrap gap-2 items-center">
                              {(isExpanded || spotlight.students.length <= 3
                                ? spotlight.students
                                : spotlight.students.slice(0, 3)
                              ).map((name: string, i: number) => (
                                <span
                                  key={i}
                                  className="inline-flex items-center px-2.5 py-1 bg-blue-500/10 border border-blue-500/20 text-blue-300 text-[11px] font-medium rounded-lg"
                                >
                                  {name}
                                </span>
                              ))}
                              {spotlight.students.length > 3 && (
                                <button
                                  type="button"
                                  onClick={() => setExpandedCardId(isExpanded ? null : spotlight.id)}
                                  className="inline-flex items-center px-2.5 py-1 bg-gray-800 text-gray-500 text-[11px] font-bold rounded-lg transition-colors cursor-pointer select-none"
                                >
                                  {isExpanded ? "See Less" : `+${spotlight.students.length - 3} More`}
                                </button>
                              )}
                            </div>
                          </div>
                        )}
                      </div>

                      {/* Bottom row — date + navigation */}
                      <div className="flex items-center justify-between pt-4 border-t border-white/[0.05]">
                        <button
                          type="button"
                          onClick={() => handleLike(spotlight.id)}
                          className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bold transition-all focus:outline-none select-none border ${
                            isLiked
                              ? "bg-red-500/10 border-red-500/20 text-red-400 hover:bg-red-500/20"
                              : "bg-white/5 border-white/5 text-gray-400 hover:text-white hover:bg-white/10"
                          }`}
                        >
                          <FaHeart size={11} className={isLiked ? "text-red-500 fill-red-500" : ""} />
                          <span>{likeCounts[spotlight.id] || 0} Congratulate</span>
                        </button>

                        {spotlights.length > 1 && (
                          <div className="flex items-center gap-2">
                            <span className="text-gray-600 text-xs mr-1">
                              {idx + 1} / {spotlights.length}
                            </span>
                            <button
                              onClick={prev}
                              className="w-8 h-8 bg-white/5 hover:bg-white/10 border border-white/5 hover:border-white/10 text-gray-400 hover:text-white rounded-lg flex items-center justify-center transition-all"
                            >
                              <FaChevronLeft size={10} />
                            </button>
                            <button
                              onClick={next}
                              className="w-8 h-8 bg-white/5 hover:bg-white/10 border border-white/5 hover:border-white/10 text-gray-400 hover:text-white rounded-lg flex items-center justify-center transition-all"
                            >
                              <FaChevronRight size={10} />
                            </button>
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>

          {/* Dot indicators */}
          {spotlights.length > 1 && (
            <div className="flex justify-center gap-1.5 mt-4">
              {spotlights.map((_: any, i: number) => (
                <button
                  key={i}
                  onClick={() => scrollToIndex(i)}
                  className={`rounded-full transition-all duration-300 ${
                    i === activeIdx
                      ? "w-6 h-1.5 bg-blue-500"
                      : "w-1.5 h-1.5 bg-gray-700 hover:bg-gray-500"
                  }`}
                />
              ))}
            </div>
          )}
        </div>

        {/* Bottom tagline */}
        <p className="text-center text-gray-600 text-xs mt-8 uppercase tracking-widest font-semibold">
          We proudly recognize acts of incredible honesty and integrity
        </p>
      </div>
    </section>
  );
};

export default VirtueSpotlightSection;
