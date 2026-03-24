import React, { useContext, useState, useRef, useEffect } from "react";
import Navbar from "./components/navbar.tsx";
import Canvas from "./components/drawing-canvas.tsx";
import ChatWindow from "./components/chat-window.tsx";
import Login from "./components/login.tsx";
import { ThemeContext } from "./contexts/ThemeContext.jsx";
import { auth } from "./utils/firebase";
import { onIdTokenChanged } from "firebase/auth";
import axios from "axios";
import RecentSessionsSidebar from "./components/RecentSessionsSidebar.tsx";
import { MessageCircle, X } from "lucide-react";
import Tooltip from "./components/Tooltip";

function App() {
  const { isDark } = useContext(ThemeContext);
  const [user, setUser] = useState(null);
  const [role, setRole] = useState(null);
  const [loading, setLoading] = useState(true);
  const [activeSessionId, setActiveSessionId] = useState(() => localStorage.getItem("current_session_id"));
  const [isChatOpen, setIsChatOpen] = useState(false);

  const handleNewSession = async () => {
    try {
      const token = await auth.currentUser?.getIdToken();
      if (!token) return;
      const res = await axios.post("http://localhost:5000/api/sessions/create", {
        title: `Session ${new Date().toLocaleDateString()}`
      }, {
        headers: { Authorization: `Bearer ${token}` }
      });
      const newId = res.data.session_id;
      setActiveSessionId(newId);
      localStorage.setItem('current_session_id', newId);
    } catch (error) {
      console.error("Failed to create session", error);
    }
  };

  useEffect(() => {
    if (user && role === "teacher" && !activeSessionId) {
      handleNewSession();
    }
  }, [user, role, activeSessionId]);

  useEffect(() => {
    const unsubscribe = onIdTokenChanged(auth, async (firebaseUser) => {
      if (firebaseUser) {
        // Fetch role from Firebase ID Token (custom claims)
        const tokenResult = await firebaseUser.getIdTokenResult();
        const userRole = tokenResult.claims.role;

        if (userRole) {
          setUser(firebaseUser);
          setRole(userRole);
        } else {
          // Keep user as null so Login component stays rendered for role selection
          setUser(null);
          setRole(null);
        }
      } else {
        setUser(null);
        setRole(null);
      }
      setLoading(false);
    });

    return () => unsubscribe();
  }, []);

  if (loading) {
    return (
      <div className="h-screen flex items-center justify-center bg-gray-50 dark:bg-[#121212] text-gray-600 dark:text-gray-400 font-medium">
        <div className="flex items-center gap-3">
          <div className="w-5 h-5 border-2 border-blue-500/30 border-t-blue-500 rounded-full animate-spin" />
          Loading...
        </div>
      </div>
    );
  }

  if (!user) {
    return <Login />;
  }

  return (
    <div className="h-screen flex flex-col overflow-hidden">
      {/* Navbar */}
      <div className="h-16 shrink-0">
        <Navbar user={user} role={role} />
      </div>

      {/* Main Content — canvas fills full area, panels float on top */}
      <div className="relative flex-1 overflow-hidden">

        {/* Canvas — full-screen background for Teacher / Admin */}
        {(role === 'teacher' || role === 'admin') ? (
          <div className="absolute inset-0">
            <Canvas activeSessionId={activeSessionId} onNewSession={handleNewSession} />
          </div>
        ) : (
          <div className="absolute inset-0 flex items-center justify-center bg-gray-50 dark:bg-[#121212] transition-colors">
            <div className="text-center p-8 bg-white dark:bg-[#1e1e1e] rounded-2xl shadow-lg border border-gray-200 dark:border-[#303030]">
              <h2 className="text-2xl font-bold mb-4 text-gray-800 dark:text-gray-100">Welcome, Student!</h2>
              <p className="text-gray-500 dark:text-gray-400">You can use the AI Chatbot for any doubts.</p>
            </div>
          </div>
        )}

        {/* Floating Sidebar (Teacher only) — left edge */}
        {role === 'teacher' && (
          <div className="absolute left-0 top-0 h-full z-20">
            <RecentSessionsSidebar
              activeSessionId={activeSessionId}
              onSelectSession={(id) => {
                setActiveSessionId(id);
                localStorage.setItem('current_session_id', id);
              }}
              onNewSession={handleNewSession}
            />
          </div>
        )}

        {/* Floating Chat Section */}
        <div className="absolute right-6 bottom-6 z-50 flex flex-col items-end gap-4 pointer-events-none">
          {/* Chat Window Card */}
          {isChatOpen && (
            <div
              className="w-[400px] h-[600px] bg-white dark:bg-[#1e1e1e] border border-gray-200 dark:border-[#333] rounded-3xl shadow-[0_20px_50px_rgba(0,0,0,0.15)] dark:shadow-[0_20px_50px_rgba(0,0,0,0.5)] overflow-hidden flex flex-col pointer-events-auto animate-in fade-in zoom-in slide-in-from-bottom-10 duration-300"
            >
              <div className="flex-1 overflow-hidden relative">
                <ChatWindow activeSessionId={activeSessionId} />
                {/* Close button inside chat header area if needed, or top right */}
                <button
                  onClick={() => setIsChatOpen(false)}
                  className="absolute top-4 right-4 p-1.5 hover:bg-gray-100 dark:hover:bg-white/10 rounded-lg text-gray-400 hover:text-gray-600 transition-colors z-30"
                >
                  <X size={18} />
                </button>
              </div>
            </div>
          )}

          {/* Floating Toggle Button */}
          <Tooltip text={isChatOpen ? "Close AI Chat" : "Open AI Chat"}>
            <button
              onClick={() => setIsChatOpen((v) => !v)}
              className={`w-14 h-14 rounded-2xl flex items-center justify-center transition-all duration-300 shadow-xl pointer-events-auto border border-white/20 ${
                isChatOpen
                  ? "bg-gray-800 dark:bg-white text-white dark:text-gray-900 rotate-90 scale-90"
                  : "bg-blue-600 hover:bg-blue-700 text-white hover:scale-110 active:scale-95"
              }`}
            >
              {isChatOpen ? <X size={24} /> : <MessageCircle size={28} />}
            </button>
          </Tooltip>
        </div>

      </div>
    </div>
  );
}

export default App;
