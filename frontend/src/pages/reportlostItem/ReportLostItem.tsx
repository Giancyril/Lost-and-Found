import { useForm, Controller } from "react-hook-form";
import { Spinner } from "flowbite-react";
import { toast, ToastContainer } from "react-toastify";
import { useState, useRef, useEffect } from "react";
import {
  useCategoryQuery,
  useCreateLostItemMutation,
  useGetStudentByIdQuery,
  useLazyGetStudentByDetailsQuery,
} from "../../redux/api/api";
import { CustomDatePicker } from "../../components/ui/CustomDatePicker";
import ItemMatchSuggestions from "../../components/itemMatch/ItemMatchSuggestions";
import LocationAutocomplete from "../../components/ui/LocationAutocomplete";
import {
  FaQrcode, FaUserCheck, FaTimes, FaSearch, FaSpinner,
  FaWallet, FaMobileAlt, FaLaptop, FaKey, FaBriefcase,
  FaHeadphones, FaGlasses, FaBook, FaIdCard, FaUmbrella,
  FaTshirt, FaCamera, FaClock, FaTint, FaTag,
  FaCheck, FaChevronDown, FaMoneyBillWave,
} from "react-icons/fa";
import type { ScannedStudent } from "../../components/scanner/BarcodeScannerModal";
import BarcodeScannerModal from "../../components/scanner/BarcodeScannerModal";
import imageCompression from "browser-image-compression";
import { logToSheet } from "../../utils/sheetsLogger";

const MAX_SIZE_MB = 5;

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
    description: 'Please select a color to auto-generate a detailed description. ',
    colors: ['Black', 'Gray', 'Blue', 'Silver', 'White', 'Other'],
    conditions: ['Scratches', 'Stickers', 'Engravings', 'None']
  },
  keys: {
    itemName: 'Keys',
    description: 'Please select a color to auto-generate a detailed description.',
    colors: ['Silver', 'Gold', 'Bronze', 'Black', 'Blue', 'Red', 'Other'],
    conditions: ['Scratches', 'Stickers', 'Keychains', 'None']
  },
  umbrellas: {
    itemName: 'Umbrella',
    description: 'Please select a color to auto-generate a detailed description.',
    colors: ['Black', 'Blue', 'Red', 'Yellow', 'Green', 'Pink', 'Purple', 'Clear', 'Patterned', 'Other'],
    conditions: ['Scratches', 'Stickers', 'Bent Frame', 'None']
  },
  watches: {
    itemName: 'Watch',
    description: 'Please select a color to auto-generate a detailed description. ',
    colors: ['Black', 'Brown', 'Silver', 'Gold', 'Blue', 'White', 'Rose Gold', 'Other'],
    conditions: ['Scratches', 'Stickers', 'Engravings', 'None']
  }
};

