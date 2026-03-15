import { useState, useEffect, useRef } from "react";
import { FaUser, FaChevronLeft, FaChevronRight, FaQuoteLeft } from "react-icons/fa";
import { useGetTestimonialsQuery } from "../../redux/api/api";

interface Testimonial {
  id?: string;
  rating: number;
  feedback: string;
  name: string;
  position: string;
}

const fallbackTestimonials: Testimonial[] = [
  {
    rating: 5,
    feedback: "I lost my ID card near the canteen and reported it through the system. The next day, I got notified it was already at the SAS office. Super fast and easy!",
    name: "Juan D.",
    position: "BSIT Student",
  },
  {
    rating: 5,
    feedback: "Someone turned in my calculator and the system matched it with my report. I never thought I'd get it back before my exam. Thank you SAS!",
    name: "Maria S.",
    position: "BSEd Student",
  },
  {
    rating: 4,
    feedback: "Reporting was really simple, just filled out the form and uploaded a photo. Got my umbrella back within 3 days. Highly recommend using this system.",
    name: "Carlo R.",
    position: "BSBA Student",
  },
  {
    rating: 5,
    feedback: "I found a notebook in Room 205 and reported it here. The owner claimed it the same afternoon. Glad the school has a system like this.",
    name: "Lovely A.",
    position: "BSEd Student",
  },
  {
    rating: 4,
    feedback: "Lost my water bottle during PE class. Filed a report and within 2 days it was returned to me. The process was smooth and straightforward.",
    name: "Mark T.",
    position: "BSIT Student",
  },
];

// ─── Single card ──────────────────────────────────────────────────────────────
const TestimonialCard = ({ testimonial, active }: { testimonial: Testimonial; active: boolean }) => (
  <div className={`transition-all duration-500 h-full ${active ? "opacity-100 scale-100" : "opacity-40 scale-95"}`}>
    <div className="relative bg-gray-900 border border-white/8 rounded-2xl p-6 sm:p-8 flex flex-col" style={{ minHeight: "260px" }}>

      {/* Quote icon */}
      <div className="absolute -top-3 left-6">
        <div className="w-8 h-8 bg-blue-600 rounded-full flex items-center justify-center shadow-lg shadow-blue-600/30">
          <FaQuoteLeft size={12} className="text-white" />
        </div>
      </div>

      {/* Verified badge */}
      <div className="flex justify-end mb-4 mt-2">
        <span className="text-gray-600 text-[10px] uppercase tracking-widest font-medium">Verified</span>
      </div>

      {/* Feedback */}
      <blockquote className="text-gray-300 text-sm leading-relaxed flex-1 mb-6">
        "{testimonial.feedback}"
      </blockquote>

      {/* Author */}
      <div className="flex items-center gap-3 pt-4 border-t border-white/5">
        <div className="w-10 h-10 bg-gradient-to-br from-blue-600 to-cyan-500 rounded-full flex items-center justify-center shrink-0 shadow-md">
          <FaUser size={14} className="text-white" />
        </div>
        <div>
          <p className="text-white text-sm font-semibold leading-tight">{testimonial.name}</p>
          <p className="text-gray-500 text-xs mt-0.5">{testimonial.position}</p>
        </div>
      </div>
    </div>
  </div>
);

