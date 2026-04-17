import React, { useState, useRef, useEffect } from 'react';

function ChatWindow({ session, onUpdateSession }) {
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const messagesEndRef = useRef(null);

  const messages = session ? session.messages : [];

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages, isLoading]);

  const handleSend = async (e) => {
    e.preventDefault();
    if (!input.trim() || !session) return;

    const userMessage = { id: Date.now().toString(), role: 'user', content: input };
    const updatedMessages = [...messages, userMessage];
    
    onUpdateSession(session.id, updatedMessages);
    setInput('');
    setIsLoading(true);

    try {
      const response = await fetch('/api/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ message: input })
      });

      const data = await response.json();
      const aiContent = response.ok ? data.reply : `Error: ${data.reply || data.error}`;
      
      const aiMessage = { 
        id: (Date.now() + 1).toString(), 
        role: 'assistant', 
        content: aiContent
      };
      
      onUpdateSession(session.id, [...updatedMessages, aiMessage]);
    } catch (error) {
      console.error("Networking Error:", error);
      const errorMessage = { 
        id: (Date.now() + 1).toString(), 
        role: 'assistant', 
        content: "Oops! Backend connection failed."
      };
      onUpdateSession(session.id, [...updatedMessages, errorMessage]);
    } finally {
      setIsLoading(false);
    }
  };

  if (!session) return null;

  return (
    <div className="flex-1 flex flex-col relative z-0">
      <div className="flex-1 overflow-y-auto p-4 sm:p-8 space-y-6 custom-scrollbar">
        {messages.length === 0 ? (
          <div className="h-full flex flex-col items-center justify-center opacity-70 mt-[-10%]">
            <div className="w-20 h-20 rounded-2xl bg-gradient-to-tr from-blue-500 to-purple-600 p-1 mb-6 shadow-2xl animate-pulse">
               <div className="w-full h-full bg-chat-dark rounded-xl flex items-center justify-center">
                  <svg className="w-10 h-10 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.5" d="M13 10V3L4 14h7v7l9-11h-7z"></path></svg>
               </div>
            </div>
            <h2 className="text-2xl font-bold text-white mb-2 tracking-wide text-center">Start interacting.</h2>
            <p className="text-gray-400 text-center max-w-sm">Type any message into the chatbox below to launch your conversation.</p>
          </div>
        ) : (
          messages.map((msg) => (
            <div key={msg.id} className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'} group animate-in fade-in duration-300 slide-in-from-bottom-2`}>
              {msg.role === 'assistant' && (
                <div className="w-8 h-8 rounded-full bg-gradient-to-br from-purple-500 to-indigo-500 flex-shrink-0 flex items-center justify-center text-white mr-3 mt-1 shadow-lg shadow-purple-500/20">
                  <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M13 10V3L4 14h7v7l9-11h-7z" /></svg>
                </div>
              )}
              
              <div className={`max-w-[80%] rounded-2xl p-4 shadow-md ${
                msg.role === 'user' 
                  ? 'bg-gradient-to-br from-blue-600 to-indigo-700 text-white rounded-tr-sm' 
                  : 'glassmorphism bg-chat-accent/10 border border-white/5 text-gray-200 rounded-tl-sm'
              }`}>
                <p className="whitespace-pre-wrap leading-relaxed text-[15px]">{msg.content}</p>
              </div>
            </div>
          ))
        )}
        
        {isLoading && (
          <div className="flex justify-start">
            <div className="w-8 h-8 rounded-full bg-gradient-to-br from-purple-500 to-indigo-500 flex-shrink-0 flex items-center justify-center text-white mr-3 mt-1">
               <svg className="w-5 h-5 animate-spin" fill="none" viewBox="0 0 24 24"><circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle><path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path></svg>
            </div>
            <div className="glassmorphism bg-chat-accent/10 border border-white/5 rounded-2xl rounded-tl-sm px-5 py-4 flex items-center gap-1.5">
              <div className="w-2 h-2 rounded-full bg-gray-400 animate-bounce" style={{ animationDelay: '0ms' }}></div>
              <div className="w-2 h-2 rounded-full bg-gray-400 animate-bounce" style={{ animationDelay: '150ms' }}></div>
              <div className="w-2 h-2 rounded-full bg-gray-400 animate-bounce" style={{ animationDelay: '300ms' }}></div>
            </div>
          </div>
        )}
        <div ref={messagesEndRef} />
      </div>

      <div className="p-4 sm:p-6 bg-gradient-to-t from-chat-darker via-chat-dark/80 to-transparent">
        <form onSubmit={handleSend} className="relative max-w-4xl mx-auto flex items-end gap-2 group">
          <div className="relative flex-1 glassmorphism bg-chat-accent/10 border border-chat-accent/30 rounded-2xl overflow-hidden shadow-lg transition-all focus-within:border-blue-500/50 focus-within:bg-chat-accent/20 focus-within:shadow-blue-500/10">
            <textarea
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === 'Enter' && !e.shiftKey) {
                  e.preventDefault();
                  handleSend(e);
                }
              }}
              placeholder="Ask me anything... (Press Enter to send)"
              className="w-full bg-transparent text-white px-5 py-4 pr-12 focus:outline-none resize-none max-h-48 min-h-[56px] custom-scrollbar placeholder-gray-500"
              rows="1"
            />
          </div>
          <button 
            type="submit" 
            disabled={!input.trim() || isLoading || !session}
            className="flex-shrink-0 w-14 h-14 rounded-2xl bg-blue-600 hover:bg-blue-500 text-white flex items-center justify-center disabled:opacity-50 disabled:hover:bg-blue-600 transition-all shadow-lg"
          >
            <svg className="w-6 h-6 ml-1" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 19l9 2-9-18-9 18 9-2zm0 0v-8"></path></svg>
          </button>
        </form>
        <p className="text-center text-xs text-gray-500 mt-3 font-medium tracking-wide">
          AI generated content may be inaccurate.
        </p>
      </div>
    </div>
  );
}

export default ChatWindow;
