import { useState } from "react";
import { FaEdit, FaTrash, FaEye, 
  FaSearch, FaArchive, FaMapMarkerAlt, 
  FaCalendarAlt, FaClipboardList, 
  FaBoxOpen, FaTimes, FaEnvelope } from "react-icons/fa";
import { toast } from "react-toastify";
import {
  useGetFoundItemsQuery,
  useDeleteMyFoundItemMutation,
  useEditMyFoundItemMutation,
  useCategoryQuery,
  useArchiveFoundItemMutation,
  useSendLostItemEmailMutation,
} from "../../redux/api/api";

interface FoundItem {
  id: string;
  foundItemName: string;
  description: string;
  category: { name: string };
  location: string;
  date: string;
  isClaimed: boolean;
  isArchived?: boolean;
  img?: string;
  schoolEmail?: string;
  user?: { username: string; email?: string };
}

const Spinner = ({ color = "text-white" }: { color?: string }) => (
  <svg className={`animate-spin h-4 w-4 ${color}`} viewBox="0 0 24 24" fill="none">
    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
  </svg>
);

const FoundItemsManagement = () => {
  const [searchTerm, setSearchTerm]         = useState("");
  const [statusFilter, setStatusFilter]     = useState<string>("ALL");
  const [categoryFilter, setCategoryFilter] = useState<string>("ALL");
  const [isEditModalOpen, setIsEditModalOpen]     = useState(false);
  const [editingItem, setEditingItem]             = useState<FoundItem | null>(null);
  const [isEditLoading, setIsEditLoading]         = useState(false);
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const [deletingItem, setDeletingItem]           = useState<FoundItem | null>(null);
  const [isDeleteLoading, setIsDeleteLoading]     = useState(false);
  const [isArchiveModalOpen, setIsArchiveModalOpen] = useState(false);
  const [archivingItem, setArchivingItem]           = useState<FoundItem | null>(null);
  const [isArchiveLoading, setIsArchiveLoading]     = useState(false);
  const [isEmailModalOpen, setIsEmailModalOpen] = useState(false);
  const [emailItem, setEmailItem] = useState<FoundItem | null>(null);
  const [emailToAddress, setEmailToAddress] = useState("");
  const [isSendingEmail, setIsSendingEmail] = useState(false);
  const [editForm, setEditForm] = useState({ foundItemName: "", description: "", location: "", date: "" });
  const [sendLostItemEmail] = useSendLostItemEmailMutation();

  const { data: foundItemsData, isLoading, error } = useGetFoundItemsQuery({ searchTerm, sortBy: "foundItemName", sortOrder: "asc" });
  const { data: categoriesData } = useCategoryQuery({});
  const [deleteFoundItem]  = useDeleteMyFoundItemMutation();
  const [editMyFoundItem]  = useEditMyFoundItemMutation();
  const [archiveFoundItem] = useArchiveFoundItemMutation();

  const handleEdit = (item: FoundItem) => {
    setEditingItem(item);
    setEditForm({ foundItemName: item.foundItemName, description: item.description, location: item.location, date: new Date(item.date).toISOString().split("T")[0] });
    setIsEditModalOpen(true);
  };

  const handleEditSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingItem) return;
    setIsEditLoading(true);
    try {
      await editMyFoundItem({ id: editingItem.id, ...editForm, date: new Date(editForm.date).toISOString() }).unwrap();
      toast.success("Item updated successfully");
      setIsEditModalOpen(false); setEditingItem(null);
    } catch { toast.error("Failed to update item"); }
    finally { setIsEditLoading(false); }
  };

  const handleEditCancel = () => {
    setIsEditModalOpen(false); setEditingItem(null); setIsEditLoading(false);
    setEditForm({ foundItemName: "", description: "", location: "", date: "" });
  };

  const handleDelete = (item: FoundItem) => { setDeletingItem(item); setIsDeleteModalOpen(true); };

  const handleDeleteConfirm = async () => {
    if (!deletingItem) return;
    setIsDeleteLoading(true);
    try {
      await deleteFoundItem(deletingItem.id).unwrap();
      toast.success("Item deleted successfully");
      setIsDeleteModalOpen(false); setDeletingItem(null);
    } catch { toast.error("Failed to delete item"); }
    finally { setIsDeleteLoading(false); }
  };

  const handleDeleteCancel = () => { setIsDeleteModalOpen(false); setDeletingItem(null); setIsDeleteLoading(false); };

  // ── Archive handlers ──────────────────────────────────────────────────────
  const handleArchive = (item: FoundItem) => { setArchivingItem(item); setIsArchiveModalOpen(true); };

  const handleArchiveConfirm = async () => {
    if (!archivingItem) return;
    setIsArchiveLoading(true);
    try {
      await archiveFoundItem(archivingItem.id).unwrap();
      toast.success(`"${archivingItem.foundItemName}" moved to archive`);
      setIsArchiveModalOpen(false); setArchivingItem(null);
    } catch { toast.error("Failed to archive item"); }
    finally { setIsArchiveLoading(false); }
  };

  const handleArchiveCancel = () => { setIsArchiveModalOpen(false); setArchivingItem(null); setIsArchiveLoading(false); };

  const handleOpenEmailModal = (item: FoundItem) => {
    setEmailItem(item);
    setEmailToAddress(item.schoolEmail || item.user?.email || "");
    setIsEmailModalOpen(true);
  };

  const handleCloseEmailModal = () => {
    setIsEmailModalOpen(false);
    setEmailItem(null);
    setEmailToAddress("");
    setIsSendingEmail(false);
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
          reporterName: emailItem.user?.username || "Student",
          itemName:     emailItem.foundItemName,
          location:     emailItem.location,
          date:         new Date(emailItem.date).toLocaleDateString("en-PH", { year: "numeric", month: "long", day: "numeric" }),
          description:  emailItem.description,
        },
      }).unwrap();
      toast.success("Email sent successfully!");
      handleCloseEmailModal();
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
        <p className="text-red-400">Error loading found items. Please try again.</p>
      </div>
    </div>
  );

  const items = foundItemsData?.data || [];
  const filteredItems = items.filter((item: FoundItem) => {
    const matchesSearch   = item.foundItemName.toLowerCase().includes(searchTerm.toLowerCase()) || item.description.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesStatus   = statusFilter === "ALL" || (statusFilter === "CLAIMED" && item.isClaimed) || (statusFilter === "ACTIVE" && !item.isClaimed);
    const matchesCategory = categoryFilter === "ALL" || item.category?.name === categoryFilter;
    return matchesSearch && matchesStatus && matchesCategory;
  });

  const getStatusColor = (isClaimed: boolean) => isClaimed ? "bg-yellow-500" : "bg-green-500";

  return (
    <div className="space-y-4 sm:space-y-6 max-w-7xl mx-auto">

      {/* Stats */}
      <div className="grid grid-cols-3 gap-2 sm:gap-4">
        {[
          { label: "Total Items", value: items?.length || 0,                                   icon: <FaEye className="text-white" />,    num: "text-white"      },
          { label: "Active",      value: items.filter((i: FoundItem) => !i.isClaimed).length,  icon: <FaSearch className="text-white" />, num: "text-green-500"  },
          { label: "Claimed",     value: items.filter((i: FoundItem) => i.isClaimed).length,   icon: <FaSearch className="text-white" />, num: "text-yellow-500" },
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
            <input type="text" placeholder="Search items..." value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-9 pr-4 py-2 bg-gray-700 border border-gray-600 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm" />
          </div>
          <div className="grid grid-cols-2 gap-2">
            <select value={statusFilter} onChange={(e) => setStatusFilter(e.target.value)}
              className="w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm">
              <option value="ALL">All Status</option>
              <option value="ACTIVE">Active</option>
              <option value="CLAIMED">Claimed</option>
            </select>
            <select value={categoryFilter} onChange={(e) => setCategoryFilter(e.target.value)}
              className="w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm">
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
          <table className="w-full">
            <thead className="bg-gray-900">
              <tr>
                {["Item","Category","Location","Date Found","Status","Reported By","Actions"].map(h => (
                  <th key={h} className="px-6 py-4 text-left text-sm font-medium text-gray-300">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-700">
              {filteredItems.map((item: FoundItem) => (
                <tr key={item.id} className="hover:bg-gray-700 transition-colors">
                  <td className="px-6 py-4">
                    <div className="font-medium text-white">{item.foundItemName}</div>
                    <div className="text-sm text-gray-400 truncate max-w-xs">{item.description}</div>
                  </td>
                  <td className="px-6 py-4 text-gray-300">{item.category?.name || "N/A"}</td>
                  <td className="px-6 py-4 text-gray-300">{item.location}</td>
                  <td className="px-6 py-4 text-gray-300">{new Date(item.date).toLocaleDateString()}</td>
                  <td className="px-6 py-4">
                    <span className={`px-3 py-1 rounded-full text-xs font-medium text-white ${getStatusColor(item.isClaimed)}`}>
                      {item.isClaimed ? "Claimed" : "Active"}
                    </span>
                  </td>
                  <td className="px-6 py-4 text-gray-300">{item.user?.username || "N/A"}</td>
                  <td className="px-6 py-4">
                    <div className="flex items-center gap-1.5">
                      <button onClick={() => handleEdit(item)} title="Edit" className="p-2 text-yellow-500 hover:bg-yellow-500 hover:text-white rounded-lg transition-colors"><FaEdit size={13} /></button>
                      <button onClick={() => handleOpenEmailModal(item)} title="Send Email" className="p-2 text-emerald-400 hover:bg-emerald-500/20 rounded-lg transition-colors"><FaEnvelope size={13} /></button>
                      {/* Archive — only for unclaimed, non-archived items; placeholder keeps delete aligned */}
                      {!item.isClaimed && !item.isArchived ? (
                        <button onClick={() => handleArchive(item)} title="Archive this item"
                          className="p-2 text-orange-400 hover:bg-orange-500/20 rounded-lg transition-colors">
                          <FaArchive size={13} />
                        </button>
                      ) : (
                        <span className="p-2 w-[29px]" />
                      )}
                      <button onClick={() => handleDelete(item)} title="Delete" className="p-2 text-red-500 hover:bg-red-500 hover:text-white rounded-lg transition-colors"><FaTrash size={13} /></button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        {filteredItems.length === 0 && (
          <div className="text-center py-12"><FaSearch className="mx-auto text-4xl text-gray-500 mb-4" /><p className="text-gray-400">No items found matching your criteria</p></div>
        )}
      </div>

      {/* Cards — mobile */}
      <div className="md:hidden space-y-3">
        {filteredItems.length === 0 ? (
          <div className="text-center py-12 bg-gray-800 rounded-xl border border-gray-700">
            <FaSearch className="mx-auto text-4xl text-gray-500 mb-4" />
            <p className="text-gray-400">No items found matching your criteria</p>
          </div>
        ) : filteredItems.map((item: FoundItem) => (
          <div key={item.id} className="bg-gray-800 rounded-xl border border-gray-700 p-4 space-y-3">
            <div className="flex items-start justify-between gap-2">
              <div className="flex-1 min-w-0">
                <p className="text-white font-medium truncate">{item.foundItemName}</p>
                <p className="text-gray-400 text-xs mt-0.5 line-clamp-2">{item.description}</p>
              </div>
              <span className={`shrink-0 px-2 py-0.5 rounded-full text-[11px] font-medium text-white ${getStatusColor(item.isClaimed)}`}>
                {item.isClaimed ? "Claimed" : "Active"}
              </span>
            </div>
            <div className="grid grid-cols-2 gap-2 text-xs">
              <div><p className="text-gray-600">Category</p><p className="text-gray-300 mt-0.5">{item.category?.name || "N/A"}</p></div>
              <div><p className="text-gray-600">Location</p><p className="text-gray-300 mt-0.5">{item.location}</p></div>
              <div><p className="text-gray-600">Date Found</p><p className="text-gray-300 mt-0.5">{new Date(item.date).toLocaleDateString()}</p></div>
              <div><p className="text-gray-600">Reported By</p><p className="text-gray-300 mt-0.5">{item.user?.username || "N/A"}</p></div>
            </div>
            <div className="flex gap-2 pt-1 border-t border-white/5">
              <button onClick={() => handleEdit(item)} className="flex-1 flex items-center justify-center gap-1.5 py-1.5 text-yellow-500 hover:bg-yellow-500/10 rounded-lg text-xs font-medium transition-colors">
                <FaEdit size={11} /> Edit
              </button>
              <button onClick={() => handleOpenEmailModal(item)} className="flex-1 flex items-center justify-center gap-1.5 py-1.5 text-emerald-400 hover:bg-emerald-500/10 rounded-lg text-xs font-medium transition-colors">
                <FaEnvelope size={11} /> Email
              </button>
              <button onClick={() => handleDelete(item)} className="flex-1 flex items-center justify-center gap-1.5 py-1.5 text-red-500 hover:bg-red-500/10 rounded-lg text-xs font-medium transition-colors">
                <FaTrash size={11} /> Delete
              </button>
              {!item.isClaimed && !item.isArchived && (
                <button onClick={() => handleArchive(item)} className="flex-1 flex items-center justify-center gap-1.5 py-1.5 text-orange-400 hover:bg-orange-500/10 rounded-lg text-xs font-medium transition-colors">
                  <FaArchive size={11} /> Archive
                </button>
              )}
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
            <h2 className="text-sm font-bold text-white">Edit Found Item</h2>
            <p className="text-gray-500 text-[11px]">Update the details of this found item report</p>
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
                value={editForm.foundItemName}
                onChange={(e) => setEditForm({ ...editForm, foundItemName: e.target.value })}
                disabled={isEditLoading}
                placeholder="e.g. Black Umbrella"
                className="w-full bg-transparent text-white text-sm placeholder-gray-600 focus:outline-none disabled:cursor-not-allowed"
                required
              />
            </div>
          </div>

          <div className="bg-gray-800/60 border border-white/5 rounded-xl overflow-hidden">
            <div className="flex items-center gap-2 px-3 py-2 border-b border-white/5">
              <FaMapMarkerAlt size={10} className="text-blue-400" />
              <p className="text-[10px] font-bold text-blue-400 uppercase tracking-widest">Location Found</p>
            </div>
            <div className="p-3">
              <input
                type="text"
                value={editForm.location}
                onChange={(e) => setEditForm({ ...editForm, location: e.target.value })}
                disabled={isEditLoading}
                placeholder="e.g. SWDC Building"
                className="w-full bg-transparent text-white text-sm placeholder-gray-600 focus:outline-none disabled:cursor-not-allowed"
                required
              />
            </div>
          </div>
        </div>

        {/* Date found */}
        <div className="bg-gray-800/60 border border-white/5 rounded-xl overflow-hidden">
          <div className="flex items-center gap-2 px-3 py-2 border-b border-white/5">
            <FaCalendarAlt size={10} className="text-emerald-400" />
            <p className="text-[10px] font-bold text-emerald-400 uppercase tracking-widest">Date Found</p>
          </div>
          <div className="p-3">
            <input
              type="date"
              value={editForm.date}
              onChange={(e) => setEditForm({ ...editForm, date: e.target.value })}
              disabled={isEditLoading}
              className="w-full bg-transparent text-white text-sm focus:outline-none disabled:cursor-not-allowed [color-scheme:dark]"
              required
            />
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
              value={editForm.description}
              onChange={(e) => setEditForm({ ...editForm, description: e.target.value })}
              disabled={isEditLoading}
              rows={3}
              placeholder="Describe the item in detail..."
              className="w-full bg-transparent text-white text-sm placeholder-gray-600 focus:outline-none resize-none disabled:cursor-not-allowed"
              required
            />
          </div>
        </div>

        {/* Action buttons */}
        <div className="flex gap-2 pt-1">
          <button type="button" onClick={handleEditCancel} disabled={isEditLoading}
            className="flex-1 bg-gray-800 hover:bg-gray-700 disabled:opacity-50 border border-white/5 text-gray-300 py-2 rounded-xl text-xs font-medium transition-colors">
            Cancel
          </button>
          <button type="submit" disabled={isEditLoading}
            className="flex-1 bg-yellow-500 hover:bg-yellow-400 disabled:opacity-50 disabled:cursor-not-allowed text-white py-2 rounded-xl text-xs font-semibold transition-colors flex items-center justify-center gap-1.5">
            {isEditLoading ? <><Spinner /> Updating...</> : <> Update Item</>}
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
            <h2 className="text-sm font-bold text-white">Delete Found Item</h2>
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
              <p className="text-white text-sm font-semibold">{deletingItem.foundItemName}</p>
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
        <div className="flex gap-2 pt-1">
          <button type="button" onClick={handleDeleteCancel} disabled={isDeleteLoading}
            className="flex-1 bg-gray-800 hover:bg-gray-700 disabled:opacity-50 border border-white/5 text-gray-300 py-2 rounded-xl text-xs font-medium transition-colors">
            Cancel
          </button>
          <button type="button" onClick={handleDeleteConfirm} disabled={isDeleteLoading}
            className="flex-1 bg-red-500 hover:bg-red-500 disabled:opacity-50 disabled:cursor-not-allowed text-white py-2 rounded-xl text-xs font-semibold transition-colors flex items-center justify-center gap-1.5">
            {isDeleteLoading ? <><Spinner /> Deleting...</> : <> Delete Item</>}
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
                  <h2 className="text-sm font-bold text-white">Send Found Item Notification</h2>
                  <p className="text-gray-500 text-[11px]">Notify the reporter that their found item report has been received</p>
                </div>
              </div>
              <button onClick={handleCloseEmailModal}
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
                  <p className="text-white text-xs font-semibold truncate">{emailItem.foundItemName}</p>
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
                  Sends a formatted confirmation email for this found item report.
                </p>
              </div>
              <div className="flex gap-2 pt-1">
                <button type="button" onClick={handleCloseEmailModal} disabled={isSendingEmail}
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

      {/* Archive Confirmation Modal */}
{isArchiveModalOpen && archivingItem && (
  <div className="fixed inset-0 bg-black/70 backdrop-blur-sm flex items-center justify-center z-50 p-4">
    <div className="bg-gray-900 border border-white/10 rounded-2xl w-full max-w-sm shadow-2xl">

      {/* Header */}
      <div className="flex items-center justify-between px-5 py-3.5 border-b border-white/5">
        <div className="flex items-center gap-3">
          <div className="w-7 h-7 rounded-lg bg-orange-500/10 border border-orange-500/20 flex items-center justify-center shrink-0">
            <FaArchive size={11} className="text-orange-400" />
          </div>
          <div>
            <h2 className="text-sm font-bold text-white">Archive Found Item</h2>
            <p className="text-gray-500 text-[11px]">Item will be hidden from public listing</p>
          </div>
        </div>
        <button onClick={handleArchiveCancel} disabled={isArchiveLoading}
          className="w-7 h-7 rounded-lg bg-white/5 hover:bg-white/10 flex items-center justify-center text-gray-400 hover:text-white transition-colors disabled:opacity-50">
          <FaTimes size={12} />
        </button>
      </div>

      <div className="p-5 space-y-4">
        {/* Item preview card */}
        <div className="bg-gray-800/60 border border-white/5 rounded-xl overflow-hidden">
          <div className="flex items-center gap-2 px-3 py-2 border-b border-white/5">
            <FaBoxOpen size={10} className="text-cyan-400" />
            <p className="text-[10px] font-bold text-cyan-400 uppercase tracking-widest">Item to Archive</p>
          </div>
          <div className="p-3 space-y-2">
            <p className="text-white text-sm font-semibold">{archivingItem.foundItemName}</p>
            <p className="text-gray-400 text-xs leading-relaxed">{archivingItem.description}</p>
            <div className="flex items-center gap-3 pt-1 text-[10px] text-gray-500">
              <span className="flex items-center gap-1">
                <FaMapMarkerAlt size={8} className="text-blue-400" /> {archivingItem.location}
              </span>
              <span className="flex items-center gap-1">
                <FaCalendarAlt size={8} className="text-emerald-400" /> {new Date(archivingItem.date).toLocaleDateString()}
              </span>
            </div>
          </div>
        </div>

        {/* Info notice */}
        <div className="bg-orange-500/5 border border-orange-500/15 rounded-xl px-3.5 py-2.5">
          <p className="text-orange-300/80 text-xs leading-relaxed">
            Archived items are <strong>not deleted</strong> — they are hidden from the public found items page and can be restored or permanently deleted from <strong>Archive Log</strong>.
          </p>
        </div>

        {/* Actions */}
        <div className="flex gap-2 pt-1">
          <button type="button" onClick={handleArchiveCancel} disabled={isArchiveLoading}
            className="flex-1 bg-gray-800 hover:bg-gray-700 disabled:opacity-50 border border-white/5 text-gray-300 py-2 rounded-xl text-xs font-medium transition-colors">
            Cancel
          </button>
          <button type="button" onClick={handleArchiveConfirm} disabled={isArchiveLoading}
            className="flex-1 bg-orange-500 hover:bg-orange-400 disabled:opacity-50 disabled:cursor-not-allowed text-white py-2 rounded-xl text-xs font-semibold transition-colors flex items-center justify-center gap-1.5">
            {isArchiveLoading ? <><Spinner /> Archiving...</> : <> Archive Item</>}
          </button>
        </div>
      </div>
    </div>
  </div>
)}

    </div>
  );
};

export default FoundItemsManagement;