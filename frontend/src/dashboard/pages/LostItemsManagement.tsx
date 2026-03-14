import { useState } from "react";
import { FaEdit, FaTrash, FaEye, FaSearch, FaCheck, FaTimes } from "react-icons/fa";
import { IoMdRadioButtonOn } from "react-icons/io";
import { MdCheckCircle } from "react-icons/md";
import { toast } from "react-toastify";
import {
  useGetAllLostItemsQuery,
  useDeleteMyLostItemMutation,
  useMarkLostItemAsFoundMutation,
  useEditMyLostItemMutation,
  useCategoryQuery,
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

  // fetch ALL items (no isFound filter) so stats are accurate
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

  // resolved this week
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
          { label: "Total Reports",        value: items.length,                                     icon: <FaEye className="text-white" />,              num: "text-white"     },
          { label: "Active",               value: items.filter((i: LostItem) => !i.isFound).length, icon: <IoMdRadioButtonOn className="text-white" />,  num: "text-red-500"   },
          { label: "Resolved This Week",   value: resolvedThisWeek,                                 icon: <MdCheckCircle className="text-white" />,      num: "text-green-500" },
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
              <option value="RESOLVED">Resolved</option> {/* ✅ renamed from FOUND */}
            </select>
            <select value={categoryFilter} onChange={(e) => setCategoryFilter(e.target.value)}
              className="flex-1 sm:flex-none px-3 sm:px-4 py-2 bg-gray-700 border border-gray-600 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-red-500 text-sm">
              <option value="ALL">All Categories</option>
              {categoriesData?.data?.map((cat: any) => ( // ✅ dynamic from API
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
                {["Item","Category","Location","Date Lost","Status","Reported By","Actions"].map(h => (
                  <th key={h} className="px-6 py-4 text-left text-sm font-medium text-gray-300">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-700">
              {filteredItems.map((item: LostItem) => (
                <tr key={item.id} className="hover:bg-gray-700 transition-colors">
                  <td className="px-6 py-4">
                    <div className="font-medium text-white">{item.lostItemName}</div>
                    <div className="text-sm text-gray-400 truncate max-w-xs">{item.description}</div>
                  </td>
                  <td className="px-6 py-4 text-gray-300">{item.category?.name || "N/A"}</td>
                  <td className="px-6 py-4 text-gray-300">{item.location}</td>
                  <td className="px-6 py-4 text-gray-300">{new Date(item.date).toLocaleDateString()}</td>
                  <td className="px-6 py-4">
                    <span className={`px-3 py-1 rounded-full text-xs font-medium text-white ${getStatusColor(item.isFound)}`}>
                      {item.isFound ? "Resolved" : "Active"} {/* ✅ renamed */}
                    </span>
                  </td>
                  <td className="px-6 py-4 text-gray-300">{item.user?.username || "N/A"}</td>
                  <td className="px-6 py-4">
                    <div className="flex items-center space-x-2">
                      <button onClick={() => handleEdit(item)} className="p-2 text-yellow-500 hover:bg-yellow-500 hover:text-white rounded-lg transition-colors"><FaEdit /></button>
                      <button onClick={() => handleMarkAsResolved(item.id, item.isFound)} disabled={markingAsFoundId === item.id}
                        className={`p-2 rounded-lg transition-colors disabled:cursor-not-allowed flex items-center justify-center ${item.isFound ? "text-orange-500 hover:bg-orange-500 hover:text-white disabled:bg-orange-400" : "text-green-500 hover:bg-green-500 hover:text-white disabled:bg-green-400"}`}
                        title={item.isFound ? "Mark as Active" : "Mark as Resolved"}>
                        {markingAsFoundId === item.id ? <Spinner color={item.isFound ? "text-orange-500" : "text-green-500"} /> : item.isFound ? <FaTimes /> : <FaCheck />}
                      </button>
                      <button onClick={() => handleDelete(item)} className="p-2 text-red-500 hover:bg-red-500 hover:text-white rounded-lg transition-colors flex items-center justify-center"><FaTrash /></button>
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
              <div><p className="text-gray-600">Reported By</p><p className="text-gray-300 mt-0.5">{item.user?.username || "N/A"}</p></div>
            </div>
            <div className="flex gap-1.5 pt-1 border-t border-white/5">
              <button onClick={() => handleEdit(item)} className="flex-1 flex items-center justify-center gap-1.5 py-1.5 text-yellow-500 hover:bg-yellow-500/10 rounded-lg text-xs font-medium">
                <FaEdit size={11} /> Edit
              </button>
              <button onClick={() => handleMarkAsResolved(item.id, item.isFound)} disabled={markingAsFoundId === item.id}
                className={`flex-1 flex items-center justify-center gap-1.5 py-1.5 rounded-lg text-xs font-medium ${item.isFound ? "text-orange-500 hover:bg-orange-500/10" : "text-green-500 hover:bg-green-500/10"}`}>
                {markingAsFoundId === item.id
                  ? <Spinner color={item.isFound ? "text-orange-500" : "text-green-500"} />
                  : item.isFound
                    ? <><FaTimes size={11} /> Reopen</>
                    : <><FaCheck size={11} /> Resolve</>}
              </button>
              <button onClick={() => handleDelete(item)} className="flex-1 flex items-center justify-center gap-1.5 py-1.5 text-red-500 hover:bg-red-500/10 rounded-lg text-xs font-medium">
                <FaTrash size={11} /> Delete
              </button>
            </div>
          </div>
        ))}
      </div>

      {/* Edit Modal */}
      {isEditModalOpen && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-end sm:items-center justify-center z-50">
          <div className="bg-gray-800 rounded-t-2xl sm:rounded-xl w-full sm:max-w-2xl mx-0 sm:mx-4 max-h-[90vh] overflow-y-auto">
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
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-end sm:items-center justify-center z-50">
          <div className="bg-gray-800 rounded-t-2xl sm:rounded-xl w-full sm:w-auto sm:max-w-md mx-0 sm:mx-4 border border-gray-700 p-5 sm:p-6">
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
    </div>
  );
};

export default LostItemsManagement;