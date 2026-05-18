import React, { useState, useEffect } from "react";
import { useParams, Link } from "react-router-dom";
import imageCompression from "browser-image-compression";
import {
  useGetSingleLostItemQuery,
  useCreateFoundItemMutation,
  useGetSightingsQuery,
  useCreateSightingMutation,
  useVerifySightingMutation,
  useDeleteSightingMutation,
} from "../../redux/api/api";
import { Spinner } from "flowbite-react";
import { useForm, Controller } from "react-hook-form";
import { toast } from "react-toastify";
import { CustomDatePicker } from "../../components/ui/CustomDatePicker";

import {
  FaArrowLeft, FaCalendarAlt, FaMapMarkerAlt, FaUser, FaTag,
  FaTimes, FaBoxOpen, FaChevronLeft, FaChevronRight, FaComments,
  FaCamera, FaEye, FaPlus, FaCheck, FaInfoCircle, FaTrash,
} from "react-icons/fa";
import { useUserVerification } from "../../auth/auth";
import { CommentModal } from "../../components/comments/CommentModal";
import LocationAutocomplete from "../../components/ui/LocationAutocomplete";

// Leaflet Imports
import { MapContainer, TileLayer, Marker, Popup, Circle, useMapEvents } from "react-leaflet";
import L from "leaflet";
import "leaflet/dist/leaflet.css";
import { getCoordinates, CAMPUS_CENTER, CAMPUS_ZOOM } from "../../utils/campusLocations";

// Fix Leaflet default icon issue
delete (L.Icon.Default.prototype as unknown as { _getIconUrl?: string })._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: "https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-icon-2x.png",
  iconUrl: "https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-icon.png",
  shadowUrl: "https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-shadow.png",
});

const HIDDEN_IMAGE_CATEGORIES = ["wallets & purses", "wallet", "purse"];

const shouldHideImage = (categoryName: string | undefined, isAdmin: boolean) => {
  if (isAdmin) return false;
  return HIDDEN_IMAGE_CATEGORIES.some((c) => categoryName?.toLowerCase().includes(c));
};

const HiddenImagePlaceholder = () => (
  <div className="relative w-full h-full min-h-[280px] rounded-2xl overflow-hidden border border-gray-800 bg-gray-900 flex flex-col items-center justify-center gap-4">
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
    <div className="relative w-full h-full min-h-[280px] lg:min-h-full rounded-2xl overflow-hidden border border-gray-800 bg-gray-900">
      <img src="/bgimg.png" alt={alt} className="absolute inset-0 w-full h-full object-cover" />
    </div>
  );

  if (images.length === 1) return (
    <div className="relative w-full h-full min-h-[280px] lg:min-h-full rounded-2xl overflow-hidden border border-gray-800 bg-gray-900">
      <img src={images[0]} alt={alt} className="absolute inset-0 w-full h-full object-cover"
        onError={(e) => { (e.target as HTMLImageElement).src = "/bgimg.png"; }} />
    </div>
  );

  return (
    <div className="flex flex-col gap-3 h-full">
      <div className="relative w-full flex-1 min-h-[280px] lg:min-h-0 rounded-2xl overflow-hidden border border-gray-800 bg-gray-900">
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
            className={`flex-shrink-0 w-16 h-16 rounded-lg overflow-hidden border-2 transition-all duration-200 ${idx === activeIdx ? "border-blue-500 ring-2 ring-blue-500/30" : "border-gray-700 hover:border-gray-500 opacity-60 hover:opacity-100"
              }`}>
            <img src={src} alt={`Thumbnail ${idx + 1}`} className="w-full h-full object-cover"
              onError={(e) => { (e.target as HTMLImageElement).src = "/bgimg.png"; }} />
          </button>
        ))}
      </div>
    </div>
  );
}

const openModal = (setter: (v: boolean) => void) => { setter(true); document.body.classList.add("modal-open"); };
const closeModal = (setter: (v: boolean) => void) => { setter(false); document.body.classList.remove("modal-open"); };

// Map event handler for placing Sighting Pin in modal
function MapSelector({ onMapClick, position }: { onMapClick: (coords: [number, number]) => void; position: [number, number] | null }) {
  useMapEvents({
    click(e) {
      onMapClick([e.latlng.lat, e.latlng.lng]);
    },
  });

  return position ? (
    <Circle center={position} radius={15} pathOptions={{ color: "#3b82f6", fillColor: "#3b82f6", fillOpacity: 0.4 }} />
  ) : null;
}

