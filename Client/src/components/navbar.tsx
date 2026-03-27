import React, { useContext, useState, useRef, useEffect } from "react";
import { Bell, Settings, User, PenTool, LogOut, Moon, Sun } from "lucide-react";
import { 
  LuFile, LuPenLine as LuFileEdit, LuMonitor, LuPlus, LuSettings2, 
  LuSave, LuDownload, LuUndo2, LuRedo2, 
  LuCopy, LuClipboard, LuTrash2, LuLayoutGrid,
  LuMaximize, LuZoomIn, LuZoomOut, LuSquare, LuCircle,
  LuArrowRight, LuPenTool, LuType, LuImage, LuStickyNote,
  LuLayers, LuGroup, LuUngroup, LuHistory
} from 'react-icons/lu';
import { ThemeContext } from "../contexts/ThemeContext.jsx";
import { auth } from "../utils/firebase";
import { signOut } from "firebase/auth";
import Tooltip from "./Tooltip";
import { DropdownMenu, MenuItem, MenuDivider } from "./DropdownMenu";

interface NavbarProps {
  user?: any;
  role?: string | null;
  appMode: 'single' | 'pages';
  onToggleMode: () => void;
  // Canvas Actions
  onUndo: () => void;
  onRedo: () => void;
  onDelete: () => void;
  onCopy: () => void;
  onPaste: () => void;
  onExportPNG: () => void;
  onExportPDF?: () => void;
  onInsertShape: (type: string) => void;
  onAddPage?: () => void;
  onDuplicatePage?: () => void;
  onDeletePage?: () => void;
  canUndo: boolean;
  canRedo: boolean;
  hasSelection: boolean;
  onZoomIn: () => void;
  onZoomOut: () => void;
  onToggleGrid: () => void;
  recentDiagrams?: any[];
  onSelectRecentDiagram?: (diagram: any) => void;
}

