import { FaFacebook, FaEnvelope, FaInfoCircle } from "react-icons/fa";
import { Link } from "react-router-dom";

const Footers = () => {
  return (
    <footer className="bg-gray-950 border-t border-gray-800/60">
      <div className="mx-auto max-w-7xl px-3 sm:px-8 lg:px-12 py-5 sm:py-10 lg:py-12">

        {/* Top section */}
        <div className="grid grid-cols-3 gap-2 sm:gap-8 lg:gap-12">

          {/* About */}
          <div className="col-span-1 space-y-1.5 sm:space-y-2">
            <h3 className="text-[9px] sm:text-[10px] font-bold uppercase tracking-[0.1em] sm:tracking-[0.15em] text-gray-400">
              About
            </h3>
            <div className="flex items-center gap-1.5 sm:gap-2.5">
              <div className="w-5 h-5 sm:w-7 sm:h-7 rounded sm:rounded-lg bg-blue-500/10 border border-blue-500/20 flex items-center justify-center text-blue-400 shrink-0">
                <FaInfoCircle className="w-2.5 h-2.5 sm:w-3 sm:h-3" />
              </div>
              {/* Using Link ensures this works from ANY page in your app */}
              <Link
                to="/about"
                className="text-gray-500 hover:text-blue-400 text-[9px] min-[375px]:text-[10px] sm:text-sm text-left leading-none transition-colors duration-200"
              >
                <span className="sm:hidden">Lost &amp; Found</span>
                <span className="hidden sm:inline">SAS Lost &amp; Found Management System</span>
              </Link>
            </div>
          </div>

          {/* Contact */}
          <div className="col-span-1 space-y-1.5 sm:space-y-2">
            <h3 className="text-[9px] sm:text-[10px] font-bold uppercase tracking-[0.1em] sm:tracking-[0.15em] text-gray-400 text-center">
              Contact Us
            </h3>
            <div className="flex items-center justify-center gap-1.5 sm:gap-2.5">
              <div className="w-5 h-5 sm:w-7 sm:h-7 rounded sm:rounded-lg bg-blue-500/10 border border-blue-500/20 flex items-center justify-center text-blue-400 shrink-0">
                <FaEnvelope className="w-2.5 h-2.5 sm:w-3 sm:h-3" />
              </div>
              <p className="text-gray-500 text-[9px] min-[375px]:text-[10px] sm:text-sm leading-none break-all sm:break-normal">
                sas@nbsc.edu.ph
              </p>
            </div>
          </div>

          {/* Follow Us */}
          <div className="col-span-1 space-y-1.5 sm:space-y-2">
            <h3 className="text-[9px] sm:text-[10px] font-bold uppercase tracking-[0.1em] sm:tracking-[0.15em] text-gray-400 text-right">
              Follow Us
            </h3>
            <div className="flex items-center justify-end gap-1.5 sm:gap-2.5">
              <div className="w-5 h-5 sm:w-7 sm:h-7 rounded sm:rounded-lg bg-blue-500/10 border border-blue-500/20 flex items-center justify-center text-blue-400 shrink-0">
                <FaFacebook className="w-2.5 h-2.5 sm:w-3 sm:h-3" />
              </div>
              <a
                href="https://www.facebook.com/nbscstudentaffairsandservices"
                target="_blank"
                rel="noopener noreferrer"
                className="text-gray-500 hover:text-blue-400 text-[9px] min-[375px]:text-[10px] sm:text-sm leading-none transition-colors duration-200"
              >
                <span className="sm:hidden">Facebook</span>
                <span className="hidden sm:inline">SAS Official Facebook Page</span>
              </a>
            </div>
          </div>

        </div>

        {/* Divider */}
        <div className="mt-5 mb-4 sm:mt-10 sm:mb-6 border-t border-gray-800/60" />

        {/* Bottom bar — stacked + centered on mobile, side-by-side on desktop */}
        <div className="flex flex-col items-center gap-1 text-center sm:flex-row sm:justify-between sm:text-left sm:gap-0">

          {/* Copyright */}
          <p className="text-gray-500 text-[9px] sm:text-xs">
            {/* Mobile */}
            <span className="sm:hidden">
              © 2026 <span className="font-semibold text-gray-400">NBSC SAS.</span> All Rights Reserved.
            </span>
            {/* Desktop */}
            <span className="hidden sm:inline">
              © 2026 <span className="font-semibold text-gray-400">SAS Lost &amp; Found Management System.</span> All Rights Reserved.
            </span>
          </p>

          {/* Note */}
          <p className="text-gray-600 text-[9px] sm:text-xs">
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