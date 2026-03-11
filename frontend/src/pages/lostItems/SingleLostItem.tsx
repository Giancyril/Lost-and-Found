import { useParams, Link } from "react-router-dom";
import { useGetSingleLostItemQuery, useCreateFoundItemMutation } from "../../redux/api/api";
import { Spinner } from "flowbite-react";
import { useState } from "react";
import { useForm } from "react-hook-form";
import { toast, ToastContainer } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";
import DatePicker from "react-datepicker";
import "react-datepicker/dist/react-datepicker.css";
import {
  FaArrowLeft,
  FaCalendarAlt,
  FaMapMarkerAlt,
  FaUser,
  FaTag,
  FaTimes,
  FaBoxOpen,
  FaChevronLeft,
  FaChevronRight,
} from "react-icons/fa";

// ─── Image Carousel ────────────────────────────────────────────────────────────
function ImageCarousel({ images, alt }: { images: string[]; alt: string }) {
  const [activeIdx, setActiveIdx] = useState(0);

  const prev = () => setActiveIdx((i) => (i === 0 ? images.length - 1 : i - 1));
  const next = () => setActiveIdx((i) => (i === images.length - 1 ? 0 : i + 1));

  if (images.length === 0) {
    return (
      <div className="rounded-2xl overflow-hidden border border-gray-800 bg-gray-900 flex items-center justify-center min-h-80">
        <img src="/bgimg.png" alt={alt} className="w-full h-full object-cover" />
      </div>
    );
  }

  if (images.length === 1) {
    return (
      <div className="rounded-2xl overflow-hidden border border-gray-800 bg-gray-900">
        <img
          src={images[0]}
          alt={alt}
          className="w-full min-h-80 object-cover"
          onError={(e) => { (e.target as HTMLImageElement).src = "/bgimg.png"; }}
        />
      </div>
    );
  }

  return (
    <div className="space-y-3">
      <div className="relative rounded-2xl overflow-hidden border border-gray-800 bg-gray-900 group">
        <img
          src={images[activeIdx]}
          alt={`${alt} — photo ${activeIdx + 1}`}
          className="w-full min-h-80 max-h-[480px] object-cover transition-all duration-300"
          onError={(e) => { (e.target as HTMLImageElement).src = "/bgimg.png"; }}
        />
        <button
          onClick={prev}
          className="absolute left-3 top-1/2 -translate-y-1/2 w-9 h-9 rounded-full bg-black/60 hover:bg-black/80 text-white flex items-center justify-center transition-all duration-200 opacity-0 group-hover:opacity-100 backdrop-blur-sm border border-white/10"
        >
          <FaChevronLeft size={13} />
        </button>
        <button
          onClick={next}
          className="absolute right-3 top-1/2 -translate-y-1/2 w-9 h-9 rounded-full bg-black/60 hover:bg-black/80 text-white flex items-center justify-center transition-all duration-200 opacity-0 group-hover:opacity-100 backdrop-blur-sm border border-white/10"
        >
          <FaChevronRight size={13} />
        </button>
        <div className="absolute bottom-3 right-3 bg-black/60 backdrop-blur-sm text-white text-xs font-semibold px-2.5 py-1 rounded-full border border-white/10">
          {activeIdx + 1} / {images.length}
        </div>
        <div className="absolute bottom-3 left-1/2 -translate-x-1/2 flex gap-1.5">
          {images.map((_, idx) => (
            <button
              key={idx}
              onClick={() => setActiveIdx(idx)}
              className={`h-1.5 rounded-full transition-all duration-200 ${
                idx === activeIdx ? "bg-white w-4" : "bg-white/40 hover:bg-white/70 w-1.5"
              }`}
            />
          ))}
        </div>
      </div>
      <div className="flex gap-2 overflow-x-auto pb-1">
        {images.map((src, idx) => (
          <button
            key={idx}
            onClick={() => setActiveIdx(idx)}
            className={`flex-shrink-0 w-16 h-16 rounded-lg overflow-hidden border-2 transition-all duration-200 ${
              idx === activeIdx
                ? "border-blue-500 ring-2 ring-blue-500/30"
                : "border-gray-700 hover:border-gray-500 opacity-60 hover:opacity-100"
            }`}
          >
            <img
              src={src}
              alt={`Thumbnail ${idx + 1}`}
              className="w-full h-full object-cover"
              onError={(e) => { (e.target as HTMLImageElement).src = "/bgimg.png"; }}
            />
          </button>
        ))}
      </div>
    </div>
  );
}

