import { useState } from "react";
import {
  FaSearch, FaUsers, FaUserCheck, FaUserTimes, FaUserShield,
  FaTrash, FaTimes, FaCheck, FaChevronDown,
  FaIdCard, FaGraduationCap, FaStar, FaComment
} from "react-icons/fa";
import { useNavigate } from "react-router-dom";
import { MdAdminPanelSettings } from "react-icons/md";
import { toast } from "react-toastify";
import {
  useGetAllUsersQuery,
  useBlockUserMutation,
  useChangeUserRoleMutation,
  useSoftDeleteUserMutation,
} from "../../redux/api/api";
import { useInitiateChatMutation } from "../../redux/api/chatApi";

interface Student {
  id: string;
  username: string;
  name?: string;
  schoolId?: string;
  email: string;
  role: string;
  activated: boolean;
  course?: string;
  yearLevel?: string;
  totalPoints?: number;
  createdAt: string;
}

const Spinner = ({ color = "text-white" }: { color?: string }) => (
  <svg className={`animate-spin h-4 w-4 ${color}`} viewBox="0 0 24 24" fill="none">
    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
  </svg>
);

const getInitials = (name?: string, email?: string) => {
  if (name) return name.split(" ").slice(0, 2).map((w) => w[0]).join("").toUpperCase();
  return (email?.[0] ?? "?").toUpperCase();
};

const ROLES = ["USER", "ADMIN"] as const;

