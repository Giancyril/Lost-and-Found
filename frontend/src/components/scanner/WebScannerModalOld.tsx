import React, { useState, useRef, useEffect, useCallback } from 'react';
import {
  XMarkIcon,
  CameraIcon,
  CheckIcon,
  ExclamationTriangleIcon,
  UserIcon,       // ← was UserCheckIcon (doesn't exist in heroicons v2)
  ArrowPathIcon,
} from '@heroicons/react/24/outline';
import jsQR from 'jsqr';
import Quagga from 'quagga';

const EMAIL_DOMAIN = "nbsc.edu.ph";

export interface ScannedStudent {
  id:         string;
  name:       string;
  department: string;
  email:      string;
  raw:        string;
}

interface WebScannerModalProps {
  isOpen: boolean;
  onClose: () => void;
  onScanSuccess: (student: ScannedStudent) => void;
  onError: (error: string) => void;
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
  const idMatch     = remainder.match(/\b(\d{4,})\b/);
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

// Student enrichment hook
function useEnrichedStudent(
  parsed: ScannedStudent | null,
  useFetchStudent?: WebScannerModalProps["useFetchStudent"],
): { student: ScannedStudent | null; isEnriching: boolean } {
  const hookResult  = useFetchStudent?.(parsed?.id ?? "");
  const dbRaw       = hookResult?.data;
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

// Scan result card component
function ScanResultCard({
  student,
  isEnriching,
  onConfirm,
  onRescan,
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
          <UserIcon className="h-10 w-10 text-emerald-400" />
        </div>
        <div className="absolute -bottom-1 -right-1 w-8 h-8 rounded-full bg-emerald-500 border-4 border-gray-900 flex items-center justify-center shadow-lg">
          {isEnriching ? (
            <div className="w-3 h-3 border-2 border-white border-t-transparent rounded-full animate-spin" />
          ) : (
            <CheckIcon className="h-3 w-3 text-white" />
          )}
        </div>
      </div>

      <div className="text-center mb-6">
        <div className="inline-flex items-center gap-2 px-2 py-0.5 rounded-full bg-emerald-500/10 border border-emerald-500/20 mb-3">
          <div
            className={`w-1.5 h-1.5 rounded-full ${
              isEnriching ? "bg-amber-400 animate-pulse" : "bg-emerald-400"
            }`}
          />
          <p className="text-[10px] font-black text-emerald-400 uppercase tracking-[0.2em]">
            {isEnriching ? "Verifying Info…" : "Student Identified"}
          </p>
        </div>
        <h3 className="text-2xl font-black text-white leading-tight px-4">
          {student.name || student.id}
        </h3>
        {student.id && student.name && (
          <p className="text-sm font-medium text-gray-500 mt-1 tracking-widest">
            ID: {student.id}
          </p>
        )}
      </div>

      <div className="w-full space-y-3 mb-8">
        <div className="px-4 py-3 rounded-2xl bg-white/5 border border-white/10 flex items-center justify-between">
          <div className="min-w-0">
            <p className="text-[9px] font-bold text-gray-500 uppercase tracking-widest mb-1">
              Email Address
            </p>
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

        {student.department && (
          <div className="group relative overflow-hidden px-4 py-3 rounded-2xl bg-white/5 border border-white/10 hover:border-blue-500/30 transition-all duration-300">
            <div className="absolute top-0 right-0 w-24 h-24 bg-blue-500/5 blur-2xl -mr-12 -mt-12 group-hover:bg-blue-500/10 transition-all" />
            <p className="text-[9px] font-bold text-gray-500 uppercase tracking-widest mb-1">
              Department
            </p>
            <p className="text-sm font-semibold text-blue-300 relative z-10 break-words">
              {student.department}
            </p>
          </div>
        )}
      </div>

      <div className="flex gap-3 w-full">
        <button
          onClick={onRescan}
          className="flex-1 flex items-center justify-center gap-2 py-2.5 border border-white/10 text-gray-400 hover:text-white hover:bg-white/5 text-xs font-bold rounded-xl transition-all active:scale-95"
        >
          <ArrowPathIcon className="h-2.5 w-2.5" /> Rescan
        </button>
        <button
          onClick={onConfirm}
          disabled={isEnriching}
          className="flex-1 flex items-center justify-center gap-2 py-2.5 bg-blue-600 hover:bg-blue-500 disabled:opacity-50 text-white text-xs font-black rounded-xl transition-all active:scale-95"
        >
          {isEnriching ? (
            <>
              <div className="w-2.5 h-2.5 border-2 border-white border-t-transparent rounded-full animate-spin" />
              Confirming…
            </>
          ) : (
            <>
              <CheckIcon className="h-2.5 w-2.5" /> Use Student
            </>
          )}
        </button>
      </div>
    </div>
  );
}

export default function WebScannerModalOld({
  isOpen,
  onClose,
  onScanSuccess,
  onError,
  useFetchStudent,
}: WebScannerModalProps) {
  const [isScanning, setIsScanning]             = useState(false);
  const [activeScanner, setActiveScanner]       = useState<'jsqr' | 'quagga' | 'native' | null>(null);
  const [cameraPermission, setCameraPermission] = useState<boolean | null>(null);
  const [scanAttempts, setScanAttempts]         = useState(0);
  const [phase, setPhase]                       = useState<"scanning" | "result" | "error">("scanning");
  const [errorMsg, setErrorMsg]                 = useState("");
  const [facingMode, setFacingMode]             = useState<"environment" | "user">("environment");
  const [parsed, setParsed]                     = useState<ScannedStudent | null>(null);

  const videoRef          = useRef<HTMLVideoElement>(null);
  const canvasRef         = useRef<HTMLCanvasElement>(null);
  const streamRef         = useRef<MediaStream | null>(null);
  const animationFrameRef = useRef<number | null>(null);
  const scanTimeoutRef    = useRef<ReturnType<typeof setTimeout> | null>(null); // ← fixed NodeJS.Timeout
  const lastFrameTime     = useRef(0);

  const { student: scanned, isEnriching } = useEnrichedStudent(parsed, useFetchStudent);

  const stopScanning = useCallback(() => {
    setIsScanning(false);
    if (animationFrameRef.current) {
      cancelAnimationFrame(animationFrameRef.current);
      animationFrameRef.current = null;
    }
    if (scanTimeoutRef.current) {
      clearTimeout(scanTimeoutRef.current);
      scanTimeoutRef.current = null;
    }
    if (streamRef.current) {
      streamRef.current.getTracks().forEach(track => track.stop());
      streamRef.current = null;
    }
  }, []);

  const startCamera = useCallback(async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        video: {
          facingMode,
          width:  { ideal: 640 },
          height: { ideal: 480 },
        },
      });
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        streamRef.current = stream;
        setCameraPermission(true);
        return true;
      }
    } catch {
      setCameraPermission(false);
      onError('Camera access denied. Please allow camera permissions and try again.');
    }
    return false;
  }, [facingMode, onError]);

  const scanWithJsQR = useCallback(() => {
    if (!videoRef.current || !canvasRef.current) return null;

    const video   = videoRef.current;
    const canvas  = canvasRef.current;
    const context = canvas.getContext('2d');
    if (!context) return null;

    // Frame throttle: 10 fps
    const now = performance.now();
    if (now - lastFrameTime.current < 100) return null;
    lastFrameTime.current = now;

    canvas.width  = video.videoWidth;
    canvas.height = video.videoHeight;
    context.drawImage(video, 0, 0, canvas.width, canvas.height);

    const imageData = context.getImageData(0, 0, canvas.width, canvas.height);
    const code      = jsQR(imageData.data, imageData.width, imageData.height);

    if (code) {
      const student = parseBarcodeText(code.data);
      if (student) {
        setParsed(student);
        setPhase("result");
        stopScanning();
        return { data: code.data, format: 'QR' as const, confidence: 0.9 };
      }
    }
    return null;
  }, [stopScanning]);

  const scanWithQuagga = useCallback(async () => {
    if (!videoRef.current) return null;

    // Frame throttle: 15 fps
    const now = performance.now();
    if (now - lastFrameTime.current < 67) return null;
    lastFrameTime.current = now;

    return new Promise<{ data: string; format: 'QR' | 'barcode'; confidence: number } | null>(
      (resolve) => {
        Quagga.init(
          {
            inputStream: {
              name: "Live",
              type: "LiveStream",
              target: videoRef.current,
              constraints: { width: 640, height: 480, facingMode },
            },
            locator:  { patchSize: "medium", halfSample: true },
            numOfWorkers: 4,
            decoder: {
              readers: [
                "code_128_reader", "ean_reader", "ean_8_reader",
                "code_39_reader",  "upc_reader", "upc_e_reader",
              ],
            },
          },
          (err: any) => {
            if (err) { resolve(null); return; }

            Quagga.start();

            const resultHandler = (result: any) => {
              if (result?.codeResult) {
                Quagga.offDetected(resultHandler);
                Quagga.stop();
                resolve({
                  data:       result.codeResult.code,
                  format:     'barcode',
                  confidence: result.codeResult.confidence || 0.7,
                });
              }
            };

            Quagga.onDetected(resultHandler);

            setTimeout(() => {
              Quagga.offDetected(resultHandler);
              Quagga.stop();
              resolve(null);
            }, 800);
          },
        );
      },
    );
  }, [facingMode]);

  const scanWithNative = useCallback(async () => {
    if (!('BarcodeDetector' in window)) return null;

    try {
      const barcodeDetector = new (window as any).BarcodeDetector();
      const video = videoRef.current;
      if (!video) return null;

      const canvas  = document.createElement('canvas');
      canvas.width  = video.videoWidth;
      canvas.height = video.videoHeight;
      const context = canvas.getContext('2d');
      if (!context) return null;

      context.drawImage(video, 0, 0);
      const barcodes = await barcodeDetector.detect(canvas);

      if (barcodes.length > 0) {
        return { data: barcodes[0].rawValue, format: 'barcode' as const, confidence: 0.8 };
      }
    } catch {
      // silent — native not available
    }
    return null;
  }, []);

  const startScanning = useCallback(async () => {
    if (!await startCamera()) return;

    setIsScanning(true);
    setScanAttempts(0);
    setActiveScanner('jsqr');
    setPhase('scanning');

    let attempt = 0;

    const scanLoop = async () => {
      attempt += 1;
      setScanAttempts(attempt);
      let result = null;

      try {
        if (attempt <= 2) {
          setActiveScanner('jsqr');
          result = scanWithJsQR();
        }

        if (!result && attempt === 3) {
          setActiveScanner('quagga');
          result = await scanWithQuagga();
        }

        if (!result && attempt === 4) {
          setActiveScanner('native');
          result = await scanWithNative();
        }

        if (result) {
          const student = parseBarcodeText(result.data);
          if (student) {
            setParsed(student);
            setPhase("result");
            stopScanning();
            return;
          }
        }

        if (attempt < 5) {
          animationFrameRef.current = requestAnimationFrame(scanLoop);
        } else {
          const msg = 'Scanning timeout. Please try again or enter ID manually.';
          onError(msg);
          setErrorMsg(msg);
          setPhase('error');
          stopScanning();
        }
      } catch (err) {
        console.error('Scanning error:', err);
        if (attempt < 3) {
          animationFrameRef.current = requestAnimationFrame(scanLoop);
        } else {
          const msg = 'Scanning failed. Please try again or enter ID manually.';
          onError(msg);
          setErrorMsg(msg);
          setPhase('error');
          stopScanning();
        }
      }
    };

    animationFrameRef.current = requestAnimationFrame(scanLoop);

    scanTimeoutRef.current = setTimeout(() => {
      const msg = 'Scanning timeout. Please try again or enter ID manually.';
      onError(msg);
      setErrorMsg(msg);
      setPhase('error');
      stopScanning();
    }, 2000);
  }, [startCamera, scanWithJsQR, scanWithQuagga, scanWithNative, onError, stopScanning]);

  useEffect(() => () => { stopScanning(); }, [stopScanning]);

  useEffect(() => {
    if (isOpen && !isScanning) {
      setParsed(null);
      setPhase("scanning");
      setErrorMsg("");
      startScanning();
    } else if (!isOpen) {
      stopScanning();
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isOpen]);

  const handleConfirm = () => {
    if (scanned && !isEnriching) {
      stopScanning();
      onScanSuccess(scanned);
    }
  };

  const handleRescan = () => {
    setParsed(null);
    setPhase("scanning");
    setErrorMsg("");
    setScanAttempts(0);
    setActiveScanner('jsqr');
    startScanning();
  };

  const switchCamera = (mode: "environment" | "user") => {
    setFacingMode(mode);
    stopScanning();
    setParsed(null);
    setPhase('scanning');
    setErrorMsg("");
    setScanAttempts(0);
    setActiveScanner('jsqr');
    setTimeout(() => startScanning(), 100);
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

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/80 backdrop-blur-sm flex items-center justify-center z-50 p-4">
      <div className="bg-gray-900 border border-white/10 rounded-2xl w-full sm:max-w-md shadow-2xl overflow-hidden max-h-[90vh] flex flex-col">

        {/* Header */}
        <div className="flex items-center justify-between px-5 py-4 border-b border-white/5">
          <div>
            <h3 className="text-sm font-bold text-white">Scan Student ID</h3>
            <p className="text-[10px] text-gray-500">Use back camera for best results</p>
          </div>
          <button
            onClick={() => { stopScanning(); onClose(); }}
            className="w-8 h-8 flex items-center justify-center rounded-xl bg-white/5 hover:bg-white/10 text-gray-400 hover:text-white transition-colors"
          >
            <XMarkIcon className="h-3.5 w-3.5" />
          </button>
        </div>

        {/* Body */}
        <div className="p-5 overflow-y-auto">

          {phase === "scanning" && (
            <div className="space-y-4">
              {cameraPermission === false && (
                <div className="p-3 bg-red-900/30 border border-red-500/30 rounded-lg">
                  <p className="text-red-400 text-sm">
                    Camera access is required. Please allow permissions and refresh.
                  </p>
                </div>
              )}

              <div className="flex items-center justify-between">
                <span className="text-sm text-gray-400">
                  {isScanning ? `Scanning… (${scanAttempts}/5)` : 'Ready to scan'}
                </span>
                {activeScanner && (
                  <span className="text-xs text-gray-500">
                    {activeScanner.toUpperCase()}
                  </span>
                )}
              </div>
              <div className="w-full bg-gray-700 rounded-full h-1.5">
                <div
                  className="bg-blue-500 h-1.5 rounded-full transition-all duration-300"
                  style={{ width: `${Math.min((scanAttempts / 5) * 100, 100)}%` }}
                />
              </div>

              <div className="relative bg-black rounded-2xl overflow-hidden aspect-[3/4] sm:aspect-video flex items-center justify-center">
                <canvas ref={canvasRef} className="hidden" />
                <video
                  ref={videoRef}
                  className="w-full h-full object-cover"
                  muted
                  playsInline
                  autoPlay
                />

                {isScanning && (
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

                {!isScanning && (
                  <div className="absolute inset-0 flex flex-col items-center justify-center gap-3 bg-gray-950">
                    <CameraIcon className="h-7 w-7 text-gray-600 animate-pulse" />
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
                        : "border-white/10 text-gray-400 hover:text-white hover:bg-gray-800"
                    }`}
                  >
                    <CameraIcon className="h-2.5 w-2.5" />
                    {mode === "environment" ? "Back Cam" : "Front Cam"}
                  </button>
                ))}
              </div>

              <div className="text-center">
                <button
                  onClick={() => { stopScanning(); onError('Manual entry option would open here'); }}
                  className="text-blue-500 hover:text-blue-400 text-sm font-medium transition-colors"
                >
                  Enter ID Manually
                </button>
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
                <ExclamationTriangleIcon className="h-6 w-6 text-red-400" />
              </div>
              <div>
                <p className="text-white font-semibold text-sm mb-1">Scan Error</p>
                <p className="text-gray-500 text-xs max-w-xs">{errorMsg}</p>
              </div>
              <button
                onClick={() => { setPhase("scanning"); setErrorMsg(""); startScanning(); }}
                className="inline-flex items-center gap-2 px-4 py-2 bg-gray-800 hover:bg-gray-700 border border-white/10 text-gray-300 text-xs font-semibold rounded-xl transition-all"
              >
                <ArrowPathIcon className="h-2.5 w-2.5" /> Try Again
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