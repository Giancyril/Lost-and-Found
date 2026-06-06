import { useState } from "react";
import {
  FaEdit, FaTrash, FaPlus, FaSearch, FaSave, FaTimes, FaBoxOpen,
  FaTshirt, FaGem, FaBook, FaIdCard, FaMobileAlt, FaBriefcase,
  FaWallet, FaHeadphones, FaKey, FaGlasses, FaUmbrella, FaFootballBall,
  FaLaptop, FaTabletAlt, FaCamera, FaClock, FaRing, FaTag,
  FaPlug, FaUsb, FaTint, FaPaintBrush, FaMusic, FaUtensils,
  FaCalculator, FaShapes, FaMoneyBillWave, FaBicycle, FaCar, FaGuitar,
  FaPen, FaRuler, FaFlask, FaMicrophone, FaGamepad, FaBatteryFull,
  FaMemory, FaMouse, FaKeyboard, FaPrint, FaHdd, FaWifi,
  FaBluetooth, FaSdCard, FaSimCard, FaTools, FaWrench, FaHammer,
  FaScrewdriver, FaPalette, FaCut, FaTape, FaFileAlt, FaFolder,
  FaEnvelope, FaPaperclip, FaStamp, FaBoxes, FaCube, FaScroll,
} from "react-icons/fa";
import { toast } from "react-toastify";
import {
  useCategoryQuery,
  useCreateCategoryMutation,
  useUpdateCategoryMutation,
  useDeleteCategoryMutation,
} from "../../redux/api/api";

interface Category {
  id: string;
  name: string;
  icon?: string;
  createdAt: string;
  updatedAt: string;
}

