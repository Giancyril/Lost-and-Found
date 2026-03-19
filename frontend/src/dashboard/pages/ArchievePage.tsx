import { useState } from "react";
import {
  FaArchive, FaSearch, FaUndo, FaTrash,
  FaCalendarAlt, FaMapMarkerAlt, FaExclamationTriangle,
  FaClock, FaCheckCircle,
} from "react-icons/fa";
import { toast } from "react-toastify";
import {
  useGetArchivedFoundItemsQuery,
  useGetStaleFoundItemsQuery,
  useArchiveFoundItemMutation,
  useRestoreFoundItemMutation,
  useDeleteMyFoundItemMutation,
} from "../../redux/api/api";

const daysAgo = (dateStr: string) => {
  const diff = Date.now() - new Date(dateStr).getTime();
  const d = Math.floor(diff / (1000 * 60 * 60 * 24));
  if (d === 0) return "Today";
  if (d === 1) return "Yesterday";
  return `${d} days ago`;
};

const formatDate = (d: string) =>
  new Date(d).toLocaleDateString("en-PH", { year: "numeric", month: "short", day: "numeric" });

type Tab = "stale" | "archived";

const ArchivePage = () => {
  const [activeTab, setActiveTab] = useState<Tab>(() => {
    return (sessionStorage.getItem("archiveTab") as Tab) ?? "stale";
  });
  const handleTabChange = (tab: Tab) => {
    sessionStorage.setItem("archiveTab", tab);
    setActiveTab(tab);
  };
  const [searchTerm, setSearchTerm] = useState("");
  const [restoring, setRestoring]   = useState<string | null>(null);
  const [archiving, setArchiving]   = useState<string | null>(null);
  const [deleting, setDeleting]     = useState<string | null>(null);

  const { data: archivedData, isLoading: archivedLoading, refetch: refetchArchived } =
    useGetArchivedFoundItemsQuery(undefined);
  const { data: staleData, isLoading: staleLoading, refetch: refetchStale } =
    useGetStaleFoundItemsQuery(undefined);

  const [archiveItem]  = useArchiveFoundItemMutation();
  const [restoreItem]  = useRestoreFoundItemMutation();
  const [deleteItem]   = useDeleteMyFoundItemMutation();

  const archivedItems = archivedData?.data ?? [];
  const staleItems    = staleData?.data    ?? [];

  const filteredArchived = archivedItems.filter((item: any) =>
    item.foundItemName?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    item.location?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    item.category?.name?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const filteredStale = staleItems.filter((item: any) =>
    item.foundItemName?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    item.location?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    item.category?.name?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const handleArchive = async (id: string, name: string) => {
    setArchiving(id);
    try {
      await archiveItem(id).unwrap();
      toast.success(`"${name}" moved to archive`);
      refetchStale();
      refetchArchived();
    } catch { toast.error("Failed to archive item"); }
    finally { setArchiving(null); }
  };

  const handleRestore = async (id: string, name: string) => {
    setRestoring(id);
    try {
      await restoreItem(id).unwrap();
      toast.success(`"${name}" restored to found items`);
      refetchArchived();
      refetchStale();
    } catch { toast.error("Failed to restore item"); }
    finally { setRestoring(null); }
  };

  const handleDelete = async (id: string, name: string) => {
    if (!confirm(`Permanently delete "${name}"? This cannot be undone.`)) return;
    setDeleting(id);
    try {
      await deleteItem(id).unwrap();
      toast.success(`"${name}" permanently deleted`);
      refetchArchived();
    } catch { toast.error("Failed to delete item"); }
    finally { setDeleting(null); }
  };

  const isLoading = activeTab === "stale" ? staleLoading : archivedLoading;
  const items     = activeTab === "stale" ? filteredStale : filteredArchived;

  return (
    <div className="space-y-4 sm:space-y-6 max-w-7xl mx-auto">


      {/* Tabs */}
      <div className="flex gap-1 bg-gray-900 border border-white/5 rounded-xl p-1 w-fit">
        <div
          role="button"
          tabIndex={-1}
          onMouseDown={(e) => e.preventDefault()}
          onClick={() => handleTabChange("stale")}
          className={`flex items-center gap-2 px-3 sm:px-4 py-2 rounded-lg text-xs sm:text-sm font-medium transition-colors cursor-pointer select-none ${
            activeTab === "stale"
              ? "bg-orange-500/10 text-orange-400 border border-orange-500/20"
              : "text-gray-500 hover:text-white"
          }`}
        >
          <FaClock size={11} /> Stale Items
          <span className="ml-1 text-[10px] bg-white/10 px-1.5 py-0.5 rounded-full">
            {staleItems.length}
          </span>
        </div>
        <div
          role="button"
          tabIndex={-1}
          onMouseDown={(e) => e.preventDefault()}
          onClick={() => handleTabChange("archived")}
          className={`flex items-center gap-2 px-3 sm:px-4 py-2 rounded-lg text-xs sm:text-sm font-medium transition-colors cursor-pointer select-none ${
            activeTab === "archived"
              ? "bg-gray-500/10 text-gray-300 border border-gray-500/20"
              : "text-gray-500 hover:text-white"
          }`}
        >
          <FaArchive size={11} /> Archived
          <span className="ml-1 text-[10px] bg-white/10 px-1.5 py-0.5 rounded-full">
            {archivedItems.length}
          </span>
        </div>
      </div>

      {/* Info banner */}
      {activeTab === "stale" && (
        <div className="bg-orange-500/5 border border-orange-500/20 rounded-xl px-4 py-3 flex items-start gap-3">
          <FaExclamationTriangle className="text-orange-400 shrink-0 mt-0.5" size={13} />
          <p className="text-orange-300 text-xs leading-relaxed">
            These found items have been <strong>unclaimed for 30+ days</strong>. You can archive them to remove them from the public listing, or leave them visible. Archived items can be restored at any time.
          </p>
        </div>
      )}
      {activeTab === "archived" && (
        <div className="bg-gray-800/50 border border-white/5 rounded-xl px-4 py-3 flex items-start gap-3">
          <FaArchive className="text-gray-400 shrink-0 mt-0.5" size={13} />
          <p className="text-gray-400 text-xs leading-relaxed">
            Archived items are <strong>hidden from the public found items page</strong>. Restore an item to make it visible again, or permanently delete it to remove it completely.
          </p>
        </div>
      )}

      {/* Search */}
      <div className="relative">
        <FaSearch className="absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-500" size={12} />
        <input
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          placeholder="Search by item name, location, or category..."
          className="w-full bg-gray-900 border border-white/5 rounded-xl pl-9 pr-4 py-2.5 text-sm text-white placeholder-gray-600 focus:outline-none focus:border-orange-500/40 transition-colors"
        />
      </div>

      {/* Content */}
      {isLoading ? (
        <div className="space-y-3">
          {[1,2,3].map(i => (
            <div key={i} className="h-24 bg-gray-800/60 rounded-xl animate-pulse" />
          ))}
        </div>
      ) : items.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-20 bg-gray-900 border border-white/5 rounded-2xl text-gray-600">
          {activeTab === "stale"
            ? <FaCheckCircle size={32} className="mb-3 opacity-40 text-emerald-500" />
            : <FaArchive size={32} className="mb-3 opacity-40" />}
          <p className="text-sm font-medium text-gray-400">
            {activeTab === "stale" ? "No stale items!" : "No archived items"}
          </p>
          <p className="text-xs mt-1 opacity-60">
            {activeTab === "stale"
              ? "All found items have been claimed within 30 days"
              : "Items you archive will appear here"}
          </p>
        </div>
      ) : (
        <>
          {/* Mobile cards */}
          <div className="space-y-3 md:hidden">
            {items.map((item: any) => {
              const daysOld = Math.floor((Date.now() - new Date(item.createdAt).getTime()) / (1000 * 60 * 60 * 24));
              const isVeryStale = daysOld > 60;
              return (
                <div key={item.id} className={`bg-gray-900 border rounded-xl p-4 space-y-3 ${isVeryStale ? "border-red-500/20" : "border-white/5"}`}>
                  <div className="flex items-center gap-3">
                    <img
                      src={item.img || "/bgimg.png"}
                      alt={item.foundItemName}
                      onError={(e) => { (e.target as HTMLImageElement).src = "/bgimg.png"; }}
                      className="w-12 h-12 rounded-lg object-cover shrink-0"
                    />
                    <div className="min-w-0 flex-1">
                      <p className="text-white font-semibold text-sm truncate">{item.foundItemName}</p>
                      <span className="text-[10px] px-1.5 py-0.5 bg-blue-900/40 text-blue-300 rounded">
                        {item.category?.name}
                      </span>
                    </div>
                    <div className={`shrink-0 px-2 py-1 rounded-full text-[10px] font-bold border ${
                      isVeryStale
                        ? "bg-red-400/10 text-red-400 border-red-400/20"
                        : "bg-orange-400/10 text-orange-400 border-orange-400/20"
                    }`}>
                      {daysOld}d old
                    </div>
                  </div>
                  <div className="flex items-center gap-3 text-xs text-gray-500">
                    <span className="flex items-center gap-1">
                      <FaCalendarAlt size={9} />
                      {formatDate(item.createdAt)}
                    </span>
                    <span className="flex items-center gap-1 truncate">
                      <FaMapMarkerAlt size={9} />
                      {item.location}
                    </span>
                  </div>
                  {activeTab === "archived" && item.archivedAt && (
                    <p className="text-gray-600 text-[10px]">
                      Archived {daysAgo(item.archivedAt)}
                    </p>
                  )}
                  <div className="flex gap-2 pt-1">
                    {activeTab === "stale" ? (
                      <button
                        onClick={() => handleArchive(item.id, item.foundItemName)}
                        disabled={archiving === item.id}
                        className="flex-1 flex items-center justify-center gap-1.5 py-2 bg-orange-500/10 hover:bg-orange-500/20 border border-orange-500/20 text-orange-400 text-xs font-medium rounded-lg transition-colors disabled:opacity-50"
                      >
                        <FaArchive size={10} />
                        {archiving === item.id ? "Archiving..." : "Archive"}
                      </button>
                    ) : (
                      <>
                        <button
                          onClick={() => handleRestore(item.id, item.foundItemName)}
                          disabled={restoring === item.id}
                          className="flex-1 flex items-center justify-center gap-1.5 py-2 bg-cyan-500/10 hover:bg-cyan-500/20 border border-cyan-500/20 text-cyan-400 text-xs font-medium rounded-lg transition-colors disabled:opacity-50"
                        >
                          <FaUndo size={10} />
                          {restoring === item.id ? "Restoring..." : "Restore"}
                        </button>
                        <button
                          onClick={() => handleDelete(item.id, item.foundItemName)}
                          disabled={deleting === item.id}
                          className="flex items-center justify-center gap-1.5 px-3 py-2 bg-red-500/10 hover:bg-red-500/20 border border-red-500/20 text-red-400 text-xs font-medium rounded-lg transition-colors disabled:opacity-50"
                        >
                          <FaTrash size={10} />
                        </button>
                      </>
                    )}
                  </div>
                </div>
              );
            })}
          </div>

          {/* Desktop table */}
          <div className="hidden md:block bg-gray-900 border border-white/5 rounded-2xl overflow-hidden">
            <div className="grid grid-cols-12 gap-4 px-5 py-3 border-b border-white/5 text-[11px] uppercase tracking-widest text-gray-600 font-medium">
              <div className="col-span-3">Item</div>
              <div className="col-span-2">Category</div>
              <div className="col-span-2">Location</div>
              <div className="col-span-2">{activeTab === "stale" ? "Found On" : "Archived On"}</div>
              <div className="col-span-1">Age</div>
              <div className="col-span-2">Actions</div>
            </div>
            <div className="divide-y divide-white/5">
              {items.map((item: any) => {
                const daysOld = Math.floor((Date.now() - new Date(item.createdAt).getTime()) / (1000 * 60 * 60 * 24));
                const isVeryStale = daysOld > 60;
                return (
                  <div key={item.id} className="grid grid-cols-12 gap-4 items-center px-5 py-4 hover:bg-white/[0.02] transition-colors">
                    <div className="col-span-3 flex items-center gap-3">
                      <img
                        src={item.img || "/bgimg.png"}
                        alt={item.foundItemName}
                        onError={(e) => { (e.target as HTMLImageElement).src = "/bgimg.png"; }}
                        className="w-10 h-10 rounded-lg object-cover shrink-0"
                      />
                      <div className="min-w-0">
                        <p className="text-white text-sm font-medium truncate">{item.foundItemName}</p>
                        <p className="text-gray-500 text-xs truncate">{item.description}</p>
                      </div>
                    </div>
                    <div className="col-span-2">
                      <span className="text-xs px-2 py-0.5 bg-blue-900/30 text-blue-300 rounded-full">
                        {item.category?.name ?? "—"}
                      </span>
                    </div>
                    <div className="col-span-2">
                      <p className="text-gray-400 text-xs truncate">{item.location}</p>
                    </div>
                    <div className="col-span-2">
                      <p className="text-gray-400 text-xs">
                        {formatDate(activeTab === "archived" ? (item.archivedAt ?? item.createdAt) : item.createdAt)}
                      </p>
                    </div>
                    <div className="col-span-1">
                      <span className={`text-xs font-bold px-2 py-0.5 rounded-full border ${
                        isVeryStale
                          ? "bg-red-400/10 text-red-400 border-red-400/20"
                          : "bg-orange-400/10 text-orange-400 border-orange-400/20"
                      }`}>
                        {daysOld}d
                      </span>
                    </div>
                    {/* ── Actions column — widened to col-span-1, buttons now wrap nicely ── */}
                    <div className="col-span-2 flex items-center gap-1.5">
                      {activeTab === "stale" ? (
                        <button
                          onClick={() => handleArchive(item.id, item.foundItemName)}
                          disabled={archiving === item.id}
                          title="Archive this item"
                          className="flex items-center gap-1 px-2.5 py-1.5 bg-orange-500/10 hover:bg-orange-500/20 border border-orange-500/20 text-orange-400 text-xs font-medium rounded-lg transition-colors disabled:opacity-50"
                        >
                          <FaArchive size={10} />
                          {archiving === item.id ? "..." : "Archive"}
                        </button>
                      ) : (
                        <>
                          <button
                            onClick={() => handleRestore(item.id, item.foundItemName)}
                            disabled={restoring === item.id}
                            title="Restore item"
                            className="flex items-center gap-1 px-2.5 py-1.5 bg-cyan-500/10 hover:bg-cyan-500/20 border border-cyan-500/20 text-cyan-400 text-xs font-medium rounded-lg transition-colors disabled:opacity-50"
                          >
                            <FaUndo size={10} />
                            {restoring === item.id ? "..." : "Restore"}
                          </button>
                          <button
                            onClick={() => handleDelete(item.id, item.foundItemName)}
                            disabled={deleting === item.id}
                            title="Permanently delete"
                            className="flex items-center gap-1 px-2.5 py-1.5 bg-red-500/10 hover:bg-red-500/20 border border-red-500/20 text-red-400 text-xs font-medium rounded-lg transition-colors disabled:opacity-50"
                          >
                            <FaTrash size={10} />
                            {deleting === item.id ? "..." : "Delete"}
                          </button>
                        </>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </>
      )}
    </div>
  );
};

export default ArchivePage;