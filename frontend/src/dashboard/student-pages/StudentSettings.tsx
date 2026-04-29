import React, { useState } from "react";
import { FaKey, FaAt, FaCheck, FaEye, FaEyeSlash } from "react-icons/fa";
import { useUserVerification } from "../../auth/auth";

const API = "/api";
const authHeaders = () => ({
  Authorization: `Bearer ${localStorage.getItem("accessToken") ?? ""}`,
  "Content-Type": "application/json",
});

export default function StudentSettings() {
  const user: any = useUserVerification();

  const [pwForm, setPwForm]     = useState({ currentPassword: "", newPassword: "", confirm: "" });
  const [showPw, setShowPw]     = useState(false);
  const [pwMsg, setPwMsg]       = useState<{ ok: boolean; text: string } | null>(null);
  const [pwLoading, setPwLoading] = useState(false);

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

  const initial =
    user?.name?.charAt(0)?.toUpperCase() ||
    user?.username?.charAt(0)?.toUpperCase() || "S";

  return (
    <div className="space-y-6 max-w-lg">
      <div>
        <h1 className="text-white font-black text-xl">Settings</h1>
        <p className="text-gray-500 text-sm mt-0.5">Manage your account</p>
      </div>

      {/* Profile info (read-only) */}
      <div className="bg-gray-900 border border-white/[0.06] rounded-2xl p-5 space-y-4">
        <p className="text-xs font-bold text-gray-500 uppercase tracking-widest">Profile</p>
        <div className="flex items-center gap-4">
          <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-blue-600 to-cyan-500 flex items-center justify-center shrink-0">
            <span className="text-white font-black text-lg">{initial}</span>
          </div>
          <div>
            <p className="text-white font-bold">{user?.name || user?.username || "Student"}</p>
            <p className="text-gray-500 text-sm font-mono">{user?.schoolId}</p>
            <p className="text-gray-600 text-xs">{user?.email}</p>
          </div>
        </div>
      </div>

      {/* Change password */}
      <div className="bg-gray-900 border border-white/[0.06] rounded-2xl p-5 space-y-4">
        <div className="flex items-center gap-2">
          <FaKey size={12} className="text-blue-400" />
          <p className="text-xs font-bold text-gray-500 uppercase tracking-widest">Change Password</p>
        </div>

        <form onSubmit={handleChangePassword} className="space-y-3">
          {[
            { label: "Current Password",  key: "currentPassword" },
            { label: "New Password",      key: "newPassword" },
            { label: "Confirm Password",  key: "confirm" },
          ].map(({ label, key }) => (
            <div key={key}>
              <label className="text-gray-500 text-xs font-medium block mb-1">{label}</label>
              <div className="relative">
                <input
                  type={showPw ? "text" : "password"}
                  value={(pwForm as any)[key]}
                  onChange={e => setPwForm(f => ({ ...f, [key]: e.target.value }))}
                  className="w-full bg-gray-800 border border-white/[0.08] rounded-xl px-3 py-2.5
                    text-white text-sm placeholder-gray-600 focus:outline-none
                    focus:border-blue-500/40 transition-colors pr-9"
                  placeholder="••••••••"
                />
                {key === "currentPassword" && (
                  <button type="button" onClick={() => setShowPw(p => !p)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-500 hover:text-gray-300">
                    {showPw ? <FaEyeSlash size={12} /> : <FaEye size={12} />}
                  </button>
                )}
              </div>
            </div>
          ))}

          {pwMsg && (
            <p className={`text-xs px-3 py-2 rounded-lg ${
              pwMsg.ok ? "bg-emerald-500/10 text-emerald-300" : "bg-red-500/10 text-red-300"
            }`}>
              {pwMsg.text}
            </p>
          )}

          <button type="submit" disabled={pwLoading}
            className="flex items-center gap-2 px-4 py-2.5 rounded-xl text-xs font-bold
              bg-blue-500/10 text-blue-300 border border-blue-500/25
              hover:bg-blue-500/20 disabled:opacity-40 transition-colors">
            {pwLoading
              ? <div className="w-3.5 h-3.5 border border-blue-400 border-t-transparent rounded-full animate-spin" />
              : <FaCheck size={10} />}
            {pwLoading ? "Saving…" : "Update Password"}
          </button>
        </form>
      </div>
    </div>
  );
}