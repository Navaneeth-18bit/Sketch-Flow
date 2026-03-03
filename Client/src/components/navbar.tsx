import { Bell, Settings, User, PenTool } from "lucide-react";

const Navbar = () => {
  return (
    <header className="w-full h-16 bg-white border-b shadow-sm flex items-center justify-between px-6">
      
      {/* Left Section */}
      <div className="flex items-center gap-3">
        <div className="bg-blue-500 text-white p-2 rounded-lg">
          <PenTool size={20} />
        </div>
        <h1 className="text-lg font-semibold text-gray-800">
          SketchFlow
        </h1>
      </div>

      {/* Right Section */}
      <div className="flex items-center gap-6 text-gray-600">
        <button className="hover:text-blue-500 transition">
          <Bell size={20} />
        </button>

        <button className="hover:text-blue-500 transition">
          <Settings size={20} />
        </button>

        <button className="hover:text-blue-500 transition">
          <User size={20} />
        </button>
      </div>

    </header>
  );
};

export default Navbar;