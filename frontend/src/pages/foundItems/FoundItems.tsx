import imageCompression from "browser-image-compression";
import { useState, useRef, useEffect, useCallback } from "react";

// Typewriter hook (same pattern as Smart Entry / BulkScanner)
const useTypewriter = () =>
  useCallback(
    (setter: (v: string) => void, text: string, onDone?: () => void, speed = 18) => {
      let i = 0;
      setter("");
      const id = setInterval(() => {
        setter(text.slice(0, ++i));
        if (i >= text.length) { clearInterval(id); onDone?.(); }
      }, speed);
      return () => clearInterval(id);
    }, []
  );

import { Link, useNavigate } from "react-router-dom";
import { useInitiateChatMutation } from "../../redux/api/chatApi";
import {
  FaSearch, FaMapMarkerAlt, FaCalendarAlt, FaChevronLeft, FaChevronRight, FaChevronUp,
  FaTimes, FaTh, FaList, FaTag, FaPlus,
  FaWallet, FaMobileAlt, FaLaptop, FaKey, FaBriefcase,
  FaHeadphones, FaGlasses, FaBook, FaIdCard, FaUmbrella,
  FaTshirt, FaCamera, FaClock, FaTint, FaCheckCircle,
  FaClipboardList, FaUser, FaEnvelope, FaCheck, FaChevronDown,
  FaQrcode, FaSpinner, FaUserCheck, FaMoneyBillWave, FaCalculator,
  FaComments, FaEye, FaPaintBrush, FaPlug, FaUsb, FaGem, FaUtensils,
  FaMusic, FaFootballBall, FaCopy
} from "react-icons/fa";
import { toast } from "react-toastify";
import { CustomDatePicker } from "../../components/ui/CustomDatePicker";
import { CommentModal } from "../../components/comments/CommentModal";
import { CommentSection } from "../../components/comments/CommentSection";
import { PointsTeaserBanner } from "../../components/home/PointsTeaserBanner";
import { useGetMyPointsQuery } from "../../redux/api/api";


import { useForm, Controller } from "react-hook-form";
import { Spinner } from "flowbite-react";
import {
  useGetFoundItemsQuery,
  useCategoryQuery,
  useCreateFoundItemMutation,
  useUploadItemImagesMutation,
  useCreateClaimMutation,
  useGetStudentByIdQuery,
  useLazyGetStudentByDetailsQuery,
  useAiRecognizeMutation,
} from "../../redux/api/api";
import { useUserVerification } from "../../auth/auth";
import type { ScannedStudent } from "../../components/scanner/BarcodeScannerModal";
import BarcodeScannerModal from "../../components/scanner/BarcodeScannerModal";
import ItemMatchSuggestions from "../../components/itemMatch/ItemMatchSuggestions";
import LocationAutocomplete from "../../components/ui/LocationAutocomplete";
import { useScrollReveal } from "../../hooks/useScrollReveal";
import { useOfflineSync } from "../../hooks/useOfflineSync";

// ── Category configuration with auto-fill data ─────────────────────────────
const CATEGORY_CONFIG = {
  bags: {
    itemName: 'Bag',
    description: 'Please select a color to auto-generate a detailed description.',
    colors: ['Black', 'Brown', 'Blue', 'Gray', 'Red', 'Green', 'Navy', 'Tan', 'White', 'Other'],
    conditions: ['Scratches', 'Stickers', 'Keychains', 'None']
  },
  calculators: {
    itemName: 'Calculator',
    description: 'Please select a color to auto-generate a detailed description.',
    colors: ['Black', 'Gray', 'Blue', 'Silver', 'White', 'Other'],
    conditions: ['Scratches', 'Stickers', 'Engravings', 'None']
  },
  keys: {
    itemName: 'Keys',
    description: 'An item has been turned in. For security and to ensure it returns to the rightful owner, specific details regarding the material, design, or brand are withheld. Please visit the SAS office for identification and verification.',
    colors: [],
    conditions: []
  },
  umbrellas: {
    itemName: 'Umbrella',
    description: 'Please select a color to auto-generate a detailed description.',
    colors: ['Black', 'Blue', 'Red', 'Yellow', 'Green', 'Pink', 'Purple', 'Clear', 'Patterned', 'Other'],
    conditions: ['Scratches', 'Stickers', 'Bent Frame', 'None']
  },
  watches: {
    itemName: 'Watch',
    description: 'Please select a color to auto-generate a detailed description.',
    colors: ['Black', 'Brown', 'Silver', 'Gold', 'Blue', 'White', 'Rose Gold', 'Other'],
    conditions: ['Scratches', 'Stickers', 'Engravings', 'None']
  },
  money: {
    itemName: 'Money',
    description: 'Money',
    colors: [],
    conditions: []
  },
  device: {
    itemName: 'Device',
    description: 'An item has been turned in. For security and to ensure it returns to the rightful owner, specific details regarding the material, design, or brand are withheld. Please visit the SAS office for identification and verification.',
    colors: [],
    conditions: []
  },
  id: {
    itemName: 'ID',
    description: 'An item has been turned in. For security and to ensure it returns to the rightful owner, specific details regarding the material, design, or brand are withheld. Please visit the SAS office for identification and verification.',
    colors: [],
    conditions: []
  },
  documents: {
    itemName: 'Document',
    description: 'Important personal documents have been recovered. For privacy reasons, the specific nature of these documents is not disclosed here. Please visit the SAS office with a valid ID to retrieve them.',
    colors: [],
    conditions: []
  },
  'wallets & purses': {
    itemName: 'Wallet/Purse',
    description: 'A wallet/purse has been turned in. To ensure the security of the owner\'s belongings, specific details such as color, brand, or contents are kept confidential. Please visit the SAS office to identify and claim your property.',
    colors: [],
    conditions: []
  },
  jewelry: {
    itemName: 'Jewelry',
    description: 'An item has been turned in. For security and to ensure it returns to the rightful owner, specific details regarding the material, design, or brand are withheld. Please visit the SAS office for identification and verification.',
    colors: [],
    conditions: []
  },
  accessories: {
    itemName: 'Accessory',
    description: 'An item has been turned in. For security and to ensure it returns to the rightful owner, specific details regarding the material, design, or brand are withheld. Please visit the SAS office for identification and verification.',
    colors: [],
    conditions: []
  },
  'flash drives & storage': {
    itemName: 'Storage Device',
    description: 'An item has been turned in. For security and to ensure it returns to the rightful owner, specific details regarding the material, design, or brand are withheld. Please visit the SAS office for identification and verification.',
    colors: [],
    conditions: []
  },
  'lunch boxes & food containers': {
    itemName: 'Lunch Box/Container',
    description: 'A food container or lunch box was found. Please visit the SAS office to identify and claim.',
    colors: ['Black', 'Blue', 'Red', 'Green', 'Pink', 'White', 'Clear', 'Other'],
    conditions: ['New', 'Good', 'Used']
  },
  'sport equipment': {
    itemName: 'Sport Equipment',
    description: 'A piece of sport equipment was found. Please visit the SAS office to identify and claim.',
    colors: ['Black', 'White', 'Blue', 'Red', 'Orange', 'Yellow', 'Other'],
    conditions: ['New', 'Good', 'Used', 'Damaged']
  },
  'eyeglasses & sunglasses': {
    itemName: 'Eyeglasses/Sunglasses',
    description: 'A pair of eyeglasses or sunglasses was found. Please visit the SAS office to identify and claim.',
    colors: ['Black', 'Brown', 'Gold', 'Silver', 'Clear', 'Blue', 'Pink', 'Other'],
    conditions: ['Scratches', 'None']
  }
};

// ── Category icon resolver ────────────────────────────────────────────────────
const getCategoryIcon = (name: string) => {
  const n = name?.toLowerCase() ?? "";
  if (n.includes("wallet") || n.includes("purse") || n.includes("pouch")) return <FaWallet size={9} className="text-blue-400" />;
  if (n.includes("phone") || n.includes("mobile") || n.includes("celphone")) return <FaMobileAlt size={9} className="text-cyan-400" />;
  if (n.includes("laptop") || n.includes("computer") || n.includes("electronic") || n.includes("device") || n.includes("gadget")) return <FaLaptop size={9} className="text-indigo-400" />;
  if (n.includes("key")) return <FaKey size={9} className="text-orange-400" />;
  if (n.includes("bag") || n.includes("backpack") || n.includes("luggage")) return <FaBriefcase size={9} className="text-blue-400" />;
  if (n.includes("headphone") || n.includes("earphone") || n.includes("audio") || n.includes("airpod")) return <FaHeadphones size={9} className="text-green-400" />;
  if (n.includes("glass") || n.includes("spectacle") || n.includes("eyewear") || n.includes("sunglass")) return <FaGlasses size={9} className="text-teal-400" />;
  if (n.includes("book") || n.includes("stationery") || n.includes("notebook")) return <FaBook size={9} className="text-yellow-400" />;
  if (n.includes("calculat")) return <FaCalculator size={9} className="text-lime-400" />;
  if (n === "id" || n.includes("card") || n === "identification") return <FaIdCard size={9} className="text-blue-400" />;
  if (n === "documents" || n === "document" || n.includes("paper")) return <FaBook size={9} className="text-yellow-400" />;
  if (n.includes("umbrella")) return <FaUmbrella size={9} className="text-blue-400" />;
  if (n.includes("cloth") || n.includes("shirt") || n.includes("uniform") || n.includes("wear")) return <FaTshirt size={9} className="text-purple-400" />;
  if (n.includes("camera") || n.includes("photo")) return <FaCamera size={9} className="text-violet-400" />;
  if (n.includes("watch") || n.includes("clock")) return <FaClock size={9} className="text-gray-300" />;
  if (n.includes("water") || n.includes("bottle") || n.includes("tumbler") || n.includes("flask")) return <FaTint size={9} className="text-cyan-400" />;
  if (n.includes("money") || n.includes("cash") || n.includes("bill") || n.includes("currency")) return <FaMoneyBillWave size={9} className="text-green-400" />;
  // Icons matching CategoriesManagement
  if (n.includes("art") || n.includes("paint") || n.includes("brush")) return <FaPaintBrush size={9} className="text-rose-400" />;
  if (n.includes("charger") || n.includes("cable") || n.includes("plug")) return <FaPlug size={9} className="text-yellow-400" />;
  if (n.includes("usb") || n.includes("flash") || n.includes("drive")) return <FaUsb size={9} className="text-blue-400" />;
  if (n.includes("accessor") || n.includes("jewel") || n.includes("bracelet")) return <FaGem size={9} className="text-pink-400" />;
  if (n.includes("food") || n.includes("lunch") || n.includes("container")) return <FaUtensils size={9} className="text-orange-400" />;
  if (n.includes("music") || n.includes("instrument") || n.includes("guitar")) return <FaMusic size={9} className="text-fuchsia-400" />;
  if (n.includes("sport") || n.includes("ball") || n.includes("gym")) return <FaFootballBall size={9} className="text-red-400" />;
  return <FaTag size={9} className="text-blue-400" />;
};

const HIDDEN_IMAGE_CATEGORIES = ["wallets & purses", "wallet", "purse", "coin purse", "flap wallet"];
const shouldBlurImage = (cat: string | undefined, isAdmin: boolean) => {
  if (isAdmin) return false;
  if (!cat) return false;
  const lowerCat = cat.toLowerCase();
  return HIDDEN_IMAGE_CATEGORIES.some(c => lowerCat.includes(c));
};

// Category Help Modal Content
const CATEGORY_HELP_CONTENT = {
  tag: <><svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect width="7" height="7" x="3" y="3" rx="1" /><rect width="7" height="7" x="14" y="3" rx="1" /><rect width="7" height="7" x="14" y="14" rx="1" /><rect width="7" height="7" x="3" y="14" rx="1" /></svg> Item Categories</>,
  steps: [
    { n: "1", title: "Select a Category", desc: "Choose the most appropriate category for the found item from the dropdown menu." },
    { n: "2", title: "Help with Matching", desc: "The correct category helps us match the found item with lost items more effectively." },
    { n: "3", title: "Better Organization", desc: "Proper categorization keeps the found items board organized and easy to search." },
  ],
  tip: (
    <div className="p-3 rounded-xl bg-blue-500/5 border border-blue-500/20">
      <p className="text-gray-400 text-[11px] leading-relaxed text-justify">
        Selecting the right category helps us match your item with found items faster. Categories like <span className="text-blue-400 font-semibold">bags</span>, <span className="text-blue-400 font-semibold">calculators</span>, <span className="text-blue-400 font-semibold">keys</span>, <span className="text-blue-400 font-semibold">umbrellas</span>, <span className="text-blue-400 font-semibold">watches</span>, <span className="text-blue-400 font-semibold">money</span>, <span className="text-blue-400 font-semibold">id</span>, <span className="text-blue-400 font-semibold">wallets</span>, <span className="text-blue-400 font-semibold">jewelry</span>, <span className="text-blue-400 font-semibold">accessories</span>, and <span className="text-blue-400 font-semibold">storage devices</span> have special auto-fill features.
      </p>
    </div>
  ),
};

// ── Custom Select ─────────────────────────────────────────────────────────────
interface SelectOption { value: string; label: string; icon?: React.ReactNode; }

