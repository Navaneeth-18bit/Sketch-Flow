import Navbar from "./components/navbar.tsx";
import Canvas from "./components/drawing-canvas.tsx";
import ChatWindow from "./components/chat-window.tsx";

function App() {
  return (
    <div className="h-screen flex flex-col overflow-hidden">
      
      {/* Navbar */}
      <div className="h-16 shrink-0">
        <Navbar />
      </div>

      {/* Main Content */}
      <div className="flex flex-1 overflow-hidden flex-col md:flex-row">
        
        {/* Canvas */}
        <div className="flex-1 overflow-hidden">
          <Canvas />
        </div>

        {/* Chat */}
        <div className="h-1/2 md:h-full md:w-[380px] shrink-0 border-t md:border-t-0 md:border-l overflow-hidden">
          <ChatWindow />
        </div>

      </div>
    </div>
  );
}

export default App;