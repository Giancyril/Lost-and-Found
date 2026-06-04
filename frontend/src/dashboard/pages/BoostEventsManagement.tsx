import { useState } from "react";
import { FaBolt, FaPlus, FaCalendarAlt, FaTimes, FaCheck } from "react-icons/fa";
import { useGetBoostEventsQuery, useCreateBoostEventMutation, useDeactivateBoostEventMutation } from "../../redux/api/api";
import { toast } from "react-toastify";

export default function BoostEventsManagement() {
  const { data: eventsData, isLoading } = useGetBoostEventsQuery();
  const [createBoostEvent] = useCreateBoostEventMutation();
  const [deactivateBoostEvent] = useDeactivateBoostEventMutation();

  const [showModal, setShowModal] = useState(false);
  const [formData, setFormData] = useState({
    name: "",
    multiplier: "2.0",
    startDate: "",
    endDate: "",
  });

  const events = eventsData?.data ?? [];
  const now = new Date();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!formData.name || !formData.startDate || !formData.endDate) {
      toast.error("Please fill in all fields");
      return;
    }

    const multiplier = parseFloat(formData.multiplier);
    if (isNaN(multiplier) || multiplier < 1.1 || multiplier > 10) {
      toast.error("Multiplier must be between 1.1 and 10");
      return;
    }

    try {
      await createBoostEvent({
        name: formData.name,
        multiplier,
        startDate: formData.startDate,
        endDate: formData.endDate,
      }).unwrap();
      
      toast.success("🎉 Boost event created successfully!");
      setShowModal(false);
      setFormData({ name: "", multiplier: "2.0", startDate: "", endDate: "" });
    } catch (error: any) {
      toast.error(error?.data?.message || "Failed to create boost event");
    }
  };

  const handleDeactivate = async (id: string, name: string) => {
    if (!window.confirm(`Deactivate boost event "${name}"?`)) return;
    
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
      return <span className="px-2 py-0.5 text-[10px] font-bold rounded-full bg-gray-700 text-gray-400">INACTIVE</span>;
    }
    if (now < start) {
      return <span className="px-2 py-0.5 text-[10px] font-bold rounded-full bg-blue-500/10 text-blue-400">SCHEDULED</span>;
    }
    if (now >= start && now <= end) {
      return <span className="px-2 py-0.5 text-[10px] font-bold rounded-full bg-green-500/10 text-green-400 animate-pulse">ACTIVE</span>;
    }
    return <span className="px-2 py-0.5 text-[10px] font-bold rounded-full bg-gray-700 text-gray-400">ENDED</span>;
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-96">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-yellow-400" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-white flex items-center gap-3">
            <FaBolt className="text-yellow-400" />
            XP Boost Events
          </h1>
          <p className="text-gray-400 text-sm mt-1">
            Create time-limited XP multiplier events to boost engagement
          </p>
        </div>
        <button
          onClick={() => setShowModal(true)}
          className="flex items-center gap-2 px-4 py-2.5 bg-yellow-500 hover:bg-yellow-600 text-black font-semibold rounded-lg transition-all"
        >
          <FaPlus size={12} />
          Create Boost Event
        </button>
      </div>

      {/* Active Events Alert */}
      {events.filter((e: any) => {
        const start = new Date(e.startDate);
        const end = new Date(e.endDate);
        return e.isActive && now >= start && now <= end;
      }).length > 0 && (
        <div className="bg-gradient-to-r from-yellow-500/10 via-orange-500/10 to-yellow-500/10 border border-yellow-500/20 rounded-xl p-4">
          <div className="flex items-center gap-3">
            <FaBolt className="text-yellow-400 text-2xl animate-pulse" />
            <div>
              <p className="text-white font-bold">XP Boost Currently Active!</p>
              <p className="text-gray-400 text-sm">Users are earning multiplied XP right now</p>
            </div>
          </div>
        </div>
      )}

      {/* Events List */}
      <div className="bg-gray-900 border border-white/10 rounded-xl overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="bg-gray-800/50 border-b border-white/5">
                <th className="px-6 py-4 text-left text-xs font-bold text-gray-400 uppercase tracking-wider">Event Name</th>
                <th className="px-6 py-4 text-left text-xs font-bold text-gray-400 uppercase tracking-wider">Multiplier</th>
                <th className="px-6 py-4 text-left text-xs font-bold text-gray-400 uppercase tracking-wider">Start Date</th>
                <th className="px-6 py-4 text-left text-xs font-bold text-gray-400 uppercase tracking-wider">End Date</th>
                <th className="px-6 py-4 text-left text-xs font-bold text-gray-400 uppercase tracking-wider">Status</th>
                <th className="px-6 py-4 text-left text-xs font-bold text-gray-400 uppercase tracking-wider">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-white/5">
              {events.length === 0 ? (
                <tr>
                  <td colSpan={6} className="px-6 py-12 text-center">
                    <FaBolt className="text-gray-700 text-4xl mx-auto mb-3" />
                    <p className="text-gray-500 font-medium">No boost events created yet</p>
                    <p className="text-gray-600 text-sm mt-1">Create your first XP boost event to engage users</p>
                  </td>
                </tr>
              ) : (
                events.map((event: any) => (
                  <tr key={event.id} className="hover:bg-white/[0.02] transition-colors">
                    <td className="px-6 py-4">
                      <p className="text-white font-medium">{event.name}</p>
                      <p className="text-gray-500 text-xs mt-0.5">by {event.createdBy}</p>
                    </td>
                    <td className="px-6 py-4">
                      <span className="text-yellow-400 font-black text-lg">{event.multiplier}×</span>
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-2 text-gray-400 text-sm">
                        <FaCalendarAlt size={10} />
                        {new Date(event.startDate).toLocaleDateString()}
                      </div>
                      <p className="text-gray-600 text-xs mt-0.5">
                        {new Date(event.startDate).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                      </p>
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-2 text-gray-400 text-sm">
                        <FaCalendarAlt size={10} />
                        {new Date(event.endDate).toLocaleDateString()}
                      </div>
                      <p className="text-gray-600 text-xs mt-0.5">
                        {new Date(event.endDate).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                      </p>
                    </td>
                    <td className="px-6 py-4">
                      {getStatusBadge(event)}
                    </td>
                    <td className="px-6 py-4">
                      {event.isActive ? (
                        <button
                          onClick={() => handleDeactivate(event.id, event.name)}
                          className="px-3 py-1.5 bg-red-500/10 hover:bg-red-500/20 text-red-400 text-xs font-semibold rounded-lg transition-colors flex items-center gap-1.5"
                        >
                          <FaTimes size={10} />
                          Deactivate
                        </button>
                      ) : (
                        <span className="text-gray-600 text-xs">No actions</span>
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
        <>
          <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50" onClick={() => setShowModal(false)} />
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            <div className="bg-gray-900 border border-white/10 rounded-2xl w-full max-w-lg shadow-2xl">
              {/* Modal Header */}
              <div className="flex items-center justify-between px-6 py-4 border-b border-white/5">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-xl bg-yellow-500/10 border border-yellow-500/20 flex items-center justify-center">
                    <FaBolt className="text-yellow-400" size={16} />
                  </div>
                  <div>
                    <h2 className="text-white font-bold text-lg">Create XP Boost Event</h2>
                    <p className="text-gray-500 text-xs">Set up a time-limited XP multiplier</p>
                  </div>
                </div>
                <button
                  onClick={() => setShowModal(false)}
                  className="text-gray-500 hover:text-white transition-colors p-2"
                >
                  <FaTimes size={16} />
                </button>
              </div>

              {/* Modal Body */}
              <form onSubmit={handleSubmit} className="p-6 space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-400 mb-2">Event Name</label>
                  <input
                    type="text"
                    value={formData.name}
                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                    placeholder="e.g., Weekend XP Blitz"
                    className="w-full px-4 py-2.5 bg-gray-800 border border-white/10 rounded-lg text-white placeholder-gray-600 focus:outline-none focus:border-yellow-500/50"
                    required
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-400 mb-2">
                    XP Multiplier (1.1 - 10.0)
                  </label>
                  <input
                    type="number"
                    step="0.1"
                    min="1.1"
                    max="10"
                    value={formData.multiplier}
                    onChange={(e) => setFormData({ ...formData, multiplier: e.target.value })}
                    className="w-full px-4 py-2.5 bg-gray-800 border border-white/10 rounded-lg text-white placeholder-gray-600 focus:outline-none focus:border-yellow-500/50"
                    required
                  />
                  <p className="text-gray-600 text-xs mt-1.5">
                    2.0 = double XP, 3.0 = triple XP, etc.
                  </p>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-400 mb-2">Start Date</label>
                    <input
                      type="datetime-local"
                      value={formData.startDate}
                      onChange={(e) => setFormData({ ...formData, startDate: e.target.value })}
                      className="w-full px-4 py-2.5 bg-gray-800 border border-white/10 rounded-lg text-white focus:outline-none focus:border-yellow-500/50"
                      required
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-400 mb-2">End Date</label>
                    <input
                      type="datetime-local"
                      value={formData.endDate}
                      onChange={(e) => setFormData({ ...formData, endDate: e.target.value })}
                      className="w-full px-4 py-2.5 bg-gray-800 border border-white/10 rounded-lg text-white focus:outline-none focus:border-yellow-500/50"
                      required
                    />
                  </div>
                </div>

                {/* Info Box */}
                <div className="bg-yellow-500/5 border border-yellow-500/20 rounded-xl p-4">
                  <p className="text-yellow-400 text-xs font-medium">
                    ⚡ During this event, all XP awards (found items, approved claims, helpful comments) will be multiplied by {formData.multiplier || "2.0"}×
                  </p>
                </div>

                {/* Actions */}
                <div className="flex gap-3 pt-2">
                  <button
                    type="button"
                    onClick={() => setShowModal(false)}
                    className="flex-1 px-4 py-2.5 bg-gray-800 hover:bg-gray-700 text-white font-medium rounded-lg transition-colors"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    className="flex-1 px-4 py-2.5 bg-yellow-500 hover:bg-yellow-600 text-black font-bold rounded-lg transition-all flex items-center justify-center gap-2"
                  >
                    <FaCheck size={12} />
                    Create Event
                  </button>
                </div>
              </form>
            </div>
          </div>
        </>
      )}
    </div>
  );
}
