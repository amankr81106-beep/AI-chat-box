import { useState } from 'react';

export default function ChatWindow() {
  const [messages, setMessages] = useState([
    { id: 1, text: "Hello! I am your AI assistant. How can I help you today?", sender: "ai" }
  ]);
  const [input, setInput] = useState('');

  const handleSend = (e) => {
    e.preventDefault();
    if (!input.trim()) return;
    
    setMessages([...messages, { id: Date.now(), text: input, sender: 'user' }]);
    setInput('');
    
    setTimeout(() => {
      setMessages(prev => [...prev, { 
        id: Date.now() + 1, 
        text: "I'm a demo UI, so I can only echo that I received your message! But I'm ready to be integrated with a real backend.", 
        sender: 'ai' 
      }]);
    }, 1000);
  };

  return (
    <div className="flex-1 h-[calc(100%-2rem)] m-4 md:ml-0 flex flex-col relative rounded-[1.5rem] overflow-hidden glassmorphism transition-all duration-300 shadow-2xl">
      {/* Background graphic flares */}
      <div className="absolute top-[-20%] right-[-10%] w-[30rem] h-[30rem] bg-purple-600/10 rounded-full blur-[120px] pointer-events-none"></div>
      <div className="absolute bottom-[10%] left-[-10%] w-[25rem] h-[25rem] bg-chat-accent/10 rounded-full blur-[100px] pointer-events-none"></div>

      <div className="p-6 border-b border-glass-border flex items-center justify-between z-10 backdrop-blur-md bg-white/5">
        <h1 className="text-xl font-semibold tracking-tight text-white/90">Current Session</h1>
        <div className="w-10 h-10 rounded-full bg-gradient-to-br from-chat-accent to-purple-600 flex justify-center items-center shadow-lg shadow-purple-500/20">
          <span className="text-sm font-bold text-white tracking-widest">AI</span>
        </div>
      </div>
      
      <div className="flex-1 overflow-y-auto p-6 lg:p-8 space-y-6 z-10">
        {messages.map((m) => (
          <div key={m.id} className={`flex ${m.sender === 'user' ? 'justify-end' : 'justify-start'}`}>
            <div 
              className={`max-w-[75%] md:max-w-[65%] rounded-2xl px-6 py-4 shadow-xl ${
                m.sender === 'user' 
                  ? 'bg-gradient-to-br from-blue-600 to-indigo-700 text-white rounded-tr-sm'
                  : 'bg-slate-800/60 border border-white/10 text-slate-200 rounded-tl-sm backdrop-blur-md'
              }`}
            >
              <p className="text-[15px] leading-relaxed tracking-wide">{m.text}</p>
            </div>
          </div>
        ))}
      </div>

      <div className="p-6 z-10 border-t border-glass-border bg-black/20 backdrop-blur-xl">
        <form onSubmit={handleSend} className="relative flex items-center max-w-4xl mx-auto">
          <input 
            type="text" 
            value={input}
            onChange={(e) => setInput(e.target.value)}
            placeholder="Type your message..." 
            className="w-full bg-slate-900/60 border border-slate-700/50 rounded-2xl px-6 py-4 pr-14 text-slate-100 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-chat-accent/50 focus:border-chat-accent/50 backdrop-blur-sm transition-all shadow-inner text-base"
          />
          <button 
            type="submit"
            className="absolute right-3 p-2.5 rounded-xl text-slate-400 hover:text-white hover:bg-chat-accent transition-all duration-200 hover:shadow-lg hover:shadow-chat-accent/30"
          >
            <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2.5} stroke="currentColor" className="w-5 h-5">
              <path strokeLinecap="round" strokeLinejoin="round" d="M4.5 19.5l15-15m0 0H8.25m11.25 0v11.25" />
            </svg>
          </button>
        </form>
      </div>
    </div>
  );
}
