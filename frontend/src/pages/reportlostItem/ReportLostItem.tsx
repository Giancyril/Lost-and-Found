import { useForm, Controller } from "react-hook-form";
import { Spinner } from "flowbite-react";
import { toast } from "react-toastify";
import { useState, useRef, useEffect } from "react";
import {
  useCategoryQuery,
  useCreateLostItemMutation,
  useGetStudentByIdQuery,
  useLazyGetStudentByDetailsQuery,
  useAiRecognizeMutation,
} from "../../redux/api/api";
import { CustomDatePicker } from "../../components/ui/CustomDatePicker";
import ItemMatchSuggestions from "../../components/itemMatch/ItemMatchSuggestions";
import LocationAutocomplete from "../../components/ui/LocationAutocomplete";
import VoiceReportButton from "../../components/ui/VoiceReportButton";
import { useScrollReveal } from "../../hooks/useScrollReveal";
import { sanitizeObject } from "../../utils/sanitize";
import { useOfflineSync } from "../../hooks/useOfflineSync";
import {
  FaQrcode, FaUserCheck, FaTimes, FaSearch, FaSpinner,
  FaWallet, FaMobileAlt, FaLaptop, FaKey, FaBriefcase,
  FaHeadphones, FaGlasses, FaBook, FaIdCard, FaUmbrella,
  FaTshirt, FaCamera, FaClock, FaTint, FaTag, FaInfoCircle,
  FaCheck, FaChevronDown, FaMoneyBillWave,
  FaCalculator, FaPaintBrush, FaPlug, FaUsb, FaGem, FaUtensils, FaMusic, FaFootballBall, FaCopy, FaMagic
} from "react-icons/fa";
import type { ScannedStudent } from "../../components/scanner/BarcodeScannerModal";
import BarcodeScannerModal from "../../components/scanner/BarcodeScannerModal";
import imageCompression from "browser-image-compression";

const MAX_SIZE_MB = 5;

// ── Category configuration with auto-fill data ─────────────────────────────
const CATEGORY_CONFIG = {
  bags: {
    itemName: 'Bag',
    description: 'Please describe the color, brand, and any contents or keychains.',
    colors: ['Black', 'Brown', 'Blue', 'Gray', 'Red', 'Green', 'Navy', 'Tan', 'White', 'Other'],
    conditions: ['New', 'Good', 'Used', 'Damaged']
  },
  calculators: {
    itemName: 'Calculator',
    description: 'Please specify the brand (e.g. Casio, Sharp) and any markings.',
    colors: ['Black', 'Gray', 'Blue', 'Silver', 'White', 'Other'],
    conditions: ['New', 'Good', 'Used', 'Damaged']
  },
  keys: {
    itemName: 'Keys',
    description: 'Please describe the number of keys and any attached keychains.',
    colors: [],
    conditions: []
  },
  umbrellas: {
    itemName: 'Umbrella',
    description: 'Please describe the color, pattern, and size.',
    colors: ['Black', 'Blue', 'Red', 'Yellow', 'Green', 'Pink', 'Purple', 'Clear', 'Patterned', 'Other'],
    conditions: ['New', 'Good', 'Used', 'Damaged']
  },
  watches: {
    itemName: 'Watch',
    description: 'Please describe the brand, strap color, and face design.',
    colors: ['Black', 'Brown', 'Silver', 'Gold', 'Blue', 'White', 'Rose Gold', 'Other'],
    conditions: ['New', 'Good', 'Used', 'Damaged']
  },
  money: {
    itemName: 'Money',
    description: 'Please specify the amount and currency or if it was in a container.',
    colors: [],
    conditions: []
  },
  device: {
    itemName: 'Device',
    description: 'Please describe your device (brand, model, color, and unique features).',
    colors: [],
    conditions: []
  },
  id: {
    itemName: 'ID',
    description: 'Please specify the name on the ID and the institution.',
    colors: [],
    conditions: []
  },
  documents: {
    itemName: 'Document',
    description: 'Please describe the type of document and the name on it.',
    colors: [],
    conditions: []
  },
  'wallets & purses': {
    itemName: 'Wallet/Purse',
    description: 'Please describe the color, material, brand, and contents.',
    colors: [],
    conditions: []
  },
  jewelry: {
    itemName: 'Jewelry',
    description: 'Please describe the material, design, and any unique features.',
    colors: [],
    conditions: []
  },
  accessories: {
    itemName: 'Accessory',
    description: 'Please describe the item (e.g. belt, scarf, hat) and its details.',
    colors: [],
    conditions: []
  },
  'flash drives & storage': {
    itemName: 'Storage Device',
    description: 'Please describe the brand, color, capacity, and any labels.',
    colors: [],
    conditions: []
  },
  'lunch boxes & food containers': {
    itemName: 'Lunch Box/Container',
    description: 'Please describe the color, size, and any contents.',
    colors: ['Black', 'Blue', 'Red', 'Green', 'Pink', 'White', 'Clear', 'Other'],
    conditions: ['New', 'Good', 'Used']
  },
  'sport equipment': {
    itemName: 'Sport Equipment',
    description: 'Please describe the type of equipment, brand, and any markings.',
    colors: ['Black', 'White', 'Blue', 'Red', 'Orange', 'Yellow', 'Other'],
    conditions: ['New', 'Good', 'Used', 'Damaged']
  }
};

// ── Category icon resolver ────────────────────────────────────────────────────
const getCategoryIcon = (name: string) => {
  const n = name?.toLowerCase() ?? "";
  if (n.includes("wallet") || n.includes("purse") || n.includes("pouch")) return <FaWallet size={10} className="text-amber-400" />;
  if (n.includes("phone") || n.includes("mobile") || n.includes("celphone")) return <FaMobileAlt size={10} className="text-cyan-400" />;
  if (n.includes("laptop") || n.includes("computer") || n.includes("electronic") || n.includes("device") || n.includes("gadget")) return <FaLaptop size={10} className="text-indigo-400" />;
  if (n.includes("key")) return <FaKey size={10} className="text-orange-400" />;
  if (n.includes("bag") || n.includes("backpack") || n.includes("luggage")) return <FaBriefcase size={10} className="text-amber-400" />;
  if (n.includes("headphone") || n.includes("earphone") || n.includes("audio") || n.includes("airpod")) return <FaHeadphones size={10} className="text-green-400" />;
  if (n.includes("glass") || n.includes("spectacle") || n.includes("eyewear") || n.includes("sunglass")) return <FaGlasses size={10} className="text-teal-400" />;
  if (n.includes("book") || n.includes("stationery") || n.includes("notebook")) return <FaBook size={10} className="text-yellow-400" />;
  if (n.includes("calculat")) return <FaCalculator size={10} className="text-lime-400" />;
  if (n === "id" || n.includes("card") || n === "identification") return <FaIdCard size={10} className="text-blue-400" />;
  if (n === "documents" || n === "document" || n.includes("paper")) return <FaBook size={10} className="text-yellow-400" />;
  if (n.includes("umbrella")) return <FaUmbrella size={10} className="text-blue-400" />;
  if (n.includes("cloth") || n.includes("shirt") || n.includes("uniform") || n.includes("wear")) return <FaTshirt size={10} className="text-purple-400" />;
  if (n.includes("camera") || n.includes("photo")) return <FaCamera size={10} className="text-violet-400" />;
  if (n.includes("watch") || n.includes("clock")) return <FaClock size={10} className="text-gray-300" />;
  if (n.includes("water") || n.includes("bottle") || n.includes("tumbler") || n.includes("flask")) return <FaTint size={10} className="text-cyan-400" />;
  if (n.includes("money") || n.includes("cash") || n.includes("bill") || n.includes("currency")) return <FaMoneyBillWave size={10} className="text-green-400" />;
  if (n.includes("art") || n.includes("paint") || n.includes("brush") || n.includes("drawing")) return <FaPaintBrush size={10} className="text-rose-400" />;
  if (n.includes("charger") || n.includes("cable") || n.includes("plug")) return <FaPlug size={10} className="text-yellow-400" />;
  if (n.includes("usb") || n.includes("flash") || n.includes("drive")) return <FaUsb size={10} className="text-blue-400" />;
  if (n.includes("accessor") || n.includes("jewel") || n.includes("bracelet")) return <FaGem size={10} className="text-pink-400" />;
  if (n.includes("food") || n.includes("lunch") || n.includes("container")) return <FaUtensils size={10} className="text-orange-400" />;
  if (n.includes("music") || n.includes("instrument") || n.includes("guitar")) return <FaMusic size={10} className="text-fuchsia-400" />;
  if (n.includes("sport") || n.includes("ball") || n.includes("gym") || n.includes("equip")) return <FaFootballBall size={10} className="text-red-400" />;
  return <FaTag size={10} className="text-blue-400" />;
};

// ── Custom Select ─────────────────────────────────────────────────────────────
interface SelectOption { value: string; label: string; icon?: React.ReactNode; }