const SingleLostItem = () => {
  const users: any = useUserVerification();
  useEffect(() => { window.scrollTo(0, 0); }, []);
  const isAdmin = users?.role === "ADMIN";

  const { lostItem: lostItemId }: any = useParams();
  const { data: singleLostItem, isLoading, refetch } = useGetSingleLostItemQuery(lostItemId);
  const [createFoundItem, { isLoading: submitLoading }] = useCreateFoundItemMutation();

  // Sightings RTK Queries & Mutations (Phase 7)
  const { data: sightingsRes, refetch: refetchSightings } = useGetSightingsQuery(lostItemId);
  const [createSighting] = useCreateSightingMutation();
  const [verifySighting] = useVerifySightingMutation();
  const [deleteSighting] = useDeleteSightingMutation();

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isCommentModalOpen, setIsCommentModalOpen] = useState(false);
  const [foundDate, setFoundDate] = useState(new Date().toISOString().split("T")[0]);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [reportedFound, setReportedFound] = useState<boolean>(false);

  // Sighting Modal Form State
  const [isSightingModalOpen, setIsSightingModalOpen] = useState(false);
  const [sightingLocation, setSightingLocation] = useState("");
  const [sightingDetails, setSightingDetails] = useState("");
  const [sightingReporter, setSightingReporter] = useState("");
  const [sightingImage, setSightingImage] = useState("");
  const [sightingCoords, setSightingCoords] = useState<[number, number] | null>(null);
  const [isSightingSubmitting, setIsSightingSubmitting] = useState(false);

  const { register, handleSubmit, formState: { errors }, reset, control } = useForm();

  const onSubmit = async (data: any) => {
    setIsSubmitting(true);
    try {
      const foundData = {
        foundItemName: lostItem?.lostItemName,
        description: data.description,
        img: lostItem?.img || "",
        location: data.location,
        date: new Date(foundDate + "T00:00:00"),
        claimProcess: "Visit the SAS office with valid ID to claim this item.",
        categoryId: lostItem?.category?.id,
        lostItemId: lostItemId,
        reporterName: data.reporterName || "",
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

  // Sighting form submit handler
  const handleReportSighting = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!sightingLocation) {
      toast.error("Please enter a location name (e.g. SC-102)");
      return;
    }
    if (!sightingCoords) {
      toast.error("Please tap the map to drop a sighting pin");
      return;
    }
    setIsSightingSubmitting(true);
    try {
      const payload = {
        lostItemId,
        location: sightingLocation,
        details: sightingDetails,
        reporterName: sightingReporter || "Anonymous",
        img: sightingImage,
        coordinates: sightingCoords ? `${sightingCoords[0]},${sightingCoords[1]}` : "",
      };

      await createSighting(payload).unwrap();
      toast.success("Sighting reported successfully!");
      closeModal(setIsSightingModalOpen);
      // Reset Sighting form
      setSightingLocation("");
      setSightingDetails("");
      setSightingReporter("");
      setSightingImage("");
      setSightingCoords(null);
      refetchSightings();
    } catch (err: any) {
      toast.error(err?.data?.message || "Failed to submit sighting");
    } finally {
      setIsSightingSubmitting(false);
    }
  };

  // Sighting verification handler
  const handleVerifySighting = async (sightingId: string) => {
    try {
      await verifySighting(sightingId).unwrap();
      toast.success("Sighting verified! Pin lifespan extended.");
      refetchSightings();
    } catch (err: any) {
      toast.error(err?.data?.message || "Already verified or failed to verify");
    }
  };

  // Sighting delete handler
  const handleDeleteSighting = async (sightingId: string) => {
    if (!window.confirm("Are you sure you want to delete this sighting report?")) return;
    try {
      await deleteSighting(sightingId).unwrap();
      toast.success("Sighting deleted successfully!");
      refetchSightings();
    } catch (err: any) {
      toast.error(err?.data?.message || "Failed to delete sighting");
    }
  };

  // Convert uploaded file to base64 for direct saving
  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    let file = e.target.files?.[0];
    if (file) {
      try {
        file = await imageCompression(file, { maxSizeMB: 0.4, maxWidthOrHeight: 1200, useWebWorker: true });
      } catch (error) {
        console.error("Image compression error:", error);
      }
      const reader = new FileReader();
      reader.onloadend = () => {
        setSightingImage(reader.result as string);
      };
      reader.readAsDataURL(file);
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
        <Link to="/lostItems" className="flex items-center gap-2 px-5 py-2.5 bg-blue-600 hover:bg-blue-500 text-white font-semibold rounded-lg text-sm w-fit">
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

  // Map coordinates resolving
  const originalLocationCoords = getCoordinates(location);
  const mapCenter = originalLocationCoords || CAMPUS_CENTER;

  // Render Custom Pulsing Marker for sightings
  const pulsingIcon = L.divIcon({
    html: `<div class="relative flex items-center justify-center">
             <div class="animate-ping absolute flex h-8 w-8 rounded-full bg-blue-400/40 opacity-75"></div>
             <div class="relative flex rounded-full h-3.5 w-3.5 bg-blue-500 border-2 border-white shadow-md"></div>
           </div>`,
    className: "custom-pulsing-icon",
    iconSize: [32, 32],
  });

  const lostItemIcon = L.divIcon({
    html: `<div class="relative flex items-center justify-center">
             <div class="relative flex rounded-full h-6 w-6 bg-red-500 border-2 border-white items-center justify-center text-[10px] text-white font-black shadow-lg">L</div>
           </div>`,
    className: "custom-lost-icon",
    iconSize: [24, 24],
  });

  const activeSightings = sightingsRes?.data || [];

  return (
    <>
      <div className="min-h-screen bg-gray-950">

        {/* Header */}
        <div className="border-b border-gray-800 bg-gray-950">
          <div className="w-full px-4 sm:px-10 lg:px-16 py-5">
            <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-2">
              <div className="min-w-0">
                <h1 className="text-xl sm:text-2xl md:text-3xl font-bold text-white leading-tight">
                  {lostItemName || "Lost Item"}
                </h1>
                <p className="text-gray-500 text-sm mt-1">Lost item details and crowdsourced sightings</p>
              </div>
            </div>
          </div>
        </div>

        {/* Main Content */}
        <div className="w-full px-4 sm:px-10 lg:px-16 py-6 sm:py-10 space-y-6">

          {/* Top Section: Image & Details */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 lg:gap-10 lg:items-stretch">

            {/* Left Column: Image (Stretches to Right Column height) */}
            <div className="flex flex-col">
              <div className="relative flex flex-col flex-1 min-h-[320px] lg:h-full lg:min-h-0 rounded-2xl overflow-hidden border border-gray-800 bg-gray-900">
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
            </div>

            {/* Right Column: Details */}
            <div className="space-y-3 flex flex-col justify-between">
              <div className="space-y-3">
                <div className="bg-gray-900 rounded-xl p-4 border border-gray-800">
                  <h2 className="text-[10px] font-black text-blue-400 uppercase tracking-widest mb-2">Description</h2>
                  <p className="text-gray-300 leading-relaxed text-xs">{description || "No description available."}</p>
                </div>

                <div className="grid grid-cols-2 gap-2">
                  {[
                    { label: "Date Lost", value: date ? new Date(date).toLocaleDateString("en-US", { year: "numeric", month: "short", day: "numeric" }) : "Not specified" },
                    { label: "Location", value: location || "Not specified" },
                    { label: "Category", value: category?.name || "Uncategorized" },
                    { label: "Reported By", value: lostItem?.reporterName || user?.username || "Anonymous" },
                  ].map((item, i) => (
                    <div key={i} className="bg-gray-900 rounded-xl p-3 border border-gray-800">
                      <p className="text-[9px] font-black text-blue-400 uppercase tracking-widest mb-1.5">{item.label}</p>
                      <p className="text-gray-300 text-[11px] font-medium truncate">{item.value}</p>
                    </div>
                  ))}
                </div>

                <div className="bg-gray-900 rounded-xl p-4 border border-gray-800">

                  {alreadyFound ? (
                    <div className="bg-green-900/20 border border-green-600/30 rounded-xl p-3 flex items-start gap-2.5">
                      <span className="text-green-400 text-base mt-0.5">✓</span>
                      <div>
                        <p className="text-green-400 text-xs font-semibold">
                          {reportedFound ? "Thank you for reporting!" : "Marked as found!"}
                        </p>
                        <p className="text-green-400/70 text-[11px] mt-0.5 leading-relaxed">
                          {reportedFound ? "Your report has been submitted." : "Someone already reported finding this."}
                        </p>
                      </div>
                    </div>
                  ) : (
                    <>
                      <div className="flex items-start gap-2.5 bg-gray-800/60 rounded-xl p-3 border border-gray-700 mb-3">
                        <FaBoxOpen className="text-blue-400 mt-0.5 shrink-0" size={13} />
                        <div>
                          <p className="text-white text-xs font-semibold">Did you find this item?</p>
                          <p className="text-gray-400 text-[11px] mt-0.5 leading-relaxed text-justify">
                            Let the owner know where and when you found it.
                          </p>
                        </div>
                      </div>
                      <button
                        onClick={() => openModal(setIsModalOpen)}
                        className="w-full flex items-center justify-center gap-1.5 bg-blue-600 hover:bg-blue-500 active:scale-[0.98] text-white font-bold py-2 rounded-lg transition-all text-[11px] uppercase tracking-widest">
                        <FaBoxOpen size={9} /> I Found This Item
                      </button>
                    </>
                  )}
                </div>
              </div>

              {/* Desktop discussion button */}
              <div className="hidden lg:block pt-3">
                <button
                  onClick={() => setIsCommentModalOpen(true)}
                  className="w-full flex items-center justify-center gap-2 py-3 bg-gray-900 hover:bg-gray-800 border border-white/5 rounded-xl text-gray-300 hover:text-white transition-all font-semibold text-xs"
                >
                  <FaComments size={13} className="text-blue-400" />
                  View Discussion & Sightings
                </button>
              </div>

            </div>
          </div>

          {/* Bottom Section: Crowdsourced Sightings (Full Width) */}
          {!alreadyFound && (
            <div className="bg-gray-900 border border-white/5 rounded-2xl p-4 shadow-xl space-y-4 w-full">
              <div className="flex items-center justify-between">
                <div>
                  <div className="flex items-center gap-2">

                    <h3 className="text-white text-xs font-bold uppercase tracking-wider">Crowdsourced Sighting Pins</h3>
                  </div>
                  <p className="text-gray-500 text-[10px] mt-0.5">If you find this item, pin it on the map.</p>
                </div>
                <button
                  onClick={() => openModal(setIsSightingModalOpen)}
                  className="flex items-center gap-1.5 px-3 py-1.5 bg-blue-600 hover:bg-blue-500 text-white font-bold rounded-xl text-[10px] transition-all uppercase tracking-wider shrink-0"
                >
                  <FaPlus size={8} /> Sighting
                </button>
              </div>

              {/* Leaflet Map rendering */}
              <div className="h-80 rounded-xl overflow-hidden border border-white/5 relative z-10">
                <MapContainer center={mapCenter} zoom={CAMPUS_ZOOM} style={{ height: "100%", width: "100%" }} zoomControl={false} attributionControl={false}>
                  <TileLayer url="https://{s}.basemaps.cartocdn.com/rastertiles/voyager/{z}/{x}/{y}{r}.png" maxZoom={20} />

                  {/* Original loss marker */}
                  {originalLocationCoords && (
                    <Marker position={originalLocationCoords} icon={lostItemIcon}>
                      <Popup>
                        <div className="font-sans p-1 text-center">
                          <p className="font-bold text-[11px] text-gray-800">Original Reported Loss Area</p>
                          <p className="text-[10px] text-gray-500 mt-0.5">{location}</p>
                        </div>
                      </Popup>
                    </Marker>
                  )}

                  {/* Render active sighting pins */}
                  {activeSightings.map((sig: any) => {
                    if (!sig.coordinates || !sig.isActive) return null;
                    const coords = sig.coordinates.split(",").map(Number) as [number, number];
                    return (
                      <React.Fragment key={sig.id}>
                        <Marker position={coords} icon={pulsingIcon}>
                          <Popup>
                            <div className="font-sans min-w-[180px] p-1.5">
                              <p className="font-bold text-xs text-gray-800">Sighted at: {sig.location}</p>
                              <p className="text-[10px] text-gray-500 mt-0.5 leading-relaxed">{sig.details || "No details provided"}</p>
                              {sig.img && (
                                <img src={sig.img} alt="Sighting proof" className="w-full h-20 object-cover rounded-lg mt-2 border border-gray-200" />
                              )}
                              <div className="flex items-center justify-between mt-3 pt-2 border-t border-gray-100">
                                <span className="text-[9px] font-bold text-blue-500 uppercase">
                                  ⏱ Fades in {sig.remainingMinutes}m
                                </span>
                                <div className="flex items-center gap-1">
                                  <button
                                    onClick={() => handleVerifySighting(sig.id)}
                                    disabled={sig.verifiedUserIds.includes(users?.id)}
                                    className="px-2 py-1 bg-blue-50 hover:bg-blue-100 disabled:bg-gray-100 text-blue-600 disabled:text-gray-400 font-bold rounded text-[9px] uppercase tracking-wider transition-all"
                                  >
                                    {sig.verifiedUserIds.includes(users?.id) ? "✓ Verified" : "Verify"}
                                  </button>
                                  {isAdmin && (
                                    <button
                                      onClick={() => handleDeleteSighting(sig.id)}
                                      className="p-1 text-red-600 hover:text-red-850 hover:bg-red-50 rounded transition-all"
                                      title="Delete Sighting"
                                    >
                                      <FaTrash size={8} />
                                    </button>
                                  )}
                                </div>
                              </div>
                            </div>
                          </Popup>
                        </Marker>
                        <Circle center={coords} radius={20} pathOptions={{ color: "#3b82f6", fillColor: "#3b82f6", fillOpacity: 0.12, weight: 1.5, dashArray: "4, 4" }} />
                      </React.Fragment>
                    );
                  })}
                </MapContainer>
              </div>

              {/* Sightings listing */}
              <div className="space-y-2 max-h-48 overflow-y-auto pr-1 custom-scrollbar">
                {activeSightings.length === 0 ? (
                  <div className="text-center py-6 border border-dashed border-white/5 rounded-xl">
                    <FaInfoCircle className="mx-auto text-gray-600 mb-2" size={16} />
                    <p className="text-[10px] text-gray-500 font-medium">No active sightings reported yet.</p>
                    <p className="text-[9px] text-gray-600 mt-0.5">Spot it? Be the first to drop a sighting pin!</p>
                  </div>
                ) : (
                  activeSightings.map((sig: any) => (
                    <div key={sig.id} className={`p-3 rounded-xl border transition-all ${sig.isActive ? "bg-white/[0.02] border-white/5" : "bg-black/20 border-white/5 opacity-50"}`}>
                      <div className="flex items-start justify-between gap-3">
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-1.5">
                            <span className={`w-1.5 h-1.5 rounded-full ${sig.isActive ? "bg-blue-500 animate-pulse shadow-[0_0_6px_#3b82f6]" : "bg-gray-500"}`} />
                            <p className="text-white text-[13px] font-bold truncate">Sighted in {sig.location}</p>
                          </div>
                          <p className="text-gray-400 text-xs mt-1 leading-relaxed text-justify">{sig.details || "No additional details provided."}</p>
                          <div className="flex items-center gap-3 mt-2 text-[10px] text-gray-500 font-medium">
                            <span className="text-blue-400/80">⏱ {sig.isActive ? `Fades in ${sig.remainingMinutes} mins` : "Expired"}</span>
                            <span>•</span>
                            <span>👥 {sig.verifiedUserIds.length} verifications</span>
                          </div>
                        </div>
                        {sig.img && (
                          <div className="w-12 h-12 rounded-lg overflow-hidden border border-white/5 shrink-0 bg-gray-800">
                            <img src={sig.img} alt="Sighting snippet" className="w-full h-full object-cover" />
                          </div>
                        )}
                      </div>

                      {/* Actions footer */}
                      {(sig.isActive || isAdmin) && (
                        <div className="flex justify-end items-center gap-2 mt-2 pt-2 border-t border-white/5">
                          {sig.isActive && (
                            <button
                              onClick={() => handleVerifySighting(sig.id)}
                              disabled={sig.verifiedUserIds.includes(users?.id)}
                              className="flex items-center gap-1 px-3 py-1 bg-blue-500/10 hover:bg-blue-500/20 disabled:bg-gray-800/40 text-blue-400 disabled:text-gray-500 border border-blue-500/20 disabled:border-transparent text-[9px] font-bold rounded-lg transition-all uppercase tracking-wider"
                            >
                              <FaCheck size={7} />
                              {sig.verifiedUserIds.includes(users?.id) ? "Verified by You" : "Verify Sighting"}
                            </button>
                          )}
                          {isAdmin && (
                            <button
                              onClick={() => handleDeleteSighting(sig.id)}
                              className="flex items-center gap-1 px-3 py-1 bg-red-500/10 hover:bg-red-500/20 text-red-400 border border-red-500/20 hover:border-red-500/30 text-[9px] font-bold rounded-lg transition-all uppercase tracking-wider"
                            >
                              <FaTrash size={7} />
                              Delete
                            </button>
                          )}
                        </div>
                      )}
                    </div>
                  ))
                )}
              </div>
            </div>
          )}

          {/* Mobile discussion button — below sightings */}
          <div className="lg:hidden">
            <button
              onClick={() => setIsCommentModalOpen(true)}
              className="w-full flex items-center justify-center gap-2 py-3 bg-gray-900 hover:bg-gray-800 border border-white/5 rounded-xl text-gray-300 hover:text-white transition-all font-semibold text-xs"
            >
              <FaComments size={13} className="text-blue-400" />
              View Discussion & Sightings
            </button>
          </div>

        </div>
      </div>

      {/* Report Found Item Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/75 backdrop-blur-sm">
          <div className="relative w-full max-w-md bg-gray-900 rounded-2xl border border-gray-800 shadow-2xl max-h-[90vh] overflow-y-auto custom-scrollbar">
            <div className="flex items-start justify-between px-4 py-3 border-b border-gray-800 sticky top-0 bg-gray-900 z-10">
              <div>
                <h3 className="text-base font-bold text-white">I found this item</h3>
                <p className="text-gray-500 text-xs mt-0.5">Tell us where and when you found <span className="text-white font-medium">{lostItemName}</span></p>
              </div>
              <button onClick={() => closeModal(setIsModalOpen)} className="text-gray-500 hover:text-white ml-4 mt-0.5 transition-colors">
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
                    <Controller
                      name="location"
                      control={control}
                      rules={{ required: "Please provide the location" }}
                      render={({ field }) => (
                        <LocationAutocomplete
                          value={field.value || ""}
                          onChange={field.onChange}
                          onBlur={field.onBlur}
                          className="w-full px-3 py-2.5 bg-gray-800 border border-gray-700 text-white rounded-lg focus:ring-2 focus:ring-green-500 text-sm placeholder-gray-600"
                          placeholder="e.g. SWDC Building - Room 205"
                        />
                      )}
                    />
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
                  />
                </div>

                <div>
                  <label className="block mb-1.5 text-[11px] font-semibold text-gray-400 uppercase tracking-wider">Additional details</label>
                  <textarea rows={2} placeholder=" "
                    {...register("description")}
                    className="w-full p-3 bg-gray-800 border border-gray-700 text-white rounded-lg focus:ring-2 focus:ring-green-500 text-sm resize-none placeholder-gray-600" />
                </div>

                <div className="flex items-start gap-2.5 bg-blue-500/5 border border-blue-500/15 rounded-lg px-4 py-3">
                  <p className="text-blue-300/80 text-xs leading-relaxed text-justify">
                    Your report will be submitted to the SAS office. The owner can visit and claim it with proof of ownership.
                  </p>
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

      {/* Report Sighting Modal (Phase 7) */}
      {isSightingModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/75 backdrop-blur-sm">
          <div className="relative w-full max-w-lg bg-gray-900 rounded-2xl border border-gray-800 shadow-2xl max-h-[95vh] overflow-y-auto custom-scrollbar">
            <div className="flex items-start justify-between px-4 py-3 border-b border-gray-800 sticky top-0 bg-gray-900 z-10">
              <div>
                <h3 className="text-base font-bold text-white">Report Item Sighting Pin</h3>
                <p className="text-gray-500 text-xs mt-0.5">Drop a pin or details to lead the owner to their belongings</p>
              </div>
              <button onClick={() => closeModal(setIsSightingModalOpen)} className="text-gray-500 hover:text-white ml-4 mt-0.5 transition-colors">
                <FaTimes size={14} />
              </button>
            </div>

            <form onSubmit={handleReportSighting} className="p-4 space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-1">
                  <label className="block text-[11px] font-semibold text-gray-400 uppercase tracking-wider">Reporter Name (Optional)</label>
                  <input
                    type="text"
                    value={sightingReporter}
                    onChange={(e) => setSightingReporter(e.target.value)}
                    placeholder="Anonymous"
                    className="w-full px-3 py-2 bg-gray-800 border border-gray-700 text-white rounded-lg focus:ring-2 focus:ring-blue-500 text-xs"
                  />
                </div>
                <div className="space-y-1">
                  <label className="block text-[11px] font-semibold text-gray-400 uppercase tracking-wider">Location / Room <span className="text-red-400">*</span></label>
                  <LocationAutocomplete
                    value={sightingLocation}
                    onChange={setSightingLocation}
                    placeholder="e.g. SWDC - Building Room 201"
                    className="w-full px-3 py-2 bg-gray-800 border border-gray-700 text-white rounded-lg focus:ring-2 focus:ring-blue-500 text-xs"
                  />
                </div>
              </div>

              {/* Sighting Map Picker */}
              <div className="space-y-1">
                <label className="block text-[11px] font-semibold text-gray-400 uppercase tracking-wider">
                  Tap Map to Drop Pin <span className="text-red-400">*</span> {sightingCoords ? <span className="text-blue-400 font-bold">(Pin Placed!)</span> : <span className="text-red-400 font-semibold">(Required)</span>}
                </label>
                <div className="h-44 rounded-xl overflow-hidden border border-gray-800 z-10 relative">
                  <MapContainer center={mapCenter} zoom={CAMPUS_ZOOM} style={{ height: "100%", width: "100%" }} zoomControl={false} attributionControl={false}>
                    <TileLayer url="https://{s}.basemaps.cartocdn.com/rastertiles/voyager/{z}/{x}/{y}{r}.png" maxZoom={20} />
                    <MapSelector onMapClick={setSightingCoords} position={sightingCoords} />
                  </MapContainer>
                </div>
              </div>

              {/* Photo upload / Base64 */}
              <div className="space-y-2">
                <label className="block text-[11px] font-semibold text-gray-400 uppercase tracking-wider">Sighting Image (Optional)</label>
                <div className="flex items-center gap-3">
                  <label className="flex items-center gap-2 px-3 py-2 bg-gray-800 border border-gray-700 text-gray-300 hover:text-white rounded-lg cursor-pointer transition-all text-xs">
                    <FaCamera size={12} />
                    Upload Photo
                    <input
                      type="file"
                      accept="image/*"
                      onChange={handleFileChange}
                      className="hidden"
                    />
                  </label>
                  {sightingImage && (
                    <div className="w-10 h-10 rounded-lg overflow-hidden border border-white/10 shrink-0">
                      <img src={sightingImage} alt="Uploaded preview" className="w-full h-full object-cover" />
                    </div>
                  )}
                </div>
              </div>

              <div className="space-y-1">
                <label className="block text-[11px] font-semibold text-gray-400 uppercase tracking-wider">Additional Details (Optional)</label>
                <textarea
                  rows={2}
                  value={sightingDetails}
                  onChange={(e) => setSightingDetails(e.target.value)}
                  placeholder="e.g. Seen on the side table by the door, looks untouched."
                  className="w-full p-3 bg-gray-800 border border-gray-700 text-white rounded-lg focus:ring-2 focus:ring-blue-500 text-xs resize-none"
                />
              </div>

              <div className="flex gap-3 pt-2">
                <button
                  type="button"
                  onClick={() => closeModal(setIsSightingModalOpen)}
                  className="flex-1 px-4 py-2 text-gray-400 bg-gray-800 hover:bg-gray-700 border border-gray-700 rounded-lg text-xs font-medium transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isSightingSubmitting}
                  className="flex-[2] px-4 py-2 bg-blue-600 hover:bg-blue-500 text-white rounded-lg text-xs font-semibold disabled:opacity-50 transition-colors"
                >
                  {isSightingSubmitting ? "Reporting Sighting..." : "Report Sighting"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Discussion Modal */}
      <CommentModal
        isOpen={isCommentModalOpen}
        onClose={() => setIsCommentModalOpen(false)}
        itemId={lostItemId!}
        itemType="lost"
        itemName={lostItemName || "Item"}
      />
    </>
  );
};

export default SingleLostItem;