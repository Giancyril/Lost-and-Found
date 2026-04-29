import { useEffect, useState } from "react";
import { useUserVerification } from "../../auth/auth";
import { FaTrophy, FaMedal, FaStar, FaSearch } from "react-icons/fa";

const API = "/api";
const authHeaders = () => ({
  Authorization: `Bearer ${localStorage.getItem("accessToken") ?? ""}`,
  "Content-Type": "application/json",
});

const medalLabel = (i: number) =>
  i === 0 ? "🥇 1st Place" : i === 1 ? "🥈 2nd Place" : i === 2 ? "🥉 3rd Place" : null;

const rankColor = (i: number) =>
  i === 0 ? "text-yellow-400" : i === 1 ? "text-gray-300" : i === 2 ? "text-amber-600" : "text-gray-600";

const rankBg = (i: number, isMe: boolean) => {
  if (isMe) return "bg-blue-500/10 border-blue-500/25";
  if (i === 0) return "bg-yellow-500/5 border-yellow-500/15";
  if (i === 1) return "bg-gray-500/5 border-gray-500/15";
  if (i === 2) return "bg-amber-600/5 border-amber-600/15";
  return "bg-gray-900 border-white/[0.05]";
};

export default function StudentLeaderboard() {
  const user: any = useUserVerification();
  const [board,    setBoard]    = useState<any[]>([]);
  const [myPoints, setMyPoints] = useState(0);
  const [loading,  setLoading]  = useState(true);
  const [search,   setSearch]   = useState("");

  useEffect(() => {
    Promise.allSettled([
      fetch(`${API}/points/leaderboard`, { headers: authHeaders() }).then(r => r.json()),
      fetch(`${API}/points/my`,          { headers: authHeaders() }).then(r => r.json()),
    ]).then(([lb, mp]) => {
      if (lb.status === "fulfilled") setBoard(lb.value?.data ?? []);
      if (mp.status === "fulfilled") setMyPoints(mp.value?.data?.totalPoints ?? 0);
    }).finally(() => setLoading(false));
  }, []);

  const myRank   = board.findIndex((u: any) => u.id === user?.id) + 1;
  const filtered = board.filter(u =>
    (u.name || "").toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className="space-y-5 max-w-7xl mx-auto">

      {/* Header */}
      <div>
        <h1 className="text-white font-black text-xl tracking-tight">Leaderboard</h1>
        <p className="text-gray-500 text-sm mt-0.5">Top students ranked by points earned</p>
      </div>

      {/* Stats row */}
      <div className="grid grid-cols-3 gap-3">
        {[
          { label: "Your Points",  value: myPoints,      icon: <FaStar size={14} className="text-yellow-400" />,  accent: "bg-yellow-500/5",  color: "text-yellow-400"  },
          { label: "Your Rank",    value: myRank > 0 ? `#${myRank}` : "—", icon: <FaTrophy size={14} className="text-cyan-400" />, accent: "bg-cyan-500/5", color: "text-cyan-400" },
          { label: "Total Ranked", value: board.length,  icon: <FaMedal size={14} className="text-violet-400" />, accent: "bg-violet-500/5",  color: "text-violet-400"  },
        ].map(({ label, value, icon, accent, color }) => (
          <div key={label} className="relative bg-gray-900 border border-white/5 rounded-2xl p-3 flex flex-col gap-2 overflow-hidden">
            <div className={`absolute inset-0 opacity-30 ${accent} blur-3xl scale-150 pointer-events-none`} />
            <div className="relative">
              <div className={`w-8 h-8 rounded-xl flex items-center justify-center ${accent}`}>{icon}</div>
            </div>
            <div className="relative">
              <p className={`text-xl font-bold tracking-tight ${color}`}>{value}</p>
              <p className="text-gray-500 text-[11px] mt-0.5 font-medium">{label}</p>
            </div>
          </div>
        ))}
      </div>

      {/* My rank callout */}
      {myRank > 0 && (
        <div className="bg-blue-500/[0.07] border border-blue-500/20 rounded-2xl px-4 py-3 flex items-center gap-3">
          <div className="w-9 h-9 rounded-xl bg-yellow-500/10 border border-yellow-500/20 flex items-center justify-center shrink-0">
            <FaStar size={14} className="text-yellow-400" />
          </div>
          <div>
            <p className="text-white font-bold text-sm">
              You're ranked <span className="text-blue-300">#{myRank}</span> with{" "}
              <span className="text-yellow-400 font-bold">{myPoints} pts</span>
            </p>
            <p className="text-gray-500 text-xs mt-0.5">
              Report found items to earn more points and climb the ranks.
            </p>
          </div>
        </div>
      )}

      {/* Search */}
      <div className="bg-gray-900 border border-white/5 rounded-2xl p-4">
        <div className="relative">
          <FaSearch className="absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-500" size={12} />
          <input
            type="text" placeholder="Search students..." value={search}
            onChange={e => setSearch(e.target.value)}
            className="w-full pl-10 pr-4 py-2.5 bg-gray-800/80 border border-white/10 rounded-2xl text-white text-sm placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-blue-500/20 transition-all"
          />
        </div>
      </div>

      {loading ? (
        <div className="space-y-2 animate-pulse">
          {[1,2,3,4,5].map(i => <div key={i} className="h-14 bg-gray-900 border border-white/5 rounded-2xl" />)}
        </div>
      ) : filtered.length === 0 ? (
        <div className="bg-gray-900 border border-white/5 rounded-2xl py-20 text-center">
          <div className="w-14 h-14 rounded-2xl bg-yellow-500/10 border border-yellow-500/15 flex items-center justify-center mx-auto mb-4">
            <FaTrophy size={22} className="text-yellow-400" />
          </div>
          <p className="text-white font-semibold">No rankings yet</p>
          <p className="text-gray-500 text-sm mt-1">Be the first to earn points!</p>
        </div>
      ) : (
        <>
          {/* Desktop table */}
          <div className="hidden md:block bg-gray-900 border border-white/5 rounded-2xl overflow-hidden">
            <div className="grid grid-cols-12 gap-4 px-5 py-3 border-b border-white/5 text-[10px] uppercase tracking-widest text-gray-600 font-semibold">
              <div className="col-span-1">Rank</div>
              <div className="col-span-6">Student</div>
              <div className="col-span-3">Achievement</div>
              <div className="col-span-2 text-right">Points</div>
            </div>
            <div className="divide-y divide-white/[0.04]">
              {filtered.map((u: any, i: number) => {
                const isMe    = u.id === user?.id;
                const initial = u.name?.charAt(0)?.toUpperCase() || "?";
                const realIdx = board.findIndex(b => b.id === u.id);
                return (
                  <div key={i}
                    className={`grid grid-cols-12 gap-4 items-center px-5 py-3.5 transition-colors ${
                      isMe ? "bg-blue-500/5" : "hover:bg-white/[0.02]"
                    }`}>
                    <div className="col-span-1">
                      <div className={`font-black text-sm ${rankColor(realIdx)}`}>
                        {realIdx < 3
                          ? <FaMedal size={16} />
                          : <span className="text-xs">#{realIdx + 1}</span>
                        }
                      </div>
                    </div>
                    <div className="col-span-6 flex items-center gap-3 min-w-0">
                      <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-blue-600 to-cyan-500 flex items-center justify-center shrink-0">
                        {u.userImg
                          ? <img src={u.userImg} alt="" className="w-full h-full rounded-xl object-cover" />
                          : <span className="text-white font-black text-sm">{initial}</span>
                        }
                      </div>
                      <div className="min-w-0">
                        <p className={`font-bold text-sm truncate ${isMe ? "text-blue-300" : "text-white"}`}>
                          {isMe ? `${u.name || "You"} (You)` : (u.name || "Student")}
                        </p>
                        {u.schoolId && <p className="text-gray-600 text-[10px] font-mono">{u.schoolId}</p>}
                      </div>
                    </div>
                    <div className="col-span-3">
                      {medalLabel(realIdx) && (
                        <span className={`text-xs font-semibold ${rankColor(realIdx)}`}>
                          {medalLabel(realIdx)}
                        </span>
                      )}
                    </div>
                    <div className="col-span-2 flex items-center justify-end gap-1.5">
                      <FaStar size={11} className="text-yellow-400" />
                      <span className="text-yellow-400 font-black text-sm">{u.totalPoints}</span>
                      <span className="text-gray-600 text-xs">pts</span>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Mobile cards */}
          <div className="md:hidden space-y-2">
            {filtered.map((u: any, i: number) => {
              const isMe    = u.id === user?.id;
              const initial = u.name?.charAt(0)?.toUpperCase() || "?";
              const realIdx = board.findIndex(b => b.id === u.id);
              return (
                <div key={i}
                  className={`flex items-center gap-4 rounded-2xl px-4 py-3 border transition-colors ${rankBg(realIdx, isMe)}`}>
                  <div className={`w-8 text-center font-black ${rankColor(realIdx)}`}>
                    {realIdx < 3
                      ? <FaMedal size={18} className="mx-auto" />
                      : <span className="text-sm">#{realIdx + 1}</span>
                    }
                  </div>
                  <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-blue-600 to-cyan-500 flex items-center justify-center shrink-0">
                    {u.userImg
                      ? <img src={u.userImg} alt="" className="w-full h-full rounded-xl object-cover" />
                      : <span className="text-white font-black text-sm">{initial}</span>
                    }
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className={`font-bold text-sm truncate ${isMe ? "text-blue-300" : "text-white"}`}>
                      {isMe ? `${u.name || "You"} (You)` : (u.name || "Student")}
                    </p>
                    {medalLabel(realIdx) && (
                      <p className={`text-[10px] font-semibold ${rankColor(realIdx)}`}>{medalLabel(realIdx)}</p>
                    )}
                  </div>
                  <div className="flex items-center gap-1.5 shrink-0">
                    <FaStar size={11} className="text-yellow-400" />
                    <span className="text-yellow-400 font-black text-sm">{u.totalPoints}</span>
                    <span className="text-gray-600 text-xs">pts</span>
                  </div>
                </div>
              );
            })}
          </div>
        </>
      )}
    </div>
  );
}