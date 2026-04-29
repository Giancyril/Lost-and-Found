import React, { useState } from 'react';
import { Link, useNavigate, useSearchParams } from 'react-router-dom';
import { FaIdCard, FaLock, FaEye, FaEyeSlash, FaSignInAlt } from 'react-icons/fa';
import { useTripleTap } from '../../hooks/useTripleTap';
import { useLoginMutation } from "../../redux/api/api";
import { setUserLocalStorage } from "../../auth/auth";   

export const StudentLogin: React.FC = () => {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const justRegistered = searchParams.get('registered') === 'true';

  const [schoolId, setSchoolId] = useState('');
  const [password, setPassword] = useState('');
  const [showPass, setShowPass] = useState(false);
  const [error, setError]       = useState('');

  // ── Use your existing Redux login mutation ─────────────────────────────────
  const [login, { isLoading }] = useLoginMutation();

  // ── Triple-tap logo → navigate to hidden admin login ──────────────────────
  const handleTripleTap = useTripleTap(() => navigate('/admin'));

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!schoolId.trim() || !password.trim()) return;
    setError('');

    try {
      // Send schoolId as the "username" field — auth.service loginUser checks
      // OR username OR email. We add schoolId lookup in auth.service (see backend).
      const result = await login({
        username: schoolId.trim(), // existing field — intercepted by updated loginUser
        password,
      }).unwrap();

      setUserLocalStorage(result); // your existing helper
      navigate('/');
    } catch (err: any) {
      setError(err?.data?.message || 'Invalid School ID or password.');
    }
  };

  return (
    <div className="min-h-screen bg-gray-950 flex flex-col items-center justify-center p-4">

      {/* Logo — triple-tap triggers hidden admin route */}
      <div
        className="mb-8 text-center"
        onClick={handleTripleTap}
        style={{ cursor: 'default', userSelect: 'none' }}
      >
        <div className="w-16 h-16 rounded-2xl bg-blue-500/10 border border-blue-500/20
          flex items-center justify-center mx-auto mb-4">
          {/* Replace with your actual school logo img if available */}
          <FaIdCard size={28} className="text-blue-400" />
        </div>
        <h1 className="text-white font-bold text-xl tracking-tight">NBSC Lost &amp; Found</h1>
        <p className="text-gray-500 text-xs mt-1">Student Access Portal</p>
      </div>

      {/* Just-registered success banner */}
      {justRegistered && (
        <div className="w-full max-w-sm mb-4 bg-emerald-500/5 border border-emerald-500/20
          rounded-2xl px-4 py-3">
          <p className="text-emerald-300 text-xs font-medium text-center">
            ✓ Account created! Sign in with your School ID.
          </p>
        </div>
      )}

      {/* Card */}
      <div className="w-full max-w-sm bg-gray-900 border border-white/[0.06]
        rounded-2xl overflow-hidden shadow-2xl">

        {/* Card header */}
        <div className="px-5 pt-5 pb-4 border-b border-white/[0.04] bg-white/[0.01]">
          <h2 className="text-sm font-bold text-white">Sign In</h2>
          <p className="text-[11px] text-gray-500 mt-0.5">Use your School ID to continue</p>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="p-5 space-y-3">

          {/* School ID field */}
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
              autoComplete="username"
              className="w-full bg-transparent text-white text-sm px-3 py-2.5
                placeholder-gray-600 focus:outline-none"
            />
          </div>

          {/* Password field */}
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
                placeholder="••••••••"
                autoComplete="current-password"
                className="flex-1 bg-transparent text-white text-sm px-3 py-2.5
                  placeholder-gray-600 focus:outline-none"
              />
              <button
                type="button"
                onClick={() => setShowPass(p => !p)}
                className="w-7 h-7 flex items-center justify-center text-gray-600
                  hover:text-gray-400 transition-colors shrink-0"
              >
                {showPass ? <FaEyeSlash size={12} /> : <FaEye size={12} />}
              </button>
            </div>
          </div>

          {/* Error */}
          {error && (
            <div className="bg-red-500/5 border border-red-500/15 rounded-xl px-3 py-2.5">
              <p className="text-red-300/80 text-xs">{error}</p>
            </div>
          )}

          {/* Submit */}
          <button
            type="submit"
            disabled={isLoading || !schoolId.trim() || !password.trim()}
            className="w-full flex items-center justify-center gap-2 py-2.5 rounded-xl
              text-xs font-semibold transition-all mt-1
              bg-blue-500/10 text-blue-300 border border-blue-500/25
              hover:bg-blue-500/20 disabled:opacity-40 disabled:cursor-not-allowed"
          >
            {isLoading ? (
              <>
                <div className="w-3.5 h-3.5 border border-blue-400 border-t-transparent
                  rounded-full animate-spin" />
                Signing in…
              </>
            ) : (
              <>
                <FaSignInAlt size={10} /> Sign In
              </>
            )}
          </button>

          {/* Register link */}
          <p className="text-center text-[11px] text-gray-600 pt-1">
            Don't have an account?{' '}
            <Link
              to="/register"
              className="text-blue-400 hover:text-blue-300 font-semibold transition-colors"
            >
              Register with School ID
            </Link>
          </p>
        </form>
      </div>

      <p className="text-gray-700 text-[10px] mt-6">
        NBSC Student Affairs System · Lost &amp; Found
      </p>
    </div>
  );
};