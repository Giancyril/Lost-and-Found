import React, { useState, useEffect, useRef } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import {
  FaIdCard, FaLock, FaEye, FaEyeSlash,
  FaCheckCircle, FaExclamationTriangle, FaTimesCircle,
} from 'react-icons/fa';
import { MdVerified } from 'react-icons/md';
import { Spinner } from 'flowbite-react';
import { useLoginMutation, useRegistersMutation, useLazyValidateRegistrationQuery } from "../../redux/api/api";
import { setUserLocalStorage } from "../../auth/auth";

type Step = 1 | 2 | 3;

interface MasterlistData {
  schoolId: string;
  name: string;
  email: string;
  course: string;
  yearLevel: string;
}

type ValidationStatus = 'idle' | 'checking' | 'eligible' | 'not_found' | 'already_registered' | 'error';

const StepIndicator: React.FC<{ current: Step }> = ({ current }) => (
  <div className="flex items-center gap-2 mb-6">
    {([1, 2, 3] as Step[]).map((s, i) => (
      <React.Fragment key={s}>
        <div className={`flex items-center justify-center w-7 h-7 rounded-full text-[11px] font-bold border transition-all duration-300 ${current === s ? 'bg-blue-500/20 text-blue-300 border-blue-500/40' : current > s ? 'bg-blue-500/20 text-blue-400 border-blue-500/30' : 'bg-white/[0.03] text-gray-600 border-white/[0.07]'}`}>
          {current > s ? <FaCheckCircle size={10} /> : s}
        </div>
        {i < 2 && <div className={`flex-1 h-px transition-all duration-300 ${current > s ? 'bg-blue-500/30' : 'bg-white/[0.06]'}`} />}
      </React.Fragment>
    ))}
  </div>
);

