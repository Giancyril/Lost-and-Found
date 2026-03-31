import { FaFacebook, FaEnvelope, FaInfoCircle } from "react-icons/fa";

const Footers = () => {
  return (
    <footer className="bg-gray-950 border-t border-gray-800/60">
      <div className="mx-auto max-w-7xl px-6 sm:px-8 lg:px-12 py-12">

        {/* Top section */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8 md:gap-12">

          {/* About */}
          <div className="space-y-3">
            <h3 className="text-[10px] font-bold uppercase tracking-[0.15em] text-gray-400">
              About
            </h3>
            <div className="flex items-start gap-3">
              <div className="mt-0.5 w-7 h-7 rounded-lg bg-blue-500/10 border border-blue-500/20 flex items-center justify-center text-blue-400 shrink-0">
                <FaInfoCircle size={11} />
              </div>
              <p className="text-gray-500 text-sm leading-relaxed">
                SAS Lost &amp; Found Management System
              </p>
            </div>
          </div>

          {/* Contact */}
          <div className="space-y-3">
            <h3 className="text-[10px] font-bold uppercase tracking-[0.15em] text-gray-400">
              Contact Us
            </h3>
            <div className="flex items-start gap-3">
              <div className="mt-0.5 w-7 h-7 rounded-lg bg-blue-500/10 border border-blue-500/20 flex items-center justify-center text-blue-400 shrink-0">
                <FaEnvelope size={11} />
              </div>
              <p className="text-gray-500 text-sm leading-relaxed">
                sas@nbsc.edu.ph
              </p>
            </div>
          </div>

          {/* Follow Us */}
          <div className="space-y-3">
            <h3 className="text-[10px] font-bold uppercase tracking-[0.15em] text-gray-400">
              Follow Us
            </h3>
            <div className="flex items-start gap-3">
              <div className="mt-0.5 w-7 h-7 rounded-lg bg-blue-500/10 border border-blue-500/20 flex items-center justify-center text-blue-400 shrink-0">
                <FaFacebook size={11} />
              </div>
              <a
                href="https://www.facebook.com/nbscstudentaffairsandservices"
                target="_blank"
                rel="noopener noreferrer"
                className="text-gray-500 hover:text-blue-400 text-sm leading-relaxed transition-colors duration-200"
              >
                SAS Official Facebook Page
              </a>
            </div>
          </div>

        </div>

        {/* Divider */}
        <div className="mt-10 mb-6 border-t border-gray-800/60" />

        {/* Bottom bar — stacked + centered on mobile, side-by-side on desktop */}
        <div className="flex flex-col items-center gap-1.5 text-center sm:flex-row sm:justify-between sm:text-left sm:gap-0">

          {/* Copyright */}
          <p className="text-gray-500 text-xs">
            {/* Mobile */}
            <span className="sm:hidden">
              © 2025 <span className="font-semibold text-gray-400">NBSC SAS.</span> All Rights Reserved.
            </span>
            {/* Desktop */}
            <span className="hidden sm:inline">
              © 2025 <span className="font-semibold text-gray-400">SAS Lost &amp; Found Management System.</span> All Rights Reserved.
            </span>
          </p>

          {/* Note */}
          <p className="text-gray-600 text-xs">
            {/* Mobile */}
            <span className="sm:hidden">Visit the SAS Office for item concerns.</span>
            {/* Desktop */}
            <span className="hidden sm:inline">For item concerns, visit the SAS Office during school hours.</span>
          </p>

        </div>

      </div>
    </footer>
  );
};

export default Footers;