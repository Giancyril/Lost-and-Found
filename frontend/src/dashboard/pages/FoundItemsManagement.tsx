import { useState, useRef, useEffect } from "react";
import {
  FaEdit, FaTrash, FaSearch, FaArchive,
  FaMapMarkerAlt, FaCalendarAlt, FaClipboardList,
  FaBoxOpen, FaTimes, FaChevronDown, FaCheck,
} from "react-icons/fa";
import { toast } from "react-toastify";
import {
  useGetFoundItemsQuery,
  useDeleteMyFoundItemMutation,
  useEditMyFoundItemMutation,
  useCategoryQuery,
  useArchiveFoundItemMutation,
} from "../../redux/api/api";
import { CustomDatePicker } from "../../components/ui/CustomDatePicker";

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
  reporterName?: string;  
  schoolEmail?: string;
  user?: { username: string; email?: string };
}

const COL = "2fr 1fr 1.2fr 0.8fr 0.8fr 1fr 120px";

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

const FoundItemsManagement = () => {
  const [searchTerm, setSearchTerm]         = useState("");
  const [statusFilter, setStatusFilter]     = useState<string>("ALL");
  const [categoryFilter, setCategoryFilter] = useState<string>("ALL");
  const [isEditModalOpen, setIsEditModalOpen]       = useState(false);
  const [editingItem, setEditingItem]               = useState<FoundItem | null>(null);
  const [isEditLoading, setIsEditLoading]           = useState(false);
  const [isDeleteModalOpen, setIsDeleteModalOpen]   = useState(false);
  const [deletingItem, setDeletingItem]             = useState<FoundItem | null>(null);
  const [isDeleteLoading, setIsDeleteLoading]       = useState(false);
  const [isArchiveModalOpen, setIsArchiveModalOpen] = useState(false);
  const [archivingItem, setArchivingItem]           = useState<FoundItem | null>(null);
  const [isArchiveLoading, setIsArchiveLoading]     = useState(false);
  const [editForm, setEditForm] = useState({ foundItemName: "", description: "", location: "", date: "" });

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



  if (isLoading) return (
    <div className="space-y-4 animate-pulse">
      <div className="grid grid-cols-3 gap-4">{[1,2,3].map(i => <div key={i} className="h-28 bg-gray-900 border border-white/5 rounded-2xl" />)}</div>
      {[1,2,3,4,5].map(i => <div key={i} className="h-14 bg-gray-900 border border-white/5 rounded-xl" />)}
    </div>
  );

  if (error) return (
    <div className="bg-red-500/5 border border-red-500/20 rounded-2xl p-6">
      <p className="text-red-400 text-sm">Error loading found items. Please try again.</p>
    </div>
  );

  const items = foundItemsData?.data || [];
  console.warn("Found items data:", foundItemsData);
console.warn("First item:", JSON.stringify(items[0], null, 2));
  const filteredItems = items.filter((item: FoundItem) => {
    const matchesSearch   = item.foundItemName.toLowerCase().includes(searchTerm.toLowerCase()) || item.description.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesStatus   = statusFilter === "ALL" || (statusFilter === "CLAIMED" && item.isClaimed) || (statusFilter === "ACTIVE" && !item.isClaimed);
    const matchesCategory = categoryFilter === "ALL" || item.category?.name === categoryFilter;
    const isNotArchived   = !item.isArchived; // Exclude archived items from main list
    return matchesSearch && matchesStatus && matchesCategory && isNotArchived;
  });

  const STATUS_TABS = [
    { label: "All",     value: "ALL"     },
    { label: "Active",  value: "ACTIVE"  },
    { label: "Claimed", value: "CLAIMED" },
  ];

  return (
    <div className="space-y-4 sm:space-y-6 max-w-7xl mx-auto">

      {/* Stats */}
      <div className="grid grid-cols-3 gap-2">
        {[
          { label: "Total Items", value: items.length,                                        accent: "bg-cyan-500/5",    icon: <FaSearch size={15} className="text-cyan-400" />,    sub: "all found items",     subColor: "text-gray-500"    },
          { label: "Active",      value: items.filter((i: FoundItem) => !i.isClaimed).length, accent: "bg-emerald-500/5", icon: <FaBoxOpen size={15} className="text-emerald-400" />, sub: "awaiting claim",      subColor: "text-emerald-400" },
          { label: "Claimed",     value: items.filter((i: FoundItem) => i.isClaimed).length,  accent: "bg-yellow-500/5",  icon: <FaArchive size={15} className="text-yellow-400" />,  sub: "successfully claimed", subColor: "text-yellow-400"  },
        ].map(({ label, value, accent, icon, sub, subColor }) => (
          <div key={label} className="min-w-0 relative bg-gray-900 border border-white/5 rounded-2xl p-2.5 flex flex-col gap-2 overflow-hidden">
            <div className={`absolute inset-0 opacity-30 ${accent} blur-3xl scale-150 pointer-events-none`} />
            <div className="relative"><div className={`w-9 h-9 rounded-xl flex items-center justify-center ${accent}`}>{icon}</div></div>
            <div className="relative">
              <p className="text-lg sm:text-xl font-bold text-white tracking-tight">{value}</p>
              <p className="text-gray-500 text-[11px] mt-0.5 font-medium">{label}</p>
              <p className={`text-[10px] mt-1 font-medium ${subColor}`}>{sub}</p>
            </div>
          </div>
        ))}
      </div>

      {/* Filters */}
      <div className="bg-gray-900 border border-white/5 rounded-2xl p-4 sm:p-5">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex-1 min-w-0 flex flex-col gap-3 sm:flex-row sm:items-center">
            <div className="relative flex-1 group">
              <FaSearch className="absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-500 group-focus-within:text-cyan-400 transition-colors" size={12} />
              <input type="text" placeholder="Search found items..." value={searchTerm} onChange={e => setSearchTerm(e.target.value)}
                className="w-full pl-10 pr-4 py-2.5 bg-gray-800/80 border border-white/10 rounded-2xl text-white text-sm placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-cyan-500/20 transition-all" />
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
                <button key={value} onClick={() => setStatusFilter(value)}
                  className={`min-w-[4.5rem] text-center px-3 py-2 rounded-xl text-xs font-semibold whitespace-nowrap focus:outline-none border ${
                    statusFilter === value ? "bg-cyan-500/10 text-cyan-400 border-cyan-500/20" : "border-transparent text-gray-400 hover:text-white"
                  }`}>
                  {label}
                </button>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* ── Desktop table ── */}
      <div className="hidden md:block bg-gray-900 border border-white/5 rounded-2xl overflow-hidden">

        {/* Header */}
        <div className="grid px-5 py-3 border-b border-white/5 text-[10px] uppercase tracking-widest text-gray-600 font-semibold gap-4"
          style={{ gridTemplateColumns: COL }}>
          <div>Item</div>
          <div>Category</div>
          <div>Location</div>
          <div>Date</div>
          <div>Status</div>
          <div>Reported By</div>
          <div className="text-right">Actions</div>
        </div>

        {filteredItems.length === 0 ? (
          <div className="py-20 text-center">
            <FaSearch size={28} className="text-gray-700 mx-auto mb-3" />
            <p className="text-gray-500 text-sm font-medium">No found items match your filters</p>
          </div>
        ) : (
          <div className="divide-y divide-white/[0.04]">
            {filteredItems.map((item: FoundItem) => (
              <div key={item.id}
                className="grid items-center px-5 py-3.5 gap-4 hover:bg-white/[0.02] transition-colors"
                style={{ gridTemplateColumns: COL }}>

                {/* Item */}
                <div className="min-w-0">
                  <p className="text-white text-sm font-medium truncate">{item.foundItemName}</p>
                  <p className="text-gray-500 text-xs truncate mt-0.5">{item.description}</p>
                </div>

                {/* Category */}
                <div>
                  <span className="text-xs px-2 py-0.5 bg-white/5 border border-white/5 text-gray-300 rounded-lg truncate block w-fit max-w-full">
                    {item.category?.name || "—"}
                  </span>
                </div>

                {/* Location */}
                <div className="flex items-center gap-1 text-gray-400 text-xs min-w-0">
                  <FaMapMarkerAlt size={9} className="text-blue-400 shrink-0" />
                  <span className="truncate">{item.location}</span>
                </div>

                {/* Date */}
                <div>
                  <p className="text-gray-500 text-xs">{new Date(item.date).toLocaleDateString()}</p>
                </div>

                {/* Status */}
                <div>
                  <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-bold border ${
                    item.isClaimed
                      ? "bg-yellow-400/10 text-yellow-400 border-yellow-400/20"
                      : "bg-emerald-400/10 text-emerald-400 border-emerald-400/20"
                  }`}>
                    {item.isClaimed ? "Claimed" : "Active"}
                  </span>
                </div>

                {/* Reported by */}
                <div className="min-w-0">
                  <p className="text-blue-400 text-xs truncate font-medium">
                    {item.user?.username || item.reporterName || "SAS Office"}
                  </p>
                  {item.schoolEmail || item.user?.email ? (
                    <p className="text-gray-500 text-[10px] truncate mt-0.5">
                      {item.schoolEmail || item.user?.email}
                    </p>
                  ) : null}
                </div>

                {/* Actions */}
                <div className="flex items-center justify-end gap-1">
                  <button onClick={() => handleEdit(item)}
                    className="w-6 h-6 rounded-lg bg-yellow-500/10 hover:bg-yellow-500/20 border border-yellow-500/20 flex items-center justify-center text-yellow-400 transition-colors shrink-0">
                    <FaEdit size={11} />
                  </button>
                  <button
                    onClick={() => handleArchive(item)}
                    className={`w-6 h-6 rounded-lg bg-orange-500/10 hover:bg-orange-500/20 border border-orange-500/20 flex items-center justify-center text-orange-400 transition-colors shrink-0 ${
                      (item.isClaimed || item.isArchived) ? "invisible pointer-events-none" : ""
                    }`}>
                    <FaArchive size={11} />
                  </button>
                  <button onClick={() => handleDelete(item)}
                    className="w-6 h-6 rounded-lg bg-red-500/10 hover:bg-red-500/20 border border-red-500/20 flex items-center justify-center text-red-400 transition-colors shrink-0">
                    <FaTrash size={11} />
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* ── Mobile cards ── */}
      <div className="md:hidden space-y-3">
        {filteredItems.length === 0 ? (
          <div className="py-16 text-center bg-gray-900 border border-white/5 rounded-2xl">
            <FaSearch size={24} className="text-gray-700 mx-auto mb-3" />
            <p className="text-gray-500 text-sm">No found items match your filters</p>
          </div>
        ) : filteredItems.map((item: FoundItem) => (
          <div key={item.id} className="bg-gray-900 border border-white/5 rounded-2xl p-4 space-y-3">
            <div className="flex items-start justify-between gap-2">
              <div className="flex-1 min-w-0">
                <p className="text-white font-semibold text-sm truncate">{item.foundItemName}</p>
                <p className="text-gray-500 text-xs mt-0.5 line-clamp-2">{item.description}</p>
              </div>
              <span className={`shrink-0 px-2 py-0.5 rounded-full text-[10px] font-bold border ${
                item.isClaimed ? "bg-yellow-400/10 text-yellow-400 border-yellow-400/20" : "bg-emerald-400/10 text-emerald-400 border-emerald-400/20"
              }`}>{item.isClaimed ? "Claimed" : "Active"}</span>
            </div>
            <div className="grid grid-cols-2 gap-2 text-xs pt-1 border-t border-white/5">
              <div><p className="text-gray-600 text-[10px] uppercase tracking-widest">Category</p><p className="text-gray-300 mt-0.5">{item.category?.name || "—"}</p></div>
              <div><p className="text-gray-600 text-[10px] uppercase tracking-widest">Location</p><p className="text-gray-300 mt-0.5">{item.location}</p></div>
              <div><p className="text-gray-600 text-[10px] uppercase tracking-widest">Date Found</p><p className="text-gray-300 mt-0.5">{new Date(item.date).toLocaleDateString()}</p></div>
              <div>
                <p className="text-gray-600 text-[10px] uppercase tracking-widest">Reporter</p>
                <p className="text-blue-400 text-xs font-medium mt-0.5">
                  {item.user?.username || item.reporterName || "SAS Office"}
                </p>
                {item.user?.email || item.schoolEmail ? (
                  <p className="text-gray-500 text-[10px] mt-0.5">
                    {item.user?.email || item.schoolEmail}
                  </p>
                ) : null}
              </div>
            </div>
            <div className="flex gap-2 pt-1">
              <button onClick={() => handleEdit(item)} className="flex-1 flex items-center justify-center gap-1 py-2 bg-yellow-500/10 border border-yellow-500/20 text-yellow-400 rounded-xl text-xs font-semibold"><FaEdit size={10} /> Edit</button>
              <button
                onClick={() => handleArchive(item)}
                className={`flex-1 flex items-center justify-center gap-1 py-2 bg-orange-500/10 border border-orange-500/20 text-orange-400 rounded-xl text-xs font-semibold ${
                  (item.isClaimed || item.isArchived) ? "invisible pointer-events-none" : ""
                }`}>
                <FaArchive size={10} /> Archive
              </button>
              <button onClick={() => handleDelete(item)} className="flex-1 flex items-center justify-center gap-1 py-2 bg-red-500/10 border border-red-500/20 text-red-400 rounded-xl text-xs font-semibold"><FaTrash size={10} /> Delete</button>
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
                <div className="w-7 h-7 rounded-lg bg-yellow-500/10 border border-yellow-500/20 flex items-center justify-center shrink-0"><FaEdit size={11} className="text-yellow-400" /></div>
                <div><h2 className="text-sm font-bold text-white">Edit Found Item</h2><p className="text-gray-500 text-[11px]">Update found item details</p></div>
              </div>
              <button onClick={handleEditCancel} className="w-7 h-7 rounded-lg bg-white/5 hover:bg-white/10 flex items-center justify-center text-gray-400 hover:text-white transition-colors"><FaTimes size={12} /></button>
            </div>
              <form onSubmit={handleEditSubmit} className="p-5 space-y-4 overflow-visible flex-1">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div className="bg-gray-800/60 border border-white/5 rounded-xl overflow-hidden">
                    <div className="flex items-center gap-2 px-3 py-2 border-b border-white/5"><FaBoxOpen size={10} className="text-cyan-400" /><p className="text-[10px] font-bold text-cyan-400 uppercase tracking-widest">Item Name</p></div>
                    <div className="p-3"><input type="text" value={editForm.foundItemName} onChange={e => setEditForm({ ...editForm, foundItemName: e.target.value })} disabled={isEditLoading} placeholder="e.g. Black Umbrella" className="w-full bg-transparent text-white text-sm placeholder-gray-600 focus:outline-none" required /></div>
                  </div>
                  <div className="bg-gray-800/60 border border-white/5 rounded-xl overflow-hidden">
                    <div className="flex items-center gap-2 px-3 py-2 border-b border-white/5"><FaMapMarkerAlt size={10} className="text-blue-400" /><p className="text-[10px] font-bold text-blue-400 uppercase tracking-widest">Location Found</p></div>
                    <div className="p-3"><input type="text" value={editForm.location} onChange={e => setEditForm({ ...editForm, location: e.target.value })} disabled={isEditLoading} placeholder="e.g. SWDC Building" className="w-full bg-transparent text-white text-sm placeholder-gray-600 focus:outline-none" required /></div>
                  </div>
                </div>
                <div className="bg-gray-800/60 border border-white/5 rounded-xl overflow-hidden">
                  <div className="flex items-center gap-2 px-3 py-2 border-b border-white/5"><FaClipboardList size={10} className="text-violet-400" /><p className="text-[10px] font-bold text-violet-400 uppercase tracking-widest">Description</p></div>
                  <div className="p-3"><textarea value={editForm.description} onChange={e => setEditForm({ ...editForm, description: e.target.value })} disabled={isEditLoading} rows={3} placeholder="Describe the item..." className="w-full bg-transparent text-white text-sm placeholder-gray-600 focus:outline-none resize-none" required /></div>
                </div>
                <div className="bg-gray-800/60 border border-white/5 rounded-xl">
                  <div className="flex items-center gap-2 px-3 py-2 border-b border-white/5">
                    <FaCalendarAlt size={10} className="text-emerald-400" />
                    <p className="text-[10px] font-bold text-emerald-400 uppercase tracking-widest">Date Found</p>
                  </div>
                  <div className="p-3">
                    <CustomDatePicker
                value={editForm.date}
                onChange={(v) => setEditForm({ ...editForm, date: v })}
                max={new Date().toISOString().split("T")[0]}
                placeholder="Select date found"
                openUp
              />
                </div>
              </div>
              <div className="flex gap-2">
                <button type="button" onClick={handleEditCancel} className="flex-1 bg-gray-800 hover:bg-gray-700 border border-white/5 text-gray-300 py-2.5 rounded-xl text-xs font-medium transition-colors">Cancel</button>
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
                <div className="w-7 h-7 rounded-lg bg-red-500/10 border border-red-500/20 flex items-center justify-center shrink-0"><FaTrash size={11} className="text-red-400" /></div>
                <div><h2 className="text-sm font-bold text-white">Delete Found Item</h2><p className="text-gray-500 text-[11px]">This action cannot be undone</p></div>
              </div>
              <button onClick={handleDeleteCancel} className="w-7 h-7 rounded-lg bg-white/5 hover:bg-white/10 flex items-center justify-center text-gray-400 hover:text-white transition-colors"><FaTimes size={12} /></button>
            </div>
            <div className="p-5 space-y-4">
              {deletingItem && (
                <div className="bg-gray-800/60 border border-white/5 rounded-xl p-3 space-y-1.5">
                  <p className="text-white text-sm font-semibold">{deletingItem.foundItemName}</p>
                  <p className="text-gray-400 text-xs">{deletingItem.description}</p>
                  <div className="flex items-center gap-3 pt-1 text-[10px] text-gray-500">
                    <span className="flex items-center gap-1"><FaMapMarkerAlt size={8} className="text-blue-400" />{deletingItem.location}</span>
                  </div>
                </div>
              )}
              <div className="bg-red-500/5 border border-red-500/15 rounded-xl px-3.5 py-2.5">
                <p className="text-red-300/80 text-xs text-justify">This will <strong>permanently remove</strong> the item and all associated data.</p>
              </div>
              <div className="flex gap-2">
                <button onClick={handleDeleteCancel} className="flex-1 bg-gray-800 hover:bg-gray-700 border border-white/5 text-gray-300 py-2.5 rounded-xl text-xs font-medium transition-colors">Cancel</button>
                <button onClick={handleDeleteConfirm} disabled={isDeleteLoading} className="flex-1 bg-red-500/10 hover:bg-red-500 border border-red-500/30 text-red-400 hover:text-white disabled:opacity-50 py-2.5 rounded-xl text-xs font-semibold transition-all flex items-center justify-center gap-1.5">
                  {isDeleteLoading ? <><Spinner /> Deleting...</> : <><FaTrash size={10} /> Delete Item</>}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Archive Modal */}
      {isArchiveModalOpen && archivingItem && (
        <div className="fixed inset-0 bg-black/70 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-gray-900 border border-white/10 rounded-2xl w-full max-w-sm shadow-2xl">
            <div className="flex items-center justify-between px-5 py-3.5 border-b border-white/5">
              <div className="flex items-center gap-3">
                <div className="w-7 h-7 rounded-lg bg-orange-500/10 border border-orange-500/20 flex items-center justify-center shrink-0"><FaArchive size={11} className="text-orange-400" /></div>
                <div><h2 className="text-sm font-bold text-white">Archive Found Item</h2><p className="text-gray-500 text-[11px]">Hidden from public listing</p></div>
              </div>
              <button onClick={handleArchiveCancel} className="w-7 h-7 rounded-lg bg-white/5 hover:bg-white/10 flex items-center justify-center text-gray-400 hover:text-white transition-colors"><FaTimes size={12} /></button>
            </div>
            <div className="p-5 space-y-4">
              <div className="bg-gray-800/60 border border-white/5 rounded-xl p-3 space-y-1.5">
                <p className="text-white text-sm font-semibold">{archivingItem.foundItemName}</p>
                <p className="text-gray-400 text-xs">{archivingItem.description}</p>
              </div>
              <div className="bg-orange-500/5 border border-orange-500/15 rounded-xl px-3.5 py-2.5">
                <p className="text-orange-300/80 text-xs">Archived items are <strong>not deleted</strong> — hidden from public and can be restored from <strong>Archive Log</strong>.</p>
              </div>
              <div className="flex gap-2">
                <button onClick={handleArchiveCancel} className="flex-1 bg-gray-800 hover:bg-gray-700 border border-white/5 text-gray-300 py-2.5 rounded-xl text-xs font-medium transition-colors">Cancel</button>
                <button onClick={handleArchiveConfirm} disabled={isArchiveLoading} className="flex-1 bg-orange-500/10 hover:bg-orange-500 border border-orange-500/30 text-orange-400 hover:text-white disabled:opacity-50 py-2.5 rounded-xl text-xs font-semibold transition-all flex items-center justify-center gap-1.5">
                  {isArchiveLoading ? <><Spinner /> Archiving...</> : <><FaArchive size={10} /> Archive Item</>}
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