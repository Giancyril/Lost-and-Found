import React, { useState } from "react";
import { FaKey, FaCheck, FaEye, FaEyeSlash, FaStar } from "react-icons/fa";
import { Link } from "react-router-dom";
import { useUserVerification } from "../../auth/auth";

const API = "/api";
const authHeaders = () => ({
  Authorization: `Bearer ${localStorage.getItem("accessToken") ?? ""}`,
  "Content-Type": "application/json",
});

// Matches the exact SVG user icon used in StudentLayout's profile avatar
const UserIcon = ({ className = "w-6 h-6" }: { className?: string }) => (
  <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="white" className={`${className} opacity-90`}>
    <path d="M12 12c2.7 0 4.8-2.1 4.8-4.8S14.7 2.4 12 2.4 7.2 4.5 7.2 7.2 9.3 12 12 12zm0 2.4c-3.2 0-9.6 1.6-9.6 4.8v2.4h19.2v-2.4c0-3.2-6.4-4.8-9.6-4.8z"/>
  </svg>
);

export default function StudentSettings() {
  const user: any = useUserVerification();

  const [pwForm, setPwForm]       = useState({ currentPassword: "", newPassword: "", confirm: "" });
  const [showPw, setShowPw]       = useState<Record<string, boolean>>({});
  const [pwMsg, setPwMsg]         = useState<{ ok: boolean; text: string } | null>(null);
  const [pwLoading, setPwLoading] = useState(false);

  const toggleShow = (key: string) =>
    setShowPw(p => ({ ...p, [key]: !p[key] }));

  const handleChangePassword = async (e: React.FormEvent) => {
    e.preventDefault();
    if (pwForm.newPassword !== pwForm.confirm) {
      setPwMsg({ ok: false, text: "New passwords do not match." });
      return;
    }
    setPwLoading(true);
    setPwMsg(null);
    try {
      const res = await fetch(`${API}/change-password`, {
        method: "POST",
        headers: authHeaders(),
        body: JSON.stringify({
          currentPassword: pwForm.currentPassword,
          newPassword: pwForm.newPassword,
        }),
      });
      const data = await res.json();
      if (data.success) {
        setPwMsg({ ok: true, text: "Password changed successfully." });
        setPwForm({ currentPassword: "", newPassword: "", confirm: "" });
      } else {
        setPwMsg({ ok: false, text: data.message ?? "Failed to change password." });
      }
    } catch {
      setPwMsg({ ok: false, text: "Could not reach the server." });
    } finally {
      setPwLoading(false);
    }
  };

  const fields = [
    { label: "Current Password", key: "currentPassword" },
    { label: "New Password",     key: "newPassword" },
    { label: "Confirm Password", key: "confirm" },
  ];

  return (
    <div className="space-y-5 max-w-lg">

      {/* ── Profile Card — mirrors StudentLayout avatar exactly ── */}
      <div className="bg-gray-900 border border-white/[0.06] rounded-2xl overflow-hidden">
        {/* Subtle top accent strip */}
        <div className="h-0.5 w-full bg-gradient-to-r from-blue-600 via-cyan-400 to-transparent" />

        <div className="p-5 space-y-4">
          <p className="text-[9px] font-bold text-gray-600 uppercase tracking-widest">Profile</p>

          <div className="flex items-center gap-4">
            {/* Avatar — identical markup to StudentLayout sidebar avatar */}
            <div className="relative shrink-0">
              <div className="w-14 h-14 bg-gradient-to-br from-blue-600 to-cyan-500 rounded-full
                flex items-center justify-center border-2 border-gray-700 shadow-lg shadow-blue-900/30">
                <UserIcon className="w-7 h-7" />
              </div>
              {/* Online dot */}
              <span className="absolute -bottom-0.5 -right-0.5 w-3 h-3 bg-emerald-500
                border-2 border-gray-900 rounded-full" />
            </div>

            {/* Info */}
            <div className="min-w-0 flex-1">
              <p className="text-white font-bold text-base leading-tight truncate">
                {user?.name || user?.username || "Student"}
              </p>
              <p className="text-gray-500 text-xs font-mono mt-0.5">
                {user?.schoolId || "STUDENT"}
              </p>
              {user?.email && (
                <p className="text-gray-600 text-xs mt-0.5 truncate">{user.email}</p>
              )}
            </div>

            {/* Points pill — matches topbar style */}
            <Link
              to="/dashboard/student/leaderboard"
              className="hidden sm:flex items-center gap-1.5 px-2.5 py-1 bg-yellow-400/10
                text-yellow-300 border border-yellow-400/20 rounded-full text-[11px]
                font-bold hover:bg-yellow-400/15 transition-colors shrink-0"
            >
              <FaStar size={9} className="text-yellow-400" />
              <span>Points</span>
            </Link>
          </div>

          {/* Read-only details grid */}
          <div className="grid grid-cols-2 gap-2 pt-1">
            {[
              { label: "Full Name",  value: user?.name || user?.username || "—" },
              { label: "School ID", value: user?.schoolId || "—" },
              { label: "Role",      value: "Student" },
              { label: "Email",     value: user?.email || "—" },
            ].map(({ label, value }) => (
              <div key={label}
                className="bg-gray-800/50 border border-white/[0.05] rounded-xl px-3 py-2.5">
                <p className="text-[9px] uppercase tracking-widest text-gray-600 font-bold mb-0.5">
                  {label}
                </p>
                <p className="text-gray-300 text-xs font-mono truncate">{value}</p>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* ── Change Password ── */}
      <div className="bg-gray-900 border border-white/[0.06] rounded-2xl p-5 space-y-4">
        <div className="flex items-center gap-2">
          <FaKey size={11} className="text-blue-400" />
          <p className="text-[9px] font-bold text-gray-600 uppercase tracking-widest">
            Change Password
          </p>
        </div>

        <form onSubmit={handleChangePassword} className="space-y-3">
          {fields.map(({ label, key }) => (
            <div key={key}>
              <label className="text-gray-500 text-xs font-medium block mb-1">{label}</label>
              <div className="relative">
                <input
                  type={showPw[key] ? "text" : "password"}
                  value={(pwForm as any)[key]}
                  onChange={e => setPwForm(f => ({ ...f, [key]: e.target.value }))}
                  className="w-full bg-gray-800 border border-white/[0.08] rounded-xl px-3 py-2.5
                    text-white text-sm placeholder-gray-600 focus:outline-none
                    focus:border-blue-500/40 transition-colors pr-9"
                  placeholder="••••••••"
                />
                <button
                  type="button"
                  onClick={() => toggleShow(key)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-500 hover:text-gray-300 transition-colors"
                >
                  {showPw[key] ? <FaEyeSlash size={12} /> : <FaEye size={12} />}
                </button>
              </div>
            </div>
          ))}

          {pwMsg && (
            <p className={`text-xs px-3 py-2 rounded-lg flex items-center gap-2 ${
              pwMsg.ok
                ? "bg-emerald-500/10 text-emerald-300 border border-emerald-500/20"
                : "bg-red-500/10 text-red-300 border border-red-500/20"
            }`}>
              {pwMsg.ok && <FaCheck size={10} />}
              {pwMsg.text}
            </p>
          )}

          <button
            type="submit"
            disabled={pwLoading}
            className="flex items-center gap-2 px-4 py-2.5 rounded-xl text-xs font-bold
              bg-blue-500/10 text-blue-300 border border-blue-500/25
              hover:bg-blue-500/20 disabled:opacity-40 transition-colors"
          >
            {pwLoading && (
              <div className="w-3.5 h-3.5 border border-blue-400 border-t-transparent rounded-full animate-spin" />
            )}
            {pwLoading ? "Saving…" : "Update Password"}
          </button>
        </form>
      </div>
    </div>
  );
}