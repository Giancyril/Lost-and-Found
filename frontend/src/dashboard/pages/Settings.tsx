import { useState } from "react";
import {
  FaSave, FaEye, FaEyeSlash, FaShieldAlt,
  FaDatabase, FaGlobe, FaUser, FaCheck,
  FaKey, FaAt, FaIdBadge,
} from "react-icons/fa";
import { toast } from "react-toastify";
import { useForm } from "react-hook-form";
import {
  useChangePasswordMutation,
  useChangeEmailMutation,
  useChangeUsernameMutation,
} from "../../redux/api/api";
import { removeUserLocalStorage, useUserVerification } from "../../auth/auth";
import { useNavigate } from "react-router-dom";

type Tab = "account" | "general" | "security" | "system";

const ToggleSwitch = ({ checked, onChange }: { checked: boolean; onChange: (v: boolean) => void }) => (
  <button type="button" onClick={() => onChange(!checked)}
    className={`relative inline-flex h-5 w-9 items-center rounded-full transition-colors duration-200 focus:outline-none shrink-0 ${checked ? "bg-blue-600" : "bg-gray-700"}`}>
    <span className={`inline-block h-3.5 w-3.5 transform rounded-full bg-white shadow transition-transform duration-200 ${checked ? "translate-x-4" : "translate-x-0.5"}`} />
  </button>
);

const InputField = ({ className = "", ...props }: React.InputHTMLAttributes<HTMLInputElement> & { className?: string }) => (
  <input {...props}
    className={`w-full px-4 py-2.5 bg-gray-800 border border-gray-700/50 rounded-xl text-white text-sm
      placeholder-gray-600 focus:outline-none focus:ring-2 focus:ring-blue-500/30 focus:border-blue-500/30
      transition-all ${className}`} />
);

const SelectField = ({ className = "", children, ...props }: React.SelectHTMLAttributes<HTMLSelectElement> & { className?: string }) => (
  <select {...props}
    className={`w-full px-4 py-2.5 bg-gray-800 border border-gray-700/50 rounded-xl text-white text-sm
      focus:outline-none focus:ring-2 focus:ring-blue-500/30 transition-all ${className}`}>
    {children}
  </select>
);

const SubmitButton = ({ loading, children }: { loading?: boolean; children: React.ReactNode }) => (
  <button type="submit" disabled={loading}
    className="inline-flex items-center gap-2 px-5 py-2.5 bg-blue-600 hover:bg-blue-500
      disabled:opacity-50 disabled:cursor-not-allowed text-white text-xs font-bold rounded-xl transition-all">
    {loading ? (
      <><svg className="animate-spin h-3.5 w-3.5" viewBox="0 0 24 24" fill="none">
        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
      </svg>Processing...</>
    ) : children}
  </button>
);

const FieldLabel = ({ children }: { children: React.ReactNode }) => (
  <label className="block text-[10px] font-bold text-gray-400 uppercase tracking-widest mb-1.5">{children}</label>
);

const SectionCard = ({ icon, iconColor = "text-blue-400", iconBg = "bg-blue-500/10", title, subtitle, children }: {
  icon: React.ReactNode; iconColor?: string; iconBg?: string;
  title: string; subtitle?: string; children: React.ReactNode;
}) => (
  <div className="bg-gray-900 border border-gray-700/50 rounded-2xl overflow-hidden">
    <div className="px-5 py-4 border-b border-gray-700/50 flex items-center gap-3">
      <div className={`w-7 h-7 rounded-lg ${iconBg} flex items-center justify-center ${iconColor}`}>{icon}</div>
      <div>
        <h3 className="text-sm font-bold text-white leading-tight">{title}</h3>
        {subtitle && <p className="text-gray-500 text-[10px] mt-0.5">{subtitle}</p>}
      </div>
    </div>
    <div className="p-5">{children}</div>
  </div>
);

