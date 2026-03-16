import { Spinner } from "flowbite-react";
import { Link } from "react-router-dom";
import { useGetFoundItemsQuery } from "../../redux/api/api";
import { FaCalendarAlt, FaMapMarkerAlt, FaArrowRight } from "react-icons/fa";
import { useUserVerification } from "../../auth/auth";

// ── Hide image for sensitive categories (admin always sees) ──
const HIDDEN_IMAGE_CATEGORIES = ["wallets & purses", "wallet", "purse"];

const shouldHideImage = (categoryName: string | undefined, isAdmin: boolean) => {
  if (isAdmin) return false;
  return HIDDEN_IMAGE_CATEGORIES.some((c) =>
    categoryName?.toLowerCase().includes(c)
  );
};

const RecentFoundItem = () => {
  const users: any = useUserVerification();
  const isAdmin = users?.role === "ADMIN";

  const { data: foundItems, isLoading } = useGetFoundItemsQuery({ limit: 10, sortBy: "date", sortOrder: "desc" });

  if (isLoading) {
    return (
      <div className="min-h- text-center bg-gray-900 pt-10">
        <Spinner size="lg" />
      </div>
    );
  }

  const items = foundItems?.data?.slice(0, 10) ?? [];

  return (
    <div className="bg-gray-900 py-12">

      {/* Divider */}
      <div className="mx-auto max-w-screen-2xl px-8 sm:px-12 lg:px-16 mb-10">
        <hr className="border-gray-800" />
      </div>

      <div className="px-4 mx-auto max-w-screen-2xl lg:px-6">
        <div className="mx-auto text-center">
          <h2 className="mb-4 text-3xl lg:text-4xl tracking-tight font-extrabold text-white">
            Recent Found Items
          </h2>
          <p className="font-light text-gray-400 sm:text-xl mb-8">
            These are the recent found item reports
          </p>
        </div>
      </div>

      {/* Cards */}
      <div className="w-full px-4 sm:px-8 lg:px-16 mb-8">
        <div className="grid gap-6 grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 [&>*]:w-full">
          {items.map((foundItem: any) => (
            <div
              key={`${foundItem?.id}127`}
              className="group relative bg-gray-900 rounded-xl overflow-hidden transition-all duration-300 border border-gray-800 hover:border-blue-600/50 hover:shadow-lg hover:shadow-blue-900/20 w-full flex flex-col"
            >
              <div className="relative overflow-hidden">
                <div className="h-52 w-full overflow-hidden">
                  {shouldHideImage(foundItem?.category?.name, isAdmin) ? (
                    <div className="w-full h-full bg-gray-800 flex flex-col items-center justify-center gap-2">
                      <div className="w-14 h-14 rounded-full bg-gray-700 border border-gray-700 flex items-center justify-center">
                        <svg width="26" height="26" fill="none" viewBox="0 0 24 24" stroke="currentColor" className="text-gray-500" strokeWidth="1.5">
                          <path strokeLinecap="round" strokeLinejoin="round" d="M3.98 8.223A10.477 10.477 0 001.934 12C3.226 16.338 7.244 19.5 12 19.5c.993 0 1.953-.138 2.863-.395M6.228 6.228A10.45 10.45 0 0112 4.5c4.756 0 8.773 3.162 10.065 7.498a10.523 10.523 0 01-4.293 5.774M6.228 6.228L3 3m3.228 3.228l3.65 3.65m7.894 7.894L21 21m-3.228-3.228l-3.65-3.65m0 0a3 3 0 10-4.243-4.243m4.242 4.242L9.88 9.88" />
                        </svg>
                      </div>
                      <p className="text-gray-500 text-xs font-medium">Image Hidden</p>
                      <p className="text-gray-600 text-[10px] text-center px-4 leading-relaxed">
                        Submit a claim to verify ownership
                      </p>
                    </div>
                  ) : (
                    <img
                      className="w-full h-full object-cover transition-transform duration-300 group-hover:scale-105"
                      src={foundItem?.img}
                      alt={foundItem?.foundItemName}
                      width={500}
                      height={500}
                      onError={(e) => { (e.target as HTMLImageElement).src = "/bgimg.png"; }}
                    />
                  )}
                  <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent" />
                </div>
                {foundItem?.isClaimed ? (
                  <div className="absolute top-3 right-3 bg-green-600/90 text-white px-2.5 py-1 rounded-full text-xs font-semibold backdrop-blur-sm border border-green-500/40">
                    ✓ Claimed
                  </div>
                ) : (
                  <div className="absolute top-3 right-3 bg-blue-600/90 text-white px-2.5 py-1 rounded-full text-xs font-semibold backdrop-blur-sm border border-blue-500/40">
                    Available
                  </div>
                )}
              </div>

              <div className="p-5 text-white flex flex-col flex-1">
                <h3 className="text-base font-bold mb-2 text-white group-hover:text-blue-400 transition-colors duration-200 line-clamp-1">
                  {foundItem?.foundItemName}
                </h3>
                <p className="text-gray-500 text-sm mb-4 line-clamp-2 leading-relaxed">
                  {foundItem?.description}
                </p>
                <div className="space-y-2 mt-auto mb-4">
                  <div className="flex items-center gap-2 text-xs text-gray-400">
                    <div className="w-6 h-6 rounded-md bg-blue-500/10 border border-blue-500/20 flex items-center justify-center shrink-0">
                      <FaCalendarAlt className="text-blue-400" size={10} />
                    </div>
                    <span>{foundItem?.date?.split("T")[0]}</span>
                  </div>
                  <div className="flex items-center gap-2 text-xs text-gray-400">
                    <div className="w-6 h-6 rounded-md bg-blue-500/10 border border-blue-500/20 flex items-center justify-center shrink-0">
                      <FaMapMarkerAlt className="text-blue-400" size={10} />
                    </div>
                    <span className="line-clamp-1">{foundItem?.location}</span>
                  </div>
                </div>
                <Link to={`/foundItems/${foundItem?.id}`} className="block">
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
      <div className="flex justify-center mt-4 mb-14">
        <Link
          to="/foundItems"
          className="inline-flex items-center gap-2 bg-blue-600/20 hover:bg-blue-600 border border-blue-600/40 hover:border-blue-600 text-blue-300 hover:text-white font-semibold py-2.5 px-6 rounded-xl transition-all duration-200 text-sm"
        >
          View All Found Items <FaArrowRight size={12} />
        </Link>
      </div>
    </div>
  );
};

export default RecentFoundItem;