import { useState, useRef, useEffect } from "react";
import { FaBolt, FaPlus, FaCalendarAlt, FaTimes, FaCheck, FaClock, FaFire, FaChartBar } from "react-icons/fa";
import { useGetBoostEventsQuery, useCreateBoostEventMutation, useDeactivateBoostEventMutation } from "../../redux/api/api";
import { toast } from "react-toastify";
import { CustomDatePicker } from "../../components/ui/CustomDatePicker";

// ── Custom Time Picker ────────────────────────────────────────────────────────
const TIME_SLOTS: string[] = [];
for (let h = 0; h < 24; h++) {
  for (let m = 0; m < 60; m += 15) {
    TIME_SLOTS.push(`${String(h).padStart(2, "0")}:${String(m).padStart(2, "0")}`);
  }
}

const CustomTimePicker = ({
  value, onChange, placeholder = "Select time", openUp = false,
}: {
  value: string; onChange: (val: string) => void; placeholder?: string; openUp?: boolean;
}) => {
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);
  const listRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const fn = (e: MouseEvent) => { if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false); };
    document.addEventListener("mousedown", fn);
    return () => document.removeEventListener("mousedown", fn);
  }, []);

  useEffect(() => {
    if (open && value && listRef.current) {
      const btn = listRef.current.querySelector(`[data-t="${value}"]`) as HTMLElement;
      if (btn) btn.scrollIntoView({ block: "center" });
    }
  }, [open, value]);

  const display = value
    ? (() => { const [h, m] = value.split(":").map(Number); const p = h >= 12 ? "PM" : "AM"; return `${h % 12 || 12}:${String(m).padStart(2, "0")} ${p}`; })()
    : placeholder;

  return (
    <div ref={ref} className="relative">
      <div onClick={() => setOpen(o => !o)}
        className={`w-full flex items-center gap-2 bg-gray-800/60 border rounded-lg cursor-pointer select-none transition-all duration-200 px-4 py-2.5 text-sm ${open ? "ring-2 ring-blue-500/60 border-blue-500/40" : "border-gray-700 hover:border-gray-600"
          } ${value ? "text-white" : "text-gray-500"}`}>
        <FaClock size={11} className={value ? "text-blue-400 shrink-0" : "text-gray-600 shrink-0"} />
        <span className="text-sm flex-1 truncate whitespace-nowrap">{display}</span>
        {value && <span role="button" onClick={e => { e.stopPropagation(); onChange(""); }} className="text-gray-500 hover:text-gray-300 cursor-pointer shrink-0"><FaTimes size={9} /></span>}
      </div>
      {open && (
        <div className={`absolute ${openUp ? "bottom-full mb-2" : "top-full mt-2"} left-0 right-0 bg-gray-900 border border-white/10 rounded-2xl shadow-2xl shadow-black/60 z-[999] overflow-hidden`}>
          <div ref={listRef} className="max-h-44 overflow-y-auto" style={{ scrollbarWidth: "thin", scrollbarColor: "rgba(255,255,255,0.15) transparent" }}>
            {TIME_SLOTS.map(t => {
              const [h, m] = t.split(":").map(Number);
              const p = h >= 12 ? "PM" : "AM";
              const label = `${h % 12 || 12}:${String(m).padStart(2, "0")} ${p}`;
              return (
                <button key={t} data-t={t} type="button" onClick={() => { onChange(t); setOpen(false); }}
                  className={`w-full text-left px-4 py-2 text-xs font-medium transition-colors ${t === value ? "bg-blue-600 text-white" : "text-gray-400 hover:bg-white/5 hover:text-white"
                    }`}>
                  {label}
                </button>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
};

// ── Modal wrapper ─────────────────────────────────────────────────────────────
const Modal = ({ onClose, children }: { onClose: () => void; children: React.ReactNode }) => (
  <div className="fixed inset-0 bg-black/75 backdrop-blur-sm flex items-center justify-center z-50 p-4">
    <div className="bg-gray-900 border border-white/10 rounded-2xl w-full max-w-lg shadow-2xl max-h-[90vh] flex flex-col"
      style={{ borderTop: "2px solid #3b82f6" }}>
      {children}
    </div>
  </div>
);

const ModalHeader = ({ title, subtitle, onClose }: { title: string; subtitle?: string; onClose: () => void }) => (
  <div className="flex items-center justify-between px-5 py-4 border-b border-white/5 shrink-0">
    <div>
      <h3 className="text-sm font-bold text-white">{title}</h3>
      {subtitle && <p className="text-gray-500 text-[11px] mt-0.5">{subtitle}</p>}
    </div>
    <button onClick={onClose} className="w-7 h-7 rounded-lg bg-white/5 hover:bg-white/10 flex items-center justify-center text-gray-400 hover:text-white transition-colors">
      <FaTimes size={12} />
    </button>
  </div>
);

// ── Field label ───────────────────────────────────────────────────────────────
const FieldLabel = ({ children, required }: { children: React.ReactNode; required?: boolean }) => (
  <label className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">
    {children}
    {required && <span className="text-red-400 ml-1">*</span>}
  </label>
);

// ── Stat Card ─────────────────────────────────────────────────────────────────
const StatCard = ({ label, value, color, bg, icon }: any) => (
  <div className={`rounded-2xl border p-4 bg-gray-900 flex items-center gap-3 ${bg}`}>
    <div className={`w-10 h-10 rounded-xl flex items-center justify-center shrink-0 ${bg}`}>{icon}</div>
    <div>
      <p className={`text-2xl font-bold ${color}`}>{value ?? 0}</p>
      <p className="text-gray-500 text-xs font-medium">{label}</p>
    </div>
  </div>
);

export default function BoostEventsManagement() {
  const { data: eventsData, isLoading } = useGetBoostEventsQuery(undefined);
  const [createBoostEvent, { isLoading: isSending }] = useCreateBoostEventMutation();
  const [deactivateBoostEvent] = useDeactivateBoostEventMutation();

  const [showModal, setShowModal] = useState(false);
  const [formData, setFormData] = useState({
    name: "",
    multiplier: "2.0",
    startDate: "",
    startTime: "09:00",
    endDate: "",
    endTime: "23:59",
  });

  const events = eventsData?.data ?? [];
  const now = new Date();

  // Calculate stats
  const activeEvents = events.filter((e: any) => {
    const start = new Date(e.startDate);
    const end = new Date(e.endDate);
    return e.isActive && now >= start && now <= end;
  });
  const scheduledEvents = events.filter((e: any) => {
    const start = new Date(e.startDate);
    return e.isActive && now < start;
  });
  const totalEvents = events.length;
  const highestMultiplier = events.length > 0 ? Math.max(...events.map((e: any) => e.multiplier)) : 0;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!formData.name || !formData.startDate || !formData.endDate) {
      toast.error("Please fill in all required fields");
      return;
    }

    const multiplier = parseFloat(formData.multiplier);
    if (isNaN(multiplier) || multiplier < 1.1 || multiplier > 10) {
      toast.error("Multiplier must be between 1.1 and 10");
      return;
    }

    // Combine date and time
    const startDateTime = `${formData.startDate}T${formData.startTime || "09:00"}:00`;
    const endDateTime = `${formData.endDate}T${formData.endTime || "23:59"}:00`;

    if (new Date(endDateTime) <= new Date(startDateTime)) {
      toast.error("End date/time must be after start date/time");
      return;
    }

    try {
      await createBoostEvent({
        name: formData.name,
        multiplier,
        startDate: startDateTime,
        endDate: endDateTime,
      }).unwrap();

      toast.success("🎉 Boost event created successfully!");
      setShowModal(false);
      setFormData({ name: "", multiplier: "2.0", startDate: "", startTime: "09:00", endDate: "", endTime: "23:59" });
    } catch (error: any) {
      toast.error(error?.data?.message || "Failed to create boost event");
    }
  };

  const handleDeactivate = async (id: string, name: string) => {
    if (!window.confirm(`Deactivate boost event "${name}"? This will stop the XP multiplier immediately.`)) return;

    try {
      await deactivateBoostEvent(id).unwrap();
      toast.success("Boost event deactivated");
    } catch (error: any) {
      toast.error(error?.data?.message || "Failed to deactivate boost event");
    }
  };

  const getStatusBadge = (event: any) => {
    const start = new Date(event.startDate);
    const end = new Date(event.endDate);

    if (!event.isActive) {
      return <span className="px-2 py-0.5 text-[10px] font-bold rounded-full bg-gray-700 text-gray-400 border border-gray-600/20">INACTIVE</span>;
    }
    if (now < start) {
      return <span className="px-2 py-0.5 text-[10px] font-bold rounded-full bg-blue-500/10 text-blue-400 border border-blue-500/20">SCHEDULED</span>;
    }
    if (now >= start && now <= end) {
      return <span className="px-2 py-0.5 text-[10px] font-bold rounded-full bg-green-500/10 text-green-400 border border-green-500/20 animate-pulse">ACTIVE</span>;
    }
    return <span className="px-2 py-0.5 text-[10px] font-bold rounded-full bg-gray-700 text-gray-400 border border-gray-600/20">ENDED</span>;
  };

  if (isLoading) {
    return (
      <div className="space-y-5 animate-pulse">
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
          {[1, 2, 3, 4].map(i => <div key={i} className="h-20 bg-gray-900 border border-white/5 rounded-2xl" />)}
        </div>
        <div className="h-96 bg-gray-900 border border-white/5 rounded-2xl" />
      </div>
    );
  }

  return (
    <div className="space-y-3 sm:space-y-5 pb-10">
      {/* Header with Create Button */}
      <div className="flex items-center justify-between gap-3">
        <div className="min-w-0 flex-1">
          <h1 className="text-white text-xl font-bold tracking-tight">
            XP Boost Events
          </h1>
          <p className="text-gray-500 text-xs mt-0.5">
            Create time-limited XP multiplier events to boost engagement
          </p>
        </div>
        <button
          onClick={() => setShowModal(true)}
          className="flex items-center gap-2 px-3 sm:px-4 py-2 bg-blue-500 hover:bg-blue-600 text-white font-semibold rounded-xl transition-all text-xs sm:text-sm shrink-0"
        >
          <FaPlus size={10} />
          <span className="hidden sm:inline">Create Boost Event</span>
          <span className="sm:hidden">New</span>
        </button>
      </div>

      {/* Stats Row */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 sm:gap-3">
        <StatCard
          label="Active Events"
          value={activeEvents.length}
          color="text-green-400"
          bg="bg-green-500/10 border-green-500/20"
          icon={<FaFire size={14} className="text-green-400" />}
        />
        <StatCard
          label="Scheduled"
          value={scheduledEvents.length}
          color="text-blue-400"
          bg="bg-blue-500/10 border-blue-500/20"
          icon={<FaClock size={14} className="text-blue-400" />}
        />
        <StatCard
          label="Total Events"
          value={totalEvents}
          color="text-blue-400"
          bg="bg-blue-500/10 border-blue-500/20"
          icon={<FaChartBar size={14} className="text-blue-400" />}
        />
        <StatCard
          label="Max Multiplier"
          value={`${highestMultiplier}×`}
          color="text-purple-400"
          bg="bg-purple-500/10 border-purple-500/20"
          icon={<FaBolt size={14} className="text-purple-400" />}
        />
      </div>

      {/* Active Events Alert */}
      {activeEvents.length > 0 && (
        <div className="bg-gradient-to-r from-blue-500/10 via-cyan-500/10 to-blue-500/10 border border-blue-500/20 rounded-2xl p-4">
          <div className="flex items-center gap-3">
            <FaBolt className="text-blue-400 text-2xl animate-pulse" />
            <div className="flex-1">
              <p className="text-white font-bold text-sm">
                {activeEvents.length} XP Boost Event{activeEvents.length > 1 ? 's' : ''} Currently Active!
              </p>
              <p className="text-gray-400 text-xs mt-0.5">Users are earning multiplied XP right now</p>
            </div>
          </div>
        </div>
      )}

      {/* Events Table */}
      <div className="bg-gray-900 border border-white/5 rounded-xl sm:rounded-2xl overflow-hidden shadow-xl">
        <div className="px-4 py-3 sm:px-5 sm:py-4 border-b border-white/5 bg-white/[0.02] flex items-center justify-between">
          <div className="flex items-center gap-2">
            <h2 className="text-[10px] font-black text-white uppercase tracking-widest">All Boost Events</h2>
          </div>
          <span className="text-[10px] text-gray-500 font-bold">{events.length} Total</span>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="bg-gray-800/30 border-b border-white/5">
                <th className="px-4 sm:px-6 py-3 sm:py-4 text-left text-[10px] font-bold text-gray-400 uppercase tracking-wider">Event Name</th>
                <th className="px-4 sm:px-6 py-3 sm:py-4 text-left text-[10px] font-bold text-gray-400 uppercase tracking-wider">Multiplier</th>
                <th className="px-4 sm:px-6 py-3 sm:py-4 text-left text-[10px] font-bold text-gray-400 uppercase tracking-wider hidden sm:table-cell">Start Date</th>
                <th className="px-4 sm:px-6 py-3 sm:py-4 text-left text-[10px] font-bold text-gray-400 uppercase tracking-wider hidden sm:table-cell">End Date</th>
                <th className="px-4 sm:px-6 py-3 sm:py-4 text-left text-[10px] font-bold text-gray-400 uppercase tracking-wider">Status</th>
                <th className="px-4 sm:px-6 py-3 sm:py-4 text-left text-[10px] font-bold text-gray-400 uppercase tracking-wider">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-white/5">
              {events.length === 0 ? (
                <tr>
                  <td colSpan={6} className="px-6 py-12 text-center">
                    <FaBolt className="text-gray-700 text-4xl mx-auto mb-3" />
                    <p className="text-gray-500 font-medium text-sm">No boost events created yet</p>
                    <p className="text-gray-600 text-xs mt-1">Create your first XP boost event to engage users</p>
                  </td>
                </tr>
              ) : (
                events.map((event: any) => (
                  <tr key={event.id} className="hover:bg-white/[0.02] transition-colors">
                    <td className="px-4 sm:px-6 py-3 sm:py-4">
                      <p className="text-white font-medium text-xs sm:text-sm">{event.name}</p>
                      <p className="text-gray-500 text-[10px] mt-0.5">by {event.createdBy}</p>
                    </td>
                    <td className="px-4 sm:px-6 py-3 sm:py-4">
                      <span className="text-blue-400 font-black text-base sm:text-lg">{event.multiplier}×</span>
                    </td>
                    <td className="px-4 sm:px-6 py-3 sm:py-4 hidden sm:table-cell">
                      <div className="flex items-center gap-2 text-gray-400 text-xs">
                        <FaCalendarAlt size={9} />
                        {new Date(event.startDate).toLocaleDateString()}
                      </div>
                      <p className="text-gray-600 text-[10px] mt-0.5">
                        {new Date(event.startDate).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                      </p>
                    </td>
                    <td className="px-4 sm:px-6 py-3 sm:py-4 hidden sm:table-cell">
                      <div className="flex items-center gap-2 text-gray-400 text-xs">
                        <FaCalendarAlt size={9} />
                        {new Date(event.endDate).toLocaleDateString()}
                      </div>
                      <p className="text-gray-600 text-[10px] mt-0.5">
                        {new Date(event.endDate).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                      </p>
                    </td>
                    <td className="px-4 sm:px-6 py-3 sm:py-4">
                      {getStatusBadge(event)}
                    </td>
                    <td className="px-4 sm:px-6 py-3 sm:py-4">
                      {event.isActive ? (
                        <button
                          onClick={() => handleDeactivate(event.id, event.name)}
                          className="px-2.5 sm:px-3 py-1.5 bg-red-500/10 hover:bg-red-500/20 border border-red-500/20 text-red-400 text-[10px] font-semibold rounded-lg transition-colors flex items-center gap-1.5"
                        >
                          <FaTimes size={9} />
                          <span className="hidden sm:inline">Deactivate</span>
                        </button>
                      ) : (
                        <span className="text-gray-600 text-[10px]">No actions</span>
                      )}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Create Modal */}
      {showModal && (
        <Modal onClose={() => setShowModal(false)}>
          <ModalHeader
            title="Create XP Boost Event"
            subtitle="Set up a time-limited XP multiplier event"
            onClose={() => setShowModal(false)}
          />

          <form onSubmit={handleSubmit} className="p-5 overflow-y-auto space-y-4" style={{ scrollbarWidth: "thin", scrollbarColor: "rgba(255,255,255,0.2) rgba(255,255,255,0.05)" }}>
            {/* Event Name */}
            <div className="space-y-1.5">
              <FieldLabel required>Event Name</FieldLabel>
              <input
                type="text"
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                placeholder="e.g., Weekend XP Blitz"
                className="w-full px-4 py-2.5 bg-gray-800 border border-white/10 rounded-xl text-white text-sm placeholder-gray-600 focus:outline-none focus:ring-2 focus:ring-blue-500/30"
                required
              />
            </div>

            {/* XP Multiplier */}
            <div className="space-y-1.5">
              <FieldLabel required>XP Multiplier (1.1 - 10.0)</FieldLabel>
              <input
                type="number"
                step="0.1"
                min="1.1"
                max="10"
                value={formData.multiplier}
                onChange={(e) => setFormData({ ...formData, multiplier: e.target.value })}
                className="w-full px-4 py-2.5 bg-gray-800 border border-white/10 rounded-xl text-white text-sm placeholder-gray-600 focus:outline-none focus:ring-2 focus:ring-blue-500/30"
                required
              />
              <p className="text-gray-600 text-[10px] mt-1.5 flex items-center gap-1.5">
                <FaBolt size={8} className="text-blue-500" />
                2.0 = double XP, 3.0 = triple XP, etc.
              </p>
            </div>

            {/* Start Date & Time */}
            <div className="space-y-1.5">
              <FieldLabel required>Start Date & Time</FieldLabel>
              <div className="grid grid-cols-2 gap-3">
                <CustomDatePicker
                  value={formData.startDate}
                  onChange={(val) => setFormData({ ...formData, startDate: val })}
                  placeholder="Select start date"
                  min={new Date().toISOString().split('T')[0]}
                  size="md"
                />
                <CustomTimePicker
                  value={formData.startTime}
                  onChange={(val) => setFormData({ ...formData, startTime: val })}
                  placeholder="Start time"
                />
              </div>
            </div>

            {/* End Date & Time */}
            <div className="space-y-1.5">
              <FieldLabel required>End Date & Time</FieldLabel>
              <div className="grid grid-cols-2 gap-3">
                <CustomDatePicker
                  value={formData.endDate}
                  onChange={(val) => setFormData({ ...formData, endDate: val })}
                  placeholder="Select end date"
                  min={formData.startDate || new Date().toISOString().split('T')[0]}
                  size="md"
                />
                <CustomTimePicker
                  value={formData.endTime}
                  onChange={(val) => setFormData({ ...formData, endTime: val })}
                  placeholder="End time"
                />
              </div>
            </div>

            {/* Info Box */}
            <div className="bg-blue-500/5 border border-blue-500/20 rounded-xl p-4">
              <div className="flex items-start gap-3">

                <div>
                  <p className="text-blue-400 text-xs font-bold mb-1">How it works</p>
                  <p className="text-gray-400 text-[11px] leading-relaxed text-justify">
                    During this event, all XP awards (found items, approved claims, helpful comments) will be multiplied by <span className="text-blue-400 font-bold">{formData.multiplier || "2.0"}×</span>. Login streak bonuses are excluded from multiplier.
                  </p>
                </div>
              </div>
            </div>

            {/* Actions */}
            <div className="flex gap-3 pt-2">
              <button
                type="button"
                onClick={() => setShowModal(false)}
                className="flex-1 px-4 py-2.5 bg-gray-800 hover:bg-gray-700 text-white font-medium rounded-xl transition-colors text-sm"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={isSending}
                className="flex-1 px-4 py-2.5 bg-blue-500 hover:bg-blue-600 text-white font-bold rounded-xl transition-all flex items-center justify-center gap-2 text-sm disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {isSending ? (
                  <>
                    <div className="animate-spin rounded-full h-3 w-3 border-2 border-white border-t-transparent" />
                    Creating...
                  </>
                ) : (
                  <>
                    <FaCheck size={11} />
                    Create Event
                  </>
                )}
              </button>
            </div>
          </form>
        </Modal>
      )}
    </div>
  );
}
