import React, { useState, useCallback, useRef, useEffect } from "react";
import { useDropzone } from "react-dropzone";
import imageCompression from "browser-image-compression";
import { toast } from "react-toastify";
import {
  useAiRecognizeMutation,
  useCreateFoundItemMutation,
  useCategoryQuery,
} from "../../redux/api/api";
import LocationAutocomplete from "../../components/ui/LocationAutocomplete";
import { CustomDatePicker } from "../../components/ui/CustomDatePicker";
import {
  FaUpload, FaSpinner, FaCheckCircle, FaTimesCircle,
  FaTrash, FaBolt, FaBoxOpen, FaSearch, FaRedo, FaExclamationTriangle,
  FaMicrochip, FaTimes, FaMapMarkerAlt, FaCalendarAlt, FaClipboardList,
  FaUser, FaEnvelope, FaTag, FaCheck, FaChevronDown, FaLayerGroup,
} from "react-icons/fa";

// ─────────────────────────────────────────────────────────────────────────────
// Batch entry types
// ─────────────────────────────────────────────────────────────────────────────
interface ProcessedItem {
  id: string;
  file: File;
  previewUrl: string;
  status: "pending" | "analyzing" | "uploading" | "success" | "error";
  resultDetails?: any;
  errorMessage?: string;
}