// ─── Main Reviews component ───────────────────────────────────────────────────
const Reviews = () => {
  const { data: testimonialsData, isLoading } = useGetTestimonialsQuery({});
  const testimonials: Testimonial[] = testimonialsData?.data?.length
    ? testimonialsData.data
    : fallbackTestimonials;

  const [activeIndex, setActiveIndex] = useState(0);
  const [isAnimating, setIsAnimating] = useState(false);
  const [isPaused, setIsPaused]       = useState(false);
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);

  const total = testimonials.length;

  const goTo = (index: number) => {
    if (isAnimating) return;
    setIsAnimating(true);
    setActiveIndex((index + total) % total);
    setTimeout(() => setIsAnimating(false), 500);
  };

  const prev = () => goTo(activeIndex - 1);
  const next = () => goTo(activeIndex + 1);

  useEffect(() => {
    if (isPaused) return;
    timerRef.current = setInterval(() => goTo(activeIndex + 1), 5000);
    return () => { if (timerRef.current) clearInterval(timerRef.current); };
  }, [activeIndex, isPaused]);

  const getVisible = () => {
    if (total <= 1) return [0];
    if (total === 2) return [activeIndex, (activeIndex + 1) % total];
    return [
      (activeIndex - 1 + total) % total,
      activeIndex,
      (activeIndex + 1) % total,
    ];
  };
  const visible = getVisible();

  if (isLoading) return (
    <section className="py-20 bg-gray-950">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-16">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {[1, 2, 3].map(i => (
            <div key={i} className="bg-gray-900 rounded-2xl p-8 border border-white/5 animate-pulse" style={{ minHeight: "260px" }}>
              <div className="h-3 bg-gray-800 rounded w-full mb-2" />
              <div className="h-3 bg-gray-800 rounded w-3/4 mb-6" />
              <div className="flex items-center gap-3 mt-auto">
                <div className="w-10 h-10 bg-gray-800 rounded-full" />
                <div>
                  <div className="h-3 bg-gray-800 rounded w-20 mb-1" />
                  <div className="h-2 bg-gray-800 rounded w-16" />
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );

  return (
    <section className="py-20 bg-gray-950 overflow-hidden">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-16">

        {/* Header */}
        <div className="text-center mb-14">
          <div className="inline-flex items-center gap-2 py-1.5 px-4 mb-5 text-xs font-semibold bg-blue-600/20 border border-blue-500/30 rounded-full text-blue-300 uppercase tracking-widest">
            <span className="w-1.5 h-1.5 rounded-full bg-blue-400 animate-pulse" />
            Success Stories
          </div>
          <h2 className="text-3xl sm:text-4xl lg:text-5xl font-black tracking-tight text-white mb-4">
            Items Returned,{" "}
            <span className="bg-gradient-to-r from-blue-400 via-cyan-400 to-blue-300 bg-clip-text text-transparent">
              Stories Shared
            </span>
          </h2>
          <p className="text-gray-400 text-base sm:text-lg max-w-2xl mx-auto font-light">
            Real experiences from students and staff who used our system to recover their belongings.
          </p>
        </div>

        {/* Carousel */}
        <div
          className="relative"
          onMouseEnter={() => setIsPaused(true)}
          onMouseLeave={() => setIsPaused(false)}
        >
          {/* Cards — equal height via items-stretch */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-5 items-stretch">
            {visible.map((idx, pos) => (
              <div
                key={`${idx}-${pos}`}
                onClick={() => pos !== 1 && goTo(idx)}
                className={`${pos !== 1 ? "cursor-pointer" : ""} flex`}
              >
                <TestimonialCard
                  testimonial={testimonials[idx]}
                  active={idx === activeIndex}
                />
              </div>
            ))}
          </div>

          {/* Nav buttons */}
          <div className="flex items-center justify-center gap-4 mt-10">
            <button onClick={prev} disabled={isAnimating}
              className="w-10 h-10 rounded-full bg-white/5 hover:bg-white/10 border border-white/10 hover:border-white/20 text-gray-400 hover:text-white flex items-center justify-center transition-all duration-200 disabled:opacity-40">
              <FaChevronLeft size={13} />
            </button>

            {/* Dots */}
            <div className="flex items-center gap-2">
              {testimonials.map((_, i) => (
                <button key={i} onClick={() => goTo(i)}
                  className={`transition-all duration-300 rounded-full ${
                    i === activeIndex
                      ? "w-6 h-2 bg-blue-400"
                      : "w-2 h-2 bg-gray-600 hover:bg-gray-400"
                  }`}
                />
              ))}
            </div>

            <button onClick={next} disabled={isAnimating}
              className="w-10 h-10 rounded-full bg-white/5 hover:bg-white/10 border border-white/10 hover:border-white/20 text-gray-400 hover:text-white flex items-center justify-center transition-all duration-200 disabled:opacity-40">
              <FaChevronRight size={13} />
            </button>
          </div>

          {/* Auto-play indicator */}
          {!isPaused && (
            <div className="flex justify-center mt-4">
              <div className="flex items-center gap-1.5 text-gray-600 text-xs">
                <span className="w-1.5 h-1.5 rounded-full bg-blue-500/60 animate-pulse" />
                Auto-playing
              </div>
            </div>
          )}
        </div>

      </div>
    </section>
  );
};

export default Reviews;