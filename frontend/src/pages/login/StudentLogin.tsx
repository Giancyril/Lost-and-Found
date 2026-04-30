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

  const [login, { isLoading }] = useLoginMutation();
  const handleTripleTap = useTripleTap(() => navigate('/admin'));

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!schoolId.trim() || !password.trim()) return;
    setError('');

    try {
      const result = await login({
        username: schoolId.trim(),
        password,
      }).unwrap() as any;

      console.log('Login result:', result);
      console.log('Token:', result.token);
      console.log('Token type:', typeof result.token);

      const token = result.token ?? result.data?.token ?? result.accessToken ?? result.data?.accessToken;
      console.log('Resolved token:', token);

      if (!token) {
        setError('Login succeeded but no token received. Please contact support.');
        return;
      }

      setUserLocalStorage(token);
      window.location.href = '/';
    } catch (err: any) {
      setError(err?.data?.message || 'Invalid School ID or password.');
    }
  };

  return (
    <div className="min-h-screen bg-gray-950 flex flex-col items-center justify-center p-4">

      {/* Logo & Header Section */}
        <div className="mb-10 text-center px-4">
        <div className="flex flex-col items-center">
            
            {/* Main Branding Group */}
            <div className="space-y-1 mb-4">
            <h1 className="text-2xl md:text-3xl font-extrabold text-white tracking-tight">
                SAS Lost & <span className="text-blue-400/90">Found</span>
            </h1>
            
            {/* Sub-header with integrated lines */}
            <div className="flex items-center justify-center gap-3">
                <div className="h-[1px] w-8 bg-gradient-to-r from-transparent to-white/20" />
                <span className="text-[10px] font-bold text-blue-300/60 tracking-[0.2em] uppercase">
                Student Affairs & Services
                </span>
                <div className="h-[1px] w-8 bg-gradient-to-l from-transparent to-white/20" />
            </div>
            </div>

            {/* Section Indicator */}
            <div className="py-1 px-3 rounded-full bg-blue-500/5 border border-blue-500/10">
            <p className="text-gray-400 text-[10px] md:text-[11px] font-semibold uppercase tracking-[0.1em]">
                Student Login
            </p>
            </div>
            
        </div>
        </div>

      {justRegistered && (
        <div className="w-full max-w-sm mb-4 bg-blue-500/5 border border-blue-500/20
          rounded-2xl px-4 py-3">
          <p className="text-blue-300 text-xs font-medium text-center">
            Account created successfully. Sign in with your School ID to continue.
          </p>
        </div>
      )}

      <div className="w-full max-w-sm bg-gray-900 border border-white/[0.06]
        rounded-2xl overflow-hidden shadow-2xl">

        <div className="px-5 pt-5 pb-4 border-b border-white/[0.04] bg-white/[0.01]">
          <h2 className="text-sm font-bold text-white">Sign In</h2>
          <p className="text-[11px] text-gray-500 mt-0.5">Use your School ID to continue</p>
        </div>

        <form onSubmit={handleSubmit} className="p-5 space-y-3">

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
              placeholder=" "
              autoComplete="username"
              className="w-full bg-transparent text-white text-sm px-3 py-2.5
                placeholder-gray-600 focus:outline-none"
            />
          </div>

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

          {error && (
            <div className="bg-red-500/5 border border-red-500/15 rounded-xl px-3 py-2.5">
              <p className="text-red-300/80 text-xs">{error}</p>
            </div>
          )}

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
                 Sign In
              </>
            )}
          </button>

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