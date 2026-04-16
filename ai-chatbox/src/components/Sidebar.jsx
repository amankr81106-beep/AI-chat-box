export default function Sidebar() {
  const history = [
    { id: 1, title: 'Understanding Quantum Physics' },
    { id: 2, title: 'React Performance Tips' },
    { id: 3, title: 'Write an email to manager' },
    { id: 4, title: 'JavaScript Closure Example' }
  ];

  return (
    <div className="w-72 h-[calc(100%-2rem)] glassmorphism flex-col m-4 rounded-[1.5rem] overflow-hidden hidden md:flex transition-all duration-300">
      <div className="p-6 border-b border-glass-border z-10 relative bg-white/5">
        <h2 className="text-xl font-bold tracking-wide text-transparent bg-clip-text bg-gradient-to-r from-chat-accent to-indigo-400">
          Chat History
        </h2>
      </div>
      <div className="flex-1 overflow-y-auto p-4 space-y-3 relative z-10">
        {history.map((chat) => (
          <div 
            key={chat.id}
            className="px-4 py-3.5 rounded-xl cursor-pointer transition-all duration-300 hover:bg-white-10 hover:border-l-4 hover:border-chat-accent hover:shadow-lg text-[15px] font-medium text-slate-300 hover:text-white bg-slate-800/20"
          >
            {chat.title}
          </div>
        ))}
      </div>
      <div className="p-5 border-t border-glass-border bg-black/10">
        <button className="w-full py-3.5 rounded-xl bg-gradient-to-r from-chat-accent to-blue-600 hover:from-blue-500 hover:to-indigo-600 text-white font-medium transition-all duration-300 shadow-lg hover:shadow-cyan-500/25 flex items-center justify-center gap-2">
          <span>+</span> New Chat
        </button>
      </div>
    </div>
  );
}
