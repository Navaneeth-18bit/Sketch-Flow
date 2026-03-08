import { Bell, Settings, User, PenTool, LogOut } from "lucide-react";
import { useContext, useState, useRef, useEffect } from "react";
import { ThemeContext } from "../contexts/ThemeContext.jsx";
import { auth } from "../utils/firebase";
import { signOut } from "firebase/auth";
import Tooltip from "./Tooltip";

interface NavbarProps {
  user?: any;
  role?: string | null;
}

const Navbar: React.FC<NavbarProps> = ({ user, role }) => {
  const { isDark, toggleTheme } = useContext(ThemeContext);
  const [open, setOpen] = useState(false);
  const rootRef = useRef<HTMLDivElement | null>(null);

  const handleLogout = async () => {
    try {
      await signOut(auth);
    } catch (error) {
      console.error("Logout failed:", error);
    }
  };

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
    <header className="w-full h-16 bg-white dark:bg-[#1e1e1e] border-b border-gray-200 dark:border-[#303030] shadow-sm dark:shadow-none flex items-center justify-between px-6 transition-colors">
      {/* Left Section */}
      <div className="flex items-center gap-3">
        <div className="bg-blue-600 dark:bg-blue-500 text-white p-2.5 rounded-xl shadow-md shadow-blue-500/20">
          <PenTool size={20} />
        </div>
        <div>
          <h1 className="text-lg font-bold text-gray-800 dark:text-gray-100">SketchFlow</h1>
          {role && (
            <span className="text-[10px] uppercase tracking-wider font-bold text-blue-600 dark:text-blue-400 px-2 py-0.5 bg-blue-50 dark:bg-blue-500/10 rounded border border-blue-100 dark:border-blue-500/20">
              {role}
            </span>
          )}
        </div>
      </div>

      {/* Right Section */}
      <div
        className="flex items-center gap-6 text-gray-600 dark:text-gray-400 relative"
        ref={rootRef}
      >
        {user && (
          <div className="hidden md:block text-right">
            <div className="text-sm font-medium text-gray-700 dark:text-gray-300">{user.email}</div>
          </div>
        )}

        <Tooltip text="Notifications" position="bottom">
          <button className="p-2 hover:bg-gray-100 dark:hover:bg-[#2a2a2a] rounded-full hover:text-blue-500 dark:hover:text-blue-400 transition" aria-label="Notifications">
            <Bell size={20} />
          </button>
        </Tooltip>

        <div className="relative">
          <Tooltip text="Settings" position="bottom">
            <button
              className="p-2 hover:bg-gray-100 dark:hover:bg-[#2a2a2a] rounded-full hover:text-blue-500 dark:hover:text-blue-400 transition"
              onClick={(e) => {
                e.stopPropagation();
                setOpen((s) => !s);
              }}
              aria-expanded={open}
              aria-haspopup="true"
              aria-label="Settings"
            >
              <Settings size={20} />
            </button>
          </Tooltip>

          {open && (
            <div className="absolute right-0 mt-2 w-56 bg-white dark:bg-[#252525] border border-gray-200 dark:border-[#333] rounded-xl shadow-lg p-3 z-50 transition-colors">
              <div className="flex items-center justify-between mb-2">
                <div>
                  <div className="text-sm font-semibold text-gray-800 dark:text-gray-200">
                    Appearance
                  </div>
                  <div className="text-xs text-gray-500 dark:text-gray-400">Theme and display</div>
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
                      className={`w-11 h-6 rounded-full p-1 transition-colors ${isDark ? "bg-blue-600" : "bg-gray-300"}`}
                    >
                      <div
                        className={`bg-white w-4 h-4 rounded-full shadow-md transform transition-transform ${isDark ? "translate-x-5" : ""}`}
                      />
                    </div>
                  </label>
                </div>
              </div>

              <div className="mt-2 text-sm text-gray-600 dark:text-gray-400 border-t border-gray-100 dark:border-[#333] pt-2">
                <button
                  onClick={handleLogout}
                  className="flex items-center gap-2 text-red-500 hover:text-red-600 hover:bg-red-50 dark:hover:bg-red-500/10 p-2 rounded-lg transition-colors w-full"
                >
                  <LogOut size={16} />
                  <span className="font-medium">Logout</span>
                </button>
              </div>
            </div>
          )}
        </div>

        <Tooltip text="Profile" position="bottom">
          <button className="p-2 hover:bg-gray-100 dark:hover:bg-[#2a2a2a] rounded-full hover:text-blue-500 dark:hover:text-blue-400 transition" aria-label="Profile">
            <User size={20} />
          </button>
        </Tooltip>
      </div>
    </header>
  );
};

export default Navbar;
