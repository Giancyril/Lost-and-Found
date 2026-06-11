import { useState } from "react";
import { FaSearch, FaUserShield, FaUserTimes, FaCheck, FaExclamationTriangle, FaCalendarAlt } from "react-icons/fa";
import { toast } from "react-toastify";
import { useGetFlaggedUsersQuery, useClearFlagMutation } from "../../redux/api/api";

interface FlaggedUser {
  id: string;
  name: string;
  username: string;
  email: string;
  schoolId: string | null;
  totalPoints: number;
  isFlagged: boolean;
  flagReason: string | null;
  flaggedAt: string | null;
}

const Spinner = () => (
  <svg className="animate-spin h-3.5 w-3.5 text-white" viewBox="0 0 24 24" fill="none">
    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
  </svg>
);

export default function FlaggedUsersManagement() {
  const [searchTerm, setSearchTerm] = useState("");
  const { data, isLoading } = useGetFlaggedUsersQuery(undefined);
  const [clearFlag, { isLoading: isClearing }] = useClearFlagMutation();

  const flaggedUsers: FlaggedUser[] = data?.data ?? [];

  const filteredUsers = flaggedUsers.filter((user) => {
    const term = searchTerm.toLowerCase();
    return (
      user.name.toLowerCase().includes(term) ||
      user.username.toLowerCase().includes(term) ||
      user.email.toLowerCase().includes(term) ||
      (user.schoolId && user.schoolId.toLowerCase().includes(term)) ||
      (user.flagReason && user.flagReason.toLowerCase().includes(term))
    );
  });

  const handleClearFlag = async (userId: string, name: string) => {
    if (!window.confirm(`Are you sure you want to clear the suspicious points flag for "${name}"?`)) {
      return;
    }

    try {
      await clearFlag(userId).unwrap();
      toast.success(`Successfully cleared flag for ${name}`);
    } catch (error: any) {
      toast.error(error?.data?.message || "Failed to clear flag");
    }
  };

  const formatDate = (dateStr: string | null) => {
    if (!dateStr) return "N/A";
    return new Date(dateStr).toLocaleDateString("en-PH", {
      month: "short",
      day: "numeric",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  if (isLoading) {
    return (
      <div className="space-y-4 animate-pulse">
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          {[1, 2, 3].map((i) => (
            <div key={i} className="h-24 bg-gray-900 border border-white/5 rounded-2xl" />
          ))}
        </div>
        <div className="h-12 bg-gray-900 border border-white/5 rounded-2xl" />
        {[1, 2, 3].map((i) => (
          <div key={i} className="h-20 bg-gray-900 border border-white/5 rounded-2xl" />
        ))}
      </div>
    );
  }

  return (
    <div className="space-y-5">
      {/* Header */}
      <div>
        <h1 className="text-white text-xl font-bold tracking-tight">Flagged Accounts</h1>
        <p className="text-gray-500 text-xs mt-0.5">
          Review and clear accounts automatically flagged for suspicious point acquisition or rules violation
        </p>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
        <div className="bg-gray-900 border border-white/5 rounded-2xl p-4 flex items-center gap-4">
          <div className="w-10 h-10 rounded-xl bg-red-500/10 border border-red-500/20 flex items-center justify-center shrink-0">
            <FaUserTimes size={16} className="text-red-400" />
          </div>
          <div>
            <p className="text-2xl font-bold text-white leading-none">{flaggedUsers.length}</p>
            <p className="text-gray-500 text-xs mt-1 font-semibold">Total Flagged Accounts</p>
          </div>
        </div>

        <div className="bg-gray-900 border border-white/5 rounded-2xl p-4 flex items-center gap-4">
          <div className="w-10 h-10 rounded-xl bg-amber-500/10 border border-amber-500/20 flex items-center justify-center shrink-0">
            <FaExclamationTriangle size={15} className="text-amber-400" />
          </div>
          <div>
            <p className="text-2xl font-bold text-white leading-none">
              {flaggedUsers.filter(u => u.flagReason?.toLowerCase().includes("multiplier") || u.flagReason?.toLowerCase().includes("average")).length}
            </p>
            <p className="text-gray-500 text-xs mt-1 font-semibold">Point Abuse Triggers</p>
          </div>
        </div>

        <div className="bg-gray-900 border border-white/5 rounded-2xl p-4 flex items-center gap-4">
          <div className="w-10 h-10 rounded-xl bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center shrink-0">
            <FaUserShield size={16} className="text-emerald-400" />
          </div>
          <div>
            <p className="text-2xl font-bold text-white leading-none">
              {flaggedUsers.filter(u => !u.isFlagged).length}
            </p>
            <p className="text-gray-500 text-xs mt-1 font-semibold">Pending Review Cases</p>
          </div>
        </div>
      </div>

      {/* Filter / Search Bar */}
      <div className="bg-gray-900 border border-white/5 rounded-2xl p-4">
        <div className="relative">
          <FaSearch className="absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-600" size={11} />
          <input
            type="text"
            placeholder="Search flagged users by name, email, school ID, or reason..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-9 pr-4 py-2.5 bg-gray-800/80 border border-transparent rounded-xl text-white text-sm placeholder-gray-600 focus:outline-none focus:ring-2 focus:ring-blue-500/30 transition-all"
          />
        </div>
      </div>

      {/* Main Table / List */}
      <div className="bg-gray-900 border border-white/5 rounded-2xl overflow-hidden shadow-xl">
        <div className="px-5 py-3.5 border-b border-white/5 flex items-center justify-between">
          <h2 className="text-xs font-bold text-gray-400 uppercase tracking-widest">Flagged Users Queue</h2>
          <span className="text-[10px] text-gray-600">{filteredUsers.length} active flag{filteredUsers.length !== 1 && "s"}</span>
        </div>

        {/* Desktop View */}
        <div className="hidden md:block overflow-x-auto custom-scrollbar">
          <table className="w-full table-fixed min-w-[900px] border-separate border-spacing-0">
            <thead>
              <tr className="bg-gray-800/10 border-b border-white/5">
                <th className="px-6 py-4 text-left text-[10px] font-bold text-gray-500 uppercase tracking-widest w-[25%]">Student</th>
                <th className="px-6 py-4 text-left text-[10px] font-bold text-gray-500 uppercase tracking-widest w-[12%]">Points Balance</th>
                <th className="px-6 py-4 text-left text-[10px] font-bold text-gray-500 uppercase tracking-widest w-[20%]">Flagged At</th>
                <th className="px-6 py-4 text-left text-[10px] font-bold text-gray-500 uppercase tracking-widest w-[33%]">Reason for Flag</th>
                <th className="px-6 py-4 text-right text-[10px] font-bold text-gray-500 uppercase tracking-widest w-[10%]">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-white/[0.04]">
              {filteredUsers.length === 0 ? (
                <tr>
                  <td colSpan={5} className="px-6 py-16 text-center">
                    <FaUserShield className="mx-auto text-emerald-500/20 mb-3" size={32} />
                    <p className="text-gray-400 text-sm font-semibold">All Clear!</p>
                    <p className="text-gray-600 text-xs mt-1">No flagged user accounts match the filter criteria.</p>
                  </td>
                </tr>
              ) : (
                filteredUsers.map((user) => (
                  <tr key={user.id} className="hover:bg-white/[0.01] transition-colors group">
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-3">
                        <div className="w-8 h-8 rounded-full bg-red-500/10 border border-red-500/20 flex items-center justify-center shrink-0">
                          <span className="text-red-400 text-xs font-bold">{user.name.charAt(0).toUpperCase()}</span>
                        </div>
                        <div className="min-w-0">
                          <p className="text-white text-xs font-semibold truncate leading-normal">{user.name}</p>
                          <p className="text-gray-500 text-[10px] truncate leading-normal">@{user.username} • {user.schoolId || "No ID"}</p>
                          <p className="text-gray-500 text-[9px] truncate leading-none mt-0.5">{user.email}</p>
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <span className="text-amber-400 text-xs font-black font-mono">
                        {user.totalPoints.toLocaleString()} pts
                      </span>
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-1.5 text-gray-400 text-xs font-medium">
                        <FaCalendarAlt size={9} className="opacity-60" />
                        <span>{formatDate(user.flaggedAt)}</span>
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <div className="bg-red-500/5 border border-red-500/10 text-red-400 text-[11px] rounded-lg px-3 py-1.5 font-medium leading-relaxed max-w-full overflow-hidden text-ellipsis whitespace-normal">
                        {user.flagReason || "Flagged by system security monitor."}
                      </div>
                    </td>
                    <td className="px-6 py-4 text-right">
                      <button
                        onClick={() => handleClearFlag(user.id, user.name)}
                        disabled={isClearing}
                        className="px-2.5 py-1.5 bg-emerald-500/10 hover:bg-emerald-500/20 border border-emerald-500/20 text-emerald-400 text-[10px] font-bold rounded-lg transition-all flex items-center gap-1 ml-auto shrink-0 disabled:opacity-50"
                      >
                        {isClearing ? <Spinner /> : <FaCheck size={8} />}
                        <span>Clear Flag</span>
                      </button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        {/* Mobile View */}
        <div className="md:hidden divide-y divide-white/[0.04]">
          {filteredUsers.length === 0 ? (
            <div className="p-8 text-center">
              <FaUserShield className="mx-auto text-emerald-500/20 mb-2" size={28} />
              <p className="text-gray-400 text-xs font-semibold">No flagged accounts</p>
            </div>
          ) : (
            filteredUsers.map((user) => (
              <div key={user.id} className="p-4 space-y-3">
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 rounded-full bg-red-500/10 border border-red-500/20 flex items-center justify-center shrink-0">
                    <span className="text-red-400 text-xs font-bold">{user.name.charAt(0).toUpperCase()}</span>
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-white text-xs font-bold truncate leading-normal">{user.name}</p>
                    <p className="text-gray-500 text-[10px] truncate leading-normal">
                      @{user.username} • {user.schoolId || "No ID"}
                    </p>
                  </div>
                  <span className="text-amber-400 text-xs font-black font-mono">
                    {user.totalPoints} pts
                  </span>
                </div>

                <div className="bg-red-500/5 border border-red-500/10 text-red-400 text-[11px] rounded-lg p-2.5 font-medium">
                  <p className="text-[9px] uppercase tracking-wider text-red-500/60 font-bold mb-1">Reason</p>
                  {user.flagReason || "Flagged by system security monitor."}
                </div>

                <div className="flex items-center justify-between gap-4 pt-1">
                  <div className="flex items-center gap-1.5 text-gray-500 text-[10px]">
                    <FaCalendarAlt size={9} />
                    <span>{formatDate(user.flaggedAt)}</span>
                  </div>
                  <button
                    onClick={() => handleClearFlag(user.id, user.name)}
                    disabled={isClearing}
                    className="px-3 py-1.5 bg-emerald-500/10 hover:bg-emerald-500/20 border border-emerald-500/20 text-emerald-400 text-[10px] font-bold rounded-lg transition-colors flex items-center gap-1 shrink-0 disabled:opacity-50"
                  >
                    {isClearing ? <Spinner /> : <FaCheck size={8} />}
                    <span>Clear Flag</span>
                  </button>
                </div>
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  );
}