const CustomSelect = ({
  options, value, onChange, placeholder = "Select…", error,
}: {
  options: SelectOption[]; value: string; onChange: (v: string) => void;
  placeholder?: string; error?: boolean;
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
    <div ref={ref} className="relative w-full">
      <button
        type="button"
        onClick={() => setOpen(o => !o)}
        className={`w-full flex items-center justify-between gap-2 px-4 py-2.5 text-sm rounded-lg border transition-all duration-150 outline-none bg-gray-800/60
          ${open
            ? "border-blue-500 ring-2 ring-blue-500/60 text-white"
            : error
              ? "border-red-500/60 text-gray-400 hover:border-red-400/80"
              : "border-gray-700 text-gray-400 hover:border-gray-600 hover:text-white"
          }`}
      >
        <span className="flex items-center gap-2.5 truncate min-w-0">
          {selected?.icon && <span className="shrink-0">{selected.icon}</span>}
          <span className={`truncate text-sm ${selected ? "text-white" : "text-gray-500"}`}>
            {selected?.label ?? placeholder}
          </span>
        </span>
        <FaChevronDown
          size={10}
          className={`shrink-0 transition-transform duration-200 ${open ? "rotate-180 text-blue-400" : "text-gray-500"}`}
        />
      </button>

      {open && (
        <div className="absolute z-50 mt-1.5 w-full bg-[#0d1f3c] border border-blue-900/40 rounded-xl shadow-2xl shadow-black/70 overflow-hidden">
          <div className="h-px bg-gradient-to-r from-transparent via-blue-500/40 to-transparent" />
          <div className="py-1 max-h-60 overflow-y-auto overscroll-contain">
            {options.length === 0 ? (
              <div className="px-4 py-3 text-xs text-gray-500 text-center">No categories available</div>
            ) : options.map(opt => {
              const isActive = opt.value === value;
              return (
                <button
                  key={opt.value}
                  type="button"
                  onClick={() => { onChange(opt.value); setOpen(false); }}
                  className={`w-full flex items-center justify-between gap-2 px-3.5 py-2.5 text-sm text-left transition-colors duration-100
                    ${isActive ? "bg-blue-500/10 text-blue-300" : "text-gray-400 hover:bg-white/5 hover:text-white"}`}
                >
                  <span className="flex items-center gap-2.5 truncate min-w-0">
                    {opt.icon && (
                      <span className={`shrink-0 ${isActive ? "" : "opacity-60"}`}>{opt.icon}</span>
                    )}
                    <span className="truncate">{opt.label}</span>
                  </span>
                  {isActive && <FaCheck size={9} className="shrink-0 text-blue-400" />}
                </button>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
};

// ── Field wrapper ─────────────────────────────────────────────────────────────
const Field = ({
  label, required, error, icon, children, infoButton,
}: {
  label: string; required?: boolean; error?: string; icon: React.ReactNode; children: React.ReactNode; infoButton?: React.ReactNode;
}) => (
  <div className="flex flex-col gap-1.5">
    <label className="flex items-center gap-1.5 text-xs font-semibold text-gray-400 uppercase tracking-widest">
      {icon}{label}
      {required && <span className="text-red-500 normal-case tracking-normal font-normal">*</span>}
      {infoButton}
    </label>
    {children}
    {error && (
      <p className="flex items-center gap-1 text-red-400 text-xs">
        <svg width="12" height="12" viewBox="0 0 24 24" fill="currentColor">
          <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm1 15h-2v-2h2v2zm0-4h-2V7h2v6z" />
        </svg>
        {error}
      </p>
    )}
  </div>
);

const inputCls =
  "w-full px-4 py-2.5 bg-gray-800/60 border border-gray-700 rounded-lg text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-blue-500/60 focus:border-blue-500 transition-all duration-200 text-sm";

const IconUser = ({ size = 13 }: { size?: number }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2" /><circle cx="12" cy="7" r="4" />
  </svg>
);
const IconMail = ({ size = 13 }: { size?: number }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <rect width="20" height="16" x="2" y="4" rx="2" /><path d="m22 7-8.97 5.7a1.94 1.94 0 0 1-2.06 0L2 7" />
  </svg>
);
const IconTag = ({ size = 13 }: { size?: number }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M12 2H2v10l9.29 9.29a1 1 0 0 0 1.41 0l7.3-7.3a1 1 0 0 0 0-1.41Z" /><path d="M7 7h.01" />
  </svg>
);
const IconText = ({ size = 13 }: { size?: number }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z" />
  </svg>
);
const IconPin = ({ size = 13 }: { size?: number }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M20 10c0 6-8 12-8 12s-8-6-8-12a8 8 0 0 1 16 0Z" /><circle cx="12" cy="10" r="3" />
  </svg>
);
const IconCalendar = ({ size = 13 }: { size?: number }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <rect width="18" height="18" x="3" y="4" rx="2" ry="2" /><line x1="16" x2="16" y1="2" y2="6" /><line x1="8" x2="8" y1="2" y2="6" /><line x1="3" x2="21" y1="10" y2="10" />
  </svg>
);
const IconGrid = ({ size = 13 }: { size?: number }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <rect width="7" height="7" x="3" y="3" rx="1" /><rect width="7" height="7" x="14" y="3" rx="1" /><rect width="7" height="7" x="14" y="14" rx="1" /><rect width="7" height="7" x="3" y="14" rx="1" />
  </svg>
);
const IconBuilding = ({ size = 13 }: { size?: number }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <rect width="16" height="20" x="4" y="2" rx="2" ry="2" /><path d="M9 22v-4h6v4" /><path d="M8 6h.01" /><path d="M16 6h.01" /><path d="M8 10h.01" /><path d="M16 10h.01" /><path d="M8 14h.01" /><path d="M16 14h.01" />
  </svg>
);
const IconImage = () => (
  <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <rect width="18" height="18" x="3" y="3" rx="2" ry="2" /><circle cx="9" cy="9" r="2" /><path d="m21 15-3.086-3.086a2 2 0 0 0-2.828 0L6 21" />
  </svg>
);

const steps = ["Reporter Info", "Item Details", "Photo Submit"];

const StepIndicator = ({ current }: { current: number }) => (
  <div className="flex items-start justify-center mb-8 w-full">
    {steps.map((label, i) => (
      <div key={i} className="flex items-start min-w-0">
        <div className="flex flex-col items-center gap-1">
          <div className={`w-8 h-8 shrink-0 rounded-full flex items-center justify-center text-xs font-bold border-2 transition-all duration-300 ${i < current ? "bg-blue-600 border-blue-600 text-white"
            : i === current ? "bg-blue-600/20 border-blue-500 text-blue-400"
              : "bg-gray-800 border-gray-700 text-gray-600"}`}>
            {i < current ? (
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round">
                <polyline points="20 6 9 17 4 12" />
              </svg>
            ) : (i + 1)}
          </div>
          <div className="h-7 flex items-start justify-center w-[54px] sm:w-auto">
            <span className={`text-[8px] sm:text-[10px] font-medium text-center leading-tight sm:whitespace-nowrap ${i === current ? "text-blue-400" : i < current ? "text-gray-400" : "text-gray-600"}`}>
              {label}
            </span>
          </div>
        </div>
        {i < steps.length - 1 && (
          <div className={`w-4 sm:w-16 shrink-0 h-px mx-1 mt-4 transition-all duration-300 ${i < current ? "bg-blue-600" : "bg-gray-700"}`} />
        )}
      </div>
    ))}
  </div>
);

// ── Help Modal Pages ──────────────────────────────────────────────────────────
const HELP_PAGES = [
  {
    tag: <><FaSearch size={8} /> Fetch Student Info</>,
    steps: [
      { n: "1", title: "Enter a Name or Email", desc: "Type your full name or institutional email in the fields below." },
      { n: "2", title: "Click Fetch Student Info", desc: "The system will search the student masterlist and auto-fill the fields if a match is found." },
      { n: "3", title: "Verify the Details", desc: "Check that the name, email, and department are correct before proceeding." },
    ],
    tip: null,
  },
  {
    tag: <><FaQrcode size={8} /> Scan ID</>,
    steps: [
      { n: "1", title: "Click Scan ID", desc: "Press the Scan ID button to open the camera scanner." },
      { n: "2", title: "Point at the Barcode", desc: "Hold the student's ID barcode steady within the scanning frame. Use the back camera for best results." },
      { n: "3", title: "Auto-fill Complete", desc: "Once scanned, the student's name, email, and department will be automatically filled in." },
    ],
    tip: (
      <div className="p-3 rounded-xl bg-blue-500/5 border border-blue-500/20">
        <p className="text-gray-400 text-[11px] leading-relaxed text-justify">
          Make sure <span className="text-blue-400 font-semibold">camera permission</span> is enabled for Scan ID. If the scan fails, use <span className="text-blue-400 font-semibold">Fetch Student Info</span> instead.
        </p>
      </div>
    ),
  },
];

// Category Help Modal Content
const CATEGORY_HELP_CONTENT = {
  tag: <><IconGrid size={8} /> Item Categories</>,
  steps: [
    { n: "1", title: "Select a Category", desc: "Choose the most appropriate category for your lost item from the dropdown menu." },
    { n: "2", title: "Auto-fill Features", desc: "Some categories will automatically fill in the item name and provide color/condition options." },
    { n: "3", title: "Enhanced Description", desc: "The system will help generate a detailed description based on your selections." },
  ],
  tip: (
    <div className="p-3 rounded-xl bg-blue-500/5 border border-blue-500/20">
      <p className="text-gray-400 text-[11px] leading-relaxed text-justify">
        Selecting the right category helps us match your item with found items faster. Categories like <span className="text-blue-400 font-semibold">bags</span>, <span className="text-blue-400 font-semibold">calculators</span>, <span className="text-blue-400 font-semibold">keys</span>, <span className="text-blue-400 font-semibold">umbrellas</span>, and <span className="text-blue-400 font-semibold">watches</span> have special auto-fill features.
      </p>
    </div>
  ),
};

const ReportLostItem = () => {
  useScrollReveal();
  const { register, formState: { errors }, reset, trigger, getValues, control, setValue, watch } = useForm({
    mode: "onChange",
    defaultValues: {
      reporterName: "",
      schoolEmail: "",
      department: "",
      lostItemName: "",
      description: "",
      location: "",
      color: "",
      condition: "",
    }
  });

  const reporterName = watch("reporterName");
  const schoolEmail = watch("schoolEmail");
  const lostItemName = watch("lostItemName");
  const location = watch("location");

  // Track previous email value to prevent auto-fill loop
  const [prevEmailValue, setPrevEmailValue] = useState("");
  const description = watch("description");
  const color = watch("color");
  const condition = watch("condition");

  const [step, setStep] = useState(0);
  const [selectedMenu, setselectedMenu] = useState("");
  const [selectedMenucategoryId, setselectedMenucategoryId] = useState("");
  const [categoryTouched, setCategoryTouched] = useState(false);
  const [showHelpModal, setShowHelpModal] = useState(false);
  const [helpPage, setHelpPage] = useState(0);
  const [showCategoryHelp, setShowCategoryHelp] = useState(false);
  const [showAiHelp, setShowAiHelp] = useState(false);
  const [selectedColor, setSelectedColor] = useState("");
  const [, setSelectedCondition] = useState("");
  const [startDate, setStartDate] = useState(new Date().toISOString().split("T")[0]);

  const hasItemDetailsInput = Boolean(
    lostItemName?.trim() ||
    location?.trim() ||
    description?.trim() ||
    color?.trim() ||
    condition?.trim() ||
    selectedMenucategoryId
  );

  const {
    isOnline,
    hasDraft,
    pendingReports,
    saveDraft,
    loadDraft,
    clearDraft,
    queueOfflineReport,
    removePendingReport,
  } = useOfflineSync("lost_item", () => {
    reset();
    setSelectedFile(null);
    setPreview("");
    setStep(0);
  });

  const [dismissedDraft, setDismissedDraft] = useState(false);
  const [hasExistingDraftOnMount, setHasExistingDraftOnMount] = useState(false);

  const isSyncingRef = useRef(false);
  const triggerSync = async () => {
    if (isSyncingRef.current || pendingReports.length === 0) return;
    isSyncingRef.current = true;
    const toastId = toast.loading(`Syncing ${pendingReports.length} offline report(s)...`);
    let successCount = 0;
    const reportsToSync = [...pendingReports];
    for (const report of reportsToSync) {
      try {
        await createLostItem({
          lostItemName: report.lostItemName,
          description: report.description,
          categoryId: report.categoryId,
          img: report.img,
          location: report.location,
          date: new Date(report.date),
          reporterName: report.reporterName,
          schoolEmail: report.schoolEmail,
        }).unwrap();
        removePendingReport(report._offlineId);
        successCount++;
      } catch (err) {
        console.error("Sync failed for report", report._offlineId, err);
      }
    }
    if (successCount === reportsToSync.length) {
      toast.update(toastId, { render: "All offline reports synced successfully! 🎉", type: "success", isLoading: false, autoClose: 4000 });
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

  useEffect(() => {
    const draftExists = !!localStorage.getItem("form_draft_lost_item");
    setHasExistingDraftOnMount(draftExists);
  }, []);

  const handleRestoreDraft = () => {
    const draft = loadDraft();
    if (draft) {
      if (draft.categoryId) {
        setselectedMenu(draft.categoryName || "");
        setselectedMenucategoryId(draft.categoryId);
      }
      if (draft.startDate) {
        setStartDate(draft.startDate);
      }
      
      Object.entries(draft).forEach(([key, value]) => {
        if (value !== undefined && value !== null) {
          setValue(key as any, value, { shouldValidate: true, shouldDirty: true });
        }
      });

      if (draft.color) setSelectedColor(draft.color);
      if (draft.condition) setSelectedCondition(draft.condition);

      toast.success("Draft restored successfully!");
    }
    setDismissedDraft(true);
  };

  const handleDismissDraft = () => {
    clearDraft();
    setDismissedDraft(true);
  };

  // Auto-save draft on value change
  const formValues = watch();
  useEffect(() => {
    const isFormDirty = Object.values(formValues).some(v => !!v);
    if (isFormDirty && step < 2) {
      saveDraft({ ...formValues, categoryId: selectedMenucategoryId, categoryName: selectedMenu, startDate });
    }
  }, [formValues, selectedMenucategoryId, selectedMenu, startDate, step]);

  const closeHelp = () => { setShowHelpModal(false); setHelpPage(0); };
  const openHelp = () => { setHelpPage(0); setShowHelpModal(true); };

  const handleMenuChange = (menuName: string, categoryId: string) => {
    setselectedMenu(menuName);
    setselectedMenucategoryId(categoryId);

    // Auto-fill functionality
    const categoryKey = menuName.toLowerCase();
    const config = CATEGORY_CONFIG[categoryKey as keyof typeof CATEGORY_CONFIG];

    if (config) {
      // Auto-fill item name
      setValue("lostItemName", config.itemName);

      // Auto-fill description (base description without color)
      setValue("description", config.description);

      // Reset color field when category changes
      setValue("color", "");
      setSelectedColor("");
      setSelectedCondition("");
    } else {
      // Clear fields if no config exists for the category
      setValue("lostItemName", "");
      setValue("description", "");
      setValue("color", "");
      setSelectedColor("");
      setSelectedCondition("");
    }
  };

  const [createLostItem, { isLoading }] = useCreateLostItemMutation();
  const [aiRecognize, { isLoading: isAiRecognizing }] = useAiRecognizeMutation();
  const { data: Category, isLoading: categoriesLoading, error: categoriesError } = useCategoryQuery(undefined);

  const [showScanner, setShowScanner] = useState(false);
  const [scannedStudent, setScannedStudent] = useState<ScannedStudent | null>(null);
  const scannedAtRef = useRef<string>("");

  const useFetchStudent = (id: string) => {
    const trimmed = id?.trim() ?? "";
    const isValidId = Boolean(trimmed && trimmed.length >= 4 && !/^\d{4}-\d{2}-\d{2}$/.test(trimmed));
    return useGetStudentByIdQuery(trimmed, { skip: !isValidId });
  };

  const handleScan = (student: ScannedStudent) => {
    scannedAtRef.current = new Date().toISOString();
    setScannedStudent(student);
    setValue("reporterName", student.name);
    setValue("schoolEmail", student.email);
    setValue("department", student.department || "");
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
    setValue("reporterName", "");
    setValue("schoolEmail", "");
    setValue("department", "");
  };

  const handleClearDetails = () => {
    setValue("lostItemName", "");
    setValue("location", "");
    setValue("description", "");
    setValue("color", "");
    setValue("condition", "");
    setSelectedColor("");
    setSelectedCondition("");
    setselectedMenu("");
    setselectedMenucategoryId("");
    setStartDate(new Date().toISOString().split("T")[0]);
    setCategoryTouched(false);
    clearDraft();
    toast.info("Item details cleared!");
  };

  const [getStudentByDetails, { isFetching: isFetchingByDetails }] = useLazyGetStudentByDetailsQuery();

  const handleFetchDetails = async () => {
    // Read directly from watched values (more reliable with Controller fields)
    const name = reporterName?.trim() || "";
    const email = schoolEmail?.trim() || "";

    if (!name && !email) {
      toast.info("Please enter a name or email to fetch details");
      return;
    }
    if (name && /^\d{8}$|^\d{4}-\d{2}-\d{2}$/.test(name)) {
      toast.warn("Please enter a valid name");
      return;
    }

    try {
      const res = await getStudentByDetails({ name, email }).unwrap();
      // Backend sendResponse wraps in { success, data } — unwrap if needed
      const student = res?.data ?? res;

      if (student?.name) {
        setValue("reporterName", student.name);
        setValue("schoolEmail", student.email);
        // department is now returned by the service (alias for course)
        setValue("department", student.department || student.course || "");
        setScannedStudent({
          id: student.id,
          name: student.name,
          email: student.email,
          department: student.department || student.course || "",
          raw: "manual_fetch",
        });
        toast.success(`Found: ${student.name}`);
      } else {
        toast.error("Student not found in masterlist");
      }
    } catch {
      toast.error("Student not found in masterlist");
    }
  };

  const handleAiScan = async (files: FileList | null) => {
    if (!files || files.length === 0) return;
    const file = files[0];
    const toastId = toast.loading("AI is analyzing your photo...");

    try {
      // Compress for AI
      const compressedFile = await imageCompression(file, { maxSizeMB: 0.2, maxWidthOrHeight: 800, useWebWorker: true });

      // Create preview for UI
      const reader = new FileReader();
      const base64Promise = new Promise<string>((resolve) => {
        reader.onloadend = () => resolve(reader.result as string);
        reader.readAsDataURL(compressedFile);
      });
      const base64Image = await base64Promise;

      // Prepare FormData (Not using base64 for the API call anymore)
      const formData = new FormData();
      formData.append("image", compressedFile);

      const res = await aiRecognize(formData).unwrap();

      if (res.success && res.data) {
        const aiData = res.data;

        // 1. Set category first (this usually triggers generic auto-fills)
        if (aiData.categoryId) {
          handleMenuChange(aiData.categoryName, aiData.categoryId);
        }

        // 2. Apply AI-specific overrides AFTER category change to prevent overwriting
        setValue("lostItemName", aiData.itemName, { shouldDirty: true, shouldValidate: true });
        setValue("description", aiData.description, { shouldDirty: true, shouldValidate: true });

        if (aiData.color) {
          setValue("color", aiData.color, { shouldDirty: true });
          setSelectedColor(aiData.color);
        }
        if (aiData.condition) {
          setValue("condition", aiData.condition, { shouldDirty: true });
        }

        // Also prepare the image preview
        setSelectedFile(file);
        setPreview(base64Image);

        toast.update(toastId, { render: "Magic Scan successful! Fields auto-filled.", type: "success", isLoading: false, autoClose: 3000 });
      } else {
        toast.update(toastId, { render: "AI could not recognize the item clearly.", type: "warning", isLoading: false, autoClose: 3000 });
      }
    } catch (error) {
      console.error("AI Scan Error:", error);
      toast.update(toastId, { render: "AI scan failed. Please fill manually.", type: "error", isLoading: false, autoClose: 3000 });
    }
  };

  const handleVoiceParsed = (data: any) => {
    if (data.itemName) {
      setValue("lostItemName", data.itemName);
    }
    if (data.location) {
      setValue("location", data.location);
    }
    if (data.description) {
      setValue("description", data.description);
    }
    if (data.categoryId) {
      const cat = Category?.data?.find((c: any) => c.id === data.categoryId);
      handleMenuChange(cat ? cat.name : (data.categoryName || ""), data.categoryId);
    }
    if (data.color) {
      setValue("color", data.color);
      setSelectedColor(data.color);
    }
    if (data.condition) {
      setValue("condition", data.condition);
    }
  };

  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [preview, setPreview] = useState<string>("");
  const [uploadError, setUploadError] = useState("");
  const [isDragging, setIsDragging] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileChange = async (files: FileList | null) => {
    if (!files || files.length === 0) return;
    setUploadError("");
    let file = files[0];
    if (!file.type.startsWith("image/")) { setUploadError("Only image files are allowed."); return; }
    if (file.size > MAX_SIZE_MB * 1024 * 1024) { setUploadError(`File must be under ${MAX_SIZE_MB}MB.`); return; }
    try {
      file = await imageCompression(file, { maxSizeMB: 0.4, maxWidthOrHeight: 1200, useWebWorker: true });
    } catch (error) { console.error("Image compression error:", error); }
    setSelectedFile(file);
    const reader = new FileReader();
    reader.onloadend = () => setPreview(reader.result as string);
    reader.readAsDataURL(file);
  };

  const removeFile = () => {
    setSelectedFile(null); setPreview(""); setUploadError("");
    if (fileInputRef.current) fileInputRef.current.value = "";
  };

  const nextStep = async () => {
    if (step >= 2) return;
    const fields = step === 0
      ? ["reporterName", "schoolEmail"]
      : ["lostItemName", "description", "location", ...(selectedMenu && CATEGORY_CONFIG[selectedMenu.toLowerCase() as keyof typeof CATEGORY_CONFIG]?.colors?.length > 0 ? ["color"] : []), ...(selectedColor && CATEGORY_CONFIG[selectedMenu.toLowerCase() as keyof typeof CATEGORY_CONFIG]?.conditions?.length > 0 ? ["condition"] : [])];
    const valid = await trigger(fields as any);
    if (step === 1) { setCategoryTouched(true); if (!selectedMenucategoryId || !valid) return; }
    if (valid) setStep((s) => s + 1);
  };

  const [trackingCode, setTrackingCode] = useState<string | null>(null);

  const handleCloseTrackingModal = () => {
    setTrackingCode(null);
    reset(); setSelectedFile(null); setPreview(""); setUploadError("");
    setselectedMenu(""); setselectedMenucategoryId(""); setCategoryTouched(false);
    setSelectedColor(""); setSelectedCondition("");
    setStep(0); setScannedStudent(null); scannedAtRef.current = "";
  };

  const onSubmit = async () => {
    const rawData = getValues();
    const data = sanitizeObject(rawData);

    if (!isOnline) {
      queueOfflineReport({
        ...data,
        categoryId: selectedMenucategoryId,
        categoryName: selectedMenu,
        img: preview, // Store the base64 preview for offline sync
        date: new Date(startDate + "T00:00:00").toISOString(),
      });
      return;
    }

    try {
      const res: any = await createLostItem({
        lostItemName: data.lostItemName, description: data.description,
        categoryId: selectedMenucategoryId, img: preview || "",
        location: data.location, date: new Date(startDate + "T00:00:00"),
        reporterName: data.reporterName || "", schoolEmail: data.schoolEmail || "",
      });
      if (res.error || res?.data?.success === false) { toast.error("Failed to report lost item"); return; }

      clearDraft(); // Clear draft on successful submission
      const createdId = res.data?.data?.id || res.data?.id;
      toast.success("Lost item reported successfully");
      if (createdId) {
        setTrackingCode(createdId);
      } else {
        handleCloseTrackingModal();
      }
    } catch { toast.error("Failed to report lost item"); }
  };

  // ── Build category options for CustomSelect ──
  const categoryOptions: { value: string; label: string; icon: React.ReactNode }[] = (
    Category?.data?.map((cat: any) => ({
      value: cat.id,
      label: cat.name,
      icon: getCategoryIcon(cat.name),
    })) ?? []
  );

  const totalHelpPages = HELP_PAGES.length;
  const currentHelpPage = HELP_PAGES[helpPage];
  const isLastHelpPage = helpPage === totalHelpPages - 1;

  return (
    <>
      <section
        className="min-h-screen flex items-center justify-center bg-gray-950 py-10 px-2 sm:px-4 reveal"
        style={{ backgroundImage: "radial-gradient(ellipse at 60% 0%, rgba(59,130,246,0.07) 0%, transparent 60%)" }}
      >
        <div className="w-full max-w-2xl mx-auto">
          <div className="bg-gray-900 rounded-2xl border border-gray-800 overflow-hidden">
            {/* Draft Restoration Banner */}
            {hasExistingDraftOnMount && !dismissedDraft && (
              <div className="bg-blue-500/10 border-b border-blue-500/20 p-4 flex flex-col sm:flex-row items-center justify-between gap-4">
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
                    onClick={handleRestoreDraft}
                    className="flex-1 sm:flex-none px-4 py-2 bg-blue-500 hover:bg-blue-400 text-white text-[10px] font-black uppercase tracking-wider rounded-xl transition-all active:scale-95 shadow-md"
                  >
                    Restore
                  </button>
                  <button
                    onClick={handleDismissDraft}
                    className="flex-1 sm:flex-none px-4 py-2 bg-white/5 hover:bg-white/10 text-gray-400 hover:text-white text-[10px] font-bold uppercase tracking-wider rounded-xl transition-all active:scale-95"
                  >
                    Dismiss
                  </button>
                </div>
              </div>
            )}

            {/* Offline Sync Banner */}
            {pendingReports.length > 0 && (
              <div className="bg-blue-600/20 border-b border-blue-500/30 p-4 flex flex-col sm:flex-row items-center justify-between gap-4">
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

            <div className="p-4 sm:p-10">

              {/* Header */}
              <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-4 mb-6">
                <div>
                  <h1 className="text-xl sm:text-2xl font-bold text-white tracking-tight">Report a Lost Item</h1>
                  <p className="text-gray-500 text-sm mt-1">Help us find lost items by adding details below.</p>
                </div>
              </div>

              <StepIndicator current={step} />

              <form onSubmit={(e) => e.preventDefault()}>

                {/* ── Step 0: Reporter Info ── */}
                {step === 0 && (
                  <div className="space-y-5">
                    {scannedStudent && (
                      <div className="flex items-center justify-between p-4 rounded-xl bg-blue-500/5 border border-blue-500/20 animate-fadeIn">
                        <div className="flex items-center gap-3">
                          <div className="w-10 h-10 rounded-full bg-blue-500/10 flex items-center justify-center text-blue-400">
                            <FaUserCheck size={18} />
                          </div>
                          <div>
                            <p className="text-sm font-bold text-white uppercase">{scannedStudent.name}</p>
                            <p className="text-[10px] font-bold text-blue-500/60 uppercase tracking-widest">Student ID: {scannedStudent.id}</p>
                          </div>
                        </div>
                        <button onClick={clearScan} className="p-2 text-gray-500 hover:text-red-400 transition-colors">
                          <FaTimes size={14} />
                        </button>
                      </div>
                    )}

                    {/* Fetch + Scan button row */}
                    <div className="flex justify-end items-center gap-2">
                      <button
                        type="button"
                        onClick={openHelp}
                        className="w-4 h-4 rounded-full bg-gray-700 hover:bg-gray-600 border border-gray-600 text-gray-400 hover:text-white flex items-center justify-center transition-all"
                        title="How to use"
                      >
                        <span className="text-[9px] font-black leading-none">i</span>
                      </button>
                      <button
                        type="button"
                        onClick={handleFetchDetails}
                        disabled={isFetchingByDetails}
                        className="px-2 py-1 rounded-lg bg-blue-500/10 hover:bg-blue-500/20 border border-blue-500/20 text-[9px] font-black text-blue-400 hover:text-blue-300 flex items-center gap-1.5 transition-all uppercase tracking-wider active:scale-95 disabled:opacity-50 whitespace-nowrap"
                      >
                        {isFetchingByDetails ? <FaSpinner className="animate-spin" size={8} /> : <FaSearch size={8} />}
                        Fetch Student Info
                      </button>
                      <button
                        type="button"
                        onClick={() => setShowScanner(true)}
                        className="inline-flex items-center justify-center gap-1.5 px-2.5 py-1 bg-blue-600/15 hover:bg-blue-600/25 border border-blue-500/25 text-blue-400 text-[9px] font-black rounded-lg transition-all uppercase tracking-wider whitespace-nowrap active:scale-95"
                      >
                        <FaQrcode className="w-2.5 h-2.5" /> Scan Student ID
                      </button>
                    </div>

                    {/* ── Help Modal ── */}
                    {showHelpModal && (
                      <div className="fixed inset-0 bg-black/70 backdrop-blur-sm flex items-center justify-center z-50 p-4">
                        <div className="bg-gray-900 border border-gray-700 rounded-2xl w-full max-w-sm shadow-2xl flex flex-col">
                          <div className="flex items-center justify-between px-5 py-4 border-b border-gray-800 shrink-0">
                            <h3 className="text-sm font-bold text-white">How to Use</h3>
                            <button onClick={closeHelp} className="w-7 h-7 flex items-center justify-center rounded-lg bg-white/5 hover:bg-white/10 text-gray-400 hover:text-white transition-colors">
                              <FaTimes size={12} />
                            </button>
                          </div>
                          <div className="flex items-center justify-center gap-1.5 pt-4 px-5 shrink-0">
                            {HELP_PAGES.map((_, i) => (
                              <button key={i} onClick={() => setHelpPage(i)}
                                className={`h-1.5 rounded-full transition-all duration-300 ${i === helpPage ? "bg-blue-400 w-5" : "bg-gray-700 w-1.5 hover:bg-gray-500"}`} />
                            ))}
                          </div>
                          <div className="px-5 py-5 flex-1 flex flex-col justify-between min-h-[260px]">
                            <div className="space-y-4">
                              <p className="text-[10px] font-black text-blue-400 uppercase tracking-widest flex items-center gap-1.5">
                                {currentHelpPage.tag}
                              </p>
                              <div className="space-y-3">
                                {currentHelpPage.steps.map(({ n, title, desc }) => (
                                  <div key={n} className="flex gap-3">
                                    <div className="shrink-0 w-6 h-6 rounded-full border bg-blue-500/10 border-blue-500/20 text-blue-400 flex items-center justify-center text-[10px] font-black">{n}</div>
                                    <div>
                                      <p className="text-white text-xs font-semibold">{title}</p>
                                      <p className="text-gray-500 text-[11px] mt-0.5 leading-relaxed">{desc}</p>
                                    </div>
                                  </div>
                                ))}
                              </div>
                              {currentHelpPage.tip && <div className="mt-3">{currentHelpPage.tip}</div>}
                            </div>
                          </div>
                          <div className="px-5 pb-5 pt-2 border-t border-gray-800 shrink-0 flex items-center justify-between gap-2">
                            <button onClick={() => setHelpPage((p) => Math.max(0, p - 1))} disabled={helpPage === 0}
                              className="px-3 py-2 text-[10px] font-black uppercase tracking-wider text-gray-500 hover:text-gray-300 disabled:opacity-30 disabled:cursor-not-allowed transition-colors">
                              Back
                            </button>
                            <div className="flex items-center gap-2">
                              {!isLastHelpPage && (
                                <button onClick={closeHelp} className="px-3 py-2 text-[10px] font-black uppercase tracking-wider text-gray-500 hover:text-gray-300 transition-colors">Skip</button>
                              )}
                              {isLastHelpPage ? (
                                <button onClick={closeHelp} className="px-3 py-2 text-[10px] font-black uppercase tracking-wider text-gray-500 hover:text-gray-300 transition-colors">Got it</button>
                              ) : (
                                <button onClick={() => setHelpPage((p) => p + 1)} className="px-3 py-2 text-[10px] font-black uppercase tracking-wider text-gray-500 hover:text-gray-300 transition-colors">Next</button>
                              )}
                            </div>
                          </div>
                        </div>
                      </div>
                    )}

                    <div className="grid gap-4 sm:gap-5 sm:grid-cols-2">
                      <div className="space-y-1.5">
                        <label className="text-[10px] font-bold text-gray-500 uppercase tracking-[0.2em] block">Your Name *</label>
                        <div className={`relative flex items-center ${inputCls} ring-0 focus-within:ring-2 focus-within:ring-blue-500/50`}>
                          <span className="text-gray-500 mr-2"><IconUser size={16} /></span>
                          <input {...register("reporterName", { required: "Your name is required" })}
                            type="text" autoComplete="off"
                            className="bg-transparent border-none p-0 w-full focus:ring-0 text-sm" placeholder=" " />
                        </div>
                        {errors.reporterName && <p className="text-red-400 text-xs mt-1">{errors.reporterName.message as string}</p>}
                      </div>
                      <div className="space-y-1.5">
                        <label className="text-[10px] font-bold text-gray-500 uppercase tracking-[0.2em] block">Institutional Email *</label>
                        <div className={`relative flex items-center ${inputCls} ring-0 focus-within:ring-2 focus-within:ring-blue-500/50`}>
                          <span className="text-gray-500 mr-2"><IconMail size={16} /></span>
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
                                type="email"
                                autoComplete="off"
                                className="bg-transparent border-none p-0 w-full focus:ring-0 text-sm"
                                placeholder=" "
                                onChange={(e) => {
                                  const value = e.target.value;
                                  const trimmedValue = value.trim();

                                  // Only auto-fill if current value is exactly 8 digits and previous value wasn't an email
                                  if (/^\d{8}$/.test(trimmedValue) && !prevEmailValue.includes('@')) {
                                    setPrevEmailValue(`${trimmedValue}@nbsc.edu.ph`);
                                    field.onChange(`${trimmedValue}@nbsc.edu.ph`);
                                  } else {
                                    setPrevEmailValue(value);
                                    field.onChange(value);
                                  }
                                }}
                              />
                            )}
                          />
                        </div>
                        {errors.schoolEmail && <p className="text-red-400 text-[10px] mt-1">{errors.schoolEmail.message as string}</p>}
                      </div>
                    </div>

                    <div className="space-y-1.5">
                      <label className="block text-[10px] font-bold text-gray-500 uppercase tracking-[0.2em]">Department</label>
                      <div className={`relative flex items-center ${inputCls} bg-gray-800/40 opacity-80 ring-0`}>
                        <span className="text-gray-500 mr-2"><IconBuilding size={16} /></span>
                        <input {...register("department")} type="text" readOnly
                          className="bg-transparent border-none p-0 w-full focus:ring-0 text-sm italic"
                          placeholder="Auto-filled from masterlist..." />
                      </div>
                    </div>
                  </div>
                )}

                {/* ── Step 1: Item Details ── */}
                {step === 1 && (
                  <div className="space-y-5">
                    {/* Magic AI Scan Card */}
                    {/* Unified AI Assist Card */}
                    <div className="w-full bg-[#1e1e24]/40 border border-white/5 rounded-2xl p-4 sm:p-5 mb-4 animate-fadeIn transition-all duration-300 shadow-md backdrop-blur-sm">
                      <div className="grid grid-cols-2 gap-3 sm:gap-4 w-full">
                        {/* Photo scan card */}
                        <div className="bg-white/5 border border-white/5 rounded-xl p-3.5 sm:p-4 flex flex-col justify-between min-h-[160px] sm:min-h-[180px] hover:bg-white/[0.07] transition-all duration-300 h-full">
                          <div>
                            <div className="flex items-center gap-1.5 flex-wrap">
                              <h4 className="font-bold text-xs sm:text-sm text-gray-200 select-none">Photo scan</h4>
                              <span className="bg-blue-500/20 text-blue-300 text-[8px] sm:text-[9px] font-bold px-1.5 py-0.5 rounded-full uppercase tracking-wider select-none">AI</span>
                              <span className="text-gray-500 hover:text-gray-300 cursor-pointer select-none text-[10px]" title="Snap or upload a photo to auto-fill details">
                                <FaInfoCircle size={10} className="opacity-60" />
                              </span>
                            </div>
                            {isAiRecognizing ? (
                              <p className="text-[10px] sm:text-xs text-blue-400 font-semibold mt-1.5 animate-pulse">Analyzing details...</p>
                            ) : (
                              <p className="text-[10px] sm:text-xs text-gray-400 mt-1.5 select-none leading-normal">Snap a photo to auto-fill details.</p>
                            )}
                          </div>
                          
                          <label className={`w-full mt-3 flex items-center justify-center gap-1.5 px-3 py-2 rounded-lg sm:rounded-xl text-[10px] sm:text-xs font-semibold transition-all active:scale-95 whitespace-nowrap cursor-pointer ${
                            isAiRecognizing 
                              ? "bg-blue-600/30 text-blue-300 border border-blue-500/20" 
                              : "border border-white/10 hover:border-white/20 bg-white/5 hover:bg-white/10 text-white"
                          }`}>
                            {isAiRecognizing ? (
                              <><FaSpinner className="animate-spin" size={10} /> Analyzing</>
                            ) : (
                              <><FaCamera size={10} className="text-blue-400" /> Scan photo</>
                            )}
                            <input type="file" accept="image/*" className="hidden" onChange={(e) => handleAiScan(e.target.files)} disabled={isAiRecognizing} />
                          </label>
                        </div>

                        {/* Voice report card */}
                        <VoiceReportButton isLostPage={true} layout="card" onParsed={handleVoiceParsed} />
                      </div>
                    </div>

                    <div className="grid gap-4 sm:gap-5 sm:grid-cols-2">
                      <Field label="Item Name" required error={errors.lostItemName?.message as string} icon={<IconTag />}>
                        <input {...register("lostItemName", { required: "Item name is required" })}
                          type="text" className={inputCls} placeholder=" " />
                      </Field>
                      <Field label="Last Seen Location" required error={errors.location?.message as string} icon={<IconPin />}>
                        <Controller
                          name="location" control={control} rules={{ required: "Location is required" }}
                          render={({ field }) => (
                            <LocationAutocomplete value={field.value || ""} onChange={field.onChange} onBlur={field.onBlur} className={inputCls} placeholder="e.g. SWDC Building - Room 205" />
                          )}
                        />
                      </Field>
                      <Field label="Date Lost" icon={<IconCalendar />}>
                        <CustomDatePicker value={startDate} onChange={setStartDate} max={new Date().toISOString().split("T")[0]} placeholder="Select date lost" />
                      </Field>

                      {/* ── Category — CustomSelect replacing native <select> ── */}
                      <Field
                        label="Item Category"
                        required
                        error={categoryTouched && !selectedMenucategoryId ? "Category is required" : ""}
                        icon={<IconGrid />}
                        infoButton={
                          <button
                            type="button"
                            onClick={() => setShowCategoryHelp(true)}
                            className="w-4 h-4 rounded-full bg-gray-700 hover:bg-gray-600 border border-gray-600 text-gray-400 hover:text-white flex items-center justify-center transition-all ml-2"
                            title="About categories"
                          >
                            <span className="text-[9px] font-black leading-none">i</span>
                          </button>
                        }
                      >
                        {categoriesLoading ? (
                          <div className="w-full px-4 py-2.5 text-sm text-gray-500 bg-gray-800/60 border border-gray-700 rounded-lg">
                            Loading categories...
                          </div>
                        ) : categoriesError ? (
                          <div className="w-full px-4 py-2.5 text-sm text-red-400 bg-gray-800/60 border border-red-500/30 rounded-lg">
                            Failed to load categories
                          </div>
                        ) : (
                          <CustomSelect
                            options={categoryOptions}
                            value={selectedMenucategoryId}
                            onChange={(id) => {
                              const cat = Category?.data?.find((c: any) => c.id === id);
                              if (cat) handleMenuChange(cat.name, cat.id);
                            }}
                            placeholder="Select a category"
                            error={categoryTouched && !selectedMenucategoryId}
                          />
                        )}
                      </Field>
                    </div>

                    <Field label="Description" required error={errors.description?.message as string} icon={<IconText />}>
                      <textarea {...register("description", { required: "Description is required" })}
                        rows={4} className={`${inputCls} resize-none custom-scrollbar`}
                        placeholder=" " />
                    </Field>

                    {/* Color dropdown for specific categories */}
                    {selectedMenu && CATEGORY_CONFIG[selectedMenu.toLowerCase() as keyof typeof CATEGORY_CONFIG] && CATEGORY_CONFIG[selectedMenu.toLowerCase() as keyof typeof CATEGORY_CONFIG].colors.length > 0 && (
                      <Field label="Color" required error={errors.color?.message as string} icon={<IconTag />}>
                        <Controller
                          name="color"
                          control={control}
                          rules={{ required: "Color is required" }}
                          render={({ field }) => (
                            <CustomSelect
                              options={CATEGORY_CONFIG[selectedMenu.toLowerCase() as keyof typeof CATEGORY_CONFIG].colors.map(color => ({
                                value: color,
                                label: color,
                                icon: null
                              }))}
                              value={field.value || ""}
                              onChange={(colorValue) => {
                                field.onChange(colorValue);
                                setSelectedColor(colorValue);
                                setSelectedCondition(''); // Reset condition when color changes

                                // Update description with color information
                                const categoryKey = selectedMenu.toLowerCase();
                                const config = CATEGORY_CONFIG[categoryKey as keyof typeof CATEGORY_CONFIG];
                                if (config && colorValue) {
                                  const isOther = colorValue === 'Other';
                                  const c = colorValue.toLowerCase();
                                  let colorDescription = '';

                                  // Generate professional descriptions based on category and color
                                  switch (categoryKey) {
                                    case 'bags':
                                      colorDescription = isOther ? `I am reporting a lost bag. ` : `I am reporting a lost ${c} bag. `;
                                      break;
                                    case 'calculators':
                                      colorDescription = isOther ? `I am reporting a lost calculator. ` : `I am reporting a lost ${c} calculator. `;
                                      break;
                                    case 'keys':
                                      colorDescription = isOther ? `I am reporting lost keys. ` : `I am reporting lost ${c} keys. `;
                                      break;
                                    case 'umbrellas':
                                      colorDescription = isOther ? `I am reporting a lost umbrella. ` : `I am reporting a lost ${c} umbrella. `;
                                      break;
                                    case 'watches':
                                      colorDescription = isOther ? `I am reporting a lost watch. ` : `I am reporting a lost ${c} watch. `;
                                      break;
                                    default:
                                      colorDescription = isOther ? `I am reporting a lost ${config.itemName.toLowerCase()}. ` : `I am reporting a lost ${c} ${config.itemName.toLowerCase()}. `;
                                  }

                                  setValue("description", colorDescription);
                                }
                              }}
                            />
                          )}
                        />
                      </Field>
                    )}

                    {/* Condition dropdown */}
                    {selectedColor && CATEGORY_CONFIG[selectedMenu.toLowerCase() as keyof typeof CATEGORY_CONFIG]?.conditions?.length > 0 && (
                      <Field label="Condition" required error={errors.condition?.message as string} icon={<IconTag />}>
                        <Controller
                          name="condition"
                          control={control}
                          rules={{ required: "Condition is required" }}
                          render={({ field }) => (
                            <CustomSelect
                              options={CATEGORY_CONFIG[selectedMenu.toLowerCase() as keyof typeof CATEGORY_CONFIG].conditions.map(condition => ({
                                value: condition,
                                label: condition,
                                icon: null
                              }))}
                              value={field.value || ""}
                              onChange={(conditionValue) => {
                                field.onChange(conditionValue);
                                setSelectedCondition(conditionValue);

                                // Update description with condition information
                                const categoryKey = selectedMenu.toLowerCase();
                                const config = CATEGORY_CONFIG[categoryKey as keyof typeof CATEGORY_CONFIG];
                                if (config && selectedColor && conditionValue) {
                                  const isOther = selectedColor === 'Other';
                                  const isNone = conditionValue === 'None';
                                  let enhancedDescription = '';

                                  // Generate enhanced descriptions based on category, color, and condition
                                  switch (categoryKey) {
                                    case 'bags': {
                                      const base = isOther ? 'a lost bag' : `a lost ${selectedColor.toLowerCase()} bag`;
                                      if (isNone) enhancedDescription = `I am reporting ${base}. `;
                                      else if (conditionValue === 'Scratches') enhancedDescription = `I am reporting ${base} with scratches. `;
                                      else if (conditionValue === 'Stickers') enhancedDescription = `I am reporting ${base} with stickers. `;
                                      else if (conditionValue === 'Keychains') enhancedDescription = `I am reporting ${base} with keychains. `;
                                      else enhancedDescription = `I am reporting ${base} in ${conditionValue.toLowerCase()} condition. `;
                                      break;
                                    }
                                    case 'calculators': {
                                      const base = isOther ? 'a lost calculator' : `a lost ${selectedColor.toLowerCase()} calculator`;
                                      if (isNone) enhancedDescription = `I am reporting ${base}. `;
                                      else if (conditionValue === 'Scratches') enhancedDescription = `I am reporting ${base} with scratches. `;
                                      else if (conditionValue === 'Stickers') enhancedDescription = `I am reporting ${base} with stickers. `;
                                      else if (conditionValue === 'Engravings') enhancedDescription = `I am reporting ${base} with engravings. `;
                                      else enhancedDescription = `I am reporting ${base} in ${conditionValue.toLowerCase()} condition. `;
                                      break;
                                    }
                                    case 'keys': {
                                      const base = isOther ? 'lost keys' : `lost ${selectedColor.toLowerCase()} keys`;
                                      if (isNone) enhancedDescription = `I am reporting ${base}. `;
                                      else if (conditionValue === 'Scratches') enhancedDescription = `I am reporting ${base} with scratches. `;
                                      else if (conditionValue === 'Stickers') enhancedDescription = `I am reporting ${base} with stickers. `;
                                      else if (conditionValue === 'Keychains') enhancedDescription = `I am reporting ${base} with attached keychains. `;
                                      else enhancedDescription = `I am reporting ${base} in ${conditionValue.toLowerCase()} condition. `;
                                      break;
                                    }
                                    case 'umbrellas': {
                                      const base = isOther ? 'a lost umbrella' : `a lost ${selectedColor.toLowerCase()} umbrella`;
                                      if (isNone) enhancedDescription = `I am reporting ${base}. `;
                                      else if (conditionValue === 'Scratches') enhancedDescription = `I am reporting ${base} with scratches. `;
                                      else if (conditionValue === 'Stickers') enhancedDescription = `I am reporting ${base} with stickers. `;
                                      else if (conditionValue === 'Bent Frame') enhancedDescription = `I am reporting ${base} with a bent frame. `;
                                      else enhancedDescription = `I am reporting ${base} in ${conditionValue.toLowerCase()} condition. `;
                                      break;
                                    }
                                    case 'watches': {
                                      const base = isOther ? 'a lost watch' : `a lost ${selectedColor.toLowerCase()} watch`;
                                      if (isNone) enhancedDescription = `I am reporting ${base}. `;
                                      else if (conditionValue === 'Scratches') enhancedDescription = `I am reporting ${base} with scratches. `;
                                      else if (conditionValue === 'Stickers') enhancedDescription = `I am reporting ${base} with stickers. `;
                                      else if (conditionValue === 'Engravings') enhancedDescription = `I am reporting ${base} with engravings. `;
                                      else enhancedDescription = `I am reporting ${base} in ${conditionValue.toLowerCase()} condition. `;
                                      break;
                                    }
                                    default: {
                                      const colorPart = isOther ? '' : `${selectedColor.toLowerCase()} `;
                                      const conditionPart = isNone ? '' : ` with ${conditionValue.toLowerCase()}`;
                                      enhancedDescription = `I am reporting a lost ${colorPart}${config.itemName.toLowerCase()}${conditionPart}. Please add details like the brand, size, and any special features.`;
                                    }
                                  }

                                  setValue("description", enhancedDescription);
                                }
                              }}
                            />
                          )}
                        />
                      </Field>
                    )}

                    {selectedMenucategoryId && (
                      <ItemMatchSuggestions
                        categoryId={selectedMenucategoryId} categoryName={selectedMenu}
                        itemName={(document.querySelector('input[name="lostItemName"]') as HTMLInputElement)?.value ?? ""}
                        location={(document.querySelector('input[name="location"]') as HTMLInputElement)?.value ?? ""}
                      />
                    )}
                  </div>
                )}

                {/* ── Step 2: Photo & Submit ── */}
                {step === 2 && (
                  <div className="space-y-5">
                    <Field label="Item Photo" required error={uploadError} icon={<IconImage />}>
                      {!preview ? (
                        <div
                          className={`border-2 border-dashed rounded-xl p-10 text-center cursor-pointer transition-all duration-200 ${uploadError ? "border-red-500/60 bg-red-900/5"
                            : isDragging ? "border-blue-500 bg-blue-900/10"
                              : "border-gray-700 bg-gray-800/40 hover:border-blue-500/70 hover:bg-gray-800/70"
                            }`}
                          onClick={() => fileInputRef.current?.click()}
                          onDragOver={(e) => { e.preventDefault(); setIsDragging(true); }}
                          onDragLeave={() => setIsDragging(false)}
                          onDrop={(e) => { e.preventDefault(); setIsDragging(false); handleFileChange(e.dataTransfer.files); }}
                        >
                          <input ref={fileInputRef} type="file" accept="image/*" className="hidden" onChange={(e) => handleFileChange(e.target.files)} />
                          <div className="flex flex-col items-center gap-3">
                            <div className={`w-14 h-14 rounded-2xl border flex items-center justify-center ${uploadError ? "bg-red-900/20 border-red-500/30 text-red-400" : "bg-gray-800 border-gray-700 text-gray-400"}`}>
                              <svg width="26" height="26" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="1.5">
                                <path strokeLinecap="round" strokeLinejoin="round" d="M3 16.5v2.25A2.25 2.25 0 005.25 21h13.5A2.25 2.25 0 0021 18.75V16.5m-13.5-9L12 3m0 0l4.5 4.5M12 3v13.5" />
                              </svg>
                            </div>
                            <div>
                              <p className="text-sm text-gray-300"><span className="text-blue-400 font-semibold">Click to upload</span> or drag & drop</p>
                              <p className="text-xs text-gray-600 mt-1">JPG, PNG, WEBP · Max {MAX_SIZE_MB}MB</p>
                            </div>
                          </div>
                        </div>
                      ) : (
                        <div className="rounded-xl overflow-hidden border border-gray-700 bg-gray-800">
                          <div className="relative group">
                            <img src={preview} alt="Preview" className="w-full max-h-56 object-cover" />
                            <div className="absolute inset-0 bg-black/0 group-hover:bg-black/55 transition-all duration-200 flex items-center justify-center gap-3 opacity-0 group-hover:opacity-100">
                              <button type="button" onClick={() => fileInputRef.current?.click()} className="bg-white/90 hover:bg-white text-gray-900 text-xs font-semibold px-4 py-2 rounded-lg transition-all">Change</button>
                              <button type="button" onClick={removeFile} className="bg-red-600 hover:bg-red-500 text-white text-xs font-semibold px-4 py-2 rounded-lg transition-all">Remove</button>
                            </div>
                          </div>
                          <div className="px-4 py-2.5 border-t border-gray-700 flex items-center justify-between">
                            <div className="flex items-center gap-2 min-w-0">
                              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#60a5fa" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                <rect width="18" height="18" x="3" y="3" rx="2" /><circle cx="9" cy="9" r="2" /><path d="m21 15-3.086-3.086a2 2 0 0 0-2.828 0L6 21" />
                              </svg>
                              <span className="text-xs text-gray-400 truncate">{selectedFile?.name}</span>
                            </div>
                            <span className="text-xs text-gray-500 ml-3 shrink-0">
                              {selectedFile ? (selectedFile.size < 1024 * 1024 ? (selectedFile.size / 1024).toFixed(1) + " KB" : (selectedFile.size / 1024 / 1024).toFixed(1) + " MB") : ""}
                            </span>
                          </div>
                          <input ref={fileInputRef} type="file" accept="image/*" className="hidden" onChange={(e) => handleFileChange(e.target.files)} />
                        </div>
                      )}
                    </Field>

                    <div className="rounded-xl bg-gray-800/50 border border-gray-700/60 p-4 space-y-2">
                      <p className="text-xs font-semibold text-gray-400 uppercase tracking-widest mb-3">Submission Summary</p>
                      {[
                        { label: "Item", value: (document.querySelector('input[name="lostItemName"]') as HTMLInputElement)?.value },
                        { label: "Location", value: (document.querySelector('input[name="location"]') as HTMLInputElement)?.value },
                        { label: "Category", value: selectedMenu },
                        { label: "Date", value: startDate ? new Date(startDate + "T00:00:00").toLocaleDateString("en-US", { year: "numeric", month: "long", day: "numeric" }) : "" },
                      ].map(({ label, value }) => value ? (
                        <div key={label} className="flex items-center justify-between text-sm">
                          <span className="text-gray-500">{label}</span>
                          <span className="text-gray-200 font-medium text-right max-w-[60%] truncate">{value}</span>
                        </div>
                      ) : null)}
                    </div>
                  </div>
                )}

                {/* Navigation */}
                <div className={`flex mt-8 gap-2 sm:gap-3 items-center ${step > 0 ? "justify-between" : "justify-end"}`}>
                  {step > 0 && (
                    <button type="button" onClick={() => setStep((s) => s - 1)}
                      className="px-3 sm:px-6 py-2 sm:py-2.5 rounded-lg border border-gray-700 text-gray-300 hover:bg-gray-800 hover:text-white text-xs sm:text-sm font-medium transition-all duration-200 whitespace-nowrap">
                      Back
                    </button>
                  )}
                  <div className="flex items-center gap-2 sm:gap-3">
                    {step === 1 && hasItemDetailsInput && (
                      <button type="button" onClick={handleClearDetails}
                        className="px-3 sm:px-6 py-2 sm:py-2.5 rounded-lg border border-gray-700 text-gray-300 hover:bg-gray-800 hover:text-white text-xs sm:text-sm font-medium transition-all duration-200 whitespace-nowrap">
                        Clear Details
                      </button>
                    )}
                    {step < 2 ? (
                      <button type="button" onClick={nextStep}
                        disabled={
                          step === 0
                            ? Boolean(!reporterName || !schoolEmail || !!errors.reporterName || !!errors.schoolEmail)
                            : Boolean(!lostItemName || !location || !description || !selectedMenucategoryId || !!errors.lostItemName || !!errors.location || !!errors.description ||
                              (selectedMenu && CATEGORY_CONFIG[selectedMenu.toLowerCase() as keyof typeof CATEGORY_CONFIG]?.colors?.length > 0 && (!color || !!errors.color)) ||
                              (selectedColor && CATEGORY_CONFIG[selectedMenu.toLowerCase() as keyof typeof CATEGORY_CONFIG]?.conditions?.length > 0 && (!condition || !!errors.condition)))
                        }
                        className="px-4 sm:px-8 py-2 sm:py-2.5 rounded-lg bg-blue-600 hover:bg-blue-500 disabled:opacity-50 disabled:cursor-not-allowed text-white text-xs sm:text-sm font-semibold transition-all duration-200 shadow-lg whitespace-nowrap">
                        Continue
                      </button>
                    ) : isLoading ? (
                      <div className="flex items-center gap-2 px-4 sm:px-6 py-2 sm:py-2.5 rounded-lg bg-blue-600/50 text-white text-xs sm:text-sm font-semibold whitespace-nowrap">
                        <Spinner size="sm" /> Submitting...
                      </div>
                    ) : (
                      <button type="button" onClick={onSubmit}
                        disabled={!selectedFile}
                        className="px-4 sm:px-8 py-2 sm:py-2.5 rounded-lg bg-blue-600 hover:bg-blue-500 disabled:opacity-50 disabled:cursor-not-allowed text-white text-xs sm:text-sm font-semibold transition-all duration-200 shadow-lg whitespace-nowrap">
                        Submit Report
                      </button>
                    )}
                  </div>
                </div>

              </form>
            </div>
          </div>

          <p className="text-center text-xs text-gray-600 mt-4">
            All reports are reviewed by the NBSC Lost & Found office.
          </p>
        </div>
      </section>
      {showScanner && (
        <BarcodeScannerModal onScan={handleScan} onClose={() => setShowScanner(false)} useFetchStudent={useFetchStudent} />
      )}

      {/* Category Help Modal */}
      {showCategoryHelp && (
        <div className="fixed inset-0 bg-black/70 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-gray-900 border border-gray-700 rounded-2xl w-full max-w-sm shadow-2xl flex flex-col">
            <div className="flex items-center justify-between px-5 py-4 border-b border-gray-800 shrink-0">
              <h3 className="text-sm font-bold text-white">About Categories</h3>
              <button onClick={() => setShowCategoryHelp(false)} className="w-7 h-7 flex items-center justify-center rounded-lg bg-white/5 hover:bg-white/10 text-gray-400 hover:text-white transition-colors">
                <FaTimes size={12} />
              </button>
            </div>
            <div className="px-5 py-5 flex-1 flex flex-col justify-between min-h-[260px]">
              <div className="space-y-4">
                <p className="text-[10px] font-black text-blue-400 uppercase tracking-widest flex items-center gap-1.5">
                  {CATEGORY_HELP_CONTENT.tag}
                </p>
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

      {trackingCode && (
        <div className="fixed inset-0 bg-black/80 backdrop-blur-md flex items-center justify-center z-[100] p-4">
          <div className="bg-gray-900 border border-white/8 rounded-[20px] w-full max-w-[360px] overflow-hidden shadow-2xl">

            {/* Top accent bar */}
            <div className="h-[3px] bg-gradient-to-r from-blue-500 via-cyan-400 to-violet-500" />

            <div className="p-6 flex flex-col items-center gap-4">

              {/* Check icon */}
              <div className="w-11 h-11 rounded-full bg-blue-500/10 border border-blue-500/25 flex items-center justify-center shrink-0">
                <FaCheck size={18} className="text-blue-400" />
              </div>

              {/* Title + description */}
              <div className="text-center">
                <h2 className="text-white text-[17px] font-bold tracking-tight mb-1.5">Report Submitted!</h2>
                <p className="text-gray-500 text-[12px] leading-relaxed">
                  Your report has been received. Save this tracking code to monitor your item on the{" "}
                  <span className="text-blue-400 font-medium">Track Status</span> page.
                </p>
              </div>

              {/* Tracking code box */}
              <div className="w-full bg-gray-950 border border-white/6 rounded-xl p-3 flex items-center gap-3">
                <div className="flex-1 min-w-0">
                  <p className="text-[9px] font-bold text-gray-600 uppercase tracking-[0.15em] mb-1">Tracking Code</p>
                  <p className="font-mono text-[13px] text-gray-200 truncate">{trackingCode}</p>
                </div>
                <button
                  onClick={() => {
                    navigator.clipboard.writeText(trackingCode);
                    toast.success("Copied to clipboard!");
                  }}
                  className="shrink-0 p-2 bg-blue-500/10 hover:bg-blue-500/20 border border-blue-500/20 rounded-lg transition-all active:scale-95"
                  title="Copy"
                >
                  <FaCopy size={13} className="text-blue-400" />
                </button>
              </div>

              {/* Close button */}
              <button
                onClick={handleCloseTrackingModal}
                className="w-full py-[11px] bg-blue-600 hover:bg-blue-500 active:scale-[0.98] text-white text-[12px] font-bold uppercase tracking-widest rounded-[10px] transition-all"
              >
                Got It, Close
              </button>
            </div>

          </div>
        </div>
      )}
      {/* AI Help Modal */}
      {showAiHelp && (
        <div className="fixed inset-0 z-[110] grid place-items-center p-4 overflow-y-auto">
          <div className="fixed inset-0 bg-black/80 backdrop-blur-sm" onClick={() => setShowAiHelp(false)} />
          <div className="relative bg-gray-900 border border-white/10 rounded-2xl w-full max-w-sm shadow-2xl flex flex-col overflow-hidden">
            <div className="h-[2px] bg-gradient-to-r from-indigo-500 via-purple-500 to-pink-500" />
            <div className="flex items-center justify-between px-5 py-4 border-b border-gray-800 shrink-0">
              <div className="flex items-center gap-2">

                <h3 className="text-sm font-bold text-white tracking-tight uppercase"> AI Scan</h3>
              </div>
              <button onClick={() => setShowAiHelp(false)} className="w-7 h-7 flex items-center justify-center rounded-lg bg-white/5 hover:bg-white/10 text-gray-400 hover:text-white transition-colors">
                <FaTimes size={12} />
              </button>
            </div>
            <div className="px-6 py-6 space-y-5">
              {[
                { n: "1", title: "Take or Upload Photo", desc: "Snap a clear picture of the item. For best results, use good lighting and keep the item centered." },
                { n: "2", title: "AI Identification", desc: "Our AI analyzes the image to detect the item name, category, color, and specific markings." },
                { n: "3", title: "Review & Edit", desc: "The form will auto-fill instantly. You can still manually refine any details before submitting." },
              ].map(({ n, title, desc }) => (
                <div key={n} className="flex gap-4">
                  <div className="shrink-0 w-6 h-6 rounded-full border bg-indigo-500/10 border-indigo-500/20 text-indigo-400 flex items-center justify-center text-[10px] font-black">{n}</div>
                  <div>
                    <p className="text-white text-xs font-semibold tracking-tight">{title}</p>
                    <p className="text-gray-500 text-[11px] mt-1 leading-relaxed text-justify">{desc}</p>
                  </div>
                </div>
              ))}

            </div>
            <div className="px-5 py-4 border-t border-gray-800 shrink-0 flex items-center justify-center">
              <button onClick={() => setShowAiHelp(false)} className="w-full py-2.5 bg-indigo-600 hover:bg-indigo-500 text-white text-[10px] font-bold uppercase tracking-widest rounded-lg transition-all shadow-lg shadow-indigo-900/20 active:scale-95">Got it</button>
            </div>
          </div>
        </div>
      )}
    </>
  );
};

export default ReportLostItem;
