import { useEffect, useRef, useState, useCallback } from "react";
import {
  FaTimes, FaCheck, FaExclamationTriangle,
  FaCamera, FaSync, FaUserCheck, FaSpinner,
  FaQrcode,
} from "react-icons/fa";

const EMAIL_DOMAIN = "nbsc.edu.ph";

export interface ScannedStudent {
  id: string;
  name: string;
  department: string;
  email: string;
  raw: string;
}

interface Props {
  onScan: (student: ScannedStudent) => void;
  onClose: () => void;
  useFetchStudent?: (id: string) => { data?: any; isFetching: boolean };
}

const autoEmail = (id: string) =>
  id ? `${id.replace(/\s+/g, "")}@${EMAIL_DOMAIN}` : "";

// ✅ SECURITY: Sanitize HTML to prevent XSS injection
function sanitizeText(text: string): string {
  if (!text) return "";
  // Remove all HTML tags and dangerous characters
  return text
    .replace(/<[^>]*>/g, "") // Remove HTML tags
    .replace(/[<>'"&]/g, "") // Remove dangerous characters
    .replace(/javascript:/gi, "") // Remove javascript: protocol
    .replace(/on\w+\s*=\s*["'][^"']*["']/gi, "") // Remove event handlers
    .trim();
}

// ── Parse barcode payload ─────────────────────────────────────────────────────
function parseBarcodeText(raw: string): ScannedStudent | null {
  // ✅ SECURITY: Limit input length to prevent DoS
  const MAX_LENGTH = 1000;
  if (raw.length > MAX_LENGTH) {
    console.warn(`[Scanner] Input too long (${raw.length} chars), truncating`);
    raw = raw.substring(0, MAX_LENGTH);
  }

  const text = sanitizeText(raw);
  if (!text) return null;

  if (text.startsWith("{")) {
    try {
      const obj = JSON.parse(text);
      const name = sanitizeText(obj.name || obj.borrowerName || obj.fullName || "");
      const email = sanitizeText(obj.email || obj.borrowerEmail || "");
      const id = sanitizeText(String(obj.id || obj.studentId || obj.student_id || ""));
      const department = sanitizeText(obj.department || obj.dept || obj.borrowerDepartment || "");
      
      if (!name && !email && !id) return null;
      return {
        id,
        name: name || "Unknown Student",
        department,
        email: email || autoEmail(id),
        raw: text,
      };
    } catch { /* fall through */ }
  }

  const parts = text.split("|").map((p: string) => sanitizeText(p));
  if (parts.length >= 2) {
    const id = parts[0] || "";
    return {
      id,
      name: parts[1] || "",
      department: parts[2] || "",
      email: parts[3] || autoEmail(id),
      raw: text,
    };
  }

  let remainder = text;
  let extractedEmail = "";

  const emailMatch = remainder.match(/([a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,})/i);
  if (emailMatch) {
    extractedEmail = sanitizeText(emailMatch[1]);
    remainder = remainder.replace(emailMatch[1], "").trim();
  }

  const idMatch = remainder.match(/\b(\d{4,})\b/);
  const extractedId = idMatch ? sanitizeText(idMatch[1]) : "";
  if (idMatch) remainder = remainder.replace(idMatch[0], "").trim();

  const cleanName = sanitizeText(remainder.replace(/^[,\-\s]+|[,\-\s]+$/g, ""));

  return {
    id: extractedId || text,
    name: cleanName || "",
    department: "",
    email: extractedEmail || autoEmail(extractedId || text),
    raw: text,
  };
}

function useEnrichedStudent(
  parsed: ScannedStudent | null,
  useFetchStudent?: Props["useFetchStudent"],
): { student: ScannedStudent | null; isEnriching: boolean } {
  const hookResult = useFetchStudent?.(parsed?.id ?? "");
  const dbRaw = hookResult?.data;
  const isEnriching = (hookResult?.isFetching ?? false) && !!parsed?.id;

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
          name: dbStudent.name || parsed.name,
          department: dbStudent.department || parsed.department,
          email: dbStudent.email || parsed.email || autoEmail(parsed.id),
        },
        isEnriching: false,
      };
    }
  }

  return {
    student: { ...parsed, email: parsed.email || autoEmail(parsed.id) },
    isEnriching,
  };
}

