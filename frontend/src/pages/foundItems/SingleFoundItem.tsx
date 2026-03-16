import {
  useGetSingleFoundItemQuery,
  useCreateClaimMutation,
  useUpdateClaimStatusMutation,
} from "../../redux/api/api";
import { Spinner } from "flowbite-react";
import { useState } from "react";
import { useForm } from "react-hook-form";
import { Link, useParams } from "react-router-dom";
import { toast, ToastContainer } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";
import {
  FaArrowLeft, FaCalendarAlt, FaMapMarkerAlt, FaUser, FaTag,
  FaTimes, FaBuilding, FaCheckCircle, FaEnvelope,
  FaChevronLeft, FaChevronRight, FaClipboardList,
} from "react-icons/fa";
import { useUserVerification } from "../../auth/auth";

function ImageCarousel({ images, alt }: { images: string[]; alt: string }) {
  const [activeIdx, setActiveIdx] = useState(0);
  const prev = () => setActiveIdx((i) => (i === 0 ? images.length - 1 : i - 1));
  const next = () => setActiveIdx((i) => (i === images.length - 1 ? 0 : i + 1));

  if (images.length === 0) return (
    <div className="relative w-full h-full min-h-[430px] rounded-2xl overflow-hidden border border-gray-800 bg-gray-900">
      <img src="/bgimg.png" alt={alt} className="absolute inset-0 w-full h-full object-cover" />
    </div>
  );

  if (images.length === 1) return (
    <div className="relative w-full h-full min-h-[430px] rounded-2xl overflow-hidden border border-gray-800 bg-gray-900">
      <img src={images[0]} alt={alt} className="absolute inset-0 w-full h-full object-cover"
        onError={(e) => { (e.target as HTMLImageElement).src = "/bgimg.png"; }} />
    </div>
  );

  return (
    <div className="flex flex-col gap-3 h-full">
      <div className="relative w-full flex-1 min-h-[380px] rounded-2xl overflow-hidden border border-gray-800 bg-gray-900">
        <img src={images[activeIdx]} alt={`${alt} — photo ${activeIdx + 1}`}
          className="absolute inset-0 w-full h-full object-cover"
          onError={(e) => { (e.target as HTMLImageElement).src = "/bgimg.png"; }} />
        <button onClick={prev}
          className="absolute left-3 top-1/2 -translate-y-1/2 w-9 h-9 rounded-full bg-black/60 hover:bg-black/80 text-white flex items-center justify-center backdrop-blur-sm border border-white/10 transition-all">
          <FaChevronLeft size={13} />
        </button>
        <button onClick={next}
          className="absolute right-3 top-1/2 -translate-y-1/2 w-9 h-9 rounded-full bg-black/60 hover:bg-black/80 text-white flex items-center justify-center backdrop-blur-sm border border-white/10 transition-all">
          <FaChevronRight size={13} />
        </button>
        <div className="absolute bottom-3 right-3 bg-black/60 backdrop-blur-sm text-white text-xs font-semibold px-2.5 py-1 rounded-full border border-white/10">
          {activeIdx + 1} / {images.length}
        </div>
        <div className="absolute bottom-3 left-1/2 -translate-x-1/2 flex gap-1.5">
          {images.map((_, idx) => (
            <button key={idx} onClick={() => setActiveIdx(idx)}
              className={`h-1.5 rounded-full transition-all duration-200 ${idx === activeIdx ? "w-4 bg-white" : "w-1.5 bg-white/40"}`} />
          ))}
        </div>
      </div>
      <div className="flex gap-2 overflow-x-auto pb-1">
        {images.map((src, idx) => (
          <button key={idx} onClick={() => setActiveIdx(idx)}
            className={`flex-shrink-0 w-16 h-16 rounded-lg overflow-hidden border-2 transition-all duration-200 ${
              idx === activeIdx ? "border-green-500 ring-2 ring-green-500/30" : "border-gray-700 hover:border-gray-500 opacity-60 hover:opacity-100"
            }`}>
            <img src={src} alt={`Thumbnail ${idx + 1}`} className="w-full h-full object-cover"
              onError={(e) => { (e.target as HTMLImageElement).src = "/bgimg.png"; }} />
          </button>
        ))}
      </div>
    </div>
  );
}

