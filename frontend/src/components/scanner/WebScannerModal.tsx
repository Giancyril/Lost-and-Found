import React, { useState, useRef, useEffect, useCallback } from 'react';
import { XMarkIcon } from '@heroicons/react/24/outline';
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

interface ScanResult {
  data: string;
  format: 'QR' | 'barcode';
  confidence: number;
}

export default function WebScannerModal({
  isOpen,
  onClose,
  onScanSuccess,
  onError,
  useFetchStudent,
}: WebScannerModalProps) {
  const [isScanning, setIsScanning]       = useState(false);
  const [activeScanner, setActiveScanner] = useState<'jsqr' | 'quagga' | 'native' | null>(null);
  const [cameraPermission, setCameraPermission] = useState<boolean | null>(null);
  const [scanAttempts, setScanAttempts]   = useState(0);
  const [phase, setPhase]                 = useState<"scanning" | "result" | "error">("scanning");
  const [parsed, setParsed]               = useState<ScannedStudent | null>(null);

  const videoRef         = useRef<HTMLVideoElement>(null);
  const canvasRef        = useRef<HTMLCanvasElement>(null);
  const streamRef        = useRef<MediaStream | null>(null);
  const animationFrameRef = useRef<number | null>(null);
  const scanTimeoutRef   = useRef<ReturnType<typeof setTimeout> | null>(null);
  const lastFrameTime    = useRef(0);

  // Enrich parsed student with DB lookup
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
          facingMode: 'environment',
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
  }, [onError]);

  const scanWithJsQR = useCallback((): ScanResult | null => {
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
        return { data: code.data, format: 'QR', confidence: 0.9 };
      }
    }
    return null;
  }, [stopScanning]);

  const scanWithQuagga = useCallback((): Promise<ScanResult | null> => {
    if (!videoRef.current) return Promise.resolve(null);

    // Frame throttle: 15 fps
    const now = performance.now();
    if (now - lastFrameTime.current < 67) return Promise.resolve(null);
    lastFrameTime.current = now;

    return new Promise<ScanResult | null>((resolve) => {
      Quagga.init(
        {
          inputStream: {
            name: "Live",
            type: "LiveStream",
            target: videoRef.current,
            constraints: { width: 640, height: 480, facingMode: "environment" },
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
    });
  }, []);

  const scanWithNative = useCallback(async (): Promise<ScanResult | null> => {
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
        return { data: barcodes[0].rawValue, format: 'barcode', confidence: 0.8 };
      }
    } catch {
      // native detection unavailable — let caller handle fallback
    }
    return null;
  }, []);

  const startScanning = useCallback(async () => {
    if (!await startCamera()) return;

    setIsScanning(true);
    setScanAttempts(0);
    setActiveScanner('jsqr');

    let attempt = 0;

    const scanLoop = async () => {
      attempt += 1;
      setScanAttempts(attempt);
      let result: ScanResult | null = null;

      try {
        // Attempt 1-2: jsQR
        if (attempt <= 2) {
          setActiveScanner('jsqr');
          result = scanWithJsQR();
        }

        // Attempt 3: Quagga
        if (!result && attempt === 3) {
          setActiveScanner('quagga');
          result = await scanWithQuagga();
        }

        // Attempt 4: Native
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
          onError('Scanning timeout. Please try again or enter ID manually.');
          setPhase('error');
          stopScanning();
        }
      } catch (err) {
        console.error('Scanning error:', err);
        if (attempt < 3) {
          animationFrameRef.current = requestAnimationFrame(scanLoop);
        } else {
          onError('Scanning failed. Please try again or enter ID manually.');
          setPhase('error');
          stopScanning();
        }
      }
    };

    animationFrameRef.current = requestAnimationFrame(scanLoop);

    scanTimeoutRef.current = setTimeout(() => {
      onError('Scanning timeout. Please try again or enter ID manually.');
      setPhase('error');
      stopScanning();
    }, 2000);
  }, [startCamera, scanWithJsQR, scanWithQuagga, scanWithNative, onError, stopScanning]);

  useEffect(() => () => { stopScanning(); }, [stopScanning]);

  useEffect(() => {
    if (isOpen && !isScanning) {
      setPhase("scanning");
      setParsed(null);
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
    setScanAttempts(0);
    setActiveScanner('jsqr');
    startScanning();
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-75 z-50 flex items-center justify-center">
      <div className="bg-white rounded-lg p-6 max-w-md w-full mx-4">

        {/* Header */}
        <div className="flex justify-between items-center mb-4">
          <h3 className="text-lg font-semibold">Scan Student ID</h3>
          <button
            onClick={() => { stopScanning(); onClose(); }}
            className="text-gray-400 hover:text-gray-600 transition-colors"
          >
            <XMarkIcon className="h-6 w-6" />
          </button>
        </div>

        {/* Camera Permission Error */}
        {cameraPermission === false && (
          <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-md">
            <p className="text-red-700 text-sm">
              Camera access is required for scanning. Please allow camera permissions and refresh the page.
            </p>
          </div>
        )}

        {phase === "scanning" && (
          <>
            {/* Scanner Status */}
            <div className="mb-4">
              <div className="flex items-center justify-between mb-2">
                <span className="text-sm text-gray-600">
                  {isScanning ? `Scanning… (Attempt ${scanAttempts}/5)` : 'Ready to scan'}
                </span>
                {activeScanner && (
                  <span className="text-xs text-gray-500">
                    Using: {activeScanner.toUpperCase()}
                  </span>
                )}
              </div>
              <div className="w-full bg-gray-200 rounded-full h-2">
                <div
                  className="bg-blue-600 h-2 rounded-full transition-all duration-300"
                  style={{ width: `${Math.min((scanAttempts / 5) * 100, 100)}%` }}
                />
              </div>
            </div>

            {/* Video */}
            <div className="relative mb-4">
              <video
                ref={videoRef}
                autoPlay
                playsInline
                muted
                className="w-full h-64 bg-black rounded-lg object-cover"
              />
              <canvas ref={canvasRef} className="hidden" />
              {isScanning && (
                <div className="absolute inset-0 pointer-events-none">
                  <div className="border-2 border-blue-500 absolute inset-4 rounded-lg animate-pulse" />
                  <div className="absolute top-2 left-2 right-2 flex justify-between">
                    <span className="bg-blue-500 text-white text-xs px-2 py-1 rounded">
                      {activeScanner?.toUpperCase()}
                    </span>
                    <span className="bg-blue-500 text-white text-xs px-2 py-1 rounded">
                      1–2s Target
                    </span>
                  </div>
                </div>
              )}
            </div>

            <div className="text-center">
              <button
                onClick={() => { stopScanning(); onError('Manual entry option would open here'); }}
                className="text-blue-600 hover:text-blue-700 text-sm font-medium transition-colors"
              >
                Enter ID Manually
              </button>
            </div>
          </>
        )}

        {phase === "result" && scanned && (
          <div className="space-y-4">
            <div className="p-4 bg-green-50 border border-green-200 rounded-lg">
              <p className="font-semibold text-green-800">{scanned.name || scanned.id}</p>
              {scanned.id && <p className="text-sm text-green-700">ID: {scanned.id}</p>}
              {scanned.department && (
                <p className="text-sm text-green-700">Dept: {scanned.department}</p>
              )}
              {scanned.email && (
                <p className="text-sm text-green-700">{scanned.email}</p>
              )}
            </div>
            <div className="flex gap-3">
              <button
                onClick={handleRescan}
                className="flex-1 py-2 border border-gray-300 text-gray-600 rounded-lg text-sm hover:bg-gray-50 transition-colors"
              >
                Rescan
              </button>
              <button
                onClick={handleConfirm}
                disabled={isEnriching}
                className="flex-1 py-2 bg-blue-600 hover:bg-blue-700 disabled:opacity-50 text-white rounded-lg text-sm font-semibold transition-colors"
              >
                {isEnriching ? 'Verifying…' : 'Use Student'}
              </button>
            </div>
          </div>
        )}

        {phase === "error" && (
          <div className="text-center py-4">
            <p className="text-red-600 text-sm mb-3">Scan failed. Please try again.</p>
            <button
              onClick={() => { setPhase("scanning"); startScanning(); }}
              className="px-4 py-2 bg-gray-800 text-white text-sm rounded-lg hover:bg-gray-700 transition-colors"
            >
              Try Again
            </button>
          </div>
        )}
      </div>
    </div>
  );
}