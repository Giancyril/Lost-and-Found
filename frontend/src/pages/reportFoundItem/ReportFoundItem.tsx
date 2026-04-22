import { useForm, Controller } from "react-hook-form";
import { Spinner } from "flowbite-react";
import Modals from "../../components/modal/Modal";
import { ToastContainer, toast } from "react-toastify";
import { useState, useRef } from "react";
import {
  useCategoryQuery,
  useCreateFoundItemMutation,
  useUploadItemImagesMutation,
  useGetStudentByIdQuery,
  useLazyGetStudentByDetailsQuery,
} from "../../redux/api/api";
import DatePicker from "react-datepicker";
import "react-datepicker/dist/react-datepicker.css";
import { useUserVerification } from "../../auth/auth";
import {
  FaBoxOpen, FaMapMarkerAlt, FaPhone, FaUserCheck,
  FaQrcode, FaTimes, FaSearch, FaSpinner
} from "react-icons/fa";
import LocationAutocomplete from "../../components/ui/LocationAutocomplete";
import type { ScannedStudent } from "../../components/scanner/BarcodeScannerModal";
import BarcodeScannerModal from "../../components/scanner/BarcodeScannerModal";
import imageCompression from "browser-image-compression";
import { logToSheet } from "../../utils/sheetsLogger";

const MAX_IMAGES = 6;
const MAX_SIZE_MB = 5;

const inputCls =
  "w-full px-4 py-2.5 bg-gray-800/60 border border-gray-700 rounded-lg text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-emerald-500/60 focus:border-emerald-500 transition-all duration-200 text-sm";

const IconUser = ({ size = 13 }: { size?: number }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2" /><circle cx="12" cy="7" r="4" />
  </svg>
);

const IconBuilding = ({ size = 13 }: { size?: number }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <rect width="16" height="20" x="4" y="2" rx="2" ry="2" /><path d="M9 22v-4h6v4" /><path d="M8 6h.01" /><path d="M16 6h.01" /><path d="M8 10h.01" /><path d="M16 10h.01" /><path d="M8 14h.01" /><path d="M16 14h.01" />
  </svg>
);

const IconGrid = ({ size = 13 }: { size?: number }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <rect width="7" height="7" x="3" y="3" rx="1" /><rect width="7" height="7" x="14" y="3" rx="1" /><rect width="7" height="7" x="14" y="14" rx="1" /><rect width="7" height="7" x="3" y="14" rx="1" />
  </svg>
);

// Category Help Modal Content
const CATEGORY_HELP_CONTENT = {
  tag: <><IconGrid size={8} /> Item Categories</>,
  steps: [
    { n: "1", title: "Select a Category", desc: "Choose the most appropriate category for the found item from the dropdown menu." },
    { n: "2", title: "Help with Matching", desc: "The correct category helps us match the found item with lost items more effectively." },
    { n: "3", title: "Better Organization", desc: "Proper categorization keeps the found items board organized and easy to search." },
  ],
  tip: (
    <div className="p-3 rounded-xl bg-emerald-500/5 border border-emerald-500/20">
      <p className="text-gray-400 text-[11px] leading-relaxed text-justify">
        Selecting the right category helps owners find their items faster. Common categories include <span className="text-emerald-400 font-semibold">bags</span>, <span className="text-emerald-400 font-semibold">calculators</span>, <span className="text-emerald-400 font-semibold">keys</span>, <span className="text-emerald-400 font-semibold">umbrellas</span>, and <span className="text-emerald-400 font-semibold">watches</span>.
      </p>
    </div>
  ),
};

