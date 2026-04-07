import { useState } from "react";
import {
  FaEdit, FaTrash, FaPlus, FaSearch, FaSave, FaTimes, FaBoxOpen,
  FaTshirt, FaGem, FaBook, FaIdCard, FaMobileAlt, FaBriefcase,
  FaWallet, FaHeadphones, FaKey, FaGlasses, FaUmbrella, FaFootballBall,
  FaLaptop, FaTabletAlt, FaCamera, FaClock, FaRing, FaTag,
  FaPlug, FaUsb, FaTint, FaPaintBrush, FaMusic, FaUtensils,
  FaCalculator, FaShapes,
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
  createdAt: string;
  updatedAt: string;
}

interface FormData {
  name: string;
}

// Map category name keywords to icons + colors
const getCategoryIcon = (name: string) => {
  const n = name.toLowerCase();
  if (n.includes("cloth") || n.includes("shirt") || n.includes("wear") || n.includes("apparel") || n.includes("fashion") || n.includes("uniform"))
    return { icon: <FaTshirt size={13} />, color: "text-purple-400", bg: "bg-purple-500/10" };
  if (n.includes("accessor") || n.includes("jewel") || n.includes("bracelet") || n.includes("necklace"))
    return { icon: <FaGem size={13} />, color: "text-pink-400", bg: "bg-pink-500/10" };
  if (n.includes("book") || n.includes("stationery") || n.includes("pen") || n.includes("notebook"))
    return { icon: <FaBook size={13} />, color: "text-yellow-400", bg: "bg-yellow-500/10" };
  if (n.includes("id") || n.includes("card") || n.includes("document") || n.includes("license"))
    return { icon: <FaIdCard size={13} />, color: "text-blue-400", bg: "bg-blue-500/10" };
  if (n.includes("phone") || n.includes("mobile") || n.includes("celphone") || n.includes("cellphone"))
    return { icon: <FaMobileAlt size={13} />, color: "text-cyan-400", bg: "bg-cyan-500/10" };
  if (n.includes("laptop") || n.includes("computer") || n.includes("pc"))
    return { icon: <FaLaptop size={13} />, color: "text-indigo-400", bg: "bg-indigo-500/10" };
  if (n.includes("tablet") || n.includes("ipad"))
    return { icon: <FaTabletAlt size={13} />, color: "text-indigo-400", bg: "bg-indigo-500/10" };
  if (n.includes("electronic") || n.includes("device") || n.includes("gadget"))
    return { icon: <FaLaptop size={13} />, color: "text-indigo-400", bg: "bg-indigo-500/10" };
  if (n.includes("bag") || n.includes("purse") || n.includes("pouch") || n.includes("backpack") || n.includes("luggage"))
    return { icon: <FaBriefcase size={13} />, color: "text-amber-400", bg: "bg-amber-500/10" };
  if (n.includes("wallet"))
    return { icon: <FaWallet size={13} />, color: "text-amber-400", bg: "bg-amber-500/10" };
  if (n.includes("headphone") || n.includes("earphone") || n.includes("airpod") || n.includes("audio"))
    return { icon: <FaHeadphones size={13} />, color: "text-green-400", bg: "bg-green-500/10" };
  if (n.includes("key") || n.includes("keychain"))
    return { icon: <FaKey size={13} />, color: "text-orange-400", bg: "bg-orange-500/10" };
  if (n.includes("glass") || n.includes("spectacle") || n.includes("eyewear") || n.includes("sunglass"))
    return { icon: <FaGlasses size={13} />, color: "text-teal-400", bg: "bg-teal-500/10" };
  if (n.includes("umbrella"))
    return { icon: <FaUmbrella size={13} />, color: "text-blue-400", bg: "bg-blue-500/10" };
  if (n.includes("sport") || n.includes("ball") || n.includes("gym"))
    return { icon: <FaFootballBall size={13} />, color: "text-red-400", bg: "bg-red-500/10" };
  if (n.includes("camera") || n.includes("photo"))
    return { icon: <FaCamera size={13} />, color: "text-violet-400", bg: "bg-violet-500/10" };
  if (n.includes("watch") || n.includes("clock"))
    return { icon: <FaClock size={13} />, color: "text-gray-300", bg: "bg-gray-500/10" };
  if (n.includes("ring"))
    return { icon: <FaRing size={13} />, color: "text-yellow-400", bg: "bg-yellow-500/10" };
  if (n.includes("charger") || n.includes("cable") || n.includes("cord") || n.includes("plug") || n.includes("adapter"))
    return { icon: <FaPlug size={13} />, color: "text-yellow-400", bg: "bg-yellow-500/10" };
  if (n.includes("flash") || n.includes("usb") || n.includes("drive") || n.includes("memory") || n.includes("storage"))
    return { icon: <FaUsb size={13} />, color: "text-blue-400", bg: "bg-blue-500/10" };
  if (n.includes("water") || n.includes("bottle") || n.includes("tumbler") || n.includes("flask") || n.includes("drink"))
    return { icon: <FaTint size={13} />, color: "text-cyan-400", bg: "bg-cyan-500/10" };
  if (n.includes("art") || n.includes("draw") || n.includes("paint") || n.includes("sketch") || n.includes("brush"))
    return { icon: <FaPaintBrush size={13} />, color: "text-rose-400", bg: "bg-rose-500/10" };
  if (n.includes("music") || n.includes("instrument") || n.includes("guitar") || n.includes("violin"))
    return { icon: <FaMusic size={13} />, color: "text-fuchsia-400", bg: "bg-fuchsia-500/10" };
  if (n.includes("lunch") || n.includes("food") || n.includes("container") || n.includes("box") || n.includes("snack"))
    return { icon: <FaUtensils size={13} />, color: "text-orange-400", bg: "bg-orange-500/10" };
  if (n.includes("calculat"))
    return { icon: <FaCalculator size={13} />, color: "text-lime-400", bg: "bg-lime-500/10" };
  if (n.includes("other"))
    return { icon: <FaShapes size={13} />, color: "text-gray-400", bg: "bg-gray-500/10" };
  // default
  return { icon: <FaTag size={13} />, color: "text-green-400", bg: "bg-green-500/10" };
};

