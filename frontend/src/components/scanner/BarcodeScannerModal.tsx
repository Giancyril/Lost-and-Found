import { useEffect, useRef, useState, useCallback } from "react";
import {
  FaTimes, FaQrcode, FaCheck, FaExclamationTriangle,
  FaCamera, FaSync, FaUserCheck, FaSpinner,
} from "react-icons/fa";

const EMAIL_DOMAIN = "nbsc.edu.ph";

export interface ScannedStudent {
  id:         string;
  name:       string;
  department: string;
  email:      string;
  raw:        string;
}

interface Props {
  onScan:           (student: ScannedStudent) => void;
  onClose:          () => void;
  useFetchStudent?: (id: string) => { data?: any; isFetching: boolean };
}

const autoEmail = (id: string) =>
  id ? `${id.replace(/\s+/g, "")}@${EMAIL_DOMAIN}` : "";

// ── Parse barcode payload ─────────────────────────────────────────────────────
function parseBarcodeText(raw: string): ScannedStudent | null {
  const text = raw.trim();
  if (!text) return null;

  // 1. JSON format
  if (text.startsWith("{")) {
    try {
      const obj   = JSON.parse(text);
      const name  = obj.name || obj.borrowerName || obj.fullName || "";
      const email = obj.email || obj.borrowerEmail || "";
      const id    = String(obj.id || obj.studentId || obj.student_id || "");
      if (!name && !email && !id) return null;
      return {
        id,
        name:       name || "Unknown Student",
        department: obj.department || obj.dept || obj.borrowerDepartment || "",
        email:      email || autoEmail(id),
        raw:        text,
      };
    } catch { /* fall through */ }
  }

  // 2. Pipe-delimited: ID|Name|Department|Email
  const parts = text.split("|").map((p: string) => p.trim());
  if (parts.length >= 2) {
    const id = parts[0] || "";
    return {
      id,
      name:       parts[1] || "",
      department: parts[2] || "",
      email:      parts[3] || autoEmail(id),
      raw:        text,
    };
  }

  // 3. Extract email if present
  let remainder      = text;
  let extractedEmail = "";

  const emailMatch = remainder.match(/([a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,})/i);
  if (emailMatch) {
    extractedEmail = emailMatch[1];
    remainder      = remainder.replace(extractedEmail, "").trim();
  }

  // 4. Extract numeric ID if present
  const idMatch   = remainder.match(/\b(\d{4,})\b/);
  const extractedId = idMatch ? idMatch[1] : "";
  if (idMatch) remainder = remainder.replace(idMatch[0], "").trim();

  const cleanName = remainder.replace(/^[,\-\s]+|[,\-\s]+$/g, "").trim();

  return {
    id:         extractedId || text,   
    name:       cleanName || "",       
    department: "",
    email:      extractedEmail || autoEmail(extractedId || text),
    raw:        text,
  };
}

// Temporary debug — remove after confirming
function useEnrichedStudent(
  parsed: ScannedStudent | null,
  useFetchStudent?: Props["useFetchStudent"],
): { student: ScannedStudent | null; isEnriching: boolean } {
  const hookResult  = useFetchStudent?.(parsed?.id ?? "");
  const dbRaw       = hookResult?.data;
  const isEnriching = (hookResult?.isFetching ?? false) && !!parsed?.id;

  // 🔍 Add this temporarily
  console.log("parsed id:", parsed?.id, "| dbRaw:", dbRaw, "| isEnriching:", isEnriching);

  if (!parsed) return { student: null, isEnriching: false };

  if (dbRaw) {
    const dbStudent =
      (dbRaw?.data?.data && (dbRaw.data.data.name || dbRaw.data.data.department))
        ? dbRaw.data.data
      : (dbRaw?.data && typeof dbRaw.data === "object" && !Array.isArray(dbRaw.data) && (dbRaw.data.name || dbRaw.data.department))
        ? dbRaw.data
      : (dbRaw?.name || dbRaw?.department)
        ? dbRaw
        : null;

    if (dbStudent) {
      return {
        student: {
          ...parsed,
          name:       dbStudent.name       || parsed.name,
          department: dbStudent.department || parsed.department,
          email:      dbStudent.email      || parsed.email || autoEmail(parsed.id),
        },
        isEnriching: false,
      };
    }
  }

  return {
    student:     { ...parsed, email: parsed.email || autoEmail(parsed.id) },
    isEnriching,
  };
}

