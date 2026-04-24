import { useParams, Link } from "react-router-dom";
import { useGetSingleLostItemQuery, useCreateFoundItemMutation } from "../../redux/api/api";
import { Spinner } from "flowbite-react";
import { useState } from "react";
import { useForm } from "react-hook-form";
import { toast, ToastContainer } from "react-toastify";
import { CustomDatePicker } from "../../components/ui/CustomDatePicker";
import "react-toastify/dist/ReactToastify.css";
import {
  FaArrowLeft, FaCalendarAlt, FaMapMarkerAlt, FaUser, FaTag,
  FaTimes, FaBoxOpen, FaChevronLeft, FaChevronRight,
} from "react-icons/fa";
import { useUserVerification } from "../../auth/auth";

const HIDDEN_IMAGE_CATEGORIES = ["wallets & purses", "wallet", "purse"];

const shouldHideImage = (categoryName: string | undefined, isAdmin: boolean) => {
  if (isAdmin) return false;
  return HIDDEN_IMAGE_CATEGORIES.some((c) => categoryName?.toLowerCase().includes(c));
};

const HiddenImagePlaceholder = () => (
  <div className="relative w-full h-full min-h-[430px] rounded-2xl overflow-hidden border border-gray-800 bg-gray-900 flex flex-col items-center justify-center gap-4">
    <div className="w-20 h-20 rounded-full bg-gray-800 border border-gray-700 flex items-center justify-center">
      <svg width="36" height="36" fill="none" viewBox="0 0 24 24" stroke="currentColor" className="text-gray-600" strokeWidth="1.5">
        <path strokeLinecap="round" strokeLinejoin="round" d="M3.98 8.223A10.477 10.477 0 001.934 12C3.226 16.338 7.244 19.5 12 19.5c.993 0 1.953-.138 2.863-.395M6.228 6.228A10.45 10.45 0 0112 4.5c4.756 0 8.773 3.162 10.065 7.498a10.523 10.523 0 01-4.293 5.774M6.228 6.228L3 3m3.228 3.228l3.65 3.65m7.894 7.894L21 21m-3.228-3.228l-3.65-3.65m0 0a3 3 0 10-4.243-4.243m4.242 4.242L9.88 9.88" />
      </svg>
    </div>
    <div className="text-center px-6">
      <p className="text-white font-semibold text-sm mb-1">Image Not Available</p>
      <p className="text-gray-500 text-xs leading-relaxed">The photo of this item is hidden from public view. Submit a claim with proof of ownership to proceed.</p>
    </div>
  </div>
);

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
        <button onClick={prev} className="absolute left-3 top-1/2 -translate-y-1/2 w-9 h-9 rounded-full bg-black/60 hover:bg-black/80 text-white flex items-center justify-center backdrop-blur-sm border border-white/10 transition-all">
          <FaChevronLeft size={13} />
        </button>
        <button onClick={next} className="absolute right-3 top-1/2 -translate-y-1/2 w-9 h-9 rounded-full bg-black/60 hover:bg-black/80 text-white flex items-center justify-center backdrop-blur-sm border border-white/10 transition-all">
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
              idx === activeIdx ? "border-blue-500 ring-2 ring-blue-500/30" : "border-gray-700 hover:border-gray-500 opacity-60 hover:opacity-100"
            }`}>
            <img src={src} alt={`Thumbnail ${idx + 1}`} className="w-full h-full object-cover"
              onError={(e) => { (e.target as HTMLImageElement).src = "/bgimg.png"; }} />
          </button>
        ))}
      </div>
    </div>
  );
}

// ── Helpers ────────────────────────────────────────────────────────────────────
const openModal  = (setter: (v: boolean) => void) => { setter(true);  document.body.classList.add("modal-open");    };
const closeModal = (setter: (v: boolean) => void) => { setter(false); document.body.classList.remove("modal-open"); };

const SingleLostItem = () => {
  const users: any = useUserVerification();
  const isAdmin = users?.role === "ADMIN";

  const { lostItem: lostItemId }: any = useParams();
  const { data: singleLostItem, isLoading, refetch } = useGetSingleLostItemQuery(lostItemId);
  const [createFoundItem, { isLoading: submitLoading }] = useCreateFoundItemMutation();

  const [isModalOpen, setIsModalOpen]     = useState(false);
  const [foundDate, setFoundDate]         = useState(new Date().toISOString().split("T")[0]);
  const [isSubmitting, setIsSubmitting]   = useState(false);
  const [reportedFound, setReportedFound] = useState<boolean>(false);

  const { register, handleSubmit, formState: { errors }, reset } = useForm();

  const onSubmit = async (data: any) => {
    setIsSubmitting(true);
    try {
      const foundData = {
        foundItemName: lostItem?.lostItemName,
        description:   data.description,
        img:           lostItem?.img || "",
        location:      data.location,
        date:          new Date(foundDate + "T00:00:00"),
        claimProcess:  "Visit the SAS office with valid ID to claim this item.",
        categoryId:    lostItem?.category?.id,
        lostItemId:    lostItemId,
        reporterName:  data.reporterName || "",
      };
      const res: any = await createFoundItem(foundData);
      if (res?.data?.success == false) {
        toast.error("Failed to submit. Please try again.");
      } else {
        toast.success("Thank you! The item has been reported as found.");
        closeModal(setIsModalOpen);
        setReportedFound(true);
        refetch();
        reset();
      }
    } catch {
      toast.error("Something went wrong. Please try again.");
    } finally {
      setIsSubmitting(false);
    }
  };

  if (isLoading) return (
    <div className="min-h-screen bg-gray-950 flex items-center justify-center">
      <div className="text-center"><Spinner size="xl" className="mb-4" /><p className="text-gray-400 text-sm">Loading item details...</p></div>
    </div>
  );

  const lostItem = singleLostItem?.data;

  if (!lostItem) return (
    <div className="min-h-screen bg-gray-950 flex items-center justify-center">
      <div className="bg-gray-900 rounded-2xl p-8 border border-gray-800 text-center max-w-md mx-auto px-4">
        <h2 className="text-2xl font-bold text-white mb-3">Item Not Found</h2>
        <Link to="/lostItems" className="inline-flex items-center gap-2 px-5 py-2.5 bg-blue-600 hover:bg-blue-500 text-white font-semibold rounded-lg text-sm">
          <FaArrowLeft size={11} /> Back
        </Link>
      </div>
    </div>
  );

  const { lostItemName, date, isFound, img, description, location, user, category } = lostItem;
  const alreadyFound = isFound || reportedFound;
  const hideImage = shouldHideImage(category?.name, isAdmin);

  const imageList: string[] = Array.isArray(lostItem.images) && lostItem.images.length > 0
    ? lostItem.images.map((i: any) => (typeof i === "string" ? i : i?.url ?? i?.src ?? ""))
    : img ? [img] : [];

  return (
    <>
      <div className="min-h-screen bg-gray-950">
        {/* Header */}
        <div className="border-b border-gray-800 bg-gray-950">
          <div className="w-full px-4 sm:px-10 lg:px-16 py-5">
            <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-2">
              <div className="min-w-0">
                <h1 className="text-xl sm:text-2xl md:text-3xl font-bold text-white leading-tight">{lostItemName || "Lost Item"}</h1>
                <p className="text-gray-500 text-sm mt-1">Lost item details and information</p>
              </div>
            </div>
          </div>
        </div>

        {/* Main Content */}
        <div className="w-full px-4 sm:px-10 lg:px-16 py-6 sm:py-10">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 lg:gap-10 items-stretch">

            {/* Left: Image Carousel with "Lost" Overlay Badge */}
            <div className="relative flex flex-col h-full rounded-2xl overflow-hidden">
              {!alreadyFound && (
                <div className="absolute top-4 left-4 z-10 px-3 py-1 bg-red-600 text-white text-[10px] uppercase font-bold rounded-full shadow-lg border border-red-700/50 tracking-wider">
                  Lost
                </div>
              )}
              {hideImage ? (
                <HiddenImagePlaceholder />
              ) : (
                <ImageCarousel images={imageList} alt={lostItemName} />
              )}
            </div>

            {/* Right: Details */}
            <div className="space-y-4">
              <div className="bg-gray-900 rounded-xl p-5 border border-gray-800">
                <h2 className="text-xs font-bold text-white uppercase tracking-widest mb-3">Description</h2>
                <p className="text-gray-400 leading-relaxed text-sm">{description || "No description available."}</p>
              </div>

              <div className="grid grid-cols-2 gap-3">
                {[
                  { icon: <FaCalendarAlt size={12} />, label: "Date Lost",    value: date ? new Date(date).toLocaleDateString("en-US", { year: "numeric", month: "long", day: "numeric" }) : "Not specified" },
                  { icon: <FaMapMarkerAlt size={12} />, label: "Location",    value: location || "Not specified" },
                  { icon: <FaTag size={12} />,          label: "Category",    value: category?.name || "Uncategorized" },
                  { icon: <FaUser size={12} />,         label: "Reported By", value: lostItem?.reporterName || user?.username || "Anonymous" },
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
                <h3 className="text-xs font-bold text-white uppercase tracking-widest mb-2">Found This Item?</h3>
                {alreadyFound ? (
                  <div className="bg-green-900/20 border border-green-600/30 rounded-xl p-4 flex items-start gap-3">
                    <span className="text-green-400 text-xl mt-0.5">✓</span>
                    <div>
                      <p className="text-green-400 text-sm font-semibold">
                        {reportedFound ? "Thank you for reporting this!" : "This item has been marked as found!"}
                      </p>
                      <p className="text-green-400/70 text-xs mt-1 leading-relaxed">
                        {reportedFound ? "Your report has been submitted." : "Someone has already reported finding this item."}
                      </p>
                    </div>
                  </div>
                ) : (
                  <>
                    <div className="flex items-start gap-3 bg-gray-800/60 rounded-xl p-4 border border-gray-700 mb-4">
                      <FaBoxOpen className="text-blue-400 mt-0.5 shrink-0 text-lg" />
                      <div>
                        <p className="text-white text-sm font-semibold">Did you find this item?</p>
                        <p className="text-gray-400 text-xs mt-1 leading-relaxed">Let the owner know by filling in where and when you found it. The SAS office will take it from there.</p>
                      </div>
                    </div>
                    <button
                      onClick={() => openModal(setIsModalOpen)}
                      className="w-full bg-blue-600 hover:bg-blue-500 text-white font-semibold py-2.5 px-5 rounded-lg transition-all duration-200 text-sm">
                      I Found This Item
                    </button>
                  </>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/75 backdrop-blur-sm">
          <div className="relative w-full max-w-md bg-gray-900 rounded-2xl border border-gray-800 shadow-2xl max-h-[90vh] overflow-y-auto custom-scrollbar">
            <div className="flex items-start justify-between px-4 py-3 border-b border-gray-800 sticky top-0 bg-gray-900 z-10">
              <div>
                <h3 className="text-base font-bold text-white">I found this item</h3>
                <p className="text-gray-500 text-xs mt-0.5">Tell us where and when you found <span className="text-white font-medium">{lostItemName}</span></p>
              </div>
              <button
                onClick={() => closeModal(setIsModalOpen)}
                className="text-gray-500 hover:text-white ml-4 mt-0.5 transition-colors">
                <FaTimes size={14} />
              </button>
            </div>

            <div className="px-4 py-4 space-y-3">
              <div className="flex items-center gap-3 bg-gray-800/70 rounded-xl p-3 border border-gray-700/60">
                {hideImage ? (
                  <div className="w-14 h-14 rounded-lg shrink-0 border border-gray-700 bg-gray-700 flex items-center justify-center">
                    <svg width="22" height="22" fill="none" viewBox="0 0 24 24" stroke="currentColor" className="text-gray-500" strokeWidth="1.5">
                      <path strokeLinecap="round" strokeLinejoin="round" d="M3.98 8.223A10.477 10.477 0 001.934 12C3.226 16.338 7.244 19.5 12 19.5c.993 0 1.953-.138 2.863-.395M6.228 6.228A10.45 10.45 0 0112 4.5c4.756 0 8.773 3.162 10.065 7.498a10.523 10.523 0 01-4.293 5.774M6.228 6.228L3 3m3.228 3.228l3.65 3.65m7.894 7.894L21 21m-3.228-3.228l-3.65-3.65m0 0a3 3 0 10-4.243-4.243m4.242 4.242L9.88 9.88" />
                    </svg>
                  </div>
                ) : (
                  <img src={img} alt={lostItemName}
                    className="w-14 h-14 rounded-lg object-cover shrink-0 border border-gray-700"
                    onError={(e) => { (e.target as HTMLImageElement).src = "/bgimg.png"; }} />
                )}
                <div className="flex-1 min-w-0">
                  <p className="text-white text-sm font-semibold truncate">{lostItemName}</p>
                  <p className="text-gray-400 text-xs mt-0.5 truncate">{location}</p>
                  <p className="text-gray-400 text-xs">Lost: {date?.split("T")[0]}</p>
                </div>
                <span className="shrink-0 text-xs font-semibold px-2.5 py-1 rounded-full bg-red-500/10 text-red-400 border border-red-500/20">Missing</span>
              </div>

              <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block mb-1.5 text-[11px] font-semibold text-gray-400 uppercase tracking-wider">Your name <span className="text-red-400">*</span></label>
                    <input type="text" placeholder=" "
                      {...register("reporterName", { required: "Please enter your name" })}
                      className="w-full px-3 py-2.5 bg-gray-800 border border-gray-700 text-white rounded-lg focus:ring-2 focus:ring-green-500 text-sm placeholder-gray-600" />
                    {errors.reporterName && <p className="text-red-400 text-xs mt-1">{errors.reporterName.message as string}</p>}
                  </div>
                  <div>
                    <label className="block mb-1.5 text-[11px] font-semibold text-gray-400 uppercase tracking-wider">Where found <span className="text-red-400">*</span></label>
                    <input type="text" placeholder=" "
                      {...register("location", { required: "Please provide the location" })}
                      className="w-full px-3 py-2.5 bg-gray-800 border border-gray-700 text-white rounded-lg focus:ring-2 focus:ring-green-500 text-sm placeholder-gray-600" />
                    {errors.location && <p className="text-red-400 text-xs mt-1">{errors.location.message as string}</p>}
                  </div>
                </div>

                <div>
                  <label className="block mb-1.5 text-[11px] font-semibold text-gray-400 uppercase tracking-wider">Date you found it</label>
                  <CustomDatePicker
                    value={foundDate}
                    onChange={setFoundDate}
                    max={new Date().toISOString().split("T")[0]}
                    placeholder="Select date found"
                    openUp
                  />
                </div>

                <div>
                  <label className="block mb-1.5 text-[11px] font-semibold text-gray-400 uppercase tracking-wider">Additional details</label>
                  <textarea rows={2} placeholder=" "
                    {...register("description")}
                    className="w-full p-3 bg-gray-800 border border-gray-700 text-white rounded-lg focus:ring-2 focus:ring-green-500 text-sm resize-none placeholder-gray-600" />
                </div>

                <div className="flex items-start gap-2.5 bg-blue-500/5 border border-blue-500/15 rounded-lg px-4 py-3">
                  <p className="text-blue-300/80 text-xs leading-relaxed text-justify">Your report will be submitted to the SAS office. The owner can visit and claim it with proof of ownership.</p>
                </div>

                <div className="flex gap-3 pt-1">
                  <button type="button"
                    onClick={() => closeModal(setIsModalOpen)}
                    className="flex-1 px-4 py-2.5 text-gray-400 bg-gray-800 hover:bg-gray-700 border border-gray-700 rounded-lg text-sm font-medium transition-colors">
                    Cancel
                  </button>
                  <button type="submit" disabled={isSubmitting || submitLoading}
                    className="flex-[2] px-4 py-2.5 bg-blue-600 hover:bg-blue-500 text-white rounded-lg text-sm font-semibold disabled:opacity-50 transition-colors">
                    {isSubmitting || submitLoading
                      ? <div className="flex items-center justify-center gap-2"><Spinner size="sm" /> Submitting...</div>
                      : "Submit report"}
                  </button>
                </div>
              </form>
            </div>
          </div>
        </div>
      )}

      <ToastContainer position="top-right" autoClose={3000} style={{ top: "70px" }} theme="dark" />
    </>
  );
};

export default SingleLostItem;