const Navbar: React.FC<NavbarProps> = (props) => {
  const { isDark, toggleTheme } = useContext(ThemeContext);
  const [activeMenu, setActiveMenu] = useState<string | null>(null);
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);
  const rootRef = useRef<HTMLDivElement | null>(null);

  const handleLogout = async () => {
    try {
      await signOut(auth);
    } catch (error) {
      console.error("Logout failed:", error);
    }
  };

  const toggleMenu = (menu: string) => {
    setActiveMenu(activeMenu === menu ? null : menu);
  };

  return (
    <header className="w-full h-[60px] bg-white dark:bg-[#121212] border-b border-gray-200 dark:border-white/5 shadow-sm flex items-center justify-between px-2 sm:px-4 transition-colors z-[1000] relative">
      {/* Left Section: Logo + Menus */}
      <div className="flex items-center gap-1">
        <div className="flex items-center gap-2 mr-4 group cursor-pointer">
          <div className="bg-blue-600 dark:bg-blue-500 text-white p-2 rounded-xl shadow-lg shadow-blue-500/20 transition-transform group-hover:scale-110">
            <PenTool size={18} />
          </div>
          <h1 className="text-base font-bold tracking-tight text-gray-900 dark:text-white hidden lg:block">SketchFlow</h1>
        </div>

        <div className="h-6 w-px bg-gray-200 dark:bg-white/10 mx-1 sm:mx-2" />

        <div className="flex items-center gap-0.5">
          <DropdownMenu 
            label="File" 
            icon={<LuFile size={16} />}
            isOpen={activeMenu === 'file'} 
            onToggle={() => toggleMenu('file')} 
            onClose={() => setActiveMenu(null)}
          >
            <MenuItem label="New Canvas" icon={<LuPlus size={16} />} />
            <MenuItem label="Save" icon={<LuSave size={16} />} shortcut="Ctrl+S" />
            <MenuDivider />
            <MenuItem label="Export as PNG" icon={<LuDownload size={16} />} onClick={props.onExportPNG} />
            {props.appMode === 'pages' && (
              <MenuItem label="Export as PDF" icon={<LuFile size={16} />} onClick={props.onExportPDF} />
            )}
          </DropdownMenu>

          <DropdownMenu 
            label="Edit" 
            icon={<LuFileEdit size={16} />}
            isOpen={activeMenu === 'edit'} 
            onToggle={() => toggleMenu('edit')} 
            onClose={() => setActiveMenu(null)}
          >
            <MenuItem label="Undo" icon={<LuUndo2 size={16} />} onClick={props.onUndo} disabled={!props.canUndo} shortcut="Ctrl+Z" />
            <MenuItem label="Redo" icon={<LuRedo2 size={16} />} onClick={props.onRedo} disabled={!props.canRedo} shortcut="Ctrl+Y" />
            <MenuDivider />
            <MenuItem label="Copy" icon={<LuCopy size={16} />} onClick={props.onCopy} disabled={!props.hasSelection} shortcut="Ctrl+C" />
            <MenuItem label="Paste" icon={<LuClipboard size={16} />} onClick={props.onPaste} shortcut="Ctrl+V" />
            <MenuDivider />
            <MenuItem label="Delete" icon={<LuTrash2 size={16} />} onClick={props.onDelete} disabled={!props.hasSelection} shortcut="Del" />
          </DropdownMenu>

          <DropdownMenu 
            label="View" 
            icon={<LuMonitor size={16} />}
            isOpen={activeMenu === 'view'} 
            onToggle={() => toggleMenu('view')} 
            onClose={() => setActiveMenu(null)}
          >
            <MenuItem label="Zoom In" icon={<LuZoomIn size={16} />} onClick={props.onZoomIn} />
            <MenuItem label="Zoom Out" icon={<LuZoomOut size={16} />} onClick={props.onZoomOut} />
            <MenuDivider />
            <MenuItem label="Toggle Grid" icon={<LuLayoutGrid size={16} />} onClick={props.onToggleGrid} />
            <MenuItem label="Fullscreen" icon={<LuMonitor size={16} />} />
          </DropdownMenu>

          <DropdownMenu 
            label="Insert" 
            icon={<LuPlus size={16} />}
            isOpen={activeMenu === 'insert'} 
            onToggle={() => toggleMenu('insert')} 
            onClose={() => setActiveMenu(null)}
          >
            <MenuItem label="Rectangle" icon={<LuSquare size={16} />} onClick={() => props.onInsertShape('RECTANGLE')} />
            <MenuItem label="Circle" icon={<LuCircle size={16} />} onClick={() => props.onInsertShape('CIRCLE')} />
            <MenuItem label="Arrow" icon={<LuArrowRight size={16} />} onClick={() => props.onInsertShape('ARROW')} />
            <MenuItem label="Line" icon={<LuPenTool size={16} />} onClick={() => props.onInsertShape('SCRIBBLE')} />
            <MenuDivider />
            <MenuItem label="Text" icon={<LuType size={16} />} onClick={() => props.onInsertShape('TEXT')} />
            <MenuItem label="Image" icon={<LuImage size={16} />} />
          </DropdownMenu>

          <DropdownMenu 
            label="Tools" 
            icon={<LuSettings2 size={16} />}
            isOpen={activeMenu === 'tools'} 
            onToggle={() => toggleMenu('tools')} 
            onClose={() => setActiveMenu(null)}
          >
            <MenuItem label="Bring Forward" icon={<LuLayers size={16} />} />
            <MenuItem label="Send Backward" icon={<LuLayers size={16} />} />
            <MenuDivider />
            <MenuItem label="Group" icon={<LuGroup size={16} />} />
            <MenuItem label="Ungroup" icon={<LuUngroup size={16} />} />
          </DropdownMenu>
          
          <DropdownMenu 
            label="Recent" 
            icon={<LuHistory size={16} />}
            isOpen={activeMenu === 'recent'} 
            onToggle={() => toggleMenu('recent')} 
            onClose={() => setActiveMenu(null)}
          >
            {props.recentDiagrams && props.recentDiagrams.length > 0 ? (
              props.recentDiagrams.map((d) => (
                <MenuItem 
                  key={d.id} 
                  label={`Analyzed ${new Date(d.createdAt).toLocaleDateString()}`} 
                  icon={<LuFile size={16} />}
                  onClick={() => props.onSelectRecentDiagram?.(d)}
                />
              ))
            ) : (
              <div className="px-4 py-2 text-xs text-gray-500 italic">No recent diagrams</div>
            )}
          </DropdownMenu>

          {props.appMode === 'pages' && (
            <DropdownMenu 
              label="Pages" 
              icon={<LuLayoutGrid size={16} />}
              isOpen={activeMenu === 'pages'} 
              onToggle={() => toggleMenu('pages')} 
              onClose={() => setActiveMenu(null)}
            >
              <MenuItem label="Add Page" icon={<LuPlus size={16} />} onClick={props.onAddPage} />
              <MenuItem label="Duplicate Page" icon={<LuCopy size={16} />} onClick={props.onDuplicatePage} />
              <MenuItem label="Delete Page" icon={<LuTrash2 size={16} />} onClick={props.onDeletePage} />
            </DropdownMenu>
          )}
        </div>
      </div>

      {/* Right Section: Mode Toggle + Settings */}
      <div className="flex items-center gap-4">
        {/* Mode Toggle */}
        <div className="flex items-center gap-1.5 p-1 bg-gray-100 dark:bg-white/5 rounded-xl border border-gray-200 dark:border-white/10 ml-2">
          <button 
            onClick={() => props.appMode !== 'single' && props.onToggleMode()}
            className={`px-3 py-1 rounded-lg text-[10px] font-bold transition-all ${props.appMode === 'single' ? 'bg-white dark:bg-white/10 text-blue-500 shadow-sm shadow-black/5' : 'text-gray-500'}`}
          >
            SINGLE
          </button>
          <button 
            onClick={() => props.appMode !== 'pages' && props.onToggleMode()}
            className={`px-3 py-1 rounded-lg text-[10px] font-bold transition-all ${props.appMode === 'pages' ? 'bg-white dark:bg-white/10 text-blue-500 shadow-sm shadow-black/5' : 'text-gray-500'}`}
          >
            PAGES
          </button>
        </div>

        <div className="h-6 w-px bg-gray-200 dark:bg-white/10 mx-0.5 sm:mx-1" />

        <div className="flex items-center gap-2">
          <Tooltip text="Theme" position="bottom">
            <button className="p-2 hover:bg-gray-100 dark:hover:bg-white/5 rounded-lg text-gray-500 transition-colors" onClick={() => toggleTheme()}>
              {isDark ? <Sun size={18} /> : <Moon size={18} />}
            </button>
          </Tooltip>

          <Tooltip text="Notifications" position="bottom">
            <button className="p-2 hover:bg-gray-100 dark:hover:bg-white/5 rounded-lg text-gray-500 transition-colors">
              <Bell size={18} />
            </button>
          </Tooltip>

          <div className="relative" ref={rootRef}>
            <Tooltip text="Settings" position="bottom">
              <button
                className={`p-2 rounded-lg transition-colors ${isSettingsOpen ? 'bg-gray-100 dark:bg-white/10 text-blue-500' : 'text-gray-500 hover:bg-gray-100 dark:hover:bg-white/5'}`}
                onClick={() => setIsSettingsOpen(!isSettingsOpen)}
              >
                <Settings size={18} />
              </button>
            </Tooltip>

            {isSettingsOpen && (
              <div className="absolute right-0 mt-2 w-56 bg-white dark:bg-[#1e1e1e] border border-gray-200 dark:border-white/10 rounded-2xl shadow-2xl py-2 z-50 animate-in fade-in slide-in-from-top-2 duration-200">
                <div className="px-4 py-2 border-b border-gray-100 dark:border-white/5 mb-1">
                  <div className="text-xs font-bold text-gray-400 uppercase tracking-widest">Account</div>
                  <div className="text-sm font-medium text-gray-900 dark:text-white truncate">{props.user?.email}</div>
                </div>
                <MenuItem label="Settings" icon={<Settings size={16} />} />
                <MenuItem label="Profile" icon={<User size={16} />} />
                <MenuDivider />
                <MenuItem label="Logout" icon={<LogOut size={16} />} onClick={handleLogout} />
              </div>
            )}
          </div>
        </div>
      </div>
    </header>
  );
};

export default Navbar;
