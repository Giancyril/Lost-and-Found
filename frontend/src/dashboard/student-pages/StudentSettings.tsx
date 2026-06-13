import React, { useState } from "react";
import { FaKey, FaCheck, FaEye, FaEyeSlash, FaStar, FaBell } from "react-icons/fa";
import { Link } from "react-router-dom";
import { useUserVerification } from "../../auth/auth";
import { usePushNotifications } from "../../hooks/usePushNotifications";
import { notify } from "../../utils/notify";
import { useChangePasswordMutation } from "../../redux/api/api";

const UserIcon = ({ className = "w-6 h-6" }: { className?: string }) => (
  <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="white" className={`${className} opacity-90`}>
    <path d="M12 12c2.7 0 4.8-2.1 4.8-4.8S14.7 2.4 12 2.4 7.2 4.5 7.2 7.2 9.3 12 12 12zm0 2.4c-3.2 0-9.6 1.6-9.6 4.8v2.4h19.2v-2.4c0-3.2-6.4-4.8-9.6-4.8z"/>
  </svg>
);

export default function StudentSettings() {
  const user: any = useUserVerification();
  const { permission, subscribe, isSupported } = usePushNotifications();
  const [changePassword, { isLoading: pwLoading }] = useChangePasswordMutation();

  const [pwForm, setPwForm]       = useState({ currentPassword: "", newPassword: "", confirm: "" });
  const [showPw, setShowPw]       = useState<Record<string, boolean>>({});
  const [pwMsg, setPwMsg]         = useState<{ ok: boolean; text: string } | null>(null);

  const toggleShow = (key: string) =>
    setShowPw(p => ({ ...p, [key]: !p[key] }));

  const handleChangePassword = async (e: React.FormEvent) => {
    e.preventDefault();
    if (pwForm.newPassword !== pwForm.confirm) {
      setPwMsg({ ok: false, text: "New passwords do not match." });
      return;
    }
    setPwMsg(null);
    try {
      const res = await changePassword({
        currentPassword: pwForm.currentPassword,
        newPassword: pwForm.newPassword,
      }).unwrap();
      if (res.success) {
        const msg = "Password changed successfully.";
        setPwMsg({ ok: true, text: msg });
        notify.success(msg);
        setPwForm({ currentPassword: "", newPassword: "", confirm: "" });
      } else {
        const msg = res.message ?? "Failed to change password.";
        setPwMsg({ ok: false, text: msg });
        notify.error(msg);
      }
    } catch (err: any) {
      const msg = err?.data?.message ?? "Failed to change password.";
      setPwMsg({ ok: false, text: msg });
      notify.error(msg);
    }
  };

  const fields = [
    { label: "Current Password", key: "currentPassword" },
    { label: "New Password",     key: "newPassword" },
    { label: "Confirm Password", key: "confirm" },
  ];

  return (
    <div className="space-y-4 w-full max-w-2xl mx-auto px-1">

      {/* ── Push Notifications ── */}
      {isSupported && (
        <div className="bg-gray-900 border border-white/[0.06] rounded-2xl overflow-hidden">
          <div className="h-0.5 w-full bg-gradient-to-r from-blue-600 via-cyan-400 to-transparent" />
          <div className="p-4 space-y-3">
          <div className="flex items-center gap-2">
            <FaBell size={11} className="text-blue-400" />
            <p className="text-[9px] font-bold text-gray-600 uppercase tracking-widest">
              Push Notifications
            </p>
          </div>
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 py-2">
            <div className="min-w-0">
              <p className="text-sm font-medium text-white">Receive Alerts</p>
              <p className="text-xs text-gray-500 mt-0.5">
                {permission === "granted" 
                  ? "Notifications are enabled on this device." 
                  : "Enable real-time background alerts for item matches and messages."}
              </p>
            </div>
            <button
              onClick={() => {
                if (permission !== "granted") {
                  subscribe();
                } else {
                  alert("To disable notifications, please adjust your browser's site settings.");
                }
              }}
              className={`relative inline-flex h-5 w-9 items-center rounded-full transition-colors duration-200 focus:outline-none shrink-0 ${permission === "granted" ? "bg-blue-600" : "bg-gray-700"}`}>
              <span className={`inline-block h-3.5 w-3.5 transform rounded-full bg-white shadow transition-transform duration-200 ${permission === "granted" ? "translate-x-4" : "translate-x-0.5"}`} />
            </button>
          </div>
          </div>
        </div>
      )}

      {/* ── Profile Card ── */}
      <div className="bg-gray-900 border border-white/[0.06] rounded-2xl p-4 space-y-3">
          <p className="text-[9px] font-bold text-gray-600 uppercase tracking-widest">Profile</p>

          {/* Avatar row */}
          <div className="flex items-center gap-3">
            <div className="relative shrink-0">
              <div className="w-12 h-12 bg-gradient-to-br from-blue-600 to-cyan-500 rounded-full
                flex items-center justify-center border-2 border-gray-700">
                <UserIcon className="w-6 h-6" />
              </div>
              <span className="absolute -bottom-0.5 -right-0.5 w-2.5 h-2.5 bg-emerald-500
                border-2 border-gray-900 rounded-full" />
            </div>

            <div className="min-w-0 flex-1">
              <p className="text-white font-bold text-sm leading-tight truncate">
                {user?.name || user?.username || "Student"}
              </p>
              {user?.email && (
                <p className="text-gray-500 text-[11px] mt-0.5 truncate">{user.email}</p>
              )}
            </div>

            <Link
              to="/dashboard/student/leaderboard"
              className="flex items-center gap-1 px-2 py-1 bg-yellow-400/10
                text-yellow-300 border border-yellow-400/20 rounded-full text-[10px]
                font-bold hover:bg-yellow-400/15 transition-colors shrink-0"
            >
              <FaStar size={8} className="text-yellow-400" />
              <span>Points</span>
            </Link>
          </div>

          {/* Details grid — 2 cols, tighter */}
          <div className="grid grid-cols-2 gap-2">
            {[
              { label: "Full Name",  value: user?.name || user?.username || "—" },
              { label: "School ID", value: user?.schoolId || "—" },
              { label: "Role",      value: "Student" },
              { label: "Email",     value: user?.email || "—" },
            ].map(({ label, value }) => (
              <div key={label}
                className="bg-gray-800/50 border border-white/[0.05] rounded-xl px-3 py-2">
                <p className="text-[9px] uppercase tracking-widest text-gray-600 font-bold mb-0.5">
                  {label}
                </p>
                <p className="text-gray-300 text-[11px] font-mono truncate">{value}</p>
              </div>
            ))}
          </div>
      </div>



      {/* ── Change Password ── */}
      <div className="bg-gray-900 border border-white/[0.06] rounded-2xl p-4 space-y-3">
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

          {/* Button aligned to the right */}
          <div className="flex justify-end">
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
          </div>
        </form>
      </div>



    </div>
  );
}