// ── Scan result card ──────────────────────────────────────────────────────────
function ScanResultCard({
  student, isEnriching, onConfirm, onRescan,
}: {
  student: ScannedStudent;
  isEnriching: boolean;
  onConfirm: () => void;
  onRescan: () => void;
}) {
  return (
    <div className="flex flex-col items-center py-2 animate-fadeIn">
      {/* Avatar */}
      <div className="relative mb-5">
        <div className="w-20 h-20 rounded-2xl bg-emerald-500/10 border-2 border-emerald-500/30 flex items-center justify-center shadow-inner">
          <FaUserCheck size={34} className="text-emerald-400" />
        </div>
        <div className="absolute -bottom-1.5 -right-1.5 w-7 h-7 rounded-full bg-emerald-500 border-4 border-gray-900 flex items-center justify-center shadow-lg">
          {isEnriching
            ? <FaSpinner size={10} className="text-white animate-spin" />
            : <FaCheck size={10} className="text-white" />}
        </div>
      </div>

      {/* Status pill */}
      <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-emerald-500/10 border border-emerald-500/20 mb-3">
        <div className={`w-1.5 h-1.5 rounded-full ${isEnriching ? "bg-amber-400 animate-pulse" : "bg-emerald-400"}`} />
        <p className="text-[10px] font-black text-emerald-400 uppercase tracking-[0.2em]">
          {isEnriching ? "Verifying Info…" : "Student Identified"}
        </p>
      </div>

      {/* Name */}
      <h3 className="text-xl font-black text-white leading-tight text-center px-2 mb-1">
        {student.name || student.id}
      </h3>
      {student.id && student.name && (
        <p className="text-xs font-medium text-gray-500 tracking-widest mb-5">ID: {student.id}</p>
      )}

      {/* Info rows */}
      <div className="w-full space-y-2.5 mb-6">
        <div className="px-4 py-3 rounded-xl bg-white/5 border border-white/8 flex items-center justify-between gap-3">
          <div className="min-w-0">
            <p className="text-[9px] font-bold text-gray-500 uppercase tracking-widest mb-1">Email Address</p>
            <p className="text-sm font-medium text-gray-300 truncate">
              {student.email || (isEnriching ? "Fetching…" : "Not provided")}
            </p>
          </div>
          {student.email?.endsWith(`@${EMAIL_DOMAIN}`) && (
            <span className="shrink-0 px-2 py-0.5 rounded-md bg-white/5 border border-white/8 text-[9px] font-bold text-gray-600 uppercase">
              Auto
            </span>
          )}
        </div>

        {student.department && (
          <div className="px-4 py-3 rounded-xl bg-white/5 border border-white/8">
            <p className="text-[9px] font-bold text-gray-500 uppercase tracking-widest mb-1">Department</p>
            <p className="text-sm font-semibold text-blue-300 break-words">{student.department}</p>
          </div>
        )}
      </div>

      {/* Buttons */}
      <div className="flex gap-2.5 w-full">
        <button
          onClick={onRescan}
          className="flex-1 flex items-center justify-center gap-2 py-2.5 border border-white/8 text-gray-400 hover:text-white hover:bg-white/5 text-xs font-bold rounded-xl transition-all active:scale-95"
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
            : <><FaCheck size={10} /> Use Student</>}
        </button>
      </div>
    </div>
  );
}

// ── Camera toggle button ──────────────────────────────────────────────────────
function CamToggle({
  mode, active, onClick,
}: {
  mode: "environment" | "user";
  active: boolean;
  onClick: () => void;
}) {
  return (
    <button
      onClick={onClick}
      className={`flex-1 flex items-center justify-center gap-2 py-2 border text-xs font-semibold rounded-xl transition-all
        ${active
          ? "bg-blue-600/20 border-blue-500/50 text-blue-400"
          : "border-white/8 text-gray-400 hover:text-white hover:bg-white/5"}`}
    >
      {mode === "environment"
        ? <><FaCamera size={10} /> Back Cam</>
        : <><FaUserCheck size={10} /> Front Cam</>}
    </button>
  );
}

// ── Viewfinder corner ─────────────────────────────────────────────────────────
const Corner = ({ pos }: { pos: "tl" | "tr" | "bl" | "br" }) => {
  const sides: Record<string, string> = {
    tl: "top-0 left-0 border-t border-l rounded-tl-lg",
    tr: "top-0 right-0 border-t border-r rounded-tr-lg",
    bl: "bottom-0 left-0 border-b border-l rounded-bl-lg",
    br: "bottom-0 right-0 border-b border-r rounded-br-lg",
  };
  return <div className={`absolute w-7 h-7 border-[3px] border-blue-400 ${sides[pos]}`} />;
};

