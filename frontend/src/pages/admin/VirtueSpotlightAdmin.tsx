import React, { useState, useRef } from "react";
import {
  FaPlus, FaStar, FaTimes, FaTrash, FaToggleOn, FaToggleOff,
  FaImage, FaSpinner, FaEdit, FaUserCheck,
} from "react-icons/fa";
import { toast } from "react-toastify";
import {
  useGetAllVirtueSpotlightsQuery,
  useCreateVirtueSpotlightMutation,
  useUpdateVirtueSpotlightMutation,
  useDeleteVirtueSpotlightMutation,
} from "../../redux/api/api";

// ── Student name tag input ────────────────────────────────────────────────────
const StudentTagInput = ({
  students,
  setStudents,
}: {
  students: string[];
  setStudents: (s: string[]) => void;
}) => {
  const [input, setInput] = useState("");

  const add = () => {
    const trimmed = input.trim();
    if (!trimmed || students.includes(trimmed)) return;
    setStudents([...students, trimmed]);
    setInput("");
  };

  const remove = (name: string) =>
    setStudents(students.filter((s) => s !== name));

  return (
    <div>
      <label className="text-xs font-bold text-gray-400 uppercase tracking-wider mb-2 block">
        Recognized Students
      </label>

      {students.length > 0 && (
        <div className="flex flex-wrap gap-2 mb-3">
          {students.map((name) => (
            <span
              key={name}
              className="inline-flex items-center gap-1 px-2.5 py-1 bg-blue-500/10 border border-blue-500/20 text-blue-300 text-xs rounded-lg"
            >
              {name}
              <button
                type="button"
                onClick={() => remove(name)}
                className="text-blue-400/60 hover:text-red-400 transition-colors flex items-center"
              >
                <FaTimes size={9} />
              </button>
            </span>
          ))}
        </div>
      )}

      <div className="flex gap-2">
        <input
          type="text"
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === "Enter") {
              e.preventDefault();
              add();
            }
          }}
          placeholder="Type name and press Enter or Add..."
          className="flex-1 bg-gray-800 border border-white/10 text-white text-sm px-3 py-2 rounded-lg focus:outline-none focus:border-blue-500/50 placeholder-gray-600"
        />
        <button
          type="button"
          onClick={add}
          className="px-4 py-2 bg-cyan-500/10 hover:bg-cyan-500/20 border border-cyan-500/20 text-cyan-400 text-xs font-medium rounded-lg transition-all"
        >
          Add
        </button>
      </div>
      <p className="text-[10px] text-gray-600 mt-1.5">
        Press Enter or click Add after each name
      </p>
    </div>
  );
};

