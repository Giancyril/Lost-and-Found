import { motion } from "framer-motion";
import { useGetLeaderboardQuery } from "../../../redux/api/api";
import { Trophy, Medal, Award, User } from "lucide-react";

const CampusHeroes = () => {
  const { data: leaderboardData, isLoading } = useGetLeaderboardQuery({});

  const containerVariants = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: {
        staggerChildren: 0.2
      }
    }
  };

  const itemVariants = {
    hidden: { y: 50, opacity: 0 },
    visible: { y: 0, opacity: 1, transition: { type: "spring", stiffness: 100 } }
  };

  if (isLoading) {
    return (
      <div className="py-16 bg-brand-darker text-white flex justify-center items-center">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-brand-neon-cyan"></div>
      </div>
    );
  }

  // Fallback to dummy data if API returns empty or fails, just to showcase the design
  const heroes = leaderboardData?.data?.slice(0, 3) || [
    { student: { firstName: "Sarah", lastName: "Chen", studentId: "2024-101" }, points: 2450 },
    { student: { firstName: "Michael", lastName: "Torres", studentId: "2024-502" }, points: 1980 },
    { student: { firstName: "Aisha", lastName: "Patel", studentId: "2024-303" }, points: 1850 }
  ];

  if (!heroes || heroes.length === 0) return null;

  return (
    <section className="py-20 bg-brand-darker relative overflow-hidden border-t border-brand-dark">
      {/* Background Glow */}
      <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[800px] h-[400px] bg-brand-neon-indigo/20 blur-[120px] rounded-full pointer-events-none"></div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
        <div className="text-center mb-16">
          <motion.h2 
            initial={{ opacity: 0, y: -20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="text-4xl md:text-5xl font-bold text-white mb-4"
          >
            Campus <span className="text-transparent bg-clip-text bg-gradient-to-r from-brand-neon-cyan to-brand-neon-indigo">Heroes</span>
          </motion.h2>
          <motion.p 
            initial={{ opacity: 0 }}
            whileInView={{ opacity: 1 }}
            viewport={{ once: true }}
            transition={{ delay: 0.2 }}
            className="text-slate-400 text-lg max-w-2xl mx-auto"
          >
            Celebrating the top contributors who keep our campus community united. 
            Earn points by returning items and climb the leaderboard!
          </motion.p>
        </div>

        <motion.div 
          variants={containerVariants}
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true, margin: "-100px" }}
          className="flex flex-col md:flex-row justify-center items-end gap-6 md:gap-8 mt-12 md:h-[450px]"
        >
          {/* 2nd Place */}
          {heroes[1] && (
            <motion.div variants={itemVariants} className="order-2 md:order-1 flex-1 max-w-[300px] w-full mx-auto">
              <div className="bg-brand-dark border border-slate-700 rounded-t-2xl p-6 text-center flex flex-col items-center shadow-lg relative overflow-hidden group hover:-translate-y-2 transition-transform duration-300">
                <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-slate-400 to-slate-300"></div>
                <div className="w-20 h-20 rounded-full bg-slate-800 border-2 border-slate-400 flex items-center justify-center mb-4 shadow-[0_0_15px_rgba(148,163,184,0.3)]">
                  <User className="w-10 h-10 text-slate-400" />
                </div>
                <Medal className="w-8 h-8 text-slate-400 mb-2" />
                <h3 className="text-xl font-bold text-white mb-1">{heroes[1]?.student?.firstName || "Student"}</h3>
                <div className="text-sm text-brand-neon-cyan font-semibold px-3 py-1 bg-brand-neon-cyan/10 rounded-full mb-3">
                  {heroes[1]?.points || 0} pts
                </div>
                <div className="mt-auto pt-4 w-full border-t border-slate-700/50">
                  <span className="text-6xl font-black text-slate-700/50">2</span>
                </div>
              </div>
            </motion.div>
          )}

          {/* 1st Place */}
          {heroes[0] && (
            <motion.div variants={itemVariants} className="order-1 md:order-2 flex-1 max-w-[340px] w-full mx-auto z-10 md:-mb-8">
              <div className="bg-gradient-to-b from-brand-dark to-[#162032] border border-brand-neon-indigo/50 rounded-t-2xl p-8 text-center flex flex-col items-center shadow-[0_0_30px_rgba(99,102,241,0.2)] relative overflow-hidden group hover:-translate-y-2 transition-transform duration-300">
                <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-brand-neon-cyan to-brand-neon-indigo"></div>
                
                {/* Glowing Avatar */}
                <div className="relative mb-6">
                  <div className="absolute inset-0 bg-brand-neon-indigo blur-md opacity-50 rounded-full"></div>
                  <div className="w-24 h-24 rounded-full bg-slate-800 border-2 border-brand-neon-indigo flex items-center justify-center relative z-10">
                    <User className="w-12 h-12 text-brand-neon-indigo" />
                  </div>
                  <div className="absolute -bottom-3 -right-3 bg-brand-darker rounded-full p-1 z-20 border border-brand-neon-indigo/30">
                    <Trophy className="w-6 h-6 text-yellow-400" fill="currentColor" />
                  </div>
                </div>

                <h3 className="text-2xl font-bold text-white mb-1">{heroes[0]?.student?.firstName || "Student"}</h3>
                <p className="text-slate-400 text-sm mb-3">Verified Hero</p>
                <div className="text-md text-brand-neon-indigo font-bold px-4 py-1.5 bg-brand-neon-indigo/10 border border-brand-neon-indigo/20 rounded-full mb-4 shadow-[0_0_10px_rgba(99,102,241,0.2)]">
                  {heroes[0]?.points || 0} pts
                </div>
                
                <div className="mt-auto pt-6 w-full border-t border-brand-neon-indigo/20">
                  <span className="text-8xl font-black text-brand-neon-indigo/20 drop-shadow-[0_0_10px_rgba(99,102,241,0.5)]">1</span>
                </div>
              </div>
            </motion.div>
          )}

          {/* 3rd Place */}
          {heroes[2] && (
            <motion.div variants={itemVariants} className="order-3 md:order-3 flex-1 max-w-[300px] w-full mx-auto">
              <div className="bg-brand-dark border border-slate-700 rounded-t-2xl p-6 text-center flex flex-col items-center shadow-lg relative overflow-hidden group hover:-translate-y-2 transition-transform duration-300">
                <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-amber-600 to-amber-700"></div>
                <div className="w-20 h-20 rounded-full bg-slate-800 border-2 border-amber-700 flex items-center justify-center mb-4 shadow-[0_0_15px_rgba(180,83,9,0.3)]">
                  <User className="w-10 h-10 text-amber-700" />
                </div>
                <Award className="w-8 h-8 text-amber-700 mb-2" />
                <h3 className="text-xl font-bold text-white mb-1">{heroes[2]?.student?.firstName || "Student"}</h3>
                <div className="text-sm text-brand-neon-pink font-semibold px-3 py-1 bg-brand-neon-pink/10 rounded-full mb-3">
                  {heroes[2]?.points || 0} pts
                </div>
                <div className="mt-auto pt-4 w-full border-t border-slate-700/50">
                  <span className="text-6xl font-black text-slate-700/50">3</span>
                </div>
              </div>
            </motion.div>
          )}
        </motion.div>
      </div>
    </section>
  );
};

export default CampusHeroes;
