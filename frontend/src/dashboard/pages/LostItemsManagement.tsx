import { useState } from "react";
import { FaEdit, FaTrash, FaEye, FaSearch, 
  FaCheck, FaTimes, FaEnvelope, 
  FaCheckCircle, FaMapMarkerAlt, FaCalendarAlt, 
  FaClipboardList, FaBoxOpen, FaTag } from "react-icons/fa";
import { IoMdRadioButtonOn } from "react-icons/io";
import { MdCheckCircle } from "react-icons/md";
import { toast } from "react-toastify";
import {
  useGetAllLostItemsQuery,
  useDeleteMyLostItemMutation,
  useMarkLostItemAsFoundMutation,
  useEditMyLostItemMutation,
  useCategoryQuery,
  useSendLostItemEmailMutation,
} from "../../redux/api/api";

interface LostItem {
  id: string;
  lostItemName: string;
  description: string;
  category: { id: string; name: string };
  location: string;
  date: string;
  isFound: boolean;
  img?: string;
  reporterName?: string;
  schoolEmail?: string;
  user: { username: string };
}

const Spinner = ({ color = "text-white" }: { color?: string }) => (
  <svg className={`animate-spin h-4 w-4 ${color}`} viewBox="0 0 24 24" fill="none">
    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
  </svg>
);

