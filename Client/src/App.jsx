import React, { useContext, useState, useRef, useEffect } from "react";
import Navbar from "./components/navbar.tsx";
import Canvas from "./components/drawing-canvas.tsx";
import ChatWindow from "./components/chat-window.tsx";
import Login from "./components/login.tsx";
import { ThemeContext } from "./contexts/ThemeContext.jsx";
import { auth } from "./utils/firebase";
import { supabase } from "./utils/supabase";
import { onIdTokenChanged } from "firebase/auth";

function App() {
  const { isDark } = useContext(ThemeContext);
  const [user, setUser] = useState(null);
  const [role, setRole] = useState(null);
  const [loading, setLoading] = useState(true);

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

      {/* Main Content */}
      <div className="flex flex-1 overflow-hidden flex-col md:flex-row">
        {/* Canvas - Only for Teacher and Admin */}
        {(role === 'teacher' || role === 'admin') ? (
          <div className="flex-1 overflow-hidden">
            <Canvas />
          </div>
        ) : (
          <div className="flex-1 flex items-center justify-center bg-gray-50 dark:bg-[#121212] text-gray-500 dark:text-gray-400 transition-colors">
            <div className="text-center p-8">
              <h2 className="text-2xl font-bold mb-4">Welcome, Student!</h2>
              <p>You can view diagrams shared by your teacher and use the AI Chatbot for any doubts.</p>
            </div>
          </div>
        )}

        {/* Chat - Available to everyone */}
        <div className="h-1/2 md:h-full md:w-[380px] shrink-0 border-t md:border-t-0 md:border-l border-gray-200 dark:border-[#303030] overflow-hidden bg-white dark:bg-[#1e1e1e] transition-colors">
          <ChatWindow />
        </div>
      </div>
    </div>
  );
}

export default App;
