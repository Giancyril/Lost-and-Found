import { useState } from "react";
import { FaTrash, FaSearch, FaShieldAlt, FaUser, FaBan } from "react-icons/fa";
import { toast } from "react-toastify";
import {
  useGetAllUsersQuery,
  useBlockUserMutation,
  useChangeUserRoleMutation,
  useSoftDeleteUserMutation,
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
  const [roleFilter, setRoleFilter]     = useState<string>("ALL");
  const [statusFilter, setStatusFilter] = useState<string>("ALL");
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const [deletingUser, setDeletingUser]           = useState<User | null>(null);
  const [isDeleteLoading, setIsDeleteLoading]     = useState(false);

  const { data: allUsersData, isLoading } = useGetAllUsersQuery(undefined);
  const [blockUser]      = useBlockUserMutation();
  const [changeUserRole] = useChangeUserRoleMutation();
  const [softDeleteUser] = useSoftDeleteUserMutation();

  const transformUser = (apiUser: ApiUser): User => ({
    id: apiUser.id, name: apiUser.username, email: apiUser.email, role: apiUser.role,
    status: apiUser.activated ? "ACTIVE" : "SUSPENDED", createdAt: apiUser.createdAt,
    lastLogin: undefined, itemsReported: 0, claimsMade: 0, profileImage: apiUser.userImg || undefined,
  });

  const users = allUsersData?.data ? allUsersData.data.map(transformUser) : [];

  const filteredUsers = users.filter((user: User) => {
    const matchesSearch = user.name.toLowerCase().includes(searchTerm.toLowerCase()) || user.email.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesRole   = roleFilter === "ALL" || user.role === roleFilter;
    const matchesStatus = statusFilter === "ALL" || user.status === statusFilter;
    return matchesSearch && matchesRole && matchesStatus;
  });

  const handleRoleChange = async (id: string, newRole: string) => {
    try { await changeUserRole({ id, role: newRole }).unwrap(); toast.success("User role changed successfully"); }
    catch { toast.error("Failed to change user role"); }
  };

  const handleStatusChange = async (id: string, newStatus: string) => {
    try {
      if (newStatus === "SUSPENDED") { await blockUser(id).unwrap(); toast.success("User blocked successfully"); }
      else if (newStatus === "ACTIVE") { await blockUser(id).unwrap(); toast.success("User activated successfully"); }
      else { toast.info("Status change functionality needs to be implemented on the backend"); }
    } catch { toast.error("Failed to update user status"); }
  };

  const handleDelete = (user: User) => { setDeletingUser(user); setIsDeleteModalOpen(true); };

  const handleDeleteConfirm = async () => {
    if (!deletingUser) return;
    setIsDeleteLoading(true);
    try {
      await softDeleteUser(deletingUser.id).unwrap();
      toast.success("User deleted successfully");
      setIsDeleteModalOpen(false); setDeletingUser(null);
    } catch { toast.error("Failed to delete user"); }
    finally { setIsDeleteLoading(false); }
  };

  const handleDeleteCancel = () => { setIsDeleteModalOpen(false); setDeletingUser(null); setIsDeleteLoading(false); };

  const getRoleColor   = (role: string)   => role === "ADMIN" ? "bg-red-500" : role === "USER" ? "bg-green-500" : "bg-gray-500";
  const getStatusColor = (status: string) => status === "ACTIVE" ? "bg-green-500" : status === "SUSPENDED" ? "bg-yellow-500" : status === "BANNED" ? "bg-red-500" : "bg-gray-500";
  const getRoleIcon    = (role: string)   => role === "ADMIN" ? <FaShieldAlt className="text-red-500" /> : <FaUser className="text-green-500" />;
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
      <div className="grid grid-cols-1 md:grid-cols-4 gap-3 sm:gap-6">
        {[
          { label: "Total Users", value: users.length,                                             icon: <FaUser className="text-white" />,     num: "text-white"      },
          { label: "Active Users", value: users.filter((u: User) => u.status === "ACTIVE").length, icon: <FaUser className="text-white" />,     num: "text-green-500"  },
          { label: "Admins",       value: users.filter((u: User) => u.role === "ADMIN").length,    icon: <FaShieldAlt className="text-white" />, num: "text-red-500"    },
          { label: "Suspended",    value: users.filter((u: User) => u.status === "SUSPENDED").length, icon: <FaBan className="text-white" />,  num: "text-yellow-500" },
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

      {/* Filters */}
      <div className="bg-gray-800 rounded-xl p-4 sm:p-6 border border-gray-700">
        <div className="flex flex-col sm:flex-row gap-3 sm:gap-4">
          <div className="flex-1 relative">
            <FaSearch className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={12} />
            <input type="text" placeholder="Search users..." value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-9 pr-4 py-2 bg-gray-700 border border-gray-600 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm" />
          </div>
          <div className="flex gap-2 sm:gap-4">
            <select value={roleFilter} onChange={(e) => setRoleFilter(e.target.value)}
              className="flex-1 sm:flex-none px-3 sm:px-4 py-2 bg-gray-700 border border-gray-600 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm">
              <option value="ALL">All Roles</option>
              <option value="ADMIN">Admin</option>
              <option value="USER">User</option>
            </select>
            <select value={statusFilter} onChange={(e) => setStatusFilter(e.target.value)}
              className="flex-1 sm:flex-none px-3 sm:px-4 py-2 bg-gray-700 border border-gray-600 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm">
              <option value="ALL">All Status</option>
              <option value="ACTIVE">Active</option>
              <option value="SUSPENDED">Suspended</option>
            </select>
          </div>
        </div>
      </div>

      {/* Table — desktop */}
      <div className="hidden md:block bg-gray-800 rounded-xl border border-gray-700 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-gray-900">
              <tr>
                {["User","Role","Status","Joined","Actions"].map(h => (
                  <th key={h} className="px-6 py-4 text-left text-sm font-medium text-gray-300">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-700">
              {filteredUsers.map((user: User) => (
                <tr key={user.id} className="hover:bg-gray-700 transition-colors">
                  <td className="px-6 py-4">
                    <div className="flex items-center space-x-3">
                      {getRoleIcon(user.role)}
                      <div>
                        <div className="font-medium text-white">{user.name}</div>
                        <div className="text-sm text-gray-400">{user.email}</div>
                      </div>
                    </div>
                  </td>
                  <td className="px-6 py-4">
                    <select value={user.role} onChange={(e) => handleRoleChange(user.id, e.target.value)}
                      className={`px-3 py-1 rounded-full text-xs font-medium text-white ${getRoleColor(user.role)}`}>
                      <option value="USER">User</option>
                      <option value="ADMIN">Admin</option>
                    </select>
                  </td>
                  <td className="px-6 py-4">
                    <select value={user.status} onChange={(e) => handleStatusChange(user.id, e.target.value)}
                      className={`px-3 py-1 rounded-full text-xs font-medium text-white ${getStatusColor(user.status)}`}>
                      <option value="ACTIVE">Active</option>
                      <option value="SUSPENDED">Suspended</option>
                    </select>
                  </td>
                  <td className="px-6 py-4 text-gray-300">{formatDate(user.createdAt)}</td>
                  <td className="px-6 py-4">
                    <button onClick={() => handleDelete(user)} className="p-2 text-red-500 hover:bg-red-500 hover:text-white rounded-lg transition-colors" title="Delete User"><FaTrash /></button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        {filteredUsers.length === 0 && (
          <div className="text-center py-12"><FaUser className="mx-auto text-4xl text-gray-500 mb-4" /><p className="text-gray-400">No users found matching your criteria</p></div>
        )}
      </div>

      {/* Cards — mobile */}
      <div className="md:hidden space-y-3">
        {filteredUsers.length === 0 ? (
          <div className="text-center py-12 bg-gray-800 rounded-xl border border-gray-700">
            <FaUser className="mx-auto text-4xl text-gray-500 mb-4" />
            <p className="text-gray-400">No users found matching your criteria</p>
          </div>
        ) : filteredUsers.map((user: User) => (
          <div key={user.id} className="bg-gray-800 rounded-xl border border-gray-700 p-4 space-y-3">
            <div className="flex items-center justify-between gap-2">
              <div className="flex items-center gap-2.5 min-w-0">
                {getRoleIcon(user.role)}
                <div className="min-w-0">
                  <p className="text-white font-medium truncate text-sm">{user.name}</p>
                  <p className="text-gray-400 text-xs truncate">{user.email}</p>
                </div>
              </div>
              <button onClick={() => handleDelete(user)} className="p-2 text-red-500 hover:bg-red-500/10 rounded-lg transition-colors shrink-0"><FaTrash size={13} /></button>
            </div>
            <div className="grid grid-cols-3 gap-2 text-xs">
              <div>
                <p className="text-gray-600 text-[10px] mb-1">Role</p>
                <select value={user.role} onChange={(e) => handleRoleChange(user.id, e.target.value)}
                  className={`w-full px-2 py-1 rounded-lg text-[11px] font-medium text-white border-0 ${getRoleColor(user.role)}`}>
                  <option value="USER">User</option>
                  <option value="ADMIN">Admin</option>
                </select>
              </div>
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

      {/* Delete Modal */}
      {isDeleteModalOpen && (
        <div className="fixed inset-0 bg-black/70 flex items-end sm:items-center justify-center z-50">
          <div className="bg-gray-800 rounded-t-2xl sm:rounded-xl w-full sm:max-w-sm mx-0 sm:mx-4 border border-gray-700 p-5 sm:p-6">
            <div className="text-center">
              <div className="bg-gray-100 rounded-full p-3 w-16 h-16 mx-auto mb-4 flex items-center justify-center">
                <FaTrash className="text-red-600 text-xl" />
              </div>
              <h2 className="text-xl font-bold text-white mb-2">Delete User</h2>
              <p className="text-gray-400 mb-4">Are you sure? This action cannot be undone.</p>
              {deletingUser && (
                <div className="bg-gray-700 rounded-lg p-4 mb-6 text-left">
                  <div className="flex items-center space-x-3 mb-2">
                    {getRoleIcon(deletingUser.role)}
                    <div><h3 className="font-medium text-white">{deletingUser.name}</h3><p className="text-sm text-gray-400">{deletingUser.email}</p></div>
                  </div>
                  <div className="flex justify-between text-sm text-gray-500">
                    <span>Role: {deletingUser.role}</span>
                    <span>Status: {deletingUser.status}</span>
                  </div>
                  <div className="text-sm text-gray-500 mt-1">Joined: {formatDate(deletingUser.createdAt)}</div>
                </div>
              )}
              <div className="flex gap-3">
                <button type="button" onClick={handleDeleteCancel} disabled={isDeleteLoading}
                  className="flex-1 bg-gray-600 hover:bg-gray-700 disabled:bg-gray-500 disabled:cursor-not-allowed text-white py-2.5 px-4 rounded-lg transition-colors text-sm">Cancel</button>
                <button type="button" onClick={handleDeleteConfirm} disabled={isDeleteLoading}
                  className="flex-1 bg-red-600 hover:bg-red-700 disabled:bg-red-400 disabled:cursor-not-allowed text-white py-2.5 px-4 rounded-lg transition-colors flex items-center justify-center gap-2 text-sm">
                  {isDeleteLoading ? <><Spinner /> Deleting...</> : "Delete User"}
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