import { Bell, Settings, User, PenTool } from "lucide-react";
import { useState, useRef, useEffect } from "react";
import { useTheme } from "../context/ThemeContext";

const Navbar = () => {
  const [settingsOpen, setSettingsOpen] = useState(false);
  const settingsRef = useRef<HTMLDivElement>(null);
  const { theme, toggleTheme } = useTheme();

  // close dropdown when clicking outside
  useEffect(() => {
    const handleClick = (e: MouseEvent) => {
      if (
        settingsRef.current &&
        !settingsRef.current.contains(e.target as Node)
      ) {
        setSettingsOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClick);
    return () => document.removeEventListener("mousedown", handleClick);
  }, []);

  return (
    <header className="w-full h-16 bg-white dark:bg-[#202020] border-b dark:border-gray-700 shadow-sm flex items-center justify-between px-6">
      {/* Left Section */}
      <div className="flex items-center gap-3">
        <div className="bg-blue-500 text-white p-2 rounded-lg">
          <PenTool size={20} />
        </div>
        <h1 className="text-lg font-semibold text-gray-800 dark:text-gray-100">
          SketchFlow
        </h1>
      </div>

      {/* Right Section */}
      <div
        className="flex items-center gap-6 text-gray-600 dark:text-gray-300 relative"
        ref={settingsRef}
      >
        <button className="hover:text-blue-500 transition">
          <Bell size={20} />
        </button>

        <button
          className="hover:text-blue-500 transition relative"
          onClick={() => setSettingsOpen((o) => !o)}
        >
          <Settings size={20} />
        </button>

        {settingsOpen && (
          <div className="absolute right-0 mt-2 w-40 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg shadow-lg z-50">
            <div className="px-4 py-2 flex items-center justify-between">
              <span className="text-sm text-gray-700 dark:text-gray-200">
                Dark Mode
              </span>
              <label className="inline-flex items-center cursor-pointer">
                <input
                  type="checkbox"
                  className="form-checkbox h-4 w-4 text-blue-600"
                  checked={theme === "dark"}
                  onChange={toggleTheme}
                />
              </label>
            </div>
          </div>
        )}

        <button className="hover:text-blue-500 transition">
          <User size={20} />
        </button>
      </div>
    </header>
  );
};

export default Navbar;
