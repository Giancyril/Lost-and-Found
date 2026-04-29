import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import {
  FaIdCard, FaLock, FaEye, FaEyeSlash,
  FaCheckCircle, FaArrowRight, FaUser, FaGraduationCap,
} from 'react-icons/fa';
import { MdVerified } from 'react-icons/md';
import { useRegistersMutation } from "../../redux/api/api";

type Step = 1 | 2 | 3;

interface MasterlistData {
  schoolId: string;
  name: string;
  course: string;
  yearLevel: string;
}

// ── Step indicator ────────────────────────────────────────────────────────────
const StepIndicator: React.FC<{ current: Step }> = ({ current }) => (
  <div className="flex items-center gap-2 mb-6">
    {([1, 2, 3] as Step[]).map((s, i) => (
      <React.Fragment key={s}>
        <div
          className={`flex items-center justify-center w-7 h-7 rounded-full text-[11px] font-bold
            border transition-all duration-200
            ${current === s
              ? 'bg-blue-500/20 text-blue-300 border-blue-500/40'
              : current > s
              ? 'bg-emerald-500/20 text-emerald-400 border-emerald-500/30'
              : 'bg-white/[0.03] text-gray-600 border-white/[0.07]'
            }`}
        >
          {current > s ? <FaCheckCircle size={10} /> : s}
        </div>
        {i < 2 && (
          <div
            className={`flex-1 h-px transition-all duration-300
              ${current > s ? 'bg-emerald-500/30' : 'bg-white/[0.06]'}`}
          />
        )}
      </React.Fragment>
    ))}
  </div>
);

