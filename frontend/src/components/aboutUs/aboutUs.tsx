const AboutUs = () => {
  return (
    <section id="aboutUs" className="py-20 bg-gray-950 relative overflow-hidden">
      <div className="absolute top-0 left-0 w-96 h-96 bg-blue-900/10 rounded-full blur-3xl pointer-events-none" />

      <div className="px-4 sm:px-6 lg:px-16 mx-auto max-w-7xl relative z-10">
        <div className="grid lg:grid-cols-2 gap-16 items-center">

          {/* Left */}
          <div>
            <p className="text-blue-400 text-sm font-semibold uppercase tracking-widest mb-3">About the System</p>
            <h2 className="text-4xl md:text-5xl font-black text-white leading-tight mb-6">
              Built for the{" "}
              <span className="bg-gradient-to-r from-blue-400 to-cyan-400 bg-clip-text text-transparent">
                SAS Community
              </span>
            </h2>
            <div className="w-16 h-1 bg-gradient-to-r from-blue-500 to-cyan-400 mb-6 rounded-full" />

            <p className="text-gray-400 text-base leading-relaxed mb-6">
              The <strong className="text-white">SAS Lost & Found Management System</strong> is the official platform designed exclusively for students, teachers, and staff of our school. It provides a safe, organized, and transparent way to report, track, and recover lost items within campus premises.
            </p>
            <p className="text-gray-400 text-base leading-relaxed mb-8">
              We believe that a well-managed lost and found system reflects the integrity and care of our school community. Every item reported and returned strengthens the trust and responsibility we hold for one another as part of SAS.
            </p>

            <div className="flex flex-col gap-4">
              {[
                { icon: "🎒", title: "For Students", desc: "Easily report or claim lost items from classrooms, hallways, or school grounds." },
                { icon: "👨‍🏫", title: "For Teachers & Staff", desc: "Manage found items and coordinate with the admin office through one central system." },
                { icon: "🏫", title: "School-Wide Coverage", desc: "Covers all campus areas including classrooms, gym, cafeteria, and library." },
              ].map((item) => (
                <div key={item.title} className="flex items-start gap-4 bg-gray-900 border border-gray-800 rounded-xl p-4">
                  <div className="text-2xl mt-0.5">{item.icon}</div>
                  <div>
                    <p className="text-white font-semibold text-sm mb-1">{item.title}</p>
                    <p className="text-gray-500 text-sm leading-relaxed">{item.desc}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Right */}
          <div className="flex flex-col gap-6">
            {/* Mission card */}
            <div className="bg-gradient-to-br from-blue-950 to-gray-900 border border-blue-800/30 rounded-2xl p-8">
              <div className="flex items-center gap-3 mb-4">
                <div className="w-10 h-10 rounded-lg bg-blue-600/20 border border-blue-600/30 flex items-center justify-center text-xl">🎯</div>
                <h3 className="text-white font-bold text-lg">Our Mission</h3>
              </div>
              <p className="text-gray-400 text-sm leading-relaxed">
                To provide SAS with a reliable, school-appropriate lost and found system that promotes honesty, responsibility, and respect for each other's belongings — core values at the heart of our school culture.
              </p>
            </div>

            {/* Values grid */}
            <div className="grid grid-cols-2 gap-4">
              {[
                { icon: "🔍", label: "Transparency", desc: "Open and trackable reporting process" },
                { icon: "🛡️", label: "Privacy", desc: "Student data is always protected" },
                { icon: "⚡", label: "Efficiency", desc: "Fast resolution within 24 hours" },
                { icon: "🤝", label: "Integrity", desc: "Honest, verified item claiming" },
              ].map((v) => (
                <div key={v.label} className="bg-gray-900 border border-gray-800 rounded-xl p-5 hover:border-blue-700/40 transition-all duration-300 group">
                  <div className="text-2xl mb-2">{v.icon}</div>
                  <p className="text-white font-semibold text-sm mb-1 group-hover:text-blue-300 transition-colors">{v.label}</p>
                  <p className="text-gray-500 text-xs leading-relaxed">{v.desc}</p>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};

export default AboutUs;