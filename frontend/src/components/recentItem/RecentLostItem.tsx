import { Spinner } from "flowbite-react";
import { Link } from "react-router-dom";
import type { lostItem } from "../../types/types";
import { useGetLostItemsQuery } from "../../redux/api/api";

const RecentLostItem = () => {
  const { data: lostItems, isLoading } = useGetLostItemsQuery({});
  if (isLoading) {
    return (
      <div className="min-h- text-center bg-gray-900 pt-10">
        <Spinner size="lg" />
      </div>
    );
  }
  return (
    <div className="bg-gray-900 py-10">
      <div className="px-4 mx-auto max-w-screen-2xl sm:py-6 lg:px-6">
        <div className="mx-auto text-center">
          <h2 className="mb-4 text-3xl lg:text-4xl tracking-tight font-extrabold text-white pt-20 md:pt-16">
            Recent Lost Items
          </h2>
          <p className="font-light text-gray-400 sm:text-xl mb-8">
            These are the recent lost item reports
          </p>
        </div>
      </div>

      {/* card items */}
      <div className="container mx-auto flex justify-center mb-10 px-8 sm:px-12 lg:px-16">
        <div className="grid gap-6 mx-auto grid-cols-1 md:grid-cols-3 lg:grid-cols-4">
          {lostItems?.data?.map((lostItem: lostItem) => {
            return (
              <div
                key={`${lostItem?.id}127`}
                className="group relative bg-gray-900 rounded-xl overflow-hidden transition-all duration-300 border border-gray-800 hover:border-blue-600/50 hover:shadow-lg hover:shadow-blue-900/20 max-w-sm flex flex-col"
              >
                {/* Image */}
                <div className="relative overflow-hidden">
                  <div className="h-52 w-full overflow-hidden">
                    <img
                      className="w-full h-full object-cover transition-transform duration-300 group-hover:scale-105"
                      src={lostItem?.img}
                      alt={lostItem?.lostItemName}
                      width={500}
                      height={500}
                    />
                    <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent" />
                  </div>

                  {/* Badge */}
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

                {/* Content */}
                <div className="p-5 text-white flex flex-col flex-1">
                  <h3 className="text-base font-bold mb-2 text-white group-hover:text-blue-400 transition-colors duration-200 line-clamp-1">
                    {lostItem?.lostItemName}
                  </h3>

                  <p className="text-gray-500 text-sm mb-4 line-clamp-2 leading-relaxed">
                    {lostItem?.description}
                  </p>

                  <div className="space-y-1.5 mt-auto mb-4">
                    <div className="flex items-center gap-2 text-xs text-gray-400">
                      <span>📅</span>
                      <span>{lostItem?.date.split("T")[0]}</span>
                    </div>
                    <div className="flex items-center gap-2 text-xs text-gray-400">
                      <span>📍</span>
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
            );
          })}
        </div>
      </div>
    </div>
  );
};

export default RecentLostItem;