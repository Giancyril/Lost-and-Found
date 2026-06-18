import { useForm } from "react-hook-form";
import { Spinner } from "flowbite-react";
import Modals from "../../components/modal/Modal";
import { setUserLocalStorage } from "../../auth/auth";
import { useLoginMutation } from "../../redux/api/api";
import { useNavigate } from "react-router-dom";
import { MdVisibility, MdVisibilityOff, MdErrorOutline } from "react-icons/md";
import { FaSearch } from "react-icons/fa";
import { useState, useEffect, useRef } from "react";

const LOCKOUT_DURATION = 5 * 60 * 1000;
const MAX_ATTEMPTS = 3;
const STORAGE_KEY = "__login_attempts";

const getLockoutState = () => {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return { attempts: 0, lockedUntil: null };
    return JSON.parse(raw) as { attempts: number; lockedUntil: number | null };
  } catch { return { attempts: 0, lockedUntil: null }; }
};

const Login = () => {
  const navigate = useNavigate();
  const [showPassword, setShowPassword] = useState(false);
  const [attempts, setAttempts] = useState(() => getLockoutState().attempts);
  const [lockedUntil, setLockedUntil] = useState<number | null>(() => getLockoutState().lockedUntil);
  const [countdown, setCountdown] = useState(0);
  const [rememberMe, setRememberMe] = useState(false);
  const [activeField, setActiveField] = useState<string | null>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);

  const { handleSubmit, register, formState: { errors } } = useForm();
  const [login, { isLoading }] = useLoginMutation();

  // Animated grid canvas
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    let animId: number;
    let t = 0;

    const resize = () => {
      canvas.width = canvas.offsetWidth;
      canvas.height = canvas.offsetHeight;
    };
    resize();
    window.addEventListener("resize", resize);

    const draw = () => {
      ctx.clearRect(0, 0, canvas.width, canvas.height);
      const cols = 12;
      const rows = 16;
      const cw = canvas.width / cols;
      const ch = canvas.height / rows;

      for (let x = 0; x <= cols; x++) {
        for (let y = 0; y <= rows; y++) {
          const wave = Math.sin(t * 0.4 + x * 0.5 + y * 0.3) * 0.5 + 0.5;
          const alpha = wave * 0.07;
          ctx.beginPath();
          ctx.arc(x * cw, y * ch, 1.2, 0, Math.PI * 2);
          ctx.fillStyle = `rgba(59,130,246,${alpha})`;
          ctx.fill();
        }
      }

      // Horizontal lines
      for (let y = 0; y <= rows; y++) {
        const wave = Math.sin(t * 0.2 + y * 0.4) * 0.5 + 0.5;
        ctx.beginPath();
        ctx.moveTo(0, y * ch);
        ctx.lineTo(canvas.width, y * ch);
        ctx.strokeStyle = `rgba(59,130,246,${wave * 0.04})`;
        ctx.lineWidth = 1;
        ctx.stroke();
      }

      t += 0.02;
      animId = requestAnimationFrame(draw);
    };
    draw();

    return () => {
      cancelAnimationFrame(animId);
      window.removeEventListener("resize", resize);
    };
  }, []);

  useEffect(() => {
    if (!lockedUntil) return;
    const tick = () => {
      const remaining = Math.max(0, lockedUntil - Date.now());
      setCountdown(Math.ceil(remaining / 1000));
      if (remaining <= 0) {
        setLockedUntil(null);
        setAttempts(0);
        localStorage.removeItem(STORAGE_KEY);
      }
    };
    tick();
    const id = setInterval(tick, 1000);
    return () => clearInterval(id);
  }, [lockedUntil]);

  const isLocked = lockedUntil !== null && Date.now() < lockedUntil;

  const formatCountdown = (secs: number) => {
    const m = Math.floor(secs / 60).toString().padStart(2, "0");
    const s = (secs % 60).toString().padStart(2, "0");
    return `${m}:${s}`;
  };

  const onSubmit = async (data: any) => {
    if (isLocked) return;
    try {
      const res: any = await login({ ...data, rememberMe });
      if (res?.data) {
        localStorage.removeItem(STORAGE_KEY);
        setAttempts(0);
        setUserLocalStorage(res?.data?.data?.token);
        Modals({ message: "Logged in successfully", status: true });
        // Small delay to ensure token is set before navigation
        setTimeout(() => {
          navigate("/");
        }, 100);
      } else {
        const newAttempts = attempts + 1;
        setAttempts(newAttempts);
        if (newAttempts >= MAX_ATTEMPTS) {
          const until = Date.now() + LOCKOUT_DURATION;
          setLockedUntil(until);
          localStorage.setItem(STORAGE_KEY, JSON.stringify({ attempts: newAttempts, lockedUntil: until }));
          Modals({ message: "Too many failed attempts. Try again in 5 minutes.", status: false });
        } else {
          localStorage.setItem(STORAGE_KEY, JSON.stringify({ attempts: newAttempts, lockedUntil: null }));
          Modals({
            message: `${res?.error?.data?.message || "Invalid credentials"} (${MAX_ATTEMPTS - newAttempts} attempt${MAX_ATTEMPTS - newAttempts === 1 ? "" : "s"} left)`,
            status: false,
          });
        }
      }
    } catch {
      Modals({ message: "Failed to login", status: false });
    }
  };

  return (
    <section className="relative min-h-screen flex items-center justify-center bg-[#060a12] overflow-hidden">

      {/* Animated grid background */}
      <canvas
        ref={canvasRef}
        className="absolute inset-0 w-full h-full pointer-events-none"
      />

      {/* Ambient glows */}
      <div className="absolute top-0 left-1/4 w-[500px] h-[500px] bg-blue-600/8 rounded-full blur-[120px] pointer-events-none" />
      <div className="absolute bottom-0 right-1/4 w-[400px] h-[400px] bg-indigo-600/6 rounded-full blur-[100px] pointer-events-none" />

      {/* Diagonal accent stripe */}
      <div
        className="absolute inset-0 pointer-events-none opacity-[0.03]"
        style={{
          backgroundImage: `repeating-linear-gradient(
            -55deg,
            transparent,
            transparent 40px,
            rgba(59,130,246,1) 40px,
            rgba(59,130,246,1) 41px
          )`,
        }}
      />

      <div className="relative z-10 w-full max-w-[420px] px-5">

        {/* Top label */}
        <div className="flex items-center justify-center gap-2 mb-8">
          <div className="h-px flex-1 bg-gradient-to-r from-transparent to-blue-500/30" />
          <span className="text-[10px] font-bold text-blue-400/60 uppercase tracking-[0.25em]">
            Student Affairs & Services
          </span>
          <div className="h-px flex-1 bg-gradient-to-l from-transparent to-blue-500/30" />
        </div>

        {/* Card */}
        <div className="relative">
          {/* Card glow border */}
          <div className="absolute -inset-[1px] rounded-2xl bg-gradient-to-b from-blue-500/20 via-white/5 to-transparent pointer-events-none" />

          <div className="relative bg-[#0d1423]/95 backdrop-blur-2xl rounded-2xl overflow-hidden">

            {/* Top blue accent line */}
            <div className="h-[2px] w-full bg-gradient-to-r from-transparent via-blue-500 to-transparent" />

            <div className="px-7 pt-8 pb-8">

              {/* Logo + Title */}
              <div className="flex flex-col items-center mb-8">
                <div className="relative mb-4">
                  <div className="absolute inset-0" />
                  <img
                    src="/sas lost and found logo.png"
                    alt="SAS Lost and Found"
                    className="relative w-14 h-14 object-contain"
                    onError={(e) => { (e.target as HTMLImageElement).style.display = "none"; }}
                  />
                </div>
                <h1 className="text-[22px] font-black text-gray-300 tracking-tight leading-none mb-1">
                  Lost & Found
                </h1>
                <p className="text-[10px] text-gray-500 uppercase tracking-[0.2em] font-medium">
                  Management Sytem
                </p>
              </div>

              {/* Form */}
              <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">

                {/* Username field */}
                <div className="space-y-1.5">
                  <label className="text-[10px] font-bold text-gray-400 uppercase tracking-[0.15em] pl-0.5">
                    Email or Username
                  </label>
                  <div className={`relative rounded-xl transition-all duration-200 ${activeField === "username"
                      ? "ring-1 ring-blue-500/60]"
                      : "ring-1 ring-white/[0.06]"
                    }`}>
                    <input
                      type="text"
                      {...register("username", { required: "Required" })}
                      disabled={isLocked}
                      onFocus={() => setActiveField("username")}
                      onBlur={() => setActiveField(null)}
                      placeholder=""
                      className="w-full bg-[#111827]/80 text-white text-sm placeholder-gray-600 rounded-xl px-4 py-3 focus:outline-none disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
                    />
                  </div>
                  {errors.username && (
                    <p className="flex items-center gap-1 text-red-400 text-[10px] pl-0.5">
                      <MdErrorOutline size={11} />
                      {errors.username.message as string}
                    </p>
                  )}
                </div>

                {/* Password field */}
                <div className="space-y-1.5">
                  <label className="text-[10px] font-bold text-gray-400 uppercase tracking-[0.15em] pl-0.5">
                    Password
                  </label>
                  <div className={`relative rounded-xl transition-all duration-200 ${activeField === "password"
                      ? "ring-1 ring-blue-500/60]"
                      : "ring-1 ring-white/[0.06]"
                    }`}>
                    <input
                      type={showPassword ? "text" : "password"}
                      {...register("password", { required: "Required" })}
                      disabled={isLocked}
                      onFocus={() => setActiveField("password")}
                      onBlur={() => setActiveField(null)}
                      placeholder="••••••••••"
                      className="w-full bg-[#111827]/80 text-white text-sm placeholder-gray-600 rounded-xl px-4 py-3 pr-11 focus:outline-none disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                      className="absolute inset-y-0 right-0 flex items-center px-3.5 text-gray-500 hover:text-gray-300 transition-colors"
                    >
                      {showPassword
                        ? <MdVisibilityOff size={16} />
                        : <MdVisibility size={16} />}
                    </button>
                  </div>
                  {errors.password && (
                    <p className="flex items-center gap-1 text-red-400 text-[10px] pl-0.5">
                      <MdErrorOutline size={11} />
                      {errors.password.message as string}
                    </p>
                  )}
                </div>

                {/* Remember me */}
                <div className="flex items-center gap-2.5 pt-0.5">
                  <button
                    type="button"
                    onClick={() => setRememberMe(!rememberMe)}
                    className={`w-4 h-4 rounded flex items-center justify-center transition-all border ${rememberMe
                        ? "bg-blue-600 border-blue-500"
                        : "bg-transparent border-white/20 hover:border-white/40"
                      }`}
                  >
                    {rememberMe && (
                      <svg width="9" height="7" viewBox="0 0 9 7" fill="none">
                        <path d="M1 3.5L3.5 6L8 1" stroke="white" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
                      </svg>
                    )}
                  </button>
                  <span className="text-[11px] text-gray-500 select-none">Keep me signed in</span>
                </div>

                {/* Lockout state */}
                {isLocked ? (
                  <div className="rounded-xl bg-red-500/10 border border-red-500/20 p-4 text-center space-y-2">
                    <div className="flex items-center justify-center gap-2">
                      <MdErrorOutline className="text-red-400 shrink-0" size={16} />
                      <p className="text-red-400 text-xs font-semibold">Account temporarily locked</p>
                    </div>
                    <div className="inline-flex items-center gap-1.5 bg-gray-900/60 rounded-lg px-4 py-1.5">
                      <span className="text-gray-400 text-[11px]">Retry in</span>
                      <span className="text-white font-black text-sm tabular-nums">{formatCountdown(countdown)}</span>
                    </div>
                  </div>
                ) : isLoading ? (
                  <div className="flex items-center justify-center gap-2.5 py-3">
                    <Spinner size="sm" />
                    <span className="text-blue-300 text-xs font-medium tracking-wide">Verifying credentials…</span>
                  </div>
                ) : (
                  <>
                    <button
                      type="submit"
                      className="relative w-full group overflow-hidden rounded-xl py-3 text-sm font-bold text-white transition-all duration-300 active:scale-[0.98]"
                      style={{
                        background: "linear-gradient(135deg, #1d4ed8 0%, #2563eb 50%, #1d4ed8 100%)",
                        backgroundSize: "200% 100%",
                      }}
                    >
                      <div className="absolute inset-0 bg-gradient-to-r from-blue-400/0 via-blue-400/10 to-blue-400/0 translate-x-[-100%] group-hover:translate-x-[100%] transition-transform duration-700" />
                      <span className="relative">Sign In</span>
                    </button>

                    {attempts > 0 && (
                      <p className="text-center text-[10px] text-orange-400/80 bg-orange-500/8 border border-orange-500/15 rounded-lg py-2">
                        {MAX_ATTEMPTS - attempts} attempt{MAX_ATTEMPTS - attempts === 1 ? "" : "s"} remaining before lockout
                      </p>
                    )}
                  </>
                )}
              </form>

              {/* Footer note */}
              <p className="mt-6 text-center text-[10px] text-gray-700 leading-relaxed">
                For access issues, visit the{" "}
                <span className="text-gray-500">SAS Office</span>
              </p>
            </div>

            {/* Bottom accent */}
            <div className="h-[1px] w-full bg-gradient-to-r from-transparent via-blue-500/20 to-transparent" />
          </div>
        </div>

        {/* Bottom label */}
        <p className="text-center text-[9px] text-gray-700 uppercase tracking-[0.2em] mt-6 font-medium">
          NBSC · Lost & Found System · {new Date().getFullYear()}
        </p>
      </div>
    </section>
  );
};

export default Login;