const SingleFoundItem = () => {
  const { foundItem: foundItemParam } = useParams<{ foundItem: string }>();
  const foundItemId = foundItemParam;
  const users: any = useUserVerification();
  const isAdmin = users?.role === "ADMIN";

  const { data: singleFoundItem, isLoading, refetch } = useGetSingleFoundItemQuery(foundItemId!);
  const [createClaim, { isLoading: claimLoading }]    = useCreateClaimMutation();
  const [updateClaimStatus]                           = useUpdateClaimStatusMutation();
  const [isSubmitting, setIsSubmitting]               = useState(false);
  const [isClaimModalOpen, setIsClaimModalOpen]       = useState(false);

  const { register, handleSubmit, formState: { errors }, reset } = useForm();

  const onSubmit = async (data: any) => {
    setIsSubmitting(true);
    try {
      const claimData = {
        foundItemId,
        distinguishingFeatures: data.distinguishingFeatures,
        lostDate: new Date(data.lostDate).toISOString(),
        claimantName: data.claimantName,
        schoolEmail: data.schoolEmail,   // ✅ replaced contactNumber
      };
      const res: any = await createClaim(claimData);
      if (res?.data?.success) {
        if (isAdmin && res?.data?.data?.id) {
          await updateClaimStatus({ claimId: res.data.data.id, status: "APPROVED" });
          toast.success("Claim processed and marked as approved!");
          refetch();
        } else {
          toast.success("Your claim has been submitted. Please visit the SAS office with a valid ID for verification.");
        }
        setIsClaimModalOpen(false);
        reset();
      } else {
        toast.error("Failed to submit claim. Please try again.");
      }
    } catch {
      toast.error("An unexpected error occurred.");
    } finally {
      setIsSubmitting(false);
    }
  };

  if (!foundItemId) return (
    <div className="min-h-screen bg-gray-950 flex items-center justify-center">
      <div className="bg-gray-900 rounded-2xl p-8 border border-gray-800 text-center max-w-md mx-auto px-4">
        <div className="text-5xl mb-4">⚠️</div>
        <h2 className="text-2xl font-bold text-white mb-3">Invalid Item</h2>
        <Link to="/foundItems" className="inline-flex items-center gap-2 px-5 py-2.5 bg-blue-600 hover:bg-blue-500 text-white font-semibold rounded-lg text-sm">
          <FaArrowLeft size={11} /> Back
        </Link>
      </div>
    </div>
  );

  if (isLoading) return (
    <div className="min-h-screen bg-gray-950 flex items-center justify-center">
      <div className="text-center"><Spinner size="xl" className="mb-4" /><p className="text-gray-400 text-sm">Loading...</p></div>
    </div>
  );

  const foundItemData = singleFoundItem?.data;
  if (!foundItemData) return (
    <div className="min-h-screen bg-gray-950 flex items-center justify-center">
      <div className="bg-gray-900 rounded-2xl p-8 border border-gray-800 text-center max-w-md mx-auto px-4">
        <div className="text-5xl mb-4">😞</div>
        <h2 className="text-2xl font-bold text-white mb-3">Item Not Found</h2>
        <Link to="/foundItems" className="inline-flex items-center gap-2 px-5 py-2.5 bg-blue-600 hover:bg-blue-500 text-white font-semibold rounded-lg text-sm">
          <FaArrowLeft size={11} /> Back
        </Link>
      </div>
    </div>
  );

  const isClaimed = foundItemData?.isClaimed;

  const imageList: string[] = Array.isArray(foundItemData.images) && foundItemData.images.length > 0
    ? foundItemData.images.map((i: any) => (typeof i === "string" ? i : i?.url ?? i?.src ?? ""))
    : foundItemData?.img ? [foundItemData.img] : [];

  return (
    <>
      <div className="min-h-screen bg-gray-950">
        {/* Header */}
        <div className="border-b border-gray-800 bg-gray-950">
          <div className="w-full px-4 sm:px-10 lg:px-16 py-5">
            <Link to="/foundItems"
              className="inline-flex items-center gap-2 bg-blue-600 hover:bg-blue-500 text-white text-sm font-semibold px-4 py-2 rounded-lg transition-all duration-200 mb-4">
              <FaArrowLeft size={11} /> Back
            </Link>
            <div className="flex items-start justify-between gap-3">
              <div>
                <h1 className="text-xl sm:text-2xl md:text-3xl font-bold text-white">{foundItemData?.foundItemName || "Found Item"}</h1>
                <p className="text-gray-500 text-sm mt-1">Found item details</p>
              </div>
              {isClaimed ? (
                <span className="shrink-0 inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-semibold bg-green-600/20 text-green-400 border border-green-600/30">
                  <FaCheckCircle size={10} /> Claimed
                </span>
              ) : (
                <span className="shrink-0 inline-flex items-center px-3 py-1.5 rounded-full text-xs font-semibold bg-blue-600/20 text-blue-400 border border-blue-600/30">
                  Available
                </span>
              )}
            </div>
          </div>
        </div>

        {/* Main Content */}
        <div className="w-full px-4 sm:px-10 lg:px-16 py-6 sm:py-10">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 lg:gap-10 items-stretch">

            {/* Left: Image */}
            <div className="flex flex-col h-full">
              <ImageCarousel images={imageList} alt={foundItemData?.foundItemName} />
            </div>

            {/* Right: Details */}
            <div className="space-y-4">
              <div className="bg-gray-900 rounded-xl p-5 border border-gray-800">
                <h2 className="text-xs font-bold text-white uppercase tracking-widest mb-3">Description</h2>
                <p className="text-gray-400 leading-relaxed text-sm">{foundItemData?.description || "No description available."}</p>
              </div>

              <div className="grid grid-cols-2 gap-3">
                {[
                  { icon: <FaCalendarAlt size={12} />, label: "Date Found", value: foundItemData?.date ? new Date(foundItemData.date).toLocaleDateString("en-US", { year: "numeric", month: "long", day: "numeric" }) : "Not specified" },
                  { icon: <FaMapMarkerAlt size={12} />, label: "Location",  value: foundItemData?.location || "Not specified" },
                  { icon: <FaTag size={12} />,          label: "Category",  value: foundItemData?.category?.name || "Uncategorized" },
                  { icon: <FaUser size={12} />,         label: "Logged By", value: foundItemData?.user?.username || "SAS Office" },
                ].map((item, i) => (
                  <div key={i} className="bg-gray-900 rounded-xl p-4 border border-gray-800">
                    <div className="flex items-center gap-2 text-blue-400 mb-2">
                      {item.icon}
                      <span className="text-xs font-bold uppercase tracking-widest truncate">{item.label}</span>
                    </div>
                    <p className="text-gray-300 text-sm">{item.value}</p>
                  </div>
                ))}
              </div>

              <div className="bg-gray-900 rounded-xl p-5 border border-gray-800">
                <h3 className="text-xs font-bold text-white uppercase tracking-widest mb-3">
                  {isClaimed ? "Claim Status" : isAdmin ? "Process Claim" : "Claim This Item"}
                </h3>
                {isClaimed ? (
                  <div className="bg-green-900/20 border border-green-600/30 rounded-xl p-4 flex items-start gap-3">
                    <FaCheckCircle className="text-green-400 mt-0.5 shrink-0 text-lg" />
                    <div>
                      <p className="text-green-400 text-sm font-semibold">Item Successfully Claimed</p>
                      <p className="text-green-400/70 text-xs mt-1 leading-relaxed">This item has been verified and returned to its owner.</p>
                    </div>
                  </div>
                ) : isAdmin ? (
                    <>
                      <div className="flex items-start gap-3 bg-gray-800/60 rounded-xl p-4 border border-gray-700 mb-4">
                        <FaClipboardList className="text-blue-400 mt-0.5 shrink-0 text-lg" />
                        <div>
                          <p className="text-white text-sm font-semibold">Review claimant details</p>
                          <p className="text-gray-400 text-xs mt-1 leading-relaxed">Verify proof of ownership before marking this item as claimed.</p>
                        </div>
                      </div>
                      <button onClick={() => setIsClaimModalOpen(true)}
                        className="w-full bg-blue-600 hover:bg-blue-500 text-white font-semibold py-2.5 px-5 rounded-lg transition-all duration-200 text-sm">
                        Process Claim
                      </button>
                    </>
                ) : (
                  <div className="space-y-3">
                    <div className="flex items-start gap-3 bg-gray-800/60 rounded-xl p-4 border border-gray-700">
                      <FaBuilding className="text-blue-400 mt-0.5 shrink-0 text-lg" />
                      <div>
                        <p className="text-white text-sm font-semibold">Is this your item?</p>
                        <p className="text-gray-400 text-xs mt-1 leading-relaxed">Submit a claim with your details and proof of ownership. The SAS office will review and contact you via your school email.</p>
                      </div>
                    </div>
                    <button onClick={() => setIsClaimModalOpen(true)}
                      className="w-full bg-blue-600 hover:bg-blue-500 text-white font-semibold py-2.5 px-5 rounded-lg transition-all duration-200 text-sm">
                      Submit a Claim
                    </button>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Claim Modal */}
      {isClaimModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/75 backdrop-blur-sm">
          <div className="relative w-full max-w-md bg-gray-900 rounded-2xl border border-gray-800 shadow-2xl max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between px-4 py-3 border-b border-gray-800 sticky top-0 bg-gray-900 z-10">
              <div>
                <h3 className="text-base font-bold text-white">{isAdmin ? "Process Claim" : "Submit a Claim"}</h3>
                <p className="text-gray-500 text-xs mt-0.5">{isAdmin ? "Verify ownership and mark item as claimed" : "Provide your details to prove ownership"}</p>
              </div>
              <button onClick={() => { setIsClaimModalOpen(false); reset(); }} className="text-gray-500 hover:text-white ml-4"><FaTimes size={15} /></button>
            </div>
            <div className="px-4 py-4">
              {/* Item preview */}
              <div className="flex items-center gap-3 bg-gray-800 rounded-xl p-3 mb-5 border border-gray-700">
                <img src={foundItemData?.img} alt={foundItemData?.foundItemName}
                  className="w-14 h-14 rounded-lg object-cover shrink-0"
                  onError={(e) => { (e.target as HTMLImageElement).src = "/bgimg.png"; }} />
                <div>
                  <p className="text-white text-sm font-semibold">{foundItemData?.foundItemName}</p>
                  <p className="text-gray-400 text-xs mt-0.5">📍 {foundItemData?.location}</p>
                  <p className="text-gray-400 text-xs">📅 Found: {foundItemData?.date?.split("T")[0]}</p>
                </div>
              </div>

              <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
                {/* Full Name */}
                <div>
                  <label className="block mb-1.5 text-xs font-bold text-white uppercase tracking-widest">Full Name *</label>
                  <div className="relative">
                    <FaUser className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500" size={12} />
                    <input type="text" placeholder="Enter your full name"
                      {...register("claimantName", { required: "Full name is required" })}
                      className="w-full pl-9 pr-3 py-2.5 bg-gray-800 border border-gray-700 text-white rounded-lg focus:ring-2 focus:ring-blue-500 text-sm placeholder-gray-600" />
                  </div>
                  {errors.claimantName && <p className="text-red-400 text-xs mt-1">{errors.claimantName.message as string}</p>}
                </div>

                {/* School Email — replaces Contact Number */}
                <div>
                  <label className="block mb-1.5 text-xs font-bold text-white uppercase tracking-widest">
                    School ID / Email *
                  </label>
                  <div className="relative">
                    <FaEnvelope className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500" size={12} />
                    <input type="email" placeholder="e.g. juandelacruz@nbsc.edu.ph"
                      {...register("schoolEmail", {
                        required: "School email is required",
                        pattern: {
                          value: /^[^\s@]+@nbsc\.edu\.ph$/i,
                          message: "Must be a valid NBSC email (@nbsc.edu.ph)",
                        },
                      })}
                      className="w-full pl-9 pr-3 py-2.5 bg-gray-800 border border-gray-700 text-white rounded-lg focus:ring-2 focus:ring-blue-500 text-sm placeholder-gray-600" />
                  </div>
                  {errors.schoolEmail && <p className="text-red-400 text-xs mt-1">{errors.schoolEmail.message as string}</p>}
                </div>

                {/* Date Lost */}
                <div>
                  <label className="block mb-1.5 text-xs font-bold text-white uppercase tracking-widest">Date Item Was Lost *</label>
                  <input type="date" {...register("lostDate", { required: "Please provide the date" })}
                    className="w-full p-2.5 bg-gray-800 border border-gray-700 text-white rounded-lg focus:ring-2 focus:ring-blue-500 text-sm" />
                  {errors.lostDate && <p className="text-red-400 text-xs mt-1">{errors.lostDate.message as string}</p>}
                </div>

                {/* Proof of Ownership */}
                <div>
                  <label className="block mb-1.5 text-xs font-bold text-white uppercase tracking-widest">Proof of Ownership *</label>
                  <textarea rows={4}
                    placeholder="Describe identifying details — stickers, initials, scratches, serial number, contents inside, etc."
                    {...register("distinguishingFeatures", {
                      required: "Please describe identifying details",
                      minLength: { value: 10, message: "Please provide at least 10 characters" },
                    })}
                    className="w-full p-3 bg-gray-800 border border-gray-700 text-white rounded-lg focus:ring-2 focus:ring-blue-500 text-sm resize-none placeholder-gray-600" />
                  {errors.distinguishingFeatures && <p className="text-red-400 text-xs mt-1">{errors.distinguishingFeatures.message as string}</p>}
                </div>

                {/* Info banner */}
                <div className="bg-blue-900/20 border border-blue-600/20 rounded-lg px-4 py-3">
                  <p className="text-blue-300 text-xs leading-relaxed">
                    {isAdmin
                      ? "ℹ️ Confirming this claim will mark the item as Claimed and remove it from the available items board."
                      : "ℹ️ Your claim will be reviewed by the SAS office. We will contact you via your school email for verification."}
                  </p>
                </div>

                {/* Actions */}
                <div className="flex gap-3 pt-1">
                  <button type="button" onClick={() => { setIsClaimModalOpen(false); reset(); }}
                    className="flex-1 px-4 py-2.5 text-gray-400 bg-gray-800 hover:bg-gray-700 border border-gray-700 rounded-lg text-sm font-medium">
                    Cancel
                  </button>
                  <button type="submit" disabled={isSubmitting || claimLoading}
                    className="flex-1 px-4 py-2.5 bg-blue-600 hover:bg-blue-500 text-white rounded-lg text-sm font-semibold disabled:opacity-50">
                    {isSubmitting || claimLoading
                      ? <div className="flex items-center justify-center gap-2"><Spinner size="sm" /> Processing...</div>
                      : isAdmin ? "Confirm as Claimed" : "Submit Claim"}
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