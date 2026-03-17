import { useState } from "react";
import { FaTrash, FaSearch, FaShieldAlt, FaBan, FaPlus, FaTimes, FaEye, FaEyeSlash } from "react-icons/fa";
import { toast } from "react-toastify";
import { useForm } from "react-hook-form";
import {
  useGetAllUsersQuery,
  useBlockUserMutation,
  useChangeUserRoleMutation,
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
  <svg className="animate-spin h-4 w-4" viewBox="0 0 24 24" fill="none">
    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
  </svg>
);

const UsersManagement = () => {
  const [searchTerm, setSearchTerm]     = useState("");
  const [statusFilter, setStatusFilter] = useState<string>("ALL");
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const [deletingUser, setDeletingUser]           = useState<User | null>(null);
  const [isDeleteLoading, setIsDeleteLoading]     = useState(false);

  // Create Admin modal
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [isCreating, setIsCreating]               = useState(false);
  const [showPassword, setShowPassword]           = useState(false);
  const { register, handleSubmit, formState: { errors }, reset } = useForm();

  const { data: allUsersData, isLoading } = useGetAllUsersQuery(undefined);
  const [blockUser]      = useBlockUserMutation();
  const [changeUserRole] = useChangeUserRoleMutation();
  const [softDeleteUser] = useSoftDeleteUserMutation();
  const [registerUser]   = useRegistersMutation();

  const transformUser = (apiUser: ApiUser): User => ({
    id: apiUser.id, name: apiUser.username, email: apiUser.email, role: apiUser.role,
    status: apiUser.activated ? "ACTIVE" : "SUSPENDED", createdAt: apiUser.createdAt,
    lastLogin: undefined, itemsReported: 0, claimsMade: 0, profileImage: apiUser.userImg || undefined,
  });

  // ── Only show ADMIN users ──
  const allUsers   = allUsersData?.data ? allUsersData.data.map(transformUser) : [];
  const adminUsers = allUsers.filter((u: User) => u.role === "ADMIN");

  const filteredUsers = adminUsers.filter((user: User) => {
    const matchesSearch = user.name.toLowerCase().includes(searchTerm.toLowerCase()) || user.email.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesStatus = statusFilter === "ALL" || user.status === statusFilter;
    return matchesSearch && matchesStatus;
  });

  const handleStatusChange = async (id: string, newStatus: string) => {
    try {
      await blockUser(id).unwrap();
      toast.success(newStatus === "SUSPENDED" ? "User suspended successfully" : "User activated successfully");
    } catch { toast.error("Failed to update user status"); }
  };

  const handleDelete = (user: User) => { setDeletingUser(user); setIsDeleteModalOpen(true); };

  const handleDeleteConfirm = async () => {
    if (!deletingUser) return;
    setIsDeleteLoading(true);
    try {
      await softDeleteUser(deletingUser.id).unwrap();
      toast.success("Admin account deleted successfully");
      setIsDeleteModalOpen(false); setDeletingUser(null);
    } catch { toast.error("Failed to delete user"); }
    finally { setIsDeleteLoading(false); }
  };

  const handleDeleteCancel = () => { setIsDeleteModalOpen(false); setDeletingUser(null); setIsDeleteLoading(false); };

  const handleCreateAdmin = async (data: any) => {
    setIsCreating(true);
    try {
      // Step 1: Register the user
      const res: any = await registerUser({
        username: data.username,
        email:    data.email,
        password: data.password,
      });

      if (res?.error) {
        toast.error(res.error?.data?.message || "Failed to create account.");
        return;
      }

      // Step 2: Promote to ADMIN using the new user's id
      const newUserId = res?.data?.data?.id;
      if (newUserId) {
        await changeUserRole({ id: newUserId, role: "ADMIN" }).unwrap();
      } else {
        toast.error("Account created but could not promote to Admin. Please set role manually.");
        setIsCreateModalOpen(false);
        reset();
        return;
      }

      toast.success(`Admin account for "${data.username}" created successfully!`);
      setIsCreateModalOpen(false);
      reset();
    } catch { toast.error("Failed to create admin account."); }
    finally { setIsCreating(false); }
  };

  const getStatusColor = (status: string) => status === "ACTIVE" ? "bg-green-500" : status === "SUSPENDED" ? "bg-yellow-500" : "bg-gray-500";
  const formatDate     = (d: string)      => new Date(d).toLocaleDateString();

  if (isLoading) return (
    <div className="space-y-4 sm:space-y-6 animate-pulse">
      <div className="h-8 bg-gray-700 rounded w-1/4" />
      {[1,2,3].map(i => <div key={i} className="h-20 bg-gray-700 rounded" />)}
    </div>
  );

  return (
    <div className="space-y-4 sm:space-y-6 max-w-7xl mx-auto">

      {/* Stats */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-3 sm:gap-6">
        {[
          { label: "Total Admins", value: adminUsers.length,                                               icon: <FaShieldAlt className="text-white" />, num: "text-white"      },
          { label: "Active",       value: adminUsers.filter((u: User) => u.status === "ACTIVE").length,    icon: <FaShieldAlt className="text-white" />, num: "text-green-500"  },
          { label: "Suspended",    value: adminUsers.filter((u: User) => u.status === "SUSPENDED").length, icon: <FaBan className="text-white" />,       num: "text-yellow-500" },
        ].map((s) => (
          <div key={s.label} className="bg-gray-800 rounded-xl p-4 sm:p-6 border border-gray-700">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-gray-400 text-sm">{s.label}</p>
                <p className={`text-2xl font-bold ${s.num}`}>{s.value}</p>
              </div>
              <div className="bg-gray-500 p-3 rounded-lg">{s.icon}</div>
            </div>
          </div>
        ))}
      </div>

      {/* Filters + Create Admin button */}
      <div className="bg-gray-800 rounded-xl p-4 sm:p-6 border border-gray-700">
        <div className="flex flex-col sm:flex-row gap-3 sm:gap-4">
          <div className="flex-1 relative">
            <FaSearch className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={12} />
            <input type="text" placeholder="Search admins..." value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-9 pr-4 py-2 bg-gray-700 border border-gray-600 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm" />
          </div>
          <div className="flex gap-2 sm:gap-3">
            <select value={statusFilter} onChange={(e) => setStatusFilter(e.target.value)}
              className="flex-1 sm:flex-none px-3 sm:px-4 py-2 bg-gray-700 border border-gray-600 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm">
              <option value="ALL">All Status</option>
              <option value="ACTIVE">Active</option>
              <option value="SUSPENDED">Suspended</option>
            </select>
            <button
              onClick={() => setIsCreateModalOpen(true)}
              className="inline-flex items-center gap-2 px-4 py-2 bg-blue-600 hover:bg-blue-500 text-white font-semibold rounded-lg text-sm transition-all duration-200 shrink-0"
            >
              <FaPlus size={11} /> Create Admin
            </button>
          </div>
        </div>
      </div>

      {/* Table — desktop */}
      <div className="hidden md:block bg-gray-800 rounded-xl border border-gray-700 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-gray-900">
              <tr>
                {["Admin User", "Status", "Joined", "Actions"].map(h => (
                  <th key={h} className="px-6 py-4 text-left text-sm font-medium text-gray-300">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-700">
              {filteredUsers.map((user: User) => (
                <tr key={user.id} className="hover:bg-gray-700 transition-colors">
                  <td className="px-6 py-4">
                    <div className="flex items-center space-x-3">
                      <div className="w-8 h-8 rounded-full bg-blue-500/20 border border-blue-500/30 flex items-center justify-center shrink-0">
                        <FaShieldAlt className="text-blue-400" size={12} />
                      </div>
                      <div>
                        <div className="font-medium text-white">{user.name}</div>
                        <div className="text-sm text-gray-400">{user.email}</div>
                      </div>
                      <span className="px-2 py-0.5 bg-blue-500/10 text-blue-400 border border-blue-500/20 text-[10px] font-bold rounded-full uppercase">Admin</span>
                    </div>
                  </td>
                  <td className="px-6 py-4">
                    <select value={user.status} onChange={(e) => handleStatusChange(user.id, e.target.value)}
                      className={`px-3 py-1 rounded-full text-xs font-medium text-white border-0 cursor-pointer focus:outline-none ${getStatusColor(user.status)}`}>
                      <option value="ACTIVE">Active</option>
                      <option value="SUSPENDED">Suspended</option>
                    </select>
                  </td>
                  <td className="px-6 py-4 text-gray-300">{formatDate(user.createdAt)}</td>
                  <td className="px-6 py-4">
                    <button onClick={() => handleDelete(user)} className="p-2 text-red-500 hover:bg-red-500 hover:text-white rounded-lg transition-colors" title="Delete Admin">
                      <FaTrash size={13} />
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        {filteredUsers.length === 0 && (
          <div className="text-center py-12">
            <FaShieldAlt className="mx-auto text-4xl text-gray-500 mb-4" />
            <p className="text-gray-400">No admin accounts found</p>
          </div>
        )}
      </div>

      {/* Cards — mobile */}
      <div className="md:hidden space-y-3">
        {filteredUsers.length === 0 ? (
          <div className="text-center py-12 bg-gray-800 rounded-xl border border-gray-700">
            <FaShieldAlt className="mx-auto text-4xl text-gray-500 mb-4" />
            <p className="text-gray-400">No admin accounts found</p>
          </div>
        ) : filteredUsers.map((user: User) => (
          <div key={user.id} className="bg-gray-800 rounded-xl border border-gray-700 p-4 space-y-3">
            <div className="flex items-center justify-between gap-2">
              <div className="flex items-center gap-2.5 min-w-0">
                <div className="w-8 h-8 rounded-full bg-red-500/20 border border-red-500/30 flex items-center justify-center shrink-0">
                  <FaShieldAlt className="text-red-400" size={12} />
                </div>
                <div className="min-w-0">
                  <div className="flex items-center gap-1.5">
                    <p className="text-white font-medium truncate text-sm">{user.name}</p>
                    <span className="px-1.5 py-0.5 bg-red-500/10 text-red-400 border border-red-500/20 text-[9px] font-bold rounded-full uppercase shrink-0">Admin</span>
                  </div>
                  <p className="text-gray-400 text-xs truncate">{user.email}</p>
                </div>
              </div>
              <button onClick={() => handleDelete(user)} className="p-2 text-red-500 hover:bg-red-500/10 rounded-lg transition-colors shrink-0">
                <FaTrash size={13} />
              </button>
            </div>
            <div className="grid grid-cols-2 gap-2 text-xs">
              <div>
                <p className="text-gray-600 text-[10px] mb-1">Status</p>
                <select value={user.status} onChange={(e) => handleStatusChange(user.id, e.target.value)}
                  className={`w-full px-2 py-1 rounded-lg text-[11px] font-medium text-white border-0 ${getStatusColor(user.status)}`}>
                  <option value="ACTIVE">Active</option>
                  <option value="SUSPENDED">Suspended</option>
                </select>
              </div>
              <div>
                <p className="text-gray-600 text-[10px] mb-1">Joined</p>
                <p className="text-gray-300 text-xs">{formatDate(user.createdAt)}</p>
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* ── Create Admin Modal ── */}
      {isCreateModalOpen && (
        <div className="fixed inset-0 bg-black/70 flex items-center justify-center z-50 p-4">
          <div className="bg-gray-800 rounded-2xl w-full max-w-md border border-gray-700 shadow-2xl">
            <div className="flex items-center justify-between px-5 py-4 border-b border-gray-700">
              <div>
                <h2 className="text-base font-bold text-white flex items-center gap-2">
                  <FaShieldAlt className="text-red-400" size={14} /> Create Admin Account
                </h2>
                <p className="text-gray-400 text-xs mt-0.5">New account will be set as Admin by default</p>
              </div>
              <button onClick={() => { setIsCreateModalOpen(false); reset(); }} className="text-gray-400 hover:text-white p-1">
                <FaTimes size={15} />
              </button>
            </div>

            <form onSubmit={handleSubmit(handleCreateAdmin)} className="p-5 space-y-4">
              {/* Username */}
              <div>
                <label className="block text-xs font-semibold uppercase tracking-wider text-gray-400 mb-1.5">
                  Username <span className="text-red-400">*</span>
                </label>
                <input
                  type="text"
                  placeholder="e.g. sas_admin"
                  {...register("username", {
                    required: "Username is required",
                    minLength: { value: 3, message: "Min. 3 characters" },
                    pattern: { value: /^[a-zA-Z0-9_]+$/, message: "Letters, numbers, underscores only" },
                  })}
                  className="w-full px-4 py-2.5 bg-gray-900 border border-gray-700 rounded-xl text-white text-sm placeholder-gray-600 focus:outline-none focus:ring-2 focus:ring-blue-500/50"
                />
                {errors.username && <p className="text-red-400 text-xs mt-1">{errors.username.message as string}</p>}
              </div>

              {/* Email */}
              <div>
                <label className="block text-xs font-semibold uppercase tracking-wider text-gray-400 mb-1.5">
                  Email <span className="text-red-400">*</span>
                </label>
                <input
                  type="email"
                  placeholder="admin@nbsc.edu.ph"
                  {...register("email", {
                    required: "Email is required",
                    pattern: { value: /^\S+@\S+$/i, message: "Invalid email address" },
                  })}
                  className="w-full px-4 py-2.5 bg-gray-900 border border-gray-700 rounded-xl text-white text-sm placeholder-gray-600 focus:outline-none focus:ring-2 focus:ring-blue-500/50"
                />
                {errors.email && <p className="text-red-400 text-xs mt-1">{errors.email.message as string}</p>}
              </div>

              {/* Password */}
              <div>
                <label className="block text-xs font-semibold uppercase tracking-wider text-gray-400 mb-1.5">
                  Password <span className="text-red-400">*</span>
                </label>
                <div className="relative">
                  <input
                    type={showPassword ? "text" : "password"}
                    placeholder="Min. 6 characters"
                    {...register("password", {
                      required: "Password is required",
                      minLength: { value: 6, message: "Min. 6 characters" },
                    })}
                    className="w-full px-4 py-2.5 bg-gray-900 border border-gray-700 rounded-xl text-white text-sm placeholder-gray-600 focus:outline-none focus:ring-2 focus:ring-blue-500/50 pr-10"
                  />
                  <button type="button" onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-500 hover:text-gray-300 transition-colors">
                    {showPassword ? <FaEyeSlash size={13} /> : <FaEye size={13} />}
                  </button>
                </div>
                {errors.password && <p className="text-red-400 text-xs mt-1">{errors.password.message as string}</p>}
              </div>

              {/* Role badge — always Admin */}
              <div className="flex items-center gap-3 bg-red-500/5 border border-red-500/20 rounded-xl px-4 py-3">
                <FaShieldAlt className="text-red-400 shrink-0" size={13} />
                <div>
                  <p className="text-white text-xs font-semibold">Role: Admin</p>
                  <p className="text-gray-500 text-[11px] mt-0.5">This account will have full dashboard access</p>
                </div>
              </div>

              <div className="flex gap-3 pt-1">
                <button type="button" onClick={() => { setIsCreateModalOpen(false); reset(); }} disabled={isCreating}
                  className="flex-1 bg-gray-700 hover:bg-gray-600 disabled:opacity-50 text-white py-2.5 rounded-xl text-sm font-medium transition-colors">
                  Cancel
                </button>
                <button type="submit" disabled={isCreating}
                  className="flex-1 bg-blue-600 hover:bg-blue-500 disabled:opacity-50 disabled:cursor-not-allowed text-white py-2.5 rounded-xl text-sm font-semibold transition-colors flex items-center justify-center gap-2">
                  {isCreating ? <><Spinner /> Creating...</> : <><FaPlus size={11} /> Create Admin</>}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Delete Modal */}
{isDeleteModalOpen && (
  <div className="fixed inset-0 bg-black/70 backdrop-blur-sm flex items-center justify-center z-50 p-4">
    <div className="bg-gray-900 border border-white/10 rounded-2xl w-full max-w-sm shadow-2xl">

      {/* Header */}
      <div className="flex items-center justify-between px-5 py-3.5 border-b border-white/5">
        <div className="flex items-center gap-3">
          <div className="w-7 h-7 rounded-lg bg-red-500/10 border border-red-500/20 flex items-center justify-center shrink-0">
            <FaTrash size={11} className="text-red-400" />
          </div>
          <div>
            <h2 className="text-sm font-bold text-white">Delete Admin Account</h2>
            <p className="text-gray-500 text-[11px]">This action cannot be undone</p>
          </div>
        </div>
        <button onClick={handleDeleteCancel} disabled={isDeleteLoading}
          className="w-7 h-7 rounded-lg bg-white/5 hover:bg-white/10 flex items-center justify-center text-gray-400 hover:text-white transition-colors disabled:opacity-50">
          <FaTimes size={12} />
        </button>
      </div>

      <div className="p-5 space-y-4">
        {/* User preview card */}
        {deletingUser && (
          <div className="bg-gray-800/60 border border-white/5 rounded-xl overflow-hidden">
            <div className="flex items-center gap-2 px-3 py-2 border-b border-white/5">
              <FaShieldAlt size={10} className="text-red-400" />
              <p className="text-[10px] font-bold text-red-400 uppercase tracking-widest">Account to Delete</p>
            </div>
            <div className="p-3 space-y-2">
              <div className="flex items-center gap-2.5">
                <div className="w-8 h-8 rounded-full bg-red-500/10 border border-red-500/20 flex items-center justify-center shrink-0">
                  <FaShieldAlt size={11} className="text-red-400" />
                </div>
                <div className="min-w-0">
                  <p className="text-white text-sm font-semibold truncate">{deletingUser.name}</p>
                  <p className="text-gray-400 text-xs truncate">{deletingUser.email}</p>
                </div>
              </div>
              <p className="text-[10px] text-gray-600 pt-0.5">
                Joined: <span className="text-gray-500">{formatDate(deletingUser.createdAt)}</span>
              </p>
            </div>
          </div>
        )}

        {/* Warning notice */}
        <div className="bg-red-500/5 border border-red-500/15 rounded-xl px-3.5 py-2.5">
          <p className="text-red-300/80 text-xs leading-relaxed">
            Deleting this account will <strong>permanently remove</strong> it and all associated data. This cannot be reversed.
          </p>
        </div>

        {/* Actions */}
        <div className="flex items-center justify-end gap-2 pt-1">
          <button type="button" onClick={handleDeleteCancel} disabled={isDeleteLoading}
            className="flex items-center gap-1.5 px-4 py-2 bg-gray-800 hover:bg-gray-700 disabled:opacity-50 border border-white/5 text-gray-300 text-xs font-medium rounded-lg transition-colors">
            Cancel
          </button>
          <button type="button" onClick={handleDeleteConfirm} disabled={isDeleteLoading}
            className="flex items-center gap-1.5 px-4 py-2 bg-red-500/10 hover:bg-red-500 border border-red-500/30 text-red-400 hover:text-white text-xs font-semibold rounded-lg transition-all disabled:opacity-50 disabled:cursor-not-allowed">
            {isDeleteLoading ? <><Spinner /> Deleting...</> : <><FaTrash size={10} /> Delete Account</>}
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