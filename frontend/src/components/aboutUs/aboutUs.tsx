const AboutUs = () => {
  return (
    <>
      <style>{`
        @keyframes fadeUp {
          from { opacity: 0; transform: translateY(20px); }
          to   { opacity: 1; transform: translateY(0); }
        }
        .au-animate { animation: fadeUp 0.5s ease both; }
        .au-animate:nth-child(1) { animation-delay: 0.05s; }
        .au-animate:nth-child(2) { animation-delay: 0.12s; }
        .au-animate:nth-child(3) { animation-delay: 0.19s; }

        .au-value-card:hover {
          border-color: rgba(59,130,246,0.4);
          transform: translateY(-2px);
        }
        .au-audience-card:hover {
          border-color: rgba(59,130,246,0.35);
          background: rgb(17,24,39);
        }
      `}</style>

      <section id="aboutUs" className="py-16 sm:py-24 bg-gray-950 relative overflow-hidden">

        {/* Background blobs */}
        <div className="absolute inset-0 pointer-events-none overflow-hidden">
          <div className="absolute -top-24 -left-24 w-80 h-80 bg-blue-900/10 rounded-full blur-3xl" />
          <div className="absolute bottom-0 right-0 w-64 h-64 bg-cyan-900/8 rounded-full blur-3xl" />
        </div>

        <div className="px-4 sm:px-6 lg:px-16 mx-auto max-w-7xl relative z-10">

          {/* Section label */}
          <div className="mb-10 sm:mb-16">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-blue-500/10 border border-blue-500/20 mb-5">
              <span className="w-1.5 h-1.5 rounded-full bg-blue-400 animate-pulse" />
              <span className="text-blue-300 text-[11px] font-bold uppercase tracking-widest">About the System</span>
            </div>
            <h2 className="text-3xl sm:text-4xl md:text-5xl font-black text-white leading-tight tracking-tight mb-4">
              Built for the{" "}
              <span className="bg-gradient-to-r from-blue-400 to-cyan-400 bg-clip-text text-transparent">
                SAS Community
              </span>
            </h2>
            <div className="w-12 h-1 bg-gradient-to-r from-blue-500 to-cyan-400 rounded-full mb-5" />
            <p className="text-gray-400 text-sm sm:text-base leading-relaxed max-w-2xl">
              The <strong className="text-white font-semibold">SAS Lost & Found Management System</strong> is designed exclusively for students, teachers, and staff — providing a safe, organized, and transparent way to report, track, and recover lost items within campus premises.
            </p>
          </div>

          {/* Main grid */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 lg:gap-16 items-start">

            {/* Left — audience cards + secondary text */}
            <div>
              <p className="text-gray-400 text-sm leading-relaxed mb-6">
                We believe a well-managed lost and found system reflects the integrity and care of our school community. Every item reported and returned strengthens the trust we hold for one another as part of SAS.
              </p>

              <div className="flex flex-col gap-3">
                {[
                  { emoji: "🎒", title: "For Students", desc: "Easily report or claim lost items from classrooms, hallways, or school grounds." },
                  { emoji: "👨‍🏫", title: "For Teachers & Staff", desc: "Manage found items and coordinate with the admin office through one central system." },
                  { emoji: "🏫", title: "School-Wide Coverage", desc: "Covers all campus areas including classrooms, field, cafeteria, and library." },
                ].map((item) => (
                  <div
                    key={item.title}
                    className="au-audience-card au-animate flex items-start gap-3 bg-gray-900/70 border border-gray-800 rounded-xl p-4 transition-all duration-300"
                  >
                    <div className="w-9 h-9 rounded-lg bg-blue-500/10 border border-blue-500/20 flex items-center justify-center shrink-0 text-base">
                      {item.emoji}
                    </div>
                    <div>
                      <p className="text-white font-semibold text-sm mb-0.5">{item.title}</p>
                      <p className="text-gray-500 text-xs sm:text-sm leading-relaxed">{item.desc}</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Right — mission + values */}
            <div className="flex flex-col gap-5">

              {/* Mission card */}
              <div className="relative bg-gray-900 border border-blue-800/30 rounded-2xl p-5 sm:p-7 overflow-hidden">
                {/* subtle glow */}
                <div className="absolute -top-8 -right-8 w-40 h-40 bg-blue-600/8 rounded-full blur-2xl pointer-events-none" />
                <div className="relative z-10">
                  <div className="flex items-center gap-3 mb-4">
                    <div className="w-9 h-9 rounded-xl bg-blue-600/20 border border-blue-600/30 flex items-center justify-center text-base shrink-0">🎯</div>
                    <h3 className="text-white font-bold text-base sm:text-lg">Our Mission</h3>
                  </div>
                  <p className="text-gray-400 text-sm leading-relaxed">
                    To provide SAS with a reliable, school-appropriate lost and found system that promotes honesty, responsibility, and respect for each other's belongings — core values at the heart of our school culture.
                  </p>
                </div>
              </div>

              {/* Values grid — 2 columns always */}
              <div className="grid grid-cols-2 gap-3">
                {[
                  { emoji: "🔍", label: "Transparency", desc: "Open and trackable reporting" },
                  { emoji: "🛡️", label: "Privacy", desc: "Student data always protected" },
                  { emoji: "⚡", label: "Efficiency", desc: "Fast resolution within 24hrs" },
                  { emoji: "🤝", label: "Integrity", desc: "Honest, verified claiming" },
                ].map((v) => (
                  <div
                    key={v.label}
                    className="au-value-card bg-gray-900 border border-gray-800 rounded-xl p-4 transition-all duration-300"
                  >
                    <div className="text-xl mb-2">{v.emoji}</div>
                    <p className="text-white font-semibold text-xs sm:text-sm mb-1">{v.label}</p>
                    <p className="text-gray-500 text-[11px] sm:text-xs leading-relaxed">{v.desc}</p>
                  </div>
                ))}
              </div>

              {/* Stats strip */}
              <div className="grid grid-cols-3 gap-3">
                {[
                  { value: "500+", label: "Items Tracked" },
                  { value: "24h", label: "Avg. Resolution" },
                  { value: "98%", label: "Recovery Rate" },
                ].map((stat) => (
                  <div key={stat.label} className="bg-gray-900 border border-gray-800 rounded-xl p-3 sm:p-4 text-center">
                    <p className="text-blue-400 font-black text-lg sm:text-2xl leading-none mb-1">{stat.value}</p>
                    <p className="text-gray-500 text-[10px] sm:text-xs leading-tight">{stat.label}</p>
                  </div>
                ))}
              </div>

            </div>
          </div>
        </div>
      </section>
    </>
  );
};

export default AboutUs;