import React from 'react';

function Sidebar({ sessions, activeSessionId, onNewSession, onSelectSession, onDeleteSession }) {
  return (
    <div className="w-72 border-r border-chat-accent/10 flex flex-col glassmorphism bg-chat-dark/50 relative z-10 transition-all duration-300">
      <div className="p-4">
        <button 
          onClick={onNewSession}
          className="w-full py-3 px-4 rounded-xl bg-gradient-to-r from-blue-600 to-indigo-600 text-white font-medium hover:opacity-90 transition-opacity flex items-center justify-center gap-2 shadow-lg shadow-blue-500/20 active:scale-[0.98]"
        >
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 4v16m8-8H4"></path></svg>
          New Chat
        </button>
      </div>

      <div className="flex-1 overflow-y-auto p-4 space-y-2 custom-scrollbar">
        <p className="text-xs uppercase tracking-wider text-gray-400 font-semibold mb-3">Chat History</p>
        
        {sessions.map((session) => (
          <div key={session.id} className="relative group flex items-center">
            <button
              onClick={() => onSelectSession(session.id)}
              className={`w-full text-left py-3 pl-3 pr-10 rounded-xl transition-all flex items-center gap-2.5 ${
                activeSessionId === session.id 
                  ? 'bg-chat-accent/20 border border-chat-accent/30 text-white shadow-inner' 
                  : 'text-gray-300 hover:bg-chat-accent/10 border border-transparent'
              }`}
            >
              <svg className={`w-4 h-4 flex-shrink-0 ${activeSessionId === session.id ? 'text-blue-400' : 'text-gray-500'}`} fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M8 10h.01M12 10h.01M16 10h.01M9 16H5a2 2 0 01-2-2V6a2 2 0 012-2h14a2 2 0 012 2v8a2 2 0 01-2 2h-5l-5 5v-5z" />
              </svg>
              <span className="truncate text-sm font-medium">{session.title}</span>
            </button>
            
            <button 
               onClick={(e) => { e.stopPropagation(); onDeleteSession(session.id); }}
               className="absolute right-2 text-gray-500 hover:text-red-400 opacity-0 group-hover:opacity-100 transition-opacity p-1.5 rounded-lg hover:bg-red-500/10"
               title="Delete Chat"
             >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"></path></svg>
            </button>
          </div>
        ))}
        
        {sessions.length === 0 && (
          <div className="text-center text-gray-500 text-sm mt-10">No chat history</div>
        )}
      </div>

      <div className="p-4 border-t border-chat-accent/20">
        <div className="rounded-xl bg-chat-accent/5 p-4 border border-chat-accent/10 hover:bg-chat-accent/10 transition-colors cursor-pointer">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-full bg-gradient-to-br from-purple-500 to-indigo-500 flex items-center justify-center text-white font-bold text-sm">
              AI
            </div>
            <div>
              <p className="text-sm font-medium text-white">Antigravity Agent</p>
              <p className="text-xs text-gray-400">Groq Engine v2</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

export default Sidebar;