const ReportFoundItem = () => {
  const users: any = useUserVerification();
  const isAdmin = users?.role === "ADMIN";

  const {
    handleSubmit,
    register,
    formState: { errors },
    reset,
    control,
    setValue,
    getValues,
  } = useForm();

  const [selectedMenu, setselectedMenu] = useState("");
  const [selectedMenucategoryId, setselectedMenucategoryId] = useState("");
  const [showCategoryHelp, setShowCategoryHelp] = useState(false);
  const handleMenuChange = (menuName: string, categoryId: string) => {
    setselectedMenu(menuName);
    setselectedMenucategoryId(categoryId);
  };

  const [createFoundItem, { isLoading }] = useCreateFoundItemMutation();
  const [uploadItemImages, { isLoading: isUploading }] = useUploadItemImagesMutation();
  const { data: Category } = useCategoryQuery("");
  const [startDate, setStartDate] = useState(new Date());

  // Image upload state
  const [selectedFiles, setSelectedFiles] = useState<File[]>([]);
  const [previews, setPreviews] = useState<string[]>([]);
  const [primaryIdx, setPrimaryIdx] = useState(0);
  const [uploadError, setUploadError] = useState("");
  const [isDragging, setIsDragging] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileChange = async (files: FileList | null) => {
    if (!files) return;
    setUploadError("");
    const incoming = Array.from(files);

    const valid = incoming.filter((f) => {
      if (!f.type.startsWith("image/")) {
        setUploadError("Only image files are allowed.");
        return false;
      }
      if (f.size > MAX_SIZE_MB * 1024 * 1024) {
        setUploadError(`Each file must be under ${MAX_SIZE_MB}MB.`);
        return false;
      }
      return true;
    });

    const compressedFiles = await Promise.all(valid.map(async (file) => {
      try {
        const options = { maxSizeMB: 0.4, maxWidthOrHeight: 1200, useWebWorker: true };
        return await imageCompression(file, options);
      } catch (error) {
        console.error("Image compression error:", error);
        return file;
      }
    }));

    const combined = [...selectedFiles, ...compressedFiles].slice(0, MAX_IMAGES);
    if (selectedFiles.length + valid.length > MAX_IMAGES) {
      setUploadError(`Maximum ${MAX_IMAGES} images allowed.`);
    }
    setSelectedFiles(combined as File[]);
    setPreviews(combined.map((f) => URL.createObjectURL(f)));
  };

  const [showScanner, setShowScanner] = useState(false);
  const [scannedStudent, setScannedStudent] = useState<ScannedStudent | null>(null);
  const scannedAtRef = useRef<string>("");

  const useFetchStudent = (id: string) => {
  const trimmed = id?.trim() ?? "";
  const isValidId = Boolean(
    trimmed &&
    trimmed.length >= 4 &&
    // skip ISO date format YYYY-MM-DD only
    !/^\d{4}-\d{2}-\d{2}$/.test(trimmed)
  );
  return useGetStudentByIdQuery(trimmed, { skip: !isValidId });
};

  const handleScan = (student: ScannedStudent) => {
    const scanTime = new Date().toISOString();
    scannedAtRef.current = scanTime;
    setScannedStudent(student);
    reset();
    register("reporterName", { required: "Finder's name is required" });
    register("schoolEmail", { 
      required: "School email is required",
      pattern: { value: /^[^\s@]+@nbsc\.edu\.ph$/i, message: "Must be a valid NBSC email" },
    });
    // Set the scanned student data
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
    if (!name) {
      toast.info("Please enter a name to fetch details");
      return;
    }
    try {
      const res = await getStudentByDetails({ name, email: "" }).unwrap();
      const student = res.data ?? res;
      if (student) {
        setValue("reporterName", student.name);
        setValue("schoolEmail", student.email);
        setValue("department", student.department || "");
        setScannedStudent({
          id: student.id,
          name: student.name,
          email: student.email,
          department: student.department || "",
          raw: "manual_fetch"
        });
        toast.success(`Found: ${student.name}`);
      }
    } catch {
      toast.error("Student not found in masterlist");
    }
  };

  const removeFile = (idx: number) => {
    const updated = selectedFiles.filter((_, i) => i !== idx);
    setSelectedFiles(updated);
    setPreviews(updated.map((f) => URL.createObjectURL(f)));
    if (primaryIdx >= updated.length) setPrimaryIdx(0);
  };

  const onSubmit = async (data: any) => {
    if (!selectedMenucategoryId) return;
    try {
      const foundData = {
        img: previews[primaryIdx] || "",
        categoryId: selectedMenucategoryId,
        foundItemName: data.foundItemName,
        description: data.description,
        location: data.location,
        date: startDate,
        claimProcess: data.claimProcess,
      };

      const res: any = await createFoundItem(foundData);

      if (res.error || res?.data?.success === false) {
        Modals({ message: "Failed to submit found item", status: false });
        return;
      }

      const reportId = res.data?.id || res.data?.data?.id || "UNKNOWN";

      // ── Log to Sheets ───────────────────────────────────────────────────
      logToSheet({
        sheetName: "Found Items",
        studentId: scannedStudent?.id || "N/A",
        reporterName: data.reporterName || "OFFICE",
        email: scannedStudent?.email || "N/A",
        itemName: data.foundItemName,
        description: data.description,
        location: data.location,
        date: startDate.toISOString().split("T")[0],
        type: "FOUND",
        reportId: reportId,
        scannedAt: scannedAtRef.current || new Date().toISOString(),
      }).catch(console.error);

      // Upload images if any were selected
      if (selectedFiles.length > 0 && res?.data?.data?.id) {
        const formData = new FormData();
        selectedFiles.forEach((file) => {
          formData.append("images", file);
        });
        formData.append("primaryIndex", String(primaryIdx));
        await uploadItemImages({ id: res.data.data.id, type: "found", formData });
      }

      Modals({ message: "Found item submitted successfully", status: true });
      reset();
      setSelectedFiles([]);
      setPreviews([]);
      setPrimaryIdx(0);
      setUploadError("");
      setselectedMenu("");
      setselectedMenucategoryId("");
    } catch (err: any) {
      Modals({ message: "Failed to submit found item", status: false });
    }
  };

  const isBusy = isLoading || isUploading;

  // Non-admin: show office visit message
  if (!isAdmin) {
    return (
      <section className="min-h-screen flex items-center justify-center bg-gray-950 py-4 px-3">
        <div className="w-full max-w-xs mx-auto">
          <div className="bg-gray-900 rounded-2xl border border-gray-800 p-6 sm:p-10 text-center">
            <div className="w-16 h-16 bg-green-500/10 border border-green-500/30 rounded-full flex items-center justify-center mx-auto mb-5">
              <FaBoxOpen className="text-green-400 text-2xl" />
            </div>
            <h1 className="text-2xl font-bold text-white mb-3">Found Something?</h1>
            <p className="text-gray-400 text-sm leading-relaxed mb-8">
              Please bring the item to the{" "}
              <span className="text-white font-semibold">SAS Office</span> and our staff will log it into the system. The owner will be notified through the Found Items Board.
            </p>
            <div className="space-y-3 text-left">
              <div className="flex items-start gap-3 bg-gray-800/60 rounded-xl p-4 border border-gray-700">
                <FaMapMarkerAlt className="text-green-400 mt-0.5 shrink-0" />
                <div>
                  <p className="text-white text-sm font-semibold">SAS Office Location</p>
                  <p className="text-gray-400 text-xs mt-0.5">
                    National Baptist School of Caloocan — Student Affairs Office
                  </p>
                </div>
              </div>
              <div className="flex items-start gap-3 bg-gray-800/60 rounded-xl p-4 border border-gray-700">
                <FaPhone className="text-green-400 mt-0.5 shrink-0" />
                <div>
                  <p className="text-white text-sm font-semibold">Office Hours</p>
                  <p className="text-gray-400 text-xs mt-0.5">Monday – Friday, 8:00 AM – 5:00 PM</p>
                </div>
              </div>
            </div>
            <p className="text-gray-600 text-xs mt-8">
              Thank you for being honest and helping return lost items to their owners.
            </p>
          </div>
        </div>
      </section>
    );
  }

  // Admin: full form
  return (
    <>
      <section className="min-h-screen flex items-center justify-center bg-gray-950 py-4 px-3">
        <div className="w-full max-w-lg mx-auto">
          <div className="bg-gray-900 rounded-2xl border border-gray-800 p-4 sm:p-8">

            {/* Header */}
            <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-4 mb-8">
              <div className="flex items-center gap-4 text-left">
                <div className="flex items-center justify-center w-12 h-12 rounded-xl bg-green-600/15 border border-green-500/30">
                  <FaBoxOpen className="text-green-400" size={22} />
                </div>
                <div>
                  <h1 className="text-2xl font-bold text-white tracking-tight leading-tight">Submit a Found Item</h1>
                  <p className="text-gray-500 text-sm mt-1">
                    Log a discovered item into the system.
                  </p>
                </div>
              </div>
              <div className="flex gap-2">
                {scannedStudent ? (
                  <button
                    onClick={clearScan}
                    className="inline-flex items-center justify-center gap-2 px-3 py-1.5 bg-red-500/10 hover:bg-red-500/20 border border-red-500/20 text-red-400 text-[10px] font-black rounded-lg transition-all"
                  >
                    <FaTimes size={10} /> Clear Scan
                  </button>
                ) : (
                  isAdmin && (
                    <button
                      onClick={() => setShowScanner(true)}
                      className="inline-flex items-center justify-center gap-1 sm:gap-1.5 px-2.5 py-1.5 sm:px-4 sm:py-2 bg-emerald-600/15 hover:bg-emerald-600/25 border border-emerald-500/25 text-emerald-400 text-[10px] sm:text-xs font-bold sm:font-semibold rounded-lg sm:rounded-xl transition-all whitespace-nowrap"
                    >
                      <FaQrcode className="w-2.5 h-2.5 sm:w-3 sm:h-3" /> Scan Finder ID
                    </button>
                  )
                )}
              </div>
            </div>

            {scannedStudent && (
              <div className="group relative overflow-hidden bg-emerald-500/5 hover:bg-emerald-500/10 border border-emerald-500/20 rounded-2xl p-4 mb-6 animate-fadeIn transition-all duration-300">
                <div className="absolute top-0 right-0 w-24 h-24 bg-emerald-500/5 blur-2xl -mr-12 -mt-12 group-hover:bg-emerald-500/10 transition-all duration-500" />
                <div className="flex items-center justify-between relative z-10 w-full text-left">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-xl bg-emerald-500/20 flex items-center justify-center text-emerald-400 shadow-inner group-hover:scale-110 transition-transform duration-300">
                      <FaUserCheck size={18} />
                    </div>
                    <div>
                      <h4 className="text-sm font-black text-white tracking-tight uppercase">{scannedStudent.name}</h4>
                      <p className="text-[10px] font-bold text-emerald-400/70 uppercase tracking-widest mt-0.5">ID: {scannedStudent.id}</p>
                    </div>
                  </div>
                  <button
                    onClick={clearScan}
                    className="w-7 h-7 flex items-center justify-center rounded-lg bg-red-500/10 hover:bg-red-500/20 text-red-400 transition-all hover:rotate-90"
                  >
                    <FaTimes size={12} />
                  </button>
                </div>
              </div>
            )}

            <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
              <div className="grid gap-6 md:grid-cols-2">

                <div className="md:col-span-2 flex justify-end mb-2">
                  <button
                    type="button"
                    onClick={handleFetchDetails}
                    disabled={isFetchingByDetails}
                    className="px-2 py-1 rounded-lg bg-emerald-500/10 hover:bg-emerald-500/20 border border-emerald-500/20 text-[9px] font-black text-emerald-400 hover:text-emerald-300 flex items-center gap-1.5 transition-all uppercase tracking-wider active:scale-95 disabled:opacity-50 whitespace-nowrap"
                  >
                    {isFetchingByDetails ? <FaSpinner className="animate-spin" size={8} /> : <FaSearch size={8} />}
                    Fetch Student Info
                  </button>
                </div>

                {/* Reported By */}
                <div className="grid gap-4 sm:gap-5 sm:grid-cols-2">
                  <div className="space-y-1.5">
                    <label className="text-[10px] font-bold text-gray-500 uppercase tracking-[0.2em] block">Your Name *</label>
                    <div className={`relative flex items-center ${inputCls} ring-0 focus-within:ring-2 focus-within:ring-emerald-500/50`}>
                      <span className="text-gray-500 mr-2"><IconUser size={16} /></span>
                      <input
                        {...register("reporterName", { required: "Finder's name is required" })}
                        type="text"
                        className="bg-transparent border-none p-0 w-full focus:ring-0 text-sm"
                        placeholder="Enter name or scan ID"
                      />
                    </div>
                    {errors.reporterName && (
                      <p className="text-red-400 text-xs mt-1 text-left">{errors.reporterName?.message as string}</p>
                    )}
                  </div>
                  <div className="space-y-1.5">
                    <label className="text-[10px] font-bold text-gray-500 uppercase tracking-[0.2em] block">Institutional Email *</label>
                    <div className={`relative flex items-center ${inputCls} ring-0 focus-within:ring-2 focus-within:ring-emerald-500/50`}>
                      <span className="text-gray-500 mr-2"><IconMail size={16} /></span>
                      <input {...register("schoolEmail", {
                        required: "School email is required",
                        pattern: { value: /^[^\s@]+@nbsc\.edu\.ph$/i, message: "Must be a valid NBSC email" },
                      })}
                        type="email" autoComplete="off"
                        className="bg-transparent border-none p-0 w-full focus:ring-0 text-sm" placeholder=" " />
                    </div>
                    {errors.schoolEmail && <p className="text-red-400 text-xs mt-1">{errors.schoolEmail.message as string}</p>}
                  </div>
                </div>

                {/* Fetch + Scan button row */}
                <div className="flex justify-end items-center gap-2">
                  <button
                    type="button"
                    onClick={handleFetchDetails}
                    disabled={isFetchingByDetails}
                    className="px-2 py-1 rounded-lg bg-emerald-500/10 hover:bg-emerald-500/20 border border-emerald-500/20 text-[9px] font-black text-emerald-400 hover:text-emerald-300 flex items-center gap-1.5 transition-all uppercase tracking-wider active:scale-95 disabled:opacity-50 whitespace-nowrap"
                  >
                    {isFetchingByDetails ? <FaSpinner className="animate-spin" size={8} /> : <FaSearch size={8} />}
                    Fetch Student Info
                  </button>
                  <button
                    type="button"
                    onClick={() => setShowScanner(true)}
                    className="inline-flex items-center justify-center gap-1.5 px-2.5 py-1 bg-emerald-600/15 hover:bg-emerald-600/25 border border-emerald-500/25 text-emerald-400 text-[9px] font-black rounded-lg transition-all uppercase tracking-wider whitespace-nowrap active:scale-95"
                  >
                    <FaQrcode className="w-2.5 h-2.5" /> Scan Student ID
                  </button>
                </div>

                {/* Department / Course */}
                <div className="space-y-1.5">
                  <label className="block text-[10px] font-bold text-gray-500 uppercase tracking-[0.2em]">Department / Course</label>
                  <div className={`relative flex items-center ${inputCls} bg-gray-800/40 opacity-80 ring-0`}>
                    <span className="text-gray-500 mr-2"><IconBuilding size={16} /></span>
                    <input
                      {...register("department")}
                      type="text"
                      readOnly
                      className="bg-transparent border-none p-0 w-full focus:ring-0 text-sm italic"
                      placeholder="Auto-filled from masterlist..."
                    />
                  </div>
                </div>

                {/* Description */}
                <div>
                  <label className="block mb-1.5 text-xs font-bold text-white uppercase tracking-widest">Item Description</label>
                  <input
                    type="text"
                    className="w-full px-4 py-3 bg-gray-800 border border-gray-700 rounded-xl text-white placeholder-gray-500 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all duration-200 text-sm"
                    placeholder="Describe the item — color, brand, size, markings"
                    {...register("description", { required: "Description is required" })}
                  />
                  {errors.description && (
                    <p className="text-red-400 text-xs mt-1">{errors.description?.message as string}</p>
                  )}
                </div>

                {/* Location */}
                <div>
                  <label className="block mb-1.5 text-xs font-bold text-white uppercase tracking-widest">Where Found</label>
                  <Controller
                    name="location"
                    control={control}
                    rules={{ required: "Location is required" }}
                    render={({ field }) => (
                      <LocationAutocomplete
                        value={field.value || ""}
                        onChange={field.onChange}
                        onBlur={field.onBlur}
                        className="w-full px-4 py-3 bg-gray-800 border border-gray-700 rounded-xl text-white placeholder-gray-500 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all duration-200 text-sm"
                        placeholder="e.g. Library, Canteen, Room 205"
                      />
                    )}
                  />
                  {errors.location && (
                    <p className="text-red-400 text-xs mt-1">{errors.location?.message as string}</p>
                  )}
                </div>

                {/* Claim Process */}
                <div>
                  <label className="block mb-1.5 text-xs font-bold text-white uppercase tracking-widest">Claim Instructions</label>
                  <input
                    type="text"
                    className="w-full px-4 py-3 bg-gray-800 border border-gray-700 rounded-xl text-white placeholder-gray-500 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all duration-200 text-sm"
                    placeholder="e.g. Visit the SAS office with valid ID"
                    {...register("claimProcess", { required: "Claim instructions are required" })}
                  />
                  {errors.claimProcess && (
                    <p className="text-red-400 text-xs mt-1">{errors.claimProcess?.message as string}</p>
                  )}
                </div>

                {/* Date Found */}
                <div>
                  <label className="block mb-1.5 text-xs font-bold text-white uppercase tracking-widest">Date Found</label>
                  <DatePicker
                    wrapperClassName="w-full"
                    className="w-full px-4 py-3 bg-gray-800 border border-gray-700 rounded-xl text-white placeholder-gray-500 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all duration-200 text-sm"
                    selected={startDate}
                    onChange={(date: any) => setStartDate(date)}
                    dateFormat="yyyy-MM-dd"
                    placeholderText="Select date"
                    showYearDropdown
                    showMonthDropdown
                    dropdownMode="select"
                    maxDate={new Date()}
                  />
                </div>

                {/* Category */}
                <div>
                  <div className="flex items-center gap-1.5 mb-1.5">
                    <label className="text-xs font-bold text-white uppercase tracking-widest">Item Category</label>
                    <button
                      type="button"
                      onClick={() => setShowCategoryHelp(true)}
                      className="w-4 h-4 rounded-full bg-gray-700 hover:bg-gray-600 border border-gray-600 text-gray-400 hover:text-white flex items-center justify-center transition-all"
                      title="About categories"
                    >
                      <span className="text-[9px] font-black leading-none">i</span>
                    </button>
                  </div>
                  <div className="relative">
                    <select
                      className="w-full px-4 py-3 bg-gray-800 border border-gray-700 rounded-xl text-white focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all duration-200 appearance-none cursor-pointer text-sm"
                      value={selectedMenucategoryId}
                      onChange={(e) => {
                        const selectedCategory = Category?.data?.find(
                          (cat: any) => cat.id === e.target.value
                        );
                        if (selectedCategory)
                          handleMenuChange(selectedCategory.name, selectedCategory.id);
                      }}
                    >
                      <option value="" disabled className="text-gray-500">Select a category</option>
                      {Category?.data?.map((category: any) => (
                        <option key={category?.id} value={category?.id} className="text-white bg-gray-800">
                          {category?.name}
                        </option>
                      ))}
                    </select>
                    <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center px-3 text-gray-400">
                      <svg className="fill-current h-4 w-4" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20">
                        <path d="M9.293 12.95l.707.707L15.657 8l-1.414-1.414L10 10.828 5.757 6.586 4.343 8z" />
                      </svg>
                    </div>
                  </div>
                  {!selectedMenu && (
                    <p className="text-red-400 text-xs mt-1">Category is required</p>
                  )}
                </div>

              </div>

              {/* Image Upload — full width */}
              <div>
                <label className="block mb-1.5 text-xs font-bold text-white uppercase tracking-widest">
                  Item Photos{" "}
                  <span className="text-gray-500 normal-case font-normal">
                    (up to {MAX_IMAGES} images)
                  </span>
                </label>

                {/* Drop zone */}
                <div
                  className={`border-2 border-dashed rounded-xl p-6 text-center cursor-pointer transition-all duration-200 ${isDragging
                      ? "border-blue-500 bg-blue-900/10"
                      : "border-gray-700 bg-gray-800/50 hover:border-blue-500 hover:bg-gray-800"
                    }`}
                  onClick={() => fileInputRef.current?.click()}
                  onDragOver={(e) => { e.preventDefault(); setIsDragging(true); }}
                  onDragLeave={() => setIsDragging(false)}
                  onDrop={(e) => {
                    e.preventDefault();
                    setIsDragging(false);
                    handleFileChange(e.dataTransfer.files);
                  }}
                >
                  <input
                    ref={fileInputRef}
                    type="file"
                    accept="image/*"
                    multiple
                    className="hidden"
                    onChange={(e) => handleFileChange(e.target.files)}
                  />
                  <div className="text-gray-400 text-sm">
                    <span className="text-blue-400 font-medium">Click to upload</span> or drag & drop
                    <p className="text-xs text-gray-600 mt-1">
                      JPG, PNG, WEBP · Max {MAX_SIZE_MB}MB each · {selectedFiles.length}/{MAX_IMAGES} selected
                    </p>
                  </div>
                </div>

                {uploadError && (
                  <p className="text-red-400 text-xs mt-1.5">{uploadError}</p>
                )}

                {/* Image previews */}
                {previews.length > 0 && (
                  <>
                    <div className="grid grid-cols-3 sm:grid-cols-6 gap-2 mt-3">
                      {previews.map((src, idx) => (
                        <div
                          key={idx}
                          className={`relative rounded-lg overflow-hidden aspect-square border-2 transition-all duration-200 cursor-pointer ${idx === primaryIdx
                              ? "border-blue-500 ring-2 ring-blue-500/30"
                              : "border-gray-700 hover:border-gray-500"
                            }`}
                          onClick={() => setPrimaryIdx(idx)}
                          title="Click to set as cover photo"
                        >
                          <img src={src} className="w-full h-full object-cover" alt="" />
                          {idx === primaryIdx && (
                            <div className="absolute bottom-0 left-0 right-0 bg-blue-600/90 text-white text-center text-[10px] font-bold py-0.5">
                              Cover
                            </div>
                          )}
                          <button
                            type="button"
                            onClick={(e) => { e.stopPropagation(); removeFile(idx); }}
                            className="absolute top-1 right-1 w-5 h-5 bg-black/60 hover:bg-red-600 rounded-full text-white text-xs flex items-center justify-center transition-colors duration-150"
                          >
                            ✕
                          </button>
                        </div>
                      ))}
                    </div>
                    <p className="text-xs text-gray-500 mt-1.5">
                      Click a photo to set it as the cover image
                    </p>
                  </>
                )}
              </div>

              {/* Submit */}
              {isBusy ? (
                <div className="flex justify-center py-2"><Spinner size="lg" /></div>
              ) : (
                <button
                  type="submit"
                  className="w-full bg-blue-600 hover:bg-blue-500 text-white font-semibold py-3 px-6 rounded-xl transition-all duration-200 text-sm mt-2"
                >
                  Submit Found Item
                </button>
              )}
            </form>
          </div>
        </div>
      </section>
      <ToastContainer position="top-right" autoClose={3000} style={{ top: "70px" }} theme="dark" />
      {showScanner && (
        <BarcodeScannerModal
          onScan={handleScan}
          onClose={() => setShowScanner(false)}
          useFetchStudent={useFetchStudent}
        />
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
                <p className="text-[10px] font-black text-emerald-400 uppercase tracking-widest flex items-center gap-1.5">
                  {CATEGORY_HELP_CONTENT.tag}
                </p>
                <div className="space-y-3">
                  {CATEGORY_HELP_CONTENT.steps.map(({ n, title, desc }) => (
                    <div key={n} className="flex gap-3">
                      <div className="shrink-0 w-6 h-6 rounded-full border bg-emerald-500/10 border-emerald-500/20 text-emerald-400 flex items-center justify-center text-[10px] font-black">{n}</div>
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

export default ReportFoundItem;