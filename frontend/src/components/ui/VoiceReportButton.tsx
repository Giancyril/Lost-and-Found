import React, { useState, useRef, useEffect } from "react";
import { FaMicrophone, FaStop, FaSpinner } from "react-icons/fa";
import { useAiVoiceParseMutation } from "../../redux/api/api";
import { toast } from "react-toastify";

interface VoiceReportButtonProps {
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

const VoiceReportButton = ({ onParsed }: VoiceReportButtonProps) => {
  const [isRecording, setIsRecording] = useState(false);
  const [recordingSeconds, setRecordingSeconds] = useState(0);
  const [aiVoiceParse, { isLoading: isParsing }] = useAiVoiceParseMutation();

  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const audioChunksRef = useRef<Blob[]>([]);
  const timerIntervalRef = useRef<NodeJS.Timeout | null>(null);
  
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

      mediaRecorder.start(250); // Slice chunks every 250ms
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

  return (
    <div className="flex items-center gap-4 bg-gray-900 border border-white/5 rounded-2xl p-4.5 mb-2 w-full animate-fadeIn transition-all duration-300">
      <div className="flex items-center gap-3.5 flex-1 min-w-0">
        <div className={`w-10 h-10 rounded-full flex items-center justify-center shrink-0 transition-all duration-300 ${
          isRecording 
            ? "bg-red-500/10 border border-red-500/30 text-red-500 shadow-lg shadow-red-900/30 animate-pulse" 
            : isParsing
              ? "bg-indigo-500/10 border border-indigo-500/20 text-indigo-400"
              : "bg-blue-500/10 border border-blue-500/20 text-blue-400"
        }`}>
          {isRecording ? (
            <FaStop size={14} className="cursor-pointer" onClick={stopRecording} />
          ) : isParsing ? (
            <FaSpinner size={16} className="animate-spin" />
          ) : (
            <FaMicrophone size={16} className="cursor-pointer" onClick={startRecording} />
          )}
        </div>

        <div className="flex-1 min-w-0">
          <div className="flex items-center justify-between gap-2">
            <p className="text-xs font-bold text-white uppercase tracking-wider select-none">
              {isRecording ? "Voice Assist (Active)" : "AI Voice-Report Assist"}
            </p>
            {isRecording && (
              <span className="text-[10px] font-bold text-red-500 font-mono select-none">
                {formatTime(recordingSeconds)} / {formatTime(MAX_SECONDS)}
              </span>
            )}
          </div>
          
          <div className="relative h-6 mt-1 flex items-center">
            {isRecording ? (
              <canvas 
                ref={canvasRef} 
                width={200} 
                height={24} 
                className="w-full h-full rounded opacity-90"
              />
            ) : isParsing ? (
              <p className="text-[10px] text-indigo-400 font-semibold flex items-center gap-1.5 animate-pulse select-none">
                <FaSpinner className="animate-spin" size={8} /> Transcribing speech and analyzing campus categories...
              </p>
            ) : (
              <p className="text-[10px] text-gray-500 leading-normal truncate select-none">
                Hold record to narrate naturally (e.g. "I found a blue thermos in the library")
              </p>
            )}
          </div>
        </div>
      </div>

      {!isRecording && !isParsing && (
        <button
          type="button"
          onClick={startRecording}
          className="px-4 py-1.5 bg-blue-600 hover:bg-blue-500 text-white text-[10px] font-black rounded-lg transition-all uppercase tracking-widest active:scale-95 whitespace-nowrap"
        >
          Talk
        </button>
      )}
      
      {isRecording && (
        <button
          type="button"
          onClick={stopRecording}
          className="px-4 py-1.5 bg-red-600 hover:bg-red-500 text-white text-[10px] font-black rounded-lg transition-all uppercase tracking-widest active:scale-95 whitespace-nowrap shadow-lg shadow-red-900/10"
        >
          Done
        </button>
      )}
    </div>
  );
};

export default VoiceReportButton;