const iconOptions = [
  { icon: FaPaintBrush, name: "Art", color: "text-rose-400", bg: "bg-rose-500/10 border-rose-500/20" },
  { icon: FaBriefcase, name: "Bag", color: "text-amber-400", bg: "bg-amber-500/10 border-amber-500/20" },
  { icon: FaBatteryFull, name: "Battery", color: "text-lime-400", bg: "bg-lime-500/10 border-lime-500/20" },
  { icon: FaBicycle, name: "Bicycle", color: "text-emerald-400", bg: "bg-emerald-500/10 border-emerald-500/20" },
  { icon: FaBluetooth, name: "Bluetooth", color: "text-sky-400", bg: "bg-sky-500/10 border-sky-500/20" },
  { icon: FaBook, name: "Book", color: "text-yellow-400", bg: "bg-yellow-500/10 border-yellow-500/20" },
  { icon: FaTint, name: "Bottle", color: "text-cyan-400", bg: "bg-cyan-500/10 border-cyan-500/20" },
  { icon: FaBoxes, name: "Boxes", color: "text-orange-400", bg: "bg-orange-500/10 border-orange-500/20" },
  { icon: FaCalculator, name: "Calculator", color: "text-lime-400", bg: "bg-lime-500/10 border-lime-500/20" },
  { icon: FaCamera, name: "Camera", color: "text-violet-400", bg: "bg-violet-500/10 border-violet-500/20" },
  { icon: FaPlug, name: "Charger", color: "text-yellow-400", bg: "bg-yellow-500/10 border-yellow-500/20" },
  { icon: FaTshirt, name: "Cloth", color: "text-purple-400", bg: "bg-purple-500/10 border-purple-500/20" },
  { icon: FaCube, name: "Cube", color: "text-indigo-400", bg: "bg-indigo-500/10 border-indigo-500/20" },
  { icon: FaEnvelope, name: "Envelope", color: "text-blue-400", bg: "bg-blue-500/10 border-blue-500/20" },
  { icon: FaFileAlt, name: "File", color: "text-sky-400", bg: "bg-sky-500/10 border-sky-500/20" },
  { icon: FaFolder, name: "Folder", color: "text-amber-400", bg: "bg-amber-500/10 border-amber-500/20" },
  { icon: FaUtensils, name: "Food", color: "text-orange-400", bg: "bg-orange-500/10 border-orange-500/20" },
  { icon: FaGamepad, name: "Gaming", color: "text-purple-400", bg: "bg-purple-500/10 border-purple-500/20" },
  { icon: FaGem, name: "Gem", color: "text-pink-400", bg: "bg-pink-500/10 border-pink-500/20" },
  { icon: FaGlasses, name: "Glasses", color: "text-teal-400", bg: "bg-teal-500/10 border-teal-500/20" },
  { icon: FaGuitar, name: "Guitar", color: "text-rose-400", bg: "bg-rose-500/10 border-rose-500/20" },
  { icon: FaHammer, name: "Hammer", color: "text-amber-400", bg: "bg-amber-500/10 border-amber-500/20" },
  { icon: FaHdd, name: "Hard Drive", color: "text-indigo-400", bg: "bg-indigo-500/10 border-indigo-500/20" },
  { icon: FaHeadphones, name: "Headphones", color: "text-green-400", bg: "bg-green-500/10 border-green-500/20" },
  { icon: FaIdCard, name: "ID Card", color: "text-blue-400", bg: "bg-blue-500/10 border-blue-500/20" },
  { icon: FaKey, name: "Key", color: "text-orange-400", bg: "bg-orange-500/10 border-orange-500/20" },
  { icon: FaKeyboard, name: "Keyboard", color: "text-indigo-400", bg: "bg-indigo-500/10 border-indigo-500/20" },
  { icon: FaFlask, name: "Lab Equipment", color: "text-teal-400", bg: "bg-teal-500/10 border-teal-500/20" },
  { icon: FaLaptop, name: "Laptop", color: "text-indigo-400", bg: "bg-indigo-500/10 border-indigo-500/20" },
  { icon: FaMemory, name: "Memory Card", color: "text-cyan-400", bg: "bg-cyan-500/10 border-cyan-500/20" },
  { icon: FaMicrophone, name: "Microphone", color: "text-fuchsia-400", bg: "bg-fuchsia-500/10 border-fuchsia-500/20" },
  { icon: FaMoneyBillWave, name: "Money", color: "text-green-400", bg: "bg-green-500/10 border-green-500/20" },
  { icon: FaMouse, name: "Mouse", color: "text-cyan-400", bg: "bg-cyan-500/10 border-cyan-500/20" },
  { icon: FaMusic, name: "Music", color: "text-fuchsia-400", bg: "bg-fuchsia-500/10 border-fuchsia-500/20" },
  { icon: FaShapes, name: "Other", color: "text-violet-400", bg: "bg-violet-500/10 border-violet-500/20" },
  { icon: FaPalette, name: "Palette", color: "text-pink-400", bg: "bg-pink-500/10 border-pink-500/20" },
  { icon: FaPaperclip, name: "Paperclip", color: "text-teal-400", bg: "bg-teal-500/10 border-teal-500/20" },
  { icon: FaPen, name: "Pen", color: "text-blue-400", bg: "bg-blue-500/10 border-blue-500/20" },
  { icon: FaMobileAlt, name: "Phone", color: "text-cyan-400", bg: "bg-cyan-500/10 border-cyan-500/20" },
  { icon: FaPrint, name: "Printer", color: "text-purple-400", bg: "bg-purple-500/10 border-purple-500/20" },
  { icon: FaRing, name: "Ring", color: "text-yellow-400", bg: "bg-yellow-500/10 border-yellow-500/20" },
  { icon: FaRuler, name: "Ruler", color: "text-sky-400", bg: "bg-sky-500/10 border-sky-500/20" },
  { icon: FaCut, name: "Scissors", color: "text-red-400", bg: "bg-red-500/10 border-red-500/20" },
  { icon: FaScroll, name: "Scroll", color: "text-yellow-400", bg: "bg-yellow-500/10 border-yellow-500/20" },
  { icon: FaScrewdriver, name: "Screwdriver", color: "text-lime-400", bg: "bg-lime-500/10 border-lime-500/20" },
  { icon: FaSdCard, name: "SD Card", color: "text-rose-400", bg: "bg-rose-500/10 border-rose-500/20" },
  { icon: FaSimCard, name: "SIM Card", color: "text-orange-400", bg: "bg-orange-500/10 border-orange-500/20" },
  { icon: FaFootballBall, name: "Sports", color: "text-red-400", bg: "bg-red-500/10 border-red-500/20" },
  { icon: FaStamp, name: "Stamp", color: "text-red-400", bg: "bg-red-500/10 border-red-500/20" },
  { icon: FaTabletAlt, name: "Tablet", color: "text-indigo-400", bg: "bg-indigo-500/10 border-indigo-500/20" },
  { icon: FaTag, name: "Tag", color: "text-emerald-400", bg: "bg-emerald-500/10 border-emerald-500/20" },
  { icon: FaTape, name: "Tape", color: "text-yellow-400", bg: "bg-yellow-500/10 border-yellow-500/20" },
  { icon: FaTools, name: "Tools", color: "text-emerald-400", bg: "bg-emerald-500/10 border-emerald-500/20" },
  { icon: FaUmbrella, name: "Umbrella", color: "text-blue-400", bg: "bg-blue-500/10 border-blue-500/20" },
  { icon: FaUsb, name: "USB", color: "text-blue-400", bg: "bg-blue-500/10 border-blue-500/20" },
  { icon: FaCar, name: "Vehicle", color: "text-cyan-400", bg: "bg-cyan-500/10 border-cyan-500/20" },
  { icon: FaWallet, name: "Wallet", color: "text-amber-400", bg: "bg-amber-500/10 border-amber-500/20" },
  { icon: FaClock, name: "Watch", color: "text-sky-400", bg: "bg-sky-500/10 border-sky-500/20" },
  { icon: FaWifi, name: "WiFi Device", color: "text-blue-400", bg: "bg-blue-500/10 border-blue-500/20" },
  { icon: FaWrench, name: "Wrench", color: "text-orange-400", bg: "bg-orange-500/10 border-orange-500/20" },
];

