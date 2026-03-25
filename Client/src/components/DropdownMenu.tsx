import React, { useState, useRef, useEffect } from 'react';
import { LuChevronDown } from 'react-icons/lu';

interface MenuItemProps {
  label: string;
  icon: React.ReactNode;
  onClick?: () => void;
  disabled?: boolean;
  shortcut?: string;
}

export const MenuItem: React.FC<MenuItemProps> = ({ label, icon, onClick, disabled, shortcut }) => (
  <button 
    onClick={onClick}
    disabled={disabled}
    className={`w-full flex items-center justify-between px-4 py-2 text-sm transition-colors ${disabled ? 'opacity-30 cursor-not-allowed' : 'hover:bg-gray-100 dark:hover:bg-white/5 cursor-pointer text-gray-700 dark:text-gray-200'}`}
  >
    <div className="flex items-center gap-3 font-medium">
      <span className="text-gray-400 group-hover:text-blue-500 transition-colors">{icon}</span>
      {label}
    </div>
    {shortcut && <span className="text-[10px] text-gray-400 font-medium uppercase tracking-widest">{shortcut}</span>}
  </button>
);

export const MenuDivider = () => <div className="my-1 border-t border-gray-100 dark:border-white/5" />;

interface DropdownMenuProps {
  label: string;
  icon?: React.ReactNode;
  children: React.ReactNode;
  isOpen: boolean;
  onToggle: () => void;
  onClose: () => void;
}

export const DropdownMenu: React.FC<DropdownMenuProps> = ({ label, icon, children, isOpen, onToggle, onClose }) => {
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(event.target as Node)) {
        onClose();
      }
    };
    if (isOpen) {
      document.addEventListener('mousedown', handleClickOutside);
    }
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [isOpen, onClose]);

  useEffect(() => {
    const handleEsc = (event: KeyboardEvent) => {
      if (event.key === 'Escape') onClose();
    };
    if (isOpen) {
      document.addEventListener('keydown', handleEsc);
    }
    return () => document.removeEventListener('keydown', handleEsc);
  }, [isOpen, onClose]);

  return (
    <div className="relative inline-block" ref={containerRef}>
      <button 
        onClick={onToggle}
        className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-sm font-semibold transition-all ${isOpen ? 'bg-gray-100 dark:bg-white/10 text-blue-500' : 'text-gray-600 dark:text-gray-400 hover:bg-gray-50 dark:hover:bg-white/5 hover:text-gray-900 dark:hover:text-gray-200'}`}
      >
        {icon && <span className="opacity-70">{icon}</span>}
        {label && <span className={icon ? "hidden lg:inline" : ""}>{label}</span>}
        <LuChevronDown size={14} className={`transition-transform duration-200 ${isOpen ? 'rotate-180' : ''}`} />
      </button>
      {isOpen && (
        <div className="absolute top-full left-0 mt-2 w-56 bg-white dark:bg-[#1e1e1e] border border-gray-200 dark:border-white/10 rounded-2xl shadow-[0_10px_40px_rgba(0,0,0,0.12)] py-2 z-[1100] animate-in fade-in slide-in-from-top-2 duration-200">
          {children}
        </div>
      )}
    </div>
  );
};
