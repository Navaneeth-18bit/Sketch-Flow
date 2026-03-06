import { Bell, Settings, User, PenTool } from "lucide-react";
import { useContext, useState, useRef, useEffect } from "react";
import Tippy from '@tippyjs/react';
import 'tippy.js/dist/tippy.css';
import Modal from 'react-modal';
import { ThemeContext } from "../contexts/ThemeContext.jsx";

const Navbar = () => {
  const { isDark, toggleTheme } = useContext(ThemeContext);
  const [open, setOpen] = useState(false);
  const rootRef = useRef<HTMLDivElement | null>(null);
    const [modalOpen, setModalOpen] = useState(false);

  useEffect(() => {
    const handle = (e: MouseEvent) => {
      if (rootRef.current && !rootRef.current.contains(e.target as Node)) {
        setOpen(false);
      }
    };
    window.addEventListener("click", handle);
    return () => window.removeEventListener("click", handle);
  }, []);

  return (
    <header className={`w-full h-16 bg-white border-b ${isDark ? "dark:border-[#303030]" : "bg-gray-100"} shadow-sm flex items-center justify-between px-6`}>
      {/* Modal Example */}
      <Modal
        isOpen={modalOpen}
        onRequestClose={() => setModalOpen(false)}
        style={{ overlay: { background: 'rgba(0,0,0,0.3)' }, content: { borderRadius: '12px', padding: '2rem', maxWidth: '400px', margin: 'auto' } }}
        ariaHideApp={false}
      >
        <h2 className="text-lg font-semibold mb-4">User Info</h2>
        <p>This is a modal example for the User button.</p>
        <button className="mt-4 px-4 py-2 bg-blue-500 text-white rounded" onClick={() => setModalOpen(false)}>Close</button>
      </Modal>
      {/* Left Section */}
      <div className="flex items-center gap-3">
        <div className="bg-blue-500 text-white p-2 rounded-lg">
          <PenTool size={20} />
        </div>
        <h1 className="text-lg font-semibold text-gray-800">SketchFlow</h1>
      </div>

      {/* Right Section */}
      <div
        className="flex items-center gap-6 text-gray-600 relative"
        ref={rootRef}
      >
        <button className="hover:text-blue-500 transition">
          <Tippy content="Notifications" placement="bottom">
            <span><Bell size={20} /></span>
          </Tippy>
        </button>

        <div className="relative">
          <button
            className="hover:text-blue-500 transition"
            onClick={(e) => {
              e.stopPropagation();
              setOpen((s) => !s);
            }}
            aria-expanded={open}
            aria-haspopup="true"
          >
            <Tippy content="Settings" placement="bottom">
              <span><Settings size={20} /></span>
            </Tippy>
          </button>

          {open && (
            <div className="absolute right-0 mt-2 w-48 bg-white border rounded-lg shadow-md p-3 z-50">
              <div className="flex items-center justify-between">
                <div>
                  <div className="text-sm font-medium text-gray-800">
                    Appearance
                  </div>
                  <div className="text-xs text-gray-500">Theme and display</div>
                </div>
                <div className="ml-2">
                  <label className="flex items-center gap-2 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={isDark}
                      onChange={() => toggleTheme()}
                      className="hidden"
                    />
                    <div
                      className={`w-10 h-5 rounded-full p-0.5 transition ${isDark ? "bg-blue-600" : "bg-gray-300 "}`}
                    >
                      <div
                        className={`bg-white w-4 h-4 rounded-full transform transition ${isDark ? "translate-x-5" : ""}`}
                      />
                    </div>
                  </label>
                </div>
              </div>

              <div className="mt-3 text-sm text-gray-600">Dark Mode</div>
            </div>
          )}
        </div>

        <button className="hover:text-blue-500 transition">
          <Tippy content="User Info" placement="bottom">
            <span>
              <button className="hover:text-blue-500 transition" onClick={() => setModalOpen(true)}>
                <User size={20} />
              </button>
            </span>
          </Tippy>
        </button>
      </div>
    </header>
  );
};

export default Navbar;
