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

                {/* Video Player */}
                <div className="mt-6 pt-6 border-t border-slate-700/50 overflow-hidden relative h-48 rounded-lg bg-black group-hover:border-t-brand-neon-indigo/50 transition-colors">
                  <div className="absolute inset-0 bg-gradient-to-t from-brand-darker to-transparent z-10 pointer-events-none opacity-60"></div>
                  
                  {index === 0 && (
                    <video 
                      autoPlay 
                      loop 
                      muted 
                      playsInline
                      className="absolute inset-0 w-full h-full object-cover opacity-80 group-hover:opacity-100 transition-opacity duration-500 group-hover:scale-105"
                      src="https://assets.mixkit.co/videos/preview/mixkit-taking-photos-of-a-beautiful-landscape-with-a-smartphone-34538-large.mp4"
                    />
                  )}
                  {index === 1 && (
                    <video 
                      autoPlay 
                      loop 
                      muted 
                      playsInline
                      className="absolute inset-0 w-full h-full object-cover opacity-80 group-hover:opacity-100 transition-opacity duration-500 group-hover:scale-105"
                      src="https://assets.mixkit.co/videos/preview/mixkit-software-developer-working-on-code-in-dark-mode-43405-large.mp4"
                    />
                  )}
                  {index === 2 && (
                    <video 
                      autoPlay 
                      loop 
                      muted 
                      playsInline
                      className="absolute inset-0 w-full h-full object-cover opacity-80 group-hover:opacity-100 transition-opacity duration-500 group-hover:scale-105"
                      src="https://assets.mixkit.co/videos/preview/mixkit-person-using-a-mobile-phone-at-night-4972-large.mp4"
                    />
                  )}
                  
                  {/* Overlay text for the placeholder */}
                  <div className="absolute bottom-2 right-2 z-20">
                    <span className="text-[10px] text-white/40 uppercase tracking-widest bg-black/50 px-2 py-1 rounded">Replace with your app video</span>
                  </div>
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
