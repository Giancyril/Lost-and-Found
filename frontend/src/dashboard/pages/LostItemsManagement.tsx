import { useState } from "react";
import { FaEdit, FaTrash, FaEye, FaSearch, FaCheck, FaTimes, FaEnvelope, FaCheckCircle } from "react-icons/fa";
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

  // Email modal state
  const [isEmailModalOpen, setIsEmailModalOpen] = useState(false);
  const [emailItem, setEmailItem]               = useState<LostItem | null>(null);
  const [emailForm, setEmailForm] = useState({
    toEmail: "", smtpHost: "smtp.gmail.com", smtpPort: 587,
    smtpUsername: "", smtpPassword: "", fromName: "NBSC SAS Lost & Found",
    fromEmail: "", smtpSecure: false,
  });
  const [isSendingEmail, setIsSendingEmail] = useState(false);
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

  // Open email modal — pre-fill toEmail from schoolEmail if available
  const handleOpenEmailModal = (item: LostItem) => {
    setEmailItem(item);
    setEmailForm(prev => ({ ...prev, toEmail: item.schoolEmail || "" }));
    setIsEmailModalOpen(true);
  };

  // Send email
  const handleSendEmail = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!emailItem) return;
    setIsSendingEmail(true);
    try {
      await sendLostItemEmail({
        smtp: {
          host:      emailForm.smtpHost,
          port:      emailForm.smtpPort,
          secure:    emailForm.smtpSecure,
          username:  emailForm.smtpUsername,
          password:  emailForm.smtpPassword,
          fromName:  emailForm.fromName,
          fromEmail: emailForm.fromEmail,
        },
        recipient: {
          toEmail:      emailForm.toEmail,
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
      toast.error(err?.data?.message || "Failed to send email. Check your SMTP settings.");
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
      <div className="grid grid-cols-1 md:grid-cols-3 gap-3 sm:gap-6">
        {[
          { label: "Total Reports",      value: items.length,                                     icon: <FaEye className="text-white" />,             num: "text-white"     },
          { label: "Active",             value: items.filter((i: LostItem) => !i.isFound).length, icon: <IoMdRadioButtonOn className="text-white" />, num: "text-red-500"   },
          { label: "Resolved This Week", value: resolvedThisWeek,                                 icon: <MdCheckCircle className="text-white" />,     num: "text-green-500" },
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
            <input type="text" placeholder="Search lost items..." value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-9 pr-4 py-2 bg-gray-700 border border-gray-600 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-red-500 text-sm" />
          </div>
          <div className="flex gap-2 sm:gap-4">
            <select value={statusFilter} onChange={(e) => setStatusFilter(e.target.value)}
              className="flex-1 sm:flex-none px-3 sm:px-4 py-2 bg-gray-700 border border-gray-600 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-red-500 text-sm">
              <option value="ALL">All Status</option>
              <option value="ACTIVE">Active</option>
              <option value="RESOLVED">Resolved</option>
            </select>
            <select value={categoryFilter} onChange={(e) => setCategoryFilter(e.target.value)}
              className="flex-1 sm:flex-none px-3 sm:px-4 py-2 bg-gray-700 border border-gray-600 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-red-500 text-sm">
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
                        <button onClick={() => handleOpenEmailModal(item)} className="p-1.5 text-blue-400 hover:bg-blue-500 hover:text-white rounded-lg transition-colors" title="Send Email">
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
              {/* School Email row */}
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
              {/* Email button mobile */}
              {emailSentIds.has(item.id) ? (
                <span className="flex-1 flex items-center justify-center gap-1 py-1.5 bg-green-500/10 border border-green-500/20 text-green-400 rounded-lg text-xs font-semibold">
                  <FaCheckCircle size={11} /> Sent
                </span>
              ) : (
                <button onClick={() => handleOpenEmailModal(item)} className="flex-1 flex items-center justify-center gap-1.5 py-1.5 text-blue-400 hover:bg-blue-500/10 rounded-lg text-xs font-medium">
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
        <div className="fixed inset-0 bg-black/70 flex items-end sm:items-center justify-center z-50">
          <div className="bg-gray-800 rounded-t-2xl sm:rounded-2xl w-full sm:max-w-lg mx-0 sm:mx-4 max-h-[85vh] overflow-y-auto border border-gray-700">
            <div className="p-5 sm:p-6">
              <h2 className="text-xl font-bold text-white mb-4">Edit Lost Item</h2>
              <form onSubmit={handleEditSubmit} className="space-y-4">
                {[
                  { label: "Item Name", key: "lostItemName", type: "text" },
                  { label: "Location",  key: "location",     type: "text" },
                  { label: "Date Lost", key: "date",         type: "date" },
                ].map(({ label, key, type }) => (
                  <div key={key}>
                    <label className="block text-gray-300 text-sm font-medium mb-1">{label}</label>
                    <input type={type} value={(editFormData as any)[key]} onChange={(e) => setEditFormData({ ...editFormData, [key]: e.target.value })} disabled={isEditLoading}
                      className="w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-red-500 disabled:bg-gray-600 disabled:cursor-not-allowed text-sm" required />
                  </div>
                ))}
                <div>
                  <label className="block text-gray-300 text-sm font-medium mb-1">Description</label>
                  <textarea value={editFormData.description} onChange={(e) => setEditFormData({ ...editFormData, description: e.target.value })} disabled={isEditLoading} rows={3}
                    className="w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-red-500 disabled:bg-gray-600 disabled:cursor-not-allowed text-sm" required />
                </div>
                <div>
                  <label className="block text-gray-300 text-sm font-medium mb-1">Category</label>
                  <select value={editFormData.categoryId} onChange={(e) => setEditFormData({ ...editFormData, categoryId: e.target.value })} disabled={isEditLoading}
                    className="w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-red-500 disabled:bg-gray-600 disabled:cursor-not-allowed text-sm" required>
                    <option value="">Select a category</option>
                    {categoriesData?.data?.map((category: any) => (
                      <option key={category.id} value={category.id}>{category.name}</option>
                    ))}
                  </select>
                </div>
                <div className="flex space-x-3 pt-2">
                  <button type="submit" disabled={isEditLoading}
                    className="flex-1 bg-blue-600 text-white py-2.5 px-4 rounded-lg hover:bg-blue-700 transition-colors disabled:bg-blue-400 disabled:cursor-not-allowed flex items-center justify-center gap-2 text-sm">
                    {isEditLoading ? <><Spinner /> Updating...</> : "Update Changes"}
                  </button>
                  <button type="button" onClick={handleEditCancel} disabled={isEditLoading}
                    className="flex-1 bg-gray-600 text-white py-2.5 px-4 rounded-lg hover:bg-gray-700 transition-colors disabled:bg-gray-400 disabled:cursor-not-allowed text-sm">Cancel</button>
                </div>
              </form>
            </div>
          </div>
        </div>
      )}

      {/* Delete Modal */}
      {isDeleteModalOpen && (
        <div className="fixed inset-0 bg-black/70 flex items-end sm:items-center justify-center z-50">
          <div className="bg-gray-800 rounded-t-2xl sm:rounded-xl w-full sm:max-w-sm mx-0 sm:mx-4 border border-gray-700 p-5 sm:p-6">
            <div className="text-center">
              <div className="bg-gray-100 rounded-full p-3 w-16 h-16 mx-auto mb-4 flex items-center justify-center">
                <FaTrash className="text-red-600 text-xl" />
              </div>
              <h2 className="text-xl font-bold text-white mb-2">Delete Lost Item</h2>
              <p className="text-gray-400 mb-4">Are you sure? This action cannot be undone.</p>
              {deletingItem && (
                <div className="bg-gray-700 rounded-lg p-4 mb-6 text-left">
                  <h3 className="font-medium text-white mb-2">{deletingItem.lostItemName}</h3>
                  <p className="text-sm text-gray-400 mb-2">{deletingItem.description}</p>
                  <div className="flex justify-between text-sm text-gray-500">
                    <span>Location: {deletingItem.location}</span>
                    <span>Date: {new Date(deletingItem.date).toLocaleDateString()}</span>
                  </div>
                </div>
              )}
              <div className="flex gap-3">
                <button type="button" onClick={handleDeleteCancel} disabled={isDeleteLoading}
                  className="flex-1 bg-gray-600 hover:bg-gray-700 disabled:bg-gray-500 disabled:cursor-not-allowed text-white py-2.5 px-4 rounded-lg transition-colors text-sm">Cancel</button>
                <button type="button" onClick={handleDeleteConfirm} disabled={isDeleteLoading}
                  className="flex-1 bg-red-600 hover:bg-red-700 disabled:bg-red-400 disabled:cursor-not-allowed text-white py-2.5 px-4 rounded-lg transition-colors flex items-center justify-center gap-2 text-sm">
                  {isDeleteLoading ? <><Spinner /> Deleting...</> : "Delete Item"}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Email Modal */}
      {isEmailModalOpen && emailItem && (
        <div className="fixed inset-0 bg-black/70 flex items-end sm:items-center justify-center z-50 p-0 sm:p-4">
          <div className="bg-gray-800 rounded-t-2xl sm:rounded-2xl w-full sm:max-w-md border border-gray-700 max-h-[85vh] overflow-y-auto mt-auto sm:mt-0">
            <div className="flex items-center justify-between px-5 py-4 border-b border-gray-700 sticky top-0 bg-gray-800 z-10">
              <div>
                <h2 className="text-base font-bold text-white flex items-center gap-2">
                  <FaEnvelope className="text-blue-400" size={14} /> Send Report Confirmation Email
                </h2>
                <p className="text-gray-400 text-xs mt-0.5">Send a thank you email to the reporter of this lost item</p>
              </div>
              <button onClick={() => setIsEmailModalOpen(false)} className="text-gray-400 hover:text-white p-1">
                <FaTimes size={15} />
              </button>
            </div>

            <form onSubmit={handleSendEmail} className="p-5 space-y-4">
              {/* Item preview */}
              <div className="bg-gray-900 rounded-xl p-3 border border-gray-700 flex items-center gap-3">
                <div className="w-10 h-10 rounded-lg bg-blue-500/10 border border-blue-500/20 flex items-center justify-center shrink-0">
                  <FaSearch size={14} className="text-blue-400" />
                </div>
                <div className="min-w-0">
                  <p className="text-white text-sm font-semibold truncate">{emailItem.lostItemName}</p>
                  <p className="text-gray-500 text-xs">📍 {emailItem.location} · 📅 {new Date(emailItem.date).toLocaleDateString()}</p>
                  {emailItem.schoolEmail && (
                    <p className="text-blue-400 text-xs mt-0.5 flex items-center gap-1">
                      <FaEnvelope size={9} /> {emailItem.schoolEmail}
                    </p>
                  )}
                </div>
              </div>

              {/* Recipient email — pre-filled from schoolEmail */}
              <div>
                <label className="block text-xs font-semibold uppercase tracking-wider text-gray-400 mb-1.5">
                  Recipient Email <span className="text-red-400">*</span>
                  {emailItem.schoolEmail && (
                    <span className="ml-2 text-[10px] text-green-400 font-normal normal-case tracking-normal">
                      ✓ Pre-filled from school email
                    </span>
                  )}
                </label>
                <input type="email" required placeholder="reporter@email.com" value={emailForm.toEmail}
                  onChange={e => setEmailForm(p => ({ ...p, toEmail: e.target.value }))}
                  className="w-full px-4 py-2.5 bg-gray-900 border border-gray-600 rounded-xl text-white text-sm placeholder-gray-600 focus:outline-none focus:ring-2 focus:ring-blue-500/50" />
              </div>

              {/* SMTP settings collapsible */}
              <details className="group">
                <summary className="cursor-pointer text-xs font-semibold uppercase tracking-wider text-gray-500 hover:text-gray-300 flex items-center gap-2 py-1 select-none">
                  <span className="group-open:rotate-90 transition-transform inline-block">▶</span>
                  SMTP Configuration
                </summary>
                <div className="mt-3 space-y-3 pl-4 border-l border-gray-700">
                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="block text-xs text-gray-500 mb-1">SMTP Host</label>
                      <input type="text" value={emailForm.smtpHost} onChange={e => setEmailForm(p => ({ ...p, smtpHost: e.target.value }))}
                        className="w-full px-3 py-2 bg-gray-900 border border-gray-700 rounded-lg text-white text-xs focus:outline-none focus:ring-1 focus:ring-blue-500" />
                    </div>
                    <div>
                      <label className="block text-xs text-gray-500 mb-1">SMTP Port</label>
                      <input type="number" value={emailForm.smtpPort} onChange={e => setEmailForm(p => ({ ...p, smtpPort: +e.target.value }))}
                        className="w-full px-3 py-2 bg-gray-900 border border-gray-700 rounded-lg text-white text-xs focus:outline-none focus:ring-1 focus:ring-blue-500" />
                    </div>
                  </div>
                  {/* SSL/TLS toggle */}
                  <div className="flex items-center justify-between bg-gray-900 border border-gray-700 rounded-lg px-3 py-2">
                    <div>
                      <p className="text-xs text-gray-400 font-medium">SSL/TLS (secure)</p>
                      <p className="text-[10px] text-gray-600 mt-0.5">Port <strong className="text-gray-500">587</strong> → OFF · Port <strong className="text-gray-500">465</strong> → ON</p>
                    </div>
                    <button type="button" onClick={() => setEmailForm(p => ({ ...p, smtpSecure: !p.smtpSecure }))}
                      className={`relative w-10 h-5 rounded-full transition-colors shrink-0 ml-3 ${emailForm.smtpSecure ? "bg-blue-600" : "bg-gray-600"}`}>
                      <span className={`absolute top-0.5 w-4 h-4 bg-white rounded-full shadow transition-transform ${emailForm.smtpSecure ? "translate-x-5" : "translate-x-0.5"}`} />
                    </button>
                  </div>
                  <div>
                    <label className="block text-xs text-gray-500 mb-1">SMTP Username</label>
                    <input type="text" placeholder="your@gmail.com" value={emailForm.smtpUsername} onChange={e => setEmailForm(p => ({ ...p, smtpUsername: e.target.value }))}
                      className="w-full px-3 py-2 bg-gray-900 border border-gray-700 rounded-lg text-white text-xs focus:outline-none focus:ring-1 focus:ring-blue-500" />
                  </div>
                  <div>
                    <label className="block text-xs text-gray-500 mb-1">SMTP Password / App Password</label>
                    <input type="password" placeholder="••••••••" value={emailForm.smtpPassword} onChange={e => setEmailForm(p => ({ ...p, smtpPassword: e.target.value }))}
                      className="w-full px-3 py-2 bg-gray-900 border border-gray-700 rounded-lg text-white text-xs focus:outline-none focus:ring-1 focus:ring-blue-500" />
                  </div>
                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="block text-xs text-gray-500 mb-1">From Name</label>
                      <input type="text" value={emailForm.fromName} onChange={e => setEmailForm(p => ({ ...p, fromName: e.target.value }))}
                        className="w-full px-3 py-2 bg-gray-900 border border-gray-700 rounded-lg text-white text-xs focus:outline-none focus:ring-1 focus:ring-blue-500" />
                    </div>
                    <div>
                      <label className="block text-xs text-gray-500 mb-1">From Email</label>
                      <input type="email" placeholder="noreply@school.edu" value={emailForm.fromEmail} onChange={e => setEmailForm(p => ({ ...p, fromEmail: e.target.value }))}
                        className="w-full px-3 py-2 bg-gray-900 border border-gray-700 rounded-lg text-white text-xs focus:outline-none focus:ring-1 focus:ring-blue-500" />
                    </div>
                  </div>
                </div>
              </details>

              {/* Info box */}
              <div className="bg-blue-900/20 border border-blue-600/20 rounded-xl px-4 py-3">
                <p className="text-blue-300 text-xs leading-relaxed">
                  📧 This will send a professionally formatted <strong>thank you confirmation email</strong> to the reporter, acknowledging receipt of their lost item report for <strong>"{emailItem.lostItemName}"</strong>.
                </p>
              </div>

              <div className="flex gap-3 pt-1">
                <button type="button" onClick={() => setIsEmailModalOpen(false)} disabled={isSendingEmail}
                  className="flex-1 bg-gray-700 hover:bg-gray-600 disabled:opacity-50 text-white py-2.5 rounded-xl text-sm font-medium transition-colors">
                  Cancel
                </button>
                <button type="submit" disabled={isSendingEmail}
                  className="flex-1 bg-blue-600 hover:bg-blue-500 disabled:opacity-50 disabled:cursor-not-allowed text-white py-2.5 rounded-xl text-sm font-semibold transition-colors flex items-center justify-center gap-2">
                  {isSendingEmail ? <><Spinner /> Sending...</> : <><FaEnvelope size={12} /> Send Email</>}
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