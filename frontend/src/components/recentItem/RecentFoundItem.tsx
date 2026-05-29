import React, { useState } from "react";
import { Spinner } from "flowbite-react";
import { Link } from "react-router-dom";
import { useGetFoundItemsQuery } from "../../redux/api/api";
import { FaCalendarAlt, FaMapMarkerAlt, FaClock, FaChevronLeft, FaChevronRight, FaCheckCircle } from "react-icons/fa";
import { useUserVerification } from "../../auth/auth";
import { useScrollReveal } from "../../hooks/useScrollReveal";

const HIDDEN_IMAGE_CATEGORIES = ["wallets & purses", "wallet", "purse"];
const shouldBlurImage = (categoryName: string | undefined, isAdmin: boolean) => {
  if (isAdmin) return false;
  return HIDDEN_IMAGE_CATEGORIES.some((c) => categoryName?.toLowerCase().includes(c));
};
const timeAgo = (d: string) => {
  const m = Math.floor((Date.now() - new Date(d).getTime()) / 60000);
  if (m < 1) return "Just now";
  if (m < 60) return `${m}m ago`;
  return `${Math.floor(m / 60)}h ago`;
};

const RecentFoundItem = () => {
  useScrollReveal();
  const users: any = useUserVerification();
  const isAdmin = users?.role === "ADMIN";
  const { data: foundItems, isLoading } = useGetFoundItemsQuery({ limit: 50, sortBy: "date", sortOrder: "desc" });

  const TWENTY_FOUR_HOURS_MS = 24 * 60 * 60 * 1000;
  const items = (foundItems?.data ?? []).filter((item: any) => {
    const created = new Date(item.createdAt ?? item.date).getTime();
    return Date.now() - created <= TWENTY_FOUR_HOURS_MS;
  }).slice(0, 10);

  const ITEMS_PER_PAGE = 5;
  const totalPages = Math.ceil(items.length / ITEMS_PER_PAGE);
  const [page, setPage] = useState(0);
  const visibleItems = items.slice(page * ITEMS_PER_PAGE, (page + 1) * ITEMS_PER_PAGE);

  if (isLoading) return <div className="text-center bg-gray-900 pt-10"><Spinner size="lg" /></div>;
  if (items.length === 0) return null;

  return (
    <div className="bg-gray-900 py-12 reveal">
      <div className="mx-auto max-w-screen-2xl px-8 sm:px-12 lg:px-16 mb-10">
        <hr className="border-gray-800" />
      </div>

      {/* Section header */}
      <div className="px-4 mx-auto max-w-screen-2xl lg:px-6 mb-8 text-center">
        <div className="flex items-center justify-center gap-2 mb-1.5">
          <div className="w-1 h-5 bg-blue-500 rounded-full" />
          <span className="text-blue-400 text-[11px] font-bold uppercase tracking-widest">Just In</span>
        </div>
        <h2 className="text-2xl sm:text-3xl font-extrabold text-white tracking-tight">Recent Found Items</h2>
        <div className="flex items-center justify-center gap-1.5 mt-1.5">
          <FaClock size={10} className="text-blue-400" />
          <p className="text-gray-500 text-xs">Reported within the last 24 hours</p>
        </div>
      </div>

      {/* Cards */}
      <div className="w-full px-4 sm:px-8 lg:px-16 mb-6">
        <div className="grid gap-4 grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5">
          {visibleItems.map((item: any) => {
            const isReporter = item?.userId === users?.id || item?.user?.id === users?.id || item?.user?._id === users?.id;
            const hasClaimed = item?.claim?.some((c: any) => c.userId === users?.id);
            const shouldBlur = shouldBlurImage(item?.category?.name, isAdmin) && !isReporter && !hasClaimed;
            const isClaimed = item?.isClaimed;
            return (
              <React.Fragment key={item?.id}>
                {/* Mobile Card - Compact Horizontal List Item */}
                <Link 
                  to={`/foundItems/${item.id}`} 
                  className="sm:hidden flex items-center gap-3 p-3 bg-gray-900 border border-gray-800 rounded-xl hover:border-gray-700 transition-all active:scale-[0.99]"
                >
                  <div className="w-14 h-14 rounded-xl overflow-hidden bg-gray-850 shrink-0 border border-white/5 relative flex items-center justify-center">
                    <img
                      src={(Array.isArray(item?.images) && item.images.length > 0
                        ? (typeof item.images[0] === "string" ? item.images[0] : item.images[0]?.url ?? item.images[0]?.src ?? "")
                        : "") || item?.img || "/bgimg.png"}
                      alt={item?.foundItemName}
                      onError={(e) => { (e.target as HTMLImageElement).src = "/bgimg.png"; }}
                      className={`w-full h-full object-cover ${shouldBlur ? "blur-[6px] select-none pointer-events-none" : ""}`}
                    />
                    {shouldBlur && (
                      <div className="absolute inset-0 flex items-center justify-center bg-black/40">
                        <svg width="12" height="12" fill="none" viewBox="0 0 24 24" stroke="currentColor" className="text-blue-400" strokeWidth="2">
                          <path strokeLinecap="round" strokeLinejoin="round" d="M16.5 10.5V6.75a4.5 4.5 0 10-9 0v3.75m-.75 11.25h10.5a2.25 2.25 0 002.25-2.25v-6.75a2.25 2.25 0 00-2.25-2.25H6.75a2.25 2.25 0 00-2.25 2.25v6.75a2.25 2.25 0 002.25 2.25z" />
                        </svg>
                      </div>
                    )}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <h3 className="text-white text-sm font-semibold truncate leading-snug flex-1 min-w-0">
                        {item?.foundItemName}
                      </h3>
                      {isClaimed ? (
                        <span className="ml-auto px-1.5 py-0.5 bg-emerald-500/10 text-emerald-400 text-[8px] font-black uppercase tracking-widest rounded-md border border-emerald-500/20 shrink-0">Claimed</span>
                      ) : (
                        <span className="ml-auto px-1.5 py-0.5 bg-blue-500/10 text-blue-400 text-[8px] font-black uppercase tracking-widest rounded-md border border-blue-500/20 shrink-0">Available</span>
                      )}
                    </div>
                    <p className="text-gray-500 text-[11px] mt-0.5 truncate flex items-center gap-1">
                      <FaMapMarkerAlt className="text-blue-400 shrink-0" size={7} />
                      <span className="truncate">{item?.location}</span>
                      <span className="text-gray-700 mx-0.5">·</span>
                      <span className="shrink-0">{timeAgo(item.createdAt ?? item.date)}</span>
                    </p>
                  </div>
                </Link>

                {/* Desktop Card */}
                <div
                  className="hidden sm:flex group bg-gray-900 border border-gray-800 hover:border-blue-500/40 rounded-2xl overflow-hidden transition-all duration-200 hover:shadow-xl hover:shadow-blue-900/20 flex-col"
                >
                  {/* Image */}
                  <div className="relative h-44 overflow-hidden bg-gray-800 flex items-center justify-center">
                    <img
                      className={`w-full h-full object-cover ${shouldBlur ? "blur-[8px] select-none pointer-events-none" : "transition-transform duration-300 group-hover:scale-105"}`}
                      src={(Array.isArray(item?.images) && item.images.length > 0
                        ? (typeof item.images[0] === "string" ? item.images[0] : item.images[0]?.url ?? item.images[0]?.src ?? "")
                        : "") || item?.img || "/bgimg.png"}
                      alt={item?.foundItemName}
                      onError={(e) => { (e.target as HTMLImageElement).src = "/bgimg.png"; }}
                    />
                    {shouldBlur && (
                      <div className="absolute inset-0 flex flex-col items-center justify-center bg-black/45 p-4 text-center">
                        <svg width="20" height="20" fill="none" viewBox="0 0 24 24" stroke="currentColor" className="text-blue-400 mb-1" strokeWidth="2">
                          <path strokeLinecap="round" strokeLinejoin="round" d="M16.5 10.5V6.75a4.5 4.5 0 10-9 0v3.75m-.75 11.25h10.5a2.25 2.25 0 002.25-2.25v-6.75a2.25 2.25 0 00-2.25-2.25H6.75a2.25 2.25 0 00-2.25 2.25v6.75a2.25 2.25 0 002.25 2.25z" />
                        </svg>
                        <p className="text-white font-bold text-[11px]">Photo Blurred</p>
                        <p className="text-gray-300 text-[9px] leading-snug">Submit a claim to view</p>
                      </div>
                    )}
                    <div className="absolute inset-0 bg-gradient-to-t from-gray-900/80 via-transparent to-transparent" />
                    {/* Status */}
                    <div className="absolute top-2.5 left-2.5">
                      {isClaimed
                        ? <span className="flex items-center gap-1 px-2 py-0.5 bg-emerald-600/90 text-white text-[10px] font-bold rounded-full border border-emerald-500/30 backdrop-blur-sm"> Claimed</span>
                        : <span className="px-2 py-0.5 bg-blue-600/90 text-white text-[10px] font-bold rounded-full border border-blue-500/30 backdrop-blur-sm">Available</span>
                      }
                    </div>
                    {/* Time */}
                    <div className="absolute bottom-2.5 right-2.5 flex items-center gap-1 bg-black/60 backdrop-blur-sm px-2 py-0.5 rounded-full border border-white/10">
                      <FaClock size={7} className="text-blue-400" />
                      <span className="text-white text-[10px] font-medium">{timeAgo(item.createdAt ?? item.date)}</span>
                    </div>
                  </div>

                  {/* Body */}
                  <div className="p-4 flex flex-col flex-1">
                    <h3 className="text-sm font-bold text-white group-hover:text-blue-400 transition-colors line-clamp-1 mb-1">{item?.foundItemName}</h3>
                    <p className="text-gray-500 text-xs line-clamp-2 leading-relaxed mb-3">{item?.description}</p>
                    <div className="space-y-1.5 mt-auto mb-3">
                      <div className="flex items-center gap-2 text-xs text-gray-400">
                        <div className="w-5 h-5 rounded bg-blue-500/10 border border-blue-500/20 flex items-center justify-center shrink-0"><FaCalendarAlt className="text-blue-400" size={8} /></div>
                        <span>{item?.date?.split("T")[0]}</span>
                      </div>
                      <div className="flex items-center gap-2 text-xs text-gray-400">
                        <div className="w-5 h-5 rounded bg-blue-500/10 border border-blue-500/20 flex items-center justify-center shrink-0"><FaMapMarkerAlt className="text-blue-400" size={8} /></div>
                        <span className="line-clamp-1">{item?.location}</span>
                      </div>
                    </div>
                    <div className="h-px bg-white/[0.04] mb-3" />
                    <Link to={`/foundItems/${item?.id}`}
                      className="flex items-center justify-center gap-1.5 w-full py-2 bg-blue-600/15 hover:bg-blue-600 border border-blue-500/30 hover:border-blue-500 text-blue-300 hover:text-white text-xs font-semibold rounded-lg transition-all duration-200">
                      View Details
                    </Link>
                  </div>
                </div>
              </React.Fragment>
            );
          })}
        </div>
      </div>

      {/* Footer: pagination only */}
      {totalPages > 1 && (
        <div className="flex items-center justify-center gap-1 bg-gray-800/60 border border-white/5 rounded-xl p-1 w-fit mx-auto mt-2 mb-10">
          <button onClick={() => setPage(p => Math.max(0, p - 1))} disabled={page === 0}
            className="w-8 h-8 flex items-center justify-center rounded-lg text-gray-400 hover:text-white hover:bg-white/5 disabled:opacity-30 disabled:cursor-not-allowed transition-all">
            <FaChevronLeft size={11} />
          </button>
          <span className="text-gray-500 text-xs px-2">{page + 1} / {totalPages}</span>
          <button onClick={() => setPage(p => Math.min(totalPages - 1, p + 1))} disabled={page === totalPages - 1}
            className="w-8 h-8 flex items-center justify-center rounded-lg text-gray-400 hover:text-white hover:bg-white/5 disabled:opacity-30 disabled:cursor-not-allowed transition-all">
            <FaChevronRight size={11} />
          </button>
        </div>
      )}
    </div>
  );
};

export default RecentFoundItem;
