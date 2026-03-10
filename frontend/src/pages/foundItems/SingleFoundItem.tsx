import {
  useGetSingleFoundItemQuery,
  useCreateClaimMutation,
} from "../../redux/api/api";
import { Spinner } from "flowbite-react";
import { useState } from "react";
import { useForm } from "react-hook-form";
import { Link, useParams } from "react-router-dom";
import { toast, ToastContainer } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";
import {
  FaArrowLeft,
  FaCalendarAlt,
  FaMapMarkerAlt,
  FaUser,
  FaTag,
  FaTimes,
  FaBuilding,
} from "react-icons/fa";
import { useUserVerification } from "../../auth/auth";

const SingleFoundItem = () => {
  const { foundItem: foundItemParam } = useParams<{ foundItem: string }>();
  const foundItemId = foundItemParam;
  const users: any = useUserVerification();
  const isAdmin = users?.role === "ADMIN";

  const { data: singleFoundItem, isLoading } = useGetSingleFoundItemQuery(foundItemId!);
  const [createClaim, { isLoading: claimLoading }] = useCreateClaimMutation();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isClaimModalOpen, setIsClaimModalOpen] = useState(false);

  const { register, handleSubmit, formState: { errors }, reset } = useForm();

  const onSubmit = async (data: any) => {
    setIsSubmitting(true);
    try {
      const claimData = {
        foundItemId: foundItemId,
        distinguishingFeatures: data.distinguishingFeatures,
        lostDate: new Date(data.lostDate).toISOString(),
      };
      const res = await createClaim(claimData);
      if (res.data?.success) {
        toast.success("Claim submitted successfully!");
        setIsClaimModalOpen(false);
        reset();
      } else {
        toast.error("Failed to submit claim. Please try again.");
      }
    } catch (error) {
      toast.error("An unexpected error occurred.");
    } finally {
      setIsSubmitting(false);
    }
  };

  if (!foundItemId) {
    return (
      <div className="min-h-screen bg-gray-950 flex items-center justify-center">
        <div className="text-center max-w-md mx-auto px-4">
          <div className="bg-gray-900 rounded-2xl p-8 border border-gray-800">
            <div className="text-5xl mb-4">⚠️</div>
            <h2 className="text-2xl font-bold text-white mb-3">Invalid Item</h2>
            <p className="text-gray-500 mb-6 text-sm">No valid item ID was provided.</p>
            <Link to="/foundItems" className="inline-flex items-center gap-2 px-5 py-2.5 bg-blue-600 hover:bg-blue-500 text-white font-semibold rounded-lg text-sm transition-all duration-200">
              <FaArrowLeft size={11} /> Back
            </Link>
          </div>
        </div>
      </div>
    );
  }

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

  const foundItemData = singleFoundItem?.data;

  if (!foundItemData) {
    return (
      <div className="min-h-screen bg-gray-950 flex items-center justify-center">
        <div className="text-center max-w-md mx-auto px-4">
          <div className="bg-gray-900 rounded-2xl p-8 border border-gray-800">
            <div className="text-5xl mb-4">😞</div>
            <h2 className="text-2xl font-bold text-white mb-3">Item Not Found</h2>
            <p className="text-gray-500 mb-6 text-sm">This item doesn't exist or may have been removed.</p>
            <Link to="/foundItems" className="inline-flex items-center gap-2 px-5 py-2.5 bg-blue-600 hover:bg-blue-500 text-white font-semibold rounded-lg text-sm transition-all duration-200">
              <FaArrowLeft size={11} /> Back
            </Link>
          </div>
        </div>
      </div>
    );
  }

  return (
    <>
      <div className="min-h-screen bg-gray-950">

        {/* Header */}
        <div className="border-b border-gray-800 bg-gray-950">
          <div className="w-full px-6 sm:px-10 lg:px-16 py-5">
            <Link
              to="/foundItems"
              className="inline-flex items-center gap-2 bg-blue-600 hover:bg-blue-500 text-white text-sm font-semibold px-4 py-2 rounded-lg transition-all duration-200 mb-4"
            >
              <FaArrowLeft size={11} /> Back
            </Link>
            <div className="flex items-center justify-between">
              <div>
                <h1 className="text-2xl md:text-3xl font-bold text-white">
                  {foundItemData?.foundItemName || "Found Item"}
                </h1>
                <p className="text-gray-500 text-sm mt-1">Found item details</p>
              </div>
              {foundItemData?.isClaimed ? (
                <span className="inline-flex items-center px-3 py-1.5 rounded-full text-xs font-semibold bg-green-600/20 text-green-400 border border-green-600/30">
                  ✓ Claimed
                </span>
              ) : (
                <span className="inline-flex items-center px-3 py-1.5 rounded-full text-xs font-semibold bg-blue-600/20 text-blue-400 border border-blue-600/30">
                  Available
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
                className="w-full h-full min-h-80 object-cover"
                src={foundItemData?.img}
                alt={foundItemData?.foundItemName}
                onError={(e) => { (e.target as HTMLImageElement).src = "/bgimg.png"; }}
              />
            </div>

            {/* Details */}
            <div className="space-y-5">

              {/* Description */}
              <div className="bg-gray-900 rounded-xl p-5 border border-gray-800">
                <h2 className="text-xs font-bold text-white uppercase tracking-widest mb-3">Description</h2>
                <p className="text-gray-400 leading-relaxed text-sm">
                  {foundItemData?.description || "No description available."}
                </p>
              </div>

              {/* Details Grid */}
              <div className="grid grid-cols-2 gap-4">
                <div className="bg-gray-900 rounded-xl p-4 border border-gray-800">
                  <div className="flex items-center gap-2 text-blue-400 mb-2">
                    <FaCalendarAlt size={12} />
                    <span className="text-xs font-bold uppercase tracking-widest">Date Found</span>
                  </div>
                  <p className="text-gray-300 text-sm">
                    {foundItemData?.date ? new Date(foundItemData.date).toLocaleDateString("en-US", { year: "numeric", month: "long", day: "numeric" }) : "Not specified"}
                  </p>
                </div>

                <div className="bg-gray-900 rounded-xl p-4 border border-gray-800">
                  <div className="flex items-center gap-2 text-blue-400 mb-2">
                    <FaMapMarkerAlt size={12} />
                    <span className="text-xs font-bold uppercase tracking-widest">Location</span>
                  </div>
                  <p className="text-gray-300 text-sm">{foundItemData?.location || "Not specified"}</p>
                </div>

                <div className="bg-gray-900 rounded-xl p-4 border border-gray-800">
                  <div className="flex items-center gap-2 text-blue-400 mb-2">
                    <FaTag size={12} />
                    <span className="text-xs font-bold uppercase tracking-widest">Category</span>
                  </div>
                  <p className="text-gray-300 text-sm">{foundItemData?.category?.name || "Uncategorized"}</p>
                </div>

                <div className="bg-gray-900 rounded-xl p-4 border border-gray-800">
                  <div className="flex items-center gap-2 text-blue-400 mb-2">
                    <FaUser size={12} />
                    <span className="text-xs font-bold uppercase tracking-widest">Logged By</span>
                  </div>
                  <p className="text-gray-300 text-sm">{foundItemData?.user?.username || "SAS Office"}</p>
                </div>
              </div>

              {/* Claim Section */}
              <div className="bg-gray-900 rounded-xl p-5 border border-gray-800">
                <h3 className="text-xs font-bold text-white uppercase tracking-widest mb-2">How to Claim</h3>

                {foundItemData?.isClaimed ? (
                  <div className="bg-green-900/20 border border-green-600/30 rounded-lg p-3 text-center">
                    <p className="text-green-400 text-sm font-medium">This item has already been claimed.</p>
                  </div>
                ) : isAdmin ? (
                  /* Admin: show claim button */
                  <>
                    <p className="text-gray-500 text-sm mb-4 leading-relaxed">
                      {foundItemData?.claimProcess || "Verify ownership before processing the claim."}
                    </p>
                    <button
                      onClick={() => setIsClaimModalOpen(true)}
                      className="w-full bg-blue-600 hover:bg-blue-500 text-white font-semibold py-2.5 px-5 rounded-lg transition-all duration-200 text-sm"
                    >
                      Process Claim
                    </button>
                  </>
                ) : (
                  /* Student: show office visit instruction */
                  <div className="flex items-start gap-3 bg-gray-800/60 rounded-xl p-4 border border-gray-700">
                    <FaBuilding className="text-blue-400 mt-0.5 shrink-0 text-lg" />
                    <div>
                      <p className="text-white text-sm font-semibold">Visit the SAS Office to Claim</p>
                      <p className="text-gray-400 text-xs mt-1 leading-relaxed">
                        If this item is yours, bring a valid ID and proof of ownership to the Student Affairs Office. Staff will verify and process your claim.
                      </p>
                    </div>
                  </div>
                )}
              </div>

            </div>
          </div>
        </div>
      </div>

      {/* Claim Modal — admin only */}
      {isClaimModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/75 backdrop-blur-sm">
          <div className="relative w-full max-w-md bg-gray-900 rounded-2xl border border-gray-800 shadow-2xl">
            <div className="flex items-center justify-between px-6 py-4 border-b border-gray-800">
              <div>
                <h3 className="text-base font-bold text-white">Process Claim</h3>
                <p className="text-gray-500 text-xs mt-0.5">Verify and log the claim</p>
              </div>
              <button onClick={() => setIsClaimModalOpen(false)} className="text-gray-500 hover:text-white transition-colors duration-200 ml-4">
                <FaTimes size={15} />
              </button>
            </div>

            <div className="px-6 py-5">
              <form onSubmit={handleSubmit(onSubmit)} className="space-y-5">
                <div>
                  <label className="block mb-1.5 text-xs font-bold text-white uppercase tracking-widest">Date Item Was Lost</label>
                  <input
                    type="date"
                    {...register("lostDate", { required: "Please provide the date" })}
                    className="w-full p-3 bg-gray-800 border border-gray-700 text-white rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-sm transition-all duration-200"
                  />
                  {errors.lostDate && <p className="text-red-400 text-xs mt-1">{errors.lostDate.message as string}</p>}
                </div>

                <div>
                  <label className="block mb-1.5 text-xs font-bold text-white uppercase tracking-widest">Proof of Ownership</label>
                  <textarea
                    rows={4}
                    placeholder="Describe identifying details provided by the student (sticker, initials, serial number, etc.)"
                    {...register("distinguishingFeatures", {
                      required: "Please describe identifying details",
                      minLength: { value: 10, message: "Please provide at least 10 characters" },
                    })}
                    className="w-full p-3 bg-gray-800 border border-gray-700 text-white rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-sm transition-all duration-200 resize-none placeholder-gray-600"
                  />
                  {errors.distinguishingFeatures && <p className="text-red-400 text-xs mt-1">{errors.distinguishingFeatures.message as string}</p>}
                </div>

                <div className="flex gap-3 pt-1">
                  <button
                    type="button"
                    onClick={() => setIsClaimModalOpen(false)}
                    className="flex-1 px-4 py-2.5 text-gray-400 bg-gray-800 hover:bg-gray-700 border border-gray-700 rounded-lg text-sm font-medium transition-all duration-200"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={isSubmitting || claimLoading}
                    className="flex-1 px-4 py-2.5 bg-blue-600 hover:bg-blue-500 text-white rounded-lg text-sm font-semibold transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    {isSubmitting || claimLoading ? (
                      <div className="flex items-center justify-center gap-2"><Spinner size="sm" />Submitting...</div>
                    ) : "Confirm Claim"}
                  </button>
                </div>
              </form>
            </div>
          </div>
        </div>
      )}

      <ToastContainer position="top-right" autoClose={5000} style={{ top: "70px" }} theme="dark" />
    </>
  );
};

export default SingleFoundItem;