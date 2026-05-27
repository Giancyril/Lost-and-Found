import React, { useState, useRef, useEffect } from "react";
import { FaMicrophone, FaStop, FaSpinner } from "react-icons/fa";
import { useAiVoiceParseMutation } from "../../redux/api/api";
import { toast } from "react-toastify";

interface VoiceReportButtonProps {
  isLostPage?: boolean;
  noContainer?: boolean;
  onParsed: (data: {
    itemName?: string;
    categoryId?: string;
    categoryName?: string;
    location?: string;
    description?: string;
    color?: string;
    condition?: string;
  }) => void;
}

const VoiceReportButton = ({ isLostPage = false, noContainer = false, onParsed }: VoiceReportButtonProps) => {
  const [isRecording, setIsRecording] = useState(false);
  const [recordingSeconds, setRecordingSeconds] = useState(0);
  const [aiVoiceParse, { isLoading: isParsing }] = useAiVoiceParseMutation();

  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const audioChunksRef = useRef<Blob[]>([]);
  const timerIntervalRef = useRef<any | null>(null);
  
  // Web Audio Visualizer refs
  const audioCtxRef = useRef<AudioContext | null>(null);
  const analyserRef = useRef<AnalyserNode | null>(null);
  const animationFrameRef = useRef<number | null>(null);
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const streamRef = useRef<MediaStream | null>(null);

  // Maximum recording time is 30 seconds
  const MAX_SECONDS = 30;

  useEffect(() => {
    return () => {
      stopRecordingSession();
    };
  }, []);

  const startRecording = async () => {
    audioChunksRef.current = [];
    setRecordingSeconds(0);

    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      streamRef.current = stream;

      // 1. Audio Visualizer setup
      const AudioContextClass = window.AudioContext || (window as any).webkitAudioContext;
      const audioCtx = new AudioContextClass();
      audioCtxRef.current = audioCtx;
      
      const source = audioCtx.createMediaStreamSource(stream);
      const analyser = audioCtx.createAnalyser();
      analyser.fftSize = 64; // Smaller for wider, distinct bars
      source.connect(analyser);
      analyserRef.current = analyser;

      // Start visualizer animation
      drawVisualizer();

      // 2. MediaRecorder setup with cross-browser formats
      let selectedMimeType = "audio/webm";
      let options = {};
      
      if (typeof MediaRecorder.isTypeSupported === "function") {
        if (MediaRecorder.isTypeSupported("audio/webm")) {
          selectedMimeType = "audio/webm";
          options = { mimeType: selectedMimeType };
        } else if (MediaRecorder.isTypeSupported("audio/mp4")) {
          selectedMimeType = "audio/mp4";
          options = { mimeType: selectedMimeType };
        } else if (MediaRecorder.isTypeSupported("audio/ogg")) {
          selectedMimeType = "audio/ogg";
          options = { mimeType: selectedMimeType };
        } else if (MediaRecorder.isTypeSupported("audio/wav")) {
          selectedMimeType = "audio/wav";
          options = { mimeType: selectedMimeType };
        }
      }

      const mediaRecorder = new MediaRecorder(stream, options);
      mediaRecorderRef.current = mediaRecorder;

      mediaRecorder.ondataavailable = (e) => {
        if (e.data && e.data.size > 0) {
          audioChunksRef.current.push(e.data);
        }
      };

      mediaRecorder.onstop = async () => {
        const actualMimeType = mediaRecorder.mimeType || selectedMimeType;
        const audioBlob = new Blob(audioChunksRef.current, { type: actualMimeType });
        await handleAudioUpload(audioBlob, actualMimeType);
      };

      mediaRecorder.start(); // Start recording as a single solid stream to prevent container chunk corruption
      setIsRecording(true);

      // Start timer
      timerIntervalRef.current = setInterval(() => {
        setRecordingSeconds((prev) => {
          if (prev >= MAX_SECONDS - 1) {
            stopRecording();
            toast.warn("Reached maximum recording limit of 30 seconds.");
            return MAX_SECONDS;
          }
          return prev + 1;
        });
      }, 1000);

      toast.info("Recording voice... Speak naturally!");
    } catch (err) {
      console.error("Microphone access failed:", err);
      toast.error("Microphone access denied. Please enable permission.");
    }
  };

  const stopRecording = () => {
    if (mediaRecorderRef.current && isRecording) {
      mediaRecorderRef.current.stop();
    }
    stopRecordingSession();
  };

  const stopRecordingSession = () => {
    setIsRecording(false);
    
    // Clear timer
    if (timerIntervalRef.current) {
      clearInterval(timerIntervalRef.current);
      timerIntervalRef.current = null;
    }

    // Stop streams
    if (streamRef.current) {
      streamRef.current.getTracks().forEach((track) => track.stop());
      streamRef.current = null;
    }

    // Cancel visualizer animation
    if (animationFrameRef.current) {
      cancelAnimationFrame(animationFrameRef.current);
      animationFrameRef.current = null;
    }

    // Close AudioContext
    if (audioCtxRef.current && audioCtxRef.current.state !== "closed") {
      audioCtxRef.current.close();
      audioCtxRef.current = null;
    }
  };

  const drawVisualizer = () => {
    if (!canvasRef.current || !analyserRef.current) return;
    const canvas = canvasRef.current;
    const canvasCtx = canvas.getContext("2d");
    if (!canvasCtx) return;

    const analyser = analyserRef.current;
    const bufferLength = analyser.frequencyBinCount;
    const dataArray = new Uint8Array(bufferLength);

    const draw = () => {
      if (!isRecording) return;
      animationFrameRef.current = requestAnimationFrame(draw);

      analyser.getByteFrequencyData(dataArray);

      const width = canvas.width;
      const height = canvas.height;

      // Transparent clearing to blend nicely
      canvasCtx.clearRect(0, 0, width, height);

      const barWidth = (width / bufferLength) * 1.6;
      let barHeight;
      let x = 0;

      for (let i = 0; i < bufferLength; i++) {
        // Compute bar height with lower threshold scaling
        barHeight = (dataArray[i] / 255) * height * 0.95;

        // Apply a glowing gradient (cyan to violet/indigo)
        const gradient = canvasCtx.createLinearGradient(0, height, 0, 0);
        gradient.addColorStop(0, "rgba(59, 130, 246, 0.4)");  // blue
        gradient.addColorStop(0.5, "rgba(124, 58, 237, 0.8)"); // violet
        gradient.addColorStop(1, "rgba(244, 63, 94, 0.9)");   // rose

        canvasCtx.fillStyle = gradient;
        
        // Draw rounded visualizer bars
        canvasCtx.beginPath();
        if (canvasCtx.roundRect) {
          canvasCtx.roundRect(x, height - barHeight, barWidth - 2, barHeight, 4);
          canvasCtx.fill();
        } else {
          canvasCtx.fillRect(x, height - barHeight, barWidth - 2, barHeight);
        }

        x += barWidth;
      }
    };

    draw();
  };

  const handleAudioUpload = async (audioBlob: Blob, mimeType: string) => {
    const toastId = toast.loading("Analyzing speech details...");
    
    try {
      let filename = "recording.webm";
      if (mimeType.includes("mp4") || mimeType.includes("aac")) {
        filename = "recording.mp4";
      } else if (mimeType.includes("ogg")) {
        filename = "recording.ogg";
      } else if (mimeType.includes("wav")) {
        filename = "recording.wav";
      }

      const formData = new FormData();
      formData.append("audio", audioBlob, filename);

      const res = await aiVoiceParse(formData).unwrap();

      if (res.success && res.data) {
        onParsed(res.data);
        toast.update(toastId, {
          render: "Speech processed successfully! Fields pre-filled.",
          type: "success",
          isLoading: false,
          autoClose: 3500,
        });
      } else {
        toast.update(toastId, {
          render: "AI could not parse the speech clearly.",
          type: "warning",
          isLoading: false,
          autoClose: 3500,
        });
      }
    } catch (error: any) {
      console.error("Audio upload error:", error);
      toast.update(toastId, {
        render: error?.data?.message || "Failed to process voice details. Try speaking louder.",
        type: "error",
        isLoading: false,
        autoClose: 3500,
      });
    }
  };

  const formatTime = (secs: number) => {
    const m = Math.floor(secs / 60).toString().padStart(2, "0");
    const s = (secs % 60).toString().padStart(2, "0");
    return `${m}:${s}`;
  };

  const innerRow = noContainer ? (
    <div className="flex flex-col justify-between h-full w-full animate-fadeIn transition-all duration-300 gap-3.5">
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2 flex-wrap">
          <h4 className="font-bold text-xs sm:text-sm text-gray-200 select-none">Voice report</h4>
          <span className="bg-purple-500/20 text-purple-300 text-[8px] sm:text-[10px] font-bold px-1.5 py-0.5 rounded-full uppercase tracking-wider select-none">Beta</span>
        </div>
        
        {isRecording ? (
          <div className="mt-1.5 space-y-1">
            <p className="text-[10px] sm:text-xs text-red-400 font-mono flex items-center gap-1.5 select-none">
              <span className="w-1.5 h-1.5 rounded-full bg-red-500 animate-ping inline-block"></span>
              Recording: {formatTime(recordingSeconds)} / {formatTime(MAX_SECONDS)}
            </p>
            <div className="relative h-5 mt-1 flex items-center max-w-[140px] sm:max-w-[200px]">
              <canvas 
                ref={canvasRef} 
                width={140} 
                height={20} 
                className="w-full h-full rounded opacity-90"
              />
            </div>
          </div>
        ) : isParsing ? (
          <p className="text-[10px] sm:text-xs text-indigo-400 font-semibold mt-1.5 animate-pulse select-none flex items-center gap-1">
            <FaSpinner className="animate-spin" size={10} /> Analyzing...
          </p>
        ) : (
          <p className="text-[10px] sm:text-xs text-gray-400 mt-1.5 select-none leading-relaxed">
            Hold to narrate naturally.
          </p>
        )}
      </div>

      {isRecording ? (
        <button
          type="button"
          onClick={stopRecording}
          className="w-full flex items-center justify-center gap-1.5 px-3 py-2 bg-red-600 hover:bg-red-500 text-white rounded-lg sm:rounded-xl text-[10px] sm:text-xs font-semibold transition-all animate-pulse active:scale-95 whitespace-nowrap shadow-lg shadow-red-900/10"
        >
          <FaStop size={10} /> Done
        </button>
      ) : isParsing ? (
        <button
          type="button"
          disabled
          className="w-full flex items-center justify-center gap-1.5 px-3 py-2 bg-indigo-600/30 text-indigo-300 border border-indigo-500/20 rounded-lg sm:rounded-xl text-[10px] sm:text-xs font-semibold whitespace-nowrap"
        >
          <FaSpinner size={10} className="animate-spin" /> Analyzing
        </button>
      ) : (
        <button
          type="button"
          onClick={startRecording}
          className="w-full flex items-center justify-center gap-1.5 px-3 py-2 border border-white/10 hover:border-white/20 bg-white/5 hover:bg-white/10 text-white rounded-lg sm:rounded-xl text-[10px] sm:text-xs font-semibold transition-all active:scale-95 whitespace-nowrap"
        >
          <FaMicrophone size={10} className="text-purple-400" /> Hold to talk
        </button>
      )}
    </div>
  ) : (
    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 sm:gap-4 w-full animate-fadeIn transition-all duration-300">
      <div className="flex items-start gap-4 flex-1 min-w-0">
        {!noContainer && (
          <div className={`w-10 h-10 sm:w-12 sm:h-12 rounded-xl sm:rounded-2xl flex items-center justify-center shrink-0 transition-all duration-300 ${
            isRecording 
              ? "bg-red-500/20 text-red-500 animate-pulse shadow-lg shadow-red-900/10" 
              : isParsing
                ? "bg-indigo-500/20 text-indigo-400 animate-pulse"
                : "bg-[#f5f3ff] text-[#6d28d9]"
          }`}>
            <FaMicrophone size={18} className="sm:w-5 sm:h-5" />
          </div>
        )}
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 flex-wrap">
            <h4 className="font-bold text-xs sm:text-sm text-gray-200 select-none">Voice report</h4>
            <span className="bg-purple-500/20 text-purple-300 text-[8px] sm:text-[10px] font-bold px-1.5 py-0.5 rounded-full uppercase tracking-wider select-none">Beta</span>
          </div>
          
          {isRecording ? (
            <div className="mt-0.5 space-y-1">
              <p className="text-[10px] sm:text-xs text-red-400 font-mono flex items-center gap-1.5 select-none">
                <span className="w-1.5 h-1.5 rounded-full bg-red-500 animate-ping inline-block"></span>
                Recording: {formatTime(recordingSeconds)} / {formatTime(MAX_SECONDS)}
              </p>
              <div className="relative h-5 mt-0.5 flex items-center max-w-[200px] sm:max-w-[240px]">
                <canvas 
                  ref={canvasRef} 
                  width={200} 
                  height={20} 
                  className="w-full h-full rounded opacity-90"
                />
              </div>
            </div>
          ) : isParsing ? (
            <p className="text-[10px] sm:text-xs text-indigo-400 font-semibold mt-0.5 animate-pulse select-none flex items-center gap-1.5">
              <FaSpinner className="animate-spin" size={10} /> Transcribing speech and analyzing campus categories...
            </p>
          ) : (
            <p className="text-[10px] sm:text-xs text-gray-400 mt-0.5 select-none leading-relaxed">
              Hold to narrate "{isLostPage ? 'I lost my ID near the library.' : 'I found an ID near the library.'}"
            </p>
          )}
        </div>
      </div>

      {isRecording ? (
        <button
          type="button"
          onClick={stopRecording}
          className="flex items-center gap-1.5 px-3 py-1.5 sm:px-4 sm:py-2 bg-red-600 hover:bg-red-500 text-white rounded-lg sm:rounded-xl text-[10px] sm:text-xs font-semibold transition-all animate-pulse active:scale-95 self-start sm:self-center whitespace-nowrap shadow-lg shadow-red-900/10"
        >
          <FaStop size={10} /> Done
        </button>
      ) : isParsing ? (
        <button
          type="button"
          disabled
          className="flex items-center gap-1.5 px-3 py-1.5 sm:px-4 sm:py-2 bg-indigo-600/30 text-indigo-300 border border-indigo-500/20 rounded-lg sm:rounded-xl text-[10px] sm:text-xs font-semibold self-start sm:self-center whitespace-nowrap"
        >
          <FaSpinner size={10} className="animate-spin" /> Analyzing
        </button>
      ) : (
        <button
          type="button"
          onClick={startRecording}
          className="flex items-center gap-1.5 px-3 py-1.5 sm:px-4 sm:py-2 border border-white/10 hover:border-white/20 bg-white/5 hover:bg-white/10 text-white rounded-lg sm:rounded-xl text-[10px] sm:text-xs font-semibold transition-all active:scale-95 self-start sm:self-center whitespace-nowrap"
        >
          <FaMicrophone size={10} className="text-purple-400" /> Hold to talk
        </button>
      )}
    </div>
  );

  if (noContainer) {
    return innerRow;
  }

  return (
    <div className="w-full bg-[#1e1e24]/40 border border-white/5 rounded-2xl p-5 mb-4 animate-fadeIn transition-all duration-300 shadow-md backdrop-blur-sm">
      {innerRow}
      <hr className="border-white/5 my-4" />
      <p className="text-xs text-gray-500 select-none">Speak naturally — AI extracts item details from your description automatically.</p>
    </div>
  );
};

export default VoiceReportButton;
