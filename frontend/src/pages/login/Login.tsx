import { useForm } from "react-hook-form";
import { Spinner } from "flowbite-react";
import Modals from "../../components/modal/Modal";
import { ToastContainer } from "react-toastify";
import { setUserLocalStorage } from "../../auth/auth";
import { useLoginMutation } from "../../redux/api/api";
import { useNavigate } from "react-router-dom";
import { MdVisibility, MdVisibilityOff, MdEmail, MdLock, MdErrorOutline } from "react-icons/md";
import { useState, useEffect } from "react";
import FloatingLines from "../../components/FloatingLines";

const LOCKOUT_DURATION = 5 * 60 * 1000; // 5 minutes in ms
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
  const [isFocused, setIsFocused] = useState<'username' | 'password' | null>(null);
  const [rememberMe, setRememberMe] = useState(false);

  const {
    handleSubmit,
    register,
    formState: { errors },
  } = useForm();

  const [login, { isLoading }] = useLoginMutation();

  // Countdown timer
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
        Modals({ message: "Logged in successfully", status: true });
        setUserLocalStorage(res?.data?.data?.token);
        navigate("/");
        window.location.reload();
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
    <>
      <section className="relative min-h-screen flex items-center justify-center overflow-hidden bg-gray-950">

        <div className="absolute inset-0 bg-gray-950" />
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_80%_60%_at_50%_60%,rgba(37,99,235,0.12),transparent)]" />

        <div className="absolute inset-0" style={{ mixBlendMode: 'screen' }}>
          <FloatingLines
            enabledWaves={["top", "middle", "bottom"]}
            lineCount={[4, 6, 4]}
            lineDistance={[6, 5, 7]}
            animationSpeed={0.6}
            interactive={true}
            parallax={true}
            bendRadius={4}
            bendStrength={-0.4}
            parallaxStrength={0.15}
            linesGradient={[
              "#1e3a5f",
              "#2563eb",
              "#22d3ee",
              "#93c5fd",
            ]}
            mixBlendMode="screen"
          />
        </div>

        <div className="relative z-10 w-full max-w-md px-6 -mt-16">
          <div className="bg-gray-900/80 backdrop-blur-xl rounded-3xl border border-white/10 shadow-2xl shadow-black/50 p-8 transition-all duration-300 hover:shadow-3xl hover:shadow-blue-500/10">
            <div className="mb-8 text-center">
              <div className="flex flex-col items-center gap-3 mb-6">
                <div className="relative">
                  <img
                    src="/sas lost and found logo.png"
                    alt="SAS Lost and Found Logo"
                    className="w-20 h-20 object-contain transition-transform duration-300 hover:scale-105"
                    onError={(e) => { (e.target as HTMLImageElement).style.display = "none"; }}
                  />
                
                </div>
                <div className="flex items-center gap-2">
                  <span className="w-6 h-px bg-white/15" />
                  <span className="text-[10px] font-medium text-blue-300/70 tracking-widest uppercase">Student Affairs and Services</span>
                  <span className="w-6 h-px bg-white/15" />
                </div>
                <h1 className="text-2xl font-bold text-white tracking-tight">Lost & <span className="text-blue-400">Found</span> </h1>
              
              </div>
            </div>

            <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">

              {/* Username */}
              <div>
                {/* ✅ removed 'block' — 'flex' already makes it block-level */}
                <label className="flex items-center gap-2 text-sm font-semibold text-gray-300 uppercase tracking-wide mb-3">
                  <MdEmail className="w-4 h-4 text-blue-400" />
                  Email or Username
                </label>
                <div className="relative">
                  <input
                    type="text"
                    {...register("username", { required: "Email is required" })}
                    disabled={isLocked}
                    onFocus={() => setIsFocused('username')}
                    onBlur={() => setIsFocused(null)}
                    className={`w-full bg-gray-800/60 border ${
                      isFocused === 'username'
                        ? 'border-blue-500/50 ring-2 ring-blue-500/30'
                        : 'border-white/10'
                    } text-white placeholder-gray-500 rounded-xl px-4 py-4 focus:outline-none transition-all duration-300 text-base disabled:opacity-40 disabled:cursor-not-allowed`}
                    placeholder=" "
                  />
                  {isFocused === 'username' && (
                    <div className="absolute right-3 top-1/2 -translate-y-1/2">
                      <MdEmail className="w-5 h-5 text-blue-400 opacity-60" />
                    </div>
                  )}
                </div>
                {errors.username && (
                  <div className="flex items-center gap-2 mt-2 text-red-400 text-sm animate-pulse">
                    <MdErrorOutline className="w-4 h-4" />
                    <span>{errors.username?.message as string}</span>
                  </div>
                )}
              </div>

              {/* Password */}
              <div>
                {/* ✅ removed 'block' — 'flex' already makes it block-level */}
                <label className="flex items-center gap-2 text-sm font-semibold text-gray-300 uppercase tracking-wide mb-3">
                  <MdLock className="w-4 h-4 text-blue-400" />
                  Password
                </label>
                <div className="relative">
                  <input
                    type={showPassword ? "text" : "password"}
                    {...register("password", { required: "Password is required" })}
                    disabled={isLocked}
                    onFocus={() => setIsFocused('password')}
                    onBlur={() => setIsFocused(null)}
                    className={`w-full bg-gray-800/60 border ${
                      isFocused === 'password'
                        ? 'border-blue-500/50 ring-2 ring-blue-500/30'
                        : 'border-white/10'
                    } text-white placeholder-gray-500 rounded-xl px-4 py-4 pr-12 focus:outline-none transition-all duration-300 text-base disabled:opacity-40 disabled:cursor-not-allowed`}
                    placeholder=" "
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute inset-y-0 right-0 flex items-center pr-4 text-gray-500 hover:text-blue-400 transition-colors duration-300"
                  >
                    {showPassword
                      ? <MdVisibilityOff className="w-5 h-5" />
                      : <MdVisibility className="w-5 h-5" />}
                  </button>
                </div>
                {errors.password && (
                  <div className="flex items-center gap-2 mt-2 text-red-400 text-sm animate-pulse">
                    <MdErrorOutline className="w-4 h-4" />
                    <span>{errors.password?.message as string}</span>
                  </div>
                )}
              </div>

              {/* Submit / Locked / Loading */}
              {isLocked ? (
                <div className="w-full bg-red-500/20 border border-red-500/30 rounded-xl py-4 px-4 text-center space-y-3">
                  <div className="flex items-center justify-center gap-3">
                    <MdErrorOutline className="w-6 h-6 text-red-400" />
                    <div>
                      <p className="text-red-400 font-semibold">Account temporarily locked</p>
                      <p className="text-gray-400 text-sm">Too many failed login attempts</p>
                    </div>
                  </div>
                  <div className="bg-gray-800/60 rounded-lg py-2 px-3">
                    <p className="text-gray-300 text-sm">
                      Try again in{" "}
                      <span className="text-white font-bold text-lg">{formatCountdown(countdown)}</span>
                    </p>
                  </div>
                </div>
              ) : isLoading ? (
                <div className="flex justify-center py-4">
                  <div className="flex items-center gap-3 bg-blue-500/20 rounded-xl px-6 py-3">
                    <Spinner size="sm" />
                    <span className="text-blue-300 text-base font-medium">Authenticating...</span>
                  </div>
                </div>
              ) : (
                <>
                  <button
                    type="submit"
                    className="w-full bg-gradient-to-r from-blue-600 to-blue-700 hover:from-blue-500 hover:to-blue-600 text-white font-semibold py-4 px-4 rounded-xl transition-all duration-300 text-base shadow-lg shadow-blue-900/30 hover:shadow-xl hover:shadow-blue-500/40 transform hover:scale-[1.02] active:scale-[0.98]"
                  >
                    Sign In
                  </button>
                  {attempts > 0 && (
                    <div className="mt-3 text-center">
                      <p className="text-xs text-orange-400 bg-orange-500/10 rounded-lg py-2 px-3 inline-block">
                        {MAX_ATTEMPTS - attempts} attempt{MAX_ATTEMPTS - attempts === 1 ? "" : "s"} remaining before lockout
                      </p>
                    </div>
                  )}
                </>
              )}
            </form>
          </div>
        </div>
      </section>

      <ToastContainer position="top-right" autoClose={3000} style={{ top: "70px" }} theme="dark" />
    </>
  );
};

export default Login;