// ── Main Modal ────────────────────────────────────────────────────────────────
export default function BarcodeScannerModal({ onScan, onClose, useFetchStudent }: Props) {
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const rafRef = useRef<number | null>(null);
  const isActiveRef = useRef(false);
  const isStartingRef = useRef(false);
  const detectorRef = useRef<any>(null);

  const [phase, setPhase] = useState<"scanning" | "result" | "error">("scanning");
  const [parsed, setParsed] = useState<ScannedStudent | null>(null);
  const [errorMsg, setErrorMsg] = useState("");
  const [facingMode, setFacingMode] = useState<"environment" | "user">("environment");
  const [scanning, setScanning] = useState(false);

  const { student: scanned, isEnriching } = useEnrichedStudent(parsed, useFetchStudent);

  const stopAll = useCallback(() => {
    isActiveRef.current = false;
    isStartingRef.current = false;
    if (rafRef.current) { cancelAnimationFrame(rafRef.current); rafRef.current = null; }
    if (streamRef.current) { streamRef.current.getTracks().forEach(t => t.stop()); streamRef.current = null; }
    if (videoRef.current) { videoRef.current.srcObject = null; }
  }, []);

  const getDetector = useCallback(async () => {
    if (detectorRef.current) return detectorRef.current;
    if ("BarcodeDetector" in window) {
      const supported = await (window as any).BarcodeDetector.getSupportedFormats();
      detectorRef.current = new (window as any).BarcodeDetector({ formats: supported });
      return detectorRef.current;
    }
    const { BarcodeDetector } = await import("barcode-detector");
    detectorRef.current = new BarcodeDetector({
      formats: ["code_128", "code_39", "ean_13", "ean_8", "qr_code", "data_matrix"],
    });
    return detectorRef.current;
  }, []);

  const startDecoding = useCallback(async (mode?: "environment" | "user") => {
    if (isStartingRef.current) return;
    isStartingRef.current = true;
    isActiveRef.current = false;
    setScanning(false);

    if (rafRef.current) { cancelAnimationFrame(rafRef.current); rafRef.current = null; }
    if (streamRef.current) { streamRef.current.getTracks().forEach(t => t.stop()); streamRef.current = null; }
    if (videoRef.current) { videoRef.current.srcObject = null; videoRef.current.load(); }

    await new Promise(r => setTimeout(r, 200));

    try {
      const detector = await getDetector();
      const targetMode = mode ?? facingMode;

      const stream = await navigator.mediaDevices.getUserMedia({
        video: { facingMode: targetMode, width: { ideal: 1920 }, height: { ideal: 1080 } },
      });

      if (!videoRef.current) { stream.getTracks().forEach(t => t.stop()); isStartingRef.current = false; return; }

      streamRef.current = stream;
      videoRef.current.srcObject = stream;

      await new Promise<void>((resolve, reject) => {
        if (!videoRef.current) return reject();
        videoRef.current.onloadedmetadata = () => resolve();
        videoRef.current.onerror = () => reject(new Error("Video error"));
      });

      await videoRef.current.play();
      isActiveRef.current = true;
      isStartingRef.current = false;
      setScanning(true);

      let lastDetect = 0;
      const INTERVAL = 150;

      const tick = async (now: number) => {
        if (!isActiveRef.current) return;
        if (now - lastDetect >= INTERVAL) {
          lastDetect = now;
          const video = videoRef.current;
          const canvas = canvasRef.current;
          if (video && canvas && video.readyState === video.HAVE_ENOUGH_DATA) {
            canvas.width = video.videoWidth;
            canvas.height = video.videoHeight;
            const ctx = canvas.getContext("2d", { willReadFrequently: true });
            if (ctx) {
              ctx.drawImage(video, 0, 0, canvas.width, canvas.height);
              try {
                const results = await detector.detect(canvas);
                if (results.length > 0 && isActiveRef.current) {
                  const raw = results[0].rawValue;
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
      isActiveRef.current = false;
      setErrorMsg(
        e?.name === "NotAllowedError" || e?.message?.includes("Permission")
          ? "Camera permission denied. Please allow camera access and try again."
          : e?.message ?? "Unable to start the camera."
      );
      setPhase("error");
    }
  }, [facingMode, getDetector, stopAll]);

  useEffect(() => { startDecoding(); return () => { stopAll(); }; }, []);

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

  return (
    <>
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

      {/* ── Backdrop ── */}
      <div
        className="fixed inset-0 z-[200] bg-black/80 backdrop-blur-sm flex items-start justify-center p-4 sm:p-6 pt-10 overflow-y-auto"
        onClick={() => { stopAll(); onClose(); }}
      >
        {/* ── Modal — same shape/style as "Log a Found Item" ── */}
        <div
          className="relative bg-gray-900 border border-white/10 rounded-2xl w-full max-w-md shadow-2xl shadow-black/50 flex flex-col"
          style={{ borderTop: "2px solid #3b82f6", maxHeight: "88vh" }}
          onClick={e => e.stopPropagation()}
        >

          {/* ── Header ── */}
          <div className="px-5 py-4 border-b border-white/5 shrink-0">
            <div className="flex items-center justify-between gap-4">
              <div className="flex items-center gap-3 min-w-0">
                <div className="w-9 h-9 rounded-xl bg-blue-500/10 border border-blue-500/20 flex items-center justify-center shrink-0">
                  <FaQrcode className="text-blue-400" size={14} />
                </div>
                <div className="min-w-0">
                  <h3 className="text-base font-bold text-white truncate">Scan Student ID</h3>
                  <p className="text-gray-500 text-[11px] mt-0.5 truncate">Use back camera for best results</p>
                </div>
              </div>
              <button
                onClick={() => { stopAll(); onClose(); }}
                className="w-7 h-7 rounded-lg bg-white/5 hover:bg-white/10 flex items-center justify-center text-gray-400 hover:text-white transition-colors shrink-0"
              >
                <FaTimes size={12} />
              </button>
            </div>
          </div>

          {/* ── Body ── */}
          <div
            className="overflow-y-auto flex-1 px-5 py-5"
            style={{ scrollbarWidth: "thin", scrollbarColor: "rgba(255,255,255,0.2) rgba(255,255,255,0.05)" }}
          >
            {/* ── SCANNING phase ── */}
            {phase === "scanning" && (
              <div className="space-y-4">
                {/* Viewfinder */}
                <div className="relative bg-black rounded-2xl overflow-hidden aspect-[4/3] flex items-center justify-center border border-white/5">
                  <canvas ref={canvasRef} className="hidden" />
                  <video ref={videoRef} className="w-full h-full object-cover" muted playsInline />

                  {scanning && (
                    <>
                      <div className="absolute inset-0 bg-gradient-to-b from-black/30 via-transparent to-black/30 pointer-events-none" />
                      <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
                        <div className="relative w-52 h-36">
                          <Corner pos="tl" /><Corner pos="tr" />
                          <Corner pos="bl" /><Corner pos="br" />
                          <div
                            className="absolute left-2 right-2 h-px bg-blue-400/70"
                            style={{ animation: "scanline 1.2s ease-in-out infinite", boxShadow: "0 0 8px 2px rgba(96,165,250,0.4)" }}
                          />
                        </div>
                      </div>
                      <div className="absolute bottom-3 left-3 px-2 py-1 rounded-lg bg-black/60 text-gray-400 text-[10px] capitalize">
                        {facingMode === "environment" ? "Back Camera" : "Front Camera"}
                      </div>
                    </>
                  )}

                  {!scanning && (
                    <div className="absolute inset-0 flex flex-col items-center justify-center gap-3 bg-gray-950/80">
                      <FaCamera size={26} className="text-gray-600 animate-pulse" />
                      <p className="text-gray-500 text-xs">Starting camera…</p>
                    </div>
                  )}
                </div>

                {/* Hint */}
                <p className="text-center text-gray-600 text-xs">
                  Hold the barcode or QR code steady within the frame
                </p>

                {/* Camera toggle */}
                <div className="flex gap-2.5">
                  <CamToggle mode="environment" active={facingMode === "environment"} onClick={() => switchCamera("environment")} />
                  <CamToggle mode="user" active={facingMode === "user"} onClick={() => switchCamera("user")} />
                </div>
              </div>
            )}

            {/* ── RESULT phase ── */}
            {phase === "result" && scanned && (
              <ScanResultCard
                student={scanned}
                isEnriching={isEnriching}
                onConfirm={handleConfirm}
                onRescan={handleRescan}
              />
            )}

            {/* ── ERROR phase ── */}
            {phase === "error" && (
              <div className="flex flex-col items-center gap-4 py-8 text-center">
                <div className="w-16 h-16 rounded-2xl bg-red-500/10 border border-red-500/20 flex items-center justify-center">
                  <FaExclamationTriangle size={22} className="text-red-400" />
                </div>
                <div>
                  <p className="text-white font-semibold text-sm mb-1.5">Camera Error</p>
                  <p className="text-gray-500 text-xs max-w-xs leading-relaxed">{errorMsg}</p>
                </div>
                <button
                  onClick={() => {
                    if (errorMsg.includes("Permission") || errorMsg.includes("permission")) {
                      window.location.reload();
                    } else {
                      setPhase("scanning"); setErrorMsg(""); startDecoding();
                    }
                  }}
                  className="inline-flex items-center gap-2 px-5 py-2.5 bg-gray-800 hover:bg-gray-700 border border-white/8 text-gray-300 text-xs font-semibold rounded-xl transition-all"
                >
                  <FaSync size={10} /> {(errorMsg.includes("Permission") || errorMsg.includes("permission")) ? "Refresh Page" : "Try Again"}
                </button>
              </div>
            )}
          </div>
        </div>
      </div>
    </>
  );
}