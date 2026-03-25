import imageCompression from "browser-image-compression";
import { useForm } from "react-hook-form";
import { Spinner } from "flowbite-react";
import { toast } from "react-toastify";
import { ToastContainer } from "react-toastify";
import { useState, useRef } from "react";
import { useCategoryQuery, useCreateLostItemMutation } from "../../redux/api/api";
import DatePicker from "react-datepicker";
import "react-datepicker/dist/react-datepicker.css";
import ItemMatchSuggestions from "../../components/itemMatch/ItemMatchSuggestions";

const MAX_SIZE_MB = 5;

// ── Reusable field wrapper ──────────────────────────────────────────────────
const Field = ({
  label,
  required,
  error,
  icon,
  children,
}: {
  label: string;
  required?: boolean;
  error?: string;
  icon: React.ReactNode;
  children: React.ReactNode;
}) => (
  <div className="flex flex-col gap-1.5">
    <label className="flex items-center gap-1.5 text-xs font-semibold text-gray-400 uppercase tracking-widest">
      {icon}
      {label}
      {required && <span className="text-red-500 normal-case tracking-normal font-normal">*</span>}
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

// ── Icons ───────────────────────────────────────────────────────────────────
const IconUser = () => (
  <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2" /><circle cx="12" cy="7" r="4" />
  </svg>
);
const IconMail = () => (
  <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <rect width="20" height="16" x="2" y="4" rx="2" /><path d="m22 7-8.97 5.7a1.94 1.94 0 0 1-2.06 0L2 7" />
  </svg>
);
const IconTag = () => (
  <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M12 2H2v10l9.29 9.29a1 1 0 0 0 1.41 0l7.3-7.3a1 1 0 0 0 0-1.41Z" /><path d="M7 7h.01" />
  </svg>
);
const IconText = () => (
  <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z" />
  </svg>
);
const IconPin = () => (
  <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M20 10c0 6-8 12-8 12s-8-6-8-12a8 8 0 0 1 16 0Z" /><circle cx="12" cy="10" r="3" />
  </svg>
);
const IconCalendar = () => (
  <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <rect width="18" height="18" x="3" y="4" rx="2" ry="2" /><line x1="16" x2="16" y1="2" y2="6" /><line x1="8" x2="8" y1="2" y2="6" /><line x1="3" x2="21" y1="10" y2="10" />
  </svg>
);
const IconGrid = () => (
  <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <rect width="7" height="7" x="3" y="3" rx="1" /><rect width="7" height="7" x="14" y="3" rx="1" /><rect width="7" height="7" x="14" y="14" rx="1" /><rect width="7" height="7" x="3" y="14" rx="1" />
  </svg>
);
const IconImage = () => (
  <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <rect width="18" height="18" x="3" y="3" rx="2" ry="2" /><circle cx="9" cy="9" r="2" /><path d="m21 15-3.086-3.086a2 2 0 0 0-2.828 0L6 21" />
  </svg>
);

// ── Step indicator ──────────────────────────────────────────────────────────
const steps = ["Reporter Info", "Item Details", "Photo & Submit"];

const StepIndicator = ({ current }: { current: number }) => (
  <div className="flex items-center justify-center gap-0 mb-8">
    {steps.map((label, i) => (
      <div key={i} className="flex items-center">
        <div className="flex flex-col items-center gap-1">
          <div
            className={`w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold border-2 transition-all duration-300 ${
              i < current
                ? "bg-blue-600 border-blue-600 text-white"
                : i === current
                ? "bg-blue-600/20 border-blue-500 text-blue-400"
                : "bg-gray-800 border-gray-700 text-gray-600"
            }`}
          >
            {i < current ? (
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round">
                <polyline points="20 6 9 17 4 12" />
              </svg>
            ) : (
              i + 1
            )}
          </div>
          <span className={`text-[10px] font-medium whitespace-nowrap ${i === current ? "text-blue-400" : i < current ? "text-gray-400" : "text-gray-600"}`}>
            {label}
          </span>
        </div>
        {i < steps.length - 1 && (
          <div className={`w-16 h-px mx-1 mb-4 transition-all duration-300 ${i < current ? "bg-blue-600" : "bg-gray-700"}`} />
        )}
      </div>
    ))}
  </div>
);

// ── Main component ──────────────────────────────────────────────────────────
const ReportLostItem = () => {
  const { register, formState: { errors }, reset, trigger, getValues } = useForm();

  const [step, setStep] = useState(0);
  const [selectedMenu, setselectedMenu] = useState("");
  const [selectedMenucategoryId, setselectedMenucategoryId] = useState("");
  const [categoryTouched, setCategoryTouched] = useState(false);

  const handleMenuChange = (menuName: string, categoryId: string) => {
    setselectedMenu(menuName);
    setselectedMenucategoryId(categoryId);
  };

  const [createLostItem, { isLoading }] = useCreateLostItemMutation();
  const { data: Category } = useCategoryQuery("");
  const [startDate, setStartDate] = useState(new Date());

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
      const options = { maxSizeMB: 0.4, maxWidthOrHeight: 1200, useWebWorker: true };
      file = await imageCompression(file, options);
    } catch (error) {
      console.error("Image compression error:", error);
    }

    setSelectedFile(file);
    const reader = new FileReader();
    reader.onloadend = () => setPreview(reader.result as string);
    reader.readAsDataURL(file);
  };

  const removeFile = () => {
    setSelectedFile(null);
    setPreview("");
    setUploadError("");
    if (fileInputRef.current) fileInputRef.current.value = "";
  };

  const nextStep = async () => {
    if (step >= 2) return;
    const fields = step === 0
      ? ["reporterName", "schoolEmail"]
      : ["lostItemName", "description", "location"];
    const valid = await trigger(fields as any);
    if (step === 1) {
      setCategoryTouched(true);
      if (!selectedMenucategoryId || !valid) return;
    }
    if (valid) setStep((s) => s + 1);
  };

  const onSubmit = async () => {
    if (!selectedFile) { setUploadError("Please upload a photo of the item."); return; }
    const data = getValues();
    try {
      const res: any = await createLostItem({
        lostItemName: data.lostItemName,
        description: data.description,
        categoryId: selectedMenucategoryId,
        img: preview || "",
        location: data.location,
        date: startDate,
        reporterName: data.reporterName || "",
        schoolEmail: data.schoolEmail || "",
      });
      if (res.error || res?.data?.success === false) { toast.error("Failed to report lost item"); return; }
      toast.success("Lost item reported successfully");
      reset();
      setSelectedFile(null); setPreview(""); setUploadError("");
      setselectedMenu(""); setselectedMenucategoryId("");
      setCategoryTouched(false);
      setStep(0);
    } catch {
      toast.error("Failed to report lost item");
    }
  };

  return (
    <>
      <section className="min-h-screen flex items-center justify-center bg-gray-950 py-10 px-4"
        style={{ backgroundImage: "radial-gradient(ellipse at 60% 0%, rgba(59,130,246,0.07) 0%, transparent 60%)" }}>
        <div className="w-full max-w-2xl mx-auto">

          {/* Card */}
          <div className="bg-gray-900 rounded-2xl shadow-2xl border border-gray-800 overflow-hidden"
            style={{ borderTop: "2px solid #3b82f6", boxShadow: "0 0 30px rgba(59,130,246,0.15), 0 25px 50px rgba(0,0,0,0.5)" }}>

            <div className="p-6 sm:p-10">

              {/* Header */}
              <div className="mb-6 text-center">
                <div className="inline-flex items-center justify-center w-12 h-12 rounded-xl bg-blue-600/15 border border-blue-500/30 mb-4">
                  <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="#60a5fa" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
                    <circle cx="11" cy="11" r="8" /><path d="m21 21-4.3-4.3" /><path d="M11 8v6M8 11h6" />
                  </svg>
                </div>
                <h1 className="text-2xl font-bold text-white tracking-tight">Report a Lost Item</h1>
                <p className="text-gray-500 text-sm mt-1 max-w-sm mx-auto">
                  Help us reunite you with your belongings. Fill in the details carefully.
                </p>
              </div>

              <StepIndicator current={step} />

              <form onSubmit={(e) => e.preventDefault()}>

                {/* ── Step 0: Reporter Info ── */}
                {step === 0 && (
                  <div className="space-y-5">
                    <div className="grid gap-5 sm:grid-cols-2">
                      <Field label="Your Name" required error={errors.reporterName?.message as string} icon={<IconUser />}>
                        <input {...register("reporterName", { required: "Your name is required" })}
                          type="text" className={inputCls} placeholder="e.g. Juan dela Cruz" />
                      </Field>
                      <Field label="Institutional Email" required error={errors.schoolEmail?.message as string} icon={<IconMail />}>
                        <input {...register("schoolEmail", {
                          required: "School email is required",
                          pattern: { value: /^[^\s@]+@nbsc\.edu\.ph$/i, message: "Must be a valid NBSC email" },
                        })} type="email" className={inputCls} placeholder="juan@nbsc.edu.ph" />
                      </Field>
                    </div>
                    <div className="rounded-lg bg-blue-950/40 border border-blue-800/40 px-4 py-3 flex gap-3 items-start">
                      <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#60a5fa" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="mt-0.5 shrink-0">
                        <circle cx="12" cy="12" r="10" /><path d="M12 16v-4M12 8h.01" />
                      </svg>
                      <p className="text-blue-300/80 text-xs leading-relaxed">
                        Your institutional email is required to verify your identity and notify you when your item is found.
                      </p>
                    </div>
                  </div>
                )}

                {/* ── Step 1: Item Details ── */}
                {step === 1 && (
                  <div className="space-y-5">
                    <div className="grid gap-5 sm:grid-cols-2">
                      <Field label="Item Name" required error={errors.lostItemName?.message as string} icon={<IconTag />}>
                        <input {...register("lostItemName", { required: "Item name is required" })}
                          type="text" className={inputCls} placeholder="e.g. Black laptop bag" />
                      </Field>
                      <Field label="Last Seen Location" required error={errors.location?.message as string} icon={<IconPin />}>
                        <input {...register("location", { required: "Location is required" })}
                          type="text" className={inputCls} placeholder="e.g. Library, Room 205" />
                      </Field>
                      <Field label="Date Lost" icon={<IconCalendar />}>
                        <DatePicker wrapperClassName="w-full"
                          className={inputCls}
                          selected={startDate}
                          onChange={(date: any) => setStartDate(date)}
                          dateFormat="MMMM d, yyyy"
                          placeholderText="Select date"
                          showYearDropdown showMonthDropdown dropdownMode="select"
                          maxDate={new Date()} />
                      </Field>
                      <Field label="Item Category" required error={categoryTouched && !selectedMenucategoryId ? "Category is required" : ""} icon={<IconGrid />}>
                        <div className="relative">
                          <select
                            className={`${inputCls} appearance-none pr-10 ${!selectedMenucategoryId ? "text-gray-500" : "text-white"}`}
                            value={selectedMenucategoryId}
                            onChange={(e) => {
                              const cat = Category?.data?.find((c: any) => c.id === e.target.value);
                              if (cat) handleMenuChange(cat.name, cat.id);
                            }}
                          >
                            <option value="" disabled>Select a category</option>
                            {Category?.data?.map((cat: any) => (
                              <option key={cat.id} value={cat.id} className="text-white bg-gray-800">{cat.name}</option>
                            ))}
                          </select>
                          <div className="pointer-events-none absolute inset-y-0 right-3 flex items-center text-gray-400">
                            <svg className="h-4 w-4 fill-current" viewBox="0 0 20 20"><path d="M9.293 12.95l.707.707L15.657 8l-1.414-1.414L10 10.828 5.757 6.586 4.343 8z" /></svg>
                          </div>
                        </div>
                      </Field>
                    </div>
                    <Field label="Description" required error={errors.description?.message as string} icon={<IconText />}>
                      <textarea {...register("description", { required: "Description is required" })}
                        rows={3}
                        className={`${inputCls} resize-none`}
                        placeholder="Describe the item — color, brand, size, distinguishing marks, etc." />
                    </Field>

                    {/* Item match suggestions */}
                    {selectedMenucategoryId && (
                      <ItemMatchSuggestions
                        categoryId={selectedMenucategoryId}
                        categoryName={selectedMenu}
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
                            isDragging ? "border-blue-500 bg-blue-900/10" : "border-gray-700 bg-gray-800/40 hover:border-blue-500/70 hover:bg-gray-800/70"
                          }`}
                          onClick={() => fileInputRef.current?.click()}
                          onDragOver={(e) => { e.preventDefault(); setIsDragging(true); }}
                          onDragLeave={() => setIsDragging(false)}
                          onDrop={(e) => { e.preventDefault(); setIsDragging(false); handleFileChange(e.dataTransfer.files); }}
                        >
                          <input ref={fileInputRef} type="file" accept="image/*" className="hidden" onChange={(e) => handleFileChange(e.target.files)} />
                          <div className="flex flex-col items-center gap-3">
                            <div className="w-14 h-14 rounded-2xl bg-gray-800 border border-gray-700 flex items-center justify-center text-gray-400">
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
                              <button type="button" onClick={() => fileInputRef.current?.click()}
                                className="bg-white/90 hover:bg-white text-gray-900 text-xs font-semibold px-4 py-2 rounded-lg transition-all">Change</button>
                              <button type="button" onClick={removeFile}
                                className="bg-red-600 hover:bg-red-500 text-white text-xs font-semibold px-4 py-2 rounded-lg transition-all">Remove</button>
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

                    {/* Summary card */}
                    <div className="rounded-xl bg-gray-800/50 border border-gray-700/60 p-4 space-y-2">
                      <p className="text-xs font-semibold text-gray-400 uppercase tracking-widest mb-3">Submission Summary</p>
                      {[
                        { label: "Item", value: (document.querySelector('input[name="lostItemName"]') as HTMLInputElement)?.value },
                        { label: "Location", value: (document.querySelector('input[name="location"]') as HTMLInputElement)?.value },
                        { label: "Category", value: selectedMenu },
                        { label: "Date", value: startDate.toLocaleDateString("en-US", { year: "numeric", month: "long", day: "numeric" }) },
                      ].map(({ label, value }) => value ? (
                        <div key={label} className="flex items-center justify-between text-sm">
                          <span className="text-gray-500">{label}</span>
                          <span className="text-gray-200 font-medium text-right max-w-[60%] truncate">{value}</span>
                        </div>
                      ) : null)}
                    </div>
                  </div>
                )}

                {/* ── Navigation ── */}
                <div className={`flex mt-8 gap-3 ${step > 0 ? "justify-between" : "justify-end"}`}>
                  {step > 0 && (
                    <button type="button" onClick={() => setStep((s) => s - 1)}
                      className="px-6 py-2.5 rounded-lg border border-gray-700 text-gray-300 hover:bg-gray-800 hover:text-white text-sm font-medium transition-all duration-200">
                      Back
                    </button>
                  )}
                  {step < 2 ? (
                    <button type="button" onClick={nextStep}
                      className="px-8 py-2.5 rounded-lg bg-blue-600 hover:bg-blue-500 text-white text-sm font-semibold transition-all duration-200 shadow-lg shadow-blue-900/30">
                      Continue
                    </button>
                  ) : isLoading ? (
                    <div className="flex items-center gap-2 px-6 py-2.5 rounded-lg bg-blue-600/50 text-white text-sm font-semibold">
                      <Spinner size="sm" /> Submitting...
                    </div>
                  ) : (
                    <button type="button" onClick={onSubmit}
                      className="px-8 py-2.5 rounded-lg bg-blue-600 hover:bg-blue-500 text-white text-sm font-semibold transition-all duration-200 shadow-lg shadow-blue-900/30">
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
    </>
  );
};

export default ReportLostItem;