const CustomSelect = ({ options, value, onChange }: {
  options: SelectOption[]; value: string; onChange: (v: string) => void;
}) => {
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);
  const selected = options.find(o => o.value === value);

  useEffect(() => {
    const fn = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    };
    document.addEventListener("mousedown", fn);
    return () => document.removeEventListener("mousedown", fn);
  }, []);

  return (
    <div ref={ref} className="relative flex-1 min-w-0">
      <button
        type="button"
        onClick={() => setOpen(o => !o)}
        className="w-full flex items-center justify-between gap-1.5 sm:gap-2 px-2.5 sm:px-3 py-2 sm:py-2.5 text-xs sm:text-sm rounded-xl border border-white/5 outline-none bg-gray-900 text-gray-300"
      >
        <span className="flex items-center gap-1.5 sm:gap-2 truncate min-w-0">
          {selected?.icon && <span className="shrink-0">{selected.icon}</span>}
          <span className="truncate text-xs sm:text-sm">{selected?.label ?? <span className="text-gray-500">Select…</span>}</span>
        </span>
        <FaChevronDown size={8} className={`shrink-0 text-gray-500 transition-transform duration-200 ${open ? "rotate-180" : ""}`} />
      </button>

      {open && (
        <div className="absolute z-50 mt-1.5 w-full min-w-[160px] bg-[#0d1f3c] border border-blue-900/40 rounded-xl shadow-2xl shadow-black/70 overflow-hidden">
          <div className="h-px bg-gradient-to-r from-transparent via-blue-500/40 to-transparent" />
          <div className="py-1 max-h-60 overflow-y-auto overscroll-contain">
            {options.map(opt => {
              const isActive = opt.value === value;
              return (
                <button
                  key={opt.value}
                  type="button"
                  onClick={() => { onChange(opt.value); setOpen(false); }}
                  className={`w-full flex items-center justify-between gap-2 px-3 py-2 text-xs text-left transition-colors duration-100
                    ${isActive ? "bg-blue-500/10 text-blue-300" : "text-gray-400 hover:bg-white/5 hover:text-white"}`}
                >
                  <span className="flex items-center gap-2 truncate min-w-0">
                    {opt.icon && <span className={`shrink-0 ${isActive ? "" : "opacity-60"}`}>{opt.icon}</span>}
                    <span className="truncate">{opt.label}</span>
                  </span>
                  {isActive && <FaCheck size={8} className="shrink-0 text-blue-400" />}
                </button>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
};
// ── Found Item Card ─────────────────────────────────────────────────────────
const FoundItemCard = ({ item, setClaimItem, onOpenComments, isAdmin, currentUser, onInitiateChat }: { item: any; setClaimItem: (item: any) => void; onOpenComments: () => void; isAdmin: boolean; currentUser: any; onInitiateChat: (item: any) => void }) => {
  const isReporter = currentUser && (item?.userId === currentUser?.id || item?.user?.id === currentUser?.id || item?.user?._id === currentUser?.id);
  const hasClaimed = currentUser && item?.claim?.some((c: any) => c.userId === currentUser?.id);
  const shouldBlur = shouldBlurImage(item?.category?.name, isAdmin) && !isReporter && !hasClaimed;
  const dateStr = item?.date?.split("T")[0] ?? item?.createdAt?.split("T")[0] ?? "—";
  const isClaimed = item?.isClaimed || item?.claimStatus === "CLAIMED";

  // Calculate days ago
  const itemDate = new Date(item?.date ?? item?.createdAt ?? Date.now());
  const now = new Date();
  const daysAgo = Math.floor((now.getTime() - itemDate.getTime()) / (1000 * 60 * 60 * 24));

  return (
    <div className="group bg-gray-900 border border-white/5 hover:border-blue-500/40 rounded-xl overflow-hidden transition-all duration-200 hover:shadow-xl hover:shadow-black/30 flex flex-col">
      <div className="relative h-48 overflow-hidden bg-gray-800 flex items-center justify-center">
        <img src={(Array.isArray(item?.images) && item.images.length > 0 ? (typeof item.images[0] === "string" ? item.images[0] : item.images[0]?.url ?? item.images[0]?.src ?? "") : "") || item?.img || "/bgimg.png"}
          alt={item?.foundItemName} onError={(e) => { (e.target as HTMLImageElement).src = "/bgimg.png"; }}
          className={`w-full h-full object-cover ${shouldBlur ? "blur-xl select-none pointer-events-none" : "group-hover:scale-105 transition-transform duration-300"}`} />
        {shouldBlur && (
          <div className="absolute inset-0 flex flex-col items-center justify-center bg-black/45 p-4 text-center">
            <svg width="20" height="20" fill="none" viewBox="0 0 24 24" stroke="currentColor" className="text-blue-400 mb-1" strokeWidth="2">
              <path strokeLinecap="round" strokeLinejoin="round" d="M16.5 10.5V6.75a4.5 4.5 0 10-9 0v3.75m-.75 11.25h10.5a2.25 2.25 0 002.25-2.25v-6.75a2.25 2.25 0 00-2.25-2.25H6.75a2.25 2.25 0 00-2.25 2.25v6.75a2.25 2.25 0 002.25 2.25z" />
            </svg>
            <p className="text-white font-bold text-[11px]">Photo Blurred</p>
            <p className="text-gray-300 text-[9px] leading-snug">Submit a claim to view</p>
          </div>
        )}
        <div className="absolute inset-0 bg-gradient-to-t from-gray-900/80 via-transparent to-transparent" />
        <div className="absolute top-3 left-3">
          {isClaimed ? <span className="flex items-center gap-1 px-2 py-0.5 bg-blue-600/90 text-white text-[10px] font-bold rounded-full backdrop-blur-sm border border-blue-500/30"><FaCheckCircle size={8} /> Claimed</span>
            : <span className="px-2 py-0.5 bg-blue-600/90 text-white text-[10px] font-bold rounded-full backdrop-blur-sm border border-blue-500/30">Available</span>}
        </div>
        <div className="absolute top-3 right-3">
          <span className={`px-2 py-0.5 text-[10px] font-bold rounded-full backdrop-blur-sm border ${!isClaimed && daysAgo > 30 ? "bg-orange-500/80 text-white border-orange-400/30" : !isClaimed && daysAgo > 7 ? "bg-yellow-500/80 text-gray-900 border-yellow-400/30" : "bg-black/50 text-white border-white/15"}`}>
            {daysAgo === 0 ? "Today" : `${daysAgo}d ago`}
          </span>
        </div>
      </div>
      <div className="p-4 flex flex-col flex-1">
        <h3 className="text-white text-sm font-bold mb-1 line-clamp-1 group-hover:text-blue-400 transition-colors">{item?.foundItemName}</h3>
        <p className="text-gray-500 text-xs mb-3 line-clamp-2 leading-relaxed">{item?.description}</p>
        <div className="space-y-1.5 mt-auto mb-3">
          <div className="flex items-center gap-2 text-xs text-gray-400"><div className="w-5 h-5 rounded bg-blue-500/10 border border-blue-500/20 flex items-center justify-center shrink-0"><FaMapMarkerAlt className="text-blue-400" size={8} /></div><span className="line-clamp-1">{item?.location}</span></div>
          <div className="flex items-center gap-2 text-xs text-gray-400"><div className="w-5 h-5 rounded bg-blue-500/10 border border-blue-500/20 flex items-center justify-center shrink-0"><FaCalendarAlt className="text-blue-400" size={8} /></div><span>{dateStr}</span></div>
          {item?.category?.name && <div className="flex items-center gap-2 text-xs text-gray-400"><div className="w-5 h-5 rounded bg-blue-500/10 border border-blue-500/20 flex items-center justify-center shrink-0">{getCategoryIcon(item.category.name)}</div><span>{item.category.name}</span></div>}
        </div>
        <div className="h-px bg-white/[0.04] mb-3" />

        <div className="grid grid-cols-3 gap-1.5">
          {(() => {
            const hasMyClaim = item?.claim?.some((c: any) => c.userId === currentUser?.id);
            if (hasMyClaim) return <button onClick={() => onInitiateChat(item)} className="flex items-center justify-center py-2.5 sm:py-2 bg-blue-500/10 hover:bg-blue-500/20 border border-blue-500/30 text-blue-400 text-xs sm:text-[11px] font-bold rounded-lg transition-all">Chat</button>;
            if (isClaimed) return <div className="flex items-center justify-center py-2 bg-blue-500/10 border border-blue-500/20 text-blue-400 text-[11px] font-semibold rounded-lg">Claimed</div>;
            return <button onClick={() => setClaimItem(item)} className="flex items-center justify-center py-2 bg-blue-600/20 hover:bg-blue-600 border border-blue-600/30 text-blue-300 hover:text-white text-[11px] font-semibold rounded-lg transition-all">Claim</button>;
          })()}
          <Link to={`/foundItems/${item.id}`} className="flex items-center justify-center py-2 bg-white/5 hover:bg-white/10 border border-white/5 text-gray-400 hover:text-white text-[11px] font-medium rounded-lg transition-all">Details</Link>
          <button onClick={onOpenComments} className="flex items-center justify-center py-2 bg-white/5 hover:bg-white/10 border border-white/5 text-gray-400 hover:text-white text-[11px] font-medium rounded-lg transition-all">
            Comments
          </button>
        </div>
      </div>
    </div>
  );
};

// ── Found Item Row ──────────────────────────────────────────────────────────
const FoundItemRow = ({ item, setClaimItem, onOpenComments, isAdmin, currentUser, onInitiateChat }: { item: any; setClaimItem: (item: any) => void; onOpenComments: () => void; isAdmin: boolean; currentUser: any; onInitiateChat: (item: any) => void }) => {
  const dateStr = item?.date?.split("T")[0] ?? item?.createdAt?.split("T")[0] ?? "—";

  const isClaimed = item?.isClaimed || item?.claimStatus === "CLAIMED";
  const isReporter = currentUser && (item?.userId === currentUser?.id || item?.user?.id === currentUser?.id || item?.user?._id === currentUser?.id);
  const hasClaimed = currentUser && item?.claim?.some((c: any) => c.userId === currentUser?.id);
  const shouldBlur = shouldBlurImage(item?.category?.name, isAdmin) && !isReporter && !hasClaimed;
  const imgSrc = (Array.isArray(item?.images) && item.images.length > 0
    ? (typeof item.images[0] === "string" ? item.images[0] : item.images[0]?.url ?? item.images[0]?.src ?? "")
    : "") || item?.img || "/bgimg.png";

  const hasMyClaim = item?.claim?.some((c: any) => c.userId === currentUser?.id);

  return (
    <div className="reveal group bg-gray-900 border border-white/5 hover:border-blue-500/40 rounded-xl transition-all duration-200 p-3 sm:p-4">
      <div className="flex flex-col sm:flex-row sm:items-center gap-3 sm:gap-4">
        {/* Top Section: Image & Info */}
        <div className="flex items-center gap-4 flex-1 min-w-0">
          <div className="relative w-12 h-12 sm:w-14 sm:h-14 rounded-lg overflow-hidden bg-gray-800 shrink-0 border border-white/5 flex items-center justify-center">
            <img src={imgSrc} alt={item.foundItemName}
              className={`w-full h-full object-cover ${shouldBlur ? "blur-xl select-none pointer-events-none" : ""}`}
              onError={(e) => { (e.target as HTMLImageElement).src = "/bgimg.png"; }} />
            {shouldBlur && (
              <div className="absolute inset-0 flex items-center justify-center bg-black/40">
                <svg width="12" height="12" fill="none" viewBox="0 0 24 24" stroke="currentColor" className="text-blue-400" strokeWidth="2">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M16.5 10.5V6.75a4.5 4.5 0 10-9 0v3.75m-.75 11.25h10.5a2.25 2.25 0 002.25-2.25v-6.75a2.25 2.25 0 00-2.25-2.25H6.75a2.25 2.25 0 00-2.25 2.25v6.75a2.25 2.25 0 002.25 2.25z" />
                </svg>
              </div>
            )}
          </div>
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 mb-0.5">
              <h3 className="text-white text-sm sm:text-base font-bold truncate group-hover:text-blue-400 transition-colors">{item.foundItemName}</h3>
              {isClaimed && <span className="px-1.5 py-0.5 bg-blue-500/10 text-blue-400 text-[8px] font-black uppercase tracking-widest rounded-md border border-blue-500/20 shrink-0">Claimed</span>}
            </div>
            <p className="text-gray-500 text-[10px] sm:text-xs font-medium flex items-center gap-2">
              <span className="truncate">{item.location}</span>
              <span className="text-gray-700">·</span>
              <span className="shrink-0">{dateStr}</span>
            </p>
          </div>
        </div>

        {/* Action Buttons Section */}
        <div className="flex items-center gap-2 pt-3 sm:pt-0 border-t border-white/[0.03] sm:border-t-0 sm:shrink-0 sm:ml-auto">
          <div className="flex items-center gap-1.5 w-full sm:w-auto">
            {hasMyClaim ? (
              <button onClick={() => onInitiateChat(item)}
                className="flex-1 sm:flex-none px-4 py-2 sm:px-3 sm:py-1.5 bg-blue-500/10 border border-blue-500/20 text-blue-400 text-xs sm:text-[10px] font-bold rounded-lg hover:bg-blue-500/20 transition-all flex items-center justify-center gap-1.5">
                Chat
              </button>
            ) : isClaimed ? (
              <div className="flex-1 sm:flex-none px-3 py-2 sm:py-1.5 bg-blue-500/10 border border-blue-500/20 text-blue-400 text-xs sm:text-[10px] font-bold rounded-lg text-center">Claimed</div>
            ) : (
              <button onClick={() => setClaimItem(item)}
                className="flex-1 sm:flex-none px-4 py-2 sm:px-3 sm:py-1.5 bg-white/5 hover:bg-white/10 text-gray-400 text-xs sm:text-[10px] font-bold rounded-lg transition-all">
                Claim
              </button>
            )}

            <Link to={`/foundItems/${item.id}`}
              className="flex-1 sm:flex-none px-3 py-2 sm:py-1.5 bg-white/5 hover:bg-white/10 text-gray-400 text-xs sm:text-[10px] font-bold rounded-lg transition-all flex items-center justify-center gap-1.5">
              <span className="xs:inline sm:inline">Details</span>
            </Link>
            <button onClick={onOpenComments}
              className="flex-1 sm:flex-none px-3 py-2 sm:py-1.5 bg-white/5 hover:bg-white/10 text-gray-400 text-xs sm:text-[10px] font-bold rounded-lg transition-all flex items-center justify-center gap-1.5" title="Comments">

              <span className="xs:inline sm:inline">Comments</span>
            </button>

          </div>
        </div>
      </div>
    </div>
  );
};

// ── Quick Claim Modal ─────────────────────────────────────────────────────────
const QuickClaimModal = ({ item, onClose, onInitiateChat }: { item: any; onClose: () => void; onInitiateChat: (item: any) => void }) => {
  const [createClaim, { isLoading: claimLoading }] = useCreateClaimMutation();
  const { register, handleSubmit, formState: { errors }, reset, control, setValue: claimSetValue, watch } = useForm();
  const [submitted, setSubmitted] = useState(false);
  const [prevClaimEmailValue, setPrevClaimEmailValue] = useState("");
  const [lostDate, setLostDate] = useState("");
  const [claimScannedStudent, setClaimScannedStudent] = useState<ScannedStudent | null>(null);
  const [showClaimScanner, setShowClaimScanner] = useState(false);
  const [isFetchingClaimStudent, setIsFetchingClaimStudent] = useState(false);
  const [getStudentByDetailsForClaim] = useLazyGetStudentByDetailsQuery();

  const useFetchStudentForClaim = (id: string) => {
    const trimmed = id?.trim() ?? "";
    const isValidId = Boolean(trimmed && trimmed.length >= 4 && !/^\d{4}-\d{2}-\d{2}$/.test(trimmed));
    return useGetStudentByIdQuery(trimmed, { skip: !isValidId });
  };

  const handleClaimScan = (student: ScannedStudent) => {
    setClaimScannedStudent(student);
    claimSetValue("claimantName", student.name, { shouldDirty: true });
    claimSetValue("schoolEmail", student.email, { shouldDirty: true });
    setShowClaimScanner(false);
    toast.success(`Student identified: ${student.name}`);
  };

  const watchedClaimantName = watch("claimantName") ?? "";
  const watchedSchoolEmail = watch("schoolEmail") ?? "";

  const handleClaimFetchDetails = async () => {
    const name = watchedClaimantName?.trim() || "";
    const email = watchedSchoolEmail?.trim() || "";
    if (!name && !email) { toast.info("Please enter a name or email to fetch details"); return; }
    setIsFetchingClaimStudent(true);
    try {
      let student: any = null;
      if (name) {
        try {
          const r = await getStudentByDetailsForClaim({ name, email: "" }).unwrap();
          student = r.data ?? r;
        } catch {
          if (email) {
            try {
              const r = await getStudentByDetailsForClaim({ name: "", email }).unwrap();
              student = r.data ?? r;
            } catch { }
          }
        }
      } else {
        try {
          const r = await getStudentByDetailsForClaim({ name: "", email }).unwrap();
          student = r.data ?? r;
        } catch { }
      }

      if (student?.name) {
        setClaimScannedStudent({ id: student.id, name: student.name, email: student.email, department: student.department || "", raw: "manual_fetch" });
        claimSetValue("claimantName", student.name, { shouldDirty: true });
        claimSetValue("schoolEmail", student.email, { shouldDirty: true });
        toast.success(`Found: ${student.name}`);
      } else {
        toast.error("Student not found in masterlist");
      }
    } catch {
      toast.error("Student not found in masterlist");
    } finally {
      setIsFetchingClaimStudent(false);
    }
  };

  const onSubmit = async (data: any) => {
    try {
      const res: any = await createClaim({
        foundItemId: item.id,
        claimantName: data.claimantName,
        schoolEmail: data.schoolEmail,
        lostDate: new Date(lostDate + "T00:00:00").toISOString(),
        distinguishingFeatures: data.distinguishingFeatures,
      });
      if (res?.data?.success) {
        setSubmitted(true);
        toast.success("Claim submitted! The SAS office will review and contact you.");
        setTimeout(onClose, 2000);
      } else {
        toast.error("Failed to submit claim. Please try again.");
      }
    } catch { toast.error("An unexpected error occurred."); }
  };

  return (
    <div className="fixed inset-0 z-[100] bg-black/80 backdrop-blur-sm flex items-start justify-center p-4 sm:p-6 pt-10 overflow-y-auto">
      <div className="absolute inset-0" onClick={onClose} />
      <div id="claim-modal"
        className="relative bg-gray-900 border border-white/10 rounded-2xl w-full max-w-md shadow-2xl shadow-black/50 flex flex-col"
        style={{ borderTop: "2px solid #3b82f6", maxHeight: "88vh" }}>
        <div className="flex flex-col gap-3 px-5 py-4 border-b border-white/5 sticky top-0 bg-gray-900 z-10 rounded-t-2xl">
          <div className="flex items-center justify-between gap-2">
            <div className="flex items-center gap-2.5 min-w-0">

              <div className="min-w-0">
                <h3 className="text-sm font-bold text-white truncate">Submit a Claim</h3>
                <p className="text-gray-500 text-[11px] truncate">Prove ownership to retrieve this item</p>
              </div>
            </div>
            <button onClick={onClose} className="w-7 h-7 rounded-lg bg-white/5 hover:bg-white/10 flex items-center justify-center text-gray-400 hover:text-white transition-colors shrink-0">
              <FaTimes size={12} />
            </button>
          </div>
          {/* Fetch / Scan row */}
          <div className="flex items-center gap-2 flex-wrap sm:justify-end">
            {!claimScannedStudent && (
              <>
                <button
                  onClick={handleClaimFetchDetails}
                  disabled={isFetchingClaimStudent}
                  className="flex-1 sm:flex-none px-3 py-1.5 rounded-lg bg-blue-500/10 hover:bg-blue-500/20 border border-blue-500/20 text-[9px] font-black text-blue-400 hover:text-blue-300 flex items-center justify-center gap-1.5 transition-all uppercase tracking-wider active:scale-95 disabled:opacity-50"
                >
                  {isFetchingClaimStudent ? (
                    <FaSpinner className="animate-spin" size={8} />
                  ) : (
                    <FaSearch size={8} />
                  )}
                  Fetch Student Info
                </button>

                <button
                  onClick={() => setShowClaimScanner(true)}
                  className="flex-1 sm:flex-none inline-flex items-center justify-center gap-1.5 px-3 py-1.5 bg-blue-600/15 hover:bg-blue-600/25 border border-blue-500/25 text-blue-400 text-[9px] font-black rounded-lg transition-all uppercase tracking-wider active:scale-95"
                >
                  <FaQrcode size={9} /> Scan Student ID
                </button>
              </>
            )}
          </div>
          {/* Scanned student banner */}
          {claimScannedStudent && (
            <div className="flex items-center gap-3 bg-blue-500/5 border border-blue-500/20 rounded-xl px-3 py-2.5">
              <div className="w-8 h-8 rounded-lg bg-blue-500/20 flex items-center justify-center shrink-0">
                <FaUserCheck size={14} className="text-blue-400" />
              </div>
              <div className="min-w-0 flex-1">
                <p className="text-white text-xs font-black uppercase tracking-tight truncate">{claimScannedStudent.name}</p>
                <p className="text-blue-400/70 text-[10px] font-bold uppercase tracking-widest">ID: {claimScannedStudent.id}</p>
              </div>
              <button
                onClick={() => { setClaimScannedStudent(null); claimSetValue("claimantName", ""); claimSetValue("schoolEmail", ""); }}
                className="w-6 h-6 flex items-center justify-center rounded-md bg-white/5 hover:bg-white-500/20 text-gray-500 hover:text-white-400 transition-all shrink-0"
              >
                <FaTimes size={10} />
              </button>
            </div>
          )}
        </div>
        <div className="p-5 overflow-y-auto flex-1 custom-scrollbar">
          <div className="flex items-center gap-3 bg-gray-800/60 border border-white/5 rounded-xl p-3 mb-5">
            <img src={(Array.isArray(item?.images) && item.images.length > 0 ? (typeof item.images[0] === "string" ? item.images[0] : item.images[0]?.url ?? "") : "") || item?.img || "/bgimg.png"}
              alt={item?.foundItemName} onError={(e) => { (e.target as HTMLImageElement).src = "/bgimg.png"; }}
              className="w-12 h-12 rounded-lg object-cover shrink-0 border border-white/5" />
            <div className="min-w-0">
              <p className="text-white text-sm font-semibold truncate">{item?.foundItemName}</p>
              <p className="text-gray-500 text-[10px] mt-0.5 flex items-center gap-1"><FaMapMarkerAlt size={8} /> {item?.location}</p>
              <p className="text-gray-400 text-[10px] mt-1 line-clamp-2 leading-relaxed italic">{item?.description}</p>
            </div>
            <span className="shrink-0 px-2 py-0.5 bg-blue-500/10 text-blue-400 text-[10px] font-bold rounded-full border border-blue-500/20">Available</span>
          </div>
          {submitted ? (
            <div className="text-center py-8">
              <div className="w-14 h-14 rounded-2xl bg-blue-500/10 border border-blue-500/20 flex items-center justify-center mx-auto mb-3">
                <FaCheckCircle className="text-blue-400" size={24} />
              </div>
              <p className="text-white font-semibold">Claim Submitted!</p>
              <p className="text-gray-500 text-xs mt-1.5 leading-relaxed max-w-xs mx-auto mb-5">The SAS office will review your proof and contact you via your school email.</p>
              <button
                onClick={() => {
                  onClose();
                  onInitiateChat(item.id);
                }}
                className="w-full py-3 bg-cyan-600 hover:bg-cyan-500 text-white text-xs font-bold rounded-xl transition-all flex items-center justify-center gap-2"
              >
                <FaComments size={13} /> Chat with Reporter
              </button>
            </div>
          ) : (
            <form onSubmit={handleSubmit(onSubmit)} className="space-y-3.5">
              <div>
                <label className="block text-[10px] font-bold text-gray-400 uppercase tracking-widest mb-1.5">Full Name <span className="text-red-400">*</span></label>
                <div className="relative">
                  <FaUser className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500" size={11} />
                  <input type="text" placeholder=" " {...register("claimantName", { required: "Full name is required" })}
                    className="w-full pl-9 pr-4 py-2.5 bg-gray-800 border border-white/10 rounded-xl text-white text-sm placeholder-gray-600 focus:outline-none focus:ring-2 focus:ring-blue-500/30" />
                </div>
                {errors.claimantName && <p className="text-red-400 text-xs mt-1">{errors.claimantName.message as string}</p>}
              </div>
              <div>
                <label className="block text-[10px] font-bold text-gray-400 uppercase tracking-widest mb-1.5">Institutional Email <span className="text-red-400">*</span></label>
                <div className="relative">
                  <FaEnvelope className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500" size={11} />
                  <Controller
                    name="schoolEmail"
                    control={control}
                    rules={{
                      required: "School email is required",
                      pattern: { value: /^[^\s@]+@nbsc\.edu\.ph$/i, message: "Must be a valid NBSC email" },
                    }}
                    render={({ field }) => (
                      <input
                        {...field}
                        value={field.value ?? ""}
                        type="email"
                        placeholder=" "
                        className="w-full pl-9 pr-4 py-2.5 bg-gray-800 border border-white/10 rounded-xl text-white text-sm placeholder-gray-600 focus:outline-none focus:ring-2 focus:ring-blue-500/30"
                        onChange={(e) => {
                          const value = e.target.value;
                          const trimmedValue = value.trim();

                          // Only auto-fill if current value is exactly 8 digits and previous value wasn't an email
                          if (/^\d{8}$/.test(trimmedValue) && !prevClaimEmailValue.includes('@')) {
                            setPrevClaimEmailValue(`${trimmedValue}@nbsc.edu.ph`);
                            field.onChange(`${trimmedValue}@nbsc.edu.ph`);
                          } else {
                            setPrevClaimEmailValue(value);
                            field.onChange(value);
                          }
                        }}
                      />
                    )}
                  />
                </div>
                {errors.schoolEmail && <p className="text-red-400 text-xs mt-1">{errors.schoolEmail.message as string}</p>}
              </div>
              <div>
                <label className="block text-[10px] font-bold text-gray-400 uppercase tracking-widest mb-1.5">Date Item Was Lost <span className="text-red-400">*</span></label>
                <CustomDatePicker
                  value={lostDate}
                  onChange={setLostDate}
                  max={new Date().toISOString().split("T")[0]}
                  placeholder=""
                  openUp
                />
                {!lostDate && <p className="text-red-400 text-xs mt-1">Please select the date</p>}
              </div>
              <div>
                <label className="block text-[10px] font-bold text-gray-400 uppercase tracking-widest mb-1.5">Proof of Ownership <span className="text-red-400">*</span></label>
                <textarea rows={2} placeholder=" " {...register("distinguishingFeatures", { required: "Please describe identifying details", minLength: { value: 10, message: "At least 10 characters required" } })}
                  className="w-full p-3 bg-gray-800 border border-white/10 rounded-xl text-white text-sm placeholder-gray-600 resize-none focus:outline-none focus:ring-2 focus:ring-blue-500/30" />
                {errors.distinguishingFeatures && <p className="text-red-400 text-xs mt-1">{errors.distinguishingFeatures.message as string}</p>}
              </div>
              <div className="bg-blue-500/5 border border-blue-500/15 rounded-xl px-3.5 py-2.5">
                <p className="text-blue-300/70 text-[11px] leading-relaxed text-justify">Once submitted, the SAS office will verify your proof and contact you via school email before releasing the item.</p>
              </div>
              <div className="flex gap-2 pt-1">
                <button type="button" onClick={() => { reset(); setLostDate(""); onClose(); }} className="flex-1 py-2.5 bg-gray-800 hover:bg-gray-700 border border-white/5 text-gray-400 text-xs font-medium rounded-xl transition-colors">Cancel</button>
                <button type="submit" disabled={claimLoading || !lostDate} className="flex-1 py-2.5 bg-blue-600 hover:bg-blue-500 disabled:opacity-50 disabled:cursor-not-allowed text-white text-xs font-bold rounded-xl transition-all flex items-center justify-center gap-1.5">
                  {claimLoading ? <><svg className="animate-spin h-3.5 w-3.5" viewBox="0 0 24 24" fill="none"><circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" /><path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" /></svg> Submitting...</> : <><FaClipboardList size={10} /> Submit Claim</>}
                </button>
              </div>
            </form>
          )}
        </div>
      </div>
      {showClaimScanner && (
        <BarcodeScannerModal onScan={handleClaimScan} onClose={() => setShowClaimScanner(false)} useFetchStudent={useFetchStudentForClaim} />
      )}
    </div>
  );
};

// ── Main Page ─────────────────────────────────────────────────────────────────
const FoundItemsPage = () => {
  useScrollReveal();
  const users: any = useUserVerification();
  const isAdmin = users?.role === "ADMIN";

  // ── Points teaser banner ──
  const isAuthenticated = !!users?.id || !!users?.email;
  const { data: pointsData } = useGetMyPointsQuery(undefined, { skip: !isAuthenticated || isAdmin });
  const totalPoints = pointsData?.data?.totalPoints ?? 0;

  const [searchTerm, setSearchTerm] = useState("");
  const [fuzzyTerm, setFuzzyTerm] = useState("");
  const [categoryFilter, setCategoryFilter] = useState("ALL");
  const [currentPage, setCurrentPage] = useState(1);
  const [sortBy, setSortBy] = useState("foundItemName");
  const [sortOrder, setSortOrder] = useState("asc");
  const [viewMode, setViewMode] = useState<"grid" | "list">(typeof window !== "undefined" && window.innerWidth < 640 ? "list" : "grid");
  const [claimItem, setClaimItem] = useState<any>(null);
  const [limit] = useState(50);
  const searchTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const isSubmittingRef = useRef(false);
  const [showScrollTop, setShowScrollTop] = useState(false);

  useEffect(() => {
    const handleScroll = () => setShowScrollTop(window.scrollY > 400);
    window.addEventListener("scroll", handleScroll);
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [showCategoryHelp, setShowCategoryHelp] = useState(false);
  const [addSelectedFile, setAddSelectedFile] = useState<File | null>(null);
  const [addPreview, setAddPreview] = useState<string>("");
  const [addUploadError, setAddUploadError] = useState("");
  const [addPhotoError, setAddPhotoError] = useState("");
  const [addIsDragging, setAddIsDragging] = useState(false);
  const [addStartDate, setAddStartDate] = useState(new Date().toISOString().split("T")[0]);
  const [addSelectedMenucategoryId, setAddSelectedMenucategoryId] = useState("");
  const [addSelectedMenu, setAddSelectedMenu] = useState("");
  const [addSelectedColor, setAddSelectedColor] = useState("");
  const [addSelectedCondition, setAddSelectedCondition] = useState("");
  const addFileInputRef = useRef<HTMLInputElement>(null);
  const aiFileInputRef = useRef<HTMLInputElement>(null);
  const MAX_SIZE_MB = 5;
  const typewriter = useTypewriter();
  const [aiHighlight, setAiHighlight] = useState<string | null>(null);

  // Track previous email value to prevent auto-fill loops
  const [prevAddEmailValue, setPrevAddEmailValue] = useState("");

  const [showScanner, setShowScanner] = useState(false);
  const [scannedStudent, setScannedStudent] = useState<ScannedStudent | null>(null);
  const scannedAtRef = useRef<string>("");
  const [commentItem, setCommentItem] = useState<any>(null);

  // Auto open report modal if ?report=true in URL
  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    if (params.get("report") === "true") {
      setIsAddModalOpen(true);
      window.history.replaceState({}, document.title, window.location.pathname);
    }
  }, []);

  const {
    isOnline,
    hasDraft,
    pendingReports,
    saveDraft,
    loadDraft,
    clearDraft,
    queueOfflineReport,
    removePendingReport,
  } = useOfflineSync("found_item", () => {
    addReset();
    setAddSelectedFile(null);
    setAddPreview("");
    setIsAddModalOpen(false);
  });

  const isSyncingRef = useRef(false);
  const triggerSync = async () => {
    if (isSyncingRef.current || pendingReports.length === 0) return;
    isSyncingRef.current = true;
    const toastId = toast.loading(`Syncing ${pendingReports.length} offline report(s)...`);
    let successCount = 0;
    const reportsToSync = [...pendingReports];
    for (const report of reportsToSync) {
      try {
        await createFoundItem({
          foundItemName: report.foundItemName,
          description: report.description,
          categoryId: report.categoryId,
          img: report.img,
          location: report.location,
          date: new Date(report.date),
          claimProcess: report.claimProcess,
          reporterName: report.reporterName,
          schoolEmail: report.schoolEmail,
          department: report.department,
        }).unwrap();
        removePendingReport(report._offlineId);
        successCount++;
      } catch (err) {
        console.error("Sync failed for report", report._offlineId, err);
      }
    }
    if (successCount === reportsToSync.length) {
      toast.update(toastId, { render: "All offline reports synced successfully! ", type: "success", isLoading: false, autoClose: 4000 });
    } else if (successCount > 0) {
      toast.update(toastId, { render: `Synced ${successCount}/${reportsToSync.length} reports. Some failed.`, type: "warning", isLoading: false, autoClose: 4000 });
    } else {
      toast.update(toastId, { render: "Sync failed. Connection may be unstable. Will retry later.", type: "error", isLoading: false, autoClose: 4000 });
    }
    isSyncingRef.current = false;
  };

  useEffect(() => {
    if (isOnline && pendingReports.length > 0) {
      triggerSync();
    }
  }, [isOnline, pendingReports.length]);

  const useFetchStudent = (id: string) => {
    const trimmed = id?.trim() ?? "";
    const isValidId = Boolean(
      trimmed &&
      trimmed.length >= 4 &&
      !/^\d{4}-\d{2}-\d{2}$/.test(trimmed)
    );
    return useGetStudentByIdQuery(trimmed, { skip: !isValidId });
  };

  const [getStudentByDetails, { isFetching: isFetchingByDetails }] = useLazyGetStudentByDetailsQuery();

  const { data: foundItems, isLoading, isFetching } = useGetFoundItemsQuery({ searchTerm, page: currentPage, limit, sortBy, sortOrder });
  const { data: categoriesData, isLoading: categoriesLoading, error: categoriesError } = useCategoryQuery("");
  const [initiateChat] = useInitiateChatMutation();
  const navigate = useNavigate();

  const handleInitiateChat = async (item: any) => {
    console.log("[DEBUG] FoundItems - Initiating chat for item:", item);
    try {
      const userClaim = item?.claim?.find((c: any) => c.userId === users?.id);
      if (!userClaim) {
        toast.error("You need to submit a claim first before chatting.");
        return;
      }

      const res = await initiateChat({
        claimId: userClaim.id,
        reporterId: item.userId || item.user?.id
      }).unwrap();

      if (res.data?.id || res.id) {
        navigate(`/dashboard/${users?.role === "ADMIN" ? "" : "student/"}chat?roomId=${res.data?.id || res.id}`);
      }
    } catch (err: any) {
      toast.error(err?.data?.message || "Could not start chat");
    }
  };

  const [createFoundItem, { isLoading: isCreating }] = useCreateFoundItemMutation();
  const [uploadItemImages, { isLoading: isUploading }] = useUploadItemImagesMutation();
  const [aiRecognize] = useAiRecognizeMutation();
  const isBusy = isCreating || isUploading;

  const {
    handleSubmit: handleAddSubmit,
    register: addRegister,
    formState: { errors: addErrors },
    reset: addReset,
    setValue: addSetValue,
    control: addControl,
    watch,
  } = useForm({
    mode: "onSubmit",
    reValidateMode: "onSubmit",
    defaultValues: {
      reporterName: "",
      schoolEmail: "",
      department: "",
      foundItemName: "",
      description: "",
      location: "",
    },
  });

  const watchedReporterName = watch("reporterName");
  const watchedSchoolEmail = watch("schoolEmail");

  const [dismissedDraft, setDismissedDraft] = useState(false);
  const [hasExistingDraftOnOpen, setHasExistingDraftOnOpen] = useState(false);

  const handleRestoreDraft = () => {
    const draft = loadDraft();
    if (draft) {
      Object.entries(draft).forEach(([key, value]) => {
        if (value !== undefined && value !== null) addSetValue(key as any, value);
      });
      if (draft.categoryId) {
        handleCategoryChange(draft.categoryId);
      }
      toast.success("Draft restored successfully!");
    }
    setDismissedDraft(true);
  };

  const handleDismissDraft = () => {
    clearDraft();
    setDismissedDraft(true);
  };

  useEffect(() => {
    if (isAddModalOpen) {
      const draftExists = !!localStorage.getItem("form_draft_found_item");
      setHasExistingDraftOnOpen(draftExists);
      setDismissedDraft(false);
    } else {
      setHasExistingDraftOnOpen(false);
    }
  }, [isAddModalOpen]);

  // Auto-save draft on value change
  const addFormValues = watch();
  useEffect(() => {
    const isFormDirty = Object.values(addFormValues).some(v => !!v);
    if (isAddModalOpen && isFormDirty && !isSubmittingRef.current) {
      saveDraft({ ...addFormValues, categoryId: addSelectedMenucategoryId, categoryName: addSelectedMenu });
    }
  }, [addFormValues, addSelectedMenucategoryId, addSelectedMenu, isAddModalOpen]);

  const handleFuzzyChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const v = e.target.value;
    setFuzzyTerm(v);
    if (searchTimerRef.current) clearTimeout(searchTimerRef.current);
    searchTimerRef.current = setTimeout(() => {
      setSearchTerm(v);
      setCurrentPage(1);
    }, 400);
  };


  const clearSearch = () => { setFuzzyTerm(""); setSearchTerm(""); setCurrentPage(1); };

  const handleAddFileChange = async (files: FileList | null) => {
    if (!files || files.length === 0) return;
    setAddUploadError("");
    setAddPhotoError("");
    let file = files[0];
    if (!file.type.startsWith("image/")) { setAddUploadError("Only image files are allowed."); return; }
    if (file.size > MAX_SIZE_MB * 1024 * 1024) { setAddUploadError(`File must be under ${MAX_SIZE_MB}MB.`); return; }
    try { file = await imageCompression(file, { maxSizeMB: 0.4, maxWidthOrHeight: 1200, useWebWorker: true }); } catch (error) { console.error("Image compression error:", error); }
    setAddSelectedFile(file);
    const reader = new FileReader();
    reader.onloadend = () => setAddPreview(reader.result as string);
    reader.readAsDataURL(file);
  };

  const closeAddModal = () => {
    setIsAddModalOpen(false);
    addReset({
      reporterName: "",
      schoolEmail: "",
      department: "",
      foundItemName: "",
      description: "",
      location: "",
    });
    setAddSelectedFile(null);
    setAddPreview("");
    setAddUploadError("");
    setAddPhotoError("");
    setAddSelectedMenu("");
    setAddSelectedMenucategoryId("");
    setAddSelectedColor("");
    setAddSelectedCondition("");
    setAddStartDate(new Date().toISOString().split("T")[0]);
    setScannedStudent(null);
    scannedAtRef.current = "";
  };

  const handleAiScan = async (files: FileList | null) => {
    if (!files || files.length === 0) return;
    const file = files[0];
    const toastId = toast.loading("AI is analyzing your photo...");

    try {
      // 1. Compress for AI
      const compressedFile = await imageCompression(file, { maxSizeMB: 0.2, maxWidthOrHeight: 800, useWebWorker: true });

      // 2. Prepare Preview
      const reader = new FileReader();
      const base64Promise = new Promise<string>((resolve) => {
        reader.onloadend = () => resolve(reader.result as string);
        reader.readAsDataURL(compressedFile);
      });
      const base64Image = await base64Promise;

      // 3. Prepare FormData for API
      const formData = new FormData();
      const hasSupportedExt = /\.(jpg|jpeg|png|gif|webp)$/i.test(file.name);
      const filename = hasSupportedExt ? file.name : `${file.name.replace(/\.[^/.]+$/, "") || "image"}.jpg`;
      formData.append("image", compressedFile, filename);

      const res = await aiRecognize(formData).unwrap();

      if (res.success && res.data) {
        const aiData = res.data;

        // 1. Set category first
        if (aiData.categoryId) handleCategoryChange(aiData.categoryId);

        // 2. Instant-set color & condition (no typewriter for dropdowns)
        if (aiData.color) setAddSelectedColor(aiData.color);
        if (aiData.condition) setAddSelectedCondition(aiData.condition);

        // 3. Set image preview
        setAddSelectedFile(file);
        setAddPreview(base64Image);

        toast.update(toastId, { render: "AI scan complete! Auto-filling fields…", type: "success", isLoading: false, autoClose: 2500 });

        // 4. Typewriter: Item Name → then Description
        setAiHighlight("itemName");
        typewriter(
          (v) => addSetValue("foundItemName", v, { shouldDirty: true, shouldValidate: false }),
          aiData.itemName || "",
          () => {
            setAiHighlight(null);
            const fullDesc = [
              aiData.description,
              aiData.color ? `Color: ${aiData.color}.` : "",
              aiData.condition ? `Condition: ${aiData.condition}.` : "",
            ].filter(Boolean).join(" ");
            setTimeout(() => {
              setAiHighlight("description");
              typewriter(
                (v) => addSetValue("description", v, { shouldDirty: true, shouldValidate: false }),
                fullDesc,
                () => {
                  setAiHighlight(null);
                  addSetValue("foundItemName", aiData.itemName, { shouldDirty: true, shouldValidate: true });
                  addSetValue("description", fullDesc, { shouldDirty: true, shouldValidate: true });
                  toast.success("AI auto-filled the form.");
                },
                12
              );
            }, 350);
          }
        );
      } else {
        toast.update(toastId, { render: "AI could not recognize the item clearly.", type: "warning", isLoading: false, autoClose: 3000 });
      }
    } catch (error) {
      console.error("AI Scan Error:", error);
      toast.update(toastId, { render: "AI scan failed. Please fill manually.", type: "error", isLoading: false, autoClose: 3000 });
    }
  };

  const handleScan = (student: ScannedStudent) => {
    const scanTime = new Date().toISOString();
    scannedAtRef.current = scanTime;
    setScannedStudent(student);
    addSetValue("reporterName", student.name, { shouldDirty: true });
    addSetValue("schoolEmail", student.email, { shouldDirty: true });
    addSetValue("department", student.department || "", { shouldDirty: true });
    setShowScanner(false);
    if (student.name && student.name !== "Unknown Student") {
      toast.success(`Student identified: ${student.name}`);
    } else {
      toast.success(`ID Scanned: ${student.id}`);
    }
  };

  const clearScan = () => {
    setScannedStudent(null);
    scannedAtRef.current = "";
    addSetValue("reporterName", "", { shouldDirty: true });
    addSetValue("schoolEmail", "", { shouldDirty: true });
    addSetValue("department", "", { shouldDirty: true });
  };

  const handleFetchDetails = async () => {
    // Use the form's live watched values instead of DOM querySelector
    // (Controller-managed fields don't reliably expose via querySelector)
    let name = watchedReporterName?.trim() || "";
    let email = watchedSchoolEmail?.trim() || "";

    if (!name && !email) {
      toast.info("Please enter a name or email to fetch details");
      return;
    }

    // Resilient input routing: if user/autofill entered email/ID in the wrong field, correct it!
    if (name && !email) {
      const isEmail = name.includes("@");
      const isId = /^\d{8}$|^\d{4}-\d{2}-\d{2}$/.test(name);
      if (isEmail || isId) {
        email = name;
        name = "";
      }
    }

    try {
      // Try name first, fall back to email
      let student: any = null;

      if (name || email) {
        try {
          const res = await getStudentByDetails({ name, email }).unwrap();
          student = res?.data ?? res;
        } catch {
          // name search failed, try email below
        }
      }

      if (!student && email) {
        try {
          const res = await getStudentByDetails({ name: "", email }).unwrap();
          student = res?.data ?? res;
        } catch {
          // email search also failed
        }
      }

      if (student?.name) {
        setScannedStudent({
          id: student.id || "",
          name: student.name || "",
          email: student.email || "",
          department: student.department || student.course || "",
          raw: "manual_fetch",
        });
        addSetValue("reporterName", student.name, { shouldDirty: true });
        addSetValue("schoolEmail", student.email, { shouldDirty: true });
        addSetValue("department", student.department || student.course || "", { shouldDirty: true });
        toast.success(`Found: ${student.name}`);
      } else {
        toast.error("Student not found in masterlist");
      }
    } catch {
      toast.error("Student not found in masterlist");
    }
  };

  const handleCategoryChange = (id: string) => {
    const cat = categoriesData?.data?.find((c: any) => c.id === id);
    if (!cat) return;
    setAddSelectedMenu(cat.name);
    setAddSelectedMenucategoryId(cat.id);
    setAddSelectedColor("");
    setAddSelectedCondition("");
    const categoryKey = cat.name.toLowerCase();
    const config = CATEGORY_CONFIG[categoryKey as keyof typeof CATEGORY_CONFIG];
    if (config) {
      addSetValue("foundItemName", config.itemName, { shouldDirty: true });
      addSetValue("description", config.description, { shouldDirty: true });
    } else {
      addSetValue("foundItemName", "", { shouldDirty: true });
      addSetValue("description", "", { shouldDirty: true });
    }
  };

  const handleColorChange = (colorValue: string) => {
    setAddSelectedColor(colorValue);
    setAddSelectedCondition("");
    const categoryKey = addSelectedMenu.toLowerCase();
    const config = CATEGORY_CONFIG[categoryKey as keyof typeof CATEGORY_CONFIG];
    if (!config || !colorValue) return;
    const isOther = colorValue === "Other";
    const c = colorValue.toLowerCase();
    let colorDescription = "";
    switch (categoryKey) {
      case "bags": colorDescription = isOther ? `A bag was found. ` : `A ${c} bag was found. `; break;
      case "calculators": colorDescription = isOther ? `A calculator was found. ` : `A ${c} calculator was found. `; break;
      case "umbrellas": colorDescription = isOther ? `An umbrella was found. ` : `A ${c} umbrella was found. `; break;
      case "watches": colorDescription = isOther ? `A watch was found. ` : `A ${c} watch was found. `; break;
      case "money": colorDescription = `Money was found. `; break;
      case "wallets & purses":
      case "jewelry":
      case "accessories":
      case "keys":
      case "documents":
      case "flash drives & storage":
      case "device":
        colorDescription = config.description; break;
      default: colorDescription = isOther ? `A ${config.itemName.toLowerCase()} was found.` : `A ${c} ${config.itemName.toLowerCase()} was found.`;
    }
    addSetValue("description", colorDescription, { shouldDirty: true });
  };

  const handleConditionChange = (conditionValue: string) => {
    setAddSelectedCondition(conditionValue);
    const categoryKey = addSelectedMenu.toLowerCase();
    const config = CATEGORY_CONFIG[categoryKey as keyof typeof CATEGORY_CONFIG];
    if (!config || !addSelectedColor || !conditionValue) return;
    const isOther = addSelectedColor === "Other";
    const isNone = conditionValue === "None";
    let enhancedDescription = "";
    switch (categoryKey) {
      case "bags": {
        const base = isOther ? "A bag" : `A ${addSelectedColor.toLowerCase()} bag`;
        if (isNone) enhancedDescription = `${base} was found. `;
        else if (conditionValue === "Scratches") enhancedDescription = `${base} with scratches was found. `;
        else if (conditionValue === "Stickers") enhancedDescription = `${base} with stickers was found. `;
        else if (conditionValue === "Keychains") enhancedDescription = `${base} with keychains was found. `;
        else enhancedDescription = `${base} in ${conditionValue.toLowerCase()} condition was found. `;
        break;
      }
      case "calculators": {
        const base = isOther ? "A calculator" : `A ${addSelectedColor.toLowerCase()} calculator`;
        if (isNone) enhancedDescription = `${base} was found. `;
        else if (conditionValue === "Scratches") enhancedDescription = `${base} with scratches was found. `;
        else if (conditionValue === "Stickers") enhancedDescription = `${base} with stickers was found. `;
        else if (conditionValue === "Engravings") enhancedDescription = `${base} with engravings was found. `;
        else enhancedDescription = `${base} in ${conditionValue.toLowerCase()} condition was found. `;
        break;
      }
      case "umbrellas": {
        const base = isOther ? "An umbrella" : `A ${addSelectedColor.toLowerCase()} umbrella`;
        if (isNone) enhancedDescription = `${base} was found. `;
        else if (conditionValue === "Scratches") enhancedDescription = `${base} with scratches was found. `;
        else if (conditionValue === "Stickers") enhancedDescription = `${base} with stickers was found. `;
        else if (conditionValue === "Bent Frame") enhancedDescription = `${base} with a bent frame was found. `;
        else enhancedDescription = `${base} in ${conditionValue.toLowerCase()} condition was found. `;
        break;
      }
      case "watches": {
        const base = isOther ? "A watch" : `A ${addSelectedColor.toLowerCase()} watch`;
        if (isNone) enhancedDescription = `${base} was found. `;
        else if (conditionValue === "Scratches") enhancedDescription = `${base} with scratches was found. `;
        else if (conditionValue === "Stickers") enhancedDescription = `${base} with stickers was found. `;
        else if (conditionValue === "Engravings") enhancedDescription = `${base} with engravings was found. `;
        else enhancedDescription = `${base} in ${conditionValue.toLowerCase()} condition was found. `;
        break;
      }
      case "money":
        if (conditionValue === "Coins") enhancedDescription = `Money in the form of coins was found. `;
        else if (conditionValue === "Bills") enhancedDescription = `Money in the form of bills was found. `;
        else if (conditionValue === "Mixed Coins and Bills") enhancedDescription = `Money in the form of mixed coins and bills was found. `;
        else if (conditionValue === "Wallet/Purse") enhancedDescription = `Money found inside a wallet/purse was found. `;
        else enhancedDescription = `Money was found. `;
        break;
      case "wallets & purses":
      case "jewelry":
      case "accessories":
      case "keys":
      case "documents":
      case "flash drives & storage":
      case "device":
        enhancedDescription = config.description;
        break;
      default: {
        const colorPrefix = isOther ? "" : `${addSelectedColor.toLowerCase()} `;
        const conditionPart = isNone ? "" : ` with ${conditionValue.toLowerCase()}`;
        enhancedDescription = `A ${colorPrefix}${config.itemName.toLowerCase()}${conditionPart} was found. `;
      }
    }
    addSetValue("description", enhancedDescription, { shouldDirty: true });
  };

  const onAddSubmit = async (data: any) => {
    if (!addSelectedMenucategoryId) return;
    try {
      isSubmittingRef.current = true;
      const lowerMenu = addSelectedMenu?.toLowerCase() || "";
      const isAutoFillImage =
        lowerMenu.includes("money") ||
        lowerMenu.includes("cash") ||
        lowerMenu.includes("bill") ||
        lowerMenu.includes("currency") ||
        lowerMenu === "id" ||
        lowerMenu === "identification" ||
        lowerMenu.includes("device") ||
        lowerMenu.includes("electronic") ||
        lowerMenu.includes("gadget") ||
        lowerMenu.includes("wallet") ||
        lowerMenu.includes("purse") ||
        lowerMenu.includes("jewelry") ||
        lowerMenu.includes("accessor") ||
        lowerMenu.includes("key") ||
        lowerMenu.includes("usb") ||
        lowerMenu.includes("storage") ||
        lowerMenu.includes("flash drive") ||
        lowerMenu.includes("document") ||
        lowerMenu.includes("lunch") ||
        lowerMenu.includes("food") ||
        lowerMenu.includes("sport");

      const autoFillPath =
        (lowerMenu.includes("money") || lowerMenu.includes("cash") || lowerMenu.includes("bill") || lowerMenu.includes("currency")) ? "/money.jpg"
          : (lowerMenu === "id" || lowerMenu === "identification") ? "/id.jpg"
            : (lowerMenu.includes("device") || lowerMenu.includes("electronic") || lowerMenu.includes("gadget")) ? "/phone.png"
              : (lowerMenu.includes("wallet") || lowerMenu.includes("purse")) ? "/wallet.jpg"
                : (lowerMenu.includes("jewelry")) ? "/jewelry.jpg"
                  : (lowerMenu.includes("accessor")) ? "/Accessories.jpg"
                    : (lowerMenu.includes("key")) ? "/keys.jpg"
                      : (lowerMenu.includes("usb") || lowerMenu.includes("storage") || lowerMenu.includes("flash drive")) ? "/usb.jpg"
                        : (lowerMenu.includes("document")) ? "/id.jpg"
                          : (lowerMenu.includes("food") || lowerMenu.includes("lunch")) ? "/lunchbox.jpg"
                            : (lowerMenu.includes("sport")) ? "/sport.jpg"
                              : "/phone.png";
      const payload = {
        img: (isAutoFillImage && !addPreview) ? autoFillPath : (addPreview || ""),
        categoryId: addSelectedMenucategoryId,
        foundItemName: data.foundItemName,
        description: data.description,
        location: data.location,
        date: new Date(addStartDate + "T00:00:00"),
        claimProcess: "Visit the SAS office with a valid school ID to claim this item.",
        reporterName: data.reporterName || "OFFICE",
        schoolEmail: data.schoolEmail || "",
        department: data.department || "",
      };

      if (!isOnline) {
        queueOfflineReport({
          ...payload,
          img: addPreview, // Cache base64
          _isOffline: true
        });
        return;
      }

      const res: any = await createFoundItem(payload);
      if (res.error || res?.data?.success === false) { toast.error("Failed to submit found item."); return; }

      clearDraft();
      const newItemId = res?.data?.data?.id ?? res?.data?.id;
      if (addSelectedFile && newItemId) {
        const formData = new FormData();
        formData.append("images", addSelectedFile);
        formData.append("primaryIndex", "0");
        try {
          await uploadItemImages({ id: newItemId, type: "found", formData });
        } catch (imgErr) {
          console.error("Image upload failed:", imgErr);
          toast.warning("Item saved, but image upload failed. You can re-upload later.");
        }
      }

      toast.success("Found item submitted successfully!");
      closeAddModal();
    } catch {
      toast.error("Something went wrong. Please try again.");
    } finally {
      setTimeout(() => { isSubmittingRef.current = false; }, 500);
    }
  };

  const filteredItems = categoryFilter === "ALL"
    ? foundItems?.data ?? []
    : (foundItems?.data ?? []).filter((i: any) => i?.category?.name?.toLowerCase() === categoryFilter.toLowerCase());

  // Split into available and claimed
  const availableItems = filteredItems.filter((i: any) => !(i?.isClaimed || i?.claimStatus === "CLAIMED"));
  const claimedItems = filteredItems.filter((i: any) => i?.isClaimed || i?.claimStatus === "CLAIMED");

  const [showClaimedSection, setShowClaimedSection] = useState(false);

  const totalPages = foundItems?.meta?.totalPage || 1;
  const pagedItems = filteredItems;

  const sortOptions = [
    { value: "foundItemName-asc", label: "Name (A–Z)" },
    { value: "foundItemName-desc", label: "Name (Z–A)" },
    { value: "date-desc", label: "Date Found (Newest)" },
    { value: "date-asc", label: "Date Found (Oldest)" },
    { value: "location-asc", label: "Location (A–Z)" },
  ];

  const categoryOptions = [
    { value: "ALL", label: "All Categories", icon: <FaTag size={9} className="text-gray-400" /> },
    ...(categoriesData?.data?.map((cat: any) => ({
      value: cat.name,
      label: cat.name,
      icon: getCategoryIcon(cat.name),
    })) ?? []),
  ];

  const sortValue = `${sortBy}-${sortOrder}`;

  return (
    <>
      <div className="min-h-screen bg-gray-950 pb-16 reveal">
        {/* Offline Sync Banner */}
        {pendingReports.length > 0 && (
          <div className="bg-blue-600/20 border-b border-blue-500/30 p-4 flex flex-col sm:flex-row items-center justify-between gap-4 sticky top-0 z-[60] backdrop-blur-md">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-blue-500/20 flex items-center justify-center text-blue-400 shrink-0">
                <FaSpinner className={isOnline ? "animate-spin" : ""} size={20} />
              </div>
              <div>
                <p className="text-white text-sm font-bold">{pendingReports.length} Pending Reports</p>
                <p className="text-blue-400/70 text-[10px] font-medium">
                  {isOnline ? "Connection restored. Syncing your reports automatically..." : "You are offline. Reports will sync when connection returns."}
                </p>
              </div>
            </div>
            {isOnline && (
              <button
                onClick={triggerSync}
                className="px-6 py-2 bg-blue-600 hover:bg-blue-500 text-white text-xs font-black uppercase tracking-widest rounded-xl transition-all shadow-lg active:scale-95"
              >
                Sync Now
              </button>
            )}
          </div>
        )}

        {/* ── Page header ── */}
        <div className="border-b border-white/5 bg-gray-900/50">
          <div className="px-6 sm:px-10 lg:px-16 py-6 sm:py-8">
            <div className="flex flex-col sm:flex-row sm:items-end sm:justify-between gap-4">
              <div>
                <div className="flex items-center gap-2 mb-2">
                  <div className="w-1.5 h-5 bg-blue-500 rounded-full" />
                  <p className="text-blue-400 text-[11px] font-bold uppercase tracking-widest">Found Items</p>
                </div>
                <h1 className="text-white text-2xl sm:text-3xl font-bold tracking-tight">Items Found on Campus</h1>
                <p className="text-gray-500 text-sm mt-1 max-w-lg">Browse items recovered and logged by the SAS office. If you recognize something, submit a claim to verify ownership.</p>
              </div>
              <div className="flex items-center gap-2 flex-wrap sm:flex-nowrap shrink-0">

                {isAdmin && (
                  <button onClick={() => setIsAddModalOpen(true)}
                    className="flex items-center gap-2 px-4 py-2 bg-blue-600 hover:bg-blue-500 text-white text-xs font-semibold rounded-xl transition-all">
                    <FaPlus size={10} /> Add Found Item
                  </button>
                )}
              </div>
            </div>
          </div>
        </div>

        {/* ── Points Teaser Banner ── */}
        {!isAdmin && (
          <div className="px-6 sm:px-10 lg:px-16 pt-5 reveal reveal-delay-1">
            <PointsTeaserBanner />
          </div>
        )}

        {/* ── Search & filters ── */}
        <div className="px-6 sm:px-10 lg:px-16 py-5">
          <div className="flex flex-col gap-3">
            {/* Search + View Toggle Row */}
            <div className="flex items-center gap-2">
              <div className="relative flex-1">
                <FaSearch className="absolute left-3 sm:left-4 top-1/2 -translate-y-1/2 text-gray-500 pointer-events-none" size={13} />
                <input type="text" value={fuzzyTerm} onChange={handleFuzzyChange}
                  placeholder="Search by name, location, or description..."
                  className="w-full h-9 sm:h-auto pl-9 sm:pl-11 pr-20 sm:pr-28 sm:py-3 bg-gray-900 border border-white/5 rounded-xl text-white text-xs sm:text-sm placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-blue-500/30 focus:border-blue-500/40 transition-all" />
                {fuzzyTerm && (
                  <button onClick={clearSearch} className="absolute right-2 sm:right-2.5 top-1/2 -translate-y-1/2 flex items-center gap-1 sm:gap-1.5 px-2 sm:px-3 py-1 sm:py-1.5 bg-gray-800 hover:bg-gray-700 border border-white/5 text-gray-400 hover:text-white text-[10px] sm:text-xs rounded-lg transition-all">
                    <FaTimes size={9} /> Clear
                  </button>
                )}
              </div>
              <div className="flex gap-0.5 bg-gray-900 border border-white/5 rounded-xl p-1 sm:py-2 shrink-0">
                <button onClick={() => setViewMode("grid")} title="Grid view"
                  className={`p-2 rounded-lg transition-all ${viewMode === "grid" ? "bg-blue-500/10 text-blue-400" : "text-gray-500 hover:text-white"}`}>
                  <FaTh size={12} />
                </button>
                <button onClick={() => setViewMode("list")} title="List view"
                  className={`p-2 rounded-lg transition-all ${viewMode === "list" ? "bg-blue-500/10 text-blue-400" : "text-gray-500 hover:text-white"}`}>
                  <FaList size={12} />
                </button>
              </div>
            </div>
            {/* Filter Dropdowns Row */}
            <div className="grid grid-cols-2 gap-2">
              <CustomSelect
                options={sortOptions}
                value={sortValue}
                onChange={(v) => { const [f, o] = v.split("-"); setSortBy(f); setSortOrder(o); setCurrentPage(1); }}
              />
              <CustomSelect
                options={categoryOptions}
                value={categoryFilter}
                onChange={(v) => { setCategoryFilter(v); setCurrentPage(1); }}
              />
            </div>
            {fuzzyTerm && (
              <p className="text-xs text-gray-600 pl-1">Results for <span className="text-blue-400 font-medium">"{fuzzyTerm}"</span> — updating as you type</p>
            )}
          </div>
        </div>

        {/* ── Content ── */}
        <div className="px-6 sm:px-10 lg:px-16">
          {(isLoading || (isFetching && !foundItems)) ? (
            <div className={viewMode === "grid" ? "grid gap-5 grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4" : "space-y-2"}>
              {Array.from({ length: 8 }).map((_, i) => (
                viewMode === "grid" ? (
                  <div key={i} className="bg-gray-900 rounded-xl border border-white/5 overflow-hidden animate-pulse">
                    <div className="h-48 bg-gray-800/60" /><div className="p-4 space-y-2.5"><div className="h-4 bg-gray-800/60 rounded-lg" /><div className="h-3 bg-gray-800/60 rounded-lg w-3/4" /><div className="h-8 bg-gray-800/60 rounded-xl mt-3" /></div>
                  </div>
                ) : <div key={i} className="bg-gray-900 rounded-xl border border-white/5 h-16 animate-pulse" />
              ))}
            </div>
          ) : filteredItems.length === 0 ? (
            <div className="text-center py-20">
              <div className="w-16 h-16 rounded-2xl bg-gray-900 border border-white/5 flex items-center justify-center mx-auto mb-4"><FaSearch className="text-gray-600" size={20} /></div>
              <p className="text-white font-semibold mb-1">No found items</p>
              <p className="text-gray-500 text-sm">Try adjusting your search or filters</p>
              {(fuzzyTerm || categoryFilter !== "ALL") && (
                <button onClick={() => { clearSearch(); setCategoryFilter("ALL"); }} className="mt-4 px-5 py-2 bg-blue-600 hover:bg-blue-500 text-white text-sm font-medium rounded-lg transition-colors">Clear filters</button>
              )}
            </div>
          ) : (
            <>
              {/* ── Available Items ── */}
              {availableItems.length > 0 ? (
                <div className={viewMode === "grid" ? "grid gap-5 grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4" : "space-y-2"}>
                  {availableItems.map((item: any) => (
                    viewMode === "grid"
                      ? <FoundItemCard key={item.id} item={item} isAdmin={isAdmin} currentUser={users} onInitiateChat={handleInitiateChat} setClaimItem={setClaimItem} onOpenComments={() => setCommentItem(item)} />
                      : <FoundItemRow key={item.id} item={item} isAdmin={isAdmin} currentUser={users} onInitiateChat={handleInitiateChat} setClaimItem={setClaimItem} onOpenComments={() => setCommentItem(item)} />
                  ))}
                </div>
              ) : (
                <div className="text-center py-12 bg-gray-900/40 border border-white/5 rounded-2xl">
                  <div className="w-12 h-12 rounded-xl bg-gray-800 border border-white/5 flex items-center justify-center mx-auto mb-3"><FaCheckCircle className="text-gray-600" size={18} /></div>
                  <p className="text-gray-400 font-semibold text-sm">All items have been claimed</p>
                  <p className="text-gray-600 text-xs mt-1">Check the Claimed Items section below</p>
                </div>
              )}

              {/* ── Claimed Items Section ── */}
              {claimedItems.length > 0 && (
                <div className="mt-10">
                  {/* Section Header */}
                  <button
                    type="button"
                    onClick={() => setShowClaimedSection(v => !v)}
                    className="w-full flex items-center justify-between gap-3 mb-4 group"
                  >
                    <div className="flex items-center gap-3">
                      <div className="w-1.5 h-5 bg-blue-500 rounded-full" />
                      <div className="flex items-center gap-2">
                        <FaCheckCircle size={13} className="text-blue-400" />
                        <p className="text-blue-400 text-xs font-bold uppercase tracking-widest">Claimed Items</p>
                      </div>
                      <span className="inline-flex items-center justify-center px-2 py-0.5 bg-blue-500/15 border border-blue-500/30 text-blue-400 text-[10px] font-black rounded-full">
                        {claimedItems.length}
                      </span>
                    </div>
                    <div className="flex items-center gap-2">
                      <span className="text-gray-600 text-[10px] font-medium group-hover:text-gray-400 transition-colors">
                        {showClaimedSection ? "Hide" : "Show"}
                      </span>
                      <div className={`w-6 h-6 rounded-lg bg-blue-500/10 border border-blue-500/20 flex items-center justify-center text-blue-400 transition-transform duration-300 ${showClaimedSection ? "rotate-180" : ""}`}>
                        <FaChevronDown size={9} />
                      </div>
                    </div>
                  </button>

                  {/* Divider */}
                  <div className="h-px bg-gradient-to-r from-blue-500/30 via-emerald-500/10 to-transparent mb-5" />

                  {/* Collapsible Content */}
                  {showClaimedSection && (
                    <>
                      <p className="text-gray-600 text-[11px] mb-4 pl-1">These items have already been returned to their owners.</p>
                      <div className={`${viewMode === "grid" ? "grid gap-5 grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4" : "space-y-2"} opacity-75`}>
                        {claimedItems.map((item: any) => (
                          viewMode === "grid"
                            ? <FoundItemCard key={item.id} item={item} isAdmin={isAdmin} currentUser={users} onInitiateChat={handleInitiateChat} setClaimItem={setClaimItem} onOpenComments={() => setCommentItem(item)} />
                            : <FoundItemRow key={item.id} item={item} isAdmin={isAdmin} currentUser={users} onInitiateChat={handleInitiateChat} setClaimItem={setClaimItem} onOpenComments={() => setCommentItem(item)} />
                        ))}
                      </div>
                    </>
                  )}
                </div>
              )}
            </>
          )}
        </div>

        {/* ── Pagination ── */}
        {totalPages > 1 && (
          <div className="flex flex-col items-center mt-12 space-y-3">
            <p className="text-gray-600 text-xs">Page {currentPage} of {totalPages} · {foundItems?.meta?.total || 0} items</p>
            <nav className="inline-flex items-center gap-1 bg-gray-900 border border-white/5 rounded-2xl p-1.5">
              <button onClick={() => setCurrentPage(p => Math.max(1, p - 1))} disabled={currentPage === 1} className="flex items-center px-3.5 py-2 text-xs font-medium rounded-xl text-gray-400 hover:text-white hover:bg-white/5 disabled:text-gray-700 disabled:cursor-not-allowed transition-all"><FaChevronLeft size={10} className="mr-1.5" /> Prev</button>
              {(() => {
                const pages = []; const max = 5;
                let start = Math.max(1, currentPage - Math.floor(max / 2));
                const end = Math.min(totalPages, start + max - 1);
                if (end - start + 1 < max) start = Math.max(1, end - max + 1);
                if (start > 1) { pages.push(<button key={1} onClick={() => setCurrentPage(1)} className="px-3 py-2 text-xs font-medium rounded-lg text-gray-400 hover:text-white hover:bg-white/5 transition-all">1</button>); if (start > 2) pages.push(<span key="e1" className="px-1 text-gray-700 text-xs">…</span>); }
                for (let i = start; i <= end; i++) pages.push(<button key={i} onClick={() => setCurrentPage(i)} className={`px-3 py-2 text-xs font-medium rounded-lg transition-all ${currentPage === i ? "bg-blue-600 text-white" : "text-gray-400 hover:text-white hover:bg-white/5"}`}>{i}</button>);
                if (end < totalPages) { if (end < totalPages - 1) pages.push(<span key="e2" className="px-1 text-gray-700 text-xs">…</span>); pages.push(<button key={totalPages} onClick={() => setCurrentPage(totalPages)} className="px-3 py-2 text-xs font-medium rounded-lg text-gray-400 hover:text-white hover:bg-white/5 transition-all">{totalPages}</button>); }
                return pages;
              })()}
              <button onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))} disabled={currentPage === totalPages} className="flex items-center px-3.5 py-2 text-xs font-medium rounded-xl text-gray-400 hover:text-white hover:bg-white/5 disabled:text-gray-700 disabled:cursor-not-allowed transition-all">Next <FaChevronRight size={10} className="ml-1.5" /></button>
            </nav>
          </div>
        )}
      </div>

      {/* ── Add Found Item Modal ── */}
      {isAddModalOpen && (
        <div className="fixed inset-0 z-[100] bg-black/80 backdrop-blur-sm flex items-start justify-center p-4 sm:p-6 pt-10">
          <div className="absolute inset-0" onClick={closeAddModal} />
          <div className="relative bg-gray-900 border border-white/10 rounded-2xl w-full max-w-2xl sm:max-w-4xl lg:max-w-5xl flex flex-col shadow-2xl shadow-black/50"
            style={{ borderTop: "2px solid #3b82f6", maxHeight: "90vh" }}>

            {/* ── Modal header ── */}
            <div className="px-4 sm:px-6 py-5 border-b border-white/5 shrink-0">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div className="flex items-center gap-3 min-w-0">
                  <div className="min-w-0">
                    <h2 className="text-base sm:text-lg font-bold text-white truncate">Log a Found Item</h2>
                    <p className="text-gray-500 text-[11px] sm:text-xs mt-0.5 truncate">Record an item recovered on campus</p>
                  </div>
                </div>
                <div className="flex items-center w-full">
                  {/* This container will hold your buttons and push them to the right */}
                  <div className="ml-auto flex items-center gap-2">
                    <button
                      onClick={handleFetchDetails}
                      disabled={isFetchingByDetails}
                      className="px-2.5 py-1.5 rounded-lg bg-blue-500/10 hover:bg-blue-500/20 border border-blue-500/20 text-[9px] font-black text-blue-400 hover:text-blue-300 flex items-center justify-center gap-1.5 transition-all uppercase tracking-wider active:scale-95 disabled:opacity-50"
                    >
                      {isFetchingByDetails ? <FaSpinner className="animate-spin" size={9} /> : <FaSearch size={9} />}
                      <span className="leading-none">Fetch Info</span>
                    </button>

                    <button
                      type="button"
                      onClick={() => aiFileInputRef.current?.click()}
                      className="px-2.5 py-1.5 rounded-lg bg-blue-500/10 hover:bg-blue-500/20 border border-blue-500/20 text-[9px] font-black text-blue-400 hover:text-blue-300 flex items-center justify-center gap-1.5 transition-all uppercase tracking-wider active:scale-95"
                      title="Let AI identify the item from a photo"
                    >
                      <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round" className="animate-pulse"><path d="m12 3-1.912 5.813a2 2 0 0 1-1.275 1.275L3 12l5.813 1.912a2 2 0 0 1 1.275 1.275L12 21l1.912-5.813a2 2 0 0 1 1.275-1.275L21 12l-5.813-1.912a2 2 0 0 1-1.275-1.275L12 3Z" /><path d="M5 3v4" /><path d="M19 17v4" /><path d="M3 5h4" /><path d="M17 19h4" /></svg>
                      <span className="leading-none">AI Scan</span>
                      <input ref={aiFileInputRef} type="file" accept="image/*" className="hidden" onChange={e => handleAiScan(e.target.files)} />
                    </button>

                    <button
                      onClick={() => setShowScanner(true)}
                      className="inline-flex items-center justify-center gap-1.5 px-2.5 py-1.5 bg-blue-600/15 hover:bg-blue-600/25 border border-blue-500/25 text-blue-400 text-[9px] font-black rounded-lg transition-all uppercase tracking-wider active:scale-95"
                    >
                      <FaQrcode size={9} />
                      <span className="leading-none">Scan ID</span>
                    </button>

                    <button
                      onClick={closeAddModal}
                      className="w-7 h-7 rounded-lg bg-white/5 hover:bg-white/10 flex items-center justify-center text-gray-400 hover:text-white transition-colors shrink-0"
                    >
                      <FaTimes size={12} />
                    </button>
                  </div>
                </div>
              </div>
            </div>{/* ── end modal header ── */}

            {/* ── Modal body ── */}
            <div
              className="overflow-y-auto flex-1 px-6 py-5"
              style={{
                scrollbarWidth: 'thin',
                scrollbarColor: 'rgba(255, 255, 255, 0.2) rgba(255, 255, 255, 0.05)'
              }}
            >
              {/* Draft Restoration Banner */}
              {hasExistingDraftOnOpen && !dismissedDraft && (
                <div className="bg-blue-500/10 border border-blue-500/20 p-4 rounded-xl flex flex-col sm:flex-row items-center justify-between gap-4 mb-6">
                  <div className="flex items-center gap-3">

                    <div>
                      <p className="text-white text-sm font-bold">Unsaved Draft Found</p>
                      <p className="text-blue-400/70 text-[10px] font-medium leading-relaxed">
                        We found a draft from your last session. Would you like to restore it?
                      </p>
                    </div>
                  </div>
                  <div className="flex gap-2 shrink-0 w-full sm:w-auto">
                    <button
                      type="button"
                      onClick={handleRestoreDraft}
                      className="flex-1 sm:flex-none px-4 py-2 bg-blue-500 hover:bg-blue-400 text-white text-[10px] font-black uppercase tracking-wider rounded-xl transition-all active:scale-95 shadow-md"
                    >
                      Restore
                    </button>
                    <button
                      type="button"
                      onClick={handleDismissDraft}
                      className="flex-1 sm:flex-none px-4 py-2 bg-white/5 hover:bg-white/10 text-gray-400 hover:text-white text-[10px] font-bold uppercase tracking-wider rounded-xl transition-all active:scale-95"
                    >
                      Dismiss
                    </button>
                  </div>
                </div>
              )}

              {scannedStudent && (
                <div className="group relative overflow-hidden bg-blue-500/5 hover:bg-blue-500/10 border border-blue-500/20 rounded-2xl p-4 mb-6 transition-all duration-300">
                  <div className="absolute top-0 right-0 w-24 h-24 bg-blue-500/5 blur-2xl -mr-12 -mt-12 group-hover:bg-blue-500/10 transition-all duration-500" />
                  <div className="flex items-center justify-between relative z-10">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-xl bg-blue-500/20 flex items-center justify-center text-blue-400 shadow-inner group-hover:scale-110 transition-transform duration-300">
                        <FaUserCheck size={18} />
                      </div>
                      <div>
                        <h4 className="text-sm font-black text-white tracking-tight uppercase">{scannedStudent.name}</h4>
                        <p className="text-[10px] font-bold text-blue-400/70 uppercase tracking-widest mt-0.5">ID: {scannedStudent.id}</p>
                      </div>
                    </div>
                    <button onClick={clearScan} className="w-7 h-7 flex items-center justify-center rounded-lg bg-white/5 hover:bg-white/10 text-gray-400 hover:text-white transition-all hover:rotate-90">
                      <FaTimes size={12} />
                    </button>
                  </div>
                </div>
              )}

              <form id="add-found-form" onSubmit={handleAddSubmit(onAddSubmit)} className="space-y-4">

                {/* ── Reporter Information ── */}
                <div className="grid gap-4 sm:grid-cols-1 md:grid-cols-2">
                  <div className="flex flex-col gap-1.5">
                    <label className="flex items-center gap-1.5 text-[10px] font-semibold text-gray-400 uppercase tracking-widest">
                      <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2" /><circle cx="12" cy="7" r="4" /></svg>
                      Finder's Name <span className="text-red-400">*</span>
                    </label>
                    <input {...addRegister("reporterName", { required: "Finder's name is required" })} type="text" placeholder="Enter student name or scan ID" className="w-full px-4 py-2.5 bg-gray-800/60 border border-gray-700 rounded-lg text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-blue-500/50 focus:border-blue-500 transition-all text-sm" />
                    {addErrors.reporterName && <p className="text-red-400 text-xs">{addErrors.reporterName?.message as string}</p>}
                  </div>
                  <div className="flex flex-col gap-1.5">
                    <label className="flex items-center gap-1.5 text-[10px] font-semibold text-gray-400 uppercase tracking-widest">
                      <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect width="20" height="16" x="2" y="4" rx="2" /><path d="m22 7-10 5L2 7" /></svg>
                      Finder's Email <span className="text-red-400">*</span>
                    </label>
                    <Controller
                      name="schoolEmail"
                      control={addControl}
                      rules={{
                        required: "School email is required",
                        pattern: { value: /^[^\s@]+@nbsc\.edu\.ph$/i, message: "Must be a valid NBSC email" },
                      }}
                      render={({ field }) => (
                        <input
                          {...field}
                          value={field.value ?? ""}
                          type="email"
                          placeholder=" "
                          className="w-full px-4 py-2.5 bg-gray-800/60 border border-gray-700 rounded-lg text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-blue-500/50 focus:border-blue-500 transition-all text-sm"
                          onChange={(e) => {
                            const value = e.target.value;
                            const trimmedValue = value.trim();

                            // Only auto-fill if current value is exactly 8 digits and previous value wasn't an email
                            if (/^\d{8}$/.test(trimmedValue) && !prevAddEmailValue.includes('@')) {
                              setPrevAddEmailValue(`${trimmedValue}@nbsc.edu.ph`);
                              field.onChange(`${trimmedValue}@nbsc.edu.ph`);
                            } else {
                              setPrevAddEmailValue(value);
                              field.onChange(value);
                            }
                          }}
                        />
                      )}
                    />
                    {addErrors.schoolEmail && <p className="text-red-400 text-xs">{addErrors.schoolEmail?.message as string}</p>}
                  </div>
                </div>

                {/* ── Department ── */}
                <div className="flex flex-col gap-1.5">
                  <label className="flex items-center gap-1.5 text-[10px] font-semibold text-gray-400 uppercase tracking-widest">
                    <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect width="16" height="20" x="4" y="2" rx="2" ry="2" /><path d="M9 22v-4h6v4" /><path d="M8 6h.01" /><path d="M16 6h.01" /><path d="M8 10h.01" /><path d="M16 10h.01" /><path d="M8 14h.01" /><path d="M16 14h.01" /></svg>
                    Department / Course
                  </label>
                  <input {...addRegister("department")} type="text" readOnly placeholder="Auto-filled from masterlist..." className="w-full px-4 py-2.5 bg-gray-800/40 border border-gray-700 rounded-lg text-white placeholder-gray-500 focus:outline-none transition-all text-sm italic" />
                </div>

                {/* ── Item Name + Category ── */}
                <div className="grid gap-4 sm:grid-cols-1 md:grid-cols-2">
                  <div className="flex flex-col gap-1.5">
                    <label className={`flex items-center gap-1.5 text-[10px] font-semibold uppercase tracking-widest transition-colors duration-300 ${aiHighlight === "itemName" ? "text-blue-400" : "text-gray-400"}`}>
                      <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M12 2H2v10l9.29 9.29a1 1 0 0 0 1.41 0l7.3-7.3a1 1 0 0 0 0-1.41Z" /><path d="M7 7h.01" /></svg>
                      Item Name <span className="text-red-400">*</span>
                      {aiHighlight === "itemName" && <span className="ml-auto text-[9px] text-blue-400 animate-pulse font-bold normal-case tracking-normal">typing…</span>}
                    </label>
                    <div className={`relative flex items-center transition-all duration-300 ${aiHighlight === "itemName" ? "ring-2 ring-blue-400/40 rounded-lg" : ""}`}>
                      <input {...addRegister("foundItemName", { required: "Item name is required" })} type="text" placeholder=" " className="w-full px-4 py-2.5 bg-gray-800/40 border border-gray-700 rounded-lg text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-blue-500/50 focus:border-blue-500 transition-all text-sm pr-6" />
                      {aiHighlight === "itemName" && <span className="absolute right-3 inline-block w-[2px] h-4 bg-blue-400 animate-pulse" />}
                    </div>
                    {addErrors.foundItemName && <p className="text-red-400 text-xs">{addErrors.foundItemName?.message as string}</p>}
                  </div>
                  <div className="flex flex-col gap-1.5">
                    <div className="flex items-center gap-1.5">
                      <label className="flex items-center gap-1.5 text-[10px] font-semibold text-gray-400 uppercase tracking-widest">
                        <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect width="7" height="7" x="3" y="3" rx="1" /><rect width="7" height="7" x="14" y="3" rx="1" /><rect width="7" height="7" x="14" y="14" rx="1" /><rect width="7" height="7" x="3" y="14" rx="1" /></svg>
                        Category <span className="text-red-400">*</span>
                      </label>
                      <button type="button" onClick={() => setShowCategoryHelp(true)} className="w-4 h-4 rounded-full bg-gray-700 hover:bg-gray-600 border border-gray-600 text-gray-400 hover:text-white flex items-center justify-center transition-all" title="About categories">
                        <span className="text-[9px] font-black leading-none">i</span>
                      </button>
                    </div>
                    {categoriesLoading ? (
                      <div className="w-full px-3 py-2.5 text-sm text-gray-500 bg-gray-800/60 border border-gray-700 rounded-xl">Loading categories...</div>
                    ) : categoriesError ? (
                      <div className="w-full px-3 py-2.5 text-sm text-red-400 bg-gray-800/60 border border-red-500/30 rounded-xl">Failed to load categories</div>
                    ) : (
                      <CustomSelect
                        options={categoriesData?.data?.map((cat: any) => ({ value: cat.id, label: cat.name, icon: getCategoryIcon(cat.name) })) ?? []}
                        value={addSelectedMenucategoryId}
                        onChange={handleCategoryChange}
                      />
                    )}
                    {!addSelectedMenu && <p className="text-red-400 text-xs">Category is required</p>}
                  </div>
                </div>{/* ── end Item Name + Category grid ── */}

                {/* ── Color (only for configured categories with colors) ── */}
                {addSelectedMenu && CATEGORY_CONFIG[addSelectedMenu.toLowerCase() as keyof typeof CATEGORY_CONFIG] && CATEGORY_CONFIG[addSelectedMenu.toLowerCase() as keyof typeof CATEGORY_CONFIG].colors.length > 0 && (
                  <div className="flex flex-col gap-1.5">
                    <label className="flex items-center gap-1.5 text-[10px] font-semibold text-gray-400 uppercase tracking-widest">
                      <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M12 2H2v10l9.29 9.29a1 1 0 0 0 1.41 0l7.3-7.3a1 1 0 0 0 0-1.41Z" /><path d="M7 7h.01" /></svg>
                      Color
                    </label>
                    <CustomSelect
                      options={CATEGORY_CONFIG[addSelectedMenu.toLowerCase() as keyof typeof CATEGORY_CONFIG].colors.map(color => ({ value: color, label: color, icon: null }))}
                      value={addSelectedColor}
                      onChange={handleColorChange}
                    />
                  </div>
                )}

                {/* ── Condition (only after color is selected) ── */}
                {addSelectedColor && CATEGORY_CONFIG[addSelectedMenu.toLowerCase() as keyof typeof CATEGORY_CONFIG]?.conditions?.length > 0 && (
                  <div className="flex flex-col gap-1.5">
                    <label className="flex items-center gap-1.5 text-[10px] font-semibold text-gray-400 uppercase tracking-widest">
                      <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M12 2H2v10l9.29 9.29a1 1 0 0 0 1.41 0l7.3-7.3a1 1 0 0 0 0-1.41Z" /><path d="M7 7h.01" /></svg>
                      Condition
                    </label>
                    <CustomSelect
                      options={CATEGORY_CONFIG[addSelectedMenu.toLowerCase() as keyof typeof CATEGORY_CONFIG].conditions.map(condition => ({ value: condition, label: condition, icon: null }))}
                      value={addSelectedCondition}
                      onChange={handleConditionChange}
                    />
                  </div>
                )}

                {/* ── Where Found + Date Found ── */}
                <div className="grid gap-4 sm:grid-cols-1 md:grid-cols-2">
                  {/* ── Where Found — now using LocationAutocomplete ── */}
                  <div className="flex flex-col gap-1.5">
                    <label className="flex items-center gap-1.5 text-[10px] font-semibold text-gray-400 uppercase tracking-widest">
                      <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M20 10c0 6-8 12-8 12s-8-6-8-12a8 8 0 0 1 16 0Z" /><circle cx="12" cy="10" r="3" /></svg>
                      Where Found <span className="text-red-400">*</span>
                    </label>
                    <Controller
                      name="location"
                      control={addControl}
                      rules={{ required: "Location is required" }}
                      render={({ field }) => (
                        <LocationAutocomplete
                          value={field.value || ""}
                          onChange={field.onChange}
                          onBlur={field.onBlur}
                          className="w-full px-4 py-2.5 bg-gray-800/60 border border-gray-700 rounded-lg text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-blue-500/50 focus:border-blue-500 transition-all text-sm"
                          placeholder="e.g. Library, Room 205"
                        />
                      )}
                    />
                    {addErrors.location && <p className="text-red-400 text-xs">{addErrors.location?.message as string}</p>}
                  </div>

                  <div className="flex flex-col gap-1.5">
                    <label className="flex items-center gap-1.5 text-[10px] font-semibold text-gray-400 uppercase tracking-widest">
                      <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect width="18" height="18" x="3" y="4" rx="2" ry="2" /><line x1="16" x2="16" y1="2" y2="6" /><line x1="8" x2="8" y1="2" y2="6" /><line x1="3" x2="21" y1="10" y2="10" /></svg>
                      Date Found
                    </label>
                    <CustomDatePicker value={addStartDate} onChange={setAddStartDate} max={new Date().toISOString().split("T")[0]} placeholder="Select date found" />
                  </div>
                </div>

                {/* ── Description ── */}
                <div className="flex flex-col gap-1.5">
                  <label className={`flex items-center gap-1.5 text-[10px] font-semibold uppercase tracking-widest transition-colors duration-300 ${aiHighlight === "description" ? "text-blue-400" : "text-gray-400"}`}>
                    <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z" /></svg>
                    Description <span className="text-red-400">*</span>
                    {aiHighlight === "description" && <span className="ml-auto text-[9px] text-blue-400 animate-pulse font-bold normal-case tracking-normal">typing…</span>}
                  </label>
                  <div className={`relative transition-all duration-300 ${aiHighlight === "description" ? "ring-2 ring-blue-400/40 rounded-lg" : ""}`}>
                    <textarea {...addRegister("description", { required: "Description is required" })} rows={4} placeholder=" " className="w-full px-4 py-2.5 bg-gray-800/60 border border-gray-700 rounded-lg text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-blue-500/50 focus:border-blue-500 transition-all text-sm resize-none custom-scrollbar pr-6" />
                    {aiHighlight === "description" && <span className="absolute right-3 top-3 inline-block w-[2px] h-4 bg-blue-400 animate-pulse" />}
                  </div>
                  {addErrors.description && <p className="text-red-400 text-xs">{addErrors.description?.message as string}</p>}
                </div>

                {/* ── Item Photo ── */}
                <div className="flex flex-col gap-1.5">
                  <label className="flex items-center gap-1.5 text-[10px] font-semibold text-gray-400 uppercase tracking-widest">
                    <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect width="18" height="18" x="3" y="3" rx="2" ry="2" /><circle cx="9" cy="9" r="2" /><path d="m21 15-3.086-3.086a2 2 0 0 0-2.828 0L6 21" /></svg>
                    Item Photo <span className="text-red-400">*</span>
                  </label>
                  {!addPreview && !(
                    (() => {
                      const lower = addSelectedMenu?.toLowerCase() || "";
                      return lower.includes("money") || lower.includes("cash") || lower.includes("bill") || lower.includes("currency") ||
                        lower === "id" || lower === "identification" || lower.includes("device") || lower.includes("electronic") ||
                        lower.includes("gadget") || lower.includes("wallet") || lower.includes("purse") || lower.includes("jewelry") ||
                        lower.includes("accessor") || lower.includes("key") || lower.includes("usb") || lower.includes("storage") ||
                        lower.includes("flash drive") || lower.includes("document");
                    })()
                  ) ? (
                    <div
                      className={`border-2 border-dashed rounded-xl p-8 text-center cursor-pointer transition-all duration-200
                        ${addPhotoError ? "border-red-500/60 bg-red-900/5" : addIsDragging ? "border-blue-500 bg-blue-900/10" : "border-gray-700 bg-gray-800/40 hover:border-blue-500/60 hover:bg-gray-800/70"}`}
                      onClick={() => addFileInputRef.current?.click()}
                      onDragOver={e => { e.preventDefault(); setAddIsDragging(true); }}
                      onDragLeave={() => setAddIsDragging(false)}
                      onDrop={e => { e.preventDefault(); setAddIsDragging(false); handleAddFileChange(e.dataTransfer.files); }}
                    >
                      <input ref={addFileInputRef} type="file" accept="image/*" className="hidden" onChange={e => handleAddFileChange(e.target.files)} />
                      <div className="flex flex-col items-center gap-2.5">
                        <div className={`w-12 h-12 rounded-2xl border flex items-center justify-center ${addPhotoError ? "bg-red-900/20 border-red-500/30 text-red-400" : "bg-gray-800 border-gray-700 text-gray-400"}`}>
                          <svg width="22" height="22" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="1.5"><path strokeLinecap="round" strokeLinejoin="round" d="M3 16.5v2.25A2.25 2.25 0 005.25 21h13.5A2.25 2.25 0 0021 18.75V16.5m-13.5-9L12 3m0 0l4.5 4.5M12 3v13.5" /></svg>
                        </div>
                        <div>
                          <p className="text-sm text-gray-300"><span className="text-blue-400 font-semibold">Click to upload</span> or drag & drop</p>
                          <p className="text-xs text-gray-600 mt-0.5">JPG, PNG, WEBP · Max {MAX_SIZE_MB}MB</p>
                        </div>
                      </div>
                    </div>
                  ) : (
                    <div className="rounded-xl overflow-hidden border border-gray-700 bg-gray-800">
                      <div className="relative group">
                        <img
                          src={
                            (() => {
                              if (addPreview) return addPreview;
                              const lower = addSelectedMenu?.toLowerCase() || "";
                              if (lower.includes("money") || lower.includes("cash") || lower.includes("bill") || lower.includes("currency")) return "/money.jpg";
                              if (lower === "id" || lower === "identification") return "/id.jpg";
                              if (lower.includes("device") || lower.includes("electronic") || lower.includes("gadget")) return "/phone.png";
                              if (lower.includes("wallet") || lower.includes("purse")) return "/wallet.jpg";
                              if (lower.includes("jewelry")) return "/jewelry.jpg";
                              if (lower.includes("accessor")) return "/Accessories.jpg";
                              if (lower.includes("key")) return "/keys.jpg";
                              if (lower.includes("usb") || lower.includes("storage") || lower.includes("flash drive")) return "/usb.jpg";
                              if (lower.includes("document")) return "/id.jpg";
                              return "";
                            })()
                          }
                          alt="Preview"
                          className="w-full max-h-44 object-cover"
                        />
                        <div className="absolute inset-0 bg-black/0 group-hover:bg-black/55 transition-all flex items-center justify-center gap-3 opacity-0 group-hover:opacity-100">
                          <button type="button" onClick={() => addFileInputRef.current?.click()} className="bg-white/90 hover:bg-white text-gray-900 text-xs font-semibold px-4 py-2 rounded-lg">Change</button>
                          <button type="button" onClick={() => { setAddSelectedFile(null); setAddPreview(""); }} className="bg-red-600 hover:bg-red-500 text-white text-xs font-semibold px-4 py-2 rounded-lg">Remove</button>
                        </div>
                      </div>
                      <div className="px-4 py-2.5 border-t border-gray-700 flex items-center justify-between">
                        <span className="text-xs text-gray-400 truncate">{addSelectedFile ? addSelectedFile.name : ((addSelectedMenu?.toLowerCase().includes("money") || addSelectedMenu?.toLowerCase().includes("cash") || addSelectedMenu?.toLowerCase().includes("bill") || addSelectedMenu?.toLowerCase().includes("currency")) ? "money.jpg (Default)" : (addSelectedMenu?.toLowerCase() === "id" || addSelectedMenu?.toLowerCase() === "identification") ? "id.jpg (Default)" : (addSelectedMenu?.toLowerCase().includes("device") || addSelectedMenu?.toLowerCase().includes("electronic") || addSelectedMenu?.toLowerCase().includes("gadget")) ? "phone.png (Default)" : "No file chosen")}</span>
                        <span className="text-xs text-gray-500 ml-3 shrink-0">{addSelectedFile ? (addSelectedFile.size < 1024 * 1024 ? (addSelectedFile.size / 1024).toFixed(1) + " KB" : (addSelectedFile.size / 1024 / 1024).toFixed(1) + " MB") : "Default image"}</span>
                      </div>
                      <input ref={addFileInputRef} type="file" accept="image/*" className="hidden" onChange={(e) => handleAddFileChange(e.target.files)} />
                    </div>
                  )}
                  {addUploadError && <p className="text-red-400 text-xs">{addUploadError}</p>}
                  {addPhotoError && !addUploadError && <p className="text-red-400 text-xs">{addPhotoError}</p>}
                </div>

                {/* ── Claim Instructions (static) ── */}
                <div className="flex items-start gap-3 px-3.5 py-3 bg-blue-500/5 border border-blue-500/15 rounded-xl">
                  <div className="w-5 h-5 rounded bg-blue-500/10 border border-blue-500/20 flex items-center justify-center shrink-0 mt-0.5">
                    <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-blue-400"><path d="M9 11l3 3L22 4" /><path d="M21 12v7a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11" /></svg>
                  </div>
                  <div>
                    <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest mb-0.5">Claim Instructions</p>
                    <p className="text-blue-300/70 text-[11px] leading-relaxed">Visit the SAS office with a valid school ID to claim this item.</p>
                  </div>
                </div>

                {/* ── Possible Matches Found ── */}
                {(() => {
                  const itemName = (document.querySelector('input[name="foundItemName"]') as HTMLInputElement)?.value ?? "";
                  const location = (document.querySelector('input[name="location"]') as HTMLInputElement)?.value ?? "";
                  const description = (document.querySelector('textarea[name="description"]') as HTMLTextAreaElement)?.value ?? "";
                  const allFieldsFilled = itemName.trim() !== "" && location.trim() !== "" && description.trim() !== "" && addSelectedMenucategoryId !== "";
                  return allFieldsFilled && !(addSelectedMenu?.toLowerCase().includes("money") || addSelectedMenu?.toLowerCase().includes("cash") || addSelectedMenu?.toLowerCase().includes("bill") || addSelectedMenu?.toLowerCase().includes("currency")) ? (
                    <ItemMatchSuggestions
                      categoryId={addSelectedMenucategoryId}
                      categoryName={addSelectedMenu}
                      itemName={itemName}
                      location={location}
                    />
                  ) : null;
                })()}
              </form>
            </div>{/* ── end modal body ── */}

            {/* ── Modal footer ── */}
            <div className="px-6 py-4 border-t border-white/5 flex gap-3 shrink-0 bg-gray-900 rounded-b-2xl">
              <button type="button" onClick={closeAddModal} disabled={isBusy} className="flex-1 py-2.5 bg-gray-800 hover:bg-gray-700 disabled:opacity-50 border border-white/5 text-gray-300 rounded-xl text-sm font-medium transition-colors">Cancel</button>
              <button type="submit" form="add-found-form" disabled={isBusy || (!addSelectedFile && !addPreview && !(addSelectedMenu?.toLowerCase().includes("money") || addSelectedMenu?.toLowerCase().includes("cash") || addSelectedMenu?.toLowerCase().includes("bill") || addSelectedMenu?.toLowerCase().includes("currency") || addSelectedMenu?.toLowerCase() === "id" || addSelectedMenu?.toLowerCase() === "identification" || addSelectedMenu?.toLowerCase().includes("device") || addSelectedMenu?.toLowerCase().includes("electronic") || addSelectedMenu?.toLowerCase().includes("gadget")))}
                className="flex-1 py-2.5 bg-blue-600 hover:bg-blue-500 disabled:opacity-50 disabled:cursor-not-allowed text-white rounded-xl text-sm font-semibold transition-colors flex items-center justify-center gap-2">
                {isBusy ? (<><Spinner size="sm" /> Submitting…</>) : "Submit Found Item"}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ── Category Help Modal ── */}
      {showCategoryHelp && (
        <div className="fixed inset-0 z-[100] grid place-items-center p-4 sm:p-6 overflow-y-auto">
          <div className="fixed inset-0 bg-black/80 backdrop-blur-sm" onClick={() => setShowCategoryHelp(false)} />
          <div className="relative bg-gray-900 border border-white/10 rounded-2xl w-full max-w-sm shadow-2xl flex flex-col">
            <div className="flex items-center justify-between px-5 py-4 border-b border-gray-800 shrink-0">
              <h3 className="text-sm font-bold text-white">About Categories</h3>
              <button onClick={() => setShowCategoryHelp(false)} className="w-7 h-7 flex items-center justify-center rounded-lg bg-white/5 hover:bg-white/10 text-gray-400 hover:text-white transition-colors">
                <FaTimes size={12} />
              </button>
            </div>
            <div className="px-5 py-5 flex-1 flex flex-col justify-between min-h-[260px]">
              <div className="space-y-4">
                <p className="text-[10px] font-black text-blue-400 uppercase tracking-widest flex items-center gap-1.5">{CATEGORY_HELP_CONTENT.tag}</p>
                <div className="space-y-3">
                  {CATEGORY_HELP_CONTENT.steps.map(({ n, title, desc }) => (
                    <div key={n} className="flex gap-3">
                      <div className="shrink-0 w-6 h-6 rounded-full border bg-blue-500/10 border-blue-500/20 text-blue-400 flex items-center justify-center text-[10px] font-black">{n}</div>
                      <div>
                        <p className="text-white text-xs font-semibold">{title}</p>
                        <p className="text-gray-500 text-[11px] mt-0.5 leading-relaxed">{desc}</p>
                      </div>
                    </div>
                  ))}
                </div>
                {CATEGORY_HELP_CONTENT.tip && <div className="mt-3">{CATEGORY_HELP_CONTENT.tip}</div>}
              </div>
            </div>
            <div className="px-5 pb-5 pt-2 border-t border-gray-800 shrink-0 flex items-center justify-center">
              <button onClick={() => setShowCategoryHelp(false)} className="px-3 py-2 text-[10px] font-black uppercase tracking-wider text-gray-500 hover:text-gray-300 transition-colors">Got it</button>
            </div>
          </div>
        </div>
      )}

      {/* ── Scanner Modal ── */}
      {showScanner && (
        <BarcodeScannerModal onScan={handleScan} onClose={() => setShowScanner(false)} useFetchStudent={useFetchStudent} />
      )}

      {claimItem && <QuickClaimModal item={claimItem} onInitiateChat={handleInitiateChat} onClose={() => setClaimItem(null)} />}

      {/* Comment Modal */}
      <CommentModal
        isOpen={!!commentItem}
        onClose={() => setCommentItem(null)}
        itemId={commentItem?.id || ""}
        itemType="found"
        itemName={commentItem?.foundItemName || "Item"}
      />

      {/* ── Scroll to Top Button ── */}
      <button
        onClick={() => window.scrollTo({ top: 0, behavior: "smooth" })}
        className={`fixed bottom-6 right-6 p-3.5 bg-blue-600 hover:bg-blue-500 text-white rounded-full shadow-lg shadow-black/50 transition-all duration-300 z-40 hover:scale-110 ${showScrollTop ? "opacity-100 translate-y-0" : "opacity-0 translate-y-10 pointer-events-none"
          }`}
        title="Back to top"
      >
        <FaChevronUp size={16} />
      </button>

    </>
  );
};

export default FoundItemsPage;
