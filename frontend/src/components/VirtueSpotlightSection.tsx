import React, { useState } from "react";
import { FaStar, FaChevronLeft, FaChevronRight, FaShieldAlt } from "react-icons/fa";
import { useGetVirtueSpotlightsQuery } from "../redux/api/api";

const VirtueSpotlightSection: React.FC = () => {
  const { data, isLoading } = useGetVirtueSpotlightsQuery({});
  const spotlights: any[] = data?.data || [];
  const [activeIdx, setActiveIdx] = useState(0);

  if (isLoading) return null;
  if (!spotlights.length) return null;

  const active = spotlights[activeIdx];
  const prev = () => setActiveIdx((i) => (i === 0 ? spotlights.length - 1 : i - 1));
  const next = () => setActiveIdx((i) => (i === spotlights.length - 1 ? 0 : i + 1));

  return (
    <section className="relative w-full bg-gray-950 py-16 overflow-hidden">

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

        {/* Card */}
        <div className="relative max-w-6xl mx-auto">
          <div className="bg-gray-900 border border-white/[0.06] rounded-2xl overflow-hidden shadow-2xl shadow-black/40">
            <div className="flex flex-col lg:flex-row">

              {/* Image */}
              <div className="relative lg:w-[40%] h-64 lg:h-auto shrink-0 overflow-hidden border-b lg:border-b-0 lg:border-r border-white/[0.08]">
                {active.imageUrl ? (
                  <img
                    src={active.imageUrl}
                    alt={active.title}
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
                    {active.title}
                  </h3>

                  {active.description && (
                    <p className="text-gray-400 text-sm leading-relaxed mb-5">
                      {active.description}
                    </p>
                  )}

                  {/* Recognized students */}
                  {active.students?.length > 0 && (
                    <div className="mb-6">
                      <p className="text-[10px] font-bold text-gray-500 uppercase tracking-widest mb-3">
                        Recognized Students
                      </p>
                      <div className="flex flex-wrap gap-2">
                        {active.students.map((name: string, i: number) => (
                          <span
                            key={i}
                            className="inline-flex items-center px-2.5 py-1 bg-blue-500/10 border border-blue-500/20 text-blue-300 text-[11px] font-medium rounded-lg"
                          >
                            {name}
                          </span>
                        ))}
                      </div>
                    </div>
                  )}
                </div>

                {/* Bottom row — date + navigation */}
                <div className="flex items-center justify-between pt-4 border-t border-white/[0.05]">
                  <p className="text-gray-600 text-xs">
                    {new Date(active.createdAt).toLocaleDateString("en-US", {
                      month: "long", day: "numeric", year: "numeric"
                    })}
                  </p>

                  {spotlights.length > 1 && (
                    <div className="flex items-center gap-2">
                      <span className="text-gray-600 text-xs mr-1">
                        {activeIdx + 1} / {spotlights.length}
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

          {/* Dot indicators */}
          {spotlights.length > 1 && (
            <div className="flex justify-center gap-1.5 mt-4">
              {spotlights.map((_: any, i: number) => (
                <button
                  key={i}
                  onClick={() => setActiveIdx(i)}
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
