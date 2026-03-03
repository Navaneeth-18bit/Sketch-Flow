import { Bell, Settings, User, PenTool } from "lucide-react";
import { useContext, useState, useRef, useEffect } from "react";
import { ThemeContext } from "../contexts/ThemeContext.jsx";

const Navbar = () => {
  const { isDark, toggleTheme } = useContext(ThemeContext);
  const [open, setOpen] = useState(false);
  const rootRef = useRef<HTMLDivElement | null>(null);

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
    <header className="w-full h-16 bg-white border-b shadow-sm flex items-center justify-between px-6">
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
          <Bell size={20} />
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
            <Settings size={20} />
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
                      className={`w-10 h-5 rounded-full p-0.5 transition ${isDark ? "bg-blue-600" : "bg-gray-300"}`}
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
          <User size={20} />
        </button>
      </div>
    </header>
  );
};

export default Navbar;
