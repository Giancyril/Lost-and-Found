import React, { useState, useCallback } from "react";
import { useDropzone } from "react-dropzone";
import imageCompression from "browser-image-compression";
import { toast } from "react-toastify";
import { useAiRecognizeMutation, useCreateFoundItemMutation } from "../../redux/api/api";
import {
  FaUpload, FaSpinner, FaCheckCircle, FaTimesCircle,
  FaTrash, FaBolt, FaBoxOpen, FaSearch, FaRedo, FaExclamationTriangle,
} from "react-icons/fa";
import LocationAutocomplete from "../../components/ui/LocationAutocomplete";

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
    pending:   { label: "Queued",    cls: "bg-gray-500/10 text-gray-400 border-gray-500/20" },
    analyzing: { label: "Analyzing", cls: "bg-blue-500/10 text-blue-400 border-blue-500/20" },
    uploading: { label: "Saving",    cls: "bg-violet-500/10 text-violet-400 border-violet-500/20" },
    success:   { label: "Done",      cls: "bg-emerald-500/10 text-emerald-400 border-emerald-500/20" },
    error:     { label: "Error",     cls: "bg-red-500/10 text-red-400 border-red-500/20" },
  };
  const { label, cls } = map[status];
  return (
    <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold border ${cls}`}>
      {(status === "analyzing" || status === "uploading") && <FaSpinner className="animate-spin" size={8} />}
      {status === "success" && <FaCheckCircle size={8} />}
      {status === "error"   && <FaTimesCircle size={8} />}
      {label}
    </span>
  );
};

const scannerStore = {
  items: [] as ProcessedItem[],
  isProcessing: false,
  globalLocation: "SAS Office",
  listeners: new Set<() => void>(),
  subscribe(listener: () => void) {
    this.listeners.add(listener);
    return () => { this.listeners.delete(listener); };
  },
  setItems(action: React.SetStateAction<ProcessedItem[]>) {
    this.items = typeof action === "function" ? action(this.items) : action;
    this.notify();
  },
  setIsProcessing(action: React.SetStateAction<boolean>) {
    this.isProcessing = typeof action === "function" ? action(this.isProcessing) : action;
    this.notify();
  },
  setGlobalLocation(val: string) {
    this.globalLocation = val;
    this.notify();
  },
  notify() {
    this.listeners.forEach(l => l());
  }
};

const BulkScanner = () => {
  const [items, _setItems] = useState<ProcessedItem[]>(scannerStore.items);
  const [isProcessing, _setIsProcessing] = useState(scannerStore.isProcessing);
  const [globalLocation, _setGlobalLocation] = useState(scannerStore.globalLocation);

  React.useEffect(() => {
    return scannerStore.subscribe(() => {
      _setItems(scannerStore.items);
      _setIsProcessing(scannerStore.isProcessing);
      _setGlobalLocation(scannerStore.globalLocation);
    });
  }, []);

  const setItems = (action: React.SetStateAction<ProcessedItem[]>) => scannerStore.setItems(action);
  const setIsProcessing = (action: React.SetStateAction<boolean>) => scannerStore.setIsProcessing(action);
  const setGlobalLocation = (val: string) => scannerStore.setGlobalLocation(val);

  const [aiRecognize]     = useAiRecognizeMutation();
  const [createFoundItem] = useCreateFoundItemMutation();
  const [batchSummary, setBatchSummary] = useState<{ success: number; failed: number } | null>(null);

  const onDrop = useCallback((acceptedFiles: File[]) => {
    const newItems = acceptedFiles.map(file => ({
      id: Math.random().toString(36).substring(7),
      file,
      previewUrl: URL.createObjectURL(file),
      status: "pending" as const,
    }));
    setItems(prev => [...prev, ...newItems]);
  }, []);

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept: { "image/*": [] },
    disabled: isProcessing,
  });

  const removeFile = (id: string) => setItems(prev => prev.filter(i => i.id !== id));
  const clearAll = () => setItems([]);
  const clearCompleted = () => setItems(prev => prev.filter(i => i.status !== "success"));

  /** Core processing logic for a single item by id. Returns true on success. */
  const processItem = async (itemId: string): Promise<boolean> => {
    const item = scannerStore.items.find(i => i.id === itemId);
    if (!item) return false;

    setItems(prev => prev.map(p => p.id === itemId
      ? { ...p, status: "analyzing", errorMessage: undefined }
      : p
    ));

    try {
      const compressed = await imageCompression(item.file, {
        maxSizeMB: 0.2, maxWidthOrHeight: 800, useWebWorker: true,
      });

      const base64: string = await new Promise(resolve => {
        const r = new FileReader();
        r.onloadend = () => resolve(r.result as string);
        r.readAsDataURL(compressed);
      });

      const formData = new FormData();
      formData.append("image", compressed);
      const aiRes = await aiRecognize(formData).unwrap();
      if (!aiRes.success || !aiRes.data) throw new Error("AI could not extract tags.");

      const aiData = aiRes.data;
      setItems(prev => prev.map(p => p.id === itemId
        ? { ...p, status: "uploading", resultDetails: aiData }
        : p
      ));

      const createRes: any = await createFoundItem({
        foundItemName: aiData.itemName || "Unknown Item",
        description:   aiData.description || "Found via Bulk Scanner.",
        categoryId:    aiData.categoryId || null,
        img:           base64,
        location:      scannerStore.globalLocation || "Unknown Location",
        date:          new Date().toISOString(),
        reporterName:  "Admin Scanner",
        schoolEmail:   "",
      });

      if (createRes.error || createRes?.data?.success === false)
        throw new Error("Failed to save item to database.");

      setItems(prev => prev.map(p => p.id === itemId ? { ...p, status: "success" } : p));
      return true;
    } catch (err: any) {
      setItems(prev => prev.map(p =>
        p.id === itemId
          ? { ...p, status: "error", errorMessage: err.message || "Unknown error" }
          : p
      ));
      return false;
    }
  };

  /** Process all pending + errored items as a batch. */
  const processAll = async () => {
    const toProcess = scannerStore.items.filter(i => i.status === "pending" || i.status === "error");
    if (toProcess.length === 0) { toast.info("No new images to process."); return; }
    setIsProcessing(true);
    setBatchSummary(null);

    let successCount = 0;
    let failCount = 0;

    for (const item of toProcess) {
      const ok = await processItem(item.id);
      if (ok) successCount++; else failCount++;
    }

    setIsProcessing(false);
    setBatchSummary({ success: successCount, failed: failCount });

    if (failCount === 0) {
      toast.success(`All ${successCount} image${successCount !== 1 ? "s" : ""} processed successfully.`);
    } else if (successCount === 0) {
      toast.error(`All ${failCount} image${failCount !== 1 ? "s" : ""} failed. Use "Retry Failed" to try again.`);
    } else {
      toast.warn(
        `${successCount} succeeded, ${failCount} failed. Use "Retry Failed" to reprocess only the failed ones.`
      );
    }
  };

  /** Retry only the items currently in error state. */
  const retryFailed = async () => {
    const failed = scannerStore.items.filter(i => i.status === "error");
    if (failed.length === 0) { toast.info("No failed items to retry."); return; }
    setIsProcessing(true);
    setBatchSummary(null);

    let successCount = 0;
    let failCount = 0;

    for (const item of failed) {
      const ok = await processItem(item.id);
      if (ok) successCount++; else failCount++;
    }

    setIsProcessing(false);
    setBatchSummary({ success: successCount, failed: failCount });

    if (failCount === 0) {
      toast.success(`Retry complete — all ${successCount} item${successCount !== 1 ? "s" : ""} saved.`);
    } else {
      toast.warn(`Retry done: ${successCount} succeeded, ${failCount} still failing.`);
    }
  };

  /** Retry a single errored item inline. */
  const retrySingle = async (itemId: string) => {
    setIsProcessing(true);
    const ok = await processItem(itemId);
    setIsProcessing(false);
    if (ok) toast.success("Item saved successfully.");
    else toast.error("Item still failed. Check the error message.");
  };

  const total    = items.length;
  const done     = items.filter(i => i.status === "success").length;
  const pending  = items.filter(i => i.status === "pending").length;
  const errored  = items.filter(i => i.status === "error").length;

  return (
    <div className="space-y-4 sm:space-y-6 max-w-7xl mx-auto">

      {/* ── Page Header ── */}
      <div className="border-b border-white/5 pb-4 flex flex-col sm:flex-row justify-between items-start sm:items-end gap-4">
        <div className="flex-1 w-full sm:max-w-xs">
          <label className="block text-[10px] font-bold text-gray-400 uppercase tracking-widest mb-1.5">Batch Location</label>
          <LocationAutocomplete 
            value={globalLocation}
            onChange={(val) => setGlobalLocation(val)}
            disabled={isProcessing}
            placeholder="e.g. Library, SAS Office..."
            className="w-full px-3 py-2 bg-gray-800 border border-white/10 rounded-xl text-white text-xs placeholder-gray-600 focus:outline-none focus:ring-2 focus:ring-indigo-500/30 disabled:opacity-50"
          />
        </div>
        <div className="flex justify-end flex-wrap gap-2 w-full sm:w-auto">
        {items.some(i => i.status === "success") && (
          <button
            onClick={clearCompleted}
            className="flex items-center gap-1.5 px-3 py-2 bg-gray-800 hover:bg-gray-700 border border-white/5 hover:border-white/10 text-gray-400 hover:text-white text-xs font-medium rounded-xl transition-all"
          >
            <FaTrash size={10} /> Clear Done
          </button>
        )}
        {items.length > 0 && !isProcessing && (
          <button
            onClick={clearAll}
            className="flex items-center gap-1.5 px-3 py-2 bg-gray-800 hover:bg-gray-700 border border-white/5 hover:border-white/10 text-gray-400 hover:text-white text-xs font-medium rounded-xl transition-all"
          >
            <FaTimesCircle size={10} /> Clear All
          </button>
        )}
        {errored > 0 && !isProcessing && (
          <button
            onClick={retryFailed}
            className="flex items-center gap-1.5 px-3 py-2 bg-amber-500/10 hover:bg-amber-500/20 border border-amber-500/20 hover:border-amber-500/40 text-amber-400 hover:text-amber-300 text-xs font-bold rounded-xl transition-all"
          >
            <FaRedo size={10} /> Retry Failed ({errored})
          </button>
        )}
        <button
          onClick={processAll}
          disabled={isProcessing || items.length === 0}
          className="flex items-center gap-2 px-5 py-2 bg-indigo-600 hover:bg-indigo-500 disabled:opacity-40 disabled:cursor-not-allowed text-white text-xs font-bold rounded-xl transition-all shadow-lg shadow-indigo-900/30 active:scale-95"
        >
          {isProcessing
            ? <><FaSpinner className="animate-spin" size={12} /> Processing...</>
            : <><FaBolt size={12} /> Start Processing</>
          }
        </button>
      </div>
      </div>

      {/* ── Stats Row ── */}
      {items.length > 0 && (
        <div className="grid grid-cols-4 gap-2 sm:gap-3">
          {[
            { label: "Total",  value: total,   color: "text-white",       bg: "bg-gray-800 border-white/5",             icon: <FaBoxOpen size={12} className="text-gray-400" /> },
            { label: "Queued", value: pending,  color: "text-blue-400",    bg: "bg-blue-500/5 border-blue-500/10",       icon: <FaUpload size={12} className="text-blue-400" /> },
            { label: "Done",   value: done,     color: "text-emerald-400", bg: "bg-emerald-500/5 border-emerald-500/10", icon: <FaCheckCircle size={12} className="text-emerald-400" /> },
            { label: "Errors", value: errored,  color: "text-red-400",     bg: "bg-red-500/5 border-red-500/10",         icon: <FaTimesCircle size={12} className="text-red-400" /> },
          ].map(s => (
            <div key={s.label} className={`bg-gray-900 border rounded-2xl p-3 sm:p-4 flex flex-col gap-2 ${s.bg}`}>
              <div className="flex items-start justify-between gap-1">
                <div className="w-7 h-7 rounded-lg flex items-center justify-center bg-gray-800 border border-white/5 shrink-0">
                  {s.icon}
                </div>
                <span className={`text-xl sm:text-3xl font-black leading-none tabular-nums ${s.color}`}>{s.value}</span>
              </div>
              <p className="text-[9px] sm:text-xs font-semibold text-gray-500 uppercase tracking-wider">{s.label}</p>
            </div>
          ))}
        </div>
      )}

      {/* ── Drop Zone ── */}
      <div
        {...getRootProps()}
        className={`border-2 border-dashed rounded-2xl p-8 sm:p-12 text-center cursor-pointer transition-all duration-200 ${
          isDragActive
            ? "border-indigo-400 bg-indigo-500/10 scale-[1.01]"
            : "border-white/10 bg-gray-900 hover:border-indigo-500/40 hover:bg-gray-800/60"
        } ${isProcessing ? "opacity-40 pointer-events-none" : ""}`}
      >
        <input {...getInputProps()} />
        <div className="flex flex-col items-center gap-4">
          <div className={`w-14 h-14 rounded-2xl flex items-center justify-center transition-all duration-200 ${
            isDragActive ? "bg-indigo-500 text-white scale-110" : "bg-indigo-500/10 border border-indigo-500/20 text-indigo-400"
          }`}>
            <FaUpload size={22} />
          </div>
          <div>
            <p className="text-white font-semibold text-sm sm:text-base">
              {isDragActive ? "Release to add images" : "Drag & drop multiple images here"}
            </p>
            <p className="text-gray-500 text-xs mt-1">
              or <span className="text-indigo-400 font-semibold">click to select files</span> from your computer or camera
            </p>
          </div>
          <div className="flex items-center gap-2 flex-wrap justify-center text-[10px] text-gray-600 font-medium">
            {["JPG", "PNG", "WEBP", "HEIC"].map(f => (
              <span key={f} className="px-2 py-0.5 bg-gray-800 border border-white/5 rounded-full">{f}</span>
            ))}
          </div>
        </div>
      </div>

      {/* ── Progress Bar ── */}
      {isProcessing && total > 0 && (
        <div className="bg-gray-900 border border-white/5 rounded-2xl p-4 space-y-2">
          <div className="flex items-center justify-between text-xs">
            <div className="flex items-center gap-2 text-indigo-400 font-semibold">
              <FaSpinner className="animate-spin" size={11} />
              Processing images...
            </div>
            <span className="text-gray-500 tabular-nums">{done} / {total} complete</span>
          </div>
          <div className="w-full h-1.5 bg-gray-800 rounded-full overflow-hidden">
            <div
              className="h-full bg-gradient-to-r from-indigo-500 to-violet-500 rounded-full transition-all duration-500"
              style={{ width: `${total > 0 ? Math.round((done / total) * 100) : 0}%` }}
            />
          </div>
        </div>
      )}

      {/* ── Batch Summary Banner ── */}
      {!isProcessing && batchSummary && (
        <div className={`relative rounded-2xl border px-4 py-3 flex flex-col sm:flex-row sm:items-center justify-between gap-3 ${
          batchSummary.failed === 0
            ? "bg-emerald-500/5 border-emerald-500/20"
            : batchSummary.success === 0
              ? "bg-red-500/5 border-red-500/20"
              : "bg-amber-500/5 border-amber-500/20"
        }`}>
          <div className="flex items-center gap-3">
            {batchSummary.failed === 0 ? (
              <FaCheckCircle size={16} className="text-emerald-400 shrink-0" />
            ) : (
              <FaExclamationTriangle size={16} className="text-amber-400 shrink-0" />
            )}
            <div>
              <p className={`text-xs font-bold ${
                batchSummary.failed === 0 ? "text-emerald-400"
                  : batchSummary.success === 0 ? "text-red-400"
                  : "text-amber-400"
              }`}>
                {batchSummary.failed === 0
                  ? "Batch complete — all items saved"
                  : batchSummary.success === 0
                    ? "Batch failed — no items were saved"
                    : "Batch finished with errors"}
              </p>
              <p className="text-[10px] text-gray-500 mt-0.5">
                <span className="text-emerald-400 font-semibold">{batchSummary.success} succeeded</span>
                {batchSummary.failed > 0 && (
                  <> · <span className="text-red-400 font-semibold">{batchSummary.failed} failed</span></>
                )}
              </p>
            </div>
          </div>
          {batchSummary.failed > 0 && (
            <button
              onClick={retryFailed}
              className="flex items-center gap-1.5 px-3 py-1.5 bg-amber-500/10 hover:bg-amber-500/20 border border-amber-500/20 text-amber-400 text-xs font-bold rounded-xl transition-all shrink-0"
            >
              <FaRedo size={10} /> Retry {batchSummary.failed} Failed
            </button>
          )}
          <button
            onClick={() => setBatchSummary(null)}
            className="absolute top-2 right-2 sm:static text-gray-600 hover:text-gray-400 transition-colors"
            aria-label="Dismiss"
          >
            <FaTimesCircle size={12} />
          </button>
        </div>
      )}

      {/* ── Item List ── */}
      {items.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-20 bg-gray-900 border border-dashed border-white/5 rounded-2xl text-gray-600">
          <FaSearch size={28} className="mb-3 opacity-40" />
          <p className="text-sm font-medium text-gray-500">No images queued</p>
          <p className="text-xs mt-1 opacity-60">Drop images above to get started</p>
        </div>
      ) : (
        <div className="bg-gray-900 border border-white/5 rounded-2xl overflow-hidden">

          {/* ── Desktop table header (hidden on mobile) ── */}
          <div className="hidden sm:grid grid-cols-12 gap-4 px-5 py-3 border-b border-white/5 text-[10px] uppercase tracking-widest text-gray-600 font-semibold">
            <div className="col-span-1">Preview</div>
            <div className="col-span-3">File Name</div>
            <div className="col-span-3">AI Result</div>
            <div className="col-span-2">Category</div>
            <div className="col-span-2">Status</div>
            <div className="col-span-1 text-right">Action</div>
          </div>

          <div className="divide-y divide-white/[0.04]">
            {items.map(item => (
              <div key={item.id}>

                {/* ── Desktop row ── */}
                <div className="hidden sm:grid grid-cols-12 gap-4 items-center px-5 py-3.5 hover:bg-white/[0.02] transition-colors">
                  <div className="col-span-1">
                    <div className="w-10 h-10 rounded-lg overflow-hidden bg-gray-800 border border-white/5">
                      <img src={item.previewUrl} alt="preview" className="w-full h-full object-cover" />
                    </div>
                  </div>
                  <div className="col-span-3 min-w-0">
                    <p className="text-white text-xs font-medium truncate">{item.file.name}</p>
                    <p className="text-gray-600 text-[10px] mt-0.5">{(item.file.size / 1024).toFixed(0)} KB</p>
                  </div>
                  <div className="col-span-3 min-w-0">
                    {item.resultDetails ? (
                      <>
                        <p className="text-white text-xs font-semibold truncate">{item.resultDetails.itemName}</p>
                        <p className="text-gray-500 text-[10px] truncate mt-0.5">{item.resultDetails.description}</p>
                      </>
                    ) : item.status === "error" ? (
                      <p className="text-red-400 text-[10px] line-clamp-2">{item.errorMessage}</p>
                    ) : item.status === "pending" ? (
                      <p className="text-gray-600 text-[10px]">Waiting for processing...</p>
                    ) : (
                      <p className="text-blue-400 text-[10px] flex items-center gap-1">
                        <FaSpinner className="animate-spin" size={8} /> Analyzing with AI...
                      </p>
                    )}
                  </div>
                  <div className="col-span-2">
                    {item.resultDetails?.categoryName ? (
                      <span className="text-[10px] px-2 py-0.5 bg-white/5 border border-white/5 text-gray-300 rounded-lg">
                        {item.resultDetails.categoryName}
                      </span>
                    ) : (
                      <span className="text-gray-700 text-[10px]">—</span>
                    )}
                  </div>
                  <div className="col-span-2">
                    <StatusBadge status={item.status} />
                  </div>
                  <div className="col-span-1 flex justify-end gap-1">
                    {!isProcessing && item.status === "error" && (
                      <>
                        <button
                          onClick={() => retrySingle(item.id)}
                          title="Retry this item"
                          className="w-6 h-6 rounded-lg bg-amber-500/10 hover:bg-amber-500/20 border border-amber-500/20 flex items-center justify-center text-amber-400 transition-colors"
                        >
                          <FaRedo size={9} />
                        </button>
                        <button
                          onClick={() => removeFile(item.id)}
                          title="Remove"
                          className="w-6 h-6 rounded-lg bg-red-500/10 hover:bg-red-500/20 border border-red-500/20 flex items-center justify-center text-red-400 transition-colors"
                        >
                          <FaTimesCircle size={10} />
                        </button>
                      </>
                    )}
                    {!isProcessing && item.status === "pending" && (
                      <button
                        onClick={() => removeFile(item.id)}
                        className="w-6 h-6 rounded-lg bg-red-500/10 hover:bg-red-500/20 border border-red-500/20 flex items-center justify-center text-red-400 transition-colors"
                      >
                        <FaTimesCircle size={10} />
                      </button>
                    )}
                    {item.status === "success" && <FaCheckCircle size={14} className="text-emerald-400" />}
                  </div>
                </div>

                {/* ── Mobile card ── */}
                <div className="sm:hidden flex items-center gap-3 px-4 py-3 hover:bg-white/[0.02] transition-colors">

                  {/* Thumbnail */}
                  <div className="w-14 h-14 rounded-xl overflow-hidden bg-gray-800 border border-white/5 shrink-0">
                    <img src={item.previewUrl} alt="preview" className="w-full h-full object-cover" />
                  </div>

                  {/* Info */}
                  <div className="flex-1 min-w-0 space-y-1">
                    <p className="text-white text-xs font-semibold truncate">
                      {item.resultDetails?.itemName || item.file.name}
                    </p>

                    {/* Category + size row */}
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className="text-gray-600 text-[10px]">
                        {(item.file.size / 1024).toFixed(0)} KB
                      </span>
                      {item.resultDetails?.categoryName && (
                        <span className="text-[10px] px-1.5 py-0.5 bg-white/5 border border-white/5 text-gray-400 rounded-md">
                          {item.resultDetails.categoryName}
                        </span>
                      )}
                    </div>

                    {/* Status + sub-message row */}
                    <div className="flex items-center gap-2 flex-wrap">
                      <StatusBadge status={item.status} />
                      {item.status === "error" && (
                        <p className="text-red-400 text-[10px] truncate">{item.errorMessage}</p>
                      )}
                      {item.resultDetails?.description && item.status === "success" && (
                        <p className="text-gray-600 text-[10px] truncate">{item.resultDetails.description}</p>
                      )}
                    </div>
                  </div>

                  {/* Remove / retry / done icon */}
                  <div className="shrink-0 flex flex-col gap-1 items-center">
                    {!isProcessing && item.status === "error" && (
                      <>
                        <button
                          onClick={() => retrySingle(item.id)}
                          title="Retry"
                          className="w-7 h-7 rounded-lg bg-amber-500/10 hover:bg-amber-500/20 border border-amber-500/20 flex items-center justify-center text-amber-400 transition-colors"
                        >
                          <FaRedo size={10} />
                        </button>
                        <button
                          onClick={() => removeFile(item.id)}
                          className="w-7 h-7 rounded-lg bg-red-500/10 hover:bg-red-500/20 border border-red-500/20 flex items-center justify-center text-red-400 transition-colors"
                        >
                          <FaTimesCircle size={11} />
                        </button>
                      </>
                    )}
                    {!isProcessing && item.status === "pending" && (
                      <button
                        onClick={() => removeFile(item.id)}
                        className="w-7 h-7 rounded-lg bg-red-500/10 hover:bg-red-500/20 border border-red-500/20 flex items-center justify-center text-red-400 transition-colors"
                      >
                        <FaTimesCircle size={11} />
                      </button>
                    )}
                    {item.status === "success" && (
                      <FaCheckCircle size={16} className="text-emerald-400" />
                    )}
                  </div>
                </div>

              </div>
            ))}
          </div>

          {/* Footer */}
          {done > 0 && (
            <div className="px-4 sm:px-5 py-3 border-t border-white/5 flex items-center justify-between">
              <p className="text-gray-500 text-xs">
                <span className="text-emerald-400 font-bold">{done}</span> of {total} items saved
              </p>
              <button
                onClick={clearCompleted}
                className="text-xs text-gray-500 hover:text-white transition-colors underline underline-offset-2"
              >
                Clear completed
              </button>
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default BulkScanner;