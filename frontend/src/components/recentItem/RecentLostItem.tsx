import { Spinner } from "flowbite-react";
import { Link } from "react-router-dom";
import type { lostItem } from "../../types/types";
import { useGetLostItemsQuery } from "../../redux/api/api";
import { FaCalendarAlt, FaMapMarkerAlt, FaArrowRight } from "react-icons/fa";

const RecentLostItem = () => {
  const { data: lostItems, isLoading } = useGetLostItemsQuery({ limit: 10, sortBy: "date", sortOrder: "desc" });

  if (isLoading) {
    return (
      <div className="min-h- text-center bg-gray-900 pt-10">
        <Spinner size="lg" />
      </div>
    );
  }

  const items = lostItems?.data?.slice(0, 10) ?? [];

  return (
    <div className="bg-gray-900 py-12">

      {/* Divider */}
      <div className="mx-auto max-w-screen-2xl px-8 sm:px-12 lg:px-16 mb-10">
        <hr className="border-gray-800" />
      </div>

      <div className="px-4 mx-auto max-w-screen-2xl lg:px-6">
        <div className="mx-auto text-center">
          <h2 className="mb-4 text-3xl lg:text-4xl tracking-tight font-extrabold text-white">
            Recent Lost Items
          </h2>
          <p className="font-light text-gray-400 sm:text-xl mb-8">
            These are the recent lost item reports
          </p>
        </div>
      </div>

      {/* Cards */}
      <div className="w-full px-4 sm:px-8 lg:px-16 mb-8">
        <div className="grid gap-6 grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 [&>*]:w-full">
          {items.map((lostItem: lostItem) => (
            <div
              key={`${lostItem?.id}127`}
              className="group relative bg-gray-900 rounded-xl overflow-hidden transition-all duration-300 border border-gray-800 hover:border-blue-600/50 hover:shadow-lg hover:shadow-blue-900/20 w-full flex flex-col"
            >
              <div className="relative overflow-hidden">
                <div className="h-52 w-full overflow-hidden">
                  <img
                    className="w-full h-full object-cover transition-transform duration-300 group-hover:scale-105"
                    src={lostItem?.img}
                    alt={lostItem?.lostItemName}
                    width={500}
                    height={500}
                    onError={(e) => { (e.target as HTMLImageElement).src = "/bgimg.png"; }}
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent" />
                </div>
                {lostItem?.isFound ? (
                  <div className="absolute top-3 right-3 bg-green-600/90 text-white px-2.5 py-1 rounded-full text-xs font-semibold backdrop-blur-sm border border-green-500/40">
                    ✓ Found
                  </div>
                ) : (
                  <div className="absolute top-3 right-3 bg-red-600/90 text-white px-2.5 py-1 rounded-full text-xs font-semibold backdrop-blur-sm border border-red-500/40">
                    Lost
                  </div>
                )}
              </div>

              <div className="p-5 text-white flex flex-col flex-1">
                <h3 className="text-base font-bold mb-2 text-white group-hover:text-blue-400 transition-colors duration-200 line-clamp-1">
                  {lostItem?.lostItemName}
                </h3>
                <p className="text-gray-500 text-sm mb-4 line-clamp-2 leading-relaxed">
                  {lostItem?.description}
                </p>
                <div className="space-y-2 mt-auto mb-4">
                  <div className="flex items-center gap-2 text-xs text-gray-400">
                    <div className="w-6 h-6 rounded-md bg-blue-500/10 border border-blue-500/20 flex items-center justify-center shrink-0">
                      <FaCalendarAlt className="text-blue-400" size={10} />
                    </div>
                    <span>{lostItem?.date.split("T")[0]}</span>
                  </div>
                  <div className="flex items-center gap-2 text-xs text-gray-400">
                    <div className="w-6 h-6 rounded-md bg-blue-500/10 border border-blue-500/20 flex items-center justify-center shrink-0">
                      <FaMapMarkerAlt className="text-blue-400" size={10} />
                    </div>
                    <span className="line-clamp-1">{lostItem.location}</span>
                  </div>
                </div>
                <Link to={`/lostItems/${lostItem?.id}`} className="block">
                  <button className="w-full bg-blue-600/20 hover:bg-blue-600 border border-blue-600/40 hover:border-blue-600 text-blue-300 hover:text-white font-semibold py-2.5 px-4 rounded-lg transition-all duration-200">
                    View Details
                  </button>
                </Link>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* View All */}
      <div className="flex justify-center mt-2 mb-2">
        <Link
          to="/lostItems"
          className="inline-flex items-center gap-2 bg-blue-600/20 hover:bg-blue-600 border border-blue-600/40 hover:border-blue-600 text-blue-300 hover:text-white font-semibold py-2.5 px-6 rounded-xl transition-all duration-200 text-sm"
        >
          View All Lost Items <FaArrowRight size={12} />
        </Link>
      </div>
    </div>
  );
};

export default RecentLostItem;