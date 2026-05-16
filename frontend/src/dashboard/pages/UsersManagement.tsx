import { useState, useEffect, useRef } from "react";
import ReactDOM from "react-dom";
import { FaTrash, FaSearch, FaShieldAlt, FaBan, FaPlus, FaTimes, FaEye, FaEyeSlash, FaChevronDown, FaCheck } from "react-icons/fa";
import { toast } from "react-toastify";
import { useForm } from "react-hook-form";
import {
  useGetAllUsersQuery,
  useBlockUserMutation,
  useSoftDeleteUserMutation,
  useRegistersMutation,
} from "../../redux/api/api";

interface ApiUser {
  id: string; username: string; email: string; activated: boolean;
  password: string; role: "USER" | "ADMIN"; createdAt: string; updatedAt: string; userImg: string;
}
interface User {
  id: string; name: string; email: string; role: "USER" | "ADMIN";
  status: "ACTIVE" | "SUSPENDED" | "BANNED"; createdAt: string;
  lastLogin?: string; itemsReported: number; claimsMade: number; profileImage?: string;
}

const Spinner = () => (
  <svg className="animate-spin h-3.5 w-3.5" viewBox="0 0 24 24" fill="none">
    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
  </svg>
);

const CustomDropdown = ({ options, value, onChange, allLabel = "All" }: {
  options: { id: string, name: string }[];
  value: string;
  onChange: (v: string) => void;
  allLabel?: string;
}) => {
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, []);

  const selected = value === "ALL" ? allLabel : options.find(o => o.id === value)?.name ?? allLabel;

  return (
    <div ref={ref} className="relative w-full sm:w-56">
      <button
        type="button"
        onClick={() => setOpen(o => !o)}
        className="w-full flex items-center justify-between px-4 py-2.5 bg-gray-800/80 border border-white/10 rounded-2xl text-white text-sm focus:outline-none transition-all"
      >
        <span className="truncate text-left">{selected}</span>
        <FaChevronDown size={11} className={`text-gray-400 shrink-0 ml-2 transition-transform duration-200 ${open ? "rotate-180" : ""}`} />
      </button>
      {open && (
        <div className="absolute z-50 top-full mt-2 left-0 w-full bg-gray-900 border border-white/10 rounded-2xl shadow-2xl overflow-hidden">
          <div className="max-h-56 overflow-y-auto">
            {[{ id: "ALL", name: allLabel }, ...options].map(opt => (
              <button
                key={opt.id}
                type="button"
                onClick={() => { onChange(opt.id); setOpen(false); }}
                className={`w-full text-left px-4 py-2.5 text-sm transition-colors flex items-center justify-between ${value === opt.id
                    ? "bg-white/5 text-white font-semibold"
                    : "text-gray-400 hover:bg-white/[0.03] hover:text-white"
                  }`}
              >
                {opt.name}
                {value === opt.id && <FaCheck size={9} className="text-gray-400 shrink-0" />}
              </button>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};

const UsersManagement = () => {
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState<string>("ALL");
  const [openDropdownId, setOpenDropdownId] = useState<string | null>(null);
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const [deletingUser, setDeletingUser] = useState<User | null>(null);
  const [isDeleteLoading, setIsDeleteLoading] = useState(false);
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [isCreating, setIsCreating] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const { register, handleSubmit, formState: { errors }, reset } = useForm();

  const { data: allUsersData, isLoading } = useGetAllUsersQuery(undefined);
  const [blockUser] = useBlockUserMutation();
  const [softDeleteUser] = useSoftDeleteUserMutation();
  const [registerUser] = useRegistersMutation();

  const transformUser = (apiUser: ApiUser): User => ({
    id: apiUser.id, name: apiUser.username, email: apiUser.email, role: apiUser.role,
    status: apiUser.activated ? "ACTIVE" : "SUSPENDED", createdAt: apiUser.createdAt,
    lastLogin: undefined, itemsReported: 0, claimsMade: 0, profileImage: apiUser.userImg || undefined,
  });

  const allUsers = allUsersData?.data ? allUsersData.data.map(transformUser) : [];
  const adminUsers = allUsers.filter((u: User) => u.role === "ADMIN");

  const filteredUsers = adminUsers.filter((user: User) => {
    const matchesSearch = user.name.toLowerCase().includes(searchTerm.toLowerCase()) || user.email.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesStatus = statusFilter === "ALL" || user.status === statusFilter;
    return matchesSearch && matchesStatus;
  });

  const handleStatusChange = async (id: string, newStatus: string) => {
    try {
      await blockUser(id).unwrap();
      toast.success(newStatus === "SUSPENDED" ? "User suspended" : "User activated");
    } catch { toast.error("Failed to update status"); }
  };

  const handleDelete = (user: User) => { setDeletingUser(user); setIsDeleteModalOpen(true); };

  const handleDeleteConfirm = async () => {
    if (!deletingUser) return;
    setIsDeleteLoading(true);
    try {
      await softDeleteUser(deletingUser.id).unwrap();
      toast.success("Admin account deleted");
      setIsDeleteModalOpen(false); setDeletingUser(null);
    } catch { toast.error("Failed to delete"); }
    finally { setIsDeleteLoading(false); }
  };

  const handleCreateAdmin = async (data: any) => {
    setIsCreating(true);
    try {
      const res: any = await registerUser({ username: data.username, email: data.email, password: data.password });
      if (res?.error) { toast.error(res.error?.data?.message || "Failed"); return; }
      toast.success(`User "${data.username}" created!`);
      setIsCreateModalOpen(false); reset();
    } catch { toast.error("Failed to create admin"); }
    finally { setIsCreating(false); }
  };

  const formatDate = (d: string) => new Date(d).toLocaleDateString("en-PH", { month: "short", day: "numeric", year: "numeric" });

  // ── StatusDropdown: React Portal — renders into document.body, always on top ──
  const StatusDropdown = ({ user }: { user: User }) => {
    const btnRef = useRef<HTMLButtonElement>(null);
    const [coords, setCoords] = useState({ top: 0, left: 0 });
    const isOpen = openDropdownId === user.id;

    const updateCoords = () => {
      if (btnRef.current) {
        const rect = btnRef.current.getBoundingClientRect();
        // Only update if the element is actually visible in the DOM
        if (rect.width === 0 || rect.height === 0) return;
        
        setCoords({
          top: rect.bottom + window.scrollY,
          left: rect.left + window.scrollX,
        });
      }
    };

    useEffect(() => {
      if (isOpen) {
        updateCoords();
        window.addEventListener("resize", updateCoords);
        window.addEventListener("scroll", updateCoords, true);
      }
      return () => {
        window.removeEventListener("resize", updateCoords);
        window.removeEventListener("scroll", updateCoords, true);
      };
    }, [isOpen]);

    const handleOpen = (e: React.MouseEvent) => {
      e.preventDefault();
      e.stopPropagation();
      if (!isOpen) updateCoords();
      setOpenDropdownId(isOpen ? null : user.id);
    };

    return (
      <div className="relative">
        <button
          ref={btnRef}
          type="button"
          onClick={handleOpen}
          className={`flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[10px] font-bold border cursor-pointer transition-all whitespace-nowrap ${
            user.status === "ACTIVE"
              ? "bg-emerald-500/10 text-emerald-400 border-emerald-500/20 hover:bg-emerald-500/20"
              : "bg-amber-500/10 text-amber-400 border-amber-500/20 hover:bg-amber-500/20"
          }`}
        >
          <span className={`w-1.5 h-1.5 rounded-full shrink-0 ${user.status === "ACTIVE" ? "bg-emerald-400" : "bg-amber-400"}`} />
          {user.status === "ACTIVE" ? "Active" : "Suspended"}
          <FaChevronDown size={7} className={`opacity-60 shrink-0 transition-transform ${isOpen ? "rotate-180" : ""}`} />
        </button>

        {/* Only render portal if coordinates have been calculated and button is visible */}
        {isOpen && coords.top !== 0 && ReactDOM.createPortal(
          <div 
            style={{ 
              position: "absolute", 
              top: `${coords.top + 6}px`, 
              left: `${coords.left}px`,
              zIndex: 9999,
            }}
            className="bg-gray-900 border border-white/10 rounded-xl shadow-2xl overflow-hidden min-w-[130px] animate-in fade-in zoom-in-95 duration-100"
            onClick={(e) => e.stopPropagation()}
          >
            <button
              type="button"
              onClick={(e) => { e.stopPropagation(); handleStatusChange(user.id, "ACTIVE"); setOpenDropdownId(null); }}
              className="w-full flex items-center gap-2 px-3 py-2.5 text-[11px] font-medium text-emerald-400 hover:bg-emerald-500/10 transition-colors text-left"
            >
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-400" />
              Active
            </button>
            <div className="h-px bg-white/5" />
            <button
              type="button"
              onClick={(e) => { e.stopPropagation(); handleStatusChange(user.id, "SUSPENDED"); setOpenDropdownId(null); }}
              className="w-full flex items-center gap-2 px-3 py-2.5 text-[11px] font-medium text-amber-400 hover:bg-amber-500/10 transition-colors text-left"
            >
              <span className="w-1.5 h-1.5 rounded-full bg-amber-400" />
              Suspended
            </button>
          </div>,
          document.body
        )}
      </div>
    );
  };

  if (isLoading) return (
    <div className="space-y-4 animate-pulse">
      <div className="grid grid-cols-3 gap-4">
        {[1, 2, 3].map(i => <div key={i} className="h-24 bg-gray-900 border border-white/5 rounded-2xl" />)}
      </div>
      <div className="h-12 bg-gray-900 border border-white/5 rounded-2xl" />
      {[1, 2, 3].map(i => <div key={i} className="h-16 bg-gray-900 border border-white/5 rounded-2xl" />)}
    </div>
  );

  return (
    <div className="space-y-5" onClick={() => setOpenDropdownId(null)}>

      {/* Header */}
      <div className="flex items-center justify-between gap-4">
        <div>
          <h1 className="text-white text-xl font-bold tracking-tight">Admin Accounts</h1>
          <p className="text-gray-500 text-xs mt-0.5">Manage administrator access and permissions</p>
        </div>
        <button onClick={() => setIsCreateModalOpen(true)}
          className="flex items-center gap-2 px-4 py-2 bg-blue-600 hover:bg-blue-500 text-white text-xs font-bold rounded-xl transition-all shrink-0">
          <FaPlus size={10} /> Add Admin
        </button>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-3 gap-2 sm:gap-4">
        {[
          { label: "Total Admins", value: adminUsers.length, accent: "bg-blue-500/10", icon: <FaShieldAlt size={12} className="text-blue-400" />, sub: "System Administrators", subColor: "text-gray-500" },
          { label: "Active", value: adminUsers.filter((u: User) => u.status === "ACTIVE").length, accent: "bg-emerald-500/10", icon: <FaCheck size={12} className="text-emerald-400" />, sub: "Active Sessions", subColor: "text-emerald-400" },
          { label: "Suspended", value: adminUsers.filter((u: User) => u.status === "SUSPENDED").length, accent: "bg-amber-500/10", icon: <FaBan size={12} className="text-amber-400" />, sub: "Access Revoked", subColor: "text-amber-400" },
        ].map(({ label, value, accent, icon, sub, subColor }) => (
          <div key={label} className="relative bg-gray-900 border border-white/5 rounded-2xl p-3 sm:p-5 flex flex-col items-start gap-4 overflow-hidden min-h-[140px] sm:min-h-[160px]">
            <div className={`w-8 h-8 rounded-full flex items-center justify-center ${accent} shrink-0`}>{icon}</div>
            <div className="flex flex-col gap-1.5 w-full">
              <p className="text-xl sm:text-2xl font-bold text-white tracking-tight leading-none">{value}</p>
              <div className="space-y-1">
                <p className="text-gray-500 text-[10px] sm:text-xs font-semibold leading-tight">{label}</p>
                <p className={`text-[9px] sm:text-[10px] font-bold ${subColor} leading-tight uppercase tracking-wider`}>{sub}</p>
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Filters */}
      <div className="bg-gray-900 border border-white/5 rounded-2xl p-4 flex flex-col sm:flex-row gap-3">
        <div className="flex-1 relative">
          <FaSearch className="absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-600" size={11} />
          <input type="text" placeholder="Search by name or email..." value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-9 pr-4 py-2.5 bg-gray-800/80 border border-transparent rounded-xl text-white text-sm placeholder-gray-600 focus:outline-none focus:ring-2 focus:ring-blue-500/30 transition-all" />
        </div>
        <CustomDropdown
          value={statusFilter}
          onChange={setStatusFilter}
          options={[{ id: "ACTIVE", name: "Active" }, { id: "SUSPENDED", name: "Suspended" }]}
          allLabel="All Status"
        />
      </div>

      {/* ── Fix 2: Table uses table-fixed + explicit column widths so it never overflows ── */}
      <div className="bg-gray-900 border border-white/5 rounded-2xl overflow-hidden">
        <div className="px-5 py-3.5 border-b border-white/5 flex items-center justify-between">
          <h2 className="text-xs font-bold text-gray-400 uppercase tracking-widest">Admins</h2>
          <span className="text-[10px] text-gray-600">{filteredUsers.length} accounts</span>
        </div>

        {/* Desktop table — fixed layout, no overflow cut */}
        {/* Desktop table */}
        <div className="hidden md:block overflow-x-auto custom-scrollbar">
          <table className="w-full table-fixed min-w-[800px] border-separate border-spacing-0">
            <thead>
              <tr className="border-b border-white/5 bg-gray-800/10">
                <th className="px-6 py-4 text-left text-[10px] font-bold text-gray-500 uppercase tracking-widest w-[40%]">Admin User</th>
                <th className="px-6 py-4 text-left text-[10px] font-bold text-gray-500 uppercase tracking-widest w-[20%]">Status</th>
                <th className="px-6 py-4 text-left text-[10px] font-bold text-gray-500 uppercase tracking-widest w-[30%]">Joined Date</th>
                <th className="px-6 py-4 text-right text-[10px] font-bold text-gray-500 uppercase tracking-widest w-[10%]">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-white/[0.04]">
              {filteredUsers.map((user: User) => (
                <tr key={user.id} className="hover:bg-white/[0.01] transition-colors group">
                  <td className="px-6 py-4 w-[40%]">
                    <div className="flex items-center gap-4">
                      <div className="w-9 h-9 rounded-full bg-blue-500/10 border border-blue-500/20 flex items-center justify-center shrink-0 shadow-sm">
                        <span className="text-blue-400 text-sm font-bold">{user.name.charAt(0).toUpperCase()}</span>
                      </div>
                      <div className="min-w-0">
                        <div className="flex items-center gap-2 mb-0.5">
                          <p className="text-white text-sm font-semibold truncate">{user.name}</p>
                          <span className="px-1.5 py-0.5 bg-blue-500/10 text-blue-400 border border-blue-500/20 text-[8px] font-bold rounded-full uppercase tracking-tighter shrink-0">Admin</span>
                        </div>
                        <p className="text-gray-500 text-[11px] truncate">{user.email}</p>
                      </div>
                    </div>
                  </td>
                  <td className="px-6 py-4 w-[20%]">
                    <div className="flex items-center">
                      <StatusDropdown user={user} />
                    </div>
                  </td>
                  <td className="px-6 py-4 w-[30%]">
                    <span className="text-gray-400 text-xs font-medium">
                      {formatDate(user.createdAt)}
                    </span>
                  </td>
                  <td className="px-6 py-4 text-right w-[10%]">
                    <button onClick={() => handleDelete(user)}
                      className="w-8 h-8 rounded-lg bg-red-500/10 hover:bg-red-500/20 border border-red-500/10 flex items-center justify-center text-red-400 transition-all ml-auto group-hover:border-red-500/30">
                      <FaTrash size={10} />
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {/* Mobile */}
        <div className="md:hidden divide-y divide-white/[0.04]">
          {filteredUsers.map((user: User) => (
            <div key={user.id} className="p-4 flex items-center gap-3">
              <div className="w-9 h-9 rounded-full bg-blue-500/10 border border-blue-500/20 flex items-center justify-center shrink-0">
                <span className="text-blue-400 text-sm font-bold">{user.name.charAt(0).toUpperCase()}</span>
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-1.5 mb-0.5">
                  <p className="text-white text-sm font-semibold truncate">{user.name}</p>
                  <span className="px-1.5 py-0.5 bg-blue-500/10 text-blue-400 border border-blue-500/20 text-[9px] font-bold rounded-full uppercase shrink-0">Admin</span>
                </div>
                <p className="text-gray-500 text-xs truncate">{user.email}</p>
                <div className="mt-1.5"><StatusDropdown user={user} /></div>
              </div>
              <button onClick={() => handleDelete(user)}
                className="w-8 h-8 rounded-lg bg-red-500/10 hover:bg-red-500/20 border border-red-500/15 flex items-center justify-center text-red-400 transition-colors shrink-0">
                <FaTrash size={10} />
              </button>
            </div>
          ))}
        </div>

        {filteredUsers.length === 0 && (
          <div className="py-16 text-center">
            <FaShieldAlt className="mx-auto text-gray-700 mb-3" size={24} />
            <p className="text-gray-500 text-sm">No admin accounts found</p>
          </div>
        )}
      </div>

      {/* Create Modal */}
      {isCreateModalOpen && (
        <div className="fixed inset-0 bg-black/75 backdrop-blur-sm flex items-end sm:items-center justify-center z-50 p-0 sm:p-4">
          <div className="bg-gray-900 border border-white/10 rounded-t-2xl sm:rounded-2xl w-full sm:max-w-md shadow-2xl max-h-[92vh] flex flex-col">
            <div className="flex items-center justify-between px-5 py-4 border-b border-white/5 shrink-0">
              <div className="flex items-center gap-3">
                <div className="w-7 h-7 rounded-lg bg-blue-500/10 border border-blue-500/20 flex items-center justify-center">
                  <FaShieldAlt size={11} className="text-blue-400" />
                </div>
                <div>
                  <h3 className="text-sm font-bold text-white">Create Admin</h3>
                  <p className="text-gray-500 text-[11px]">New account will have full dashboard access</p>
                </div>
              </div>
              <button onClick={() => { setIsCreateModalOpen(false); reset(); }}
                className="w-7 h-7 rounded-lg bg-white/5 hover:bg-white/10 flex items-center justify-center text-gray-400 hover:text-white transition-colors">
                <FaTimes size={12} />
              </button>
            </div>
            <form onSubmit={handleSubmit(handleCreateAdmin)} className="p-5 space-y-4 overflow-y-auto">
              {[
                { label: "Username", key: "username", type: "text", placeholder: "e.g. sas_admin", rules: { required: "Required", minLength: { value: 3, message: "Min. 3 characters" }, pattern: { value: /^[a-zA-Z0-9_]+$/, message: "Letters, numbers, underscores only" } } },
                { label: "Email", key: "email", type: "email", placeholder: "admin@nbsc.edu.ph", rules: { required: "Required", pattern: { value: /^\S+@\S+$/i, message: "Invalid email" } } },
              ].map(({ label, key, type, placeholder, rules }) => (
                <div key={key}>
                  <label className="block text-[10px] font-bold text-gray-400 uppercase tracking-widest mb-1.5">{label}</label>
                  <input type={type} placeholder={placeholder} {...register(key as any, rules)}
                    className="w-full px-4 py-2.5 bg-gray-800 border border-white/8 rounded-xl text-white text-sm placeholder-gray-600 focus:outline-none focus:ring-2 focus:ring-blue-500/30 transition-all" />
                  {(errors as any)[key] && <p className="text-red-400 text-xs mt-1">{(errors as any)[key]?.message as string}</p>}
                </div>
              ))}
              <div>
                <label className="block text-[10px] font-bold text-gray-400 uppercase tracking-widest mb-1.5">Password</label>
                <div className="relative">
                  <input type={showPassword ? "text" : "password"} placeholder="Min. 6 characters"
                    {...register("password", { required: "Required", minLength: { value: 6, message: "Min. 6 characters" } })}
                    className="w-full px-4 py-2.5 bg-gray-800 border border-white/8 rounded-xl text-white text-sm placeholder-gray-600 focus:outline-none focus:ring-2 focus:ring-blue-500/30 transition-all pr-10" />
                  <button type="button" onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-500 hover:text-gray-300 transition-colors">
                    {showPassword ? <FaEyeSlash size={13} /> : <FaEye size={13} />}
                  </button>
                </div>
                {errors.password && <p className="text-red-400 text-xs mt-1">{errors.password.message as string}</p>}
              </div>
              <div className="flex gap-2 pt-1">
                <button type="button" onClick={() => { setIsCreateModalOpen(false); reset(); }} disabled={isCreating}
                  className="flex-1 py-2.5 bg-gray-800 hover:bg-gray-700 disabled:opacity-50 border border-white/5 text-gray-300 text-xs font-medium rounded-xl transition-colors">
                  Cancel
                </button>
                <button type="submit" disabled={isCreating}
                  className="flex-1 py-2.5 bg-blue-600 hover:bg-blue-500 disabled:opacity-50 disabled:cursor-not-allowed text-white text-xs font-bold rounded-xl transition-all flex items-center justify-center gap-2">
                  {isCreating ? <><Spinner /> Creating...</> : <><FaPlus size={10} /> Create Admin</>}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Delete Modal */}
      {isDeleteModalOpen && (
        <div className="fixed inset-0 bg-black/75 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-gray-900 border border-white/10 rounded-2xl w-full max-w-sm shadow-2xl">
            <div className="flex items-center justify-between px-5 py-3.5 border-b border-white/5">
              <div className="flex items-center gap-3">
                <div className="w-7 h-7 rounded-lg bg-red-500/10 border border-red-500/20 flex items-center justify-center shrink-0">
                  <FaTrash size={11} className="text-red-400" />
                </div>
                <div>
                  <h2 className="text-sm font-bold text-white">Delete Admin</h2>
                  <p className="text-gray-500 text-[11px]">This action cannot be undone</p>
                </div>
              </div>
              <button onClick={() => { setIsDeleteModalOpen(false); setDeletingUser(null); }} disabled={isDeleteLoading}
                className="w-7 h-7 rounded-lg bg-white/5 hover:bg-white/10 flex items-center justify-center text-gray-400 hover:text-white transition-colors">
                <FaTimes size={12} />
              </button>
            </div>
            <div className="p-5 space-y-4">
              {deletingUser && (
                <div className="flex items-center gap-3 p-3 bg-gray-800/60 border border-white/5 rounded-xl">
                  <div className="w-9 h-9 rounded-full bg-red-500/10 border border-red-500/20 flex items-center justify-center shrink-0">
                    <span className="text-red-400 text-sm font-bold">{deletingUser.name.charAt(0).toUpperCase()}</span>
                  </div>
                  <div className="min-w-0">
                    <p className="text-white text-sm font-semibold truncate">{deletingUser.name}</p>
                    <p className="text-gray-400 text-xs truncate">{deletingUser.email}</p>
                  </div>
                </div>
              )}
              <div className="flex items-start gap-2.5 px-3.5 py-2.5 bg-red-500/5 border border-red-500/15 rounded-xl">
                <p className="text-red-300/80 text-xs leading-relaxed">
                  Deleting this account will <strong>permanently remove</strong> it and all associated data.
                </p>
              </div>
              <div className="flex gap-2">
                <button type="button" onClick={() => { setIsDeleteModalOpen(false); setDeletingUser(null); }} disabled={isDeleteLoading}
                  className="flex-1 py-2.5 bg-gray-800 hover:bg-gray-700 disabled:opacity-50 border border-white/5 text-gray-300 text-xs font-medium rounded-xl transition-colors">
                  Cancel
                </button>
                <button type="button" onClick={handleDeleteConfirm} disabled={isDeleteLoading}
                  className="flex-1 py-2.5 bg-red-500 hover:bg-red-400 disabled:opacity-50 text-white text-xs font-bold rounded-xl transition-colors flex items-center justify-center gap-1.5">
                  {isDeleteLoading ? <><Spinner /> Deleting...</> : <><FaTrash size={10} /> Delete</>}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default UsersManagement;