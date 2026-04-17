import { useState, useEffect } from 'react';
import Sidebar from './components/Sidebar';
import ChatWindow from './components/ChatWindow';

function App() {
  const [sessions, setSessions] = useState(() => {
    const saved = localStorage.getItem('chatSessions');
    return saved ? JSON.parse(saved) : [{ id: Date.now().toString(), title: 'New Conversation', messages: [] }];
  });
  
  const [activeSessionId, setActiveSessionId] = useState(sessions[0]?.id);

  useEffect(() => {
    localStorage.setItem('chatSessions', JSON.stringify(sessions));
  }, [sessions]);

  const handleNewSession = () => {
    const newSession = {
      id: Date.now().toString(),
      title: 'New Conversation',
      messages: []
    };
    setSessions(prev => [newSession, ...prev]);
    setActiveSessionId(newSession.id);
  };

  const handleSelectSession = (id) => {
    setActiveSessionId(id);
  };

  const handleDeleteSession = (sessionId) => {
    setSessions(prev => {
      const filtered = prev.filter(s => s.id !== sessionId);
      
      // If user deletes all chats, immediately spin up a new initial chat to avoid blank broken screens
      if (filtered.length === 0) {
        const newTempSession = { id: Date.now().toString(), title: 'New Conversation', messages: [] };
        setActiveSessionId(newTempSession.id);
        return [newTempSession];
      }
      
      // If we deleted the actively viewed chat, fallback routing down to the most recent chat in the array
      if (activeSessionId === sessionId) {
        setActiveSessionId(filtered[0].id);
      }
      
      return filtered;
    });
  };

  const handleUpdateSession = (sessionId, newMessages) => {
    setSessions(prev => prev.map(session => {
      if (session.id === sessionId) {
        let newTitle = session.title;
        if (session.messages.length === 0 && newMessages.length > 0 && newMessages[0].role === 'user') {
            const firstQuery = newMessages[0].content;
            newTitle = firstQuery.length > 30 ? firstQuery.substring(0, 30) + '...' : firstQuery;
        }
        return { ...session, title: newTitle, messages: newMessages };
      }
      return session;
    }));
  };

  const activeSession = sessions.find(s => s.id === activeSessionId) || sessions[0];

  return (
    <div className="h-screen w-screen bg-chat-darker flex overflow-hidden font-sans">
      <Sidebar 
        sessions={sessions} 
        activeSessionId={activeSessionId} 
        onNewSession={handleNewSession}
        onSelectSession={handleSelectSession}
        onDeleteSession={handleDeleteSession}
      />
      <ChatWindow 
        session={activeSession}
        onUpdateSession={handleUpdateSession}
      />
    </div>
  );
}

export default App;
