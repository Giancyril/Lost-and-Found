import { useState } from "react";
import { Spinner } from "flowbite-react";
import { Link } from "react-router-dom";
import { useGetLostItemsQuery } from "../../redux/api/api";
import { FaCalendarAlt, FaMapMarkerAlt, FaClock, FaChevronLeft, FaChevronRight } from "react-icons/fa";
import { useUserVerification } from "../../auth/auth";

const HIDDEN_IMAGE_CATEGORIES = ["wallets & purses", "wallet", "purse"];
const shouldHideImage = (categoryName: string | undefined, isAdmin: boolean) => {
  if (isAdmin) return false;
  return HIDDEN_IMAGE_CATEGORIES.some((c) => categoryName?.toLowerCase().includes(c));
};
const timeAgo = (d: string) => {
  const m = Math.floor((Date.now() - new Date(d).getTime()) / 60000);
  if (m < 1) return "Just now";
  if (m < 60) return `${m}m ago`;
  return `${Math.floor(m / 60)}h ago`;
};

const RecentLostItem = () => {
  const users: any = useUserVerification();
  const isAdmin = users?.role === "ADMIN";
  const { data: lostItems, isLoading } = useGetLostItemsQuery({ limit: 50, sortBy: "date", sortOrder: "desc" });

  const THREE_HOURS_MS = 3 * 60 * 60 * 1000;
  const items = (lostItems?.data ?? []).filter((item: any) => {
    const created = new Date(item.createdAt ?? item.date).getTime();
    return Date.now() - created <= THREE_HOURS_MS;
  }).slice(0, 10);

  const ITEMS_PER_PAGE = 5;
  const totalPages = Math.ceil(items.length / ITEMS_PER_PAGE);
  const [page, setPage] = useState(0);
  const visibleItems = items.slice(page * ITEMS_PER_PAGE, (page + 1) * ITEMS_PER_PAGE);

  if (isLoading) return <div className="text-center bg-gray-900 pt-10"><Spinner size="lg" /></div>;
  if (items.length === 0) return null;

  return (
    <div className="bg-gray-900 py-12">
      <div className="mx-auto max-w-screen-2xl px-8 sm:px-12 lg:px-16 mb-10">
        <hr className="border-gray-800" />
      </div>

      {/* Section header */}
      <div className="px-4 mx-auto max-w-screen-2xl lg:px-6 mb-8 text-center">
        <div className="flex items-center justify-center gap-2 mb-1.5">
          <div className="w-1 h-5 bg-blue-500 rounded-full" />
          <span className="text-blue-400 text-[11px] font-bold uppercase tracking-widest">Just Reported</span>
        </div>
        <h2 className="text-2xl sm:text-3xl font-extrabold text-white tracking-tight">Recent Lost Items</h2>
        <div className="flex items-center justify-center gap-1.5 mt-1.5">
          <FaClock size={10} className="text-blue-400" />
          <p className="text-gray-500 text-xs">Reported within the last 3 hours</p>
        </div>
      </div>

      {/* Cards */}
      <div className="w-full px-4 sm:px-8 lg:px-16 mb-6">
        <div className="grid gap-4 grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5">
          {visibleItems.map((item: any) => {
            const hideImg = shouldHideImage(item?.category?.name, isAdmin);
            const isFound = item?.isFound;
            return (
              <div key={item?.id}
                className="group bg-gray-900 border border-gray-800 hover:border-blue-500/40 rounded-2xl overflow-hidden transition-all duration-200 hover:shadow-xl hover:shadow-blue-900/20 flex flex-col">
                {/* Image */}
                <div className="relative h-44 overflow-hidden bg-gray-800">
                  {hideImg ? (
                    <div className="w-full h-full flex flex-col items-center justify-center gap-2">
                      <div className="w-10 h-10 rounded-full bg-gray-700 flex items-center justify-center">
                        <svg width="18" height="18" fill="none" viewBox="0 0 24 24" stroke="currentColor" className="text-gray-500" strokeWidth="1.5">
                          <path strokeLinecap="round" strokeLinejoin="round" d="M3.98 8.223A10.477 10.477 0 001.934 12C3.226 16.338 7.244 19.5 12 19.5c.993 0 1.953-.138 2.863-.395M6.228 6.228A10.45 10.45 0 0112 4.5c4.756 0 8.773 3.162 10.065 7.498a10.523 10.523 0 01-4.293 5.774M6.228 6.228L3 3m3.228 3.228l3.65 3.65m7.894 7.894L21 21m-3.228-3.228l-3.65-3.65m0 0a3 3 0 10-4.243-4.243m4.242 4.242L9.88 9.88" />
                        </svg>
                      </div>
                      <p className="text-gray-500 text-[10px]">Image Hidden</p>
                    </div>
                  ) : (
                    <img
                      className="w-full h-full object-cover transition-transform duration-300 group-hover:scale-105"
                      src={(Array.isArray(item?.images) && item.images.length > 0
                        ? (typeof item.images[0] === "string" ? item.images[0] : item.images[0]?.url ?? item.images[0]?.src ?? "")
                        : "") || item?.img || "/bgimg.png"}
                      alt={item?.lostItemName}
                      onError={(e) => { (e.target as HTMLImageElement).src = "/bgimg.png"; }}
                    />
                  )}
                  <div className="absolute inset-0 bg-gradient-to-t from-gray-900/80 via-transparent to-transparent" />
                  {/* Status */}
                  <div className="absolute top-2.5 left-2.5">
                    {isFound
                      ? <span className="px-2 py-0.5 bg-emerald-600/90 text-white text-[10px] font-bold rounded-full border border-emerald-500/30 backdrop-blur-sm">✓ Found</span>
                      : <span className="px-2 py-0.5 bg-red-600/90 text-white text-[10px] font-bold rounded-full border border-red-500/30 backdrop-blur-sm">Lost</span>
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
                  <h3 className="text-sm font-bold text-white group-hover:text-blue-400 transition-colors line-clamp-1 mb-1">{item?.lostItemName}</h3>
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
                  <Link to={`/lostItems/${item?.id}`}
                    className="flex items-center justify-center gap-1.5 w-full py-2 bg-blue-600/15 hover:bg-blue-600 border border-blue-500/30 hover:border-blue-500 text-blue-300 hover:text-white text-xs font-semibold rounded-lg transition-all duration-200">
                    View Details
                  </Link>
                </div>
              </div>
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

export default RecentLostItem;
