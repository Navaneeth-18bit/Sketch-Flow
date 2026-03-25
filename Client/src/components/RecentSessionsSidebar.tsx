import React, { useEffect, useState } from "react";
import axios from "axios";
import { MessageSquarePlus, MessageSquare, ChevronLeft, ChevronRight } from "lucide-react";
import { auth } from "../utils/firebase";

interface Session {
    session_id: string;
    title: string;
    created_at: string;
}

interface SidebarProps {
    activeSessionId: string | null;
    onSelectSession: (id: string) => void;
    onNewSession: () => void;
}

export default function RecentSessionsSidebar({
    activeSessionId,
    onSelectSession,
    onNewSession
}: SidebarProps) {
    const [sessions, setSessions] = useState<Session[]>([]);
    const [isCollapsed, setIsCollapsed] = useState(false);

    useEffect(() => {
        fetchSessions();
    }, [activeSessionId]);

    const fetchSessions = async () => {
        try {
            const token = await auth.currentUser?.getIdToken();
            if (!token) return;
            const res = await axios.get("http://localhost:5000/api/sessions/list", {
                headers: { Authorization: `Bearer ${token}` }
            });
            setSessions(res.data);
        } catch (error) {
            console.error("Failed to fetch sessions", error);
        }
    };

    return (
        <div className={`bg-white/95 dark:bg-[#1e1e1e]/95 backdrop-blur-md border-r border-gray-200/70 dark:border-[#303030] flex flex-col h-full transition-all duration-300 ease-in-out z-10 shrink-0 hidden md:flex shadow-2xl ${isCollapsed ? "w-[72px]" : "w-52 lg:w-64"}`}>
            <div className={`p-4 border-b border-gray-200 dark:border-[#303030] flex items-center transition-all ${isCollapsed ? "flex-col gap-3 justify-center" : "justify-between"}`}>
                <button
                    onClick={onNewSession}
                    title="New Session"
                    className={`flex items-center justify-center bg-blue-600 hover:bg-blue-700 text-white font-bold rounded-xl transition-all shadow-[0_2px_10px_rgba(37,99,235,0.2)] ${isCollapsed ? "w-10 h-10 p-0" : "flex-1 py-2 px-4 gap-2 mr-2"}`}
                >
                    <MessageSquarePlus size={18} />
                    {!isCollapsed && <span className="truncate">New Session</span>}
                </button>
                <button
                    onClick={() => setIsCollapsed(!isCollapsed)}
                    title={isCollapsed ? "Expand Sidebar" : "Collapse Sidebar"}
                    className="p-1.5 text-gray-400 hover:text-gray-600 dark:hover:text-gray-200 hover:bg-gray-100 dark:hover:bg-[#2a2a2a] rounded-lg transition-colors"
                >
                    {isCollapsed ? <ChevronRight size={18} /> : <ChevronLeft size={18} />}
                </button>
            </div>

            <div className={`flex-1 overflow-y-auto ${isCollapsed ? "p-2 space-y-2" : "p-3 space-y-1"} scrollbar-thin scrollbar-thumb-gray-300 dark:scrollbar-thumb-gray-600`}>
                {!isCollapsed && <h3 className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-2 px-2">Recent Sessions</h3>}
                {sessions.map(session => (
                    <button
                        key={session.session_id}
                        onClick={() => onSelectSession(session.session_id)}
                        title={isCollapsed ? session.title : undefined}
                        className={`w-full flex items-center transition-all rounded-lg group ${isCollapsed ? "justify-center p-3 h-10 w-10 mx-auto" : "gap-2 px-3 py-2"} ${activeSessionId === session.session_id
                            ? "bg-blue-50 dark:bg-blue-500/10 text-blue-700 dark:text-blue-400 font-medium"
                            : "text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-[#2a2a2a]"
                            }`}
                    >
                        <MessageSquare size={16} className={`shrink-0 ${activeSessionId === session.session_id ? "opacity-100" : "opacity-70 group-hover:opacity-100"}`} />
                        {!isCollapsed && <span className="truncate text-sm">{session.title}</span>}
                    </button>
                ))}
                {sessions.length === 0 && !isCollapsed && (
                    <div className="text-xs text-gray-400 px-2 py-4 text-center">No recent sessions</div>
                )}
            </div>
        </div>
    );
}