const CategoriesManagement = () => {
  const [searchTerm, setSearchTerm]               = useState("");
  const [editingId, setEditingId]                 = useState<string | null>(null);
  const [editForm, setEditForm]                   = useState<FormData>({ name: "" });
  const [showAddForm, setShowAddForm]             = useState(false);
  const [newCategory, setNewCategory]             = useState<FormData>({ name: "" });
  const [showDeleteModal, setShowDeleteModal]     = useState(false);
  const [categoryToDelete, setCategoryToDelete]   = useState<Category | null>(null);

  const { data: categoriesData, isLoading } = useCategoryQuery(undefined);
  const [createCategory, { isLoading: isCreating }] = useCreateCategoryMutation();
  const [updateCategory, { isLoading: isUpdating }] = useUpdateCategoryMutation();
  const [deleteCategory, { isLoading: isDeleting }] = useDeleteCategoryMutation();

  const categories: Category[] = categoriesData?.data || [];
  const filteredCategories = categories.filter((c) =>
    c.name.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const handleEdit   = (cat: Category) => { setEditingId(cat.id); setEditForm({ name: cat.name }); };
  const handleCancel = () => { setEditingId(null); setEditForm({ name: "" }); };

  const handleSave = async () => {
    if (!editingId || !editForm.name.trim()) return;
    try {
      await updateCategory({ id: editingId, data: { name: editForm.name.trim() } }).unwrap();
      setEditingId(null); setEditForm({ name: "" });
      toast.success("Category updated successfully");
    } catch (e: any) { toast.error(e?.data?.message || "Failed to update category"); }
  };

  const handleAdd = async () => {
    if (!newCategory.name.trim()) return;
    try {
      await createCategory({ name: newCategory.name.trim() }).unwrap();
      setNewCategory({ name: "" }); setShowAddForm(false);
      toast.success("Category added successfully");
    } catch (e: any) { toast.error(e?.data?.message || "Failed to create category"); }
  };

  const handleDeleteClick    = (cat: Category) => { setCategoryToDelete(cat); setShowDeleteModal(true); };
  const handleCancelDelete   = () => { setShowDeleteModal(false); setCategoryToDelete(null); };
  const handleConfirmDelete  = async () => {
    if (!categoryToDelete) return;
    try {
      await deleteCategory(categoryToDelete.id).unwrap();
      setShowDeleteModal(false); setCategoryToDelete(null);
      toast.success("Category deleted successfully");
    } catch (e: any) { toast.error(e?.data?.message || "Failed to delete category"); }
  };

  const formatDate = (d: string) =>
    new Date(d).toLocaleDateString("en-US", { year: "numeric", month: "short", day: "numeric", hour: "2-digit", minute: "2-digit" });

  if (isLoading) return (
    <div className="space-y-4 sm:space-y-6 animate-pulse">
      <div className="h-8 bg-gray-700 rounded w-1/4" />
      {[1,2,3].map(i => <div key={i} className="h-16 bg-gray-700 rounded" />)}
    </div>
  );

  return (
    <div className="space-y-4 sm:space-y-6 max-w-7xl mx-auto">

      {/* Add button */}
      <div className="flex justify-end">
        <button onClick={() => setShowAddForm(true)}
          className="shrink-0 inline-flex items-center gap-2 px-4 py-2.5 bg-blue-600 hover:bg-blue-600 text-white rounded-lg transition-colors text-sm font-medium">
          <FaPlus size={12} /> Add Category
        </button>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 gap-3 sm:gap-6">
        <div className="bg-gray-800 rounded-xl p-4 sm:p-6 border border-gray-700">
          <p className="text-gray-400 text-xs sm:text-sm">Total Categories</p>
          <p className="text-2xl font-bold text-white mt-1">{categories.length}</p>
        </div>
        <div className="bg-gray-800 rounded-xl p-4 sm:p-6 border border-gray-700">
          <p className="text-gray-400 text-xs sm:text-sm">Recently Added</p>
          <p className="text-2xl font-bold text-green-500 mt-1">
            {categories.filter(c => new Date(c.createdAt) > new Date(Date.now() - 7 * 86400000)).length}
          </p>
        </div>
      </div>

      {/* Add Category Form */}
      {showAddForm && (
        <div className="bg-gray-800 rounded-xl p-4 sm:p-6 border border-gray-700 space-y-3">
          <h3 className="text-base font-semibold text-white">Add New Category</h3>
          <div className="flex flex-col sm:flex-row gap-3">
            <input type="text" placeholder="Category name" value={newCategory.name}
              onChange={(e) => setNewCategory({ name: e.target.value })}
              className="flex-1 px-4 py-2 bg-gray-700 border border-gray-600 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-green-500 text-sm" />
            <div className="flex gap-2">
              <button onClick={handleAdd} disabled={!newCategory.name.trim() || isCreating}
                className="flex-1 sm:flex-none px-4 py-2 bg-green-600 hover:bg-green-700 disabled:bg-gray-500 text-white rounded-lg text-sm flex items-center justify-center gap-2">
                <FaSave size={12} /> {isCreating ? "Adding..." : "Add"}
              </button>
              <button onClick={() => { setShowAddForm(false); setNewCategory({ name: "" }); }}
                className="flex-1 sm:flex-none px-4 py-2 bg-gray-600 hover:bg-gray-700 text-white rounded-lg text-sm flex items-center justify-center gap-2">
                <FaTimes size={12} /> Cancel
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Search */}
      <div className="bg-gray-800 rounded-xl p-4 sm:p-6 border border-gray-700">
        <div className="relative">
          <FaSearch className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={12} />
          <input type="text" placeholder="Search categories..." value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-9 pr-4 py-2 bg-gray-700 border border-gray-600 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-green-500 text-sm" />
        </div>
      </div>

      {/* Table — desktop */}
      <div className="hidden md:block bg-gray-800 rounded-xl border border-gray-700 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-gray-900">
              <tr>
                {["Category Name", "Created At", "Updated At", "Actions"].map(h => (
                  <th key={h} className="px-6 py-4 text-left text-sm font-medium text-gray-300">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-700">
              {filteredCategories.map((category) => (
                <tr key={category.id} className="hover:bg-gray-700 transition-colors">
                  <td className="px-6 py-4">
                    {editingId === category.id ? (
                      <input type="text" value={editForm.name}
                        onChange={(e) => setEditForm({ name: e.target.value })}
                        className="px-3 py-1 bg-gray-700 border border-gray-600 rounded text-white focus:outline-none focus:ring-2 focus:ring-blue-500 w-full" />
                    ) : (
                      <div className="flex items-center gap-2">
                        <div className={`w-7 h-7 rounded-lg ${getCategoryIcon(category.name).bg} flex items-center justify-center shrink-0`}>
                          <span className={getCategoryIcon(category.name).color}>
                            {getCategoryIcon(category.name).icon}
                          </span>
                        </div>
                        <span className="font-medium text-white">{category.name}</span>
                      </div>
                    )}
                  </td>
                  <td className="px-6 py-4 text-gray-300">{formatDate(category.createdAt)}</td>
                  <td className="px-6 py-4 text-gray-300">{formatDate(category.updatedAt)}</td>
                  <td className="px-6 py-4">
                    <div className="flex items-center gap-2">
                      {editingId === category.id ? (
                        <>
                          <button onClick={handleSave} disabled={!editForm.name.trim() || isUpdating}
                            className="p-2 text-green-500 hover:bg-green-500 hover:text-white rounded-lg transition-colors disabled:text-gray-500"><FaSave /></button>
                          <button onClick={handleCancel}
                            className="p-2 text-gray-500 hover:bg-gray-500 hover:text-white rounded-lg transition-colors"><FaTimes /></button>
                        </>
                      ) : (
                        <>
                          <button onClick={() => handleEdit(category)}
                            className="p-2 text-yellow-500 hover:bg-yellow-500 hover:text-white rounded-lg transition-colors"><FaEdit /></button>
                          <button onClick={() => handleDeleteClick(category)}
                            className="p-2 text-red-500 hover:bg-red-500 hover:text-white rounded-lg transition-colors"><FaTrash /></button>
                        </>
                      )}
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        {filteredCategories.length === 0 && (
          <div className="text-center py-12">
            <FaBoxOpen className="mx-auto text-4xl text-gray-500 mb-4" />
            <p className="text-gray-400">{searchTerm ? "No categories match your search." : "No categories yet. Add one to get started."}</p>
          </div>
        )}
      </div>

      {/* Cards — mobile */}
      <div className="md:hidden space-y-3">
        {filteredCategories.length === 0 ? (
          <div className="text-center py-12 bg-gray-800 rounded-xl border border-gray-700">
            <FaBoxOpen className="mx-auto text-4xl text-gray-500 mb-4" />
            <p className="text-gray-400">{searchTerm ? "No categories match your search." : "No categories yet."}</p>
          </div>
        ) : filteredCategories.map((category) => {
          const { icon, color, bg } = getCategoryIcon(category.name);
          return (
            <div key={category.id} className="bg-gray-800 rounded-xl border border-gray-700 p-4 space-y-3">
              {editingId === category.id ? (
                <div className="space-y-3">
                  <input type="text" value={editForm.name}
                    onChange={(e) => setEditForm({ name: e.target.value })}
                    className="w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm" />
                  <div className="flex gap-2">
                    <button onClick={handleSave} disabled={!editForm.name.trim() || isUpdating}
                      className="flex-1 flex items-center justify-center gap-1.5 py-2 bg-green-600 hover:bg-green-700 disabled:bg-gray-500 text-white rounded-lg text-sm font-medium">
                      <FaSave size={11} /> {isUpdating ? "Saving..." : "Save"}
                    </button>
                    <button onClick={handleCancel}
                      className="flex-1 flex items-center justify-center gap-1.5 py-2 bg-gray-600 hover:bg-gray-700 text-white rounded-lg text-sm font-medium">
                      <FaTimes size={11} /> Cancel
                    </button>
                  </div>
                </div>
              ) : (
                <>
                  <div className="flex items-center justify-between gap-2">
                    <div className="flex items-center gap-2.5">
                      {/* ✅ Dynamic icon based on category name */}
                      <div className={`w-9 h-9 rounded-lg ${bg} flex items-center justify-center shrink-0`}>
                        <span className={color}>{icon}</span>
                      </div>
                      <p className="text-white font-medium">{category.name}</p>
                    </div>
                    <div className="flex gap-1.5 shrink-0">
                      <button onClick={() => handleEdit(category)}
                        className="p-2 text-yellow-500 hover:bg-yellow-500/10 rounded-lg transition-colors">
                        <FaEdit size={13} />
                      </button>
                      <button onClick={() => handleDeleteClick(category)}
                        className="p-2 text-red-500 hover:bg-red-500/10 rounded-lg transition-colors">
                        <FaTrash size={13} />
                      </button>
                    </div>
                  </div>
                  <div className="grid grid-cols-2 gap-2 text-xs text-gray-500 pt-1 border-t border-white/5">
                    <div>
                      <span className="text-gray-600">Created</span>
                      <p className="text-gray-400 mt-0.5">{new Date(category.createdAt).toLocaleDateString()}</p>
                    </div>
                    <div>
                      <span className="text-gray-600">Updated</span>
                      <p className="text-gray-400 mt-0.5">{new Date(category.updatedAt).toLocaleDateString()}</p>
                    </div>
                  </div>
                </>
              )}
            </div>
          );
        })}
      </div>

      {/* Delete Modal */}
      {showDeleteModal && (
        <div className="fixed inset-0 bg-black/60 flex items-end sm:items-center justify-center z-50 p-0 sm:p-4">
          <div className="bg-gray-800 rounded-t-2xl sm:rounded-2xl w-full sm:max-w-sm border border-gray-700 p-5 sm:p-6">
            <div className="text-center">
              <div className="w-14 h-14 rounded-full bg-red-500/10 flex items-center justify-center mx-auto mb-4">
                <FaTrash className="text-red-400 text-xl" />
              </div>
              <h3 className="text-lg font-bold text-white mb-2">Delete Category</h3>
              <p className="text-gray-400 text-sm mb-4">
                Are you sure you want to delete{" "}
                <span className="font-medium text-white">"{categoryToDelete?.name}"</span>?
                This action cannot be undone.
              </p>
              <div className="flex gap-3">
                <button onClick={handleCancelDelete} disabled={isDeleting}
                  className="flex-1 bg-gray-600 hover:bg-gray-700 disabled:opacity-50 text-white py-2.5 rounded-lg text-sm font-medium">Cancel</button>
                <button onClick={handleConfirmDelete} disabled={isDeleting}
                  className="flex-1 bg-red-600 hover:bg-red-700 disabled:opacity-50 text-white py-2.5 rounded-lg text-sm font-medium flex items-center justify-center gap-2">
                  {isDeleting ? (
                    <><svg className="animate-spin h-4 w-4" viewBox="0 0 24 24" fill="none">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                    </svg> Deleting...</>
                  ) : "Delete"}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default CategoriesManagement;