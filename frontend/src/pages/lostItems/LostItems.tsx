import React, { useState, useEffect, useRef, useMemo } from "react";
import { Link } from "react-router-dom";
import {
  FaSearch, FaMapMarkerAlt, FaCalendarAlt,
  FaTimes, FaTag,
  FaWallet, FaMobileAlt, FaLaptop, FaKey, FaBriefcase,
  FaHeadphones, FaGlasses, FaBook, FaIdCard, FaUmbrella,
  FaTshirt, FaCamera, FaClock, FaTint, FaCheckCircle,
  FaTh, FaList, FaShare, FaComments,
  FaMoneyBillWave,
} from "react-icons/fa";
import { toast, ToastContainer } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";
import { useGetLostItemsQuery, useCategoryQuery } from "../../redux/api/api";
import { useUserVerification } from "../../auth/auth";
import { CommentModal } from "../../components/comments/CommentModal";

const getCategoryIcon = (name: string) => {
  const n = name?.toLowerCase() ?? "";
  if (n.includes("wallet")) return <FaWallet size={9} className="text-amber-400" />;
  if (n.includes("phone")) return <FaMobileAlt size={9} className="text-cyan-400" />;
  if (n.includes("laptop")) return <FaLaptop size={9} className="text-indigo-400" />;
  if (n.includes("key")) return <FaKey size={9} className="text-orange-400" />;
  if (n.includes("bag")) return <FaBriefcase size={9} className="text-amber-400" />;
  return <FaTag size={9} className="text-blue-400" />;
};

const GroupHeader = ({ label, count, accent }: { label: string; count: number; accent: string }) => (
  <div className="flex items-center gap-3 py-3 mb-1">
    <div className={`w-2 h-2 rounded-full ${accent === "red" ? "bg-red-400 animate-pulse" : "bg-gray-500"} shrink-0`} />
    <span className="text-xs font-black uppercase tracking-widest text-gray-400">{label}</span>
    <div className="flex-1 h-px border-t border-white/5" />
    <span className="text-[10px] font-bold px-2 py-0.5 rounded-full border border-white/10 bg-white/5 text-gray-500">
      {count} {count === 1 ? "item" : "items"}
    </span>
  </div>
);

const getItemGroup = (item: any): "today" | "week" | "older" => {
  const date = new Date(item.createdAt ?? item.date);
  const diffDays = (Date.now() - date.getTime()) / 86400000;
  if (diffDays < 1) return "today";
  if (diffDays < 7) return "week";
  return "older";
};

const shouldHideImage = (cat: string | undefined, isAdmin: boolean) => {
  if (isAdmin) return false;
  return ["wallet", "purse"].some(c => cat?.toLowerCase().includes(c));
};

