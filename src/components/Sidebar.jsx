import React from 'react';

function Sidebar({ sessions, activeSessionId, activeView, onViewChange, onSelectSession, onNewSession, onDeleteSession, userProfile, onUpdateProfile }) {

  return (
    <div className="w-72 bg-chat-darker border-r border-white/5 flex flex-col h-full shadow-[10px_0_30px_rgba(0,0,0,0.5)] z-10 hidden sm:flex shrink-0">
      
      {/* iNSIGHTS Branding */}
      <div className="p-5 border-b border-white/5">
        <div className="flex items-center gap-3 mb-1">
          <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-blue-600 to-purple-600 flex items-center justify-center shadow-lg shadow-blue-500/20">
            <span className="text-white font-black text-base italic">i</span>
          </div>
          <div>
            <h1 className="text-white font-black text-base tracking-tight">Arise <span className="text-[10px] font-normal text-gray-500 uppercase tracking-widest">AI</span></h1>
            <p className="text-[9px] text-blue-400 font-medium tracking-[0.15em] uppercase">Search Less. Solve More.</p>
          </div>
        </div>
      </div>

      {/* Life OS Navigation */}
      <div className="px-3 pt-4 pb-2 space-y-1">
        <button
          onClick={() => onViewChange('chat')}
          className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-xl transition-all text-sm font-semibold border ${
            activeView === 'chat'
              ? 'bg-blue-600/15 text-blue-400 border-blue-500/25 shadow-sm'
              : 'text-gray-400 hover:text-gray-200 hover:bg-white/5 border-transparent'
          }`}
        >
          <svg className="w-4 h-4 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M8 10h.01M12 10h.01M16 10h.01M9 16H5a2 2 0 01-2-2V6a2 2 0 012-2h14a2 2 0 012 2v8a2 2 0 01-2 2h-5l-5 5v-5z" /></svg>
          AI Assistant
        </button>

        <button
          onClick={() => onViewChange('projects')}
          className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-xl transition-all text-sm font-semibold border ${
            activeView === 'projects'
              ? 'bg-purple-600/15 text-purple-400 border-purple-500/25 shadow-sm'
              : 'text-gray-400 hover:text-gray-200 hover:bg-white/5 border-transparent'
          }`}
        >
          <svg className="w-4 h-4 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" /></svg>
          Execution HUB
        </button>

        <button
          onClick={() => onViewChange('tasks')}
          className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-xl transition-all text-sm font-semibold border ${
            activeView === 'tasks'
              ? 'bg-emerald-600/15 text-emerald-400 border-emerald-500/25 shadow-sm'
              : 'text-gray-400 hover:text-gray-200 hover:bg-white/5 border-transparent'
          }`}
        >
          <svg className="w-4 h-4 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-6 9l2 2 4-4" /></svg>
          To-Do Engine
        </button>

        <button
          onClick={() => onViewChange('wellness')}
          className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-xl transition-all text-sm font-semibold border ${
            activeView === 'wellness'
              ? 'bg-rose-600/15 text-rose-400 border-rose-500/25 shadow-sm'
              : 'text-gray-400 hover:text-gray-200 hover:bg-white/5 border-transparent'
          }`}
        >
          <svg className="w-4 h-4 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z" /></svg>
          Health & Wellness
        </button>
      </div>

      {/* New Chat Button */}
      <div className="px-3 py-2">
        <button
          onClick={onNewSession}
          className="w-full flex items-center justify-center gap-2 bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500 text-white py-3 px-4 rounded-xl text-sm font-bold shadow-lg shadow-blue-600/20 transition-all active:scale-95 group"
        >
          <svg className="w-4 h-4 group-hover:rotate-90 transition-transform duration-300" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M12 4v16m8-8H4" /></svg>
          New Engagement
        </button>
      </div>

      {/* Chat History */}
      <div className="px-3 pt-3 pb-1">
        <p className="text-[10px] uppercase text-gray-500 font-bold tracking-widest mb-2 px-1">Recent Outcomes</p>
      </div>

      <div className="flex-1 overflow-y-auto px-3 space-y-1 custom-scrollbar">
        {sessions.map((session, index) => (
          <div
            key={session.id}
            className={`w-full text-left px-3 py-2.5 rounded-xl transition-all duration-200 flex items-center justify-between group/item cursor-pointer ${
              activeSessionId === session.id && activeView === 'chat'
                ? 'bg-gradient-to-r from-blue-600/20 to-purple-600/10 border border-blue-500/30 border-l-2 border-l-blue-500 text-white'
                : 'text-gray-400 hover:bg-white/5 border border-transparent hover:text-gray-200'
            }`}
            onClick={() => { onSelectSession(session.id); onViewChange('chat'); }}
          >
            <div className="flex items-center gap-2.5 overflow-hidden flex-1">
              <svg className={`w-3.5 h-3.5 flex-shrink-0 ${activeSessionId === session.id && activeView === 'chat' ? 'text-blue-400' : 'text-gray-600'}`} fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M7 8h10M7 12h4m1 8l-4-4H5a2 2 0 01-2-2V6a2 2 0 012-2h14a2 2 0 012 2v8a2 2 0 01-2 2h-3l-4 4z" /></svg>
              <span className="truncate text-xs font-medium">{session.title}</span>
            </div>
            <button
              onClick={(e) => { e.stopPropagation(); onDeleteSession(session.id); }}
              className="ml-1 p-1 rounded-lg text-gray-600 hover:text-red-400 hover:bg-red-400/10 transition-all opacity-0 group-hover/item:opacity-100 flex-shrink-0"
            >
              <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" /></svg>
            </button>
          </div>
        ))}
        {sessions.length === 0 && (
          <div className="text-center text-gray-600 text-xs mt-8">No conversations yet</div>
        )}
      </div>

      {/* Life Context (Brain Profile) */}
      <div className="mt-auto px-4 py-4 bg-black/20 border-t border-white/5 shrink-0">
        <label className="text-[10px] uppercase font-bold text-gray-500 tracking-widest mb-2 flex items-center gap-1.5">
          <span className="block w-1.5 h-1.5 rounded-full bg-blue-500 animate-pulse"></span>
          Active Life Context
        </label>
        <textarea
          placeholder="E.g. I am a tech entrepreneur building an AI startup. Keep answers concise and startup-focused."
          value={userProfile}
          onChange={(e) => onUpdateProfile(e.target.value)}
          className="w-full h-16 bg-black/40 text-gray-300 text-xs p-2.5 rounded-xl border border-white/10 focus:outline-none focus:border-blue-500/50 resize-none custom-scrollbar placeholder-gray-700 transition-all"
        />
      </div>
    </div>
  );
}

export default Sidebar;
