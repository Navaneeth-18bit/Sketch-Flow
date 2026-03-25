import React, { useState } from 'react';
import { 
  LuPlus, LuCopy, LuTrash2, 
  LuChevronLeft, LuChevronRight, LuType
} from 'react-icons/lu';

interface Page {
  id: string;
  name: string;
}

interface PagesSidebarProps {
  pages: Page[];
  currentPageId: string | null;
  onSelectPage: (id: string) => void;
  onAddPage: () => void;
  onDeletePage: (id: string) => void;
  onDuplicatePage: (id: string) => void;
  onRenamePage: (id: string, newName: string) => void;
}

export default function PagesSidebar(props: PagesSidebarProps) {
  const [isCollapsed, setIsCollapsed] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editValue, setEditValue] = useState("");

  const handleStartRename = (page: Page) => {
    setEditingId(page.id);
    setEditValue(page.name);
  };

  const handleFinishRename = (id: string) => {
    if (editValue.trim()) {
      props.onRenamePage(id, editValue.trim());
    }
    setEditingId(null);
  };

  if (isCollapsed) {
    return (
      <div className="absolute top-0 left-0 bottom-0 w-12 bg-white dark:bg-[#121212] border-r border-gray-200 dark:border-white/5 z-40 flex flex-col items-center py-4 gap-4">
        <button onClick={() => setIsCollapsed(false)} className="p-2 hover:bg-gray-100 dark:hover:bg-white/5 rounded-lg text-gray-400">
          <LuChevronRight size={18} />
        </button>
        <div className="w-px h-full bg-gray-100 dark:bg-white/5" />
      </div>
    );
  }

  return (
    <div className={`absolute top-0 left-0 bottom-0 transition-all duration-300 ${isCollapsed ? 'w-12' : 'w-48 sm:w-64'} bg-white dark:bg-[#121212] border-r border-gray-200 dark:border-white/5 z-40 flex flex-col animate-in slide-in-from-left duration-300`}>
      <div className="p-4 flex items-center justify-between border-b border-gray-100 dark:border-white/5">
        <h3 className="text-xs font-bold uppercase tracking-wider text-gray-400">Pages</h3>
        <div className="flex items-center gap-1">
          <button onClick={props.onAddPage} className="p-1.5 hover:bg-gray-100 dark:hover:bg-white/5 rounded-lg text-blue-500 transition-colors" title="Add Page">
            <LuPlus size={16} />
          </button>
          <button onClick={() => setIsCollapsed(true)} className="p-1.5 hover:bg-gray-100 dark:hover:bg-white/5 rounded-lg text-gray-400 transition-colors">
            <LuChevronLeft size={16} />
          </button>
        </div>
      </div>

      <div className="flex-1 overflow-y-auto p-2 flex flex-col gap-1 custom-scrollbar">
        {props.pages.map((page, index) => {
          const isActive = page.id === props.currentPageId;
          return (
            <div 
              key={page.id}
              className={`group relative flex items-center gap-2 p-2 rounded-xl transition-all ${isActive ? 'bg-blue-50 dark:bg-blue-500/10 text-blue-600 dark:text-blue-400 ring-1 ring-blue-500/20' : 'hover:bg-gray-50 dark:hover:bg-white/5 text-gray-500'}`}
            >
              
              <div className="flex-1 min-w-0" onClick={() => props.onSelectPage(page.id)}>
                {editingId === page.id ? (
                  <input 
                    autoFocus
                    value={editValue}
                    onChange={(e) => setEditValue(e.target.value)}
                    onBlur={() => handleFinishRename(page.id)}
                    onKeyDown={(e) => e.key === 'Enter' && handleFinishRename(page.id)}
                    className="w-full bg-white dark:bg-black/20 border border-blue-500 rounded px-1 py-0.5 text-sm outline-none"
                  />
                ) : (
                  <div className="flex flex-col">
                    <span className="text-xs font-bold opacity-30 leading-none mb-0.5">{index + 1}</span>
                    <span className="text-sm font-medium truncate">{page.name}</span>
                  </div>
                )}
              </div>

              <div className="flex items-center gap-0.5 opacity-0 group-hover:opacity-100 transition-opacity">
                <button onClick={() => handleStartRename(page)} className="p-1 hover:bg-blue-100 dark:hover:bg-blue-500/20 rounded text-blue-500" title="Rename">
                  <LuType size={14} />
                </button>
                <button onClick={() => props.onDuplicatePage(page.id)} className="p-1 hover:bg-blue-100 dark:hover:bg-blue-500/20 rounded text-blue-500" title="Duplicate">
                  <LuCopy size={14} />
                </button>
                <button 
                  onClick={() => props.onDeletePage(page.id)} 
                  disabled={props.pages.length <= 1}
                  className="p-1 hover:bg-red-100 dark:hover:bg-red-500/20 rounded text-red-500 disabled:opacity-30" 
                  title="Delete"
                >
                  <LuTrash2 size={14} />
                </button>
              </div>
            </div>
          );
        })}
      </div>

      <div className="p-4 border-t border-gray-100 dark:border-white/5 bg-gray-50/50 dark:bg-white/[0.02]">
        <div className="flex items-center justify-between text-[10px] font-bold text-gray-400 uppercase tracking-widest">
          <span>Total Pages</span>
          <span>{props.pages.length}</span>
        </div>
      </div>
    </div>
  );
}
