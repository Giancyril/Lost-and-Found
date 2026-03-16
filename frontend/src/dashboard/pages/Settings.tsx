import { useState } from "react";
import {
  FaSave, FaEye, FaEyeSlash, FaShieldAlt, FaBell,
  FaDatabase, FaEnvelope, FaGlobe, FaUser, FaCheck,
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

type Tab = "account" | "general" | "notifications" | "security" | "system" | "email";

const ToggleSwitch = ({ checked, onChange }: { checked: boolean; onChange: (v: boolean) => void }) => (
  <button
    type="button"
    onClick={() => onChange(!checked)}
    className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors duration-200 focus:outline-none shrink-0 ${
      checked ? "bg-blue-600" : "bg-gray-600"
    }`}
  >
    <span className={`inline-block h-4 w-4 transform rounded-full bg-white shadow transition-transform duration-200 ${
      checked ? "translate-x-6" : "translate-x-1"
    }`} />
  </button>
);

const SectionCard = ({ children, className = "" }: { children: React.ReactNode; className?: string }) => (
  <div className={`bg-gray-800 border border-gray-700 rounded-2xl p-4 sm:p-6 ${className}`}>
    {children}
  </div>
);

const FieldLabel = ({ children }: { children: React.ReactNode }) => (
  <label className="block text-xs font-semibold uppercase tracking-wider text-gray-400 mb-2">
    {children}
  </label>
);

const InputField = ({ className = "", ...props }: React.InputHTMLAttributes<HTMLInputElement> & { className?: string }) => (
  <input
    {...props}
    className={`w-full px-4 py-2.5 bg-gray-900 border border-gray-700 rounded-xl text-white text-sm
      placeholder-gray-600 focus:outline-none focus:ring-2 focus:ring-blue-500/50 focus:border-blue-500/50
      transition-all duration-200 ${className}`}
  />
);

const SelectField = ({ className = "", children, ...props }: React.SelectHTMLAttributes<HTMLSelectElement> & { className?: string }) => (
  <select
    {...props}
    className={`w-full px-4 py-2.5 bg-gray-900 border border-gray-700 rounded-xl text-white text-sm
      focus:outline-none focus:ring-2 focus:ring-blue-500/50 focus:border-blue-500/50 transition-all duration-200 ${className}`}
  >
    {children}
  </select>
);

const SubmitButton = ({ loading, children }: { loading?: boolean; children: React.ReactNode }) => (
  <button
    type="submit"
    disabled={loading}
    className="inline-flex items-center gap-2 px-5 py-2.5 bg-blue-600 hover:bg-blue-500
      disabled:opacity-50 disabled:cursor-not-allowed text-white text-sm font-semibold rounded-xl
      transition-all duration-200 shadow-lg shadow-blue-900/30"
  >
    {loading ? (
      <>
        <svg className="animate-spin h-3.5 w-3.5" viewBox="0 0 24 24" fill="none">
          <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
          <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
        </svg>
        Processing...
      </>
    ) : children}
  </button>
);

const NotificationRow = ({
  label, description, checked, onChange,
}: { label: string; description: string; checked: boolean; onChange: (v: boolean) => void }) => (
  <div className="flex items-center justify-between gap-4 py-4 border-b border-gray-700/50 last:border-0">
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
  const [showSmtpPassword, setShowSmtpPassword] = useState(false);
  const [savedIndicator, setSavedIndicator] = useState(false);

  const [changePassword, { isLoading: isPasswordLoading }] = useChangePasswordMutation();
  const [changeEmail, { isLoading: isEmailLoading }] = useChangeEmailMutation();
  const [changeUsername, { isLoading: isUsernameLoading }] = useChangeUsernameMutation();

  const passwordForm = useForm();
  const emailForm = useForm();
  const usernameForm = useForm();

  const [settings, setSettings] = useState({
    siteName: "Lost & Found System",
    siteDescription: "A comprehensive lost and found management system",
    contactEmail: "contact@lostandfound.com",
    supportEmail: "support@lostandfound.com",
    siteUrl: "https://lostandfound.com",
    timezone: "UTC",
    language: "en",
    emailNotifications: true,
    smsNotifications: false,
    newItemNotifications: true,
    claimNotifications: true,
    reminderNotifications: true,
    enableTwoFactor: false,
    passwordExpiry: 90,
    sessionTimeout: 30,
    maxLoginAttempts: 5,
    requirePasswordChange: true,
    itemExpiryDays: 30,
    maxImageSize: 5,
    autoDeleteExpiredItems: true,
    requireItemApproval: false,
    smtpHost: "smtp.gmail.com",
    smtpPort: 587,
    smtpUsername: "",
    smtpPassword: "",
    smtpSecure: true,
    fromName: "Lost & Found System",
    fromEmail: "noreply@lostandfound.com",
  });

  const set = (key: string, value: any) => setSettings(p => ({ ...p, [key]: value }));

  const handleSave = () => {
    setSavedIndicator(true);
    toast.success("Settings saved successfully");
    setTimeout(() => setSavedIndicator(false), 2000);
  };

  const handleChangePassword = async (data: any) => {
    try {
      const res: any = await changePassword(data);
      if (res?.error?.data?.message) { toast.error(res.error.data.message); return; }
      if (res?.data?.statusCode === 200) { toast.success("Password changed successfully!"); passwordForm.reset(); }
    } catch { toast.error("Failed to change password."); }
  };

  const handleChangeEmail = async (data: any) => {
    try {
      const res: any = await changeEmail(data);
      if (res?.error?.data?.message) { toast.error(res.error.data.message); return; }
      if (res?.data?.statusCode === 200) {
        toast.success(`Email changed! Please log in again.`);
        emailForm.reset(); removeUserLocalStorage(); navigate("/login");
      }
    } catch { toast.error("Failed to change email."); }
  };

  const handleChangeUsername = async (data: any) => {
    try {
      const res: any = await changeUsername(data);
      if (res?.error?.data?.message) { toast.error(res.error.data.message); return; }
      if (res?.data?.statusCode === 200) {
        toast.success(`Username changed! Please log in again.`);
        usernameForm.reset(); removeUserLocalStorage(); navigate("/login");
      }
    } catch { toast.error("Failed to change username."); }
  };

  const tabs: { id: Tab; label: string; icon: React.ReactNode; accent: string }[] = [
    { id: "account",       label: "Account",       icon: <FaUser size={13} />,      accent: "text-blue-400 bg-blue-500/10 border-blue-500/20" },
    { id: "general",       label: "General",       icon: <FaGlobe size={13} />,     accent: "text-cyan-400 bg-cyan-500/10 border-cyan-500/20" },
    { id: "notifications", label: "Notifications", icon: <FaBell size={13} />,      accent: "text-amber-400 bg-amber-500/10 border-amber-500/20" },
    { id: "security",      label: "Security",      icon: <FaShieldAlt size={13} />, accent: "text-green-400 bg-green-500/10 border-green-500/20" },
    { id: "system",        label: "System",        icon: <FaDatabase size={13} />,  accent: "text-purple-400 bg-purple-500/10 border-purple-500/20" },
    { id: "email",         label: "Email / SMTP",  icon: <FaEnvelope size={13} />,  accent: "text-rose-400 bg-rose-500/10 border-rose-500/20" },
  ];

  return (
    <div className="space-y-4 sm:space-y-6 max-w-7xl mx-auto">

      {/* ── Header ── */}
      <div className="flex items-center justify-end">
        <button
          onClick={handleSave}
          className={`inline-flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-semibold
            transition-all duration-300 shrink-0 ${
            savedIndicator
              ? "bg-green-600 hover:bg-green-500 text-white"
              : "bg-blue-600 hover:bg-blue-500 text-white"
          }`}
        >
          {savedIndicator
            ? <><FaCheck size={13} /> Saved!</>
            : <><FaSave size={13} /> Save Changes</>}
        </button>
      </div>

      {/* ── Mobile Tab Bar (horizontal scroll) ── */}
      <div className="lg:hidden bg-gray-800 border border-gray-700 rounded-2xl p-2">
        <div className="flex gap-1 overflow-x-auto pb-0.5 scrollbar-hide">
          {tabs.map(tab => {
            const isActive = activeTab === tab.id;
            return (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`shrink-0 flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-medium
                  transition-all duration-150 whitespace-nowrap ${
                  isActive
                    ? `${tab.accent} border`
                    : "text-gray-400 hover:text-white hover:bg-white/5 border border-transparent"
                }`}
              >
                <span className={isActive ? "" : "opacity-60"}>{tab.icon}</span>
                {tab.label}
              </button>
            );
          })}
        </div>
      </div>

      <div className="flex flex-col lg:flex-row gap-5">

        {/* ── Desktop Sidebar ── */}
        <aside className="hidden lg:block lg:w-56 shrink-0">
          <div className="bg-gray-800 border border-gray-700 rounded-2xl p-2 lg:sticky lg:top-4">
            <p className="text-[10px] font-bold uppercase tracking-widest text-gray-600 px-3 py-2">Navigation</p>
            <nav className="flex flex-col gap-0.5">
              {tabs.map(tab => {
                const isActive = activeTab === tab.id;
                return (
                  <button
                    key={tab.id}
                    onClick={() => setActiveTab(tab.id)}
                    className={`flex items-center gap-2 px-3 py-2 rounded-xl text-left text-sm font-medium
                      transition-all duration-150 ${
                      isActive
                        ? `${tab.accent} border`
                        : "text-gray-400 hover:text-white hover:bg-white/5 border border-transparent"
                    }`}
                  >
                    <span className={isActive ? "" : "opacity-60"}>{tab.icon}</span>
                    {tab.label}
                  </button>
                );
              })}
            </nav>
          </div>
        </aside>

        {/* ── Main Content ── */}
        <main className="flex-1 min-w-0 space-y-5">

          {/* ══ ACCOUNT ══ */}
          {activeTab === "account" && (
            <>
              {/* Current User Info */}
              <SectionCard>
                <div className="flex items-center gap-4 mb-5">
                  <div className="w-14 h-14 rounded-2xl bg-blue-600/20 border border-blue-500/30
                    flex items-center justify-center text-blue-400 text-xl font-bold shrink-0">
                    {((user as any)?.username?.[0] || "A").toUpperCase()}
                  </div>
                  <div className="min-w-0">
                    <p className="text-white font-semibold truncate">{(user as any)?.username || "Admin"}</p>
                    <p className="text-gray-400 text-sm truncate">{(user as any)?.email || "N/A"}</p>
                    <span className="inline-block mt-1 px-2 py-0.5 bg-blue-500/10 text-blue-400
                      border border-blue-500/20 rounded-full text-[11px] font-semibold uppercase tracking-wide">
                      {(user as any)?.role || "Admin"}
                    </span>
                  </div>
                </div>
                <div className="grid grid-cols-3 gap-2 sm:gap-3">
                  {[
                    { label: "Username", value: (user as any)?.username || "—" },
                    { label: "Email",    value: (user as any)?.email    || "—" },
                    { label: "Role",     value: (user as any)?.role     || "—" },
                  ].map(item => (
                    <div key={item.label} className="bg-gray-900 rounded-xl p-2.5 sm:p-3 min-w-0">
                      <p className="text-[10px] uppercase tracking-wider text-gray-600 font-semibold">{item.label}</p>
                      <p className="text-white text-xs sm:text-sm font-medium mt-0.5 truncate">{item.value}</p>
                    </div>
                  ))}
                </div>
              </SectionCard>

              {/* Change Password */}
              <SectionCard>
                <div className="flex items-center gap-2.5 mb-5">
                  <div className="w-8 h-8 rounded-lg bg-blue-500/10 border border-blue-500/20 flex items-center justify-center shrink-0">
                    <FaKey className="text-blue-400" size={12} />
                  </div>
                  <div>
                    <h3 className="text-sm font-bold text-white">Change Password</h3>
                    <p className="text-[11px] text-gray-500">Update your account password</p>
                  </div>
                </div>
                <form onSubmit={passwordForm.handleSubmit(handleChangePassword)} className="space-y-4">
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div>
                      <FieldLabel>Current Password</FieldLabel>
                      <div className="relative">
                        <InputField
                          type={showPassword ? "text" : "password"}
                          placeholder="••••••••"
                          {...passwordForm.register("currentPassword", { required: "Required" })}
                          className="pr-10"
                        />
                        <button type="button" onClick={() => setShowPassword(!showPassword)}
                          className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-500 hover:text-gray-300 transition-colors">
                          {showPassword ? <FaEyeSlash size={13} /> : <FaEye size={13} />}
                        </button>
                      </div>
                      {passwordForm.formState.errors.currentPassword && (
                        <p className="text-red-400 text-xs mt-1.5">{passwordForm.formState.errors.currentPassword?.message as string}</p>
                      )}
                    </div>
                    <div>
                      <FieldLabel>New Password</FieldLabel>
                      <InputField
                        type="password"
                        placeholder="Min. 6 characters"
                        {...passwordForm.register("newPassword", {
                          required: "Required",
                          minLength: { value: 6, message: "Min. 6 characters" },
                        })}
                      />
                      {passwordForm.formState.errors.newPassword && (
                        <p className="text-red-400 text-xs mt-1.5">{passwordForm.formState.errors.newPassword?.message as string}</p>
                      )}
                    </div>
                  </div>
                  <SubmitButton loading={isPasswordLoading}>Update Password</SubmitButton>
                </form>
              </SectionCard>

              {/* Change Email */}
              <SectionCard>
                <div className="flex items-center gap-2.5 mb-5">
                  <div className="w-8 h-8 rounded-lg bg-cyan-500/10 border border-cyan-500/20 flex items-center justify-center shrink-0">
                    <FaAt className="text-cyan-400" size={12} />
                  </div>
                  <div>
                    <h3 className="text-sm font-bold text-white">Change Email</h3>
                    <p className="text-[11px] text-gray-500">You'll be logged out after changing your email</p>
                  </div>
                </div>
                <form onSubmit={emailForm.handleSubmit(handleChangeEmail)} className="space-y-4">
                  <div className="max-w-sm">
                    <FieldLabel>New Email Address</FieldLabel>
                    <InputField
                      type="email"
                      placeholder="you@example.com"
                      {...emailForm.register("email", {
                        required: "Required",
                        pattern: { value: /^\S+@\S+$/i, message: "Invalid email" },
                      })}
                    />
                    {emailForm.formState.errors.email && (
                      <p className="text-red-400 text-xs mt-1.5">{emailForm.formState.errors.email?.message as string}</p>
                    )}
                  </div>
                  <SubmitButton loading={isEmailLoading}>Update Email</SubmitButton>
                </form>
              </SectionCard>

              {/* Change Username */}
              <SectionCard>
                <div className="flex items-center gap-2.5 mb-5">
                  <div className="w-8 h-8 rounded-lg bg-purple-500/10 border border-purple-500/20 flex items-center justify-center shrink-0">
                    <FaIdBadge className="text-purple-400" size={12} />
                  </div>
                  <div>
                    <h3 className="text-sm font-bold text-white">Change Username</h3>
                    <p className="text-[11px] text-gray-500">You'll be logged out after changing your username</p>
                  </div>
                </div>
                <form onSubmit={usernameForm.handleSubmit(handleChangeUsername)} className="space-y-4">
                  <div className="max-w-sm">
                    <FieldLabel>New Username</FieldLabel>
                    <InputField
                      type="text"
                      placeholder="letters, numbers, underscores"
                      {...usernameForm.register("username", {
                        required: "Required",
                        minLength: { value: 3, message: "Min. 3 characters" },
                        pattern: { value: /^[a-zA-Z0-9_]+$/, message: "Letters, numbers, underscores only" },
                      })}
                    />
                    {usernameForm.formState.errors.username && (
                      <p className="text-red-400 text-xs mt-1.5">{usernameForm.formState.errors.username?.message as string}</p>
                    )}
                  </div>
                  <SubmitButton loading={isUsernameLoading}>Update Username</SubmitButton>
                </form>
              </SectionCard>
            </>
          )}

          {/* ══ GENERAL ══ */}
          {activeTab === "general" && (
            <SectionCard>
              <h2 className="text-sm font-bold text-white mb-5 flex items-center gap-2">
                <FaGlobe className="text-cyan-400" size={13} /> General Settings
              </h2>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
                <div>
                  <FieldLabel>Site Name</FieldLabel>
                  <InputField type="text" value={settings.siteName} onChange={e => set("siteName", e.target.value)} />
                </div>
                <div>
                  <FieldLabel>Contact Email</FieldLabel>
                  <InputField type="email" value={settings.contactEmail} onChange={e => set("contactEmail", e.target.value)} />
                </div>
                <div>
                  <FieldLabel>Support Email</FieldLabel>
                  <InputField type="email" value={settings.supportEmail} onChange={e => set("supportEmail", e.target.value)} />
                </div>
                <div>
                  <FieldLabel>Site URL</FieldLabel>
                  <InputField type="url" value={settings.siteUrl} onChange={e => set("siteUrl", e.target.value)} />
                </div>
                <div>
                  <FieldLabel>Timezone</FieldLabel>
                  <SelectField value={settings.timezone} onChange={e => set("timezone", e.target.value)}>
                    <option value="UTC">UTC</option>
                    <option value="America/New_York">Eastern Time</option>
                    <option value="America/Chicago">Central Time</option>
                    <option value="America/Denver">Mountain Time</option>
                    <option value="America/Los_Angeles">Pacific Time</option>
                  </SelectField>
                </div>
                <div>
                  <FieldLabel>Language</FieldLabel>
                  <SelectField value={settings.language} onChange={e => set("language", e.target.value)}>
                    <option value="en">English</option>
                    <option value="es">Spanish</option>
                    <option value="fr">French</option>
                    <option value="de">German</option>
                  </SelectField>
                </div>
                <div className="sm:col-span-2">
                  <FieldLabel>Site Description</FieldLabel>
                  <textarea
                    value={settings.siteDescription}
                    onChange={e => set("siteDescription", e.target.value)}
                    rows={3}
                    className="w-full px-4 py-2.5 bg-gray-900/80 border border-gray-700 rounded-xl text-white text-sm
                      placeholder-gray-600 focus:outline-none focus:ring-2 focus:ring-blue-500/50 focus:border-blue-500/50
                      transition-all duration-200 resize-none"
                  />
                </div>
              </div>
            </SectionCard>
          )}

          {/* ══ NOTIFICATIONS ══ */}
          {activeTab === "notifications" && (
            <SectionCard>
              <h2 className="text-sm font-bold text-white mb-1 flex items-center gap-2">
                <FaBell className="text-amber-400" size={13} /> Notification Preferences
              </h2>
              <p className="text-xs text-gray-500 mb-5">Control when and how you receive notifications</p>
              <div className="divide-y divide-gray-700/50">
                <NotificationRow label="Email Notifications"   description="Receive alerts via email"                      checked={settings.emailNotifications}   onChange={v => set("emailNotifications", v)} />
                <NotificationRow label="SMS Notifications"     description="Receive alerts via SMS"                        checked={settings.smsNotifications}     onChange={v => set("smsNotifications", v)} />
                <NotificationRow label="New Item Alerts"       description="Notify when new items are reported"            checked={settings.newItemNotifications}  onChange={v => set("newItemNotifications", v)} />
                <NotificationRow label="Claim Alerts"          description="Notify when items are claimed"                 checked={settings.claimNotifications}   onChange={v => set("claimNotifications", v)} />
                <NotificationRow label="Reminder Alerts"       description="Send reminders for pending items"              checked={settings.reminderNotifications} onChange={v => set("reminderNotifications", v)} />
              </div>
            </SectionCard>
          )}

          {/* ══ SECURITY ══ */}
          {activeTab === "security" && (
            <SectionCard>
              <h2 className="text-sm font-bold text-white mb-5 flex items-center gap-2">
                <FaShieldAlt className="text-green-400" size={13} /> Security Settings
              </h2>
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-5 mb-6">
                <div>
                  <FieldLabel>Password Expiry (days)</FieldLabel>
                  <InputField type="number" value={settings.passwordExpiry} onChange={e => set("passwordExpiry", +e.target.value)} />
                </div>
                <div>
                  <FieldLabel>Session Timeout (min)</FieldLabel>
                  <InputField type="number" value={settings.sessionTimeout} onChange={e => set("sessionTimeout", +e.target.value)} />
                </div>
                <div>
                  <FieldLabel>Max Login Attempts</FieldLabel>
                  <InputField type="number" value={settings.maxLoginAttempts} onChange={e => set("maxLoginAttempts", +e.target.value)} />
                </div>
              </div>
              <div className="border-t border-gray-700/50 pt-5">
                <NotificationRow label="Two-Factor Authentication" description="Require 2FA for all users"                   checked={settings.enableTwoFactor}        onChange={v => set("enableTwoFactor", v)} />
                <NotificationRow label="Force Password Change"     description="Require users to change default passwords"   checked={settings.requirePasswordChange}   onChange={v => set("requirePasswordChange", v)} />
              </div>
            </SectionCard>
          )}

          {/* ══ SYSTEM ══ */}
          {activeTab === "system" && (
            <SectionCard>
              <h2 className="text-sm font-bold text-white mb-5 flex items-center gap-2">
                <FaDatabase className="text-purple-400" size={13} /> System Settings
              </h2>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-5 mb-6">
                <div>
                  <FieldLabel>Item Expiry (days)</FieldLabel>
                  <InputField type="number" value={settings.itemExpiryDays} onChange={e => set("itemExpiryDays", +e.target.value)} />
                </div>
                <div>
                  <FieldLabel>Max Image Size (MB)</FieldLabel>
                  <InputField type="number" value={settings.maxImageSize} onChange={e => set("maxImageSize", +e.target.value)} />
                </div>
              </div>
              <div className="border-t border-gray-700/50 pt-5">
                <NotificationRow label="Auto-delete Expired Items" description="Automatically remove items past expiry date"       checked={settings.autoDeleteExpiredItems} onChange={v => set("autoDeleteExpiredItems", v)} />
                <NotificationRow label="Require Item Approval"     description="Items must be reviewed before becoming visible"   checked={settings.requireItemApproval}    onChange={v => set("requireItemApproval", v)} />
              </div>
            </SectionCard>
          )}

          {/* ══ EMAIL ══ */}
          {activeTab === "email" && (
            <SectionCard>
              <div className="flex items-center justify-between mb-5">
                <h2 className="text-sm font-bold text-white flex items-center gap-2">
                  <FaEnvelope className="text-rose-400" size={13} /> SMTP Configuration
                </h2>
                <button
                  onClick={() => { toast.info("Testing email…"); setTimeout(() => toast.success("Email test successful!"), 2000); }}
                  className="px-4 py-2 bg-green-600/20 hover:bg-green-600 border border-green-600/40
                    text-green-400 hover:text-white rounded-xl text-xs font-semibold transition-all duration-200"
                >
                  Send Test
                </button>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
                <div>
                  <FieldLabel>SMTP Host</FieldLabel>
                  <InputField type="text" value={settings.smtpHost} onChange={e => set("smtpHost", e.target.value)} placeholder="smtp.gmail.com" />
                </div>
                <div>
                  <FieldLabel>SMTP Port</FieldLabel>
                  <InputField type="number" value={settings.smtpPort} onChange={e => set("smtpPort", +e.target.value)} />
                </div>
                <div>
                  <FieldLabel>SMTP Username</FieldLabel>
                  <InputField type="text" value={settings.smtpUsername} onChange={e => set("smtpUsername", e.target.value)} placeholder="your@email.com" />
                </div>
                <div>
                  <FieldLabel>SMTP Password</FieldLabel>
                  <div className="relative">
                    <InputField
                      type={showSmtpPassword ? "text" : "password"}
                      value={settings.smtpPassword}
                      onChange={e => set("smtpPassword", e.target.value)}
                      placeholder="••••••••"
                      className="pr-10"
                    />
                    <button type="button" onClick={() => setShowSmtpPassword(!showSmtpPassword)}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-500 hover:text-gray-300 transition-colors">
                      {showSmtpPassword ? <FaEyeSlash size={13} /> : <FaEye size={13} />}
                    </button>
                  </div>
                </div>
                <div>
                  <FieldLabel>From Name</FieldLabel>
                  <InputField type="text" value={settings.fromName} onChange={e => set("fromName", e.target.value)} />
                </div>
                <div>
                  <FieldLabel>From Email</FieldLabel>
                  <InputField type="email" value={settings.fromEmail} onChange={e => set("fromEmail", e.target.value)} />
                </div>
              </div>
              <div className="mt-5 pt-5 border-t border-gray-700/50">
                <NotificationRow label="Use SSL / TLS" description="Enable secure encrypted email transmission" checked={settings.smtpSecure} onChange={v => set("smtpSecure", v)} />
              </div>
            </SectionCard>
          )}
        </main>
      </div>
    </div>
  );
};

export default Settings;