// ─── Main Component ────────────────────────────────────────────────────────────
const SingleLostItem = () => {
  const { lostItem: lostItemId }: any = useParams();
  const { data: singleLostItem, isLoading, refetch } = useGetSingleLostItemQuery(lostItemId);
  const [createFoundItem, { isLoading: submitLoading }] = useCreateFoundItemMutation();

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [foundDate, setFoundDate] = useState(new Date());
  const [isSubmitting, setIsSubmitting] = useState(false);
  // Track if user already reported this item as found — persists across refreshes via localStorage
  const storageKey = `reported_found_${lostItemId}`;
  const [reportedFound, setReportedFound] = useState<boolean>(
    () => localStorage.getItem(storageKey) === "true"
  );

  const { register, handleSubmit, formState: { errors }, reset } = useForm();

  const onSubmit = async (data: any) => {
    setIsSubmitting(true);
    try {
      const foundData = {
        foundItemName: lostItem?.lostItemName,
        description: data.description,
        img: lostItem?.img || "",
        location: data.location,
        date: foundDate,
        claimProcess: "Visit the SAS office with valid ID to claim this item.",
        categoryId: lostItem?.category?.id,
        lostItemId: lostItemId, // tells backend to flip isFound=true on the original lost item
      };
      const res: any = await createFoundItem(foundData);
      if (res?.data?.success == false) {
        toast.error("Failed to submit. Please try again.");
      } else {
        toast.success("Thank you! The item has been reported as found.");
        setIsModalOpen(false);
        setReportedFound(true);
        localStorage.setItem(storageKey, "true"); // persist across refreshes
        refetch();
        reset();
      }
    } catch (err) {
      toast.error("Something went wrong. Please try again.");
    } finally {
      setIsSubmitting(false);
    }
  };

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
            <Link to="/lostItems" className="inline-flex items-center px-6 py-2.5 bg-blue-600 hover:bg-blue-500 text-white font-semibold rounded-lg transition-all duration-200 text-sm">
              <FaArrowLeft className="mr-2" /> Back
            </Link>
          </div>
        </div>
      </div>
    );
  }

  const { lostItemName, date, isFound, img, description, location, user, category } = lostItem;

  // isFound from backend OR reportedFound from this session
  const alreadyFound = isFound || reportedFound;

  const imageList: string[] = Array.isArray(lostItem.images) && lostItem.images.length > 0
    ? lostItem.images.map((i: any) => (typeof i === "string" ? i : i?.url ?? i?.src ?? ""))
    : img
    ? [img]
    : [];

  return (
    <>
      <div className="min-h-screen bg-gray-950">

        {/* Header */}
        <div className="border-b border-gray-800 bg-gray-950">
          <div className="w-full px-6 sm:px-10 lg:px-16 py-5">
            <Link
              to="/lostItems"
              className="inline-flex items-center gap-2 bg-blue-600 hover:bg-blue-500 text-white text-sm font-semibold px-4 py-2 rounded-lg transition-all duration-200 mb-4"
            >
              <FaArrowLeft size={11} /> Back
            </Link>
            <div className="flex items-center justify-between">
              <div>
                <h1 className="text-2xl md:text-3xl font-bold text-white">
                  {lostItemName || "Lost Item"}
                </h1>
                <p className="text-gray-500 text-sm mt-1">Lost item details and information</p>
              </div>
              {alreadyFound ? (
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

            <ImageCarousel images={imageList} alt={lostItemName} />

            <div className="space-y-5">

              <div className="bg-gray-900 rounded-xl p-5 border border-gray-800">
                <h2 className="text-xs font-bold text-white uppercase tracking-widest mb-3">Description</h2>
                <p className="text-gray-400 leading-relaxed text-sm">
                  {description || "No description available for this item."}
                </p>
              </div>

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

              {/* Found This Item section */}
              <div className="bg-gray-900 rounded-xl p-5 border border-gray-800">
                <h3 className="text-xs font-bold text-white uppercase tracking-widest mb-2">
                  Found This Item?
                </h3>

                {alreadyFound ? (
                  /* After submit or if already marked found by backend */
                  <div className="bg-green-900/20 border border-green-600/30 rounded-xl p-4 flex items-start gap-3">
                    <span className="text-green-400 text-xl mt-0.5">✓</span>
                    <div>
                      <p className="text-green-400 text-sm font-semibold">
                        {reportedFound ? "Thank you for reporting this!" : "This item has been marked as found!"}
                      </p>
                      <p className="text-green-400/70 text-xs mt-1 leading-relaxed">
                        {reportedFound
                          ? "Your report has been submitted. The SAS Office will contact the owner."
                          : "Someone has already reported finding this item."}
                      </p>
                    </div>
                  </div>
                ) : (
                  <>
                    <p className="text-gray-500 text-sm mb-4 leading-relaxed">
                      If you found this item, click below to let the owner know. Fill in where and when you found it.
                    </p>
                    <button
                      onClick={() => setIsModalOpen(true)}
                      className="w-full bg-green-600 hover:bg-green-500 text-white font-semibold py-2.5 px-5 rounded-lg transition-all duration-200 text-sm flex items-center justify-center gap-2"
                    >
                      <FaBoxOpen size={13} />
                      I Found This Item
                    </button>
                  </>
                )}
              </div>

            </div>
          </div>
        </div>
      </div>

      {/* I Found This Item Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/75 backdrop-blur-sm">
          <div className="relative w-full max-w-lg bg-gray-900 rounded-2xl border border-gray-800 shadow-2xl max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between px-6 py-4 border-b border-gray-800 sticky top-0 bg-gray-900 z-10">
              <div>
                <h3 className="text-base font-bold text-white">I Found This Item</h3>
                <p className="text-gray-500 text-xs mt-0.5">
                  Tell us where and when you found <span className="text-white">{lostItemName}</span>
                </p>
              </div>
              <button onClick={() => setIsModalOpen(false)} className="text-gray-500 hover:text-white transition-colors duration-200 ml-4">
                <FaTimes size={15} />
              </button>
            </div>

            <div className="px-6 py-5">
              <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
                <div>
                  <label className="block mb-1.5 text-xs font-bold text-white uppercase tracking-widest">
                    Where Did You Find It?
                  </label>
                  <input
                    type="text"
                    placeholder="e.g. Library, Canteen, Room 205"
                    {...register("location", { required: "Please provide the location" })}
                    className="w-full p-3 bg-gray-800 border border-gray-700 text-white rounded-lg focus:ring-2 focus:ring-green-500 focus:border-green-500 text-sm transition-all duration-200 placeholder-gray-600"
                  />
                  {errors.location && <p className="text-red-400 text-xs mt-1">{errors.location.message as string}</p>}
                </div>

                <div>
                  <label className="block mb-1.5 text-xs font-bold text-white uppercase tracking-widest">
                    Date You Found It
                  </label>
                  <DatePicker
                    wrapperClassName="w-full"
                    className="w-full p-3 bg-gray-800 border border-gray-700 text-white rounded-lg focus:ring-2 focus:ring-green-500 focus:border-green-500 text-sm transition-all duration-200"
                    selected={foundDate}
                    onChange={(date: any) => setFoundDate(date)}
                    dateFormat="yyyy-MM-dd"
                    maxDate={new Date()}
                    showYearDropdown
                    showMonthDropdown
                    dropdownMode="select"
                  />
                </div>

                <div>
                  <label className="block mb-1.5 text-xs font-bold text-white uppercase tracking-widest">
                    Additional Details
                  </label>
                  <textarea
                    rows={3}
                    placeholder="Any extra details about the condition or where exactly it was found"
                    {...register("description")}
                    className="w-full p-3 bg-gray-800 border border-gray-700 text-white rounded-lg focus:ring-2 focus:ring-green-500 focus:border-green-500 text-sm transition-all duration-200 resize-none placeholder-gray-600"
                  />
                </div>

                <div className="flex gap-3 pt-1">
                  <button
                    type="button"
                    onClick={() => setIsModalOpen(false)}
                    className="flex-1 px-4 py-2.5 text-gray-400 bg-gray-800 hover:bg-gray-700 border border-gray-700 rounded-lg text-sm font-medium transition-all duration-200"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={isSubmitting || submitLoading}
                    className="flex-1 px-4 py-2.5 bg-green-600 hover:bg-green-500 text-white rounded-lg text-sm font-semibold transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    {isSubmitting || submitLoading ? (
                      <div className="flex items-center justify-center gap-2"><Spinner size="sm" /> Submitting...</div>
                    ) : "Submit"}
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