const getCategoryIcon = (name: string, storedIcon?: string) => {
  // If we have a stored icon, use it
  if (storedIcon) {
    const iconOption = iconOptions.find(opt => opt.name === storedIcon);
    if (iconOption) {
      return { icon: <iconOption.icon size={13} />, color: iconOption.color, bg: iconOption.bg };
    }
  }
  
  // Fall back to keyword matching
  const n = name.toLowerCase();
  if (n.includes("cloth") || n.includes("shirt") || n.includes("wear") || n.includes("uniform")) return { icon: <FaTshirt size={13} />, color: "text-purple-400", bg: "bg-purple-500/10 border-purple-500/20" };
  if (n.includes("accessor") || n.includes("jewel") || n.includes("bracelet")) return { icon: <FaGem size={13} />, color: "text-pink-400", bg: "bg-pink-500/10 border-pink-500/20" };
  if (n.includes("book") || n.includes("stationery") || n.includes("pen")) return { icon: <FaBook size={13} />, color: "text-yellow-400", bg: "bg-yellow-500/10 border-yellow-500/20" };
  if (n === "id" || n.includes("card") || n.includes("license") || n === "identification") return { icon: <FaIdCard size={13} />, color: "text-blue-400", bg: "bg-blue-500/10 border-blue-500/20" };
  if (n === "documents" || n === "document") return { icon: <FaBook size={13} />, color: "text-yellow-400", bg: "bg-yellow-500/10 border-yellow-500/20" };
  if (n.includes("phone") || n.includes("mobile") || n.includes("cellphone")) return { icon: <FaMobileAlt size={13} />, color: "text-cyan-400", bg: "bg-cyan-500/10 border-cyan-500/20" };
  if (n.includes("laptop") || n.includes("computer")) return { icon: <FaLaptop size={13} />, color: "text-indigo-400", bg: "bg-indigo-500/10 border-indigo-500/20" };
  if (n.includes("tablet")) return { icon: <FaTabletAlt size={13} />, color: "text-indigo-400", bg: "bg-indigo-500/10 border-indigo-500/20" };
  if (n.includes("bag") || n.includes("purse") || n.includes("backpack")) return { icon: <FaBriefcase size={13} />, color: "text-amber-400", bg: "bg-amber-500/10 border-amber-500/20" };
  if (n.includes("wallet")) return { icon: <FaWallet size={13} />, color: "text-amber-400", bg: "bg-amber-500/10 border-amber-500/20" };
  if (n.includes("headphone") || n.includes("earphone") || n.includes("airpod")) return { icon: <FaHeadphones size={13} />, color: "text-green-400", bg: "bg-green-500/10 border-green-500/20" };
  if (n.includes("key")) return { icon: <FaKey size={13} />, color: "text-orange-400", bg: "bg-orange-500/10 border-orange-500/20" };
  if (n.includes("glass") || n.includes("spectacle")) return { icon: <FaGlasses size={13} />, color: "text-teal-400", bg: "bg-teal-500/10 border-teal-500/20" };
  if (n.includes("umbrella")) return { icon: <FaUmbrella size={13} />, color: "text-blue-400", bg: "bg-blue-500/10 border-blue-500/20" };
  if (n.includes("sport") || n.includes("ball") || n.includes("gym")) return { icon: <FaFootballBall size={13} />, color: "text-red-400", bg: "bg-red-500/10 border-red-500/20" };
  if (n.includes("camera")) return { icon: <FaCamera size={13} />, color: "text-violet-400", bg: "bg-violet-500/10 border-violet-500/20" };
  if (n.includes("watch") || n.includes("clock")) return { icon: <FaClock size={13} />, color: "text-gray-300", bg: "bg-gray-500/10 border-gray-500/20" };
  if (n.includes("ring")) return { icon: <FaRing size={13} />, color: "text-yellow-400", bg: "bg-yellow-500/10 border-yellow-500/20" };
  if (n.includes("charger") || n.includes("cable") || n.includes("plug")) return { icon: <FaPlug size={13} />, color: "text-yellow-400", bg: "bg-yellow-500/10 border-yellow-500/20" };
  if (n.includes("usb") || n.includes("flash") || n.includes("drive")) return { icon: <FaUsb size={13} />, color: "text-blue-400", bg: "bg-blue-500/10 border-blue-500/20" };
  if (n.includes("water") || n.includes("bottle") || n.includes("tumbler")) return { icon: <FaTint size={13} />, color: "text-cyan-400", bg: "bg-cyan-500/10 border-cyan-500/20" };
  if (n.includes("art") || n.includes("paint") || n.includes("brush")) return { icon: <FaPaintBrush size={13} />, color: "text-rose-400", bg: "bg-rose-500/10 border-rose-500/20" };
  if (n.includes("music") || n.includes("instrument") || n.includes("guitar")) return { icon: <FaMusic size={13} />, color: "text-fuchsia-400", bg: "bg-fuchsia-500/10 border-fuchsia-500/20" };
  if (n.includes("food") || n.includes("lunch") || n.includes("container")) return { icon: <FaUtensils size={13} />, color: "text-orange-400", bg: "bg-orange-500/10 border-orange-500/20" };
  if (n.includes("calculat")) return { icon: <FaCalculator size={13} />, color: "text-lime-400", bg: "bg-lime-500/10 border-lime-500/20" };
  if (n.includes("device") || n.includes("electronic") || n.includes("gadget")) return { icon: <FaLaptop size={13} />, color: "text-indigo-400", bg: "bg-indigo-500/10 border-indigo-500/20" };
  if (n.includes("money") || n.includes("cash") || n.includes("bill") || n.includes("currency")) return { icon: <FaMoneyBillWave size={13} />, color: "text-green-400", bg: "bg-green-500/10 border-green-500/20" };
  if (n.includes("other")) return { icon: <FaShapes size={13} />, color: "text-gray-400", bg: "bg-gray-500/10 border-gray-500/20" };
  return { icon: <FaTag size={13} />, color: "text-emerald-400", bg: "bg-emerald-500/10 border-emerald-500/20" };
};