const ItemCard = ({ item, isAdmin, onShare, onOpenComments }: { item: any; isAdmin: boolean; onShare: () => void; onOpenComments: () => void }) => {
  const hideImg = shouldHideImage(item?.category?.name, isAdmin);
  return (
    <div className="bg-gray-900 border border-white/5 rounded-2xl overflow-hidden flex flex-col group hover:border-gray-700/50 transition-all">
      <div className="relative h-48 bg-gray-800 shrink-0 overflow-hidden">
        {!hideImg && <img src={item?.img || "/bgimg.png"} alt="" className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500" onError={(e) => { (e.target as HTMLImageElement).src = "/bgimg.png"; }} />}
        <div className="absolute top-3 left-3 px-2 py-0.5 bg-red-500 text-[10px] font-bold rounded-full">Lost</div>
      </div>
      <div className="p-4 flex flex-col flex-1 gap-3">
        <div>
            <h3 className="text-white text-sm font-semibold truncate">{item?.lostItemName}</h3>
            <p className="text-gray-500 text-[11px] line-clamp-2 mt-0.5 leading-relaxed">{item?.description}</p>
        </div>
        <div className="mt-auto space-y-1.5 text-[10px] text-gray-400">
          <div className="flex items-center gap-2"><FaMapMarkerAlt size={8} className="text-blue-500" />{item?.location}</div>
          <div className="flex items-center gap-2"><FaCalendarAlt size={8} className="text-green-500" />{item?.date?.split("T")[0]}</div>
        </div>
        <div className="grid grid-cols-3 gap-1.5 pt-2 border-t border-white/5">
          <Link to={`/lostItems/${item.id}`} className="py-2 bg-white/5 hover:bg-white/10 text-[10px] text-center rounded-lg font-bold transition-colors text-gray-400 hover:text-white">Details</Link>
          <button onClick={onOpenComments} className="py-2 bg-blue-600 hover:bg-blue-500 text-[10px] text-white rounded-lg font-bold transition-colors flex items-center justify-center gap-1">
            <FaComments size={9} /> Sighted
          </button>
          <button onClick={onShare} className="py-2 bg-white/5 hover:bg-white/10 text-[10px] text-gray-400 flex items-center justify-center rounded-lg transition-colors hover:text-white"><FaShare size={9} /></button>
        </div>
      </div>
    </div>
  );
};

const ItemRow = ({ item, isAdmin, onShare, onOpenComments }: { item: any; isAdmin: boolean; onShare: () => void; onOpenComments: () => void }) => {
  const hideImg = shouldHideImage(item?.category?.name, isAdmin);
  return (
    <div className="bg-gray-900 border border-white/5 rounded-xl p-3 hover:border-gray-700/50 transition-all">
      <div className="flex items-center gap-3">
        <div className="w-12 h-12 rounded-lg bg-gray-800 overflow-hidden shrink-0 border border-white/5">
          {!hideImg && <img src={item?.img || "/bgimg.png"} alt="" className="w-full h-full object-cover" />}
        </div>
        <div className="flex-1 min-w-0">
          <h3 className="text-white text-sm font-semibold truncate">{item?.lostItemName}</h3>
          <p className="text-gray-500 text-[10px] truncate">{item?.location}</p>
        </div>
        <div className="flex items-center gap-1.5 flex-shrink-0">
          <button onClick={onOpenComments} className="px-3 py-2 bg-blue-600 hover:bg-blue-500 text-[10px] text-white rounded-lg font-bold transition-colors flex items-center gap-1">
            <FaComments size={9} /> Sighted
          </button>
          <Link to={`/lostItems/${item.id}`} className="px-3 py-2 bg-white/5 hover:bg-white/10 text-[10px] text-gray-400 rounded-lg font-bold transition-colors hover:text-white">Details</Link>
          <button onClick={onShare} className="p-2 bg-white/5 hover:bg-white/10 text-gray-400 rounded-lg transition-colors hover:text-white"><FaShare size={10} /></button>
        </div>
      </div>
    </div>
  );
};

const LostItemsPage = () => {
  const { data: lostItems, isLoading } = useGetLostItemsQuery({ searchTerm: "", page: 1, limit: 20 });
  const [viewMode, setViewMode] = useState<"grid" | "list">("grid");
  const [shareItem, setShareItem] = useState<any>(null);
  const [commentItem, setCommentItem] = useState<any>(null);

  const grouped = useMemo(() => {
    const today: any[] = [], week: any[] = [], older: any[] = [];
    lostItems?.data?.forEach((i: any) => {
      const g = getItemGroup(i);
      if (g === "today") today.push(i);
      else if (g === "week") week.push(i);
      else older.push(i);
    });
    return { today, week, older };
  }, [lostItems]);

  const renderGroup = (items: any[], label: string) => {
    if (!items.length) return null;
    return (
      <div className="mb-8">
        <GroupHeader label={label} count={items.length} accent={label === "Today" ? "red" : "gray"} />
        <div className={viewMode === "grid" ? "grid gap-6 grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4" : "space-y-4"}>
          {items.map(i => viewMode === "grid" 
            ? <ItemCard key={i.id} item={i} isAdmin={false} onShare={() => setShareItem(i)} onOpenComments={() => setCommentItem(i)} /> 
            : <ItemRow key={i.id} item={i} isAdmin={false} onShare={() => setShareItem(i)} onOpenComments={() => setCommentItem(i)} />
          )}
        </div>
      </div>
    );
  };

  return (
    <div className="min-h-screen bg-gray-950 pb-20 text-white">
      <div className="px-6 sm:px-10 lg:px-16 py-10 border-b border-white/5 bg-gray-900/50">
        <h1 className="text-2xl sm:text-3xl font-bold tracking-tight">Missing on Campus</h1>
        <p className="text-gray-500 text-sm mt-2">Help reunite lost belongings with their owners by sharing sightings and tips.</p>
      </div>
      
      <div className="px-6 sm:px-10 lg:px-16 py-8">
        <div className="flex items-center gap-3 mb-10">
          <div className="relative flex-1 group">
            <FaSearch className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-500 group-focus-within:text-blue-400 transition-colors" size={12} />
            <input type="text" placeholder="Search missing items..." className="w-full pl-11 pr-4 py-3 bg-gray-900 border border-white/5 rounded-xl text-sm outline-none focus:ring-1 focus:ring-blue-500/50 focus:border-blue-500/30 transition-all" />
          </div>
          <div className="flex bg-gray-900 border border-white/5 rounded-xl p-1 shrink-0">
            <button onClick={() => setViewMode("grid")} className={`p-2 rounded-lg transition-all ${viewMode === "grid" ? "bg-blue-600/20 text-blue-400" : "text-gray-500 hover:text-white"}`}><FaTh size={12} /></button>
            <button onClick={() => setViewMode("list")} className={`p-2 rounded-lg transition-all ${viewMode === "list" ? "bg-blue-600/20 text-blue-400" : "text-gray-500 hover:text-white"}`}><FaList size={12} /></button>
          </div>
        </div>

        {isLoading ? (
          <div className="flex flex-col items-center justify-center py-24 space-y-4">
            <div className="w-10 h-10 border-4 border-blue-500 border-t-transparent rounded-full animate-spin"></div>
            <p className="text-gray-500 text-sm font-bold animate-pulse">Scanning database...</p>
          </div>
        ) : (
          <>
            {renderGroup(grouped.today, "Today")}
            {renderGroup(grouped.week, "This Week")}
            {renderGroup(grouped.older, "Older Reports")}
          </>
        )}
      </div>

      {/* Share Modal */}
      {shareItem && (
        <div className="fixed inset-0 z-[110] flex items-center justify-center p-4 bg-black/90 backdrop-blur-md animate-in fade-in duration-200">
          <div className="bg-gray-900 border border-gray-800 rounded-2xl w-full max-w-sm p-6 shadow-2xl animate-in zoom-in-95 duration-200">
            <div className="flex justify-between items-center mb-6">
              <h3 className="text-lg font-bold text-white">Share Report</h3>
              <button onClick={() => setShareItem(null)} className="p-2 hover:bg-gray-800 rounded-full text-gray-500 transition-colors"><FaTimes /></button>
            </div>
            <p className="text-gray-400 text-sm mb-4">Anyone with this link can view the report details.</p>
            <div className="bg-gray-950 border border-gray-800 p-4 rounded-xl text-xs truncate text-blue-400 font-mono mb-6">{window.location.origin}/lostItems/{shareItem.id}</div>
            <button onClick={() => { navigator.clipboard.writeText(`${window.location.origin}/lostItems/${shareItem.id}`); toast.success("Link copied to clipboard!"); setShareItem(null); }} className="w-full py-3 bg-blue-600 hover:bg-blue-500 text-white rounded-xl font-bold transition-all shadow-lg shadow-blue-600/20">Copy URL</button>
          </div>
        </div>
      )}

      {/* Comment Modal */}
      <CommentModal 
        isOpen={!!commentItem} 
        onClose={() => setCommentItem(null)} 
        itemId={commentItem?.id || ""} 
        itemType="lost" 
        itemName={commentItem?.lostItemName || "Item"} 
      />

      <ToastContainer position="top-right" autoClose={3000} theme="dark" />
    </div>
  );
};

export default LostItemsPage;