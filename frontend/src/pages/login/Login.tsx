import { useForm } from "react-hook-form";
import { Spinner } from "flowbite-react";
import Modals from "../../components/modal/Modal";
import { ToastContainer } from "react-toastify";
import { setUserLocalStorage } from "../../auth/auth";
import { useLoginMutation } from "../../redux/api/api";
import { useNavigate } from "react-router-dom";
import { MdVisibility, MdVisibilityOff } from "react-icons/md";
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
      const res: any = await login(data);
      if (res?.data) {
        // Success — clear lockout
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
      {/* Changed items-start to items-center and removed pt-8 to perfectly center the card */}
      <section className="relative min-h-screen flex items-center justify-center overflow-hidden bg-gray-950">

        {/* ── Floating wave background ── */}
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

        {/* ── Login card ── */}
        <div className="relative z-10 w-full max-w-md px-6 -mt-16">
          <div className="bg-gray-900/80 backdrop-blur-xl rounded-2xl border border-white/10 shadow-2xl shadow-black/50 p-8">
            <div className="mb-7 text-center">
              <h2 className="text-lg font-bold text-white">Staff Sign In</h2>
              <p className="text-gray-500 text-sm mt-1">Enter your credentials to access the admin panel</p>
            </div>

            <form onSubmit={handleSubmit(onSubmit)} className="space-y-5">
              <div>
                <label className="block text-[10px] font-bold text-gray-400 uppercase tracking-widest mb-1.5">
                  Email or Username
                </label>
                <input
                  type="text"
                  {...register("username", { required: "Email is required" })}
                  disabled={isLocked}
                  className="w-full bg-gray-800/80 border border-white/10 text-white placeholder-gray-600 rounded-xl px-4 py-3 focus:outline-none focus:ring-2 focus:ring-blue-500/50 focus:border-blue-500/50 transition-all duration-200 text-sm disabled:opacity-40 disabled:cursor-not-allowed"
                  placeholder="admin@nbsc.edu.ph"
                />
                {errors.username && (
                  <p className="text-red-400 text-xs mt-1">{errors.username?.message as string}</p>
                )}
              </div>

              <div>
                <label className="block text-[10px] font-bold text-gray-400 uppercase tracking-widest mb-1.5">
                  Password
                </label>
                <div className="relative">
                  <input
                    type={showPassword ? "text" : "password"}
                    {...register("password", { required: "Password is required" })}
                    disabled={isLocked}
                    placeholder="••••••••"
                    className="w-full bg-gray-800/80 border border-white/10 text-white placeholder-gray-600 rounded-xl px-4 py-3 pr-11 focus:outline-none focus:ring-2 focus:ring-blue-500/50 focus:border-blue-500/50 transition-all duration-200 text-sm disabled:opacity-40 disabled:cursor-not-allowed"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute inset-y-0 right-0 flex items-center pr-4 text-gray-500 hover:text-gray-300 transition-colors duration-200"
                  >
                    {showPassword ? <MdVisibilityOff className="w-5 h-5" /> : <MdVisibility className="w-5 h-5" />}
                  </button>
                </div>
                {errors.password && (
                  <p className="text-red-400 text-xs mt-1">{errors.password?.message as string}</p>
                )}
              </div>

              {isLocked ? (
                <div className="w-full bg-red-500/10 border border-red-500/20 rounded-xl py-3 px-4 text-center space-y-1">
                  <p className="text-red-400 text-sm font-semibold">Too many failed attempts</p>
                  <p className="text-gray-400 text-xs">Try again in <span className="text-white font-bold">{formatCountdown(countdown)}</span></p>
                </div>
              ) : isLoading ? (
                <div className="flex justify-center py-3">
                  <div className="flex items-center gap-3">
                    <Spinner size="sm" />
                    <span className="text-gray-400 text-sm">Signing in...</span>
                  </div>
                </div>
              ) : (
                <>
                  <button
                    type="submit"
                    className="w-full bg-blue-600 hover:bg-blue-500 text-white font-semibold py-3 px-4 rounded-xl transition-all duration-200 text-sm mt-1 shadow-lg shadow-blue-900/30"
                  >
                    Sign In
                  </button>
                  {attempts > 0 && (
                    <p className="text-center text-xs text-orange-400">
                      {MAX_ATTEMPTS - attempts} attempt{MAX_ATTEMPTS - attempts === 1 ? "" : "s"} remaining before lockout
                    </p>
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