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
  FaQrcode, FaTimes, FaSearch, FaSpinner, FaImage,
  FaCheckCircle, FaCalendarAlt, FaTag, FaClipboardList,
} from "react-icons/fa";
import LocationAutocomplete from "../../components/ui/LocationAutocomplete";
import type { ScannedStudent } from "../../components/scanner/BarcodeScannerModal";
import BarcodeScannerModal from "../../components/scanner/BarcodeScannerModal";
import imageCompression from "browser-image-compression";
import { logToSheet } from "../../utils/sheetsLogger";

const MAX_IMAGES = 6;
const MAX_SIZE_MB = 5;

const IconUser = ({ size = 14 }: { size?: number }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2" /><circle cx="12" cy="7" r="4" />
  </svg>
);
const IconMail = ({ size = 14 }: { size?: number }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <rect width="20" height="16" x="2" y="4" rx="2" /><path d="m22 7-10 5L2 7" />
  </svg>
);
const IconBuilding = ({ size = 14 }: { size?: number }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <rect width="16" height="20" x="4" y="2" rx="2" ry="2" /><path d="M9 22v-4h6v4" /><path d="M8 6h.01" /><path d="M16 6h.01" /><path d="M8 10h.01" /><path d="M16 10h.01" /><path d="M8 14h.01" /><path d="M16 14h.01" />
  </svg>
);

const inputCls =
  "w-full px-3.5 py-2.5 bg-gray-800/80 border border-white/[0.07] rounded-xl text-white placeholder-gray-600 focus:outline-none focus:ring-2 focus:ring-emerald-500/40 focus:border-emerald-500/60 transition-all duration-200 text-sm";

const Label = ({ children }: { children: React.ReactNode }) => (
  <label className="block mb-1.5 text-[10px] font-bold text-gray-500 uppercase tracking-[0.15em]">
    {children}
  </label>
);

const CATEGORY_HELP_CONTENT = {
  steps: [
    { n: "1", title: "Select a Category", desc: "Choose the most appropriate category for the found item." },
    { n: "2", title: "Help with Matching", desc: "The correct category helps match found items with lost ones effectively." },
    { n: "3", title: "Better Organization", desc: "Proper categorization keeps the board organized and easy to search." },
  ],
};

