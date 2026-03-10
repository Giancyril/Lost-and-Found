import { useParams, Link } from "react-router-dom";
import { useGetSingleLostItemQuery } from "../../redux/api/api";
import { Spinner } from "flowbite-react";
import {
  FaArrowLeft,
  FaCalendarAlt,
  FaMapMarkerAlt,
  FaUser,
  FaTag,
} from "react-icons/fa";

const SingleLostItem = () => {
  const { lostItem: lostItemId }: any = useParams();
  const { data: singleLostItem, isLoading } = useGetSingleLostItemQuery(lostItemId);

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gray-950 flex items-center justify-center">
        <div className="text-center">
          <Spinner size="xl" className="mb-4" />
          <p className="text-gray-400 text-sm">Loading item details...</p>
        </div>
      </div>
    );
  }

  const lostItem = singleLostItem?.data;

  if (!lostItem) {
    return (
      <div className="min-h-screen bg-gray-950 flex items-center justify-center">
        <div className="text-center max-w-md mx-auto px-4">
          <div className="bg-gray-900 rounded-2xl p-8 shadow-xl border border-gray-800">
            <div className="text-5xl mb-4">😞</div>
            <h2 className="text-2xl font-bold text-white mb-3">Item Not Found</h2>
            <p className="text-gray-500 mb-6 text-sm">
              The lost item you're looking for doesn't exist or may have been removed.
            </p>
            <Link
              to="/lostItems"
              className="inline-flex items-center px-6 py-2.5 bg-blue-600 hover:bg-blue-500 text-white font-semibold rounded-lg transition-all duration-200 text-sm"
            >
              <FaArrowLeft className="mr-2" />
              Back
            </Link>
          </div>
        </div>
      </div>
    );
  }

  const { lostItemName, date, isFound, img, description, location, user, category } = lostItem;

  return (
    <div className="min-h-screen bg-gray-950">

      {/* Header */}
      <div className="border-b border-gray-800 bg-gray-950">
        <div className="w-full px-6 sm:px-10 lg:px-16 py-5">
          <Link
            to="/lostItems"
            className="inline-flex items-center gap-2 bg-blue-600 hover:bg-blue-500 text-white text-sm font-semibold px-4 py-2 rounded-lg transition-all duration-200 mb-4"
          >
            <FaArrowLeft size={11} />
            Back
          </Link>
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-2xl md:text-3xl font-bold text-white">
                {lostItemName || "Lost Item"}
              </h1>
              <p className="text-gray-500 text-sm mt-1">Lost item details and information</p>
            </div>
            {isFound ? (
              <span className="inline-flex items-center px-3 py-1.5 rounded-full text-xs font-semibold bg-green-600/20 text-green-400 border border-green-600/30">
                ✓ Found
              </span>
            ) : (
              <span className="inline-flex items-center px-3 py-1.5 rounded-full text-xs font-semibold bg-red-600/20 text-red-400 border border-red-600/30">
                 Missing
              </span>
            )}
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="w-full px-6 sm:px-10 lg:px-16 py-10">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-10">

          {/* Image */}
          <div className="rounded-2xl overflow-hidden border border-gray-800 bg-gray-900">
            <img
              src={img}
              alt={lostItemName}
              className="w-full h-full min-h-80 object-cover"
              onError={(e) => {
                (e.target as HTMLImageElement).src = "/bgimg.png";
              }}
            />
          </div>

          {/* Details */}
          <div className="space-y-5">

            {/* Description */}
            <div className="bg-gray-900 rounded-xl p-5 border border-gray-800">
              <h2 className="text-xs font-bold text-white uppercase tracking-widest mb-3">Description</h2>
              <p className="text-gray-400 leading-relaxed text-sm">
                {description || "No description available for this item."}
              </p>
            </div>

            {/* Details Grid */}
            <div className="grid grid-cols-2 gap-4">
              <div className="bg-gray-900 rounded-xl p-4 border border-gray-800">
                <div className="flex items-center gap-2 text-blue-400 mb-2">
                  <FaCalendarAlt size={12} />
                  <span className="text-xs font-bold uppercase tracking-widest">Date Lost</span>
                </div>
                <p className="text-gray-300 text-sm">
                  {date ? new Date(date).toLocaleDateString("en-US", { year: "numeric", month: "long", day: "numeric" }) : "Not specified"}
                </p>
              </div>

              <div className="bg-gray-900 rounded-xl p-4 border border-gray-800">
                <div className="flex items-center gap-2 text-blue-400 mb-2">
                  <FaMapMarkerAlt size={12} />
                  <span className="text-xs font-bold uppercase tracking-widest">Location</span>
                </div>
                <p className="text-gray-300 text-sm">{location || "Not specified"}</p>
              </div>

              <div className="bg-gray-900 rounded-xl p-4 border border-gray-800">
                <div className="flex items-center gap-2 text-blue-400 mb-2">
                  <FaTag size={12} />
                  <span className="text-xs font-bold uppercase tracking-widest">Category</span>
                </div>
                <p className="text-gray-300 text-sm">{category?.name || "Uncategorized"}</p>
              </div>

              <div className="bg-gray-900 rounded-xl p-4 border border-gray-800">
                <div className="flex items-center gap-2 text-blue-400 mb-2">
                  <FaUser size={12} />
                  <span className="text-xs font-bold uppercase tracking-widest">Reported By</span>
                </div>
                <p className="text-gray-300 text-sm">{user?.username || "Anonymous"}</p>
              </div>
            </div>

            {/* Action */}
            <div className="bg-gray-900 rounded-xl p-5 border border-gray-800">
              <h3 className="text-xs font-bold text-white uppercase tracking-widest mb-2">
                Found This Item?
              </h3>
              <p className="text-gray-500 text-sm mb-4 leading-relaxed">
                If you found this item, please report it through our platform to help reunite the owner with their belongings.
              </p>

              {!isFound ? (
                <div className="flex flex-col sm:flex-row gap-3">
                  <Link
                    to="/reportFoundItem"
                    className="flex-1 bg-blue-600 hover:bg-blue-500 text-white font-semibold py-2.5 px-5 rounded-lg transition-all duration-200 text-sm text-center"
                  >
                    Report Found Item
                  </Link>
                  <button className="flex-1 border border-gray-700 hover:border-blue-600/50 text-gray-400 hover:text-white font-semibold py-2.5 px-5 rounded-lg transition-all duration-200 text-sm">
                    Contact Owner
                  </button>
                </div>
              ) : (
                <div className="bg-green-900/20 border border-green-600/30 rounded-lg p-3 text-center">
                  <p className="text-green-400 text-sm font-medium">This item has been marked as found!</p>
                </div>
              )}
            </div>

          </div>
        </div>
      </div>
    </div>
  );
};

export default SingleLostItem;