const CategoriesManagement = () => {
  const [searchTerm, setSearchTerm]             = useState("");
  const [editingId, setEditingId]               = useState<string | null>(null);
  const [editForm, setEditForm]                 = useState({ name: "", iconIndex: 50 });
  const [showAddForm, setShowAddForm]           = useState(false);
  const [newCategory, setNewCategory]           = useState({ name: "", iconIndex: 50 });
  const [showDeleteModal, setShowDeleteModal]   = useState(false);
  const [categoryToDelete, setCategoryToDelete] = useState<Category | null>(null);
  const [showIconPicker, setShowIconPicker]     = useState(false);
  const [iconPickerMode, setIconPickerMode]     = useState<"add" | "edit">("add");

  const { data: categoriesData, isLoading } = useCategoryQuery(undefined);
  const [createCategory, { isLoading: isCreating }] = useCreateCategoryMutation();
  const [updateCategory, { isLoading: isUpdating }] = useUpdateCategoryMutation();
  const [deleteCategory, { isLoading: isDeleting }] = useDeleteCategoryMutation();

  const categories: Category[] = categoriesData?.data || [];
  const filteredCategories = categories.filter(c => c.name.toLowerCase().includes(searchTerm.toLowerCase()));

  const handleEdit   = (cat: Category) => { 
    const { icon, color, bg } = getCategoryIcon(cat.name, cat.icon);
    const iconIdx = iconOptions.findIndex(opt => opt.name === cat.icon);
    setEditingId(cat.id); 
    setEditForm({ name: cat.name, iconIndex: iconIdx >= 0 ? iconIdx : 50 }); 
  };
  const handleCancel = () => { setEditingId(null); setEditForm({ name: "", iconIndex: 50 }); };

  const handleSave = async () => {
    if (!editingId || !editForm.name.trim()) return;
    try {
      const iconName = iconOptions[editForm.iconIndex].name;
      await updateCategory({ id: editingId, data: { name: editForm.name.trim(), icon: iconName } }).unwrap();
      setEditingId(null); setEditForm({ name: "", iconIndex: 50 });
      toast.success("Category updated");
    } catch (e: any) { toast.error(e?.data?.message || "Failed to update"); }
  };

  const handleAdd = async () => {
    if (!newCategory.name.trim()) return;
    try {
      const iconName = iconOptions[newCategory.iconIndex].name;
      await createCategory({ name: newCategory.name.trim(), icon: iconName }).unwrap();
      setNewCategory({ name: "", iconIndex: 50 }); setShowAddForm(false);
      toast.success("Category added");
    } catch (e: any) { toast.error(e?.data?.message || "Failed to create"); }
  };

  const handleDeleteClick   = (cat: Category) => { setCategoryToDelete(cat); setShowDeleteModal(true); };
  const handleCancelDelete  = () => { setShowDeleteModal(false); setCategoryToDelete(null); };
  const handleConfirmDelete = async () => {
    if (!categoryToDelete) return;
    try {
      await deleteCategory(categoryToDelete.id).unwrap();
      setShowDeleteModal(false); setCategoryToDelete(null);
      toast.success("Category deleted");
    } catch (e: any) { toast.error(e?.data?.message || "Failed to delete"); }
  };

  const formatDate = (d: string) => new Date(d).toLocaleDateString("en-US", { year: "numeric", month: "short", day: "numeric" });

  if (isLoading) return (
    <div className="space-y-4 animate-pulse">
      <div className="grid grid-cols-2 gap-4">{[1,2].map(i => <div key={i} className="h-24 bg-gray-900 border border-white/5 rounded-2xl" />)}</div>
      {[1,2,3,4,5].map(i => <div key={i} className="h-14 bg-gray-900 border border-white/5 rounded-xl" />)}
    </div>
  );

  return (
    <div className="space-y-4 sm:space-y-6 max-w-7xl mx-auto">

      {/* Header row */}
      <div className="flex justify-end">
        <button onClick={() => setShowAddForm(true)}
          className="flex items-center gap-2 px-4 py-2 bg-blue-600 hover:bg-blue-500 text-white text-xs font-bold rounded-xl transition-all shrink-0">
          <FaPlus size={10} /> Add Category
        </button>
      </div>

      {/* Add form */}
      {showAddForm && (
        <div className="bg-gray-900 border border-white/5 rounded-2xl p-4 sm:p-5">
          <p className="text-white text-sm font-semibold mb-3">New Category</p>
          <div className="flex gap-3">
            {/* Icon picker button - more identifiable with text label */}
            <div className="flex flex-col gap-1 shrink-0">
              <button type="button" onClick={() => { setIconPickerMode("add"); setShowIconPicker(true); }}
                className={`w-9 h-9 rounded-xl border flex items-center justify-center hover:scale-105 hover:ring-2 hover:ring-cyan-400/30 transition-all ${iconOptions[newCategory.iconIndex].bg}`}
                title="Click to choose icon">
                {(() => {
                  const Icon = iconOptions[newCategory.iconIndex].icon;
                  return <Icon size={14} className={iconOptions[newCategory.iconIndex].color} />;
                })()}
              </button>
              <span className="text-[9px] text-gray-500 text-center font-medium">Icon</span>
            </div>
            <input type="text" placeholder="Category name" value={newCategory.name}
              onChange={e => setNewCategory({ ...newCategory, name: e.target.value })}
              onKeyDown={e => e.key === "Enter" && handleAdd()}
              className="flex-1 h-9 px-3 bg-gray-800/60 border border-white/5 rounded-xl text-white text-sm placeholder-gray-600 focus:outline-none focus:ring-2 focus:ring-blue-500/20 transition-all" />
            <button onClick={handleAdd} disabled={!newCategory.name.trim() || isCreating}
              className="h-9 px-4 bg-blue-600 hover:bg-blue-500 border border-blue-500/30 text-white disabled:opacity-50 rounded-xl text-xs font-semibold transition-all flex items-center gap-1.5">
              <FaSave size={11} /> {isCreating ? "Adding..." : "Add"}
            </button>
            <button onClick={() => { setShowAddForm(false); setNewCategory({ name: "", iconIndex: 50 }); }}
              className="h-9 px-4 bg-gray-800 hover:bg-gray-700 border border-white/5 text-gray-400 rounded-xl text-xs font-semibold transition-colors">
              Cancel
            </button>
          </div>
        </div>
      )}

      {/* Search */}
      <div className="relative group">
        <FaSearch className="absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-500 group-focus-within:text-blue-400 transition-colors" size={12} />
        <input type="text" placeholder="Search categories..." value={searchTerm} onChange={e => setSearchTerm(e.target.value)}
          className="w-full pl-10 pr-4 py-2.5 bg-gray-900 border border-white/5 rounded-xl text-white text-sm placeholder-gray-600 focus:outline-none focus:ring-2 focus:ring-blue-500/20 transition-all" />
      </div>

      {/* Desktop table */}
      <div className="hidden md:block bg-gray-900 border border-white/5 rounded-2xl overflow-hidden">
        <div className="grid grid-cols-12 gap-4 px-5 py-3 border-b border-white/5 text-[10px] uppercase tracking-widest text-gray-600 font-semibold">
          <div className="col-span-4">Category Name</div>
          <div className="col-span-3">Created</div>
          <div className="col-span-3">Updated</div>
          <div className="col-span-2 text-right">Actions</div>
        </div>
        {filteredCategories.length === 0 ? (
          <div className="py-20 text-center">
            <FaBoxOpen size={28} className="text-gray-700 mx-auto mb-3" />
            <p className="text-gray-500 text-sm">{searchTerm ? "No categories match your search." : "No categories yet."}</p>
          </div>
        ) : (
          <div className="divide-y divide-white/[0.04]">
            {filteredCategories.map(category => {
              const { icon, color, bg } = getCategoryIcon(category.name, category.icon);
              return (
                <div key={category.id} className="grid grid-cols-12 gap-4 items-center px-5 py-3.5 hover:bg-white/[0.02] transition-colors">
                  <div className="col-span-4">
                    {editingId === category.id ? (
                      <div className="flex items-center gap-2">
                        {/* Icon picker button in edit mode */}
                        <button type="button" onClick={() => { setIconPickerMode("edit"); setShowIconPicker(true); }}
                          className={`w-8 h-8 rounded-lg border flex items-center justify-center shrink-0 hover:scale-105 hover:ring-2 hover:ring-cyan-400/30 transition-all ${iconOptions[editForm.iconIndex].bg}`}
                          title="Click to change icon">
                          {(() => {
                            const Icon = iconOptions[editForm.iconIndex].icon;
                            return <Icon size={13} className={iconOptions[editForm.iconIndex].color} />;
                          })()}
                        </button>
                        <input type="text" value={editForm.name} onChange={e => setEditForm({ ...editForm, name: e.target.value })} onKeyDown={e => e.key === "Enter" && handleSave()}
                          className="flex-1 px-3 py-1.5 bg-gray-800 border border-white/10 rounded-lg text-white text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/20" />
                      </div>
                    ) : (
                      <div className="flex items-center gap-2.5">
                        <div className={`w-8 h-8 rounded-lg border flex items-center justify-center shrink-0 ${bg}`}>
                          <span className={color}>{icon}</span>
                        </div>
                        <span className="text-white text-sm font-medium">{category.name}</span>
                      </div>
                    )}
                  </div>
                  <div className="col-span-3"><p className="text-gray-500 text-xs">{formatDate(category.createdAt)}</p></div>
                  <div className="col-span-3"><p className="text-gray-500 text-xs">{formatDate(category.updatedAt)}</p></div>
                  <div className="col-span-2 flex items-center justify-end gap-1.5">
                    {editingId === category.id ? (
                      <>
                        <button onClick={handleSave} disabled={!editForm.name.trim() || isUpdating}
                          className="w-7 h-7 rounded-lg bg-blue-500/10 hover:bg-blue-500/20 border border-blue-500/20 flex items-center justify-center text-blue-400 transition-colors disabled:opacity-50"><FaSave size={11} /></button>
                        <button onClick={handleCancel}
                          className="w-7 h-7 rounded-lg bg-white/5 hover:bg-white/10 border border-white/5 flex items-center justify-center text-gray-400 hover:text-white transition-colors"><FaTimes size={11} /></button>
                      </>
                    ) : (
                      <>
                        <button onClick={() => handleEdit(category)}
                          className="w-7 h-7 rounded-lg bg-yellow-500/10 hover:bg-yellow-500/20 border border-yellow-500/20 flex items-center justify-center text-yellow-400 transition-colors"><FaEdit size={11} /></button>
                        <button onClick={() => handleDeleteClick(category)}
                          className="w-7 h-7 rounded-lg bg-red-500/10 hover:bg-red-500/20 border border-red-500/20 flex items-center justify-center text-red-400 transition-colors"><FaTrash size={11} /></button>
                      </>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Mobile cards */}
      <div className="md:hidden space-y-3">
        {filteredCategories.length === 0 ? (
          <div className="py-16 text-center bg-gray-900 border border-white/5 rounded-2xl">
            <FaBoxOpen size={24} className="text-gray-700 mx-auto mb-3" />
            <p className="text-gray-500 text-sm">{searchTerm ? "No categories match." : "No categories yet."}</p>
          </div>
        ) : filteredCategories.map(category => {
          const { icon, color, bg } = getCategoryIcon(category.name, category.icon);
          return (
            <div key={category.id} className="bg-gray-900 border border-white/5 rounded-2xl p-4 space-y-3">
              {editingId === category.id ? (
                <div className="space-y-3">
                  <div className="flex items-center gap-2">
                    {/* Icon picker button in mobile edit mode */}
                    <button type="button" onClick={() => { setIconPickerMode("edit"); setShowIconPicker(true); }}
                      className={`w-9 h-9 rounded-xl border flex items-center justify-center shrink-0 hover:scale-105 hover:ring-2 hover:ring-cyan-400/30 transition-all ${iconOptions[editForm.iconIndex].bg}`}
                      title="Click to change icon">
                      {(() => {
                        const Icon = iconOptions[editForm.iconIndex].icon;
                        return <Icon size={14} className={iconOptions[editForm.iconIndex].color} />;
                      })()}
                    </button>
                    <input type="text" value={editForm.name} onChange={e => setEditForm({ ...editForm, name: e.target.value })}
                      className="flex-1 h-9 px-3 bg-gray-800 border border-white/10 rounded-xl text-white text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/20" />
                  </div>
                  <div className="flex gap-2">
                    <button onClick={handleSave} disabled={!editForm.name.trim() || isUpdating}
                      className="flex-1 h-9 flex items-center justify-center gap-1.5 bg-blue-500/10 border border-blue-500/20 text-blue-400 rounded-xl text-xs font-semibold">
                      <FaSave size={11} /> {isUpdating ? "Saving..." : "Save"}
                    </button>
                    <button onClick={handleCancel} className="flex-1 h-9 flex items-center justify-center gap-1.5 bg-white/5 border border-white/5 text-gray-400 rounded-xl text-xs font-semibold">
                      <FaTimes size={11} /> Cancel
                    </button>
                  </div>
                </div>
              ) : (
                <>
                  <div className="flex items-center justify-between gap-2">
                    <div className="flex items-center gap-2.5">
                      <div className={`w-9 h-9 rounded-xl border flex items-center justify-center shrink-0 ${bg}`}><span className={color}>{icon}</span></div>
                      <p className="text-white font-semibold text-sm">{category.name}</p>
                    </div>
                    <div className="flex gap-1.5 shrink-0">
                      <button onClick={() => handleEdit(category)} className="w-7 h-7 rounded-lg bg-yellow-500/10 border border-yellow-500/20 flex items-center justify-center text-yellow-400"><FaEdit size={11} /></button>
                      <button onClick={() => handleDeleteClick(category)} className="w-7 h-7 rounded-lg bg-red-500/10 border border-red-500/20 flex items-center justify-center text-red-400"><FaTrash size={11} /></button>
                    </div>
                  </div>
                  <div className="grid grid-cols-2 gap-2 pt-2 border-t border-white/5 text-xs">
                    <div><p className="text-gray-600 text-[10px] uppercase tracking-widest">Created</p><p className="text-gray-400 mt-0.5">{new Date(category.createdAt).toLocaleDateString()}</p></div>
                    <div><p className="text-gray-600 text-[10px] uppercase tracking-widest">Updated</p><p className="text-gray-400 mt-0.5">{new Date(category.updatedAt).toLocaleDateString()}</p></div>
                  </div>
                </>
              )}
            </div>
          );
        })}
      </div>

      {/* Delete Modal */}
      {showDeleteModal && (
        <div className="fixed inset-0 bg-black/70 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-gray-900 border border-white/10 rounded-2xl w-full max-w-sm shadow-2xl">
            <div className="flex items-center justify-between px-5 py-3.5 border-b border-white/5">
              <div className="flex items-center gap-3">
                <div className="w-7 h-7 rounded-lg bg-red-500/10 border border-red-500/20 flex items-center justify-center shrink-0"><FaTrash size={11} className="text-red-400" /></div>
                <div><h2 className="text-sm font-bold text-white">Delete Category</h2><p className="text-gray-500 text-[11px]">This action cannot be undone</p></div>
              </div>
              <button onClick={handleCancelDelete} className="w-7 h-7 rounded-lg bg-white/5 hover:bg-white/10 flex items-center justify-center text-gray-400 hover:text-white transition-colors"><FaTimes size={12} /></button>
            </div>
            <div className="p-5 space-y-4">
              <div className="bg-gray-800/60 border border-white/5 rounded-xl p-3">
                <p className="text-gray-400 text-xs mb-1">Deleting category</p>
                <p className="text-white font-semibold">"{categoryToDelete?.name}"</p>
              </div>
              <div className="bg-red-500/5 border border-red-500/15 rounded-xl px-3.5 py-2.5">
                <p className="text-red-300/80 text-xs text-justify">This will permanently remove this category. Items using it may be affected.</p>
              </div>
              <div className="flex gap-2">
                <button onClick={handleCancelDelete} disabled={isDeleting} className="flex-1 bg-gray-800 hover:bg-gray-700 border border-white/5 text-gray-300 py-2.5 rounded-xl text-xs font-medium transition-colors disabled:opacity-50">Cancel</button>
                <button onClick={handleConfirmDelete} disabled={isDeleting} className="flex-1 bg-red-500/10 hover:bg-red-500 border border-red-500/30 text-red-400 hover:text-white disabled:opacity-50 py-2.5 rounded-xl text-xs font-semibold transition-all flex items-center justify-center gap-1.5">
                  {isDeleting ? "Deleting..." : <><FaTrash size={10} /> Delete</>}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Icon Picker Modal */}
      {showIconPicker && (
        <div className="fixed inset-0 bg-black/70 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-gray-900 border border-white/10 rounded-2xl w-full max-w-2xl shadow-2xl max-h-[80vh] overflow-hidden flex flex-col">
            <div className="flex items-center justify-between px-5 py-3.5 border-b border-white/5 shrink-0">
              <div>
                <h2 className="text-sm font-bold text-white">Choose an Icon</h2>
                <p className="text-gray-500 text-[11px]">Select an icon for your category</p>
              </div>
              <button onClick={() => setShowIconPicker(false)} 
                className="w-7 h-7 rounded-lg bg-white/5 hover:bg-white/10 flex items-center justify-center text-gray-400 hover:text-white transition-colors">
                <FaTimes size={12} />
              </button>
            </div>
            <div className="p-5 overflow-y-auto flex-1">
              <div className="grid grid-cols-4 sm:grid-cols-6 md:grid-cols-8 gap-2">
                {iconOptions.map((opt, idx) => {
                  const Icon = opt.icon;
                  const isSelected = iconPickerMode === "add" 
                    ? newCategory.iconIndex === idx 
                    : editForm.iconIndex === idx;
                  return (
                    <button key={idx} type="button"
                      onClick={() => {
                        if (iconPickerMode === "add") {
                          setNewCategory({ ...newCategory, iconIndex: idx });
                        } else {
                          setEditForm({ ...editForm, iconIndex: idx });
                        }
                        setShowIconPicker(false);
                      }}
                      className={`flex flex-col items-center gap-1.5 p-3 rounded-xl border transition-all hover:scale-105 ${
                        isSelected 
                          ? `${opt.bg} ring-2 ring-cyan-400` 
                          : "bg-gray-800/40 border-white/5 hover:bg-gray-800/60"
                      }`}>
                      <div className={`w-10 h-10 rounded-lg flex items-center justify-center ${opt.bg}`}>
                        <Icon size={18} className={opt.color} />
                      </div>
                      <span className="text-[9px] text-gray-400 font-medium truncate w-full text-center">
                        {opt.name}
                      </span>
                    </button>
                  );
                })}
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default CategoriesManagement;