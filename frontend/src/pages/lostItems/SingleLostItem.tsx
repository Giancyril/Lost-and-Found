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
  FaArrowLeft, FaCalendarAlt, FaMapMarkerAlt, FaUser, FaTag,
  FaTimes, FaBoxOpen, FaChevronLeft, FaChevronRight,
} from "react-icons/fa";

function ImageCarousel({ images, alt }: { images: string[]; alt: string }) {
  const [activeIdx, setActiveIdx] = useState(0);
  const prev = () => setActiveIdx((i) => (i === 0 ? images.length - 1 : i - 1));
  const next = () => setActiveIdx((i) => (i === images.length - 1 ? 0 : i + 1));

  if (images.length === 0) return (
    <div className="relative w-full aspect-square sm:aspect-video lg:aspect-auto lg:min-h-[320px] rounded-2xl overflow-hidden border border-gray-800 bg-gray-900">
      <img src="/bgimg.png" alt={alt} className="absolute inset-0 w-full h-full object-cover" />
    </div>
  );

  if (images.length === 1) return (
    <div className="relative w-full aspect-square sm:aspect-video lg:aspect-auto lg:min-h-[320px] rounded-2xl overflow-hidden border border-gray-800 bg-gray-900">
      <img src={images[0]} alt={alt} className="absolute inset-0 w-full h-full object-cover"
        onError={(e) => { (e.target as HTMLImageElement).src = "/bgimg.png"; }} />
    </div>
  );

  return (
    <div className="flex flex-col gap-3">
      <div className="relative w-full aspect-square sm:aspect-video lg:aspect-auto lg:min-h-[320px] rounded-2xl overflow-hidden border border-gray-800 bg-gray-900">
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

const SingleLostItem = () => {
  const { lostItem: lostItemId }: any = useParams();
  const { data: singleLostItem, isLoading, refetch } = useGetSingleLostItemQuery(lostItemId);
  const [createFoundItem, { isLoading: submitLoading }] = useCreateFoundItemMutation();

  const [isModalOpen, setIsModalOpen]     = useState(false);
  const [foundDate, setFoundDate]         = useState(new Date());
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
        date:          foundDate,
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
        setIsModalOpen(false);
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
        <div className="text-5xl mb-4">😞</div>
        <h2 className="text-2xl font-bold text-white mb-3">Item Not Found</h2>
        <Link to="/lostItems" className="inline-flex items-center gap-2 px-5 py-2.5 bg-blue-600 hover:bg-blue-500 text-white font-semibold rounded-lg text-sm">
          <FaArrowLeft size={11} /> Back
        </Link>
      </div>
    </div>
  );

  const { lostItemName, date, isFound, img, description, location, user, category } = lostItem;
  const alreadyFound = isFound || reportedFound;

  const imageList: string[] = Array.isArray(lostItem.images) && lostItem.images.length > 0
    ? lostItem.images.map((i: any) => (typeof i === "string" ? i : i?.url ?? i?.src ?? ""))
    : img ? [img] : [];

  return (
    <>
      <div className="min-h-screen bg-gray-950">
        {/* Header */}
        <div className="border-b border-gray-800 bg-gray-950">
          <div className="w-full px-4 sm:px-10 lg:px-16 py-5">
            <Link to="/lostItems"
              className="inline-flex items-center gap-2 bg-blue-600 hover:bg-blue-500 text-white text-sm font-semibold px-4 py-2 rounded-lg transition-all duration-200 mb-4">
              <FaArrowLeft size={11} /> Back
            </Link>
            <div className="flex items-start justify-between gap-3">
              <div>
                <h1 className="text-xl sm:text-2xl md:text-3xl font-bold text-white">{lostItemName || "Lost Item"}</h1>
                <p className="text-gray-500 text-sm mt-1">Lost item details and information</p>
              </div>
              {alreadyFound ? (
                <span className="shrink-0 inline-flex items-center px-3 py-1.5 rounded-full text-xs font-semibold bg-green-600/20 text-green-400 border border-green-600/30">✓ Found</span>
              ) : (
                <span className="shrink-0 inline-flex items-center px-3 py-1.5 rounded-full text-xs font-semibold bg-red-600/20 text-red-400 border border-red-600/30">Missing</span>
              )}
            </div>
          </div>
        </div>

        {/* Main Content */}
        <div className="w-full px-4 sm:px-10 lg:px-16 py-6 sm:py-10">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 lg:gap-10 items-start">

            <ImageCarousel images={imageList} alt={lostItemName} />

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
                    <button onClick={() => setIsModalOpen(true)}
                      className="w-full bg-green-600 hover:bg-green-500 text-white font-semibold py-2.5 px-5 rounded-lg transition-all duration-200 text-sm flex items-center justify-center gap-2">
                      <FaBoxOpen size={13} /> I Found This Item
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
          <div className="relative w-full max-w-lg bg-gray-900 rounded-2xl border border-gray-800 shadow-2xl max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between px-6 py-4 border-b border-gray-800 sticky top-0 bg-gray-900 z-10">
              <div>
                <h3 className="text-base font-bold text-white">I Found This Item</h3>
                <p className="text-gray-500 text-xs mt-0.5">Tell us where and when you found <span className="text-white">{lostItemName}</span></p>
              </div>
              <button onClick={() => setIsModalOpen(false)} className="text-gray-500 hover:text-white ml-4"><FaTimes size={15} /></button>
            </div>
            <div className="px-6 py-5">
              <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
                <div>
                  <label className="block mb-1.5 text-xs font-bold text-white uppercase tracking-widest">Your Name <span className="text-red-500">*</span></label>
                  <input type="text" placeholder="e.g. Juan dela Cruz"
                    {...register("reporterName", { required: "Please enter your name" })}
                    className="w-full p-3 bg-gray-800 border border-gray-700 text-white rounded-lg focus:ring-2 focus:ring-green-500 text-sm placeholder-gray-600" />
                  {errors.reporterName && <p className="text-red-400 text-xs mt-1">{errors.reporterName.message as string}</p>}
                </div>
                <div>
                  <label className="block mb-1.5 text-xs font-bold text-white uppercase tracking-widest">Where Did You Find It?</label>
                  <input type="text" placeholder="e.g. Library, Canteen, Room 205"
                    {...register("location", { required: "Please provide the location" })}
                    className="w-full p-3 bg-gray-800 border border-gray-700 text-white rounded-lg focus:ring-2 focus:ring-green-500 text-sm placeholder-gray-600" />
                  {errors.location && <p className="text-red-400 text-xs mt-1">{errors.location.message as string}</p>}
                </div>
                <div>
                  <label className="block mb-1.5 text-xs font-bold text-white uppercase tracking-widest">Date You Found It</label>
                  <DatePicker wrapperClassName="w-full"
                    className="w-full p-3 bg-gray-800 border border-gray-700 text-white rounded-lg focus:ring-2 focus:ring-green-500 text-sm"
                    selected={foundDate} onChange={(date: any) => setFoundDate(date)}
                    dateFormat="yyyy-MM-dd" maxDate={new Date()} showYearDropdown showMonthDropdown dropdownMode="select" />
                </div>
                <div>
                  <label className="block mb-1.5 text-xs font-bold text-white uppercase tracking-widest">Additional Details</label>
                  <textarea rows={3} placeholder="Any extra details about the condition or where exactly it was found"
                    {...register("description")}
                    className="w-full p-3 bg-gray-800 border border-gray-700 text-white rounded-lg focus:ring-2 focus:ring-green-500 text-sm resize-none placeholder-gray-600" />
                </div>
                <div className="flex gap-3 pt-1">
                  <button type="button" onClick={() => setIsModalOpen(false)}
                    className="flex-1 px-4 py-2.5 text-gray-400 bg-gray-800 hover:bg-gray-700 border border-gray-700 rounded-lg text-sm font-medium">
                    Cancel
                  </button>
                  <button type="submit" disabled={isSubmitting || submitLoading}
                    className="flex-1 px-4 py-2.5 bg-green-600 hover:bg-green-500 text-white rounded-lg text-sm font-semibold disabled:opacity-50">
                    {isSubmitting || submitLoading ? <div className="flex items-center justify-center gap-2"><Spinner size="sm" /> Submitting...</div> : "Submit"}
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