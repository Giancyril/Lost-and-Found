import React, { useEffect, useState } from "react";
import { useUserVerification } from "../../auth/auth";
import { FaTrophy, FaMedal, FaStar } from "react-icons/fa";

const API = "/api";
const authHeaders = () => ({
  Authorization: `Bearer ${localStorage.getItem("accessToken") ?? ""}`,
  "Content-Type": "application/json",
});
const medalColor = (i: number) =>
  i === 0 ? "text-yellow-400" : i === 1 ? "text-gray-300" : i === 2 ? "text-amber-600" : "text-gray-600";
const medalBg = (i: number) =>
  i === 0 ? "bg-yellow-500/10 border-yellow-500/20" : i === 1 ? "bg-gray-500/10 border-gray-500/20" : i === 2 ? "bg-amber-600/10 border-amber-600/20" : "bg-white/[0.03] border-white/[0.06]";

export default function StudentLeaderboard() {
  const user: any = useUserVerification();
  const [board, setBoard] = useState<any[]>([]);
  const [myPoints, setMyPoints] = useState<number>(0);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    Promise.allSettled([
      fetch(`${API}/points/leaderboard`, { headers: authHeaders() }).then(r => r.json()),
      fetch(`${API}/points/my`,          { headers: authHeaders() }).then(r => r.json()),
    ]).then(([lb, mp]) => {
      if (lb.status === "fulfilled") setBoard(lb.value?.data ?? []);
      if (mp.status === "fulfilled") setMyPoints(mp.value?.data?.totalPoints ?? 0);
    }).finally(() => setLoading(false));
  }, []);

  const myRank = board.findIndex((u: any) => u.id === user?.id) + 1;

  return (
    <div className="space-y-4">
      <div>
        <h1 className="text-white font-black text-xl">Leaderboard</h1>
        <p className="text-gray-500 text-sm mt-0.5">Top students by points earned</p>
      </div>

      {/* My rank summary */}
      {myRank > 0 && (
        <div className="bg-blue-500/8 border border-blue-500/20 rounded-xl p-4 flex items-center gap-4">
          <div className="w-10 h-10 rounded-xl bg-yellow-500/10 border border-yellow-500/20 flex items-center justify-center shrink-0">
            <FaStar size={16} className="text-yellow-400" />
          </div>
          <div>
            <p className="text-white font-bold text-sm">Your Rank: <span className="text-blue-300">#{myRank}</span></p>
            <p className="text-gray-500 text-xs">You have <span className="text-yellow-400 font-semibold">{myPoints} pts</span> — keep reporting found items to earn more!</p>
          </div>
        </div>
      )}

      {loading ? (
        <div className="flex items-center justify-center py-20">
          <div className="w-6 h-6 border-2 border-blue-500 border-t-transparent rounded-full animate-spin" />
        </div>
      ) : board.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-20 text-center">
          <div className="w-14 h-14 rounded-2xl bg-yellow-500/10 border border-yellow-500/15 flex items-center justify-center mb-4">
            <FaTrophy size={22} className="text-yellow-400" />
          </div>
          <p className="text-white font-semibold">No rankings yet</p>
          <p className="text-gray-500 text-sm mt-1">Be the first to earn points!</p>
        </div>
      ) : (
        <div className="space-y-2">
          {board.map((u: any, i: number) => {
            const isMe = u.id === user?.id;
            const initial = u.name?.charAt(0)?.toUpperCase() || "?";
            return (
              <div key={i} className={`flex items-center gap-4 rounded-xl px-4 py-3 border transition-colors ${
                isMe ? "bg-blue-500/10 border-blue-500/25" : `${medalBg(i)}`
              }`}>
                {/* Rank */}
                <div className={`w-8 text-center font-black ${medalColor(i)}`}>
                  {i < 3 ? <FaMedal size={18} className="mx-auto" /> : <span className="text-sm">#{i + 1}</span>}
                </div>
                {/* Avatar */}
                <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-blue-600 to-cyan-500 flex items-center justify-center shrink-0">
                  {u.userImg
                    ? <img src={u.userImg} alt="" className="w-full h-full rounded-xl object-cover" />
                    : <span className="text-white font-black text-sm">{initial}</span>
                  }
                </div>
                {/* Name */}
                <div className="flex-1 min-w-0">
                  <p className={`font-bold text-sm truncate ${isMe ? "text-blue-300" : "text-white"}`}>
                    {isMe ? `${u.name || "You"} (You)` : (u.name || "Student")}
                  </p>
                  {i < 3 && (
                    <p className={`text-[10px] font-semibold ${medalColor(i)}`}>
                      {i === 0 ? "🥇 1st Place" : i === 1 ? "🥈 2nd Place" : "🥉 3rd Place"}
                    </p>
                  )}
                </div>
                {/* Points */}
                <div className="flex items-center gap-1.5 shrink-0">
                  <FaStar size={11} className="text-yellow-400" />
                  <span className="text-yellow-400 font-black text-sm">{u.totalPoints}</span>
                  <span className="text-gray-600 text-xs">pts</span>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}