const StatusBadge = ({ status }: { status: ProcessedItem["status"] }) => {
  const map = {
    pending: { label: "Queued", cls: "bg-gray-500/10 text-gray-400 border-gray-500/20" },
    analyzing: { label: "Analyzing", cls: "bg-blue-500/10 text-blue-400 border-blue-500/20" },
    uploading: { label: "Saving", cls: "bg-violet-500/10 text-violet-400 border-violet-500/20" },
    success: { label: "Done", cls: "bg-emerald-500/10 text-emerald-400 border-emerald-500/20" },
    error: { label: "Error", cls: "bg-red-500/10 text-red-400 border-red-500/20" },
  };
  const { label, cls } = map[status];
  return (
    <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold border ${cls}`}>
      {(status === "analyzing" || status === "uploading") && <FaSpinner className="animate-spin" size={8} />}
      {status === "success" && <FaCheckCircle size={8} />}
      {status === "error" && <FaTimesCircle size={8} />}
      {label}
    </span>
  );
};

// ─────────────────────────────────────────────────────────────────────────────
// Smart Entry types & helpers
// ─────────────────────────────────────────────────────────────────────────────
interface AiResult {
  itemName: string;
  categoryId: string;
  categoryName: string;
  description: string;
  color?: string;
  condition?: string;
  confidence?: number;
}

type ScanState = "idle" | "scanning" | "detected" | "done" | "error";

interface BoundingChip {
  label: string;
  value: string;
  top: string;
  left: string;
  color: string;
  delay: number;
}

const buildChips = (result: AiResult): BoundingChip[] => [
  { label: "Item", value: result.itemName, top: "8%", left: "6%", color: "cyan", delay: 0 },
  { label: "Category", value: result.categoryName, top: "23%", left: "6%", color: "violet", delay: 220 },
  ...(result.color ? [{ label: "Color", value: result.color, top: "38%", left: "6%", color: "amber", delay: 440 } as BoundingChip] : []),
  ...(result.condition ? [{ label: "Condition", value: result.condition, top: "53%", left: "6%", color: "emerald", delay: 660 } as BoundingChip] : []),
  { label: "Confidence", value: `${Math.round((result.confidence ?? 0.9) * 100)}%`, top: "68%", left: "6%", color: "rose", delay: 880 },
];

const chipColors: Record<string, { border: string; bg: string; text: string; dot: string }> = {
  cyan: { border: "border-cyan-400/60", bg: "bg-cyan-500/15", text: "text-cyan-300", dot: "bg-cyan-400" },
  violet: { border: "border-violet-400/60", bg: "bg-violet-500/15", text: "text-violet-300", dot: "bg-violet-400" },
  amber: { border: "border-amber-400/60", bg: "bg-amber-500/15", text: "text-amber-300", dot: "bg-amber-400" },
  emerald: { border: "border-emerald-400/60", bg: "bg-emerald-500/15", text: "text-emerald-300", dot: "bg-emerald-400" },
  rose: { border: "border-rose-400/60", bg: "bg-rose-500/15", text: "text-rose-300", dot: "bg-rose-400" },
};

// Typewriter hook
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

// Scanning line overlay
const ScanLine = () => (
  <div className="absolute left-0 right-0 h-[2px] pointer-events-none z-20" style={{ animation: "scan-line 2s ease-in-out infinite" }}>
    <div className="h-full bg-gradient-to-r from-transparent via-cyan-400 to-transparent opacity-80" />
  </div>
);

// Category dropdown
const CategoryDropdown = ({
  value, onChange, options, highlight,
}: {
  value: string; onChange: (id: string, name: string) => void;
  options: { id: string; name: string }[]; highlight: boolean;
}) => {
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);
  useEffect(() => {
    const h = (e: MouseEvent) => { if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false); };
    document.addEventListener("mousedown", h);
    return () => document.removeEventListener("mousedown", h);
  }, []);
  const selected = options.find(o => o.id === value);
  return (
    <div ref={ref} className="relative">
      <button type="button" onClick={() => setOpen(o => !o)}
        className={`w-full flex items-center justify-between px-3 py-2 bg-transparent text-sm focus:outline-none ${highlight ? "text-violet-300" : "text-white"}`}>
        <span className="truncate text-left">{selected?.name ?? "Select category…"}</span>
        <FaChevronDown size={10} className={`text-gray-400 shrink-0 ml-2 transition-transform ${open ? "rotate-180" : ""}`} />
      </button>
      {open && (
        <div className="absolute z-50 top-full mt-1 left-0 right-0 bg-gray-900 border border-white/10 rounded-xl shadow-2xl overflow-hidden">
          <div className="max-h-48 overflow-y-auto">
            {options.map(opt => (
              <button key={opt.id} type="button"
                onClick={() => { onChange(opt.id, opt.name); setOpen(false); }}
                className={`w-full text-left px-3 py-2 text-sm flex items-center justify-between transition-colors ${value === opt.id ? "bg-white/5 text-white font-semibold" : "text-gray-400 hover:bg-white/[0.04] hover:text-white"}`}>
                {opt.name}
                {value === opt.id && <FaCheck size={9} className="text-violet-400 shrink-0" />}
              </button>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};

// ─────────────────────────────────────────────────────────────────────────────
// Main Component
// ─────────────────────────────────────────────────────────────────────────────
const BulkScanner = () => {
  const [activeTab, setActiveTab] = useState<"smart" | "batch">("smart");

  // ── Shared API hooks ──────────────────────────────────────────────────────
  const [aiRecognize] = useAiRecognizeMutation();
  const [createFoundItem] = useCreateFoundItemMutation();
  const { data: categoriesData } = useCategoryQuery({});
  const categories: { id: string; name: string }[] = categoriesData?.data ?? [];

  // ══════════════════════════════════════════════════════════════════════════
  // SMART ENTRY STATE
  // ══════════════════════════════════════════════════════════════════════════
  const [sImageFile, setSImageFile] = useState<File | null>(null);
  const [sImageUrl, setSImageUrl] = useState<string | null>(null);
  const [sScanState, setSScanState] = useState<ScanState>("idle");
  const [sAiResult, setSAiResult] = useState<AiResult | null>(null);
  const [sChips, setSChips] = useState<BoundingChip[]>([]);
  const [sVisChips, setSVisChips] = useState<boolean[]>([]);
  const [sHighlight, setSHighlight] = useState<string | null>(null);
  const [sSubmitting, setSSubmitting] = useState(false);
  const [sSubmitted, setSSubmitted] = useState(false);
  // form fields
  const [sName, setSName] = useState("");
  const [sCatId, setSCatId] = useState("");
  const [sDesc, setSDesc] = useState("");
  const [sLocation, setSLocation] = useState("SAS Office");
  const [sDate, setSDate] = useState(new Date().toISOString().split("T")[0]);
  const [sReporter, setSReporter] = useState("Admin - SAS Office");
  const [sEmail, setSEmail] = useState("");

  const typewriter = useTypewriter();

  const sDrop = useCallback((files: File[]) => {
    if (!files.length) return;
    const file = files[0];
    setSImageFile(file);
    setSImageUrl(URL.createObjectURL(file));
    setSScanState("idle");
    setSAiResult(null); setSChips([]); setSVisChips([]);
    setSName(""); setSCatId(""); setSDesc(""); setSSubmitted(false);
  }, []);

  const { getRootProps: sGetRoot, getInputProps: sGetInput, isDragActive: sDrag } = useDropzone({
    onDrop: sDrop, accept: { "image/*": [] }, maxFiles: 1, disabled: sScanState === "scanning",
  });

  const sClear = () => {
    setSImageFile(null); setSImageUrl(null); setSScanState("idle");
    setSAiResult(null); setSChips([]); setSVisChips([]);
    setSName(""); setSCatId(""); setSDesc(""); setSSubmitted(false);
  };

  const runScan = async () => {
    if (!sImageFile) return;
    setSScanState("scanning"); setSChips([]); setSVisChips([]);
    setSName(""); setSCatId(""); setSDesc("");

    try {
      const compressed = await imageCompression(sImageFile, { maxSizeMB: 0.3, maxWidthOrHeight: 900, useWebWorker: true });
      const formData = new FormData();
      const hasExt = /\.(jpg|jpeg|png|gif|webp)$/i.test(sImageFile.name);
      const fname = hasExt ? sImageFile.name : `${sImageFile.name.replace(/\.[^/.]+$/, "") || "image"}.jpg`;
      formData.append("image", compressed, fname);

      const res = await aiRecognize(formData).unwrap();
      if (!res.success || !res.data) throw new Error("AI could not extract data.");

      const result: AiResult = res.data;
      setSAiResult(result);
      setSScanState("detected");

      const newChips = buildChips(result);
      setSChips(newChips);
      setSVisChips(new Array(newChips.length).fill(false));
      newChips.forEach((chip, idx) => {
        setTimeout(() => setSVisChips(prev => { const n = [...prev]; n[idx] = true; return n; }), chip.delay);
      });

      const fillDelay = (newChips[newChips.length - 1]?.delay ?? 880) + 600;
      setTimeout(() => {
        setSScanState("done");
        // 1. Item name typewriter
        setSHighlight("name");
        typewriter(setSName, result.itemName, () => {
          setSHighlight(null);
          // 2. Category flash
          setTimeout(() => {
            setSHighlight("cat");
            setSCatId(result.categoryId ?? "");
            setTimeout(() => {
              setSHighlight(null);
              // 3. Description typewriter
              const fullDesc = [result.description, result.color ? `Color: ${result.color}.` : "", result.condition ? `Condition: ${result.condition}.` : ""]
                .filter(Boolean).join(" ");
              setTimeout(() => {
                setSHighlight("desc");
                typewriter(setSDesc, fullDesc, () => { setSHighlight(null); toast.success(" AI auto-filled the form."); }, 12);
              }, 300);
            }, 700);
          }, 400);
        });
      }, fillDelay);
    } catch (err: any) {
      setSScanState("error");
      toast.error(err.message || "AI scan failed. Please try again.");
    }
  };

  const handleSmartSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!sName.trim()) { toast.error("Item name is required."); return; }
    if (!sLocation.trim()) { toast.error("Location is required."); return; }
    setSSubmitting(true);
    try {
      const compressed = await imageCompression(sImageFile!, { maxSizeMB: 0.3, maxWidthOrHeight: 900, useWebWorker: true });
      const base64: string = await new Promise(resolve => {
        const r = new FileReader(); r.onloadend = () => resolve(r.result as string); r.readAsDataURL(compressed);
      });
      const res: any = await createFoundItem({
        foundItemName: sName, description: sDesc, categoryId: sCatId || null,
        img: base64, location: sLocation, date: new Date(sDate).toISOString(),
        reporterName: sReporter, schoolEmail: sEmail,
      });
      if (res.error || res?.data?.success === false) throw new Error("Failed to save item.");
      toast.success("🎉 Item registered successfully!");
      setSSubmitted(true);
      setTimeout(() => { sClear(); setSLocation("SAS Office"); setSDate(new Date().toISOString().split("T")[0]); setSReporter("Admin - SAS Office"); setSEmail(""); setSSubmitted(false); }, 2500);
    } catch (err: any) {
      toast.error(err.message || "Failed to submit item.");
    } finally { setSSubmitting(false); }
  };

  const sGlow = (field: string) =>
    sHighlight === field ? "ring-2 ring-blue-500/50 bg-blue-500/5 border-blue-500/40" : "";

  // ══════════════════════════════════════════════════════════════════════════
  // BATCH ENTRY STATE  (original logic, unchanged)
  // ══════════════════════════════════════════════════════════════════════════
  const [items, setItems] = useState<ProcessedItem[]>([]);
  const [isProcessing, setIsProcessing] = useState(false);
  const [batchLocation, setBatchLocation] = useState("SAS Office");
  const [batchSummary, setBatchSummary] = useState<{ success: number; failed: number } | null>(null);
  const itemsRef = useRef<ProcessedItem[]>([]);
  const locationRef = useRef("SAS Office");

  const updateItems = useCallback((action: React.SetStateAction<ProcessedItem[]>) => {
    setItems(prev => {
      const next = typeof action === "function" ? action(prev) : action;
      itemsRef.current = next; return next;
    });
  }, []);

  const updateLocation = useCallback((val: string) => { locationRef.current = val; setBatchLocation(val); }, []);
  const removeFile = (id: string) => updateItems(prev => prev.filter(i => i.id !== id));
  const clearAll = () => updateItems([]);
  const clearCompleted = () => updateItems(prev => prev.filter(i => i.status !== "success"));

  const bDrop = useCallback((acceptedFiles: File[]) => {
    const newItems: ProcessedItem[] = acceptedFiles.map(file => ({
      id: Math.random().toString(36).substring(7), file,
      previewUrl: URL.createObjectURL(file), status: "pending" as const,
    }));
    updateItems(prev => [...prev, ...newItems]);
  }, [updateItems]);

  const { getRootProps: bGetRoot, getInputProps: bGetInput, isDragActive: bDrag } = useDropzone({
    onDrop: bDrop, accept: { "image/*": [] }, disabled: isProcessing,
  });

  const processItem = async (itemId: string): Promise<boolean> => {
    const item = itemsRef.current.find(i => i.id === itemId);
    if (!item) return false;
    updateItems(prev => prev.map(p => p.id === itemId ? { ...p, status: "analyzing", errorMessage: undefined } : p));
    try {
      const compressed = await imageCompression(item.file, { maxSizeMB: 0.2, maxWidthOrHeight: 800, useWebWorker: true });
      const base64: string = await new Promise(resolve => {
        const r = new FileReader(); r.onloadend = () => resolve(r.result as string); r.readAsDataURL(compressed);
      });
      const formData = new FormData();
      const hasExt = /\.(jpg|jpeg|png|gif|webp)$/i.test(item.file.name);
      const fname = hasExt ? item.file.name : `${item.file.name.replace(/\.[^/.]+$/, "") || "image"}.jpg`;
      formData.append("image", compressed, fname);
      const aiRes = await aiRecognize(formData).unwrap();
      if (!aiRes.success || !aiRes.data) throw new Error("AI could not extract tags.");

      const aiData = aiRes.data;
      updateItems(prev => prev.map(p => p.id === itemId ? { ...p, status: "uploading", resultDetails: aiData } : p));
      const createRes: any = await createFoundItem({
        foundItemName: aiData.itemName || "Unknown Item",
        description: aiData.description || "Found via Batch Entry.",
        categoryId: aiData.categoryId || null,
        img: base64,
        location: locationRef.current || "Unknown Location",
        date: new Date().toISOString(),
        reporterName: "Admin Scanner",
        schoolEmail: "",
      });
      if (createRes.error || createRes?.data?.success === false) throw new Error("Failed to save item to database.");
      updateItems(prev => prev.map(p => p.id === itemId ? { ...p, status: "success" } : p));
      return true;
    } catch (err: any) {
      updateItems(prev => prev.map(p => p.id === itemId ? { ...p, status: "error", errorMessage: err.message || "Unknown error" } : p));
      return false;
    }
  };

  const processAll = async () => {
    const toProcess = itemsRef.current.filter(i => i.status === "pending" || i.status === "error");
    if (!toProcess.length) { toast.info("No new images to process."); return; }
    setIsProcessing(true); setBatchSummary(null);
    let ok = 0, fail = 0;
    for (const item of toProcess) { if (await processItem(item.id)) ok++; else fail++; }
    setIsProcessing(false); setBatchSummary({ success: ok, failed: fail });
    if (fail === 0) toast.success(`All ${ok} image${ok !== 1 ? "s" : ""} processed successfully.`);
    else if (ok === 0) toast.error(`All ${fail} image${fail !== 1 ? "s" : ""} failed.`);
    else toast.warn(`${ok} succeeded, ${fail} failed.`);
  };

  const retryFailed = async () => {
    const failed = itemsRef.current.filter(i => i.status === "error");
    if (!failed.length) { toast.info("No failed items to retry."); return; }
    setIsProcessing(true); setBatchSummary(null);
    let ok = 0, fail = 0;
    for (const item of failed) { if (await processItem(item.id)) ok++; else fail++; }
    setIsProcessing(false); setBatchSummary({ success: ok, failed: fail });
    if (fail === 0) toast.success(`Retry complete — all ${ok} saved.`);
    else toast.warn(`Retry done: ${ok} succeeded, ${fail} still failing.`);
  };

  const retrySingle = async (itemId: string) => {
    setIsProcessing(true);
    const ok = await processItem(itemId);
    setIsProcessing(false);
    if (ok) toast.success("Item saved successfully."); else toast.error("Item still failed.");
  };

  const total = items.length;
  const done = items.filter(i => i.status === "success").length;
  const pending = items.filter(i => i.status === "pending").length;
  const errored = items.filter(i => i.status === "error").length;

  // ─────────────────────────────────────────────────────────────────────────
  // RENDER
  // ─────────────────────────────────────────────────────────────────────────
  return (
    <>
      {/* Keyframes */}
      <style>{`
        @keyframes scan-line { 0%{top:5%} 50%{top:90%} 100%{top:5%} }
        @keyframes chip-in   { from{opacity:0;transform:translateX(-10px) scale(.92)} to{opacity:1;transform:translateX(0) scale(1)} }
        @keyframes bbox-pulse{ 0%,100%{box-shadow:0 0 0 0 rgba(34,211,238,0)} 50%{box-shadow:0 0 12px 2px rgba(34,211,238,.25)} }
        .chip-in { animation: chip-in .35s cubic-bezier(.22,1,.36,1) forwards; }
        .chip-hidden { opacity:0; }
      `}</style>

      <div className="space-y-4 sm:space-y-5 max-w-7xl mx-auto">

        {/* ── Tab Switcher ── */}
        <div className="flex items-center gap-1 bg-gray-900 border border-white/5 rounded-2xl p-1 w-fit">
          <button
            onClick={() => setActiveTab("smart")}
            className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold transition-all ${activeTab === "smart"
              ? "bg-gradient-to-r from-violet-600 to-cyan-600 text-white shadow-lg shadow-violet-900/30"
              : "text-gray-400 hover:text-white"
              }`}
          >
            <FaMicrochip size={11} /> Smart Entry
          </button>
          <button
            onClick={() => setActiveTab("batch")}
            className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold transition-all ${activeTab === "batch"
              ? "bg-blue-600 text-white shadow-lg shadow-blue-900/30"
              : "text-gray-400 hover:text-white"
              }`}
          >
            <FaLayerGroup size={11} /> Batch Entry
          </button>
        </div>

        {/* ════════════════════════════════════════════════════════════════════
            SMART ENTRY TAB
        ════════════════════════════════════════════════════════════════════ */}
        {activeTab === "smart" && (
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 sm:gap-5">

            {/* ── Left: Image Analyzer ── */}
            <div className="bg-gray-900 border border-white/5 rounded-2xl overflow-visible flex flex-col">
              <div className="flex items-center justify-between px-4 py-3 border-b border-white/5">
                <div className="flex items-center gap-2">
                  <div className="w-1.5 h-1.5 rounded-full bg-blue-400 animate-pulse" />
                  <span className="text-[11px] font-bold text-blue-400 uppercase tracking-widest">Image Analyzer</span>
                </div>
                {sImageUrl && sScanState !== "scanning" && (
                  <button onClick={sClear} className="w-6 h-6 rounded-lg bg-white/5 hover:bg-white/10 flex items-center justify-center text-gray-500 hover:text-white transition-colors">
                    <FaTimes size={10} />
                  </button>
                )}
              </div>

              <div className="flex-1 p-4 flex flex-col gap-3">
                {!sImageUrl ? (
                  <div {...sGetRoot()}
                    className={`flex-1 min-h-[260px] border-2 border-dashed rounded-xl flex flex-col items-center justify-center gap-3 cursor-pointer transition-all ${sDrag ? "border-cyan-400/60 bg-cyan-500/5" : "border-white/10 hover:border-white/20 hover:bg-white/[0.02]"
                      }`}>
                    <input {...sGetInput()} />
                    <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-cyan-500/10 to-violet-500/10 border border-white/10 flex items-center justify-center">
                      <FaUpload size={18} className="text-gray-400" />
                    </div>
                    <div className="text-center">
                      <p className="text-white text-sm font-semibold">{sDrag ? "Drop image here" : "Upload item image"}</p>
                      <p className="text-gray-500 text-xs mt-1">Drag & drop or click to browse</p>
                      <p className="text-gray-600 text-[10px] mt-1">JPG, PNG, WebP — 1 image at a time</p>
                    </div>
                  </div>
                ) : (
                  <div className="relative rounded-xl overflow-hidden bg-gray-900 flex-1 min-h-[320px] h-[320px]">
                    <img src={sImageUrl} alt="Uploaded item" className="absolute inset-0 w-full h-full object-cover" />

                    {/* Scan line */}
                    {sScanState === "scanning" && <ScanLine />}

                    {/* Scanning overlay */}
                    {sScanState === "scanning" && (
                      <div className="absolute inset-0 bg-black/30 flex items-center justify-center">
                        <div className="bg-gray-900/90 border border-cyan-400/30 rounded-xl px-4 py-3 flex items-center gap-3 backdrop-blur-sm">
                          <FaSpinner className="animate-spin text-cyan-400" size={14} />
                          <span className="text-cyan-300 text-xs font-bold tracking-wide">AI Scanning…</span>
                        </div>
                      </div>
                    )}

                    {/* Corner brackets */}
                    {(sScanState === "detected" || sScanState === "done") && (
                      <>
                        <div className="absolute top-3 left-3 w-6 h-6 border-t-2 border-l-2 border-cyan-400/70 rounded-tl pointer-events-none" />
                        <div className="absolute top-3 right-3 w-6 h-6 border-t-2 border-r-2 border-cyan-400/70 rounded-tr pointer-events-none" />
                        <div className="absolute bottom-3 left-3 w-6 h-6 border-b-2 border-l-2 border-cyan-400/70 rounded-bl pointer-events-none" />
                        <div className="absolute bottom-3 right-3 w-6 h-6 border-b-2 border-r-2 border-cyan-400/70 rounded-br pointer-events-none" />
                      </>
                    )}

                    {/* Bounding chips */}
                    {sChips.map((chip, idx) => {
                      const c = chipColors[chip.color] ?? chipColors.cyan;
                      return (
                        <div key={chip.label}
                          className={`absolute z-10 flex items-center gap-1.5 px-2 py-1 rounded-lg border ${c.border} ${c.bg} backdrop-blur-sm ${sVisChips[idx] ? "chip-in" : "chip-hidden"}`}
                          style={{ top: chip.top, left: chip.left }}>
                          <div className={`w-1.5 h-1.5 rounded-full ${c.dot} animate-pulse`} />
                          <span className={`text-[9px] font-bold uppercase tracking-wide ${c.text}`}>{chip.label}</span>
                          <span className="text-white text-[10px] font-semibold max-w-[100px] truncate">{chip.value}</span>
                        </div>
                      );
                    })}

                    {/* Done badge */}
                    {sScanState === "done" && (
                      <div className="absolute bottom-3 right-3 flex items-center gap-1.5 px-2.5 py-1.5 bg-emerald-500/20 border border-emerald-400/40 rounded-lg backdrop-blur-sm">
                        <FaCheckCircle size={10} className="text-emerald-400" />
                        <span className="text-emerald-300 text-[10px] font-bold">Detected</span>
                      </div>
                    )}
                    {sScanState === "error" && (
                      <div className="absolute bottom-3 right-3 flex items-center gap-1.5 px-2.5 py-1.5 bg-red-500/20 border border-red-400/40 rounded-lg backdrop-blur-sm">
                        <FaTimes size={10} className="text-red-400" />
                        <span className="text-red-300 text-[10px] font-bold">Scan Failed</span>
                      </div>
                    )}
                  </div>
                )}

                {/* Scan button */}
                {sImageUrl && (
                  <button onClick={runScan} disabled={sScanState === "scanning" || sSubmitting}
                    className="w-full flex items-center justify-center gap-2 py-2.5 rounded-xl text-xs font-bold transition-all disabled:opacity-40 disabled:cursor-not-allowed bg-gradient-to-r from-violet-600 to-cyan-600 hover:from-violet-500 hover:to-cyan-500 text-white shadow-lg shadow-violet-900/30 active:scale-95">
                    {sScanState === "scanning" ? <><FaSpinner className="animate-spin" size={11} /> Scanning…</>
                      : sScanState === "error" ? <><FaRedo size={11} /> Retry Scan</>
                        : (sScanState === "done" || sScanState === "detected") ? <><FaRedo size={11} /> Re-scan</>
                          : <><FaMicrochip size={11} /> Scan with AI</>}
                  </button>
                )}
              </div>
            </div>

            {/* ── Right: Smart Form ── */}
            <div className="bg-gray-900 border border-white/5 rounded-2xl overflow-visible flex flex-col">
              <div className="flex items-center gap-2 px-4 py-3 border-b border-white/5">
                <span className="text-[11px] font-bold text-blue-400 uppercase tracking-widest">Submit a Found Item</span>

              </div>

              <form onSubmit={handleSmartSubmit} className="flex-1 overflow-y-auto p-4 space-y-3">

                {/* Item Name */}
                <div className={`bg-gray-800/60 border border-white/5 rounded-xl overflow-hidden transition-all duration-300 ${sGlow("name")}`}>
                  <div className="flex items-center gap-2 px-3 py-2 border-b border-white/5">
                    <FaBoxOpen size={9} className="text-blue-400" />
                    <p className="text-[10px] font-bold text-blue-400 uppercase tracking-widest">Item Name</p>
                    {sHighlight === "name" && <span className="ml-auto text-[9px] text-blue-400 animate-pulse font-bold">typing…</span>}
                  </div>
                  <div className="p-3 flex items-center gap-1">
                    <input type="text" value={sName} onChange={e => setSName(e.target.value)}
                      placeholder="e.g. Blue Nike Backpack"
                      className="flex-1 bg-transparent text-white text-sm placeholder-gray-600 focus:outline-none" required />
                    {sHighlight === "name" && <span className="inline-block w-[2px] h-4 bg-blue-400 animate-pulse" />}
                  </div>
                </div>

                {/* Category */}
                <div className={`bg-gray-800/60 border border-white/5 rounded-xl overflow-visible transition-all duration-300 ${sGlow("cat")}`}>
                  <div className="flex items-center gap-2 px-3 py-2 border-b border-white/5">
                    <FaTag size={9} className="text-blue-400" />
                    <p className="text-[10px] font-bold text-blue-400 uppercase tracking-widest">Category</p>
                    {sHighlight === "cat" && <span className="ml-auto text-[9px] text-blue-400 animate-pulse font-bold">selecting…</span>}
                  </div>
                  <CategoryDropdown
                    value={sCatId}
                    onChange={(id, name) => { setSCatId(id); }}
                    options={categories}
                    highlight={sHighlight === "cat"}
                  />
                </div>

                {/* Description */}
                <div className={`bg-gray-800/60 border border-white/5 rounded-xl overflow-hidden transition-all duration-300 ${sGlow("desc")}`}>
                  <div className="flex items-center gap-2 px-3 py-2 border-b border-white/5">
                    <FaClipboardList size={9} className="text-blue-400" />
                    <p className="text-[10px] font-bold text-blue-400 uppercase tracking-widest">Description</p>
                    {sHighlight === "desc" && <span className="ml-auto text-[9px] text-blue-400 animate-pulse font-bold">typing…</span>}
                  </div>
                  <div className="p-3 flex gap-1">
                    <textarea value={sDesc} onChange={e => setSDesc(e.target.value)} rows={3}
                      placeholder="Describe the item…"
                      className="flex-1 bg-transparent text-white text-sm placeholder-gray-600 focus:outline-none resize-none" />
                    {sHighlight === "desc" && <span className="inline-block w-[2px] h-4 mt-0.5 bg-blue-400 animate-pulse self-start" />}
                  </div>
                </div>

                {/* Location */}
                <div className="bg-gray-800/60 border border-white/5 rounded-xl overflow-hidden">
                  <div className="flex items-center gap-2 px-3 py-2 border-b border-white/5">
                    <FaMapMarkerAlt size={9} className="text-blue-400" />
                    <p className="text-[10px] font-bold text-blue-400 uppercase tracking-widest">Location Found</p>
                  </div>
                  <div className="p-3">
                    <LocationAutocomplete value={sLocation} onChange={setSLocation}
                      placeholder="e.g. Library, SAS Office…"
                      className="w-full bg-transparent text-white text-sm placeholder-gray-600 focus:outline-none" />
                  </div>
                </div>

                {/* Date */}
                <div className="bg-gray-800/60 border border-white/5 rounded-xl overflow-visible">
                  <div className="flex items-center gap-2 px-3 py-2 border-b border-white/5">
                    <FaCalendarAlt size={9} className="text-blue-400" />
                    <p className="text-[10px] font-bold text-blue-400 uppercase tracking-widest">Date Found</p>
                  </div>
                  <div className="p-3">
                    <CustomDatePicker
                      value={sDate}
                      onChange={v => setSDate(v)}
                      max={new Date().toISOString().split("T")[0]}
                      placeholder="Select date found"
                      openUp
                    />
                  </div>
                </div>

                {/* Reporter + Email */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div className="bg-gray-800/60 border border-white/5 rounded-xl overflow-hidden">
                    <div className="flex items-center gap-2 px-3 py-2 border-b border-white/5">
                      <FaUser size={9} className="text-blue-400" />
                      <p className="text-[10px] font-bold text-blue-400 uppercase tracking-widest">Reporter</p>
                    </div>
                    <div className="p-3">
                      <input type="text" value={sReporter} onChange={e => setSReporter(e.target.value)}
                        placeholder="Reporter name"
                        className="w-full bg-transparent text-white text-sm placeholder-gray-600 focus:outline-none" />
                    </div>
                  </div>
                  <div className="bg-gray-800/60 border border-white/5 rounded-xl overflow-hidden">
                    <div className="flex items-center gap-2 px-3 py-2 border-b border-white/5">
                      <FaEnvelope size={9} className="text-blue-400" />
                      <p className="text-[10px] font-bold text-blue-400 uppercase tracking-widest">School Email</p>
                    </div>
                    <div className="p-3">
                      <input type="email" value={sEmail} onChange={e => setSEmail(e.target.value)}
                        placeholder="Optional"
                        className="w-full bg-transparent text-white text-sm placeholder-gray-600 focus:outline-none" />
                    </div>
                  </div>
                </div>

                {/* Submit */}
                <button type="submit"
                  disabled={sSubmitting || !sImageUrl || sScanState === "scanning"}
                  className={`w-full flex items-center justify-center gap-2 py-2.5 rounded-xl text-xs font-bold transition-all active:scale-95 disabled:opacity-40 disabled:cursor-not-allowed ${sSubmitted
                    ? "bg-emerald-500/20 border border-emerald-400/30 text-emerald-400"
                    : "bg-blue-600 hover:bg-blue-500 text-white shadow-lg shadow-blue-900/30"
                    }`}>
                  {sSubmitted ? <><FaCheckCircle size={11} /> Item Registered!</>
                    : sSubmitting ? <><FaSpinner className="animate-spin" size={11} /> Saving…</>
                      : <><FaCheck size={11} /> Submit Item</>}
                </button>

                {!sImageUrl && (
                  <p className="text-center text-gray-600 text-xs pt-1">Upload an image on the left to get started</p>
                )}
              </form>
            </div>
          </div>
        )}

        {/* ════════════════════════════════════════════════════════════════════
            BATCH ENTRY TAB
        ════════════════════════════════════════════════════════════════════ */}
        {activeTab === "batch" && (
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-4 sm:gap-5 items-stretch animate-fadeIn">
            {/* Left: Setup, Stats & Upload (5 cols) */}
            <div className="lg:col-span-5 flex flex-col gap-4">
              
              {/* Batch Settings Panel */}
              <div className="bg-gray-900 border border-white/5 rounded-2xl p-4 flex flex-col gap-4">
                <div className="flex items-center gap-2 pb-2 border-b border-white/5">
                  <div className="w-1.5 h-1.5 rounded-full bg-blue-400 animate-pulse" />
                  <span className="text-[11px] font-bold text-blue-400 uppercase tracking-widest">Batch Settings</span>
                </div>
                
                <div>
                  <label className="block text-[9px] font-bold text-gray-500 uppercase tracking-widest mb-1.5">Batch Location</label>
                  <LocationAutocomplete value={batchLocation} onChange={updateLocation} disabled={isProcessing}
                    placeholder="e.g. Library, SAS Office..."
                    className="w-full px-3 py-2 bg-gray-800 border border-white/10 rounded-xl text-white text-xs placeholder-gray-600 focus:outline-none focus:ring-2 focus:ring-blue-500/30 disabled:opacity-50" />
                </div>

                <div className="flex flex-col gap-2 pt-2">
                  <button onClick={processAll} disabled={isProcessing || items.length === 0}
                    className="w-full flex items-center justify-center gap-2 py-2.5 bg-blue-600 hover:bg-blue-500 disabled:opacity-40 disabled:cursor-not-allowed text-white text-xs font-bold rounded-xl transition-all shadow-lg shadow-blue-900/30 active:scale-95">
                    {isProcessing ? <><FaSpinner className="animate-spin" size={12} /> Processing...</> : <><FaBolt size={12} /> Start Processing</>}
                  </button>

                  <div className="grid grid-cols-2 gap-2">
                    {items.some(i => i.status === "success") && (
                      <button onClick={clearCompleted}
                        className="flex items-center justify-center gap-1.5 py-2 bg-gray-800 hover:bg-gray-700 border border-white/5 hover:border-white/10 text-gray-400 hover:text-white text-xs font-medium rounded-xl transition-all">
                        <FaTrash size={10} /> Clear Done
                      </button>
                    )}
                    {items.length > 0 && !isProcessing && (
                      <button onClick={clearAll}
                        className={`flex items-center justify-center gap-1.5 py-2 bg-gray-800 hover:bg-gray-700 border border-white/5 hover:border-white/10 text-gray-400 hover:text-white text-xs font-medium rounded-xl transition-all ${
                          items.some(i => i.status === "success") ? "" : "col-span-2"
                        }`}>
                        <FaTimesCircle size={10} /> Clear All
                      </button>
                    )}
                  </div>

                  {errored > 0 && !isProcessing && (
                    <button onClick={retryFailed}
                      className="w-full flex items-center justify-center gap-1.5 py-2 bg-blue-500/10 hover:bg-blue-500/20 border border-blue-500/20 hover:border-blue-500/40 text-blue-400 hover:text-blue-300 text-xs font-bold rounded-xl transition-all">
                      <FaRedo size={10} /> Retry Failed ({errored})
                    </button>
                  )}
                </div>
              </div>

              {/* Stats Grid */}
              {items.length > 0 && (
                <div className="grid grid-cols-2 gap-3">
                  {[
                    { label: "Total", value: total, color: "text-white", bg: "bg-gray-900 border-white/5", icon: <FaBoxOpen size={12} className="text-gray-400" /> },
                    { label: "Queued", value: pending, color: "text-blue-400", bg: "bg-gray-900 border-blue-500/10", icon: <FaUpload size={12} className="text-blue-400" /> },
                    { label: "Done", value: done, color: "text-emerald-400", bg: "bg-gray-900 border-emerald-500/10", icon: <FaCheckCircle size={12} className="text-emerald-400" /> },
                    { label: "Errors", value: errored, color: "text-red-400", bg: "bg-gray-900 border-red-500/10", icon: <FaTimesCircle size={12} className="text-red-400" /> },
                  ].map(s => (
                    <div key={s.label} className={`border rounded-2xl p-3 flex flex-col gap-2 ${s.bg}`}>
                      <div className="flex items-start justify-between gap-1">
                        <div className="w-7 h-7 rounded-lg flex items-center justify-center bg-gray-800 border border-white/5 shrink-0">{s.icon}</div>
                        <span className={`text-xl sm:text-2xl font-black leading-none tabular-nums ${s.color}`}>{s.value}</span>
                      </div>
                      <p className="text-[9px] font-semibold text-gray-500 uppercase tracking-wider">{s.label}</p>
                    </div>
                  ))}
                </div>
              )}

              {/* Drop Zone */}
              <div {...bGetRoot()}
                className={`border-2 border-dashed rounded-2xl p-6 text-center cursor-pointer transition-all duration-200 ${bDrag ? "border-blue-400 bg-blue-500/10 scale-[1.01]" : "border-white/10 bg-gray-900 hover:border-blue-500/40 hover:bg-gray-800/60"
                  } ${isProcessing ? "opacity-40 pointer-events-none" : ""}`}>
                <input {...bGetInput()} />
                <div className="flex flex-col items-center gap-3">
                  <div className={`w-12 h-12 rounded-2xl flex items-center justify-center transition-all duration-200 ${bDrag ? "bg-blue-500 text-white scale-110" : "bg-blue-500/10 border border-blue-500/20 text-blue-400"}`}>
                    <FaUpload size={18} />
                  </div>
                  <div>
                    <p className="text-white font-semibold text-xs sm:text-sm">{bDrag ? "Release to add images" : "Drag & drop multiple images here"}</p>
                    <p className="text-gray-500 text-[10px] mt-1">or <span className="text-blue-400 font-semibold">click to select files</span></p>
                  </div>
                  <div className="flex items-center gap-1.5 flex-wrap justify-center text-[9px] text-gray-600 font-medium">
                    {["JPG", "PNG", "WEBP"].map(f => (
                      <span key={f} className="px-1.5 py-0.5 bg-gray-800 border border-white/5 rounded-full">{f}</span>
                    ))}
                  </div>
                </div>
              </div>

              {/* Progress Bar */}
              {isProcessing && total > 0 && (
                <div className="bg-gray-900 border border-white/5 rounded-2xl p-4 space-y-2">
                  <div className="flex items-center justify-between text-xs">
                    <div className="flex items-center gap-2 text-blue-400 font-semibold"><FaSpinner className="animate-spin" size={11} /> Processing images...</div>
                    <span className="text-gray-500 tabular-nums">{done} / {total} complete</span>
                  </div>
                  <div className="w-full h-1.5 bg-gray-800 rounded-full overflow-hidden">
                    <div className="h-full bg-gradient-to-r from-blue-500 to-cyan-500 rounded-full transition-all duration-500"
                      style={{ width: `${total > 0 ? Math.round((done / total) * 100) : 0}%` }} />
                  </div>
                </div>
              )}

              {/* Batch Summary banner */}
              {!isProcessing && batchSummary && (
                <div className={`relative rounded-2xl border px-4 py-3 flex flex-col gap-2 ${batchSummary.failed === 0 ? "bg-blue-500/5 border-blue-500/20" : batchSummary.success === 0 ? "bg-red-500/5 border-red-500/20" : "bg-blue-500/5 border-blue-500/20"
                  }`}>
                  <div className="flex items-start gap-3 pr-6">
                    {batchSummary.failed === 0 ? <FaCheckCircle size={16} className="text-blue-400 shrink-0 mt-0.5" /> : <FaExclamationTriangle size={16} className="text-blue-400 shrink-0 mt-0.5" />}
                    <div>
                      <p className={`text-xs font-bold ${batchSummary.failed === 0 ? "text-blue-400" : batchSummary.success === 0 ? "text-red-400" : "text-blue-400"}`}>
                        {batchSummary.failed === 0 ? "All batch items saved successfully!" : batchSummary.success === 0 ? "Batch failed — no items saved" : "Batch finished with errors"}
                      </p>
                      <p className="text-[10px] text-gray-500 mt-0.5">
                        <span className="text-blue-400 font-semibold">{batchSummary.success} succeeded</span>
                        {batchSummary.failed > 0 && <> · <span className="text-red-400 font-semibold">{batchSummary.failed} failed</span></>}
                      </p>
                    </div>
                  </div>
                  {batchSummary.failed > 0 && (
                    <button onClick={retryFailed} className="w-full mt-1 flex items-center justify-center gap-1.5 py-1.5 bg-blue-500/10 hover:bg-blue-500/20 border border-blue-500/20 text-blue-400 text-xs font-bold rounded-xl transition-all">
                      <FaRedo size={10} /> Retry {batchSummary.failed} Failed
                    </button>
                  )}
                  <button onClick={() => setBatchSummary(null)} className="absolute top-2 right-2 text-gray-600 hover:text-gray-400 transition-colors" aria-label="Dismiss">
                    <FaTimes size={12} />
                  </button>
                </div>
              )}
            </div>

            {/* Right: Items Queue (7 cols) */}
            <div className="lg:col-span-7 bg-gray-900 border border-white/5 rounded-2xl overflow-hidden flex flex-col min-h-[400px] lg:h-auto">
              <div className="flex items-center justify-between px-4 py-3 border-b border-white/5">
                <div className="flex items-center gap-2">
                  <div className="w-1.5 h-1.5 rounded-full bg-blue-400 animate-pulse" />
                  <span className="text-[11px] font-bold text-blue-400 uppercase tracking-widest">Queue Status ({total})</span>
                </div>
                {done > 0 && (
                  <button onClick={clearCompleted} className="text-[10px] font-semibold text-gray-500 hover:text-white transition-colors underline underline-offset-2">
                    Clear Completed ({done})
                  </button>
                )}
              </div>

              {items.length === 0 ? (
                <div className="flex-1 flex flex-col items-center justify-center py-20 text-gray-600">
                  <FaSearch size={28} className="mb-3 opacity-40 text-blue-400 animate-pulse" />
                  <p className="text-sm font-medium text-gray-500">No images queued</p>
                  <p className="text-xs mt-1 opacity-60">Drop images on the left to get started</p>
                </div>
              ) : (
                <div className="flex-1 overflow-y-auto p-4 space-y-3 lg:max-h-[500px]">
                  {items.map(item => (
                    <div key={item.id} className="bg-gray-800/60 border border-white/5 rounded-xl p-3 flex gap-3 hover:border-white/10 transition-colors items-center">
                      <div className="w-12 h-12 rounded-xl overflow-hidden bg-gray-950 border border-white/5 shrink-0 relative">
                        <img src={item.previewUrl} alt="preview" className="w-full h-full object-cover" />
                      </div>
                      
                      <div className="flex-1 min-w-0 space-y-1">
                        <div className="flex items-center justify-between gap-2">
                          <p className="text-white text-xs font-bold truncate">
                            {item.resultDetails?.itemName || item.file.name}
                          </p>
                          <StatusBadge status={item.status} />
                        </div>
                        
                        {item.resultDetails?.description ? (
                          <p className="text-gray-400 text-[10px] line-clamp-1 leading-normal">
                            {item.resultDetails.description}
                          </p>
                        ) : item.status === "error" ? (
                          <p className="text-red-400 text-[10px] line-clamp-1 leading-normal font-medium">
                            {item.errorMessage || "Failed to process image."}
                          </p>
                        ) : item.status === "pending" ? (
                          <p className="text-gray-500 text-[10px] line-clamp-1 leading-normal">
                            Waiting to process...
                          </p>
                        ) : (
                          <p className="text-blue-400/80 text-[10px] flex items-center gap-1 leading-normal">
                            <FaSpinner className="animate-spin" size={8} /> Processing item details...
                          </p>
                        )}
                        
                        <div className="flex items-center gap-2 flex-wrap text-[9px] text-gray-500">
                          <span>{(item.file.size / 1024).toFixed(0)} KB</span>
                          {item.resultDetails?.categoryName && (
                            <>
                              <span>•</span>
                              <span className="px-1.5 py-0.2 bg-white/5 border border-white/5 text-gray-400 rounded-md">
                                {item.resultDetails.categoryName}
                              </span>
                            </>
                          )}
                        </div>
                      </div>

                      <div className="shrink-0 flex items-center gap-1.5 ml-2">
                        {!isProcessing && item.status === "error" && (
                          <>
                            <button onClick={() => retrySingle(item.id)} title="Retry"
                              className="w-7 h-7 rounded-lg bg-blue-500/10 hover:bg-blue-500/20 border border-blue-500/20 flex items-center justify-center text-blue-400 transition-colors">
                              <FaRedo size={9} />
                            </button>
                            <button onClick={() => removeFile(item.id)} title="Remove"
                              className="w-7 h-7 rounded-lg bg-red-500/10 hover:bg-red-500/20 border border-red-500/20 flex items-center justify-center text-red-400 transition-colors">
                              <FaTimesCircle size={10} />
                            </button>
                          </>
                        )}
                        {!isProcessing && item.status === "pending" && (
                          <button onClick={() => removeFile(item.id)} title="Remove"
                            className="w-7 h-7 rounded-lg bg-red-500/10 hover:bg-red-500/20 border border-red-500/20 flex items-center justify-center text-red-400 transition-colors">
                            <FaTimesCircle size={10} />
                          </button>
                        )}
                        {item.status === "success" && (
                          <div className="w-7 h-7 flex items-center justify-center">
                            <FaCheckCircle size={14} className="text-emerald-400" />
                          </div>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        )}

      </div>
    </>
  );
};

export default BulkScanner;