const LostItemsManagement = () => {
  const [searchTerm, setSearchTerm]         = useState("");
  const [statusFilter, setStatusFilter]     = useState<string>("ALL");
  const [categoryFilter, setCategoryFilter] = useState<string>("ALL");
  const [isEditModalOpen, setIsEditModalOpen]     = useState(false);
  const [editingItem, setEditingItem]             = useState<LostItem | null>(null);
  const [isEditLoading, setIsEditLoading]         = useState(false);
  const [markingAsFoundId, setMarkingAsFoundId]   = useState<string | null>(null);
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const [deletingItem, setDeletingItem]           = useState<LostItem | null>(null);
  const [isDeleteLoading, setIsDeleteLoading]     = useState(false);
  const [editFormData, setEditFormData] = useState({ lostItemName: "", description: "", location: "", date: "", categoryId: "" });

  const [isEmailModalOpen, setIsEmailModalOpen] = useState(false);
  const [emailItem, setEmailItem]               = useState<LostItem | null>(null);
  const [emailToAddress, setEmailToAddress]     = useState("");
  const [isSendingEmail, setIsSendingEmail]     = useState(false);
  const [emailSentIds, setEmailSentIds] = useState<Set<string>>(() => {
    try {
      const stored = localStorage.getItem("lostItemEmailSentIds");
      return stored ? new Set<string>(JSON.parse(stored)) : new Set<string>();
    } catch { return new Set<string>(); }
  });

  const markEmailSent = (id: string) => {
    setEmailSentIds(prev => {
      const next = new Set(prev).add(id);
      localStorage.setItem("lostItemEmailSentIds", JSON.stringify([...next]));
      return next;
    });
  };
  const [sendLostItemEmail] = useSendLostItemEmailMutation();

  const { data: lostItemsData, isLoading, error } = useGetAllLostItemsQuery({ searchTerm, sortBy: "lostItemName", sortOrder: "asc" });
  const { data: categoriesData } = useCategoryQuery({});
  const [deleteMyLostItem] = useDeleteMyLostItemMutation();
  const [markAsFound]      = useMarkLostItemAsFoundMutation();
  const [editMyLostItem]   = useEditMyLostItemMutation();

  const handleEdit = (item: LostItem) => {
    setEditingItem(item);
    setEditFormData({ lostItemName: item.lostItemName, description: item.description, location: item.location, date: new Date(item.date).toISOString().split("T")[0], categoryId: item.category?.id || "" });
    setIsEditModalOpen(true);
  };

  const handleEditSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingItem) return;
    setIsEditLoading(true);
    try {
      await editMyLostItem({ id: editingItem.id, ...editFormData, date: new Date(editFormData.date).toISOString() }).unwrap();
      toast.success("Item updated successfully");
      setIsEditModalOpen(false); setEditingItem(null);
    } catch { toast.error("Failed to update item"); }
    finally { setIsEditLoading(false); }
  };

  const handleEditCancel = () => { setIsEditModalOpen(false); setEditingItem(null); };
  const handleDelete = (item: LostItem) => { setDeletingItem(item); setIsDeleteModalOpen(true); };

  const handleDeleteConfirm = async () => {
    if (!deletingItem) return;
    setIsDeleteLoading(true);
    try {
      await deleteMyLostItem(deletingItem.id).unwrap();
      toast.success("Item deleted successfully");
      setIsDeleteModalOpen(false); setDeletingItem(null);
    } catch { toast.error("Failed to delete item"); }
    finally { setIsDeleteLoading(false); }
  };

  const handleDeleteCancel = () => { setIsDeleteModalOpen(false); setDeletingItem(null); setIsDeleteLoading(false); };

  const handleMarkAsResolved = async (id: string, currentStatus: boolean) => {
    setMarkingAsFoundId(id);
    try {
      await markAsFound({ id }).unwrap();
      toast.success(currentStatus ? "Item marked as active successfully." : "Item marked as resolved successfully.");
    } catch { toast.error("Failed to update item status"); }
    finally { setMarkingAsFoundId(null); }
  };

  const handleOpenEmailModal = (item: LostItem) => {
    setEmailItem(item);
    setEmailToAddress(item.schoolEmail || "");
    setIsEmailModalOpen(true);
  };

  const handleSendEmail = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!emailItem) return;
    setIsSendingEmail(true);
    try {
      await sendLostItemEmail({
        smtp: {},
        recipient: {
          toEmail:      emailToAddress,
          reporterName: emailItem.reporterName || emailItem.user?.username || "Student",
          itemName:     emailItem.lostItemName,
          location:     emailItem.location,
          date:         new Date(emailItem.date).toLocaleDateString("en-PH", { year: "numeric", month: "long", day: "numeric" }),
          description:  emailItem.description,
        },
      }).unwrap();
      toast.success("Email sent successfully!");
      if (emailItem) markEmailSent(emailItem.id);
      setIsEmailModalOpen(false);
    } catch (err: any) {
      toast.error(err?.data?.message || "Failed to send email.");
    } finally {
      setIsSendingEmail(false);
    }
  };

  if (isLoading) return (
    <div className="space-y-4 sm:space-y-6 animate-pulse">
      <div className="h-8 bg-gray-700 rounded w-1/4" />
      {[1,2,3].map(i => <div key={i} className="h-20 bg-gray-700 rounded" />)}
    </div>
  );

  if (error) return (
    <div className="p-4 sm:p-6">
      <div className="bg-red-900/20 border border-red-500 rounded-lg p-4">
        <p className="text-red-400">Error loading lost items. Please try again.</p>
      </div>
    </div>
  );

  const items = lostItemsData?.data || [];
  const filteredItems = items.filter((item: LostItem) => {
    const matchesSearch   = item.lostItemName.toLowerCase().includes(searchTerm.toLowerCase()) || item.description.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesStatus   = statusFilter === "ALL" || (statusFilter === "RESOLVED" && item.isFound) || (statusFilter === "ACTIVE" && !item.isFound);
    const matchesCategory = categoryFilter === "ALL" || item.category?.name === categoryFilter;
    return matchesSearch && matchesStatus && matchesCategory;
  });

  const getStatusColor = (isFound: boolean) => isFound ? "bg-blue-500" : "bg-green-500";

  const now = new Date();
  const weekStart = new Date(now);
  weekStart.setDate(now.getDate() - 7);
  weekStart.setHours(0, 0, 0, 0);
  const resolvedThisWeek = items.filter((i: LostItem) => i.isFound && new Date(i.date) >= weekStart).length;

  return (
    <div className="space-y-4 sm:space-y-6 max-w-7xl mx-auto">

      {/* Stats */}
      <div className="grid grid-cols-3 gap-2 sm:gap-4">
        {[
          { label: "Total Reports",      value: items.length,                                     icon: <FaEye className="text-white" />,             num: "text-white"     },
          { label: "Active",             value: items.filter((i: LostItem) => !i.isFound).length, icon: <IoMdRadioButtonOn className="text-white" />, num: "text-red-500"   },
          { label: "Resolved This Week", value: resolvedThisWeek,                                 icon: <MdCheckCircle className="text-white" />,     num: "text-green-500" },
        ].map((s) => (
          <div key={s.label} className="bg-gray-800 rounded-xl p-2.5 sm:p-6 border border-gray-700">
            <p className="text-gray-400 text-[9px] sm:text-sm leading-tight truncate">{s.label}</p>
            <p className={`text-lg sm:text-2xl font-bold mt-1 ${s.num}`}>{s.value}</p>
            <div className="hidden sm:flex mt-2 bg-gray-500 p-3 rounded-lg w-fit">{s.icon}</div>
          </div>
        ))}
      </div>

      {/* Filters */}
      <div className="bg-gray-800 rounded-xl p-3 sm:p-6 border border-gray-700">
        <div className="flex flex-col gap-2 sm:gap-4">
          <div className="relative">
            <FaSearch className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={12} />
            <input type="text" placeholder="Search lost items..." value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-9 pr-4 py-2 bg-gray-700 border border-gray-600 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-red-500 text-sm" />
          </div>
          <div className="grid grid-cols-2 gap-2">
            <select value={statusFilter} onChange={(e) => setStatusFilter(e.target.value)}
              className="w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-red-500 text-sm">
              <option value="ALL">All Status</option>
              <option value="ACTIVE">Active</option>
              <option value="RESOLVED">Resolved</option>
            </select>
            <select value={categoryFilter} onChange={(e) => setCategoryFilter(e.target.value)}
              className="w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-red-500 text-sm">
              <option value="ALL">All Categories</option>
              {categoriesData?.data?.map((cat: any) => (
                <option key={cat.id} value={cat.name}>{cat.name}</option>
              ))}
            </select>
          </div>
        </div>
      </div>

      {/* Table — desktop */}
      <div className="hidden md:block bg-gray-800 rounded-xl border border-gray-700 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="bg-gray-900">
              <tr>
                <th className="px-4 py-3 text-left text-xs font-semibold text-gray-400 uppercase tracking-wider">Item</th>
                <th className="px-3 py-3 text-left text-xs font-semibold text-gray-400 uppercase tracking-wider">Category</th>
                <th className="px-3 py-3 text-left text-xs font-semibold text-gray-400 uppercase tracking-wider">Location</th>
                <th className="px-3 py-3 text-left text-xs font-semibold text-gray-400 uppercase tracking-wider">Date</th>
                <th className="px-3 py-3 text-left text-xs font-semibold text-gray-400 uppercase tracking-wider">Status</th>
                <th className="px-3 py-3 text-left text-xs font-semibold text-gray-400 uppercase tracking-wider">Reporter</th>
                <th className="px-3 py-3 text-left text-xs font-semibold text-gray-400 uppercase tracking-wider">School Email</th>
                <th className="px-3 py-3 text-left text-xs font-semibold text-gray-400 uppercase tracking-wider">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-700">
              {filteredItems.map((item: LostItem) => (
                <tr key={item.id} className="hover:bg-gray-750 transition-colors">
                  <td className="px-4 py-3 max-w-[180px]">
                    <div className="font-medium text-white text-sm truncate">{item.lostItemName}</div>
                    <div className="text-xs text-gray-500 truncate">{item.description}</div>
                  </td>
                  <td className="px-3 py-3 text-xs text-gray-300 whitespace-nowrap">{item.category?.name || "N/A"}</td>
                  <td className="px-3 py-3 text-xs text-gray-300 whitespace-nowrap">{item.location}</td>
                  <td className="px-3 py-3 text-xs text-gray-300 whitespace-nowrap">{new Date(item.date).toLocaleDateString()}</td>
                  <td className="px-3 py-3">
                    <span className={`px-2 py-0.5 rounded-full text-[11px] font-semibold text-white whitespace-nowrap ${getStatusColor(item.isFound)}`}>
                      {item.isFound ? "Resolved" : "Active"}
                    </span>
                  </td>
                  <td className="px-3 py-3 text-xs text-gray-300 max-w-[100px] truncate">{item.user?.username || item.reporterName || "N/A"}</td>
                  <td className="px-3 py-3 max-w-[160px]">
                    {item.schoolEmail ? (
                      <span className="inline-flex items-center gap-1 text-[11px] text-blue-300 bg-blue-500/10 border border-blue-500/20 px-2 py-0.5 rounded-full truncate max-w-full">
                        <FaEnvelope size={8} className="shrink-0" />
                        <span className="truncate">{item.schoolEmail}</span>
                      </span>
                    ) : (
                      <span className="text-gray-600 text-xs italic">Not provided</span>
                    )}
                  </td>
                  <td className="px-3 py-3">
                    <div className="flex items-center gap-1">
                      <button onClick={() => handleEdit(item)} className="p-1.5 text-yellow-500 hover:bg-yellow-500 hover:text-white rounded-lg transition-colors" title="Edit"><FaEdit size={13} /></button>
                      <button onClick={() => handleMarkAsResolved(item.id, item.isFound)} disabled={markingAsFoundId === item.id}
                        className={`p-1.5 rounded-lg transition-colors disabled:cursor-not-allowed flex items-center justify-center ${item.isFound ? "text-orange-500 hover:bg-orange-500 hover:text-white" : "text-green-500 hover:bg-green-500 hover:text-white"}`}
                        title={item.isFound ? "Mark as Active" : "Mark as Resolved"}>
                        {markingAsFoundId === item.id ? <Spinner color={item.isFound ? "text-orange-500" : "text-green-500"} /> : item.isFound ? <FaTimes size={13} /> : <FaCheck size={13} />}
                      </button>
                      {emailSentIds.has(item.id) ? (
                        <span className="flex items-center gap-1 px-2 py-1 bg-green-500/10 border border-green-500/20 text-green-400 rounded-lg text-[10px] font-semibold whitespace-nowrap">
                          <FaCheckCircle size={10} /> Sent
                        </span>
                      ) : (
                        <button onClick={() => handleOpenEmailModal(item)} className="p-1.5 text-emerald-400 hover:bg-emerald-500 hover:text-white rounded-lg transition-colors" title="Send Email">
                          <FaEnvelope size={13} />
                        </button>
                      )}
                      <button onClick={() => handleDelete(item)} className="p-1.5 text-red-500 hover:bg-red-500 hover:text-white rounded-lg transition-colors" title="Delete"><FaTrash size={13} /></button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        {filteredItems.length === 0 && (
          <div className="text-center py-12"><FaSearch className="mx-auto text-4xl text-gray-500 mb-4" /><p className="text-gray-400">No lost items found matching your criteria</p></div>
        )}
      </div>

      {/* Cards — mobile */}
      <div className="md:hidden space-y-3">
        {filteredItems.length === 0 ? (
          <div className="text-center py-12 bg-gray-800 rounded-xl border border-gray-700">
            <FaSearch className="mx-auto text-4xl text-gray-500 mb-4" />
            <p className="text-gray-400">No lost items found matching your criteria</p>
          </div>
        ) : filteredItems.map((item: LostItem) => (
          <div key={item.id} className="bg-gray-800 rounded-xl border border-gray-700 p-4 space-y-3">
            <div className="flex items-start justify-between gap-2">
              <div className="flex-1 min-w-0">
                <p className="text-white font-medium truncate">{item.lostItemName}</p>
                <p className="text-gray-400 text-xs mt-0.5 line-clamp-2">{item.description}</p>
              </div>
              <span className={`shrink-0 px-2 py-0.5 rounded-full text-[11px] font-medium text-white ${getStatusColor(item.isFound)}`}>
                {item.isFound ? "Resolved" : "Active"}
              </span>
            </div>
            <div className="grid grid-cols-2 gap-2 text-xs">
              <div><p className="text-gray-600">Category</p><p className="text-gray-300 mt-0.5">{item.category?.name || "N/A"}</p></div>
              <div><p className="text-gray-600">Location</p><p className="text-gray-300 mt-0.5">{item.location}</p></div>
              <div><p className="text-gray-600">Date Lost</p><p className="text-gray-300 mt-0.5">{new Date(item.date).toLocaleDateString()}</p></div>
              <div><p className="text-gray-600">Reported By</p><p className="text-gray-300 mt-0.5">{item.user?.username || item.reporterName || "N/A"}</p></div>
              <div className="col-span-2">
                <p className="text-gray-600">School Email</p>
                {item.schoolEmail ? (
                  <span className="inline-flex items-center gap-1 text-blue-300 text-xs mt-0.5">
                    <FaEnvelope size={9} /> {item.schoolEmail}
                  </span>
                ) : (
                  <p className="text-gray-600 italic mt-0.5">Not provided</p>
                )}
              </div>
            </div>
            <div className="flex gap-1.5 pt-1 border-t border-white/5">
              <button onClick={() => handleEdit(item)} className="flex-1 flex items-center justify-center gap-1.5 py-1.5 text-yellow-500 hover:bg-yellow-500/10 rounded-lg text-xs font-medium">
                <FaEdit size={11} /> Edit
              </button>
              <button onClick={() => handleMarkAsResolved(item.id, item.isFound)} disabled={markingAsFoundId === item.id}
                className={`flex-1 flex items-center justify-center gap-1.5 py-1.5 rounded-lg text-xs font-medium ${item.isFound ? "text-orange-500 hover:bg-orange-500/10" : "text-green-500 hover:bg-green-500/10"}`}>
                {markingAsFoundId === item.id ? <Spinner color={item.isFound ? "text-orange-500" : "text-green-500"} />
                  : item.isFound ? <><FaTimes size={11} /> Reopen</> : <><FaCheck size={11} /> Resolve</>}
              </button>
              {emailSentIds.has(item.id) ? (
                <span className="flex-1 flex items-center justify-center gap-1 py-1.5 bg-green-500/10 border border-green-500/20 text-green-400 rounded-lg text-xs font-semibold">
                  <FaCheckCircle size={11} /> Sent
                </span>
              ) : (
                <button onClick={() => handleOpenEmailModal(item)} className="flex-1 flex items-center justify-center gap-1.5 py-1.5 text-emerald-400 hover:bg-emerald-500/10 rounded-lg text-xs font-medium">
                  <FaEnvelope size={11} /> Email
                </button>
              )}
              <button onClick={() => handleDelete(item)} className="flex-1 flex items-center justify-center gap-1.5 py-1.5 text-red-500 hover:bg-red-500/10 rounded-lg text-xs font-medium">
                <FaTrash size={11} /> Delete
              </button>
            </div>
          </div>
        ))}
      </div>

      {/* Edit Modal */}
{isEditModalOpen && (
  <div className="fixed inset-0 bg-black/70 backdrop-blur-sm flex items-center justify-center z-50 p-4">
    <div className="bg-gray-900 border border-white/10 rounded-2xl w-full max-w-2xl shadow-2xl max-h-[90vh] overflow-y-auto">

      {/* Modal header */}
      <div className="flex items-center justify-between px-5 py-3.5 border-b border-white/5 sticky top-0 bg-gray-900 z-10">
        <div className="flex items-center gap-3">
          <div className="w-7 h-7 rounded-lg bg-yellow-500/10 border border-yellow-500/20 flex items-center justify-center shrink-0">
            <FaEdit size={11} className="text-yellow-400" />
          </div>
          <div>
            <h2 className="text-sm font-bold text-white">Edit Lost Item</h2>
            <p className="text-gray-500 text-[11px]">Update the details of this lost item report</p>
          </div>
        </div>
        <button onClick={handleEditCancel} disabled={isEditLoading}
          className="w-7 h-7 rounded-lg bg-white/5 hover:bg-white/10 flex items-center justify-center text-gray-400 hover:text-white transition-colors disabled:opacity-50">
          <FaTimes size={12} />
        </button>
      </div>

      <form onSubmit={handleEditSubmit} className="p-5 space-y-4">

        {/* Item name + location side by side */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          <div className="bg-gray-800/60 border border-white/5 rounded-xl overflow-hidden">
            <div className="flex items-center gap-2 px-3 py-2 border-b border-white/5">
              <FaBoxOpen size={10} className="text-cyan-400" />
              <p className="text-[10px] font-bold text-cyan-400 uppercase tracking-widest">Item Name</p>
            </div>
            <div className="p-3">
              <input
                type="text"
                value={editFormData.lostItemName}
                onChange={(e) => setEditFormData({ ...editFormData, lostItemName: e.target.value })}
                disabled={isEditLoading}
                placeholder="e.g. Blue Backpack"
                className="w-full bg-transparent text-white text-sm placeholder-gray-600 focus:outline-none disabled:cursor-not-allowed"
                required
              />
            </div>
          </div>

          <div className="bg-gray-800/60 border border-white/5 rounded-xl overflow-hidden">
            <div className="flex items-center gap-2 px-3 py-2 border-b border-white/5">
              <FaMapMarkerAlt size={10} className="text-blue-400" />
              <p className="text-[10px] font-bold text-blue-400 uppercase tracking-widest">Last Known Location</p>
            </div>
            <div className="p-3">
              <input
                type="text"
                value={editFormData.location}
                onChange={(e) => setEditFormData({ ...editFormData, location: e.target.value })}
                disabled={isEditLoading}
                placeholder="e.g. Canteen Area"
                className="w-full bg-transparent text-white text-sm placeholder-gray-600 focus:outline-none disabled:cursor-not-allowed"
                required
              />
            </div>
          </div>
        </div>

        {/* Date lost + Category side by side */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          <div className="bg-gray-800/60 border border-white/5 rounded-xl overflow-hidden">
            <div className="flex items-center gap-2 px-3 py-2 border-b border-white/5">
              <FaCalendarAlt size={10} className="text-emerald-400" />
              <p className="text-[10px] font-bold text-emerald-400 uppercase tracking-widest">Date Lost</p>
            </div>
            <div className="p-3">
              <input
                type="date"
                value={editFormData.date}
                onChange={(e) => setEditFormData({ ...editFormData, date: e.target.value })}
                disabled={isEditLoading}
                className="w-full bg-transparent text-white text-sm focus:outline-none disabled:cursor-not-allowed [color-scheme:dark]"
                required
              />
            </div>
          </div>

          <div className="bg-gray-800/60 border border-white/5 rounded-xl overflow-hidden">
            <div className="flex items-center gap-2 px-3 py-2 border-b border-white/5">
              <FaTag size={10} className="text-orange-400" />
              <p className="text-[10px] font-bold text-orange-400 uppercase tracking-widest">Category</p>
            </div>
            <div className="p-3">
              <select
                value={editFormData.categoryId}
                onChange={(e) => setEditFormData({ ...editFormData, categoryId: e.target.value })}
                disabled={isEditLoading}
                className="w-full bg-transparent text-white text-sm focus:outline-none disabled:cursor-not-allowed appearance-none cursor-pointer"
                required
              >
                <option value="" className="bg-gray-900">Select a category</option>
                {categoriesData?.data?.map((category: any) => (
                  <option key={category.id} value={category.id} className="bg-gray-900">{category.name}</option>
                ))}
              </select>
            </div>
          </div>
        </div>

        {/* Description */}
        <div className="bg-gray-800/60 border border-white/5 rounded-xl overflow-hidden">
          <div className="flex items-center gap-2 px-3 py-2 border-b border-white/5">
            <FaClipboardList size={10} className="text-violet-400" />
            <p className="text-[10px] font-bold text-violet-400 uppercase tracking-widest">Description</p>
          </div>
          <div className="p-3">
            <textarea
              value={editFormData.description}
              onChange={(e) => setEditFormData({ ...editFormData, description: e.target.value })}
              disabled={isEditLoading}
              rows={3}
              placeholder="Describe the item in detail..."
              className="w-full bg-transparent text-white text-sm placeholder-gray-600 focus:outline-none resize-none disabled:cursor-not-allowed"
              required
            />
          </div>
        </div>

        {/* Action buttons */}
        <div className="flex items-center justify-end gap-2 pt-1">
          <button type="button" onClick={handleEditCancel} disabled={isEditLoading}
            className="flex items-center gap-1.5 px-4 py-2 bg-gray-800 hover:bg-gray-700 disabled:opacity-50 border border-white/5 text-gray-300 text-xs font-medium rounded-lg transition-colors">
            Cancel
          </button>
          <button type="submit" disabled={isEditLoading}
            className="flex items-center gap-1.5 px-4 py-2 bg-yellow-500/10 hover:bg-yellow-500 border border-yellow-500/30 text-yellow-400 hover:text-white text-xs font-semibold rounded-lg transition-all disabled:opacity-50 disabled:cursor-not-allowed">
            {isEditLoading ? <><Spinner /> Updating...</> : <><FaEdit size={10} /> Update Item</>}
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
            <h2 className="text-sm font-bold text-white">Delete Lost Item</h2>
            <p className="text-gray-500 text-[11px]">This action cannot be undone</p>
          </div>
        </div>
        <button onClick={handleDeleteCancel} disabled={isDeleteLoading}
          className="w-7 h-7 rounded-lg bg-white/5 hover:bg-white/10 flex items-center justify-center text-gray-400 hover:text-white transition-colors disabled:opacity-50">
          <FaTimes size={12} />
        </button>
      </div>

      <div className="p-5 space-y-4">
        {/* Item preview card */}
        {deletingItem && (
          <div className="bg-gray-800/60 border border-white/5 rounded-xl overflow-hidden">
            <div className="flex items-center gap-2 px-3 py-2 border-b border-white/5">
              <FaBoxOpen size={10} className="text-cyan-400" />
              <p className="text-[10px] font-bold text-cyan-400 uppercase tracking-widest">Item to Delete</p>
            </div>
            <div className="p-3 space-y-2">
              <p className="text-white text-sm font-semibold">{deletingItem.lostItemName}</p>
              <p className="text-gray-400 text-xs leading-relaxed">{deletingItem.description}</p>
              <div className="flex items-center gap-3 pt-1 text-[10px] text-gray-500">
                <span className="flex items-center gap-1">
                  <FaMapMarkerAlt size={8} className="text-blue-400" /> {deletingItem.location}
                </span>
                <span className="flex items-center gap-1">
                  <FaCalendarAlt size={8} className="text-emerald-400" /> {new Date(deletingItem.date).toLocaleDateString()}
                </span>
              </div>
            </div>
          </div>
        )}

        {/* Warning notice */}
        <div className="bg-red-500/5 border border-red-500/15 rounded-xl px-3.5 py-2.5">
          <p className="text-red-300/80 text-xs leading-relaxed">
            Deleting this item will <strong>permanently remove</strong> it and all associated data. This cannot be reversed.
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
            {isDeleteLoading ? <><Spinner /> Deleting...</> : <><FaTrash size={10} /> Delete Item</>}
          </button>
        </div>
      </div>
    </div>
  </div>
)}

      {/* Email Modal */}
      {isEmailModalOpen && emailItem && (
        <div className="fixed inset-0 bg-black/70 flex items-center justify-center z-50 p-4">
          <div className="bg-gray-900 border border-white/10 rounded-2xl w-full max-w-md shadow-2xl">
            <div className="flex items-center justify-between px-5 py-3.5 border-b border-white/5 sticky top-0 bg-gray-900 z-10">
              <div className="flex items-center gap-2.5">
                <div className="w-7 h-7 rounded-lg bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center shrink-0">
                  <FaEnvelope size={11} className="text-emerald-400" />
                </div>
                <div>
                  <h2 className="text-sm font-bold text-white">Send Report Confirmation</h2>
                  <p className="text-gray-500 text-[11px]">Notify the reporter their lost item was received</p>
                </div>
              </div>
              <button onClick={() => setIsEmailModalOpen(false)}
                className="w-7 h-7 rounded-lg bg-white/5 hover:bg-white/10 flex items-center justify-center text-gray-400 hover:text-white transition-colors">
                <FaTimes size={12} />
              </button>
            </div>
            <form onSubmit={handleSendEmail} className="p-5 space-y-4">
              <div className="bg-gray-800/60 border border-white/5 rounded-xl p-3 flex items-center gap-3">
                <div className="w-10 h-10 rounded-lg bg-blue-500/10 border border-blue-500/20 flex items-center justify-center shrink-0">
                  <FaSearch size={13} className="text-blue-400" />
                </div>
                <div className="min-w-0 flex-1">
                  <p className="text-white text-xs font-semibold truncate">{emailItem.lostItemName}</p>
                  <p className="text-gray-500 text-[10px]">{emailItem.location} · {new Date(emailItem.date).toLocaleDateString()}</p>
                </div>
              </div>
              <div>
                <label className="block text-[10px] font-bold uppercase tracking-widest text-gray-400 mb-1.5">
                  Recipient Email <span className="text-red-400">*</span>
                  {emailItem.schoolEmail && <span className="ml-2 text-[10px] text-emerald-400 font-normal normal-case tracking-normal">✓ Pre-filled</span>}
                </label>
                <input type="email" required placeholder="reporter@nbsc.edu.ph" value={emailToAddress}
                  onChange={e => setEmailToAddress(e.target.value)}
                  className="w-full px-3.5 py-2.5 bg-gray-800 border border-white/10 rounded-xl text-white text-sm placeholder-gray-600 focus:outline-none focus:ring-2 focus:ring-emerald-500/30 focus:border-emerald-500/30" />
              </div>
              <div className="bg-emerald-500/5 border border-emerald-500/15 rounded-xl px-3.5 py-2.5">
                <p className="text-emerald-300/80 text-xs leading-relaxed">
                  Sends a formatted confirmation email to the reporter of <strong>"{emailItem.lostItemName}"</strong>.
                </p>
              </div>
              <div className="flex gap-2 pt-1">
                <button type="button" onClick={() => setIsEmailModalOpen(false)} disabled={isSendingEmail}
                  className="flex-1 bg-gray-800 hover:bg-gray-700 disabled:opacity-50 border border-white/5 text-gray-300 py-2 rounded-xl text-xs font-medium transition-colors">
                  Cancel
                </button>
                <button type="submit" disabled={isSendingEmail}
                  className="flex-1 bg-emerald-600 hover:bg-emerald-500 disabled:opacity-50 disabled:cursor-not-allowed text-white py-2 rounded-xl text-xs font-semibold transition-colors flex items-center justify-center gap-1.5">
                  {isSendingEmail ? <><Spinner color="text-white" /> Sending...</> : <><FaEnvelope size={10} /> Send Email</>}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default LostItemsManagement;