// ── Create / Edit Modal ───────────────────────────────────────────────────────
const SpotlightModal = ({
  onClose,
  existing,
}: {
  onClose: () => void;
  existing?: any;
}) => {
  const [title, setTitle] = useState(existing?.title || "");
  const [description, setDescription] = useState(existing?.description || "");
  const [students, setStudents] = useState<string[]>(existing?.students || []);
  const [preview, setPreview] = useState<string | null>(
    existing?.imageUrl || null
  );
  const [file, setFile] = useState<File | null>(null);
  const fileRef = useRef<HTMLInputElement>(null);

  const [createSpotlight, { isLoading: creating }] =
    useCreateVirtueSpotlightMutation();
  const [updateSpotlight, { isLoading: updating }] =
    useUpdateVirtueSpotlightMutation();
  const isLoading = creating || updating;

  const handleImage = (e: React.ChangeEvent<HTMLInputElement>) => {
    const f = e.target.files?.[0];
    if (!f) return;
    setFile(f);
    setPreview(URL.createObjectURL(f));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim()) return toast.error("Title is required");

    const fd = new FormData();
    fd.append("title", title.trim());
    if (description.trim()) fd.append("description", description.trim());
    fd.append("students", JSON.stringify(students));
    if (file) fd.append("image", file);

    try {
      if (existing) {
        await updateSpotlight({ id: existing.id, formData: fd }).unwrap();
        toast.success("Spotlight updated!");
      } else {
        await createSpotlight(fd).unwrap();
        toast.success("Spotlight posted!");
      }
      onClose();
    } catch {
      toast.error("Something went wrong. Please try again.");
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
      <div className="bg-gray-900 border border-white/10 rounded-2xl w-full max-w-xl shadow-2xl shadow-black/40 overflow-hidden">

        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-white/[0.06]">
          <div className="flex items-center gap-2">
            <h3 className="text-white font-semibold text-sm">
              {existing ? "Edit Spotlight" : "New VIRTUE Spotlight"}
            </h3>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="text-gray-500 hover:text-white transition-colors"
          >
            <FaTimes size={14} />
          </button>
        </div>

        <form
          onSubmit={handleSubmit}
          className="p-6 space-y-5 max-h-[80vh] overflow-y-auto"
        >
          {/* Image upload */}
          <div>
            <label className="text-xs font-bold text-gray-400 uppercase tracking-wider mb-2 block">
              Photo
            </label>
            <div
              onClick={() => fileRef.current?.click()}
              className="relative w-full h-44 bg-gray-800 border-2 border-dashed border-white/10 hover:border-cyan-500/40 rounded-xl overflow-hidden cursor-pointer transition-all group"
            >
              {preview ? (
                <>
                  <img
                    src={preview}
                    alt="Preview"
                    className="w-full h-full object-cover object-top"
                  />
                  <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-all flex items-center justify-center">
                    <p className="text-white text-xs font-semibold">
                      Click to change
                    </p>
                  </div>
                </>
              ) : (
                <div className="flex flex-col items-center justify-center h-full gap-2">
                  <FaImage size={24} className="text-gray-600" />
                  <p className="text-gray-500 text-xs">Click to upload photo</p>
                </div>
              )}
            </div>
            <input
              ref={fileRef}
              type="file"
              accept="image/*"
              className="hidden"
              onChange={handleImage}
            />
          </div>

          {/* Title */}
          <div>
            <label className="text-xs font-bold text-gray-400 uppercase tracking-wider mb-2 block">
              Title <span className="text-red-400">*</span>
            </label>
            <input
              type="text"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="e.g. VIRTUE Role Model Spotlight — May 2026"
              className="w-full bg-gray-800 border border-white/10 text-white text-sm px-3 py-2.5 rounded-lg focus:outline-none focus:border-cyan-500/50 placeholder-gray-600"
            />
          </div>

          {/* Description */}
          <div>
            <label className="text-xs font-bold text-gray-400 uppercase tracking-wider mb-2 block">
              Description{" "}
              <span className="text-gray-600 font-normal normal-case tracking-normal">
                (optional)
              </span>
            </label>
            <textarea
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              rows={3}
              placeholder="e.g. The SASDD VIRTUE program aims to celebrate and honor students who demonstrate exceptional moral character..."
              className="w-full bg-gray-800 border border-white/10 text-white text-sm px-3 py-2.5 rounded-lg focus:outline-none focus:border-cyan-500/50 placeholder-gray-600 resize-none"
            />
          </div>

          {/* Student names */}
          <StudentTagInput students={students} setStudents={setStudents} />

          {/* Actions */}
          <div className="flex gap-3 pt-2">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 py-2.5 bg-white/5 hover:bg-white/10 border border-white/5 text-gray-400 hover:text-white text-sm font-semibold rounded-xl transition-all"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isLoading}
              className="flex-1 py-2.5 bg-cyan-600 hover:bg-cyan-500 disabled:opacity-50 text-white text-sm font-bold rounded-xl transition-all flex items-center justify-center gap-2"
            >
              {isLoading ? (
                <>
                  <FaSpinner className="animate-spin" size={12} /> Saving...
                </>
              ) : existing ? (
                "Save Changes"
              ) : (
                "Post Spotlight"
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

// ── Admin Page ────────────────────────────────────────────────────────────────
const VirtueSpotlightAdmin: React.FC = () => {
  const { data, isLoading } = useGetAllVirtueSpotlightsQuery({});
  const [deleteSpotlight] = useDeleteVirtueSpotlightMutation();
  const [updateSpotlight] = useUpdateVirtueSpotlightMutation();

  const [showModal, setShowModal] = useState(false);
  const [editing, setEditing] = useState<any>(null);

  const spotlights: any[] = data?.data || [];

  const handleDelete = async (id: string) => {
    if (!confirm("Delete this spotlight? This cannot be undone.")) return;
    try {
      await deleteSpotlight(id).unwrap();
      toast.success("Spotlight deleted");
    } catch {
      toast.error("Failed to delete");
    }
  };

  const handleToggle = async (item: any) => {
    const fd = new FormData();
    fd.append("isActive", String(!item.isActive));
    try {
      await updateSpotlight({ id: item.id, formData: fd }).unwrap();
      toast.success(item.isActive ? "Spotlight hidden" : "Spotlight published");
    } catch {
      toast.error("Failed to update");
    }
  };

  // ── Loading skeleton ──────────────────────────────────────────────────────
  if (isLoading)
    return (
      <div className="space-y-4 sm:space-y-6 animate-pulse">
        <div className="h-24 bg-gray-800/60 rounded-2xl" />
        <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 sm:gap-4">
          {[1, 2, 3].map((i) => (
            <div key={i} className="h-20 bg-gray-800/60 rounded-2xl" />
          ))}
        </div>
        {[1, 2, 3].map((i) => (
          <div key={i} className="h-28 bg-gray-800/60 rounded-2xl" />
        ))}
      </div>
    );

  return (
    <div className="space-y-4 sm:space-y-6 max-w-7xl mx-auto">

      {/* ── Header row ── */}
      <div className="flex justify-end">
        <button
          onClick={() => { setEditing(null); setShowModal(true); }}
          className="flex items-center gap-2 px-4 py-2 bg-blue-600 hover:bg-blue-500 text-white text-xs font-bold rounded-xl transition-all shrink-0"
        >
          <FaPlus size={10} /> New Post
        </button>
      </div>

      {/* ── Stats strip ── */}
      <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 sm:gap-4">
        {[
          {
            label: "Total Posts",
            value: spotlights.length,
            color: "text-white",
          },
          {
            label: "Published",
            value: spotlights.filter((s) => s.isActive).length,
            color: "text-emerald-400",
          },
          {
            label: "Hidden",
            value: spotlights.filter((s) => !s.isActive).length,
            color: "text-gray-400",
          },
        ].map((stat) => (
          <div
            key={stat.label}
            className="bg-gray-900 border border-white/[0.06] rounded-2xl p-4"
          >
            <p className={`text-2xl sm:text-3xl font-bold tracking-tight ${stat.color}`}>
              {stat.value}
            </p>
            <p className="text-gray-500 text-xs font-medium mt-0.5">
              {stat.label}
            </p>
          </div>
        ))}
      </div>

      {/* ── Empty state ── */}
      {spotlights.length === 0 ? (
        <div className="py-20 bg-gray-900/30 rounded-2xl border border-dashed border-gray-800 flex flex-col items-center text-center px-4">
          <h3 className="text-white font-semibold mb-1">No spotlights yet</h3>
          <p className="text-gray-500 text-sm mb-5 max-w-sm">
            Create your first VIRTUE Spotlight post to recognize outstanding
            students on the homepage.
          </p>
          <button
            onClick={() => {
              setEditing(null);
              setShowModal(true);
            }}
            className="px-5 py-2 bg-cyan-500/10 hover:bg-cyan-500/20 border border-cyan-500/20 text-cyan-400 text-sm font-medium rounded-xl transition-all"
          >
            Create First Post
          </button>
        </div>
      ) : (
        /* ── Spotlight list ── */
        <div className="space-y-3">
          {spotlights.map((item: any) => (
            <div
              key={item.id}
              className={`bg-gray-900 border rounded-2xl overflow-hidden transition-all ${
                item.isActive
                  ? "border-white/[0.06]"
                  : "border-white/[0.03] opacity-60"
              }`}
            >
              {/* Body */}
              <div className="flex flex-col sm:flex-row items-start gap-4 p-4 sm:p-5">

                {/* Thumbnail */}
                <div className="w-full sm:w-20 h-40 sm:h-20 shrink-0 rounded-xl overflow-hidden bg-gray-800 border border-white/[0.05]">
                  {item.imageUrl ? (
                    <img
                      src={item.imageUrl}
                      alt={item.title}
                      className="w-full h-full object-cover sm:object-top"
                    />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center">
                      <FaStar size={20} className="text-gray-600" />
                    </div>
                  )}
                </div>

                {/* Info */}
                <div className="flex-1 min-w-0">
                  <div className="flex items-start justify-between gap-3 mb-1">
                    <h3 className="text-white font-semibold text-sm leading-tight truncate">
                      {item.title}
                    </h3>
                    <span
                      className={`shrink-0 text-[10px] font-bold px-2 py-0.5 rounded-lg border ${
                        item.isActive
                          ? "text-emerald-400 bg-emerald-500/10 border-emerald-500/20"
                          : "text-gray-500 bg-gray-800 border-gray-700"
                      }`}
                    >
                      {item.isActive ? "Published" : "Hidden"}
                    </span>
                  </div>

                  {item.description && (
                    <p className="text-gray-500 text-xs line-clamp-1 mb-2">
                      {item.description}
                    </p>
                  )}

                  <div className="flex items-center gap-1.5 mb-2">
                    <FaUserCheck size={9} className="text-cyan-400" />
                    <span className="text-gray-500 text-xs">
                      {item.students?.length || 0} student
                      {item.students?.length !== 1 ? "s" : ""} recognized
                    </span>
                  </div>

                  {item.students?.length > 0 && (
                    <div className="flex flex-wrap gap-1.5">
                      {item.students.slice(0, 5).map((name: string) => (
                        <span
                          key={name}
                          className="text-[10px] px-2 py-0.5 bg-blue-500/10 border border-blue-500/15 text-blue-400 rounded-md"
                        >
                          {name}
                        </span>
                      ))}
                      {item.students.length > 5 && (
                        <span className="text-[10px] px-2 py-0.5 bg-gray-800 text-gray-500 rounded-md">
                          +{item.students.length - 5} more
                        </span>
                      )}
                    </div>
                  )}
                </div>
              </div>

              {/* Action footer */}
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 px-4 sm:px-5 py-3 border-t border-white/[0.05] bg-black/10">
                <p className="text-gray-600 text-xs">
                  {new Date(item.createdAt).toLocaleDateString("en-US", {
                    month: "short",
                    day: "numeric",
                    year: "numeric",
                  })}
                </p>

                <div className="flex flex-wrap items-center gap-2">
                  {/* Toggle */}
                  <button
                    onClick={() => handleToggle(item)}
                    title={
                      item.isActive
                        ? "Hide from homepage"
                        : "Publish to homepage"
                    }
                    className={`flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold rounded-lg border transition-all ${
                      item.isActive
                        ? "bg-emerald-500/10 border-emerald-500/20 text-emerald-400 hover:bg-red-500/10 hover:border-red-500/20 hover:text-red-400"
                        : "bg-gray-800 border-gray-700 text-gray-400 hover:bg-emerald-500/10 hover:border-emerald-500/20 hover:text-emerald-400"
                    }`}
                  >
                    {item.isActive ? (
                      <FaToggleOn size={12} />
                    ) : (
                      <FaToggleOff size={12} />
                    )}
                    {item.isActive ? "Published" : "Hidden"}
                  </button>

                  {/* Edit */}
                  <button
                    onClick={() => {
                      setEditing(item);
                      setShowModal(true);
                    }}
                    className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold bg-yellow-500/10 hover:bg-yellow-500/20 border border-yellow-500/20 text-yellow-400 rounded-lg transition-all"
                  >
                    <FaEdit size={10} /> Edit
                  </button>

                  {/* Delete */}
                  <button
                    onClick={() => handleDelete(item.id)}
                    className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold bg-red-500/10 hover:bg-red-500/20 border border-red-500/20 text-red-400 rounded-lg transition-all"
                  >
                    <FaTrash size={10} /> Delete
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Modal */}
      {showModal && (
        <SpotlightModal
          onClose={() => {
            setShowModal(false);
            setEditing(null);
          }}
          existing={editing}
        />
      )}
    </div>
  );
};

export default VirtueSpotlightAdmin;