import { useState, useRef, useEffect } from "react";
import {
  FaEdit, FaTrash, FaSearch,
  FaCheck, FaTimes,
  FaMapMarkerAlt, FaCalendarAlt,
  FaClipboardList, FaBoxOpen, FaTag, FaChevronDown,
} from "react-icons/fa";
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
import { CustomDatePicker } from "../../components/ui/CustomDatePicker";

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

const CategoryDropdown = ({
  value,
  onChange,
  options,
}: {
  value: string;
  onChange: (v: string) => void;
  options: { id: string; name: string }[];
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

  const selected = value === "ALL" ? "All Categories" : options.find(o => o.name === value)?.name ?? "All Categories";

  return (
    <div ref={ref} className="relative w-full sm:w-64">
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
            {[{ id: "ALL", name: "All Categories" }, ...options].map(opt => (
              <button
                key={opt.id}
                type="button"
                onClick={() => { onChange(opt.id === "ALL" ? "ALL" : opt.name); setOpen(false); }}
                className={`w-full text-left px-4 py-2.5 text-sm transition-colors flex items-center justify-between ${
                  (opt.id === "ALL" ? value === "ALL" : value === opt.name)
                    ? "bg-white/5 text-white font-semibold"
                    : "text-gray-400 hover:bg-white/[0.03] hover:text-white"
                }`}
              >
                {opt.name}
                {(opt.id === "ALL" ? value === "ALL" : value === opt.name) && (
                  <FaCheck size={9} className="text-gray-400 shrink-0" />
                )}
              </button>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};

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
      toast.success(currentStatus ? "Item marked as active." : "Item marked as resolved.");
    } catch { toast.error("Failed to update item status"); }
    finally { setMarkingAsFoundId(null); }
  };

  if (isLoading) return (
    <div className="space-y-4 animate-pulse">
      <div className="grid grid-cols-3 gap-4">
        {[1,2,3].map(i => <div key={i} className="h-28 bg-gray-900 border border-white/5 rounded-2xl" />)}
      </div>
      {[1,2,3,4,5].map(i => <div key={i} className="h-14 bg-gray-900 border border-white/5 rounded-xl" />)}
    </div>
  );

  if (error) return (
    <div className="bg-red-500/5 border border-red-500/20 rounded-2xl p-6">
      <p className="text-red-400 text-sm">Error loading lost items. Please try again.</p>
    </div>
  );

  const items = lostItemsData?.data || [];
  const filteredItems = items.filter((item: LostItem) => {
    const matchesSearch   = item.lostItemName.toLowerCase().includes(searchTerm.toLowerCase()) || item.description.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesStatus   = statusFilter === "ALL" || (statusFilter === "RESOLVED" && item.isFound) || (statusFilter === "ACTIVE" && !item.isFound);
    const matchesCategory = categoryFilter === "ALL" || item.category?.name === categoryFilter;
    return matchesSearch && matchesStatus && matchesCategory;
  });

  const now = new Date();
  const weekStart = new Date(now); weekStart.setDate(now.getDate() - 7); weekStart.setHours(0,0,0,0);
  const resolvedThisWeek = items.filter((i: LostItem) => i.isFound && new Date(i.date) >= weekStart).length;

  const STATUS_TABS = [
    { label: "All",      value: "ALL"      },
    { label: "Active",   value: "ACTIVE"   },
    { label: "Resolved", value: "RESOLVED" },
  ];

  return (
    <div className="space-y-4 sm:space-y-6 max-w-7xl mx-auto">

      {/* Stats */}
      <div className="grid grid-cols-3 gap-2">
        {[
          { label: "Total Reports",      value: items.length,                                     icon: <FaClipboardList size={14} className="text-red-400" />,      accent: "bg-red-500/5",    sub: "all time",               subColor: "text-gray-500"    },
          { label: "Active",             value: items.filter((i: LostItem) => !i.isFound).length, icon: <IoMdRadioButtonOn size={14} className="text-orange-400" />, accent: "bg-orange-500/5", sub: "still missing",          subColor: "text-orange-400"  },
          { label: "Resolved This Week", value: resolvedThisWeek,                                 icon: <MdCheckCircle size={14} className="text-emerald-400" />,    accent: "bg-emerald-500/5",sub: "found in last 7 days",   subColor: "text-emerald-400" },
        ].map(({ label, value, icon, accent, sub, subColor }) => (
          <div key={label} className={`min-w-0 relative bg-gray-900 border border-white/5 rounded-2xl p-2.5 flex flex-col gap-2 overflow-hidden`}>
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

      {/* Filters */}
      <div className="bg-gray-900 border border-white/5 rounded-2xl p-4 sm:p-5 space-y-3">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex-1 min-w-0 flex flex-col gap-3 sm:flex-row sm:items-center">
            <div className="relative flex-1 group">
              <FaSearch className="absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-500 group-focus-within:text-red-400 transition-colors" size={12} />
              <input type="text" placeholder="Search lost items..." value={searchTerm} onChange={e => setSearchTerm(e.target.value)}
                className="w-full pl-10 pr-4 py-2.5 bg-gray-800/80 border border-white/10 rounded-2xl text-white text-sm placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-red-500/20 focus:border-red-500/20 transition-all" />
            </div>
            <CategoryDropdown
              value={categoryFilter}
              onChange={setCategoryFilter}
              options={categoriesData?.data ?? []}
            />
          </div>

          <div className="flex justify-end">
            <div className="inline-flex gap-1 bg-gray-800/40 border border-white/10 rounded-2xl p-1">
              {STATUS_TABS.map(({ label, value }) => (
                <button
                  key={value}
                  onClick={() => setStatusFilter(value)}
                  className={`px-3 py-2 rounded-xl text-xs font-semibold whitespace-nowrap focus:outline-none select-none ${
                    statusFilter === value
                      ? "bg-red-500/10 text-red-300 border border-red-500/20"
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

      {/* Table — desktop */}
      <div className="hidden md:block bg-gray-900 border border-white/5 rounded-2xl overflow-hidden">
        <div className="grid grid-cols-12 gap-4 px-5 py-3 border-b border-white/5 text-[10px] uppercase tracking-widest text-gray-600 font-semibold">
          <div className="col-span-3">Item</div>
          <div className="col-span-2">Category</div>
          <div className="col-span-2">Location</div>
          <div className="col-span-1">Date</div>
          <div className="col-span-1">Status</div>
          <div className="col-span-2">Reporter</div>
          <div className="col-span-1 text-right">Actions</div>
        </div>

        {filteredItems.length === 0 ? (
          <div className="py-20 text-center">
            <FaSearch size={28} className="text-gray-700 mx-auto mb-3" />
            <p className="text-gray-500 text-sm font-medium">No lost items found</p>
            <p className="text-gray-700 text-xs mt-1">Try adjusting your filters</p>
          </div>
        ) : (
          <div className="divide-y divide-white/[0.04]">
            {filteredItems.map((item: LostItem) => (
              <div key={item.id} className="grid grid-cols-12 gap-4 items-center px-5 py-4 hover:bg-white/[0.02] transition-colors group">
                <div className="col-span-3 min-w-0">
                  <p className="text-white text-sm font-medium truncate">{item.lostItemName}</p>
                  <p className="text-gray-500 text-xs truncate mt-0.5">{item.description}</p>
                </div>
                <div className="col-span-2">
                  <span className="text-xs px-2 py-0.5 bg-white/5 border border-white/5 text-gray-300 rounded-lg">{item.category?.name || "—"}</span>
                </div>
                <div className="col-span-2">
                  <div className="flex items-center gap-1 text-gray-400 text-xs">
                    <FaMapMarkerAlt size={9} className="text-blue-400 shrink-0" />
                    <span className="truncate">{item.location}</span>
                  </div>
                </div>
                <div className="col-span-1">
                  <p className="text-gray-500 text-xs">{new Date(item.date).toLocaleDateString()}</p>
                </div>
                <div className="col-span-1">
                  <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-bold border ${
                    item.isFound
                      ? "bg-blue-400/10 text-blue-400 border-blue-400/20"
                      : "bg-emerald-400/10 text-emerald-400 border-emerald-400/20"
                  }`}>
                    {item.isFound ? "Resolved" : "Active"}
                  </span>
                </div>
                <div className="col-span-2 min-w-0">
                  <p className="text-gray-300 text-xs truncate">{item.user?.username || item.reporterName || "—"}</p>
                  {item.schoolEmail && <p className="text-blue-300/70 text-[10px] truncate">{item.schoolEmail}</p>}
                </div>
                <div className="col-span-1 flex items-center justify-end gap-1">
                  <button onClick={() => handleEdit(item)} title="Edit"
                    className="w-7 h-7 rounded-lg bg-yellow-500/10 hover:bg-yellow-500/20 border border-yellow-500/20 flex items-center justify-center text-yellow-400 transition-colors">
                    <FaEdit size={11} />
                  </button>
                  <button onClick={() => handleMarkAsResolved(item.id, item.isFound)} disabled={markingAsFoundId === item.id}
                    title={item.isFound ? "Mark as Active" : "Mark as Resolved"}
                    className={`w-7 h-7 rounded-lg flex items-center justify-center border transition-colors disabled:cursor-not-allowed ${
                      item.isFound
                        ? "bg-orange-500/10 hover:bg-orange-500/20 border-orange-500/20 text-orange-400"
                        : "bg-emerald-500/10 hover:bg-emerald-500/20 border-emerald-500/20 text-emerald-400"
                    }`}>
                    {markingAsFoundId === item.id ? <Spinner color={item.isFound ? "text-orange-400" : "text-emerald-400"} /> : item.isFound ? <FaTimes size={11} /> : <FaCheck size={11} />}
                  </button>
                  <button onClick={() => handleDelete(item)} title="Delete"
                    className="w-7 h-7 rounded-lg bg-red-500/10 hover:bg-red-500/20 border border-red-500/20 flex items-center justify-center text-red-400 transition-colors">
                    <FaTrash size={11} />
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Cards — mobile */}
      <div className="md:hidden space-y-3">
        {filteredItems.length === 0 ? (
          <div className="py-16 text-center bg-gray-900 border border-white/5 rounded-2xl">
            <FaSearch size={24} className="text-gray-700 mx-auto mb-3" />
            <p className="text-gray-500 text-sm">No lost items found</p>
          </div>
        ) : filteredItems.map((item: LostItem) => (
          <div key={item.id} className="bg-gray-900 border border-white/5 rounded-2xl p-4 space-y-3">
            <div className="flex items-start justify-between gap-2">
              <div className="flex-1 min-w-0">
                <p className="text-white font-semibold text-sm truncate">{item.lostItemName}</p>
                <p className="text-gray-500 text-xs mt-0.5 line-clamp-2">{item.description}</p>
              </div>
              <span className={`shrink-0 px-2 py-0.5 rounded-full text-[10px] font-bold border ${
                item.isFound ? "bg-blue-400/10 text-blue-400 border-blue-400/20" : "bg-emerald-400/10 text-emerald-400 border-emerald-400/20"
              }`}>
                {item.isFound ? "Resolved" : "Active"}
              </span>
            </div>
            <div className="grid grid-cols-2 gap-2 text-xs pt-1 border-t border-white/5">
              <div><p className="text-gray-600 text-[10px] uppercase tracking-widest">Category</p><p className="text-gray-300 mt-0.5">{item.category?.name || "—"}</p></div>
              <div><p className="text-gray-600 text-[10px] uppercase tracking-widest">Location</p><p className="text-gray-300 mt-0.5">{item.location}</p></div>
              <div><p className="text-gray-600 text-[10px] uppercase tracking-widest">Date Lost</p><p className="text-gray-300 mt-0.5">{new Date(item.date).toLocaleDateString()}</p></div>
              <div><p className="text-gray-600 text-[10px] uppercase tracking-widest">Reporter</p><p className="text-gray-300 mt-0.5">{item.user?.username || "—"}</p></div>
            </div>
            <div className="flex gap-2 pt-1">
              <button onClick={() => handleEdit(item)} className="flex-1 flex items-center justify-center gap-1.5 py-2 bg-yellow-500/10 hover:bg-yellow-500/20 border border-yellow-500/20 text-yellow-400 rounded-xl text-xs font-semibold transition-all">
                <FaEdit size={10} /> Edit
              </button>
              <button onClick={() => handleMarkAsResolved(item.id, item.isFound)} disabled={markingAsFoundId === item.id}
                className={`flex-1 flex items-center justify-center gap-1.5 py-2 rounded-xl text-xs font-semibold border transition-all ${
                  item.isFound ? "bg-orange-500/10 border-orange-500/20 text-orange-400" : "bg-emerald-500/10 border-emerald-500/20 text-emerald-400"
                }`}>
                {markingAsFoundId === item.id ? <Spinner /> : item.isFound ? <><FaTimes size={10} /> Reopen</> : <><FaCheck size={10} /> Resolve</>}
              </button>
              <button onClick={() => handleDelete(item)} className="flex-1 flex items-center justify-center gap-1.5 py-2 bg-red-500/10 hover:bg-red-500/20 border border-red-500/20 text-red-400 rounded-xl text-xs font-semibold transition-all">
                <FaTrash size={10} /> Delete
              </button>
            </div>
          </div>
        ))}
      </div>

      {/* Edit Modal */}
      {isEditModalOpen && (
        <div className="fixed inset-0 bg-black/70 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-gray-900 border border-white/10 rounded-2xl w-full max-w-2xl shadow-2xl flex flex-col">
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
                className="w-7 h-7 rounded-lg bg-white/5 hover:bg-white/10 flex items-center justify-center text-gray-400 hover:text-white transition-colors">
                <FaTimes size={12} />
              </button>
            </div>
            <form onSubmit={handleEditSubmit} className="p-5 space-y-4 overflow-visible flex-1">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div className="bg-gray-800/60 border border-white/5 rounded-xl overflow-hidden">
                  <div className="flex items-center gap-2 px-3 py-2 border-b border-white/5"><FaBoxOpen size={10} className="text-cyan-400" /><p className="text-[10px] font-bold text-cyan-400 uppercase tracking-widest">Item Name</p></div>
                  <div className="p-3"><input type="text" value={editFormData.lostItemName} onChange={e => setEditFormData({ ...editFormData, lostItemName: e.target.value })} disabled={isEditLoading} placeholder="e.g. Blue Backpack" className="w-full bg-transparent text-white text-sm placeholder-gray-600 focus:outline-none" required /></div>
                </div>
                <div className="bg-gray-800/60 border border-white/5 rounded-xl overflow-hidden">
                  <div className="flex items-center gap-2 px-3 py-2 border-b border-white/5"><FaMapMarkerAlt size={10} className="text-blue-400" /><p className="text-[10px] font-bold text-blue-400 uppercase tracking-widest">Last Known Location</p></div>
                  <div className="p-3"><input type="text" value={editFormData.location} onChange={e => setEditFormData({ ...editFormData, location: e.target.value })} disabled={isEditLoading} placeholder="e.g. Canteen Area" className="w-full bg-transparent text-white text-sm placeholder-gray-600 focus:outline-none" required /></div>
                </div>
              </div>
              <div className="bg-gray-800/60 border border-white/5 rounded-xl overflow-hidden">
                <div className="flex items-center gap-2 px-3 py-2 border-b border-white/5"><FaTag size={10} className="text-orange-400" /><p className="text-[10px] font-bold text-orange-400 uppercase tracking-widest">Category</p></div>
                <div className="p-3">
                  <select value={editFormData.categoryId} onChange={e => setEditFormData({ ...editFormData, categoryId: e.target.value })} disabled={isEditLoading} className="w-full bg-transparent text-white text-sm focus:outline-none appearance-none" required>
                    <option value="" className="bg-gray-900">Select category</option>
                    {categoriesData?.data?.map((c: any) => (<option key={c.id} value={c.id} className="bg-gray-900">{c.name}</option>))}
                  </select>
                </div>
              </div>
              <div className="bg-gray-800/60 border border-white/5 rounded-xl overflow-hidden">
                <div className="flex items-center gap-2 px-3 py-2 border-b border-white/5"><FaClipboardList size={10} className="text-violet-400" /><p className="text-[10px] font-bold text-violet-400 uppercase tracking-widest">Description</p></div>
                <div className="p-3"><textarea value={editFormData.description} onChange={e => setEditFormData({ ...editFormData, description: e.target.value })} disabled={isEditLoading} rows={3} placeholder="Describe the item..." className="w-full bg-transparent text-white text-sm placeholder-gray-600 focus:outline-none resize-none" required /></div>
              </div>
              <div className="bg-gray-800/60 border border-white/5 rounded-xl">
              <div className="flex items-center gap-2 px-3 py-2 border-b border-white/5">
                <FaCalendarAlt size={10} className="text-emerald-400" />
                <p className="text-[10px] font-bold text-emerald-400 uppercase tracking-widest">Date Lost</p>
              </div>
              <div className="p-3">
                <CustomDatePicker
              value={editFormData.date}
              onChange={(v) => setEditFormData({ ...editFormData, date: v })}
              max={new Date().toISOString().split("T")[0]}
              placeholder="Select date lost"
              openUp
            />
              </div>
            </div>
              <div className="flex gap-2 pt-1">
                <button type="button" onClick={handleEditCancel} disabled={isEditLoading} className="flex-1 bg-gray-800 hover:bg-gray-700 disabled:opacity-50 border border-white/5 text-gray-300 py-2.5 rounded-xl text-xs font-medium transition-colors">Cancel</button>
                <button type="submit" disabled={isEditLoading} className="flex-1 bg-yellow-500/10 hover:bg-yellow-500 border border-yellow-500/30 text-yellow-400 hover:text-white disabled:opacity-50 py-2.5 rounded-xl text-xs font-semibold transition-all flex items-center justify-center gap-1.5">
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
                className="w-7 h-7 rounded-lg bg-white/5 hover:bg-white/10 flex items-center justify-center text-gray-400 hover:text-white transition-colors">
                <FaTimes size={12} />
              </button>
            </div>
            <div className="p-5 space-y-4">
              {deletingItem && (
                <div className="bg-gray-800/60 border border-white/5 rounded-xl overflow-hidden">
                  <div className="flex items-center gap-2 px-3 py-2 border-b border-white/5">
                    <FaBoxOpen size={10} className="text-cyan-400" />
                    <p className="text-[10px] font-bold text-cyan-400 uppercase tracking-widest">Item to Delete</p>
                  </div>
                  <div className="p-3 space-y-1.5">
                    <p className="text-white text-sm font-semibold">{deletingItem.lostItemName}</p>
                    <p className="text-gray-400 text-xs">{deletingItem.description}</p>
                    <div className="flex items-center gap-3 pt-1 text-[10px] text-gray-500">
                      <span className="flex items-center gap-1"><FaMapMarkerAlt size={8} className="text-blue-400" />{deletingItem.location}</span>
                      <span className="flex items-center gap-1"><FaCalendarAlt size={8} className="text-emerald-400" />{new Date(deletingItem.date).toLocaleDateString()}</span>
                    </div>
                  </div>
                </div>
              )}
              <div className="bg-red-500/5 border border-red-500/15 rounded-xl px-3.5 py-2.5">
                <p className="text-red-300/80 text-xs leading-relaxed">This will <strong>permanently remove</strong> the item and all associated data.</p>
              </div>
              <div className="flex gap-2">
                <button onClick={handleDeleteCancel} disabled={isDeleteLoading}
                  className="flex-1 bg-gray-800 hover:bg-gray-700 disabled:opacity-50 border border-white/5 text-gray-300 py-2.5 rounded-xl text-xs font-medium transition-colors">Cancel</button>
                <button onClick={handleDeleteConfirm} disabled={isDeleteLoading}
                  className="flex-1 bg-red-500/10 hover:bg-red-500 border border-red-500/30 text-red-400 hover:text-white disabled:opacity-50 py-2.5 rounded-xl text-xs font-semibold transition-all flex items-center justify-center gap-1.5">
                  {isDeleteLoading ? <><Spinner /> Deleting...</> : <><FaTrash size={10} /> Delete Item</>}
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