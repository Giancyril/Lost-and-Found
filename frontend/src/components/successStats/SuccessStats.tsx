import { FaBoxOpen, FaClock, FaUserGraduate, FaSchool } from "react-icons/fa";

const SuccessStats = () => {
  const stats = [
    {
      icon: <FaBoxOpen className="w-6 h-6" />,
      number: "1,200+",
      label: "Items Returned",
      description: "Successfully reunited with owners",
      color: "blue",
    },
    {
      icon: <FaUserGraduate className="w-6 h-6" />,
      number: "3,500+",
      label: "Students Served",
      description: "Active SAS community members",
      color: "cyan",
    },
    {
      icon: <FaClock className="w-6 h-6" />,
      number: "< 24hrs",
      label: "Avg. Resolution",
      description: "From report to claim",
      color: "green",
    },
    {
      icon: <FaSchool className="w-6 h-6" />,
      number: "98%",
      label: "Return Rate",
      description: "Verified items claimed",
      color: "yellow",
    },
  ];

  const colorMap: { [key: string]: { bg: string; border: string; text: string; bar: string } } = {
    blue:   { bg: "bg-blue-600/10",   border: "border-blue-600/20",   text: "text-blue-400",   bar: "bg-blue-500" },
    cyan:   { bg: "bg-cyan-600/10",   border: "border-cyan-600/20",   text: "text-cyan-400",   bar: "bg-cyan-500" },
    green:  { bg: "bg-green-600/10",  border: "border-green-600/20",  text: "text-green-400",  bar: "bg-green-500" },
    yellow: { bg: "bg-yellow-600/10", border: "border-yellow-600/20", text: "text-yellow-400", bar: "bg-yellow-500" },
  };

  return (
    <section className="py-20 bg-gray-900 relative overflow-hidden">
      <div className="absolute inset-0 pointer-events-none">
        <div className="absolute bottom-0 right-0 w-80 h-80 bg-blue-900/10 rounded-full blur-3xl" />
        <div className="absolute top-0 left-0 w-80 h-80 bg-cyan-900/10 rounded-full blur-3xl" />
      </div>

      <div className="px-4 sm:px-6 lg:px-16 mx-auto max-w-7xl relative z-10">
        {/* Header */}
        <div className="max-w-2xl mb-14">
          <p className="text-blue-400 text-sm font-semibold uppercase tracking-widest mb-3">By the Numbers</p>
          <h2 className="text-4xl md:text-5xl font-black text-white leading-tight mb-4">
            SAS Lost & Found{" "}
            <span className="bg-gradient-to-r from-blue-400 to-cyan-400 bg-clip-text text-transparent">
              Impact
            </span>
          </h2>
          <p className="text-gray-400 text-lg leading-relaxed">
            Every report submitted helps keep our campus organized and our community connected. Here's the difference we've made together.
          </p>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
          {stats.map((stat, index) => {
            const c = colorMap[stat.color];
            return (
              <div
                key={index}
                className="bg-gray-950 border border-gray-800 rounded-2xl p-7 hover:border-gray-700 transition-all duration-300 hover:-translate-y-1 hover:shadow-xl group"
              >
                <div className={`w-12 h-12 rounded-xl ${c.bg} ${c.border} border flex items-center justify-center ${c.text} mb-5`}>
                  {stat.icon}
                </div>
                <p className={`text-3xl font-black ${c.text} mb-1`}>{stat.number}</p>
                <p className="text-white font-semibold text-base mb-1">{stat.label}</p>
                <p className="text-gray-500 text-sm">{stat.description}</p>
                <div className="mt-4 h-1 bg-gray-800 rounded-full overflow-hidden">
                  <div className={`h-full ${c.bar} rounded-full w-3/4 group-hover:w-full transition-all duration-700`} />
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </section>
  );
};

export default SuccessStats;