const ReportFoundItem = () => {
  const users: any = useUserVerification();
  const isAdmin = users?.role === "ADMIN";

  const { handleSubmit, register, formState: { errors }, reset, control, setValue, watch } = useForm();

  const watchedReporterName = watch("reporterName") ?? "";
  const watchedSchoolEmail  = watch("schoolEmail")  ?? "";

  const [selectedMenu, setselectedMenu]                 = useState("");
  const [selectedMenucategoryId, setselectedMenucategoryId] = useState("");
  const [showCategoryHelp, setShowCategoryHelp]         = useState(false);

  const handleMenuChange = (menuName: string, categoryId: string) => {
    setselectedMenu(menuName);
    setselectedMenucategoryId(categoryId);
  };

  const [createFoundItem, { isLoading }]           = useCreateFoundItemMutation();
  const [uploadItemImages, { isLoading: isUploading }] = useUploadItemImagesMutation();
  const { data: Category }                         = useCategoryQuery("");
  const [startDate, setStartDate]                  = useState(new Date());

  const [selectedFiles, setSelectedFiles] = useState<File[]>([]);
  const [previews, setPreviews]           = useState<string[]>([]);
  const [primaryIdx, setPrimaryIdx]       = useState(0);
  const [uploadError, setUploadError]     = useState("");
  const [isDragging, setIsDragging]       = useState(false);
  const fileInputRef                      = useRef<HTMLInputElement>(null);

  const handleFileChange = async (files: FileList | null) => {
    if (!files) return;
    setUploadError("");
    const incoming = Array.from(files);
    const valid = incoming.filter((f) => {
      if (!f.type.startsWith("image/")) { setUploadError("Only image files are allowed."); return false; }
      if (f.size > MAX_SIZE_MB * 1024 * 1024) { setUploadError(`Each file must be under ${MAX_SIZE_MB}MB.`); return false; }
      return true;
    });
    const compressedFiles = await Promise.all(valid.map(async (file) => {
      try { return await imageCompression(file, { maxSizeMB: 0.4, maxWidthOrHeight: 1200, useWebWorker: true }); }
      catch { return file; }
    }));
    const combined = [...selectedFiles, ...compressedFiles].slice(0, MAX_IMAGES);
    if (selectedFiles.length + valid.length > MAX_IMAGES) setUploadError(`Maximum ${MAX_IMAGES} images allowed.`);
    setSelectedFiles(combined as File[]);
    setPreviews(combined.map((f) => URL.createObjectURL(f)));
  };

  const [showScanner, setShowScanner]       = useState(false);
  const [scannedStudent, setScannedStudent] = useState<ScannedStudent | null>(null);
  const scannedAtRef                        = useRef<string>("");

  const useFetchStudent = (id: string) => {
    const trimmed = id?.trim() ?? "";
    const isValidId = Boolean(trimmed && trimmed.length >= 4 && !/^\d{4}-\d{2}-\d{2}$/.test(trimmed));
    return useGetStudentByIdQuery(trimmed, { skip: !isValidId });
  };

  const handleScan = (student: ScannedStudent) => {
    scannedAtRef.current = new Date().toISOString();
    setScannedStudent(student);
    reset();
    register("reporterName", { required: "Finder's name is required" });
    register("schoolEmail", { required: "School email is required", pattern: { value: /^[^\s@]+@nbsc\.edu\.ph$/i, message: "Must be a valid NBSC email" } });
    setValue("reporterName", student.name);
    setValue("schoolEmail", student.email);
    setValue("department", student.department || "");
    setShowScanner(false);
    toast.success(student.name !== "Unknown Student" ? `Student identified: ${student.name}` : `ID Scanned: ${student.id}`);
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
    const name  = watchedReporterName?.trim() || "";
    const email = watchedSchoolEmail?.trim()  || "";
    if (!name && !email) { toast.info("Please enter a name or email first"); return; }
    try {
      let student: any = null;
      if (name) { try { const res = await getStudentByDetails({ name, email }).unwrap(); student = res?.data ?? res; } catch {} }
      if (!student?.name && email) { try { const res = await getStudentByDetails({ name: "", email }).unwrap(); student = res?.data ?? res; } catch {} }
      if (student?.name) {
        const dept = student.department || student.course || "";
        setValue("reporterName", student.name);
        setValue("schoolEmail", student.email);
        setValue("department", dept);
        setScannedStudent({ id: student.id || "", name: student.name || "", email: student.email || "", department: dept, raw: "manual_fetch" });
        toast.success(`Found: ${student.name}`);
      } else { toast.error("Student not found in masterlist"); }
    } catch { toast.error("Student not found in masterlist"); }
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
      const foundData = { img: previews[primaryIdx] || "", categoryId: selectedMenucategoryId, foundItemName: data.foundItemName, description: data.description, location: data.location, date: startDate, claimProcess: data.claimProcess };
      const res: any = await createFoundItem(foundData);
      if (res.error || res?.data?.success === false) { Modals({ message: "Failed to submit found item", status: false }); return; }
      const reportId = res.data?.id || res.data?.data?.id || "UNKNOWN";
      logToSheet({ sheetName: "Found Items", studentId: scannedStudent?.id || "N/A", reporterName: data.reporterName || "OFFICE", email: scannedStudent?.email || "N/A", itemName: data.foundItemName, description: data.description, location: data.location, date: startDate.toISOString().split("T")[0], type: "FOUND", reportId, scannedAt: scannedAtRef.current || new Date().toISOString() }).catch(console.error);
      if (selectedFiles.length > 0 && res?.data?.data?.id) {
        const formData = new FormData();
        selectedFiles.forEach((file) => formData.append("images", file));
        formData.append("primaryIndex", String(primaryIdx));
        await uploadItemImages({ id: res.data.data.id, type: "found", formData });
      }
      Modals({ message: "Found item submitted successfully", status: true });
      reset(); setSelectedFiles([]); setPreviews([]); setPrimaryIdx(0); setUploadError(""); setselectedMenu(""); setselectedMenucategoryId("");
    } catch { Modals({ message: "Failed to submit found item", status: false }); }
  };

  const isBusy = isLoading || isUploading;

  // ── Non-admin view ────────────────────────────────────────────────────────
  if (!isAdmin) {
    return (
      <section className="min-h-screen flex items-center justify-center bg-gray-950 py-8 px-4">
        <div className="w-full max-w-sm mx-auto">
          {/* Card */}
          <div className="relative bg-gray-900 border border-white/5 rounded-2xl overflow-hidden">
            {/* Top accent strip */}
            <div className="h-1 w-full bg-gradient-to-r from-emerald-500 via-teal-400 to-cyan-500" />

            <div className="p-6 sm:p-8">
              {/* Icon */}
              <div className="flex justify-center mb-5">
                <div className="relative">
                  <div className="w-16 h-16 rounded-2xl bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center">
                    <FaBoxOpen className="text-emerald-400" size={28} />
                  </div>
                  <div className="absolute -bottom-1 -right-1 w-6 h-6 bg-emerald-500 rounded-full border-2 border-gray-900 flex items-center justify-center">
                    <FaCheckCircle size={10} className="text-white" />
                  </div>
                </div>
              </div>

              {/* Heading */}
              <h1 className="text-xl font-bold text-white text-center tracking-tight mb-2">Found Something?</h1>
              <p className="text-gray-400 text-sm text-center leading-relaxed mb-6">
                Please bring the item to the{" "}
                <span className="text-white font-semibold">SAS Office</span>{" "}
                and our staff will log it. The owner will be notified through the Found Items Board.
              </p>

              {/* Info cards */}
              <div className="space-y-3 mb-6">
                <div className="flex items-start gap-3 bg-gray-800/60 border border-white/5 rounded-xl p-3.5">
                  <div className="w-8 h-8 rounded-lg bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center shrink-0">
                    <FaMapMarkerAlt className="text-emerald-400" size={13} />
                  </div>
                  <div>
                    <p className="text-white text-sm font-semibold">SAS Office Location</p>
                    <p className="text-gray-500 text-xs mt-0.5 leading-relaxed">NBSC — Student Affairs & Services Office</p>
                  </div>
                </div>

                <div className="flex items-start gap-3 bg-gray-800/60 border border-white/5 rounded-xl p-3.5">
                  <div className="w-8 h-8 rounded-lg bg-cyan-500/10 border border-cyan-500/20 flex items-center justify-center shrink-0">
                    <FaPhone className="text-cyan-400" size={13} />
                  </div>
                  <div>
                    <p className="text-white text-sm font-semibold">Office Hours</p>
                    <p className="text-gray-500 text-xs mt-0.5">Monday – Friday · 8:00 AM – 5:00 PM</p>
                  </div>
                </div>
              </div>

              <p className="text-gray-700 text-[11px] text-center">
                Thank you for being honest and helping return lost items to their owners.
              </p>
            </div>
          </div>
        </div>
      </section>
    );
  }

  // ── Admin form view ───────────────────────────────────────────────────────
  return (
    <>
      <section className="min-h-screen bg-gray-950 py-6 px-4">
        <div className="w-full max-w-2xl mx-auto">

          {/* Header */}
          <div className="flex items-center justify-between mb-5">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center shrink-0">
                <FaBoxOpen className="text-emerald-400" size={18} />
              </div>
              <div>
                <h1 className="text-white font-bold text-base sm:text-lg tracking-tight leading-none">Submit a Found Item</h1>
                <p className="text-gray-500 text-xs mt-0.5">Log a discovered item into the system</p>
              </div>
            </div>
            <div className="flex gap-2">
              {scannedStudent ? (
                <button onClick={clearScan}
                  className="flex items-center gap-1.5 px-3 py-1.5 bg-red-500/10 hover:bg-red-500/20 border border-red-500/20 text-red-400 text-[10px] font-bold rounded-lg transition-all">
                  <FaTimes size={9} /> Clear Scan
                </button>
              ) : (
                <button onClick={() => setShowScanner(true)}
                  className="flex items-center gap-1.5 px-3 py-1.5 bg-emerald-500/10 hover:bg-emerald-500/20 border border-emerald-500/20 text-emerald-400 text-[10px] font-bold rounded-lg transition-all">
                  <FaQrcode size={10} /> Scan ID
                </button>
              )}
            </div>
          </div>

          {/* Scanned student banner */}
          {scannedStudent && (
            <div className="flex items-center justify-between gap-3 bg-emerald-500/5 border border-emerald-500/20 rounded-xl p-3.5 mb-4">
              <div className="flex items-center gap-3 min-w-0">
                <div className="w-8 h-8 rounded-lg bg-emerald-500/15 border border-emerald-500/20 flex items-center justify-center shrink-0">
                  <FaUserCheck size={14} className="text-emerald-400" />
                </div>
                <div className="min-w-0">
                  <p className="text-white text-sm font-semibold truncate">{scannedStudent.name}</p>
                  <p className="text-emerald-400/70 text-[10px] font-mono mt-0.5">ID: {scannedStudent.id}</p>
                </div>
              </div>
              <button onClick={clearScan}
                className="w-7 h-7 flex items-center justify-center rounded-lg bg-red-500/10 hover:bg-red-500/20 text-red-400 transition-all shrink-0">
                <FaTimes size={11} />
              </button>
            </div>
          )}

          {/* Main form card */}
          <div className="bg-gray-900 border border-white/5 rounded-2xl overflow-hidden">
            <div className="h-0.5 w-full bg-gradient-to-r from-emerald-500/60 via-teal-400/40 to-transparent" />

            <form onSubmit={handleSubmit(onSubmit)} className="p-4 sm:p-6 space-y-5">

              {/* ── Section: Finder Info ── */}
              <div>
                <div className="flex items-center gap-2 mb-3">
                  <div className="w-5 h-5 rounded-md bg-cyan-500/10 border border-cyan-500/20 flex items-center justify-center">
                    <IconUser size={11} />
                  </div>
                  <p className="text-[10px] font-bold text-gray-500 uppercase tracking-widest">Finder Information</p>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  {/* Name */}
                  <div>
                    <Label>Your Name *</Label>
                    <div className={`flex items-center gap-2 ${inputCls} !px-3`}>
                      <span className="text-gray-600 shrink-0"><IconUser size={13} /></span>
                      <input {...register("reporterName", { required: "Finder's name is required" })}
                        type="text" className="bg-transparent border-none p-0 w-full focus:ring-0 text-sm placeholder-gray-600"
                        placeholder="Full name or scan ID" />
                    </div>
                    {errors.reporterName && <p className="text-red-400 text-[11px] mt-1">{errors.reporterName?.message as string}</p>}
                  </div>

                  {/* Email */}
                  <div>
                    <Label>Institutional Email *</Label>
                    <div className={`flex items-center gap-2 ${inputCls} !px-3`}>
                      <span className="text-gray-600 shrink-0"><IconMail size={13} /></span>
                      <input {...register("schoolEmail", { required: "School email is required", pattern: { value: /^[^\s@]+@nbsc\.edu\.ph$/i, message: "Must be a valid NBSC email" } })}
                        type="email" autoComplete="off" className="bg-transparent border-none p-0 w-full focus:ring-0 text-sm placeholder-gray-600"
                        placeholder="you@nbsc.edu.ph" />
                    </div>
                    {errors.schoolEmail && <p className="text-red-400 text-[11px] mt-1">{errors.schoolEmail.message as string}</p>}
                  </div>

                  {/* Department — full width */}
                  <div className="sm:col-span-2">
                    <Label>Department / Course</Label>
                    <div className={`flex items-center gap-2 ${inputCls} !px-3 opacity-70`}>
                      <span className="text-gray-600 shrink-0"><IconBuilding size={13} /></span>
                      <input {...register("department")} type="text" readOnly
                        className="bg-transparent border-none p-0 w-full focus:ring-0 text-sm italic placeholder-gray-600"
                        placeholder="Auto-filled from masterlist…" />
                    </div>
                  </div>
                </div>

                {/* Fetch / Scan row */}
                <div className="flex items-center justify-end gap-2 mt-2.5">
                  <button type="button" onClick={handleFetchDetails} disabled={isFetchingByDetails}
                    className="flex items-center gap-1.5 px-2.5 py-1.5 bg-white/5 hover:bg-white/10 border border-white/[0.07] text-gray-400 hover:text-white text-[10px] font-bold rounded-lg transition-all uppercase tracking-wider disabled:opacity-50">
                    {isFetchingByDetails ? <FaSpinner className="animate-spin" size={8} /> : <FaSearch size={8} />}
                    Fetch Info
                  </button>
                  <button type="button" onClick={() => setShowScanner(true)}
                    className="flex items-center gap-1.5 px-2.5 py-1.5 bg-emerald-500/10 hover:bg-emerald-500/20 border border-emerald-500/20 text-emerald-400 text-[10px] font-bold rounded-lg transition-all uppercase tracking-wider">
                    <FaQrcode size={9} /> Scan Student ID
                  </button>
                </div>
              </div>

              <div className="border-t border-white/[0.05]" />

              {/* ── Section: Item Details ── */}
              <div>
                <div className="flex items-center gap-2 mb-3">
                  <div className="w-5 h-5 rounded-md bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center">
                    <FaBoxOpen size={9} className="text-emerald-400" />
                  </div>
                  <p className="text-[10px] font-bold text-gray-500 uppercase tracking-widest">Item Details</p>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  {/* Item Name */}
                  <div>
                    <Label>Item Name *</Label>
                    <input type="text" className={inputCls} placeholder="e.g. Black Casio Calculator"
                      {...register("foundItemName", { required: "Item name is required" })} />
                    {errors.foundItemName && <p className="text-red-400 text-[11px] mt-1">{errors.foundItemName?.message as string}</p>}
                  </div>

                  {/* Category */}
                  <div>
                    <div className="flex items-center gap-1.5 mb-1.5">
                      <Label>Item Category *</Label>
                      <button type="button" onClick={() => setShowCategoryHelp(true)}
                        className="w-4 h-4 rounded-full bg-gray-700 hover:bg-gray-600 border border-gray-600 text-gray-400 hover:text-white flex items-center justify-center transition-all mb-1.5">
                        <span className="text-[9px] font-black leading-none">i</span>
                      </button>
                    </div>
                    <div className="relative">
                      <select className={`${inputCls} appearance-none cursor-pointer pr-8`}
                        value={selectedMenucategoryId}
                        onChange={(e) => {
                          const cat = Category?.data?.find((c: any) => c.id === e.target.value);
                          if (cat) handleMenuChange(cat.name, cat.id);
                        }}>
                        <option value="" disabled className="text-gray-500 bg-gray-900">Select a category</option>
                        {Category?.data?.map((cat: any) => (
                          <option key={cat.id} value={cat.id} className="text-white bg-gray-900">{cat.name}</option>
                        ))}
                      </select>
                      <div className="pointer-events-none absolute inset-y-0 right-3 flex items-center text-gray-500">
                        <svg className="fill-current h-3.5 w-3.5" viewBox="0 0 20 20"><path d="M9.293 12.95l.707.707L15.657 8l-1.414-1.414L10 10.828 5.757 6.586 4.343 8z" /></svg>
                      </div>
                    </div>
                    {!selectedMenu && <p className="text-red-400 text-[11px] mt-1">Category is required</p>}
                  </div>

                  {/* Description — full width */}
                  <div className="sm:col-span-2">
                    <Label>Description</Label>
                    <input type="text" className={inputCls} placeholder="Color, brand, size, markings…"
                      {...register("description", { required: "Description is required" })} />
                    {errors.description && <p className="text-red-400 text-[11px] mt-1">{errors.description?.message as string}</p>}
                  </div>

                  {/* Location */}
                  <div>
                    <Label>Where Found *</Label>
                    <Controller name="location" control={control} rules={{ required: "Location is required" }}
                      render={({ field }) => (
                        <LocationAutocomplete value={field.value || ""} onChange={field.onChange} onBlur={field.onBlur}
                          className={inputCls} placeholder="e.g. Library, Canteen, Room 205" />
                      )} />
                    {errors.location && <p className="text-red-400 text-[11px] mt-1">{errors.location?.message as string}</p>}
                  </div>

                  {/* Date Found */}
                  <div>
                    <Label>Date Found *</Label>
                    <DatePicker wrapperClassName="w-full"
                      className={inputCls}
                      selected={startDate} onChange={(date: any) => setStartDate(date)}
                      dateFormat="yyyy-MM-dd" placeholderText="Select date"
                      showYearDropdown showMonthDropdown dropdownMode="select" maxDate={new Date()} />
                  </div>

                  {/* Claim Instructions — full width */}
                  <div className="sm:col-span-2">
                    <Label>Claim Instructions *</Label>
                    <input type="text" className={inputCls} placeholder="e.g. Visit the SAS office with valid ID"
                      {...register("claimProcess", { required: "Claim instructions are required" })} />
                    {errors.claimProcess && <p className="text-red-400 text-[11px] mt-1">{errors.claimProcess?.message as string}</p>}
                  </div>
                </div>
              </div>

              <div className="border-t border-white/[0.05]" />

              {/* ── Section: Photos ── */}
              <div>
                <div className="flex items-center gap-2 mb-3">
                  <div className="w-5 h-5 rounded-md bg-blue-500/10 border border-blue-500/20 flex items-center justify-center">
                    <FaImage size={9} className="text-blue-400" />
                  </div>
                  <p className="text-[10px] font-bold text-gray-500 uppercase tracking-widest">
                    Item Photos <span className="normal-case font-normal text-gray-600">(up to {MAX_IMAGES})</span>
                  </p>
                </div>

                {/* Drop zone */}
                <div
                  className={`border-2 border-dashed rounded-xl p-5 text-center cursor-pointer transition-all duration-200 ${
                    isDragging
                      ? "border-emerald-500/60 bg-emerald-500/5"
                      : "border-white/[0.07] bg-gray-800/40 hover:border-emerald-500/30 hover:bg-gray-800/60"
                  }`}
                  onClick={() => fileInputRef.current?.click()}
                  onDragOver={(e) => { e.preventDefault(); setIsDragging(true); }}
                  onDragLeave={() => setIsDragging(false)}
                  onDrop={(e) => { e.preventDefault(); setIsDragging(false); handleFileChange(e.dataTransfer.files); }}>
                  <input ref={fileInputRef} type="file" accept="image/*" multiple className="hidden"
                    onChange={(e) => handleFileChange(e.target.files)} />
                  <FaImage size={20} className="text-gray-700 mx-auto mb-2" />
                  <p className="text-gray-400 text-sm">
                    <span className="text-emerald-400 font-semibold">Click to upload</span> or drag & drop
                  </p>
                  <p className="text-gray-600 text-xs mt-1">
                    JPG, PNG, WEBP · Max {MAX_SIZE_MB}MB each · {selectedFiles.length}/{MAX_IMAGES} selected
                  </p>
                </div>

                {uploadError && <p className="text-red-400 text-xs mt-1.5">{uploadError}</p>}

                {previews.length > 0 && (
                  <div className="mt-3">
                    <div className="grid grid-cols-3 sm:grid-cols-6 gap-2">
                      {previews.map((src, idx) => (
                        <div key={idx}
                          className={`relative rounded-xl overflow-hidden aspect-square border-2 transition-all cursor-pointer ${
                            idx === primaryIdx
                              ? "border-emerald-500 ring-2 ring-emerald-500/20"
                              : "border-white/[0.07] hover:border-white/20"
                          }`}
                          onClick={() => setPrimaryIdx(idx)}>
                          <img src={src} className="w-full h-full object-cover" alt="" />
                          {idx === primaryIdx && (
                            <div className="absolute bottom-0 left-0 right-0 bg-emerald-600/90 text-white text-center text-[9px] font-bold py-0.5">
                              Cover
                            </div>
                          )}
                          <button type="button"
                            onClick={(e) => { e.stopPropagation(); removeFile(idx); }}
                            className="absolute top-1 right-1 w-5 h-5 bg-black/60 hover:bg-red-600 rounded-full text-white text-[10px] flex items-center justify-center transition-colors">
                            ✕
                          </button>
                        </div>
                      ))}
                    </div>
                    <p className="text-gray-600 text-[11px] mt-1.5">Tap a photo to set it as the cover image</p>
                  </div>
                )}
              </div>

              {/* Submit */}
              <div className="pt-1">
                {isBusy ? (
                  <div className="flex justify-center py-3"><Spinner size="md" /></div>
                ) : (
                  <button type="submit"
                    className="w-full flex items-center justify-center gap-2 bg-emerald-600 hover:bg-emerald-500 active:scale-[0.99] text-white font-semibold py-3 px-6 rounded-xl transition-all duration-200 text-sm shadow-lg shadow-emerald-900/30">
                    <FaBoxOpen size={14} /> Submit Found Item
                  </button>
                )}
              </div>

            </form>
          </div>
        </div>
      </section>

      <ToastContainer position="top-right" autoClose={3000} style={{ top: "70px" }} theme="dark"
        toastClassName="!bg-gray-800 !border !border-white/10 !rounded-xl !text-sm !text-white shadow-2xl" />

      {showScanner && (
        <BarcodeScannerModal onScan={handleScan} onClose={() => setShowScanner(false)} useFetchStudent={useFetchStudent} />
      )}

      {showCategoryHelp && (
        <div className="fixed inset-0 bg-black/70 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-gray-900 border border-white/10 rounded-2xl w-full max-w-sm shadow-2xl flex flex-col">
            <div className="flex items-center justify-between px-5 py-4 border-b border-white/5">
              <h3 className="text-sm font-bold text-white flex items-center gap-2">
                <FaTag size={11} className="text-emerald-400" /> About Categories
              </h3>
              <button onClick={() => setShowCategoryHelp(false)}
                className="w-7 h-7 flex items-center justify-center rounded-lg bg-white/5 hover:bg-white/10 text-gray-400 hover:text-white transition-colors">
                <FaTimes size={12} />
              </button>
            </div>
            <div className="px-5 py-5 space-y-4">
              {CATEGORY_HELP_CONTENT.steps.map(({ n, title, desc }) => (
                <div key={n} className="flex gap-3">
                  <div className="shrink-0 w-6 h-6 rounded-full bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 flex items-center justify-center text-[10px] font-black">{n}</div>
                  <div>
                    <p className="text-white text-xs font-semibold">{title}</p>
                    <p className="text-gray-500 text-[11px] mt-0.5 leading-relaxed">{desc}</p>
                  </div>
                </div>
              ))}
              <div className="p-3 rounded-xl bg-emerald-500/5 border border-emerald-500/20">
                <p className="text-gray-400 text-[11px] leading-relaxed">
                  Common categories: <span className="text-emerald-400 font-semibold">bags</span>, <span className="text-emerald-400 font-semibold">calculators</span>, <span className="text-emerald-400 font-semibold">keys</span>, <span className="text-emerald-400 font-semibold">umbrellas</span>, <span className="text-emerald-400 font-semibold">watches</span>.
                </p>
              </div>
            </div>
            <div className="px-5 pb-5 pt-2 border-t border-white/5 flex justify-center">
              <button onClick={() => setShowCategoryHelp(false)}
                className="px-4 py-2 text-[10px] font-bold uppercase tracking-wider text-gray-500 hover:text-gray-300 transition-colors">
                Got it
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
};

export default ReportFoundItem;