export const StudentRegister: React.FC = () => {
  const navigate = useNavigate();

  const [step, setStep]                       = useState<Step>(1);
  const [schoolId, setSchoolId]               = useState('');
  const [masterlistData, setMasterlistData]   = useState<MasterlistData | null>(null);
  const [password, setPassword]               = useState('');
  const [confirmPass, setConfirmPass]         = useState('');
  const [showPass, setShowPass]               = useState(false);
  const [showConfirm, setShowConfirm]         = useState(false);
  const [isValidating, setIsValidating]       = useState(false);
  const [error, setError]                     = useState('');

  // ── Your existing register mutation ───────────────────────────────────────
  const [registers, { isLoading: isRegistering }] = useRegistersMutation();

  // ── Step 1: Validate School ID against masterlist ─────────────────────────
  // Calls GET /api/students/:id — your existing studentController.getStudentById
  // which queries the Google Sheet via studentService.getStudentById
  const handleValidate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!schoolId.trim()) return;
    setIsValidating(true);
    setError('');

    try {
      // Reuse your existing student endpoint to check the masterlist
      const res = await fetch(
        `/api/students/${encodeURIComponent(schoolId.trim())}`
      );
      const json = await res.json();

      if (!res.ok) {
        // studentService throws NOT_FOUND if schoolId isn't in masterlist
        setError(json.message || 'School ID not found in masterlist. Contact your registrar.');
        return;
      }

      const student = json.data;

      // Check if this schoolId is already registered
      // We use a lightweight check via the validate endpoint (see backend)
      const checkRes = await fetch(
        `/api/students/validate-registration?schoolId=${encodeURIComponent(schoolId.trim())}`
      );
      const checkJson = await checkRes.json();

      if (checkJson?.data?.alreadyRegistered) {
        setError('An account with this School ID already exists. Please sign in.');
        return;
      }

      setMasterlistData({
        schoolId: student.id,
        name:     student.name,
        course:   student.course    || student.department || '—',
        yearLevel: student.yearLevel || '—',
      });
      setStep(2);
    } catch {
      setError('Could not reach the server. Please try again.');
    } finally {
      setIsValidating(false);
    }
  };

  // ── Step 3: Register ───────────────────────────────────────────────────────
  // Calls POST /api/register — your existing userController.registerUser
  // Updated to accept schoolId + set name/username from masterlist (see backend)
  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault();
    if (password !== confirmPass) { setError('Passwords do not match.'); return; }
    if (password.length < 8)     { setError('Password must be at least 8 characters.'); return; }
    setError('');

    try {
      await registers({
        schoolId:  masterlistData!.schoolId,
        username:  masterlistData!.schoolId,          // schoolId doubles as username
        name:      masterlistData!.name,
        email:     `${masterlistData!.schoolId}@student.nbsc.edu.ph`, // synthetic fallback
        password,
      }).unwrap();

      navigate('/login?registered=true');
    } catch (err: any) {
      setError(err?.data?.message || 'Registration failed. Please try again.');
    }
  };

  const stepLabels: Record<Step, string> = {
    1: 'Enter your School ID',
    2: 'Confirm your details',
    3: 'Set your password',
  };

  return (
    <div className="min-h-screen bg-gray-950 flex flex-col items-center justify-center p-4">

      {/* Logo */}
      <div className="mb-8 text-center">
        <div className="w-16 h-16 rounded-2xl bg-blue-500/10 border border-blue-500/20
          flex items-center justify-center mx-auto mb-4">
          <FaIdCard size={28} className="text-blue-400" />
        </div>
        <h1 className="text-white font-bold text-xl tracking-tight">Create Account</h1>
        <p className="text-gray-500 text-xs mt-1">NBSC Lost &amp; Found · Student Registration</p>
      </div>

      {/* Card */}
      <div className="w-full max-w-sm bg-gray-900 border border-white/[0.06]
        rounded-2xl overflow-hidden shadow-2xl">

        {/* Header */}
        <div className="px-5 pt-5 pb-4 border-b border-white/[0.04] bg-white/[0.01]">
          <StepIndicator current={step} />
          <h2 className="text-sm font-bold text-white">{stepLabels[step]}</h2>
          <p className="text-[11px] text-gray-500 mt-0.5">
            {step === 1 && "We'll check if you're in the school masterlist."}
            {step === 2 && 'Make sure these details are correct before continuing.'}
            {step === 3 && 'Choose a strong password for your account.'}
          </p>
        </div>

        <div className="p-5">

          {/* ── Step 1: School ID ── */}
          {step === 1 && (
            <form onSubmit={handleValidate} className="space-y-3">
              <div className="bg-white/[0.03] border border-white/[0.07] rounded-xl overflow-hidden
                focus-within:border-blue-500/30 transition-colors">
                <div className="flex items-center gap-2 px-3 py-2 border-b border-white/[0.05]">
                  <FaIdCard size={9} className="text-blue-400" />
                  <p className="text-[10px] font-bold text-blue-400 uppercase tracking-widest">School ID</p>
                </div>
                <input
                  type="text"
                  value={schoolId}
                  onChange={e => { setSchoolId(e.target.value); setError(''); }}
                  placeholder="e.g. 2021-00123"
                  autoFocus
                  className="w-full bg-transparent text-white text-sm px-3 py-2.5
                    placeholder-gray-600 focus:outline-none"
                />
              </div>

              {error && (
                <div className="bg-red-500/5 border border-red-500/15 rounded-xl px-3 py-2.5">
                  <p className="text-red-300/80 text-xs">{error}</p>
                </div>
              )}

              <button
                type="submit"
                disabled={isValidating || !schoolId.trim()}
                className="w-full flex items-center justify-center gap-2 py-2.5 rounded-xl
                  text-xs font-semibold transition-all
                  bg-blue-500/10 text-blue-300 border border-blue-500/25
                  hover:bg-blue-500/20 disabled:opacity-40 disabled:cursor-not-allowed"
              >
                {isValidating ? (
                  <>
                    <div className="w-3.5 h-3.5 border border-blue-400 border-t-transparent rounded-full animate-spin" />
                    Checking masterlist…
                  </>
                ) : (
                  <><FaArrowRight size={10} /> Continue</>
                )}
              </button>
            </form>
          )}

          {/* ── Step 2: Confirm details ── */}
          {step === 2 && masterlistData && (
            <form onSubmit={e => { e.preventDefault(); setStep(3); }} className="space-y-3">
              {/* Verified badge */}
              <div className="flex items-center gap-2 bg-emerald-500/5 border border-emerald-500/15
                rounded-xl px-3 py-2.5">
                <MdVerified size={14} className="text-emerald-400 shrink-0" />
                <p className="text-emerald-300/80 text-xs font-medium">Found in school masterlist</p>
              </div>

              {/* Read-only details */}
              {[
                { label: 'Full Name',  value: masterlistData.name,      icon: <FaUser size={9} className="text-cyan-400" />,          color: 'text-cyan-400'   },
                { label: 'Course',     value: masterlistData.course,     icon: <FaGraduationCap size={9} className="text-violet-400" />, color: 'text-violet-400' },
                { label: 'Year Level', value: masterlistData.yearLevel,  icon: <FaIdCard size={9} className="text-orange-400" />,       color: 'text-orange-400' },
              ].map(field => (
                <div key={field.label} className="bg-white/[0.03] border border-white/[0.07] rounded-xl overflow-hidden">
                  <div className="flex items-center gap-2 px-3 py-1.5 border-b border-white/[0.05]">
                    {field.icon}
                    <p className={`text-[10px] font-bold uppercase tracking-widest ${field.color}`}>{field.label}</p>
                  </div>
                  <p className="text-white text-sm px-3 py-2.5 font-medium">{field.value}</p>
                </div>
              ))}

              <p className="text-[11px] text-gray-600 text-center">
                Not you?{' '}
                <button
                  type="button"
                  onClick={() => { setStep(1); setMasterlistData(null); setError(''); }}
                  className="text-blue-400 hover:text-blue-300 font-semibold"
                >
                  Go back
                </button>
              </p>

              <button
                type="submit"
                className="w-full flex items-center justify-center gap-2 py-2.5 rounded-xl
                  text-xs font-semibold transition-all
                  bg-blue-500/10 text-blue-300 border border-blue-500/25
                  hover:bg-blue-500/20"
              >
                <FaArrowRight size={10} /> Yes, that's me — Continue
              </button>
            </form>
          )}

          {/* ── Step 3: Password ── */}
          {step === 3 && (
            <form onSubmit={handleRegister} className="space-y-3">
              {/* Password */}
              <div className="bg-white/[0.03] border border-white/[0.07] rounded-xl overflow-hidden
                focus-within:border-blue-500/30 transition-colors">
                <div className="flex items-center gap-2 px-3 py-2 border-b border-white/[0.05]">
                  <FaLock size={9} className="text-blue-400" />
                  <p className="text-[10px] font-bold text-blue-400 uppercase tracking-widest">Password</p>
                </div>
                <div className="flex items-center pr-2">
                  <input
                    type={showPass ? 'text' : 'password'}
                    value={password}
                    onChange={e => { setPassword(e.target.value); setError(''); }}
                    placeholder="Min. 8 characters"
                    autoFocus
                    className="flex-1 bg-transparent text-white text-sm px-3 py-2.5
                      placeholder-gray-600 focus:outline-none"
                  />
                  <button type="button" onClick={() => setShowPass(p => !p)}
                    className="w-7 h-7 flex items-center justify-center text-gray-600 hover:text-gray-400 transition-colors">
                    {showPass ? <FaEyeSlash size={12} /> : <FaEye size={12} />}
                  </button>
                </div>
              </div>

              {/* Confirm password */}
              <div className="bg-white/[0.03] border border-white/[0.07] rounded-xl overflow-hidden
                focus-within:border-blue-500/30 transition-colors">
                <div className="flex items-center gap-2 px-3 py-2 border-b border-white/[0.05]">
                  <FaLock size={9} className="text-blue-400" />
                  <p className="text-[10px] font-bold text-blue-400 uppercase tracking-widest">Confirm Password</p>
                </div>
                <div className="flex items-center pr-2">
                  <input
                    type={showConfirm ? 'text' : 'password'}
                    value={confirmPass}
                    onChange={e => { setConfirmPass(e.target.value); setError(''); }}
                    placeholder="Re-enter password"
                    className="flex-1 bg-transparent text-white text-sm px-3 py-2.5
                      placeholder-gray-600 focus:outline-none"
                  />
                  <button type="button" onClick={() => setShowConfirm(p => !p)}
                    className="w-7 h-7 flex items-center justify-center text-gray-600 hover:text-gray-400 transition-colors">
                    {showConfirm ? <FaEyeSlash size={12} /> : <FaEye size={12} />}
                  </button>
                </div>
              </div>

              {confirmPass && (
                <p className={`text-[11px] font-medium ${password === confirmPass ? 'text-emerald-400' : 'text-red-400'}`}>
                  {password === confirmPass ? '✓ Passwords match' : '✗ Passwords do not match'}
                </p>
              )}

              {error && (
                <div className="bg-red-500/5 border border-red-500/15 rounded-xl px-3 py-2.5">
                  <p className="text-red-300/80 text-xs">{error}</p>
                </div>
              )}

              <button
                type="submit"
                disabled={isRegistering || !password || !confirmPass || password !== confirmPass}
                className="w-full flex items-center justify-center gap-2 py-2.5 rounded-xl
                  text-xs font-semibold transition-all
                  bg-emerald-500/10 text-emerald-400 border border-emerald-500/25
                  hover:bg-emerald-500/20 disabled:opacity-40 disabled:cursor-not-allowed"
              >
                {isRegistering ? (
                  <>
                    <div className="w-3.5 h-3.5 border border-emerald-400 border-t-transparent rounded-full animate-spin" />
                    Creating account…
                  </>
                ) : (
                  <><FaCheckCircle size={10} /> Create Account</>
                )}
              </button>
            </form>
          )}

          {/* Login link */}
          <p className="text-center text-[11px] text-gray-600 mt-4">
            Already have an account?{' '}
            <Link to="/login" className="text-blue-400 hover:text-blue-300 font-semibold transition-colors">
              Sign in
            </Link>
          </p>
        </div>
      </div>

      <p className="text-gray-700 text-[10px] mt-6">
        NBSC Student Affairs System · Lost &amp; Found
      </p>
    </div>
  );
};