import React, { useState, useRef, useEffect } from 'react';

const AI_MODES = [
  { id: 'default', label: 'Default Chat', icon: '💬', desc: 'Standard AI conversation' },
  { id: 'notes', label: 'Generate Notes', icon: '📚', desc: 'Create structured summaries' },
  { id: 'qa', label: 'Solve Doubt', icon: '❓', desc: 'Direct, clear problem solving' },
  { id: 'explain', label: 'Explain Topic', icon: '🧠', desc: 'Fundamentals and analogies' },
  { id: 'questions', label: 'Create Questions', icon: '📝', desc: 'Test your knowledge' },
  { id: 'web', label: 'Deep Search', icon: '🔍', desc: 'Live web intelligence & research' },
  { id: 'symptom', label: 'Symptom Check', icon: '🩺', desc: 'AI health analysis (not a diagnosis)' },
  { id: 'fitness', label: 'Fitness Plan', icon: '💪', desc: 'Personalized workout & diet plans' }
];

function ChatWindow({ session, onUpdateSession, userProfile }) {
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [activeMode, setActiveMode] = useState('default');
  const [language, setLanguage] = useState('english');
  
  const [selectedFile, setSelectedFile] = useState(null);
  const fileInputRef = useRef(null);

  const [editingMessageId, setEditingMessageId] = useState(null);
  const [editInput, setEditInput] = useState('');
  
  const [isListening, setIsListening] = useState(false);
  const recognitionRef = useRef(null);

  const messagesEndRef = useRef(null);
  const inputRef = useRef(null);

  // ── Voice Assistant (Hey Arise / JARVIS-style) State ──
  const [vaActive, setVaActive] = useState(false);
  const [vaState, setVaState] = useState('idle');        // idle | wake | listening | processing
  const [vaText, setVaText] = useState('');
  const wakeRecogRef = useRef(null);
  const WAKE_WORDS = ['hey arise', 'hey a rise', 'arise', 'ok arise', 'hello arise', 'hey rise'];

  const messages = session ? session.messages : [];

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages, isLoading]);

  useEffect(() => {
    const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
    if (SpeechRecognition) {
      const recognition = new SpeechRecognition();
      recognition.continuous = true;
      recognition.interimResults = true;
      recognition.onresult = (event) => {
        let finalTrans = '';
        for (let i = event.resultIndex; i < event.results.length; ++i) {
          if (event.results[i].isFinal) finalTrans += event.results[i][0].transcript;
        }
        if (finalTrans) {
          setInput(prev => {
            const spacing = prev.length > 0 && !prev.endsWith(' ') ? ' ' : '';
            return prev + spacing + finalTrans.trim();
          });
        }
      };
      recognition.onerror = () => setIsListening(false);
      recognition.onend = () => setIsListening(false);
      recognitionRef.current = recognition;
    }
  }, []);

  // ── Wake Word Detection Engine ──
  const startWakeWordListening = () => {
    const SR = window.SpeechRecognition || window.webkitSpeechRecognition;
    if (!SR) return;
    const rec = new SR();
    rec.continuous = true;
    rec.interimResults = true;
    rec.lang = 'en-IN';

    rec.onresult = (event) => {
      let transcript = '';
      for (let i = event.resultIndex; i < event.results.length; i++) {
        transcript += event.results[i][0].transcript.toLowerCase();
      }
      const wakeDetected = WAKE_WORDS.some(w => transcript.includes(w));
      if (wakeDetected) {
        rec.stop();
        setVaState('listening');
        setVaText('Arise is listening...');
        const utter = new SpeechSynthesisUtterance('At your service.');
        utter.rate = 0.95; utter.pitch = 0.7;  // Deep JARVIS-style voice
        window.speechSynthesis.speak(utter);
        // Start command recognition
        startCommandListening();
      }
    };
    rec.onerror = () => {};
    rec.onend = () => {
      // Auto-restart if VA still active
      if (wakeRecogRef.current && vaActive) {
        try { rec.start(); } catch(e) {}
      }
    };
    wakeRecogRef.current = rec;
    try { rec.start(); } catch(e) {}
  };

  const startCommandListening = () => {
    const SR = window.SpeechRecognition || window.webkitSpeechRecognition;
    if (!SR) return;
    const cmdRec = new SR();
    cmdRec.continuous = false;
    cmdRec.interimResults = false;
    cmdRec.lang = 'en-IN';
    let commandHeard = false;

    cmdRec.onresult = async (event) => {
      commandHeard = true;
      const command = event.results[0][0].transcript;
      setVaText(`"${command}"`);
      setVaState('processing');
      // Send command to AI
      try {
        const fd = new FormData();
        fd.append('message', command);
        fd.append('mode', 'default');
        fd.append('userProfile', userProfile || '');
        const res = await fetch('/api/chat', { method: 'POST', body: fd });
        const data = await res.json();
        const reply = data.reply || 'Sorry, I could not process that.';
        // Add to chat
        if (session) {
          const now = Date.now();
          const userMsg = { id: now.toString(), role: 'user', content: `🎙️ ${command}` };
          const aiMsg = { id: (now+1).toString(), role: 'assistant', content: reply };
          onUpdateSession(session.id, [...messages, userMsg, aiMsg]);
        }
        // Speak the reply
        window.speechSynthesis.cancel();
        const clean = reply.replace(/[#*_~`\[\]]/g, '').slice(0, 500);
        const replyUtter = new SpeechSynthesisUtterance(clean);
        replyUtter.rate = 0.95; replyUtter.pitch = 0.75; // Deep JARVIS tone
        const voices = window.speechSynthesis.getVoices();
        const deepVoice = voices.find(v => v.name.includes('Daniel') || v.name.includes('Google UK English Male') || v.name.includes('Male') || v.name.includes('Arthur'));
        if (deepVoice) replyUtter.voice = deepVoice;
        replyUtter.onend = () => {
          setVaState('wake');
          setVaText('Say "Hey Arise"...');
          if (wakeRecogRef.current) {
            try { wakeRecogRef.current.start(); } catch(e) {}
          } else {
            startWakeWordListening();
          }
        };
        window.speechSynthesis.speak(replyUtter);
      } catch(err) {
        setVaState('wake');
        setVaText('Say "Hey Arise"...');
      }
    };
    cmdRec.onerror = () => {
      setVaState('wake');
      setVaText('Say "Hey Arise"...');
      startWakeWordListening();
    };
    cmdRec.onend = () => {
      if (!commandHeard) {
        setVaState('wake');
        setVaText('Say "Hey Arise"...');
        startWakeWordListening();
      }
    };
    cmdRec.start();
  };

  const toggleVoiceAssistant = () => {
    if (vaActive) {
      // Turn OFF
      setVaActive(false);
      setVaState('idle');
      setVaText('');
      window.speechSynthesis.cancel();
      if (wakeRecogRef.current) {
        try { wakeRecogRef.current.stop(); } catch(e) {}
        wakeRecogRef.current = null;
      }
    } else {
      // Turn ON
      setVaActive(true);
      setVaState('wake');
      setVaText('Say "Hey Arise"...');
      const greet = new SpeechSynthesisUtterance('Arise online. All systems nominal. How can I assist you?');
      greet.rate = 0.9; greet.pitch = 0.7;
      const voices = window.speechSynthesis.getVoices();
      const deepVoice = voices.find(v => v.name.includes('Daniel') || v.name.includes('Google UK English Male') || v.name.includes('Arthur') || v.name.includes('Male'));
      if (deepVoice) greet.voice = deepVoice;
      greet.onend = () => startWakeWordListening();
      window.speechSynthesis.speak(greet);
    }
  };

  const toggleListening = () => {
    if (!recognitionRef.current) return alert("Your browser environment does not support Voice Recognition. Try using Chrome or Edge!");
    if (isListening) recognitionRef.current.stop();
    else { recognitionRef.current.start(); setIsListening(true); }
  };

  const handleFileChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      if (file.size > 5 * 1024 * 1024) return alert("Warning: Selected file is above 5MB. Please choose a smaller file.");
      setSelectedFile(file);
    }
  };

  const clearFile = () => {
    setSelectedFile(null);
    if (fileInputRef.current) fileInputRef.current.value = "";
  };

  const handleDownloadChat = () => {
     if (!session || messages.length === 0) return;
     let content = `# Arise Chat Log: ${session.title}\n\n`;
     messages.forEach(msg => {
       content += `### ${msg.role === 'user' ? 'You' : 'Arise AI'}\n${msg.content}\n\n---\n\n`;
     });
     
     const blob = new Blob([content], { type: 'text/markdown' });
     const url = URL.createObjectURL(blob);
     const a = document.createElement('a');
     a.href = url;
     a.download = `${session.title.replace(/\\s+/g, '_')}_Log.md`;
     a.click();
     URL.revokeObjectURL(url);
  };

  const handleSpeak = (text) => {
    if ('speechSynthesis' in window) {
      window.speechSynthesis.cancel(); 
      const cleanText = text.replace(/[#*_~`\\]/g, ''); 
      const utterance = new SpeechSynthesisUtterance(cleanText);
      const voices = window.speechSynthesis.getVoices();
      utterance.voice = voices.find(v => v.name.includes('Google') || v.name.includes('English') || v.name.includes('Samantha')) || voices[0];
      utterance.rate = 1.0;
      window.speechSynthesis.speak(utterance);
    }
  };

  const handleSend = async (e) => {
    e.preventDefault();
    if ((!input.trim() && !selectedFile) || !session) return;
    
    if (isListening && recognitionRef.current) {
      recognitionRef.current.stop();
      setIsListening(false);
    }

    let visualContent = input;
    if (selectedFile) visualContent = `[📎 Attached Document: ${selectedFile.name}]\n\n` + input;

    const userMessage = { id: Date.now().toString(), role: 'user', content: visualContent };
    const updatedMessages = [...messages, userMessage];
    
    onUpdateSession(session.id, updatedMessages);
    
    const sendInputText = input; 
    const sendFileRaw = selectedFile; 
    
    setInput('');
    clearFile();
    setIsLoading(true);

    try {
      const formData = new FormData();
      formData.append('message', sendInputText);
      formData.append('mode', activeMode);
      formData.append('userProfile', userProfile || '');
      formData.append('language', language);
      
      if (sendFileRaw) formData.append('file', sendFileRaw);

      const response = await fetch('/api/chat', { method: 'POST', body: formData });
      const data = await response.json();
      const aiContent = response.ok ? data.reply : `Error: ${data.reply || data.error}`;
      
      const aiMessage = { id: (Date.now() + 1).toString(), role: 'assistant', content: aiContent };
      onUpdateSession(session.id, [...updatedMessages, aiMessage]);
    } catch (error) {
      onUpdateSession(session.id, [...updatedMessages, { id: (Date.now() + 1).toString(), role: 'assistant', content: "Oops! Backend connection failed." }]);
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
    
    const pastMessages = messages.slice(0, editIndex);
    const userMessage = { id: Date.now().toString(), role: 'user', content: editInput };
    const updatedMessages = [...pastMessages, userMessage];
    
    onUpdateSession(session.id, updatedMessages);
    setEditingMessageId(null);
    setIsLoading(true);
    
    try {
      const formData = new FormData();
      formData.append('message', editInput);
      formData.append('mode', activeMode);
      formData.append('userProfile', userProfile || '');
      formData.append('language', language);

      const response = await fetch('/api/chat', { method: 'POST', body: formData });
      const data = await response.json();
      const aiContent = response.ok ? data.reply : `Error: ${data.reply || data.error}`;
      
      onUpdateSession(session.id, [...updatedMessages, { id: (Date.now() + 1).toString(), role: 'assistant', content: aiContent }]);
    } catch (error) {
      onUpdateSession(session.id, [...updatedMessages, { id: (Date.now() + 1).toString(), role: 'assistant', content: "Server failed to fetch edited generation." }]);
    } finally {
      setIsLoading(false);
    }
  };

  const handleCancelEdit = () => {
    setEditingMessageId(null);
    setEditInput('');
  };

  const handleCopyMessage = (text) => {
    navigator.clipboard.writeText(text);
    // Visual alert feedback
    const btn = document.activeElement;
    if (btn) {
       const originalHTML = btn.innerHTML;
       btn.innerHTML = `<svg class="w-5 h-5 text-green-400" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M5 13l4 4L19 7"></path></svg>`;
       setTimeout(() => { btn.innerHTML = originalHTML; }, 2000);
    }
  };

  // Native Splitter Logic for Markdown highlighting bypassing heavy NPM payload deps
  const renderMessageContent = (content) => {
    // Regex splits the entire string specifically identifying Code Blocks OR Image Blocks
    const regex = /(```[\\s\\S]*?```|!\\[.*?\\]\\(.*?\\))/g;
    const parts = content.split(regex);
    
    return parts.map((part, index) => {
      if (!part) return null;

      // Identifying Standard Image Render Blocks `![Alt](URL)` 
      if (part.startsWith('![') && part.endsWith(')')) {
         const match = part.match(/!\\[(.*?)\\]\\((.*?)\\)/);
         if (match) {
            const altText = match[1];
            const imageUrl = match[2];
            return (
               <div key={index} className="my-5 rounded-2xl overflow-hidden border border-white/10 shadow-2xl bg-black/20 group/img relative animate-in fade-in zoom-in duration-500">
                  <img src={imageUrl} alt={altText} className="w-full h-auto object-cover max-h-[500px]" loading="lazy" />
                  
                  {/* Image Overlays for quick downloading access */}
                  <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-transparent opacity-0 group-hover/img:opacity-100 transition-opacity flex items-end justify-between p-4 mix-blend-normal">
                     <p className="text-white text-xs font-medium tracking-wide truncate max-w-[80%] drop-shadow-md">{altText}</p>
                     
                     <a href={imageUrl} download="Arise_Generation.jpg" target="_blank" rel="noreferrer" title="Download Image"
                        className="glassmorphism bg-white/10 hover:bg-white/30 p-2 rounded-lg text-white border border-white/20 transition-all hover:scale-105 active:scale-95"
                     >
                        <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2"><path strokeLinecap="round" strokeLinejoin="round" d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4"/></svg>
                     </a>
                  </div>
               </div>
            );
         }
      }

      // Identifying the Executable Code Block segments
      if (part.startsWith('```') && part.endsWith('```')) {
        let rawCode = part.slice(3, -3); // Remove the outer tri-backticks
        
        let lines = rawCode.split('\\n');
        let language = 'Code';
        
        // Isolate the language marker (e.g. 'python' or 'javascript') on the very first line properly
        if (lines[0] !== undefined && !lines[0].includes(' ') && lines[0].trim().length < 20) {
           if (lines[0].trim().length > 0) {
              language = lines[0].trim();
           }
           lines.shift(); // Physically destroy the first line from the array
        }
        
        // The remaining array is strictly executable code logic only!
        let pureExecutableCode = lines.join('\\n').trim();
        
        // Fallback cleanup ensuring ZERO random backticks leak into the copy payload
        pureExecutableCode = pureExecutableCode.replace(/^```|```$/g, '').trim();
        
        return (
          <div key={index} className="my-5 rounded-xl overflow-hidden border border-white/10 bg-[#0d1117] shadow-xl group/code block animate-in fade-in slide-in-from-bottom-2">
            <div className="flex items-center justify-between px-4 py-2 bg-black/50 border-b border-white/5">
              <span className="text-[10px] text-gray-400 font-mono uppercase tracking-widest leading-none">{language}</span>
              <button 
                onClick={(e) => { 
                   navigator.clipboard.writeText(pureExecutableCode); // Instantly Runnable Data Only!
                   e.currentTarget.innerHTML = `<svg class="w-3 h-3" viewBox="0 0 24 24" fill="none" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M5 13l4 4L19 7"/></svg><span class="translate-y-[-0.5px]">Copied!</span>`;
                }}
                className="text-[11px] text-gray-400 hover:text-white transition-colors flex items-center gap-1.5 opacity-60 hover:opacity-100 font-medium tracking-wide bg-white/5 hover:bg-white/10 px-2.5 py-1 rounded-md"
              >
                <svg className="w-3 h-3" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z"/></svg>
                <span className="translate-y-[-0.5px]">Copy Code</span>
              </button>
            </div>
            <div className="p-4 overflow-x-auto text-[13px] text-blue-100 font-mono tracking-tight leading-relaxed custom-scrollbar selection:bg-blue-500/30">
              <pre><code className="whitespace-pre">{pureExecutableCode}</code></pre>
            </div>
          </div>
        );
      }
      
      // Standard conversational strings mapped safely
      return (
        <span key={index} className="whitespace-pre-wrap leading-relaxed text-[15px] select-text">
           {part}
        </span>
      );
    });
  };

  if (!session) return null;

  return (
    <div className="flex-1 flex flex-col relative z-0">

      {messages.length > 0 && (
         <div className="absolute top-4 right-4 sm:right-8 z-50 animate-in fade-in zoom-in group/export">
            <button onClick={handleDownloadChat} className="glassmorphism bg-white/5 border border-white/10 hover:border-blue-500/50 hover:bg-white/10 p-2.5 rounded-xl text-gray-400 hover:text-white transition-all shadow-lg flex items-center gap-2">
               <svg className="w-5 h-5 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" /></svg>
               <span className="text-[11px] font-bold uppercase tracking-widest hidden group-hover/export:block translate-y-[-0.5px]">Save .MD</span>
            </button>
         </div>
      )}

      <div className="flex-1 overflow-y-auto p-4 sm:p-8 space-y-6 custom-scrollbar">
        {messages.length === 0 ? (
          <div className="h-full flex flex-col items-center justify-center mt-[-5%] px-4">
            <div className="w-16 h-16 rounded-2xl bg-gradient-to-tr from-blue-500 to-purple-600 p-1 mb-6 shadow-2xl">
               <div className="w-full h-full bg-chat-dark rounded-xl flex items-center justify-center">
                  <svg className="w-8 h-8 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.5" d="M13 10V3L4 14h7v7l9-11h-7z"></path></svg>
               </div>
            </div>
            <h2 className="text-2xl font-bold text-white mb-2 tracking-wide text-center">Hello there.</h2>
            <p className="text-gray-400 text-center max-w-sm mb-10">How can I help you today? Ask questions, search the live web natively, or drop files below!</p>
            
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 max-w-4xl w-full">
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
              
              <div className={`relative max-w-[85%] rounded-2xl shadow-md group/message ${
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
                      {msg.role === 'assistant' ? renderMessageContent(msg.content) : <p className="whitespace-pre-wrap leading-relaxed text-[15px]">{msg.content}</p>}
                    </div>
                    
                    {/* User Edit Pencil Icon */}
                    {msg.role === 'user' && (
                      <button onClick={() => initiateEdit(msg)} className="absolute -left-12 top-2 p-2 text-gray-400 hover:text-white opacity-0 group-hover/message:opacity-100 transition-all rounded-full hover:bg-white/10" title="Edit Message Text">
                        <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z" /></svg>
                      </button>
                    )}
                    
                    {/* Advanced Assistant Actions Tray */}
                    {msg.role === 'assistant' && (
                      <div className="absolute -right-12 top-2 flex flex-col gap-1.5 opacity-0 group-hover/message:opacity-100 transition-all">
                        {/* Copy Whole Message Button */}
                        <button onClick={() => handleCopyMessage(msg.content)} className="p-2 text-gray-400 hover:text-blue-400 rounded-full hover:bg-white/10 transition-colors" title="Copy Message Text">
                          <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z"/></svg>
                        </button>
                        {/* Text To Speech Loudspeaker */}
                        <button onClick={() => handleSpeak(msg.content)} className="p-2 text-gray-400 hover:text-purple-400 rounded-full hover:bg-white/10 transition-colors" title="Read Text Aloud">
                          <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15.536 8.464a5 5 0 010 7.072m2.828-9.9a9 9 0 010 12.728M5.586 15H4a1 1 0 01-1-1v-4a1 1 0 011-1h1.586l4.707-4.707C10.923 3.663 12 4.109 12 5v14c0 .891-1.077 1.337-1.707.707L5.586 15z" /></svg>
                        </button>
                      </div>
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
            <div className="glassmorphism bg-chat-accent/10 border border-white/5 rounded-2xl rounded-tl-sm px-5 py-4 flex items-center gap-1.5 shadow-md">
              <div className="w-2 h-2 rounded-full bg-gray-400 animate-bounce" style={{ animationDelay: '0ms' }}></div>
              <div className="w-2 h-2 rounded-full bg-gray-400 animate-bounce" style={{ animationDelay: '150ms' }}></div>
              <div className="w-2 h-2 rounded-full bg-gray-400 animate-bounce" style={{ animationDelay: '300ms' }}></div>
            </div>
          </div>
        )}
        <div ref={messagesEndRef} />
      </div>

      <div className="p-4 sm:p-6 bg-gradient-to-t from-chat-darker via-chat-dark/80 to-transparent relative z-10 w-full">
        {selectedFile && (
           <div className="max-w-4xl mx-auto flex items-center gap-2 mb-3 bg-blue-600/20 w-fit px-4 py-2 rounded-xl border border-blue-500/30 animate-in slide-in-from-bottom-2 duration-300">
               <svg className="w-4 h-4 text-blue-400" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15.172 7l-6.586 6.586a2 2 0 102.828 2.828l6.414-6.586a4 4 0 00-5.656-5.656l-6.415 6.585a6 6 0 108.486 8.486L20.5 13" /></svg>
               <span className="text-xs font-medium text-blue-100 max-w-[200px] truncate">{selectedFile.name} ({(selectedFile.size / 1024 / 1024).toFixed(2)} MB)</span>
               <button onClick={clearFile} className="ml-2 text-gray-400 hover:text-white transition-colors" title="Remove Document">
                 <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" /></svg>
               </button>
           </div>
        )}

        <div className="max-w-4xl mx-auto mb-3 flex items-center gap-3">
          {/* Mode Pills */}
          <div className="flex gap-2 overflow-x-auto custom-scrollbar pb-1 flex-1 mask-linear-fade">
            {AI_MODES.map((mode) => (
               <button
                  key={`pill-${mode.id}`}
                  onClick={() => setActiveMode(mode.id)}
                  className={`flex-shrink-0 flex items-center gap-2 px-4 py-1.5 rounded-full text-xs font-medium transition-all border ${
                    activeMode === mode.id 
                      ? (mode.id === 'web' ? 'bg-purple-600/20 border-purple-500/50 text-purple-300 shadow-inner' : 'bg-blue-600/20 border-blue-500/50 text-blue-400 shadow-inner')
                      : 'bg-chat-accent/10 border-transparent text-gray-400 hover:text-gray-200 hover:bg-chat-accent/20'
                  }`}
               >
                  <span>{mode.icon}</span> {mode.label}
               </button>
            ))}
          </div>
          {/* Language Selector */}
          <div className="flex-shrink-0 relative">
            <select
              value={language}
              onChange={e => setLanguage(e.target.value)}
              className="appearance-none bg-chat-accent/10 border border-chat-accent/30 hover:border-blue-500/40 text-gray-300 text-xs font-medium px-3 py-1.5 pr-7 rounded-full cursor-pointer focus:outline-none focus:border-blue-500/50 transition-all"
              title="Select Response Language"
            >
              <option value="english">🇺🇸 English</option>
              <option value="hinglish">🇮🇳 Hinglish</option>
              <option value="hindi">🇮🇳 Hindi</option>
              <option value="spanish">🇪🇸 Spanish</option>
              <option value="french">🇫🇷 French</option>
              <option value="arabic">🇸🇦 Arabic</option>
              <option value="japanese">🇯🇵 Japanese</option>
              <option value="german">🇩🇪 German</option>
              <option value="portuguese">🇧🇷 Portuguese</option>
              <option value="chinese">🇨🇳 Chinese</option>
            </select>
            <svg className="absolute right-2 top-1/2 -translate-y-1/2 w-3 h-3 text-gray-500 pointer-events-none" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 9l-7 7-7-7" /></svg>
          </div>
        </div>
        
        <form onSubmit={handleSend} className="relative max-w-4xl mx-auto flex items-end gap-2 group">
          <input type="file" ref={fileInputRef} onChange={handleFileChange} className="hidden" accept=".pdf,.txt,image/jpeg,image/png,image/webp,image/gif" />

          <button 
            type="button"
            onClick={() => fileInputRef.current?.click()}
            className="flex-shrink-0 w-[45px] h-[45px] sm:w-[50px] sm:h-[50px] rounded-2xl glassmorphism bg-chat-accent/10 border border-chat-accent/30 flex items-center justify-center transition-all shadow-md text-gray-400 hover:text-white hover:bg-chat-accent/20"
            title="Attach a Document Fragment"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15.172 7l-6.586 6.586a2 2 0 102.828 2.828l6.414-6.586a4 4 0 00-5.656-5.656l-6.415 6.585a6 6 0 108.486 8.486L20.5 13" /></svg>
          </button>
          
          <button 
            type="button"
            onClick={toggleListening}
            className={`flex-shrink-0 w-[45px] h-[45px] sm:w-[50px] sm:h-[50px] rounded-2xl flex items-center justify-center transition-all shadow-lg ${
              isListening ? 'bg-red-500 border border-red-400 text-white animate-pulse shadow-red-500/30' : 'glassmorphism bg-chat-accent/10 border border-chat-accent/30 text-gray-400 hover:text-white hover:bg-chat-accent/20'
            }`}
            title="Siri Voice Type Engine"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 11a7 7 0 01-7 7m0 0a7 7 0 01-7-7m7 7v4m0 0H8m4 0h4m-4-8a3 3 0 01-3-3V5a3 3 0 116 0v6a3 3 0 01-3 3z"></path></svg>
          </button>
          
          <div className={`relative flex-1 glassmorphism bg-chat-accent/10 border border-chat-accent/30 rounded-2xl overflow-hidden shadow-lg transition-all ${activeMode === 'web' ? 'focus-within:border-purple-500/50 focus-within:shadow-purple-500/10' : 'focus-within:border-blue-500/50 focus-within:shadow-blue-500/10'} focus-within:bg-chat-accent/20`}>
            <textarea
              ref={inputRef}
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={(e) => { if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); handleSend(e); } }}
              placeholder={isListening ? "Listening natively... (Speak now)" : `Type a query... (Current Mode: ${AI_MODES.find(m => m.id === activeMode)?.label})`}
              className="w-full bg-transparent text-white px-5 py-4 pr-12 focus:outline-none resize-none max-h-48 min-h-[56px] custom-scrollbar placeholder-gray-500"
              rows="1"
            />
          </div>
          
          <button 
            type="submit" 
            disabled={(!input.trim() && !selectedFile) || isLoading || !session}
            className={`flex-shrink-0 w-[50px] h-[50px] sm:w-14 sm:h-14 rounded-2xl text-white flex items-center justify-center disabled:opacity-50 transition-all shadow-lg ${activeMode === 'web' ? 'bg-purple-600 hover:bg-purple-500 disabled:hover:bg-purple-600' : 'bg-blue-600 hover:bg-blue-500 disabled:hover:bg-blue-600'}`}
          >
            <svg className="w-6 h-6 ml-1" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 19l9 2-9-18-9 18 9-2zm0 0v-8"></path></svg>
          </button>
        </form>
        <p className="text-center text-xs text-gray-500 mt-3 font-medium tracking-wide">
          Intelligence generated by Meta. Real-time connections by Arise Web Search.
        </p>
      </div>
    </div>
  );
}

export default ChatWindow;
