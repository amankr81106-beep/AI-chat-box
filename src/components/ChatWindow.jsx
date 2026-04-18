import React, { useState, useRef, useEffect } from 'react';

const AI_MODES = [
  { id: 'default', label: 'Default Chat', icon: '💬', desc: 'Standard AI conversation' },
  { id: 'notes', label: 'Generate Notes', icon: '📚', desc: 'Create structured summaries' },
  { id: 'qa', label: 'Solve Doubt', icon: '❓', desc: 'Direct, clear problem solving' },
  { id: 'explain', label: 'Explain Topic', icon: '🧠', desc: 'Fundamentals and analogies' },
  { id: 'questions', label: 'Create Questions', icon: '📝', desc: 'Test your knowledge' }
];

function ChatWindow({ session, onUpdateSession }) {
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [activeMode, setActiveMode] = useState('default');
  
  // Edit State Tracking
  const [editingMessageId, setEditingMessageId] = useState(null);
  const [editInput, setEditInput] = useState('');
  
  // Voice UI States
  const [isListening, setIsListening] = useState(false);
  const recognitionRef = useRef(null);

  const messagesEndRef = useRef(null);
  const inputRef = useRef(null);

  const messages = session ? session.messages : [];

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages, isLoading]);

  // Safely Boot up Browser Native Speech APIs via Hooks
  useEffect(() => {
    const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
    if (SpeechRecognition) {
      const recognition = new SpeechRecognition();
      recognition.continuous = true;
      recognition.interimResults = true;
      
      recognition.onresult = (event) => {
        let finalTrans = '';
        for (let i = event.resultIndex; i < event.results.length; ++i) {
          if (event.results[i].isFinal) {
            finalTrans += event.results[i][0].transcript;
          }
        }
        if (finalTrans) {
          // Properly formatted inline injecting
          setInput(prev => {
            const spacing = prev.length > 0 && !prev.endsWith(' ') ? ' ' : '';
            return prev + spacing + finalTrans.trim();
          });
        }
      };

      recognition.onerror = (event) => {
        console.error("Speech API Network/Hardware Error:", event.error);
        setIsListening(false);
      };

      recognition.onend = () => {
        setIsListening(false);
      };

      recognitionRef.current = recognition;
    }
  }, []);

  const toggleListening = () => {
    if (!recognitionRef.current) {
      alert("Your browser environment does not support Voice Recognition. Try using Chrome or Edge!");
      return;
    }
    
    if (isListening) {
      recognitionRef.current.stop();
    } else {
      recognitionRef.current.start();
      setIsListening(true);
    }
  };

  const handleSend = async (e) => {
    e.preventDefault();
    if (!input.trim() || !session) return;
    
    if (isListening && recognitionRef.current) {
      recognitionRef.current.stop();
      setIsListening(false);
    }

    const userMessage = { id: Date.now().toString(), role: 'user', content: input };
    const updatedMessages = [...messages, userMessage];
    
    onUpdateSession(session.id, updatedMessages);
    setInput('');
    setIsLoading(true);

    try {
      const response = await fetch('/api/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ message: input, mode: activeMode })
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

  const handleQuickAction = (modeId) => {
    setActiveMode(modeId);
    inputRef.current?.focus();
  };

  const initiateEdit = (msg) => {
    setEditingMessageId(msg.id);
    setEditInput(msg.content);
  };

  const handleSaveEdit = async (msgId) => {
    if (!editInput.trim() || !session) return;
    
    const editIndex = messages.findIndex(m => m.id === msgId);
    if (editIndex === -1) return;
    
    // ChatGPT Behavior: Truncate messages exactly up to the edited block!
    const pastMessages = messages.slice(0, editIndex);
    const userMessage = { id: Date.now().toString(), role: 'user', content: editInput };
    const updatedMessages = [...pastMessages, userMessage];
    
    // Close editor and immediately visually represent the truncated UI state
    onUpdateSession(session.id, updatedMessages);
    setEditingMessageId(null);
    setIsLoading(true);
    
    // Re-fetch new intelligent response from Groq based on revised block
    try {
      const response = await fetch('/api/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ message: editInput, mode: activeMode })
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
      const errorMessage = { 
        id: (Date.now() + 1).toString(), 
        role: 'assistant', 
        content: "Server failed to fetch edited generation."
      };
      onUpdateSession(session.id, [...updatedMessages, errorMessage]);
    } finally {
      setIsLoading(false);
    }
  };

  const handleCancelEdit = () => {
    setEditingMessageId(null);
    setEditInput('');
  };

  if (!session) return null;

  return (
    <div className="flex-1 flex flex-col relative z-0">
      <div className="flex-1 overflow-y-auto p-4 sm:p-8 space-y-6 custom-scrollbar">
        {messages.length === 0 ? (
          <div className="h-full flex flex-col items-center justify-center mt-[-5%] px-4">
            <div className="w-16 h-16 rounded-2xl bg-gradient-to-tr from-blue-500 to-purple-600 p-1 mb-6 shadow-2xl">
               <div className="w-full h-full bg-chat-dark rounded-xl flex items-center justify-center">
                  <svg className="w-8 h-8 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.5" d="M13 10V3L4 14h7v7l9-11h-7z"></path></svg>
               </div>
            </div>
            <h2 className="text-2xl font-bold text-white mb-2 tracking-wide text-center">Hello there.</h2>
            <p className="text-gray-400 text-center max-w-sm mb-10">How can I help you today? Select an intelligent mode below or just start typing.</p>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 max-w-2xl w-full">
               {AI_MODES.slice(1).map((mode) => (
                 <button 
                   key={`quick-${mode.id}`}
                   onClick={() => handleQuickAction(mode.id)}
                   className="glassmorphism bg-chat-accent/5 border border-chat-accent/10 hover:border-blue-500/50 hover:bg-chat-accent/20 transition-all rounded-2xl p-5 text-left group"
                 >
                   <div className="flex items-center gap-4">
                      <div className="text-2xl bg-chat-dark p-2 rounded-xl border border-white/5 group-hover:scale-110 transition-transform">{mode.icon}</div>
                      <div>
                        <h3 className="text-white font-medium mb-1">{mode.label}</h3>
                        <p className="text-xs text-gray-500 line-clamp-1">{mode.desc}</p>
                      </div>
                   </div>
                 </button>
               ))}
            </div>
          </div>
        ) : (
          messages.map((msg) => (
            <div key={msg.id} className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'} animate-in fade-in duration-300 slide-in-from-bottom-2`}>
              {msg.role === 'assistant' && (
                <div className="w-8 h-8 rounded-full bg-gradient-to-br from-purple-500 to-indigo-500 flex-shrink-0 flex items-center justify-center text-white mr-3 mt-1 shadow-lg shadow-purple-500/20">
                  <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M13 10V3L4 14h7v7l9-11h-7z" /></svg>
                </div>
              )}
              
              <div className={`relative max-w-[80%] rounded-2xl shadow-md group/message ${
                msg.role === 'user' 
                  ? 'bg-gradient-to-br from-blue-600 to-indigo-700 text-white rounded-tr-sm' 
                  : 'glassmorphism bg-chat-accent/10 border border-white/5 text-gray-200 rounded-tl-sm'
              }`}>
                {editingMessageId === msg.id ? (
                  <div className="w-[300px] sm:w-[400px] p-4">
                    <textarea 
                      value={editInput}
                      onChange={(e) => setEditInput(e.target.value)}
                      className="w-full bg-black/20 text-white p-3 rounded-xl border border-white/20 focus:outline-none focus:border-white/50 resize-y min-h-[100px] custom-scrollbar"
                    />
                    <div className="flex justify-end gap-2 mt-3">
                      <button onClick={handleCancelEdit} className="px-4 py-1.5 rounded-lg text-sm bg-gray-500/50 hover:bg-gray-500 text-white font-medium transition-colors">Cancel</button>
                      <button onClick={() => handleSaveEdit(msg.id)} className="px-4 py-1.5 rounded-lg text-sm bg-blue-500 hover:bg-blue-400 text-white font-medium transition-colors shadow-lg">Save & Generate</button>
                    </div>
                  </div>
                ) : (
                  <>
                    <div className="p-4">
                      <p className="whitespace-pre-wrap leading-relaxed text-[15px]">{msg.content}</p>
                    </div>
                    {msg.role === 'user' && (
                      <button 
                        onClick={() => initiateEdit(msg)}
                        className="absolute -left-12 top-2 p-2 text-gray-400 hover:text-white opacity-0 group-hover/message:opacity-100 transition-all rounded-full hover:bg-white/10"
                        title="Edit Message Text"
                      >
                        <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z" /></svg>
                      </button>
                    )}
                  </>
                )}
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
        <div className="max-w-4xl mx-auto mb-3 flex gap-2 overflow-x-auto custom-scrollbar pb-1">
          {AI_MODES.map((mode) => (
             <button
                key={`pill-${mode.id}`}
                onClick={() => setActiveMode(mode.id)}
                className={`flex-shrink-0 flex items-center gap-2 px-4 py-1.5 rounded-full text-xs font-medium transition-all border ${
                  activeMode === mode.id 
                    ? 'bg-blue-600/20 border-blue-500/50 text-blue-400 shadow-inner' 
                    : 'bg-chat-accent/10 border-transparent text-gray-400 hover:text-gray-200 hover:bg-chat-accent/20'
                }`}
             >
                <span>{mode.icon}</span> {mode.label}
             </button>
          ))}
        </div>
        
        <form onSubmit={handleSend} className="relative max-w-4xl mx-auto flex items-end gap-2 group">
          <button 
            type="button"
            onClick={toggleListening}
            className={`flex-shrink-0 w-[50px] h-[50px] sm:w-14 sm:h-14 rounded-2xl flex items-center justify-center transition-all shadow-lg ${
              isListening 
               ? 'bg-red-500 border border-red-400 text-white animate-pulse shadow-red-500/30' 
               : 'glassmorphism bg-chat-accent/10 border border-chat-accent/30 text-gray-400 hover:text-white hover:bg-chat-accent/20 hover:border-gray-500'
            }`}
            title="Voice Typer"
          >
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 11a7 7 0 01-7 7m0 0a7 7 0 01-7-7m7 7v4m0 0H8m4 0h4m-4-8a3 3 0 01-3-3V5a3 3 0 116 0v6a3 3 0 01-3 3z"></path></svg>
          </button>
          
          <div className="relative flex-1 glassmorphism bg-chat-accent/10 border border-chat-accent/30 rounded-2xl overflow-hidden shadow-lg transition-all focus-within:border-blue-500/50 focus-within:bg-chat-accent/20 focus-within:shadow-blue-500/10">
            <textarea
              ref={inputRef}
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === 'Enter' && !e.shiftKey) {
                  e.preventDefault();
                  handleSend(e);
                }
              }}
              placeholder={isListening ? "Listening natively... (Speak now)" : `Type a topic... (Current Mode: ${AI_MODES.find(m => m.id === activeMode)?.label})`}
              className="w-full bg-transparent text-white px-5 py-4 pr-12 focus:outline-none resize-none max-h-48 min-h-[56px] custom-scrollbar placeholder-gray-500"
              rows="1"
            />
          </div>
          
          <button 
            type="submit" 
            disabled={!input.trim() || isLoading || !session}
            className="flex-shrink-0 w-[50px] h-[50px] sm:w-14 sm:h-14 rounded-2xl bg-blue-600 hover:bg-blue-500 text-white flex items-center justify-center disabled:opacity-50 disabled:hover:bg-blue-600 transition-all shadow-lg"
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
