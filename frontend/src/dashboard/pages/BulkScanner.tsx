import React, { useState, useCallback } from "react";
import { useDropzone } from "react-dropzone";
import imageCompression from "browser-image-compression";
import { toast } from "react-toastify";
import { useAiRecognizeMutation, useCreateFoundItemMutation } from "../../redux/api/api";
import {
  FaUpload, FaSpinner, FaCheckCircle, FaTimesCircle,
  FaMagic, FaTrash, FaBolt, FaBoxOpen, FaSearch,
} from "react-icons/fa";

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
    pending:   { label: "Queued",     cls: "bg-gray-500/10 text-gray-400 border-gray-500/20" },
    analyzing: { label: "Analyzing",  cls: "bg-blue-500/10 text-blue-400 border-blue-500/20" },
    uploading: { label: "Saving",     cls: "bg-violet-500/10 text-violet-400 border-violet-500/20" },
    success:   { label: "Done",       cls: "bg-emerald-500/10 text-emerald-400 border-emerald-500/20" },
    error:     { label: "Error",      cls: "bg-red-500/10 text-red-400 border-red-500/20" },
  };
  const { label, cls } = map[status];
  return (
    <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold border ${cls}`}>
      {(status === "analyzing" || status === "uploading") && (
        <FaSpinner className="animate-spin" size={8} />
      )}
      {status === "success" && <FaCheckCircle size={8} />}
      {status === "error"   && <FaTimesCircle size={8} />}
      {label}
    </span>
  );
};

const BulkScanner = () => {
  const [items, setItems] = useState<ProcessedItem[]>([]);
  const [isProcessing, setIsProcessing] = useState(false);

  const [aiRecognize]     = useAiRecognizeMutation();
  const [createFoundItem] = useCreateFoundItemMutation();

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

  const processAll = async () => {
    const toProcess = items.filter(i => i.status === "pending" || i.status === "error");
    if (toProcess.length === 0) { toast.info("No new images to process."); return; }
    setIsProcessing(true);

    for (let i = 0; i < items.length; i++) {
      const item = items[i];
      if (item.status === "success") continue;

      setItems(prev => prev.map(p => p.id === item.id ? { ...p, status: "analyzing" } : p));

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
        setItems(prev => prev.map(p => p.id === item.id ? { ...p, status: "uploading", resultDetails: aiData } : p));

        const createRes: any = await createFoundItem({
          foundItemName: aiData.itemName || "Unknown Item",
          description:   aiData.description || "Found via Bulk Scanner.",
          categoryId:    aiData.categoryId || null,
          img:           base64,
          location:      "SAS Office / Security",
          date:          new Date().toISOString(),
          reporterName:  "Admin Scanner",
          schoolEmail:   "",
        });

        if (createRes.error || createRes?.data?.success === false)
          throw new Error("Failed to save item to database.");

        setItems(prev => prev.map(p => p.id === item.id ? { ...p, status: "success" } : p));
      } catch (err: any) {
        setItems(prev => prev.map(p =>
          p.id === item.id ? { ...p, status: "error", errorMessage: err.message || "Unknown error" } : p
        ));
      }
    }

    setIsProcessing(false);
    toast.success("Bulk processing complete!");
  };

  // Stats
  const total     = items.length;
  const done      = items.filter(i => i.status === "success").length;
  const pending   = items.filter(i => i.status === "pending").length;
  const errored   = items.filter(i => i.status === "error").length;
  const inFlight  = items.filter(i => i.status === "analyzing" || i.status === "uploading").length;

  return (
    <div className="space-y-4 sm:space-y-6 max-w-7xl mx-auto">

      {/* ── Page Header ── */}
      <div className="border-b border-white/5 pb-4">
        <div className="flex justify-end">

          {/* Action buttons */}
          <div className="flex items-center gap-2 flex-wrap">
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
      </div>

      {/* ── Stats Row ── */}
      {items.length > 0 && (
        <div className="grid grid-cols-4 gap-3">
          {[
            { label: "Total",     value: total,   color: "text-white",        bg: "bg-gray-800 border-white/5",              icon: <FaBoxOpen size={12} className="text-gray-400" /> },
            { label: "Queued",    value: pending,  color: "text-blue-400",     bg: "bg-blue-500/5 border-blue-500/10",        icon: <FaUpload size={12} className="text-blue-400" /> },
            { label: "Done",      value: done,     color: "text-emerald-400",  bg: "bg-emerald-500/5 border-emerald-500/10",  icon: <FaCheckCircle size={12} className="text-emerald-400" /> },
            { label: "Errors",    value: errored,  color: "text-red-400",      bg: "bg-red-500/5 border-red-500/10",          icon: <FaTimesCircle size={12} className="text-red-400" /> },
          ].map(s => (
            <div key={s.label} className={`bg-gray-900 border rounded-2xl p-3 sm:p-4 flex flex-col gap-2 ${s.bg}`}>
              <div className="flex items-start justify-between gap-2">
                <div className={`w-7 h-7 sm:w-8 sm:h-8 rounded-lg flex items-center justify-center bg-gray-800 border border-white/5 shrink-0`}>
                  {s.icon}
                </div>
                <span className={`text-2xl sm:text-3xl font-black leading-none tabular-nums ${s.color}`}>{s.value}</span>
              </div>
              <p className="text-xs font-semibold text-gray-500 uppercase tracking-wider">{s.label}</p>
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
          <div className="flex items-center gap-3 text-[10px] text-gray-600 font-medium">
            <span className="px-2 py-0.5 bg-gray-800 border border-white/5 rounded-full">JPG</span>
            <span className="px-2 py-0.5 bg-gray-800 border border-white/5 rounded-full">PNG</span>
            <span className="px-2 py-0.5 bg-gray-800 border border-white/5 rounded-full">WEBP</span>
            <span className="px-2 py-0.5 bg-gray-800 border border-white/5 rounded-full">HEIC</span>
          </div>
        </div>
      </div>

      {/* ── Progress Bar (while processing) ── */}
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

      {/* ── Image Grid ── */}
      {items.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-20 bg-gray-900 border border-dashed border-white/5 rounded-2xl text-gray-600">
          <FaSearch size={28} className="mb-3 opacity-40" />
          <p className="text-sm font-medium text-gray-500">No images queued</p>
          <p className="text-xs mt-1 opacity-60">Drop images above to get started</p>
        </div>
      ) : (
        <div className="bg-gray-900 border border-white/5 rounded-2xl overflow-hidden">

          {/* Table header */}
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
              <div key={item.id} className="grid grid-cols-12 gap-4 items-center px-5 py-3.5 hover:bg-white/[0.02] transition-colors">

                {/* Preview */}
                <div className="col-span-1">
                  <div className="w-10 h-10 rounded-lg overflow-hidden bg-gray-800 border border-white/5 shrink-0">
                    <img src={item.previewUrl} alt="preview" className="w-full h-full object-cover" />
                  </div>
                </div>

                {/* File Name */}
                <div className="col-span-3 min-w-0">
                  <p className="text-white text-xs font-medium truncate">{item.file.name}</p>
                  <p className="text-gray-600 text-[10px] mt-0.5">{(item.file.size / 1024).toFixed(0)} KB</p>
                </div>

                {/* AI Result */}
                <div className="col-span-3 min-w-0">
                  {item.resultDetails ? (
                    <>
                      <p className="text-white text-xs font-semibold truncate">{item.resultDetails.itemName}</p>
                      <p className="text-gray-500 text-[10px] truncate mt-0.5 line-clamp-1">{item.resultDetails.description}</p>
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

                {/* Category */}
                <div className="col-span-2">
                  {item.resultDetails?.categoryName ? (
                    <span className="text-[10px] px-2 py-0.5 bg-white/5 border border-white/5 text-gray-300 rounded-lg">
                      {item.resultDetails.categoryName}
                    </span>
                  ) : (
                    <span className="text-gray-700 text-[10px]">—</span>
                  )}
                </div>

                {/* Status */}
                <div className="col-span-2">
                  <StatusBadge status={item.status} />
                </div>

                {/* Remove */}
                <div className="col-span-1 flex justify-end">
                  {!isProcessing && item.status !== "success" && (
                    <button
                      onClick={() => removeFile(item.id)}
                      className="w-6 h-6 rounded-lg bg-red-500/10 hover:bg-red-500/20 border border-red-500/20 flex items-center justify-center text-red-400 transition-colors"
                    >
                      <FaTimesCircle size={10} />
                    </button>
                  )}
                  {item.status === "success" && (
                    <FaCheckCircle size={14} className="text-emerald-400" />
                  )}
                </div>
              </div>
            ))}
          </div>

          {/* Footer summary */}
          {done > 0 && (
            <div className="px-5 py-3 border-t border-white/5 flex items-center justify-between">
              <p className="text-gray-500 text-xs">
                <span className="text-emerald-400 font-bold">{done}</span> of {total} items saved to the database
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