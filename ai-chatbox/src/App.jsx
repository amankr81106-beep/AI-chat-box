import Sidebar from './components/Sidebar';
import ChatWindow from './components/ChatWindow';

function App() {
  return (
    <div className="h-screen w-screen bg-chat-darker flex overflow-hidden">
      <Sidebar />
      <ChatWindow />
    </div>
  );
}

export default App;