const StudentAuth: React.FC = () => {
  const navigate = useNavigate();
  const { pathname, search } = useLocation();

  const [isLogin, setIsLogin] = useState(pathname === '/login');
  const [isAnimating, setIsAnimating] = useState(false);
  const [isMounted, setIsMounted] = useState(false);

  const justRegistered = new URLSearchParams(search).get('registered') === 'true';

  useEffect(() => {
    setIsMounted(true);
  }, []);

  useEffect(() => {
    const targetIsLogin = pathname === '/login';
    if (targetIsLogin !== isLogin && !isAnimating) {
      setIsAnimating(true);
      const timer = setTimeout(() => {
        setIsLogin(targetIsLogin);
        setIsAnimating(false);
      }, 300);
      return () => clearTimeout(timer);
    }
  }, [pathname, isLogin, isAnimating]);

  // ── Login State ──
  const [schoolId, setSchoolId] = useState('');
  const [password, setPassword] = useState('');
  const [showPass, setShowPass] = useState(false);
  const [loginError, setLoginError] = useState('');
  const [login, { isLoading: isLoggingIn }] = useLoginMutation();

  // ── Register State ──
  const [regStep, setRegStep] = useState<Step>(1);
  const [regSchoolId, setRegSchoolId] = useState('');
  const [masterlistData, setMasterlistData] = useState<MasterlistData | null>(null);
  const [regPassword, setRegPassword] = useState('');
  const [regConfirmPass, setRegConfirmPass] = useState('');
  const [showRegPass, setShowRegPass] = useState(false);
  const [showRegConfirmPass, setShowRegConfirmPass] = useState(false);
  const [regError, setRegError] = useState('');
  const [registers, { isLoading: isRegistering }] = useRegistersMutation();

  // ── Inline validation with lazy RTK Query + debounce ──────────────────────
  const [validationStatus, setValidationStatus] = useState<ValidationStatus>('idle');
  const [validationMsg, setValidationMsg] = useState('');
  const [validateRegistration] = useLazyValidateRegistrationQuery();
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    const id = regSchoolId.trim();
    if (!id) {
      setValidationStatus('idle');
      setValidationMsg('');
      setMasterlistData(null);
      return;
    }
    setValidationStatus('checking');
    setValidationMsg('');
    if (debounceRef.current) clearTimeout(debounceRef.current);
    debounceRef.current = setTimeout(async () => {
      try {
        const res = await validateRegistration(id, false).unwrap() as any;
        const payload = res?.data ?? res;
        if (payload?.alreadyRegistered) {
          setValidationStatus('already_registered');
          setValidationMsg('An account with this School ID already exists. Please sign in.');
          setMasterlistData(null);
        } else {
          setValidationStatus('eligible');
          setValidationMsg(`Eligible for registration`);
          setMasterlistData({
            schoolId: payload.schoolId,
            name: payload.name,
            email: payload.email,
            course: payload.course || payload.department || '—',
            yearLevel: payload.yearLevel || '—',
          });
        }
      } catch (err: any) {
        const msg: string = err?.data?.message ?? err?.message ?? 'Validation failed.';
        if (msg.toLowerCase().includes('not found') || msg.toLowerCase().includes('masterlist')) {
          setValidationStatus('not_found');
          setValidationMsg('School ID not found in masterlist.');
        } else {
          setValidationStatus('error');
          setValidationMsg(msg);
        }
        setMasterlistData(null);
      }
    }, 600);
    return () => { if (debounceRef.current) clearTimeout(debounceRef.current); };
  }, [regSchoolId]);

  const handleModeSwitch = (target: 'login' | 'register') => {
    if (isAnimating) return;
    setIsAnimating(true);
    setTimeout(() => {
      setIsLogin(target === 'login');
      navigate(target === 'login' ? '/login' : '/register');
      setIsAnimating(false);
    }, 300);
  };

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!schoolId.trim() || !password.trim()) return;
    setLoginError('');
    try {
      const result = await login({ username: schoolId.trim(), password }).unwrap() as any;
      const token = result.token ?? result.data?.token ?? result.accessToken;
      if (!token) { setLoginError('Authentication failed.'); return; }
      setUserLocalStorage(token);
      window.location.href = '/';
    } catch (err: any) { setLoginError(err?.data?.message || 'Invalid School ID or password.'); }
  };

  const handleValidate = (e: React.FormEvent) => {
    e.preventDefault();
    if (!regSchoolId.trim()) return;
    if (validationStatus === 'eligible' && masterlistData) {
      setRegStep(2);
    }
  };

  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault();
    if (regPassword !== regConfirmPass) { setRegError('Passwords mismatch.'); return; }
    if (regPassword.length < 8) { setRegError('Min 8 characters.'); return; }
    try {
      await registers({
        schoolId: masterlistData!.schoolId,
        username: masterlistData!.schoolId,
        name: masterlistData!.name,
        email: masterlistData!.email,
        course: masterlistData!.course,
        yearLevel: masterlistData!.yearLevel,
        password: regPassword,
      }).unwrap();
      navigate('/login?registered=true');
    } catch (err: any) { setRegError(err?.data?.message || 'Failed.'); }
  };

  return (
    <div className="min-h-screen bg-gray-950 flex flex-col items-center justify-center p-4 overflow-hidden">

      {/* Logo & Header Section */}
      <div className={`mb-10 text-center px-4 transition-all duration-1000 ${isMounted ? 'opacity-100 translate-y-0' : 'opacity-0 -translate-y-4'}`}>
        <div className="flex flex-col items-center">
          <div className="space-y-1 mb-4">
            <h1 className="text-2xl md:text-3xl font-extrabold text-white tracking-tight">
              SAS Lost & <span className="text-blue-400/90">Found</span>
            </h1>
            <div className="flex items-center justify-center gap-3">
              <div className="h-[1px] w-8 bg-gradient-to-r from-transparent to-white/20" />
              <span className="text-[10px] font-bold text-blue-300/60 tracking-[0.2em] uppercase">
                Student Affairs & Services
              </span>
              <div className="h-[1px] w-8 bg-gradient-to-l from-transparent to-white/20" />
            </div>
          </div>
          <div className="py-1 px-3 rounded-full bg-blue-500/5 border border-blue-500/10">
            <p className="text-gray-400 text-[10px] md:text-[11px] font-semibold uppercase tracking-[0.1em]">
              {isLogin ? 'Student Login' : 'Student Registration'}
            </p>
          </div>
        </div>
      </div>

      {justRegistered && isLogin && (
        <div className="w-full max-w-sm mb-4 bg-blue-500/5 border border-blue-500/20 rounded-2xl px-4 py-3 animate-in fade-in">
          <p className="text-blue-300 text-xs font-medium text-center">
            Account successfully created. Sign in to continue.
          </p>
        </div>
      )}

      {/* Auth Card */}
      <div className={`w-full max-w-sm bg-gray-900 border border-white/[0.06] rounded-2xl overflow-hidden shadow-2xl relative transition-all duration-500 ${isMounted ? 'opacity-100 scale-100' : 'opacity-0 scale-95'}`}>
        <div className={`transition-all duration-300 ease-in-out ${isAnimating ? 'opacity-0 translate-y-4' : 'opacity-100 translate-y-0'}`}>

          <div className="px-5 pt-5 pb-4 border-b border-white/[0.04] bg-white/[0.01]">
            {!isLogin && <StepIndicator current={regStep} />}
            <h2 className="text-sm font-bold text-white">{isLogin ? 'Sign In' : 'Create Account'}</h2>
            <p className="text-[11px] text-gray-500 mt-0.5">
              {isLogin ? "Use your School ID to continue" : "Join the student community"}
            </p>
          </div>

          <div className="p-5">
            {isLogin ? (
              <form onSubmit={handleLogin} className="space-y-3">
                <div className="bg-white/[0.03] border border-white/[0.07] rounded-xl overflow-hidden focus-within:border-blue-500/30 transition-colors">
                  <div className="flex items-center gap-2 px-3 py-2 border-b border-white/[0.05]"><FaIdCard size={9} className="text-blue-400" /><p className="text-[10px] font-bold text-blue-400 uppercase tracking-widest">School ID</p></div>
                  <input type="text" value={schoolId} onChange={e => setSchoolId(e.target.value)} placeholder=" " className="w-full bg-transparent text-white text-sm px-3 py-2.5 focus:outline-none" />
                </div>
                <div className="bg-white/[0.03] border border-white/[0.07] rounded-xl overflow-hidden focus-within:border-blue-500/30 transition-colors">
                  <div className="flex items-center gap-2 px-3 py-2 border-b border-white/[0.05]"><FaLock size={9} className="text-blue-400" /><p className="text-[10px] font-bold text-blue-400 uppercase tracking-widest">Password</p></div>
                  <div className="flex items-center pr-2">
                    <input type={showPass ? 'text' : 'password'} value={password} onChange={e => setPassword(e.target.value)} placeholder="••••••••" className="flex-1 bg-transparent text-white text-sm px-3 py-2.5 focus:outline-none" />
                    <button type="button" onClick={() => setShowPass(!showPass)} className="text-gray-600 hover:text-white">{showPass ? <FaEyeSlash size={12} /> : <FaEye size={12} />}</button>
                  </div>
                </div>
                {loginError && <div className="bg-red-500/5 border border-red-500/15 rounded-xl px-3 py-2.5 text-red-300/80 text-xs">{loginError}</div>}
                <button type="submit" disabled={isLoggingIn || !schoolId.trim() || !password.trim()} className="w-full py-2.5 rounded-xl text-xs font-semibold bg-blue-500/10 text-blue-300 border border-blue-500/25 hover:bg-blue-500/20 disabled:opacity-40 transition-all">Sign In</button>
                <p className="text-center text-[11px] text-gray-600 pt-1">Don't have an account? <button type="button" onClick={() => handleModeSwitch('register')} className="text-blue-400 hover:text-blue-300 font-semibold">Register with School ID</button></p>
              </form>
            ) : (
              <div className="space-y-3">
                {regStep === 1 && (
                  <form onSubmit={handleValidate} className="space-y-3">
                    {/* School ID input */}
                    <div className={`bg-white/[0.03] border rounded-xl overflow-hidden transition-colors ${validationStatus === 'eligible' ? 'border-blue-500/35 focus-within:border-blue-500/50' :
                      validationStatus === 'not_found' ? 'border-red-500/35 focus-within:border-red-500/50' :
                        validationStatus === 'already_registered' ? 'border-blue-500/35 focus-within:border-blue-500/50' :
                          validationStatus === 'error' ? 'border-red-500/35 focus-within:border-red-500/50' :
                            'border-white/[0.07] focus-within:border-blue-500/30'
                      }`}>
                      <div className="flex items-center gap-2 px-3 py-2 border-b border-white/[0.05]">
                        <FaIdCard size={9} className="text-blue-400" />
                        <p className="text-[10px] font-bold text-blue-400 uppercase tracking-widest">School ID</p>
                        {/* Inline status indicator */}
                        {validationStatus === 'checking' && (
                          <span className="ml-auto flex items-center gap-1 text-[9px] text-gray-500 font-semibold">
                            <Spinner size="xs" />
                            Checking…
                          </span>
                        )}
                        {validationStatus === 'eligible' && (
                          <span className="ml-auto flex items-center gap-1 text-[9px] text-blue-400 font-bold">
                            <FaCheckCircle size={8} />
                            Eligible
                          </span>
                        )}
                        {(validationStatus === 'not_found' || validationStatus === 'error') && (
                          <span className="ml-auto flex items-center gap-1 text-[9px] text-red-400 font-bold">
                            <FaTimesCircle size={8} />
                            Not found
                          </span>
                        )}
                        {validationStatus === 'already_registered' && (
                          <span className="ml-auto flex items-center gap-1 text-[9px] text-blue-400 font-bold">
                            <FaExclamationTriangle size={8} />
                            Already registered
                          </span>
                        )}
                      </div>
                      <input
                        type="text"
                        value={regSchoolId}
                        onChange={e => setRegSchoolId(e.target.value)}
                        placeholder=" "
                        className="w-full bg-transparent text-white text-sm px-3 py-2.5 focus:outline-none"
                      />
                    </div>

                    {/* Status message banner */}
                    {validationStatus === 'eligible' && masterlistData && (
                      <div className="bg-blue-500/5 border border-blue-500/20 rounded-xl px-3 py-2.5">
                        <p className="text-blue-300 text-[10px] font-bold">{masterlistData.name}</p>
                        <p className="text-blue-300/60 text-[9px] mt-0.5">{masterlistData.course} · {masterlistData.yearLevel}</p>
                      </div>
                    )}
                    {(validationStatus === 'not_found' || validationStatus === 'error') && (
                      <div className="bg-red-500/5 border border-red-500/15 rounded-xl px-3 py-2.5 text-red-300/80 text-[10px] leading-relaxed">
                        {validationMsg}
                      </div>
                    )}

                    {/* ── Already registered — improved card with CTA button ── */}
                    {validationStatus === 'already_registered' && (
                      <div className="bg-blue-500/5 border border-blue-500/20 rounded-xl px-3 py-3 space-y-2.5">
                        <div className="flex items-start gap-2">
                          <div className="flex-1 min-w-0">
                            <p className="text-blue-300 text-[11px] font-bold leading-snug">Account already exists</p>
                            <p className="text-blue-300/60 text-[10px] leading-relaxed mt-0.5">
                              This School ID is already registered. Sign in with your existing account instead.
                            </p>
                          </div>
                        </div>
                        <button
                          type="button"
                          onClick={() => handleModeSwitch('login')}
                          className="w-full py-2.5 rounded-lg bg-blue-500/10 hover:bg-blue-500/20 active:bg-blue-500/25 border border-blue-500/25 text-blue-300 text-[11px] font-bold transition-all flex items-center justify-center gap-1.5 group"
                        >
                          Sign in instead
                        </button>
                      </div>
                    )}

                    {regError && <div className="bg-red-500/5 border border-red-500/15 rounded-xl px-3 py-2.5 text-red-300/80 text-xs">{regError}</div>}

                    <button
                      type="submit"
                      disabled={validationStatus !== 'eligible' || !masterlistData}
                      className="w-full py-2.5 rounded-xl text-xs font-semibold bg-blue-500/10 text-blue-300 border border-blue-500/25 hover:bg-blue-500/20 disabled:opacity-40 transition-all flex items-center justify-center gap-2"
                    >
                      Continue
                    </button>
                  </form>
                )}
                {regStep === 2 && masterlistData && (
                  <div className="space-y-3">
                    <div className="flex items-center gap-2 bg-blue-500/5 border border-blue-500/15 rounded-xl px-3 py-2.5"><MdVerified size={14} className="text-blue-400 shrink-0" /><p className="text-blue-300/80 text-xs font-medium">Record Authenticated</p></div>
                    <div className="bg-white/[0.03] border border-white/[0.07] rounded-xl p-3 space-y-2">
                      <div><p className="text-[8px] font-black text-gray-600 uppercase tracking-widest">Name</p><p className="text-xs text-white font-bold">{masterlistData.name}</p></div>
                      <div className="flex gap-4">
                        <div className="flex-1"><p className="text-[8px] font-black text-gray-600 uppercase tracking-widest">Program</p><p className="text-[10px] text-gray-400">{masterlistData.course}</p></div>
                        <div className="flex-1 text-right"><p className="text-[8px] font-black text-gray-600 uppercase tracking-widest">Year Level</p><p className="text-[10px] text-gray-400">{masterlistData.yearLevel}</p></div>
                      </div>
                    </div>
                    <div className="flex gap-2">
                      <button onClick={() => setRegStep(1)} className="flex-1 py-2.5 rounded-xl border border-white/[0.07] text-[10px] font-bold text-gray-500 hover:bg-white/[0.03]">Back</button>
                      <button onClick={() => setRegStep(3)} className="flex-1 py-2.5 rounded-xl bg-blue-500/10 text-blue-300 border border-blue-500/25 font-bold text-[10px]">Proceed</button>
                    </div>
                  </div>
                )}
                {regStep === 3 && (
                  <form onSubmit={handleRegister} className="space-y-3">
                    <div className="bg-white/[0.03] border border-white/[0.07] rounded-xl overflow-hidden focus-within:border-blue-500/30 transition-colors">
                      <div className="flex items-center gap-2 px-3 py-2 border-b border-white/[0.05]"><FaLock size={9} className="text-blue-400" /><p className="text-[10px] font-bold text-blue-400 uppercase tracking-widest">New Password</p></div>
                      <div className="flex items-center pr-2">
                        <input type={showRegPass ? 'text' : 'password'} value={regPassword} onChange={e => setRegPassword(e.target.value)} placeholder="••••••••" className="flex-1 bg-transparent text-white text-sm px-3 py-2.5 focus:outline-none" />
                        <button type="button" onClick={() => setShowRegPass(!showRegPass)} className="text-gray-600 hover:text-white">{showRegPass ? <FaEyeSlash size={12} /> : <FaEye size={12} />}</button>
                      </div>
                    </div>
                    <div className="bg-white/[0.03] border border-white/[0.07] rounded-xl overflow-hidden focus-within:border-blue-500/30 transition-colors">
                      <div className="flex items-center gap-2 px-3 py-2 border-b border-white/[0.05]"><FaLock size={9} className="text-blue-400" /><p className="text-[10px] font-bold text-blue-400 uppercase tracking-widest">Confirm Password</p></div>
                      <div className="flex items-center pr-2">
                        <input type={showRegConfirmPass ? 'text' : 'password'} value={regConfirmPass} onChange={e => setRegConfirmPass(e.target.value)} placeholder="••••••••" className="flex-1 bg-transparent text-white text-sm px-3 py-2.5 focus:outline-none" />
                        <button type="button" onClick={() => setShowRegConfirmPass(!showRegConfirmPass)} className="text-gray-600 hover:text-white">{showRegConfirmPass ? <FaEyeSlash size={12} /> : <FaEye size={12} />}</button>
                      </div>
                    </div>
                    {regPassword && regConfirmPass && regPassword !== regConfirmPass && <p className="text-[10px] text-red-400 pl-1">Passwords do not match</p>}
                    {regError && <div className="bg-red-500/5 border border-red-500/15 rounded-xl px-3 py-2.5 text-red-300/80 text-xs">{regError}</div>}
                    <div className="flex gap-2">
                      <button type="button" onClick={() => setRegStep(2)} className="flex-1 py-2.5 rounded-xl border border-white/[0.07] text-[10px] font-bold text-gray-500 hover:bg-white/[0.03]">Back</button>
                      <button type="submit" disabled={isRegistering || !regPassword || regPassword !== regConfirmPass} className="flex-1 py-2.5 rounded-xl bg-blue-500/10 text-blue-300 border border-blue-500/25 font-bold text-[10px] flex items-center justify-center">
                        {isRegistering ? <Spinner size="sm" /> : 'Create Account'}
                      </button>
                    </div>
                  </form>
                )}
                <p className="text-center text-[11px] text-gray-600 pt-1">Already have an account? <button type="button" onClick={() => handleModeSwitch('login')} className="text-blue-400 hover:text-blue-300 font-semibold">Sign In</button></p>
              </div>
            )}
          </div>
        </div>
      </div>

      <div className={`mt-6 transition-all duration-1000 ${isMounted ? 'opacity-100' : 'opacity-0'}`}>
        <p className="text-gray-700 text-[10px]">NBSC Student Affairs System · Lost & Found</p>
      </div>
    </div>
  );
};

export default StudentAuth;