// ── Scan result card ──────────────────────────────────────────────────────────
function ScanResultCard({
  student, isEnriching, onConfirm, onRescan,
}: {
  student:     ScannedStudent;
  isEnriching: boolean;
  onConfirm:   () => void;
  onRescan:    () => void;
}) {
  return (
    <div className="flex flex-col items-center py-2 animate-fadeIn">
      <div className="relative mb-6">
        <div className="absolute inset-0 bg-emerald-500/20 blur-2xl rounded-full" />
        <div className="relative w-24 h-24 rounded-full bg-emerald-500/10 border-2 border-emerald-500/30 flex items-center justify-center shadow-inner">
          <FaUserCheck size={40} className="text-emerald-400" />
        </div>
        <div className="absolute -bottom-1 -right-1 w-8 h-8 rounded-full bg-emerald-500 border-4 border-gray-900 flex items-center justify-center shadow-lg">
          {isEnriching
            ? <FaSpinner size={12} className="text-white animate-spin" />
            : <FaCheck   size={12} className="text-white" />}
        </div>
      </div>

      <div className="text-center mb-6">
        <div className="inline-flex items-center gap-2 px-2 py-0.5 rounded-full bg-emerald-500/10 border border-emerald-500/20 mb-3">
          <div className={`w-1.5 h-1.5 rounded-full ${isEnriching ? "bg-amber-400 animate-pulse" : "bg-emerald-400"}`} />
          <p className="text-[10px] font-black text-emerald-400 uppercase tracking-[0.2em]">
            {isEnriching ? "Verifying Info…" : "Student Identified"}
          </p>
        </div>
        <h3 className="text-2xl font-black text-white leading-tight px-4">
          {student.name || student.id}
        </h3>
        {student.id && student.name && (
          <p className="text-sm font-medium text-gray-500 mt-1 tracking-widest">ID: {student.id}</p>
        )}
      </div>

      <div className="w-full space-y-3 mb-8">
        {student.department && (
          <div className="group relative overflow-hidden px-4 py-3 rounded-2xl bg-white/5 border border-white/10 hover:border-blue-500/30 transition-all duration-300">
            <div className="absolute top-0 right-0 w-24 h-24 bg-blue-500/5 blur-2xl -mr-12 -mt-12 group-hover:bg-blue-500/10 transition-all" />
            <p className="text-[9px] font-bold text-gray-500 uppercase tracking-widest mb-1">Department / Section</p>
            <p className="text-sm font-semibold text-blue-300 relative z-10 break-words">{student.department}</p>
          </div>
        )}
        <div className="px-4 py-3 rounded-2xl bg-white/5 border border-white/10 flex items-center justify-between">
          <div className="min-w-0">
            <p className="text-[9px] font-bold text-gray-500 uppercase tracking-widest mb-1">Email Address</p>
            <p className="text-sm font-medium text-gray-300 truncate">
              {student.email || (isEnriching ? "Fetching…" : "Not provided")}
            </p>
          </div>
          {student.email?.endsWith(`@${EMAIL_DOMAIN}`) && (
            <span className="shrink-0 px-2 py-0.5 rounded-md bg-white/5 border border-white/10 text-[9px] font-bold text-gray-600 uppercase">
              Auto
            </span>
          )}
        </div>
      </div>

      <div className="flex gap-3 w-full">
        <button
          onClick={onRescan}
          className="flex-1 flex items-center justify-center gap-2 py-2.5 border border-white/10 text-gray-400 hover:text-white hover:bg-white/5 text-xs font-bold rounded-xl transition-all active:scale-95"
        >
          <FaSync size={10} /> Rescan
        </button>
        <button
          onClick={onConfirm}
          disabled={isEnriching}
          className="flex-1 flex items-center justify-center gap-2 py-2.5 bg-blue-600 hover:bg-blue-500 disabled:opacity-50 text-white text-xs font-black rounded-xl transition-all active:scale-95"
        >
          {isEnriching
            ? <><FaSpinner size={10} className="animate-spin" /> Confirming…</>
            : <><FaCheck   size={10} /> Use Student</>}
        </button>
      </div>
    </div>
  );
}

