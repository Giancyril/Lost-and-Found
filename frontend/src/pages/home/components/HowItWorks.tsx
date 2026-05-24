import { motion } from "framer-motion";
import { Camera, Sparkles, BellRing } from "lucide-react";

const steps = [
  {
    id: 1,
    title: "Snap a Photo",
    description: "Found something? Just take a quick picture. Our web scanner is lightning fast and optimized for mobile.",
    icon: Camera,
    color: "from-blue-500 to-brand-neon-cyan",
    delay: 0.1
  },
  {
    id: 2,
    title: "Magic AI Identifies It",
    description: "Our Gemini AI instantly extracts tags like color, brand, and condition. No manual typing required.",
    icon: Sparkles,
    color: "from-purple-500 to-brand-neon-pink",
    delay: 0.3
  },
  {
    id: 3,
    title: "Smart Match Alert",
    description: "If someone reported it lost, they get an instant push notification. Reunited in minutes!",
    icon: BellRing,
    color: "from-brand-neon-indigo to-blue-600",
    delay: 0.5
  }
];

const HowItWorks = () => {
  return (
    <section className="py-24 bg-[#0a0f18] relative overflow-hidden border-t border-brand-dark">
      {/* Background decorations */}
      <div className="absolute top-1/2 left-0 w-64 h-64 bg-brand-neon-cyan/5 rounded-full blur-[100px]"></div>
      <div className="absolute bottom-0 right-0 w-96 h-96 bg-brand-neon-pink/5 rounded-full blur-[120px]"></div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
        <div className="text-center mb-20">
          <motion.h2 
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, margin: "-50px" }}
            className="text-4xl md:text-5xl font-bold text-white mb-4"
          >
            How It <span className="text-transparent bg-clip-text bg-gradient-to-r from-brand-neon-cyan to-brand-neon-indigo">Works</span>
          </motion.h2>
          <motion.p 
            initial={{ opacity: 0 }}
            whileInView={{ opacity: 1 }}
            viewport={{ once: true }}
            transition={{ delay: 0.2 }}
            className="text-slate-400 text-lg max-w-2xl mx-auto"
          >
            A seamless, AI-powered journey from finding an item to returning it to its rightful owner.
          </motion.p>
        </div>

        <div className="grid md:grid-cols-3 gap-8 relative">
          {/* Connecting Line (Desktop only) */}
          <div className="hidden md:block absolute top-1/2 left-[10%] right-[10%] h-0.5 bg-slate-800 -translate-y-1/2 z-0">
            <motion.div 
              initial={{ scaleX: 0 }}
              whileInView={{ scaleX: 1 }}
              viewport={{ once: true, margin: "-100px" }}
              transition={{ duration: 1.5, ease: "easeInOut" }}
              className="h-full bg-gradient-to-r from-brand-neon-cyan via-brand-neon-indigo to-brand-neon-pink origin-left"
            ></motion.div>
          </div>

          {steps.map((step, index) => (
            <motion.div 
              key={step.id}
              initial={{ opacity: 0, y: 50 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, margin: "-50px" }}
              transition={{ duration: 0.5, delay: step.delay }}
              className="relative z-10"
            >
              <div className="bg-brand-dark/80 backdrop-blur-sm border border-slate-700/50 rounded-2xl p-8 h-full hover:border-brand-neon-indigo/50 transition-colors duration-300 group">
                {/* Step Number Badge */}
                <div className="absolute -top-4 -left-4 w-10 h-10 rounded-full bg-brand-darker border border-slate-700 flex items-center justify-center font-bold text-slate-300 group-hover:text-white group-hover:border-brand-neon-cyan transition-colors">
                  {step.id}
                </div>
                
                {/* Icon Container */}
                <div className={`w-16 h-16 rounded-2xl mb-6 flex items-center justify-center bg-gradient-to-br ${step.color} shadow-lg shadow-brand-neon-indigo/20 transform group-hover:scale-110 group-hover:rotate-3 transition-transform duration-300`}>
                  <step.icon className="w-8 h-8 text-white" />
                </div>
                
                <h3 className="text-2xl font-bold text-white mb-3">{step.title}</h3>
                <p className="text-slate-400 leading-relaxed">
                  {step.description}
                </p>

                {/* Simulated UI Mockup inside the card */}
                <div className="mt-6 pt-6 border-t border-slate-700/50 overflow-hidden relative h-32 rounded-lg bg-black/20">
                  {index === 0 && (
                    <motion.div 
                      initial={{ y: 20, opacity: 0 }}
                      whileInView={{ y: 0, opacity: 1 }}
                      transition={{ delay: step.delay + 0.3 }}
                      className="absolute inset-x-4 bottom-[-10px] bg-slate-800 border border-slate-600 rounded-t-xl p-3 flex flex-col items-center justify-start gap-2"
                    >
                      <div className="w-full h-24 bg-slate-700 rounded-md border-2 border-dashed border-slate-500 flex items-center justify-center">
                        <div className="w-12 h-12 rounded-full border-2 border-brand-neon-cyan flex items-center justify-center">
                          <div className="w-10 h-10 rounded-full bg-brand-neon-cyan"></div>
                        </div>
                      </div>
                    </motion.div>
                  )}
                  {index === 1 && (
                    <motion.div 
                      initial={{ scale: 0.8, opacity: 0 }}
                      whileInView={{ scale: 1, opacity: 1 }}
                      transition={{ delay: step.delay + 0.3 }}
                      className="absolute inset-0 flex flex-col justify-center gap-2 p-4"
                    >
                      <div className="h-6 w-3/4 bg-brand-neon-pink/20 rounded border border-brand-neon-pink/30 flex items-center px-2">
                        <Sparkles className="w-3 h-3 text-brand-neon-pink mr-2" />
                        <div className="h-2 w-16 bg-brand-neon-pink/50 rounded"></div>
                      </div>
                      <div className="h-6 w-1/2 bg-brand-neon-cyan/20 rounded border border-brand-neon-cyan/30 flex items-center px-2">
                        <Sparkles className="w-3 h-3 text-brand-neon-cyan mr-2" />
                        <div className="h-2 w-12 bg-brand-neon-cyan/50 rounded"></div>
                      </div>
                    </motion.div>
                  )}
                  {index === 2 && (
                    <motion.div 
                      initial={{ x: 50, opacity: 0 }}
                      whileInView={{ x: 0, opacity: 1 }}
                      transition={{ type: "spring", delay: step.delay + 0.3 }}
                      className="absolute top-4 right-4 left-4 bg-slate-800 border-l-4 border-l-brand-neon-indigo p-3 rounded shadow-lg flex gap-3"
                    >
                      <BellRing className="w-5 h-5 text-brand-neon-indigo shrink-0" />
                      <div className="space-y-2 w-full">
                        <div className="h-2 w-20 bg-slate-500 rounded"></div>
                        <div className="h-2 w-full bg-slate-600 rounded"></div>
                      </div>
                    </motion.div>
                  )}
                </div>
              </div>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
};

export default HowItWorks;
