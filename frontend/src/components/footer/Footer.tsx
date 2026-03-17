import { FaFacebook, FaEnvelope, FaInfoCircle } from "react-icons/fa";

const Footers = () => {
  return (
    <footer className="bg-gray-950 border-t border-gray-800">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-12">

        <div className="grid grid-cols-1 md:grid-cols-3 gap-10 items-start">

          {/* About */}
          <div>
            <h3 className="text-white font-bold text-xs uppercase tracking-widest mb-5 pb-2 border-b border-gray-800">
              About
            </h3>
            <div className="flex items-center gap-3">
              <div className="w-7 h-7 rounded-lg bg-blue-600/10 border border-blue-600/20 flex items-center justify-center text-blue-400 shrink-0">
                <FaInfoCircle size={11} />
              </div>
              <p className="text-gray-500 text-sm">SAS Lost & Found Management System</p>
            </div>
          </div>

          {/* Contact */}
          <div>
            <h3 className="text-white font-bold text-xs uppercase tracking-widest mb-5 pb-2 border-b border-gray-800">
              Contact Us
            </h3>
            <div className="flex items-center gap-3">
              <div className="w-7 h-7 rounded-lg bg-blue-600/10 border border-blue-600/20 flex items-center justify-center text-blue-400 shrink-0">
                <FaEnvelope size={11} />
              </div>
              <p className="text-gray-500 text-sm">sas@nbsc.edu.ph</p>
            </div>
          </div>

          {/* Follow Us */}
          <div>
            <h3 className="text-white font-bold text-xs uppercase tracking-widest mb-5 pb-2 border-b border-gray-800">
              Follow Us
            </h3>
            <div className="flex items-center gap-3">
              <div className="w-7 h-7 rounded-lg bg-blue-600/10 border border-blue-600/20 flex items-center justify-center text-blue-400 shrink-0">
                <FaFacebook size={11} />
              </div>
              <a href="#" className="text-gray-500 hover:text-white text-sm transition-colors duration-200">
                SAS Official Facebook Page
              </a>
            </div>
          </div>

        </div>

        <hr className="border-gray-800 my-8" />

        <div className="flex flex-col sm:flex-row items-center justify-between gap-3">
          <p className="text-gray-600 text-xs">
            © 2025 <span className="text-gray-500 font-medium">SAS Lost & Found Management System.</span> All Rights Reserved.
          </p>
          <p className="text-gray-700 text-xs">
            For item concerns, visit the SAS Office during school hours.
          </p>
        </div>

      </div>
    </footer>
  );
};

export default Footers;