// ── Category icon resolver ────────────────────────────────────────────────────
const getCategoryIcon = (name: string) => {
  const n = name?.toLowerCase() ?? "";
  if (n.includes("wallet") || n.includes("purse") || n.includes("pouch"))   return <FaWallet    size={10} className="text-amber-400" />;
  if (n.includes("phone") || n.includes("mobile") || n.includes("celphone")) return <FaMobileAlt size={10} className="text-cyan-400" />;
  if (n.includes("laptop") || n.includes("computer") || n.includes("electronic") || n.includes("device") || n.includes("gadget")) return <FaLaptop size={10} className="text-indigo-400" />;
  if (n.includes("key"))                                                     return <FaKey        size={10} className="text-orange-400" />;
  if (n.includes("bag") || n.includes("backpack") || n.includes("luggage"))  return <FaBriefcase  size={10} className="text-amber-400" />;
  if (n.includes("headphone") || n.includes("earphone") || n.includes("audio") || n.includes("airpod")) return <FaHeadphones size={10} className="text-green-400" />;
  if (n.includes("glass") || n.includes("spectacle") || n.includes("eyewear") || n.includes("sunglass")) return <FaGlasses size={10} className="text-teal-400" />;
  if (n.includes("book") || n.includes("stationery") || n.includes("notebook")) return <FaBook size={10} className="text-yellow-400" />;
  if (n.includes("id") || n.includes("card") || n.includes("document"))     return <FaIdCard     size={10} className="text-blue-400" />;
  if (n.includes("umbrella"))                                                return <FaUmbrella   size={10} className="text-blue-400" />;
  if (n.includes("cloth") || n.includes("shirt") || n.includes("uniform") || n.includes("wear")) return <FaTshirt size={10} className="text-purple-400" />;
  if (n.includes("camera") || n.includes("photo"))                          return <FaCamera     size={10} className="text-violet-400" />;
  if (n.includes("watch") || n.includes("clock"))                           return <FaClock      size={10} className="text-gray-300" />;
  if (n.includes("water") || n.includes("bottle") || n.includes("tumbler") || n.includes("flask")) return <FaTint size={10} className="text-cyan-400" />;
  if (n.includes("money") || n.includes("cash") || n.includes("bill") || n.includes("currency")) return <FaMoneyBillWave size={10} className="text-green-400" />;
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
          <div className={`w-8 h-8 shrink-0 rounded-full flex items-center justify-center text-xs font-bold border-2 transition-all duration-300 ${
            i < current ? "bg-blue-600 border-blue-600 text-white"
            : i === current ? "bg-blue-600/20 border-blue-500 text-blue-400"
            : "bg-gray-800 border-gray-700 text-gray-600"}`}>
            {i < current ? (
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round">
                <polyline points="20 6 9 17 4 12" />
              </svg>
            ) : (i + 1)}
          </div>
          <div className="h-7 flex items-start justify-center w-[54px] sm:w-auto">
            <span className={`text-[8px] sm:text-[10px] font-medium text-center leading-tight sm:whitespace-nowrap ${
              i === current ? "text-blue-400" : i < current ? "text-gray-400" : "text-gray-600"}`}>
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
      { n: "1", title: "Enter a Name or Email", desc: "Type the student's full name or institutional email in the fields above." },
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
  const { register, formState: { errors }, reset, trigger, getValues, control, setValue, watch } = useForm({ mode: "onChange" });

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
  const [selectedColor, setSelectedColor] = useState("");
  const [, setSelectedCondition] = useState("");

  const closeHelp = () => { setShowHelpModal(false); setHelpPage(0); };
  const openHelp  = () => { setHelpPage(0); setShowHelpModal(true); };

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
    }
  };

  const [createLostItem, { isLoading }] = useCreateLostItemMutation();
  const { data: Category, isLoading: categoriesLoading, error: categoriesError } = useCategoryQuery(undefined);
  const [startDate, setStartDate] = useState(new Date().toISOString().split("T")[0]);

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

  const [getStudentByDetails, { isFetching: isFetchingByDetails }] = useLazyGetStudentByDetailsQuery();

  const handleFetchDetails = async () => {
    const name = getValues("reporterName");
    const email = getValues("schoolEmail");
    if (!name && !email) { toast.info("Please enter a name or email to fetch details"); return; }
    if (name && /^\d{8}$|^\d{4}-\d{2}-\d{2}$/.test(name.trim())) { toast.warn("Please enter a valid name"); return; }
    try {
      const res = await getStudentByDetails({ name, email }).unwrap();
      const student = res.data ?? res;
      if (student) {
        setValue("reporterName", student.name);
        setValue("schoolEmail", student.email);
        setValue("department", student.department || "");
        setScannedStudent({ id: student.id, name: student.name, email: student.email, department: student.department || "", raw: "manual_fetch" });
        toast.success(`Found: ${student.name}`);
      }
    } catch {
      toast.error("Student not found in masterlist");
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
      : ["lostItemName", "description", "location", ...(selectedMenu && CATEGORY_CONFIG[selectedMenu.toLowerCase() as keyof typeof CATEGORY_CONFIG] ? ["color"] : []), ...(selectedColor ? ["condition"] : [])];
    const valid = await trigger(fields as any);
    if (step === 1) { setCategoryTouched(true); if (!selectedMenucategoryId || !valid) return; }
    if (valid) setStep((s) => s + 1);
  };

  const onSubmit = async () => {
    if (!selectedFile) { setUploadError("Please upload a photo of the item."); return; }
    const data = getValues();
    try {
      const res: any = await createLostItem({
        lostItemName: data.lostItemName, description: data.description,
        categoryId: selectedMenucategoryId, img: preview || "",
        location: data.location, date: new Date(startDate + "T00:00:00"),
        reporterName: data.reporterName || "", schoolEmail: data.schoolEmail || "",
      });
      if (res.error || res?.data?.success === false) { toast.error("Failed to report lost item"); return; }
      const reportId = res.data.id || res.data.data?.id;
      logToSheet({
        sheetName: "Lost Items", studentId: scannedStudent?.id || "N/A",
        reporterName: data.reporterName || "", email: data.schoolEmail || "",
        itemName: data.lostItemName, description: data.description,
        location: data.location, date: startDate, type: "LOST",
        reportId: reportId || "UNKNOWN", scannedAt: scannedAtRef.current || new Date().toISOString(),
      }).catch(console.error);
      toast.success("Lost item reported successfully");
      reset(); setSelectedFile(null); setPreview(""); setUploadError("");
      setselectedMenu(""); setselectedMenucategoryId(""); setCategoryTouched(false);
      setSelectedColor(""); setSelectedCondition("");
      setStep(0); setScannedStudent(null); scannedAtRef.current = "";
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
        className="min-h-screen flex items-center justify-center bg-gray-950 py-10 px-2 sm:px-4"
        style={{ backgroundImage: "radial-gradient(ellipse at 60% 0%, rgba(59,130,246,0.07) 0%, transparent 60%)" }}
      >
        <div className="w-full max-w-2xl mx-auto">
          <div className="bg-gray-900 rounded-2xl border border-gray-800">
            <div className="p-4 sm:p-10">

              {/* Header */}
              <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-4 mb-6">
                <div>
                  <h1 className="text-xl sm:text-2xl font-bold text-white tracking-tight">Report a Lost Item</h1>
                  <p className="text-gray-500 text-sm mt-1">Help us reunite you with your belongings. Fill in the details carefully.</p>
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
                        rows={1} className={`${inputCls} resize-none`}
                        placeholder="Describe the item color, brand, size, etc." />
                    </Field>

                    {/* Color dropdown for specific categories */}
                    {selectedMenu && CATEGORY_CONFIG[selectedMenu.toLowerCase() as keyof typeof CATEGORY_CONFIG] && (
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
                                  let colorDescription = '';
                                  
                                  // Generate professional descriptions based on category and color
                                  switch (categoryKey) {
                                    case 'bags':
                                      colorDescription = `I am reporting a lost ${colorValue.toLowerCase()} bag. `;
                                      break;
                                    case 'calculators':
                                      colorDescription = `I am reporting a lost ${colorValue.toLowerCase()} calculator. `;
                                      break;
                                    case 'keys':
                                      colorDescription = `I am reporting lost ${colorValue.toLowerCase()} keys. `;
                                      break;
                                    case 'umbrellas':
                                      colorDescription = `I am reporting a lost ${colorValue.toLowerCase()} umbrella. `;
                                      break;
                                    case 'watches':
                                      colorDescription = `I am reporting a lost ${colorValue.toLowerCase()} watch. `;
                                      break;
                                    default:
                                      colorDescription = `I am reporting a lost ${colorValue.toLowerCase()} ${config.itemName.toLowerCase()}. `;
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
                    {selectedColor && (
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
                                  let enhancedDescription = '';
                                  
                                  // Generate enhanced descriptions based on category, color, and condition
                                  switch (categoryKey) {
                                    case 'bags':
                                      if (conditionValue === 'Scratches') {
                                        enhancedDescription = `I am reporting a lost ${selectedColor.toLowerCase()} bag with scratches. `;
                                      } else if (conditionValue === 'Stickers') {
                                        enhancedDescription = `I am reporting a lost ${selectedColor.toLowerCase()} bag with stickers. `;
                                      } else if (conditionValue === 'Keychains') {
                                        enhancedDescription = `I am reporting a lost ${selectedColor.toLowerCase()} bag with keychains. `;
                                      } else {
                                        enhancedDescription = `I am reporting a lost ${selectedColor.toLowerCase()} bag in good condition. `;
                                      }
                                      break;
                                    case 'calculators':
                                      if (conditionValue === 'Scratches') {
                                        enhancedDescription = `I am reporting a lost ${selectedColor.toLowerCase()} calculator with scratches.`;
                                      } else if (conditionValue === 'Stickers') {
                                        enhancedDescription = `I am reporting a lost ${selectedColor.toLowerCase()} calculator with stickers. `;
                                      } else if (conditionValue === 'Engravings') {
                                        enhancedDescription = `I am reporting a lost ${selectedColor.toLowerCase()} calculator with engravings. `;
                                      } else {
                                        enhancedDescription = `I am reporting a lost ${selectedColor.toLowerCase()} calculator in good condition. `;
                                      }
                                      break;
                                    case 'keys':
                                      if (conditionValue === 'Scratches') {
                                        enhancedDescription = `I am reporting lost ${selectedColor.toLowerCase()} keys with scratches. `;
                                      } else if (conditionValue === 'Stickers') {
                                        enhancedDescription = `I am reporting lost ${selectedColor.toLowerCase()} keys with stickers. `;
                                      } else if (conditionValue === 'Keychains') {
                                        enhancedDescription = `I am reporting lost ${selectedColor.toLowerCase()} keys with attached keychains. `;
                                      } else {
                                        enhancedDescription = `I am reporting lost ${selectedColor.toLowerCase()} keys in good condition. `;
                                      }
                                      break;
                                    case 'umbrellas':
                                      if (conditionValue === 'Scratches') {
                                        enhancedDescription = `I am reporting a lost ${selectedColor.toLowerCase()} umbrella with scratches. `;
                                      } else if (conditionValue === 'Stickers') {
                                        enhancedDescription = `I am reporting a lost ${selectedColor.toLowerCase()} umbrella with stickers. `;
                                      } else if (conditionValue === 'Bent Frame') {
                                        enhancedDescription = `I am reporting a lost ${selectedColor.toLowerCase()} umbrella with a bent frame. `;
                                      } else {
                                        enhancedDescription = `I am reporting a lost ${selectedColor.toLowerCase()} umbrella in good condition. `;
                                      }
                                      break;
                                    case 'watches':
                                      if (conditionValue === 'Scratches') {
                                        enhancedDescription = `I am reporting a lost ${selectedColor.toLowerCase()} watch with scratches. `;
                                      } else if (conditionValue === 'Stickers') {
                                        enhancedDescription = `I am reporting a lost ${selectedColor.toLowerCase()} watch with stickers. `;
                                      } else if (conditionValue === 'Engravings') {
                                        enhancedDescription = `I am reporting a lost ${selectedColor.toLowerCase()} watch with engravings. `;
                                      } else {
                                        enhancedDescription = `I am reporting a lost ${selectedColor.toLowerCase()} watch in good condition. `;
                                      }
                                      break;
                                    default:
                                      enhancedDescription = `I am reporting a lost ${selectedColor.toLowerCase()} ${config.itemName.toLowerCase()} with ${conditionValue.toLowerCase()}. Please add details like the brand, size, condition details, and any special features.`;
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
                          className={`border-2 border-dashed rounded-xl p-10 text-center cursor-pointer transition-all duration-200 ${
                            uploadError ? "border-red-500/60 bg-red-900/5"
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
                <div className={`flex mt-8 gap-3 ${step > 0 ? "justify-between" : "justify-end"}`}>
                  {step > 0 && (
                    <button type="button" onClick={() => setStep((s) => s - 1)}
                      className="px-6 py-2.5 rounded-lg border border-gray-700 text-gray-300 hover:bg-gray-800 hover:text-white text-sm font-medium transition-all duration-200">
                      Back
                    </button>
                  )}
                  {step < 2 ? (
                    <button type="button" onClick={nextStep}
                      disabled={
                        step === 0 
                          ? Boolean(!reporterName || !schoolEmail || !!errors.reporterName || !!errors.schoolEmail)
                          : Boolean(!lostItemName || !location || !description || !selectedMenucategoryId || !!errors.lostItemName || !!errors.location || !!errors.description || 
                             (selectedMenu && CATEGORY_CONFIG[selectedMenu.toLowerCase() as keyof typeof CATEGORY_CONFIG] && (!color || !!errors.color)) || 
                             (selectedColor && (!condition || !!errors.condition)))
                      }
                      className="px-8 py-2.5 rounded-lg bg-blue-600 hover:bg-blue-500 disabled:opacity-50 disabled:cursor-not-allowed text-white text-sm font-semibold transition-all duration-200 shadow-lg">
                      Continue
                    </button>
                  ) : isLoading ? (
                    <div className="flex items-center gap-2 px-6 py-2.5 rounded-lg bg-blue-600/50 text-white text-sm font-semibold">
                      <Spinner size="sm" /> Submitting...
                    </div>
                  ) : (
                    <button type="button" onClick={onSubmit}
                      disabled={!selectedFile}
                      className="px-8 py-2.5 rounded-lg bg-blue-600 hover:bg-blue-500 disabled:opacity-50 disabled:cursor-not-allowed text-white text-sm font-semibold transition-all duration-200 shadow-lg">
                      Submit Report
                    </button>
                  )}
                </div>

              </form>
            </div>
          </div>

          <p className="text-center text-xs text-gray-600 mt-4">
            All reports are reviewed by the NBSC Lost & Found office.
          </p>
        </div>
      </section>
      <ToastContainer position="top-right" autoClose={3000} style={{ top: "70px" }} theme="dark" />
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
    </>
  );
};

export default ReportLostItem;