// ── Main Modal ────────────────────────────────────────────────────────────────
export default function BarcodeScannerModal({ onScan, onClose, useFetchStudent }: Props) {
  const videoRef      = useRef<HTMLVideoElement>(null);
  const canvasRef     = useRef<HTMLCanvasElement>(null);
  const streamRef     = useRef<MediaStream | null>(null);
  const rafRef        = useRef<number | null>(null);
  const isActiveRef   = useRef(false);
  const isStartingRef = useRef(false);
  const detectorRef   = useRef<any>(null);

  const [phase,      setPhase]      = useState<"scanning" | "result" | "error">("scanning");
  const [parsed,     setParsed]     = useState<ScannedStudent | null>(null);
  const [errorMsg,   setErrorMsg]   = useState("");
  const [facingMode, setFacingMode] = useState<"environment" | "user">("environment");
  const [scanning,   setScanning]   = useState(false);

  const { student: scanned, isEnriching } = useEnrichedStudent(parsed, useFetchStudent);

  // ── Full stop ──────────────────────────────────────────────────────────────
  const stopAll = useCallback(() => {
    isActiveRef.current   = false;
    isStartingRef.current = false;
    if (rafRef.current) {
      cancelAnimationFrame(rafRef.current);
      rafRef.current = null;
    }
    if (streamRef.current) {
      streamRef.current.getTracks().forEach(t => t.stop());
      streamRef.current = null;
    }
    if (videoRef.current) {
      videoRef.current.srcObject = null;
    }
  }, []);

  // ── Build or reuse BarcodeDetector ────────────────────────────────────────
  const getDetector = useCallback(async () => {
    if (detectorRef.current) return detectorRef.current;

    // Native BarcodeDetector — hardware-accelerated, available on Chrome/Android/Safari 17+
    if ("BarcodeDetector" in window) {
      const supported = await (window as any).BarcodeDetector.getSupportedFormats();
      detectorRef.current = new (window as any).BarcodeDetector({ formats: supported });
      return detectorRef.current;
    }

    // Polyfill for Firefox / older browsers
    const { BarcodeDetector } = await import("barcode-detector");
    detectorRef.current = new BarcodeDetector({
      formats: ["code_128", "code_39", "ean_13", "ean_8", "qr_code", "data_matrix"],
    });
    return detectorRef.current;
  }, []);

  // ── Start camera + decode loop ─────────────────────────────────────────────
  const startDecoding = useCallback(async (mode?: "environment" | "user") => {
    if (isStartingRef.current) return;
    isStartingRef.current = true;
    isActiveRef.current   = false;
    setScanning(false);

    if (rafRef.current)    { cancelAnimationFrame(rafRef.current); rafRef.current = null; }
    if (streamRef.current) { streamRef.current.getTracks().forEach(t => t.stop()); streamRef.current = null; }
    if (videoRef.current)  { videoRef.current.srcObject = null; videoRef.current.load(); }

    await new Promise(r => setTimeout(r, 200));

    try {
      const detector   = await getDetector();
      const targetMode = mode ?? facingMode;

      const stream = await navigator.mediaDevices.getUserMedia({
        video: {
          facingMode: targetMode,
          width:      { ideal: 1920 },
          height:     { ideal: 1080 },
        },
      });

      if (!videoRef.current) {
        stream.getTracks().forEach(t => t.stop());
        isStartingRef.current = false;
        return;
      }

      streamRef.current          = stream;
      videoRef.current.srcObject = stream;

      await new Promise<void>((resolve, reject) => {
        if (!videoRef.current) return reject();
        videoRef.current.onloadedmetadata = () => resolve();
        videoRef.current.onerror          = () => reject(new Error("Video error"));
      });

      await videoRef.current.play();

      isActiveRef.current   = true;
      isStartingRef.current = false;
      setScanning(true);

      // ── rAF decode loop — runs every 150ms, hardware-accelerated ──────────
      let lastDetect = 0;
      const INTERVAL = 150;

      const tick = async (now: number) => {
        if (!isActiveRef.current) return;

        if (now - lastDetect >= INTERVAL) {
          lastDetect = now;
          const video  = videoRef.current;
          const canvas = canvasRef.current;

          if (video && canvas && video.readyState === video.HAVE_ENOUGH_DATA) {
            canvas.width  = video.videoWidth;
            canvas.height = video.videoHeight;
            const ctx = canvas.getContext("2d", { willReadFrequently: true });
            if (ctx) {
              ctx.drawImage(video, 0, 0, canvas.width, canvas.height);
              try {
                const results = await detector.detect(canvas);
                if (results.length > 0 && isActiveRef.current) {
                  const raw     = results[0].rawValue;
                  const student = parseBarcodeText(raw);
                  if (student) {
                    isActiveRef.current = false;
                    stopAll();
                    setParsed(student);
                    setPhase("result");
                    return;
                  }
                }
              } catch { /* frame failed, keep going */ }
            }
          }
        }

        rafRef.current = requestAnimationFrame(tick);
      };

      rafRef.current = requestAnimationFrame(tick);

    } catch (e: any) {
      isStartingRef.current = false;
      isActiveRef.current   = false;
      setErrorMsg(
        e?.name === "NotAllowedError" || e?.message?.includes("Permission")
          ? "Camera permission denied. Please allow camera access and try again."
          : e?.message ?? "Unable to start the camera."
      );
      setPhase("error");
    }
  }, [facingMode, getDetector, stopAll]);

  useEffect(() => {
    startDecoding();
    return () => { stopAll(); };
  }, []);

  const switchCamera = (mode: "environment" | "user") => {
    setFacingMode(mode);
    startDecoding(mode);
  };

  const handleConfirm = () => {
    if (scanned && !isEnriching) { stopAll(); onScan(scanned); }
  };

  const handleRescan = () => {
    setParsed(null);
    setPhase("scanning");
    startDecoding();
  };

  const Corner = ({ pos }: { pos: "tl" | "tr" | "bl" | "br" }) => {
    const sides: Record<string, string> = {
      tl: "top-0 left-0 border-t border-l rounded-tl-lg",
      tr: "top-0 right-0 border-t border-r rounded-tr-lg",
      bl: "bottom-0 left-0 border-b border-l rounded-bl-lg",
      br: "bottom-0 right-0 border-b border-r rounded-br-lg",
    };
    return <div className={`absolute w-7 h-7 border-[3px] border-blue-400 ${sides[pos]}`} />;
  };

  return (
    <div className="fixed inset-0 bg-black/80 backdrop-blur-sm flex items-center justify-center z-50 p-4">
      <div className="bg-gray-900 border border-white/10 rounded-2xl w-full sm:max-w-md shadow-2xl overflow-hidden max-h-[90vh] flex flex-col">

        {/* Header */}
        <div className="flex items-center justify-between px-5 py-4 border-b border-white/5">
          <div className="flex items-center gap-2.5">
            <div className="w-7 h-7 rounded-lg bg-blue-500/15 border border-blue-500/25 flex items-center justify-center">
              <FaQrcode size={13} className="text-blue-400" />
            </div>
            <div>
              <h3 className="text-sm font-bold text-white">Scan Student ID</h3>
              <p className="text-[10px] text-gray-500">Use back camera for best results</p>
            </div>
          </div>
          <button
            onClick={() => { stopAll(); onClose(); }}
            className="w-8 h-8 flex items-center justify-center rounded-xl bg-white/5 hover:bg-white/10 text-gray-400 hover:text-white transition-colors"
          >
            <FaTimes size={13} />
          </button>
        </div>

        {/* Body */}
        <div className="p-5">
          {phase === "scanning" && (
            <div className="space-y-4">
              <div className="relative bg-black rounded-2xl overflow-hidden aspect-[3/4] sm:aspect-video flex items-center justify-center">
                {/* Hidden canvas for frame capture */}
                <canvas ref={canvasRef} className="hidden" />

                <video
                  ref={videoRef}
                  className="w-full h-full object-cover"
                  muted
                  playsInline
                />

                {scanning && (
                  <>
                    <div className="absolute inset-0 bg-gradient-to-b from-black/30 via-transparent to-black/30 pointer-events-none" />
                    <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
                      <div className="relative w-56 h-40">
                        <Corner pos="tl" /><Corner pos="tr" />
                        <Corner pos="bl" /><Corner pos="br" />
                        <div
                          className="absolute left-2 right-2 h-px bg-blue-400/70"
                          style={{
                            animation: "scanline 1.2s ease-in-out infinite",
                            boxShadow: "0 0 8px 2px rgba(96,165,250,0.4)",
                          }}
                        />
                      </div>
                    </div>
                    <div className="absolute bottom-3 left-3 px-2 py-1 rounded-lg bg-black/60 text-gray-400 text-[10px] capitalize">
                      {facingMode === "environment" ? "Back Camera" : "Front Camera"}
                    </div>
                  </>
                )}

                {!scanning && (
                  <div className="absolute inset-0 flex flex-col items-center justify-center gap-3 bg-gray-950">
                    <FaCamera size={28} className="text-gray-600 animate-pulse" />
                    <p className="text-gray-500 text-xs">Starting camera…</p>
                  </div>
                )}
              </div>

              <p className="text-center text-gray-600 text-xs">
                Hold the barcode steady within the frame
              </p>

              <div className="flex gap-3">
                {(["environment", "user"] as const).map(mode => (
                  <button
                    key={mode}
                    onClick={() => switchCamera(mode)}
                    className={`flex-1 flex items-center justify-center gap-2 py-2 border text-xs font-medium rounded-xl transition-all ${
                      facingMode === mode
                        ? "bg-blue-600/20 border-blue-500/50 text-blue-400"
                        : "border-white/8 text-gray-400 hover:text-white hover:bg-gray-800"
                    }`}
                  >
                    {mode === "environment"
                      ? <><FaCamera size={10} /> Back Cam</>
                      : <><FaUserCheck size={10} /> Front Cam</>}
                  </button>
                ))}
              </div>
            </div>
          )}

          {phase === "result" && scanned && (
            <ScanResultCard
              student={scanned}
              isEnriching={isEnriching}
              onConfirm={handleConfirm}
              onRescan={handleRescan}
            />
          )}

          {phase === "error" && (
            <div className="flex flex-col items-center gap-4 py-6 text-center">
              <div className="w-16 h-16 rounded-full bg-red-500/10 border border-red-500/20 flex items-center justify-center">
                <FaExclamationTriangle size={24} className="text-red-400" />
              </div>
              <div>
                <p className="text-white font-semibold text-sm mb-1">Camera Error</p>
                <p className="text-gray-500 text-xs max-w-xs">{errorMsg}</p>
              </div>
              <button
                onClick={() => { setPhase("scanning"); setErrorMsg(""); startDecoding(); }}
                className="inline-flex items-center gap-2 px-4 py-2 bg-gray-800 hover:bg-gray-700 border border-white/8 text-gray-300 text-xs font-semibold rounded-xl transition-all"
              >
                <FaSync size={10} /> Try Again
              </button>
            </div>
          )}
        </div>
      </div>

      <style>{`
        @keyframes scanline {
          0%   { top: 8px; opacity: 1; }
          50%  { top: calc(100% - 8px); opacity: 0.7; }
          100% { top: 8px; opacity: 1; }
        }
        @keyframes fadeIn {
          from { opacity: 0; transform: translateY(8px); }
          to   { opacity: 1; transform: translateY(0); }
        }
        .animate-fadeIn { animation: fadeIn 0.3s ease-out both; }
      `}</style>
    </div>
  );
}