const NotificationRow = ({ label, description, checked, onChange }: {
  label: string; description: string; checked: boolean; onChange: (v: boolean) => void;
}) => (
  <div className="flex items-center justify-between gap-4 py-3.5 border-b border-gray-700/30 last:border-0">
    <div className="min-w-0">
      <p className="text-sm font-medium text-white">{label}</p>
      <p className="text-xs text-gray-500 mt-0.5">{description}</p>
    </div>
    <ToggleSwitch checked={checked} onChange={onChange} />
  </div>
);

const Settings = () => {
  const navigate = useNavigate();
  const user = useUserVerification();
  const [activeTab, setActiveTab] = useState<Tab>("account");
  const [showPassword, setShowPassword] = useState(false);
  const [showNewPassword, setShowNewPassword] = useState(false);
  const [savedIndicator, setSavedIndicator] = useState(false);

  const [changePassword, { isLoading: isPasswordLoading }] = useChangePasswordMutation();
  const [changeEmail,    { isLoading: isEmailLoading }]    = useChangeEmailMutation();
  const [changeUsername, { isLoading: isUsernameLoading }] = useChangeUsernameMutation();

  const passwordForm = useForm();
  const emailForm    = useForm();
  const usernameForm = useForm();

  const [settings, setSettings] = useState({
    siteName: "Lost & Found System",
    siteDescription: "A comprehensive lost and found management system",
    contactEmail: "contact@lostandfound.com",
    supportEmail: "support@lostandfound.com",
    siteUrl: "https://lostandfound.com",
    timezone: "UTC", language: "en",
    enableTwoFactor: false, passwordExpiry: 90, sessionTimeout: 30,
    maxLoginAttempts: 5, requirePasswordChange: true,
    itemExpiryDays: 30, maxImageSize: 5,
    autoDeleteExpiredItems: true, requireItemApproval: false,
  });
  const set = (key: string, value: any) => setSettings(p => ({ ...p, [key]: value }));

  const handleSave = () => {
    setSavedIndicator(true);
    toast.success("Settings saved");
    setTimeout(() => setSavedIndicator(false), 2000);
  };

  const handleChangePassword = async (data: any) => {
    try {
      const res: any = await changePassword(data);
      if (res?.error?.data?.message) { toast.error(res.error.data.message); return; }
      if (res?.data?.statusCode === 200) { toast.success("Password changed!"); passwordForm.reset(); }
    } catch { toast.error("Failed"); }
  };
  const handleChangeEmail = async (data: any) => {
    try {
      const res: any = await changeEmail(data);
      if (res?.error?.data?.message) { toast.error(res.error.data.message); return; }
      if (res?.data?.statusCode === 200) { toast.success("Email changed! Logging out..."); emailForm.reset(); removeUserLocalStorage(); navigate("/login"); }
    } catch { toast.error("Failed"); }
  };
  const handleChangeUsername = async (data: any) => {
    try {
      const res: any = await changeUsername(data);
      if (res?.error?.data?.message) { toast.error(res.error.data.message); return; }
      if (res?.data?.statusCode === 200) { toast.success("Username changed! Logging out..."); usernameForm.reset(); removeUserLocalStorage(); navigate("/login"); }
    } catch { toast.error("Failed"); }
  };

  const tabs: { id: Tab; label: string; icon: React.ReactNode; accent: string }[] = [
    { id: "account",  label: "Account",  icon: <FaUser size={12} />,      accent: "text-blue-400 bg-blue-500/10 border-blue-500/20"         },
    { id: "general",  label: "General",  icon: <FaGlobe size={12} />,     accent: "text-cyan-400 bg-cyan-500/10 border-cyan-500/20"          },
    { id: "security", label: "Security", icon: <FaShieldAlt size={12} />, accent: "text-emerald-400 bg-emerald-500/10 border-emerald-500/20" },
    { id: "system",   label: "System",   icon: <FaDatabase size={12} />,  accent: "text-purple-400 bg-purple-500/10 border-purple-500/20"    },
  ];

  const initials = ((user as any)?.username?.[0] || "A").toUpperCase();

  return (
    <div className="space-y-5 px-2 sm:px-0">

      {/* Header */}
      <div className="flex items-center justify-between gap-4">
        <div>
          <h1 className="text-white text-xl font-bold tracking-tight">Settings</h1>
          <p className="text-gray-500 text-xs mt-0.5">Manage your account and system preferences</p>
        </div>
        <button onClick={handleSave}
          className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold transition-all shrink-0 ${
            savedIndicator ? "bg-emerald-600 hover:bg-emerald-500 text-white" : "bg-blue-600 hover:bg-blue-500 text-white"
          }`}>
          {savedIndicator ? <><FaCheck size={10} /> Saved!</> : <><FaSave size={10} /> Save Changes</>}
        </button>
      </div>

      {/* Tab bar — scrollable on mobile */}
      <div className="overflow-x-auto scrollbar-hide">
        <div className="flex gap-1 p-1 bg-gray-900 border border-gray-700/50 rounded-xl w-full sm:w-fit">
          {tabs.map(tab => (
            <button key={tab.id} onClick={() => setActiveTab(tab.id)}
              className={`flex items-center justify-center gap-1.5 px-3 py-2 sm:px-4 rounded-lg text-xs font-semibold transition-all flex-1 sm:flex-none whitespace-nowrap ${
                activeTab === tab.id ? `${tab.accent} border` : "text-gray-400 hover:text-white hover:bg-white/5 border border-transparent"
              }`}>
              {tab.icon}
              <span className="hidden sm:inline">{tab.label}</span>
            </button>
          ))}
        </div>
      </div>

      <div className="flex flex-col gap-5">
        <main className="w-full space-y-4">

          {/* ACCOUNT */}
          {activeTab === "account" && (
            <>
              {/* Profile card */}
              <div className="bg-gray-900 border border-gray-700/50 rounded-2xl p-4 sm:p-5">
                <div className="flex items-center gap-4 mb-4">
                  <div className="w-12 h-12 sm:w-14 sm:h-14 rounded-2xl bg-gradient-to-br from-blue-500 to-cyan-400 flex items-center justify-center text-white text-xl font-black shrink-0">
                    {initials}
                  </div>
                  <div className="min-w-0">
                    <p className="text-white font-bold truncate">{(user as any)?.username || "Admin"}</p>
                    <div className="flex items-center gap-2 mt-0.5">
                      <p className="text-gray-400 text-sm truncate">{(user as any)?.email || "—"}</p>
                      <span className="shrink-0 px-2 py-0.5 bg-blue-500/10 text-blue-400 border border-blue-500/20 rounded-full text-[10px] font-bold uppercase">
                        {(user as any)?.role || "Admin"}
                      </span>
                    </div>
                  </div>
                </div>

                {/* 3 info cards — stacked on mobile, side by side on sm+ */}
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
                  {[
                    { label: "Username", value: (user as any)?.username || "—" },
                    { label: "Email",    value: (user as any)?.email    || "—" },
                    { label: "Role",     value: (user as any)?.role     || "—" },
                  ].map(item => (
                    <div key={item.label} className="bg-gray-800/60 border border-gray-700/50 rounded-xl p-2.5">
                      <p className="text-[10px] text-gray-500 uppercase tracking-widest font-bold">{item.label}</p>
                      <p className="text-white text-xs font-semibold mt-0.5 break-all">{item.value}</p>
                    </div>
                  ))}
                </div>
              </div>

              <SectionCard icon={<FaKey size={11} />} title="Change Password" subtitle="Update your account password">
                <form onSubmit={passwordForm.handleSubmit(handleChangePassword)} className="space-y-4">
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div>
                      <FieldLabel>Current Password</FieldLabel>
                      <div className="relative">
                        <InputField
                          type={showPassword ? "text" : "password"}
                          placeholder="Enter current password"
                          {...passwordForm.register("currentPassword", { required: "Required" })}
                          className="pr-10"
                        />
                        <button type="button" onClick={() => setShowPassword(!showPassword)}
                          className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-500 hover:text-gray-300 transition-colors">
                          {showPassword ? <FaEyeSlash size={12} /> : <FaEye size={12} />}
                        </button>
                      </div>
                      {passwordForm.formState.errors.currentPassword && (
                        <p className="text-red-400 text-xs mt-1">{passwordForm.formState.errors.currentPassword?.message as string}</p>
                      )}
                    </div>
                    <div>
                      <FieldLabel>New Password</FieldLabel>
                      <div className="relative">
                        <InputField
                          type={showNewPassword ? "text" : "password"}
                          placeholder="Enter new password"
                          {...passwordForm.register("newPassword", { required: "Required", minLength: { value: 6, message: "Password must be 6 or more characters" } })}
                          className="pr-10"
                        />
                        <button type="button" onClick={() => setShowNewPassword(!showNewPassword)}
                          className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-500 hover:text-gray-300 transition-colors">
                          {showNewPassword ? <FaEyeSlash size={12} /> : <FaEye size={12} />}
                        </button>
                      </div>
                      {passwordForm.formState.errors.newPassword && (
                        <p className="text-red-400 text-xs mt-1">{passwordForm.formState.errors.newPassword?.message as string}</p>
                      )}
                    </div>
                  </div>
                  <SubmitButton loading={isPasswordLoading}><FaKey size={10} /> Update Password</SubmitButton>
                </form>
              </SectionCard>

              <SectionCard icon={<FaAt size={11} />} iconColor="text-cyan-400" iconBg="bg-cyan-500/10" title="Change Email" subtitle="You'll be signed out after updating">
                <form onSubmit={emailForm.handleSubmit(handleChangeEmail)} className="space-y-4">
                  <div className="w-full sm:max-w-sm">
                    <FieldLabel>New Email Address</FieldLabel>
                    <InputField type="email" placeholder=" "
                      {...emailForm.register("email", { required: "Required", pattern: { value: /^\S+@\S+$/i, message: "Invalid email" } })} />
                    {emailForm.formState.errors.email && (
                      <p className="text-red-400 text-xs mt-1">{emailForm.formState.errors.email?.message as string}</p>
                    )}
                  </div>
                  <SubmitButton loading={isEmailLoading}><FaAt size={10} /> Update Email</SubmitButton>
                </form>
              </SectionCard>

              <SectionCard icon={<FaIdBadge size={11} />} iconColor="text-purple-400" iconBg="bg-purple-500/10" title="Change Username" subtitle="You'll be signed out after updating">
                <form onSubmit={usernameForm.handleSubmit(handleChangeUsername)} className="space-y-4">
                  <div className="w-full sm:max-w-sm">
                    <FieldLabel>New Username</FieldLabel>
                    <InputField type="text" placeholder=" "
                      {...usernameForm.register("username", { required: "Required", minLength: { value: 3, message: "Min. 3 characters" }, pattern: { value: /^[a-zA-Z0-9_]+$/, message: "Letters, numbers, underscores only" } })} />
                    {usernameForm.formState.errors.username && (
                      <p className="text-red-400 text-xs mt-1">{usernameForm.formState.errors.username?.message as string}</p>
                    )}
                  </div>
                  <SubmitButton loading={isUsernameLoading}><FaIdBadge size={10} /> Update Username</SubmitButton>
                </form>
              </SectionCard>
            </>
          )}

          {/* GENERAL */}
          {activeTab === "general" && (
            <SectionCard icon={<FaGlobe size={11} />} iconColor="text-cyan-400" iconBg="bg-cyan-500/10" title="General Settings" subtitle="Configure site-wide settings">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {[
                  { label: "Site Name",      key: "siteName",      type: "text"  },
                  { label: "Contact Email",  key: "contactEmail",  type: "email" },
                  { label: "Support Email",  key: "supportEmail",  type: "email" },
                  { label: "Site URL",       key: "siteUrl",       type: "url"   },
                ].map(({ label, key, type }) => (
                  <div key={key}>
                    <FieldLabel>{label}</FieldLabel>
                    <InputField type={type} value={(settings as any)[key]} onChange={e => set(key, e.target.value)} />
                  </div>
                ))}
                <div>
                  <FieldLabel>Timezone</FieldLabel>
                  <SelectField value={settings.timezone} onChange={e => set("timezone", e.target.value)}>
                    <option value="UTC">UTC</option>
                    <option value="America/New_York">Eastern Time</option>
                    <option value="America/Los_Angeles">Pacific Time</option>
                    <option value="Asia/Manila">Manila Time</option>
                  </SelectField>
                </div>
                <div>
                  <FieldLabel>Language</FieldLabel>
                  <SelectField value={settings.language} onChange={e => set("language", e.target.value)}>
                    <option value="en">English</option>
                    <option value="es">Spanish</option>
                    <option value="fr">French</option>
                  </SelectField>
                </div>
                <div className="sm:col-span-2">
                  <FieldLabel>Site Description</FieldLabel>
                  <textarea value={settings.siteDescription} onChange={e => set("siteDescription", e.target.value)} rows={3}
                    className="w-full px-4 py-2.5 bg-gray-800 border border-gray-700/50 rounded-xl text-white text-sm placeholder-gray-600 focus:outline-none focus:ring-2 focus:ring-blue-500/30 transition-all resize-none" />
                </div>
              </div>
            </SectionCard>
          )}

          {/* SECURITY */}
          {activeTab === "security" && (
            <SectionCard icon={<FaShieldAlt size={11} />} iconColor="text-emerald-400" iconBg="bg-emerald-500/10" title="Security Settings" subtitle="Configure authentication and access policies">
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-5">
                {[
                  { label: "Password Expiry (days)", key: "passwordExpiry"    },
                  { label: "Session Timeout (min)",  key: "sessionTimeout"    },
                  { label: "Max Login Attempts",     key: "maxLoginAttempts"  },
                ].map(({ label, key }) => (
                  <div key={key}>
                    <FieldLabel>{label}</FieldLabel>
                    <InputField type="number" value={(settings as any)[key]} onChange={e => set(key, +e.target.value)} />
                  </div>
                ))}
              </div>
              <div className="border-t border-gray-700/50 pt-4">
                <NotificationRow label="Two-Factor Authentication" description="Require 2FA for all admin accounts" checked={settings.enableTwoFactor} onChange={v => set("enableTwoFactor", v)} />
                <NotificationRow label="Force Password Change" description="Require users to change default passwords" checked={settings.requirePasswordChange} onChange={v => set("requirePasswordChange", v)} />
              </div>
            </SectionCard>
          )}

          {/* SYSTEM */}
          {activeTab === "system" && (
            <SectionCard icon={<FaDatabase size={11} />} iconColor="text-purple-400" iconBg="bg-purple-500/10" title="System Settings" subtitle="Configure item lifecycle and storage limits">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-5">
                <div>
                  <FieldLabel>Item Expiry (days)</FieldLabel>
                  <InputField type="number" value={settings.itemExpiryDays} onChange={e => set("itemExpiryDays", +e.target.value)} />
                </div>
                <div>
                  <FieldLabel>Max Image Size (MB)</FieldLabel>
                  <InputField type="number" value={settings.maxImageSize} onChange={e => set("maxImageSize", +e.target.value)} />
                </div>
              </div>
              <div className="border-t border-gray-700/50 pt-4">
                <NotificationRow label="Auto-delete Expired Items" description="Automatically remove items past their expiry date" checked={settings.autoDeleteExpiredItems} onChange={v => set("autoDeleteExpiredItems", v)} />
                <NotificationRow label="Require Item Approval" description="Items must be reviewed by admin before going public" checked={settings.requireItemApproval} onChange={v => set("requireItemApproval", v)} />
              </div>
            </SectionCard>
          )}

        </main>
      </div>
    </div>
  );
};

export default Settings;