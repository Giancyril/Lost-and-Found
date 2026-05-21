import { useEffect, useState } from "react";
import { FaShieldAlt, FaExclamationTriangle } from "react-icons/fa";

export default function DevToolsDetector() {
  const [isOpen, setIsOpen] = useState(false);

  // Disable detection entirely during local development
  if (import.meta.env.DEV) {
    return null;
  }

  useEffect(() => {
    let devtoolsOpen = false;

    // Advanced: Debugger Trap (detects undocked DevTools by measuring pause time)
    // The debugger statement will halt execution if DevTools is open.
    // We measure the time difference to detect the pause.
    const checkDebugger = () => {
      const start = performance.now();
      debugger; 
      const end = performance.now();
      if (end - start > 100) {
        devtoolsOpen = true;
        setIsOpen(true);
      }
    };

    // Standard: Window dimension differential (detects docked DevTools)
    const checkWindowSize = () => {
      const threshold = 160;
      const widthDiff = window.outerWidth - window.innerWidth > threshold;
      const heightDiff = window.outerHeight - window.innerHeight > threshold;
      
      if (widthDiff || heightDiff) {
        devtoolsOpen = true;
        setIsOpen(true);
      }
    };

    const interval = setInterval(() => {
      if (!devtoolsOpen) {
        checkWindowSize();
        // Fire debugger trap to detect undocked devtools
        try { checkDebugger(); } catch (e) {}
      }
    }, 1000);

    // Run once on mount
    checkWindowSize();
    window.addEventListener("resize", checkWindowSize);

    return () => {
      clearInterval(interval);
      window.removeEventListener("resize", checkWindowSize);
    };
  }, []);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-[999999] bg-gray-950 flex flex-col items-center justify-center p-6 text-center animate-fadeIn">
      <div className="w-24 h-24 rounded-full bg-red-500/10 border-2 border-red-500/20 flex items-center justify-center mb-6 shadow-[0_0_40px_rgba(239,68,68,0.3)]">
        <FaShieldAlt size={40} className="text-red-500" />
      </div>
      <h1 className="text-3xl font-black text-white mb-3 tracking-tight">Security Violation Detected</h1>
      <div className="bg-red-500/10 border border-red-500/20 rounded-xl p-4 max-w-md w-full mb-6 text-left shadow-lg">
        <div className="flex gap-3">
          <FaExclamationTriangle className="text-red-400 shrink-0 mt-0.5" size={16} />
          <p className="text-red-400 text-sm font-semibold leading-relaxed">
            Advanced Developer Tools detection triggered. Reverse engineering and debugging tools are not allowed on this secure platform.
          </p>
        </div>
      </div>
      <p className="text-gray-500 text-xs max-w-sm">
        Please close the browser developer tools (F12 or Inspect Element) to continue using the application.
      </p>
    </div>
  );
}