const StudentRegistry = () => {
  const [searchTerm, setSearchTerm]     = useState("");
  const [statusFilter, setStatusFilter] = useState<"ALL" | "ACTIVE" | "BLOCKED">("ALL");
  const [courseFilter, setCourseFilter] = useState("ALL");
  const [courseOpen, setCourseOpen]     = useState(false);

  const [blockModalOpen, setBlockModalOpen] = useState(false);
  const [blockTarget, setBlockTarget]       = useState<Student | null>(null);
  const [isBlockLoading, setIsBlockLoading] = useState(false);

  const [roleModalOpen, setRoleModalOpen] = useState(false);
  const [roleTarget, setRoleTarget]       = useState<Student | null>(null);
  const [selectedRole, setSelectedRole]   = useState<string>("USER");
  const [isRoleLoading, setIsRoleLoading] = useState(false);

  const [deleteModalOpen, setDeleteModalOpen] = useState(false);
  const [deleteTarget, setDeleteTarget]       = useState<Student | null>(null);
  const [isDeleteLoading, setIsDeleteLoading] = useState(false);

  const { data: usersData, isLoading, error } = useGetAllUsersQuery(undefined);
  const [blockUser]      = useBlockUserMutation();
  const [changeUserRole] = useChangeUserRoleMutation();
  const [softDeleteUser] = useSoftDeleteUserMutation();
  const [initiateChat]   = useInitiateChatMutation();
  const navigate = useNavigate();

  const handleStartChat = async (student: Student) => {
    try {
      const res = await initiateChat({ studentId: student.id }).unwrap();
      if (res.data?.id) {
        navigate(`/dashboard/chat?roomId=${res.data.id}`);
      } else {
        toast.error("Could not determine chat room ID.");
      }
    } catch (err: any) {
      toast.error(err.data?.message || "Failed to initiate chat.");
    }
  };

  if (isLoading)
    return (
      <div className="space-y-4 animate-pulse">
        <div className="grid grid-cols-4 gap-3">
          {[1, 2, 3, 4].map((i) => <div key={i} className="h-28 bg-gray-900 border border-white/5 rounded-2xl" />)}
        </div>
        {[1, 2, 3, 4, 5].map((i) => <div key={i} className="h-14 bg-gray-900 border border-white/5 rounded-xl" />)}
      </div>
    );

  if (error)
    return (
      <div className="bg-red-500/5 border border-red-500/20 rounded-2xl p-6">
        <p className="text-red-400 text-sm">Error loading students. Please try again.</p>
      </div>
    );

  const allStudents: Student[] = (usersData?.data ?? usersData ?? []).filter(
    (s: Student) => s.role !== "ADMIN"
  );

  const courses = [...new Set(allStudents.map((s) => s.course).filter(Boolean))] as string[];

  const filteredStudents = allStudents.filter((s) => {
    const q = searchTerm.toLowerCase();
    const matchSearch =
      !q ||
      s.name?.toLowerCase().includes(q) ||
      s.username?.toLowerCase().includes(q) ||
      s.schoolId?.includes(q) ||
      s.email.toLowerCase().includes(q);
    const matchStatus =
      statusFilter === "ALL" ||
      (statusFilter === "BLOCKED" && !s.activated) ||
      (statusFilter === "ACTIVE" && s.activated);
    const matchCourse = courseFilter === "ALL" || s.course === courseFilter;
    return matchSearch && matchStatus && matchCourse;
  });

  const totalActive  = allStudents.filter((s) => s.activated).length;
  const totalBlocked = allStudents.filter((s) => !s.activated).length;
  const totalAdmins  = allStudents.filter((s) => s.role === "ADMIN").length;

  const handleBlockConfirm = async () => {
    if (!blockTarget) return;
    setIsBlockLoading(true);
    try {
      await blockUser(blockTarget.id).unwrap();
      toast.success(
        !blockTarget.activated
          ? `${blockTarget.name ?? blockTarget.username} has been unblocked.`
          : `${blockTarget.name ?? blockTarget.username} has been blocked.`
      );
      setBlockModalOpen(false);
      setBlockTarget(null);
    } catch {
      toast.error("Failed to update block status.");
    } finally {
      setIsBlockLoading(false);
    }
  };

  const handleRoleConfirm = async () => {
    if (!roleTarget) return;
    setIsRoleLoading(true);
    try {
      await changeUserRole({ id: roleTarget.id, role: selectedRole }).unwrap();
      toast.success(`Role updated to ${selectedRole}.`);
      setRoleModalOpen(false);
      setRoleTarget(null);
    } catch {
      toast.error("Failed to update role.");
    } finally {
      setIsRoleLoading(false);
    }
  };

  const handleDeleteConfirm = async () => {
    if (!deleteTarget) return;
    setIsDeleteLoading(true);
    try {
      await softDeleteUser(deleteTarget.id).unwrap();
      toast.success(`${deleteTarget.name ?? deleteTarget.username} has been deleted.`);
      setDeleteModalOpen(false);
      setDeleteTarget(null);
    } catch {
      toast.error("Failed to delete student.");
    } finally {
      setIsDeleteLoading(false);
    }
  };

  const STATUS_TABS = [
    { label: "All",     value: "ALL"     as const },
    { label: "Active",  value: "ACTIVE"  as const },
    { label: "Blocked", value: "BLOCKED" as const },
  ];

  return (
    <div className="space-y-4 sm:space-y-6 max-w-7xl mx-auto">

      {/* ── Stats ── */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {[
          { label: "Total Students", value: allStudents.length, icon: <FaUsers size={14} className="text-blue-400" />,       accent: "bg-blue-500/5",   sub: "registered accounts", subColor: "text-blue-400"   },
          { label: "Active",         value: totalActive,        icon: <FaUserCheck size={14} className="text-green-400" />,  accent: "bg-green-500/5",  sub: "currently active",    subColor: "text-green-400"  },
          { label: "Blocked",        value: totalBlocked,       icon: <FaUserTimes size={14} className="text-red-400" />,    accent: "bg-red-500/5",    sub: "restricted access",   subColor: "text-red-400"    },
          { label: "Admins",         value: totalAdmins,        icon: <FaUserShield size={14} className="text-violet-400" />,accent: "bg-violet-500/5", sub: "elevated roles",      subColor: "text-violet-400" },
        ].map(({ label, value, icon, accent, sub, subColor }) => (
          <div key={label} className="relative bg-gray-900 border border-white/5 rounded-2xl p-2.5 flex flex-col gap-2 overflow-hidden">
            <div className={`absolute inset-0 opacity-30 ${accent} blur-3xl scale-150 pointer-events-none`} />
            <div className="relative">
              <div className={`w-8 h-8 rounded-xl flex items-center justify-center ${accent}`}>{icon}</div>
            </div>
            <div className="relative">
              <p className="text-lg sm:text-xl font-bold text-white tracking-tight">{value}</p>
              <p className="text-gray-500 text-[11px] mt-0.5 font-medium">{label}</p>
              <p className={`text-[10px] mt-1 font-medium ${subColor}`}>{sub}</p>
            </div>
          </div>
        ))}
      </div>

      {/* ── Filters ── */}
      <div className="bg-gray-900 border border-white/5 rounded-2xl p-4 sm:p-5">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex-1 min-w-0 flex flex-col gap-3 sm:flex-row sm:items-center">
            <div className="relative flex-1 group">
              <FaSearch className="absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-500 group-focus-within:text-violet-400 transition-colors" size={12} />
              <input
                type="text"
                placeholder="Search by name, ID or email..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-10 pr-4 py-2.5 bg-gray-800/80 border border-white/10 rounded-2xl text-white text-sm placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-violet-500/20 focus:border-violet-500/20 transition-all"
              />
            </div>

            {courses.length > 0 && (
              <div className="relative w-full sm:w-64">
                <button
                  type="button"
                  onClick={() => setCourseOpen((o) => !o)}
                  className="w-full flex items-center justify-between px-4 py-2.5 bg-gray-800/80 border border-white/10 rounded-2xl text-white text-sm focus:outline-none transition-all"
                >
                  <span className="truncate text-left">{courseFilter === "ALL" ? "All Courses" : courseFilter}</span>
                  <FaChevronDown size={11} className={`text-gray-400 shrink-0 ml-2 transition-transform duration-200 ${courseOpen ? "rotate-180" : ""}`} />
                </button>
                {courseOpen && (
                  <div className="absolute z-50 top-full mt-2 left-0 w-full bg-gray-900 border border-white/10 rounded-2xl shadow-2xl overflow-hidden">
                    <div className="max-h-56 overflow-y-auto">
                      {[{ id: "ALL", name: "All Courses" }, ...courses.map((c) => ({ id: c, name: c }))].map((opt) => (
                        <button
                          key={opt.id}
                          type="button"
                          onClick={() => { setCourseFilter(opt.id === "ALL" ? "ALL" : opt.name); setCourseOpen(false); }}
                          className={`w-full text-left px-4 py-2.5 text-sm transition-colors flex items-center justify-between ${
                            courseFilter === opt.id || courseFilter === opt.name
                              ? "bg-white/5 text-white font-semibold"
                              : "text-gray-400 hover:bg-white/[0.03] hover:text-white"
                          }`}
                        >
                          {opt.name}
                          {(courseFilter === opt.id || courseFilter === opt.name) && (
                            <FaCheck size={9} className="text-gray-400 shrink-0" />
                          )}
                        </button>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            )}
          </div>

          <div className="flex justify-end">
            <div className="inline-flex gap-1 bg-gray-800/40 border border-white/10 rounded-2xl p-1">
              {STATUS_TABS.map(({ label, value }) => (
                <button
                  key={value}
                  onClick={() => setStatusFilter(value)}
                  className={`px-3 py-2 rounded-xl text-xs font-semibold whitespace-nowrap focus:outline-none select-none ${
                    statusFilter === value
                      ? "bg-violet-500/10 text-violet-300 border border-violet-500/20"
                      : "text-gray-400"
                  }`}
                >
                  {label}
                </button>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* ── Table — desktop ── */}
      {/* Col layout (12 total): Student=3, Course=4, SchoolID=2, Year=1, Status=1, Role=1, Actions=1 (Points removed from header, shown in tooltip) */}
      <div className="hidden md:block bg-gray-900 border border-white/5 rounded-2xl overflow-hidden">
        <div className="grid grid-cols-12 gap-2 px-5 py-3 border-b border-white/5 text-[10px] uppercase tracking-widest text-gray-600 font-semibold">
          <div className="col-span-3">Student</div>
          <div className="col-span-4">Course</div>
          <div className="col-span-2">School ID</div>
          <div className="col-span-1">Status</div>
          <div className="col-span-1 text-center">Role</div>
          <div className="col-span-1 text-right">Actions</div>
        </div>

        {filteredStudents.length === 0 ? (
          <div className="py-20 text-center">
            <FaSearch size={28} className="text-gray-700 mx-auto mb-3" />
            <p className="text-gray-500 text-sm font-medium">No students found</p>
            <p className="text-gray-700 text-xs mt-1">Try adjusting your filters</p>
          </div>
        ) : (
          <div className="divide-y divide-white/[0.04]">
            {filteredStudents.map((s) => (
              <div key={s.id} className="grid grid-cols-12 gap-2 items-center px-5 py-4 hover:bg-white/[0.02] transition-colors">

                {/* Student */}
                <div className="col-span-3 flex items-center gap-2.5 min-w-0">
                  <div className="w-8 h-8 rounded-full bg-gradient-to-br from-blue-600 to-cyan-500 flex items-center justify-center text-white text-xs font-bold shrink-0">
                    {getInitials(s.name, s.email)}
                  </div>
                  <div className="min-w-0">
                    <p className="text-white text-sm font-medium truncate">{s.name ?? s.username}</p>
                    <p className="text-gray-500 text-xs truncate">{s.email}</p>
                  </div>
                </div>

                {/* Course — wide enough to show full name */}
                <div className="col-span-4">
                  <div className="flex items-center gap-1.5 text-gray-400 text-xs">
                    <FaGraduationCap size={9} className="text-blue-400 shrink-0" />
                    <span title={s.course}>{s.course ?? "—"}</span>
                  </div>
                  {s.yearLevel && (
                    <p className="text-gray-600 text-[10px] mt-0.5 pl-[14px]">{s.yearLevel}</p>
                  )}
                </div>

                {/* School ID */}
                <div className="col-span-2">
                  <div className="flex items-center gap-1.5 text-gray-400 text-xs">
                    <FaIdCard size={9} className="text-cyan-400 shrink-0" />
                    <span>{s.schoolId ?? "—"}</span>
                  </div>
                  <div className="flex items-center gap-1 text-yellow-400 text-[10px] mt-0.5 pl-[14px]">
                    <FaStar size={8} />
                    <span>{s.totalPoints ?? 0} pts</span>
                  </div>
                </div>

                {/* Status */}
                <div className="col-span-1">
                  <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-bold border ${
                    !s.activated
                      ? "bg-red-400/10 text-red-400 border-red-400/20"
                      : "bg-emerald-400/10 text-emerald-400 border-emerald-400/20"
                  }`}>
                    {!s.activated ? "Blocked" : "Active"}
                  </span>
                </div>

                {/* Role */}
                <div className="col-span-1 flex justify-center">
                  <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-bold border ${
                    s.role === "ADMIN"
                      ? "bg-violet-400/10 text-violet-400 border-violet-400/20"
                      : "bg-white/5 text-gray-400 border-white/10"
                  }`}>
                    {s.role}
                  </span>
                </div>

                {/* Actions */}
                <div className="col-span-1 flex items-center justify-end gap-1">
                  <button
                    onClick={() => handleStartChat(s)}
                    title="Message Student"
                    className="w-7 h-7 rounded-lg bg-blue-500/10 hover:bg-blue-500/20 border border-blue-500/20 flex items-center justify-center text-blue-400 transition-colors"
                  >
                    <FaComment size={11} />
                  </button>
                  <button
                    onClick={() => { setBlockTarget(s); setBlockModalOpen(true); }}
                    title={!s.activated ? "Unblock" : "Block"}
                    className={`w-7 h-7 rounded-lg flex items-center justify-center border transition-colors ${
                      !s.activated
                        ? "bg-emerald-500/10 hover:bg-emerald-500/20 border-emerald-500/20 text-emerald-400"
                        : "bg-orange-500/10 hover:bg-orange-500/20 border-orange-500/20 text-orange-400"
                    }`}
                  >
                    {!s.activated ? <FaCheck size={11} /> : <FaTimes size={11} />}
                  </button>
                  <button
                    onClick={() => { setRoleTarget(s); setSelectedRole(s.role); setRoleModalOpen(true); }}
                    title="Change Role"
                    className="w-7 h-7 rounded-lg bg-violet-500/10 hover:bg-violet-500/20 border border-violet-500/20 flex items-center justify-center text-violet-400 transition-colors"
                  >
                    <MdAdminPanelSettings size={13} />
                  </button>
                  <button
                    onClick={() => { setDeleteTarget(s); setDeleteModalOpen(true); }}
                    title="Delete"
                    className="w-7 h-7 rounded-lg bg-red-500/10 hover:bg-red-500/20 border border-red-500/20 flex items-center justify-center text-red-400 transition-colors"
                  >
                    <FaTrash size={11} />
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* ── Cards — mobile ── */}
      <div className="md:hidden space-y-3">
        {filteredStudents.length === 0 ? (
          <div className="py-16 text-center bg-gray-900 border border-white/5 rounded-2xl">
            <FaSearch size={24} className="text-gray-700 mx-auto mb-3" />
            <p className="text-gray-500 text-sm">No students found</p>
          </div>
        ) : filteredStudents.map((s) => (
          <div key={s.id} className="bg-gray-900 border border-white/5 rounded-2xl p-4 space-y-3">
            <div className="flex items-start justify-between gap-2">
              <div className="flex items-center gap-2.5 min-w-0">
                <div className="w-9 h-9 rounded-full bg-gradient-to-br from-blue-600 to-cyan-500 flex items-center justify-center text-white text-xs font-bold shrink-0">
                  {getInitials(s.name, s.email)}
                </div>
                <div className="min-w-0">
                  <p className="text-white font-semibold text-sm truncate">{s.name ?? s.username}</p>
                  <p className="text-gray-500 text-xs truncate">{s.email}</p>
                </div>
              </div>
              <div className="flex flex-col items-end gap-1 shrink-0">
                <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold border ${
                  !s.activated ? "bg-red-400/10 text-red-400 border-red-400/20" : "bg-emerald-400/10 text-emerald-400 border-emerald-400/20"
                }`}>{!s.activated ? "Blocked" : "Active"}</span>
                <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold border ${
                  s.role === "ADMIN" ? "bg-violet-400/10 text-violet-400 border-violet-400/20" : "bg-white/5 text-gray-400 border-white/10"
                }`}>{s.role}</span>
              </div>
            </div>
            <div className="grid grid-cols-2 gap-2 text-xs pt-1 border-t border-white/5">
              <div><p className="text-gray-600 text-[10px] uppercase tracking-widest">School ID</p><p className="text-gray-300 mt-0.5">{s.schoolId ?? "—"}</p></div>
              <div><p className="text-gray-600 text-[10px] uppercase tracking-widest">Course</p><p className="text-gray-300 mt-0.5">{s.course ?? "—"}</p></div>
              <div><p className="text-gray-600 text-[10px] uppercase tracking-widest">Year Level</p><p className="text-gray-300 mt-0.5">{s.yearLevel ?? "—"}</p></div>
              <div><p className="text-gray-600 text-[10px] uppercase tracking-widest">Points</p><p className="text-yellow-400 mt-0.5 flex items-center gap-1"><FaStar size={9} />{s.totalPoints ?? 0}</p></div>
            </div>
            <div className="flex gap-2 pt-1">
              <button
                onClick={() => handleStartChat(s)}
                className="flex-1 flex items-center justify-center gap-1.5 py-2 bg-blue-500/10 border border-blue-500/20 text-blue-400 rounded-xl text-xs font-semibold transition-all"
              >
                <FaComment size={10} /> Message
              </button>
              <button
                onClick={() => { setBlockTarget(s); setBlockModalOpen(true); }}
                className={`flex-1 flex items-center justify-center gap-1.5 py-2 rounded-xl text-xs font-semibold border transition-all ${
                  !s.activated
                    ? "bg-emerald-500/10 border-emerald-500/20 text-emerald-400"
                    : "bg-orange-500/10 border-orange-500/20 text-orange-400"
                }`}
              >
                {!s.activated ? <><FaCheck size={10} /> Unblock</> : <><FaTimes size={10} /> Block</>}
              </button>
              <button
                onClick={() => { setRoleTarget(s); setSelectedRole(s.role); setRoleModalOpen(true); }}
                className="flex-1 flex items-center justify-center gap-1.5 py-2 bg-violet-500/10 border border-violet-500/20 text-violet-400 rounded-xl text-xs font-semibold transition-all"
              >
                <MdAdminPanelSettings size={12} /> Role
              </button>
              <button
                onClick={() => { setDeleteTarget(s); setDeleteModalOpen(true); }}
                className="flex-1 flex items-center justify-center gap-1.5 py-2 bg-red-500/10 border border-red-500/20 text-red-400 rounded-xl text-xs font-semibold transition-all"
              >
                <FaTrash size={10} /> Delete
              </button>
            </div>
          </div>
        ))}
      </div>

      {/* ── Block / Unblock Modal ── */}
      {blockModalOpen && blockTarget && (
        <div className="fixed inset-0 bg-black/70 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-gray-900 border border-white/10 rounded-2xl w-full max-w-sm shadow-2xl">
            <div className="flex items-center justify-between px-5 py-3.5 border-b border-white/5">
              <div className="flex items-center gap-3">
                <div className={`w-7 h-7 rounded-lg flex items-center justify-center shrink-0 ${
                  !blockTarget.activated
                    ? "bg-emerald-500/10 border border-emerald-500/20"
                    : "bg-orange-500/10 border border-orange-500/20"
                }`}>
                  {!blockTarget.activated
                    ? <FaCheck size={11} className="text-emerald-400" />
                    : <FaTimes size={11} className="text-orange-400" />}
                </div>
                <div>
                  <h2 className="text-sm font-bold text-white">
                    {!blockTarget.activated ? "Unblock" : "Block"} Student
                  </h2>
                  <p className="text-gray-500 text-[11px]">
                    {!blockTarget.activated ? "Restore account access" : "Suspend account access"}
                  </p>
                </div>
              </div>
              <button onClick={() => { setBlockModalOpen(false); setBlockTarget(null); }} disabled={isBlockLoading}
                className="w-7 h-7 rounded-lg bg-white/5 hover:bg-white/10 flex items-center justify-center text-gray-400 hover:text-white transition-colors">
                <FaTimes size={12} />
              </button>
            </div>
            <div className="p-5 space-y-4">
              <div className="bg-gray-800/60 border border-white/5 rounded-xl overflow-hidden">
                <div className="flex items-center gap-2 px-3 py-2 border-b border-white/5">
                  <FaUsers size={10} className="text-cyan-400" />
                  <p className="text-[10px] font-bold text-cyan-400 uppercase tracking-widest">Student</p>
                </div>
                <div className="p-3">
                  <p className="text-white text-sm font-semibold">{blockTarget.name ?? blockTarget.username}</p>
                  <p className="text-gray-400 text-xs mt-0.5">{blockTarget.schoolId ?? "—"} · {blockTarget.email}</p>
                </div>
              </div>
              <div className={`border rounded-xl px-3.5 py-2.5 ${
                !blockTarget.activated ? "bg-emerald-500/5 border-emerald-500/15" : "bg-orange-500/5 border-orange-500/15"
              }`}>
                <p className={`text-xs leading-relaxed ${!blockTarget.activated ? "text-emerald-300/80" : "text-orange-300/80"}`}>
                  {!blockTarget.activated
                    ? "This will restore the student's ability to log in and use the system."
                    : "This will prevent the student from logging in. Their data will be preserved."}
                </p>
              </div>
              <div className="flex gap-2">
                <button onClick={() => { setBlockModalOpen(false); setBlockTarget(null); }} disabled={isBlockLoading}
                  className="flex-1 bg-gray-800 hover:bg-gray-700 disabled:opacity-50 border border-white/5 text-gray-300 py-2.5 rounded-xl text-xs font-medium transition-colors">
                  Cancel
                </button>
                <button onClick={handleBlockConfirm} disabled={isBlockLoading}
                  className={`flex-1 disabled:opacity-50 py-2.5 rounded-xl text-xs font-semibold transition-all flex items-center justify-center gap-1.5 border ${
                    !blockTarget.activated
                      ? "bg-emerald-500/10 hover:bg-emerald-500 border-emerald-500/30 text-emerald-400 hover:text-white"
                      : "bg-orange-500/10 hover:bg-orange-500 border-orange-500/30 text-orange-400 hover:text-white"
                  }`}>
                  {isBlockLoading ? <Spinner /> : !blockTarget.activated ? "Unblock Account" : "Block Account"}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ── Change Role Modal ── */}
      {roleModalOpen && roleTarget && (
        <div className="fixed inset-0 bg-black/70 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-gray-900 border border-white/10 rounded-2xl w-full max-w-sm shadow-2xl">
            <div className="flex items-center justify-between px-5 py-3.5 border-b border-white/5">
              <div className="flex items-center gap-3">
                <div className="w-7 h-7 rounded-lg bg-violet-500/10 border border-violet-500/20 flex items-center justify-center shrink-0">
                  <MdAdminPanelSettings size={13} className="text-violet-400" />
                </div>
                <div>
                  <h2 className="text-sm font-bold text-white">Change Role</h2>
                  <p className="text-gray-500 text-[11px]">Update {roleTarget.name?.split(" ")[0] ?? roleTarget.username}'s system role</p>
                </div>
              </div>
              <button onClick={() => { setRoleModalOpen(false); setRoleTarget(null); }} disabled={isRoleLoading}
                className="w-7 h-7 rounded-lg bg-white/5 hover:bg-white/10 flex items-center justify-center text-gray-400 hover:text-white transition-colors">
                <FaTimes size={12} />
              </button>
            </div>
            <div className="p-5 space-y-3">
              {ROLES.map((role) => (
                <button key={role} type="button" onClick={() => setSelectedRole(role)}
                  className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl border text-left transition-all ${
                    selectedRole === role
                      ? "bg-violet-500/[0.08] border-violet-500/25"
                      : "bg-gray-800/40 border-white/5 hover:bg-white/[0.03]"
                  }`}>
                  <div className={`w-4 h-4 rounded-full border-2 flex items-center justify-center shrink-0 transition-colors ${
                    selectedRole === role ? "border-violet-400" : "border-white/20"
                  }`}>
                    {selectedRole === role && <div className="w-1.5 h-1.5 rounded-full bg-violet-400" />}
                  </div>
                  <div>
                    <p className="text-white text-xs font-semibold">{role}</p>
                    <p className="text-gray-500 text-[11px] mt-0.5">
                      {role === "ADMIN" ? "Full dashboard access & management" : "Can report, claim and view items"}
                    </p>
                  </div>
                </button>
              ))}
              <div className="flex gap-2 pt-1">
                <button onClick={() => { setRoleModalOpen(false); setRoleTarget(null); }} disabled={isRoleLoading}
                  className="flex-1 bg-gray-800 hover:bg-gray-700 disabled:opacity-50 border border-white/5 text-gray-300 py-2.5 rounded-xl text-xs font-medium transition-colors">
                  Cancel
                </button>
                <button onClick={handleRoleConfirm} disabled={isRoleLoading}
                  className="flex-1 bg-violet-500/10 hover:bg-violet-500 border border-violet-500/30 text-violet-400 hover:text-white disabled:opacity-50 py-2.5 rounded-xl text-xs font-semibold transition-all flex items-center justify-center gap-1.5">
                  {isRoleLoading ? <><Spinner /> Updating...</> : <><MdAdminPanelSettings size={11} /> Update Role</>}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ── Delete Modal ── */}
      {deleteModalOpen && deleteTarget && (
        <div className="fixed inset-0 bg-black/70 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-gray-900 border border-white/10 rounded-2xl w-full max-w-sm shadow-2xl">
            <div className="flex items-center justify-between px-5 py-3.5 border-b border-white/5">
              <div className="flex items-center gap-3">
                <div className="w-7 h-7 rounded-lg bg-red-500/10 border border-red-500/20 flex items-center justify-center shrink-0">
                  <FaTrash size={11} className="text-red-400" />
                </div>
                <div>
                  <h2 className="text-sm font-bold text-white">Delete Student</h2>
                  <p className="text-gray-500 text-[11px]">This action cannot be undone</p>
                </div>
              </div>
              <button onClick={() => { setDeleteModalOpen(false); setDeleteTarget(null); }} disabled={isDeleteLoading}
                className="w-7 h-7 rounded-lg bg-white/5 hover:bg-white/10 flex items-center justify-center text-gray-400 hover:text-white transition-colors">
                <FaTimes size={12} />
              </button>
            </div>
            <div className="p-5 space-y-4">
              <div className="bg-gray-800/60 border border-white/5 rounded-xl overflow-hidden">
                <div className="flex items-center gap-2 px-3 py-2 border-b border-white/5">
                  <FaUsers size={10} className="text-cyan-400" />
                  <p className="text-[10px] font-bold text-cyan-400 uppercase tracking-widest">Student to Delete</p>
                </div>
                <div className="p-3 space-y-1.5">
                  <p className="text-white text-sm font-semibold">{deleteTarget.name ?? deleteTarget.username}</p>
                  <p className="text-gray-400 text-xs">{deleteTarget.email}</p>
                  <div className="flex items-center gap-3 pt-1 text-[10px] text-gray-500">
                    <span className="flex items-center gap-1"><FaIdCard size={8} className="text-cyan-400" />{deleteTarget.schoolId ?? "—"}</span>
                    <span className="flex items-center gap-1"><FaStar size={8} className="text-yellow-400" />{deleteTarget.totalPoints ?? 0} pts</span>
                  </div>
                </div>
              </div>
              <div className="bg-red-500/5 border border-red-500/15 rounded-xl px-3.5 py-2.5">
                <p className="text-red-300/80 text-xs leading-relaxed">
                  This will <strong>permanently remove</strong> the account, all reported items, and point history.
                </p>
              </div>
              <div className="flex gap-2">
                <button onClick={() => { setDeleteModalOpen(false); setDeleteTarget(null); }} disabled={isDeleteLoading}
                  className="flex-1 bg-gray-800 hover:bg-gray-700 disabled:opacity-50 border border-white/5 text-gray-300 py-2.5 rounded-xl text-xs font-medium transition-colors">
                  Cancel
                </button>
                <button onClick={handleDeleteConfirm} disabled={isDeleteLoading}
                  className="flex-1 bg-red-500/10 hover:bg-red-500 border border-red-500/30 text-red-400 hover:text-white disabled:opacity-50 py-2.5 rounded-xl text-xs font-semibold transition-all flex items-center justify-center gap-1.5">
                  {isDeleteLoading ? <><Spinner /> Deleting...</> : <><FaTrash size={10} /> Delete Student</>}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default StudentRegistry;