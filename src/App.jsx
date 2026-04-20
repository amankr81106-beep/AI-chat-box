import React, { useState, useEffect } from 'react';
import Sidebar from './components/Sidebar';
import ChatWindow from './components/ChatWindow';

function App() {
  const [sessions, setSessions] = useState(() => {
    const saved = localStorage.getItem('chatHistory');
    if (saved) {
      return JSON.parse(saved);
    }
    return [];
  });

  const [activeSessionId, setActiveSessionId] = useState(null);
  const [activeView, setActiveView] = useState('chat'); // 'chat', 'projects', 'tasks', 'wellness'
  
  // Life OS Engine States
  const [todos, setTodos] = useState(() => {
    const saved = localStorage.getItem('arise_todos');
    return saved ? JSON.parse(saved) : [];
  });

  // Health & Wellness OS State
  const [moodLog, setMoodLog] = useState(() => {
    const saved = localStorage.getItem('arise_mood_log');
    return saved ? JSON.parse(saved) : [];
  });
  const [healthMetrics, setHealthMetrics] = useState(() => {
    const saved = localStorage.getItem('arise_health_metrics');
    return saved ? JSON.parse(saved) : { weight: '', height: '', age: '', goal: 'general' };
  });

  // Permanent User Context Architecture
  const [userProfile, setUserProfile] = useState(() => {
    return localStorage.getItem('arise_user_profile') || '';
  });

  useEffect(() => {
    localStorage.setItem('chatHistory', JSON.stringify(sessions));
  }, [sessions]);

  useEffect(() => {
    localStorage.setItem('arise_todos', JSON.stringify(todos));
  }, [todos]);

  useEffect(() => {
    localStorage.setItem('arise_mood_log', JSON.stringify(moodLog));
  }, [moodLog]);

  useEffect(() => {
    localStorage.setItem('arise_health_metrics', JSON.stringify(healthMetrics));
  }, [healthMetrics]);

  const logMood = (emoji, label) => {
    const today = new Date().toLocaleDateString('en-IN');
    setMoodLog(prev => [
      { date: today, time: new Date().toLocaleTimeString('en-IN', {hour:'2-digit', minute:'2-digit'}), emoji, label },
      ...prev.slice(0, 29) // keep last 30 entries
    ]);
  };

  const handleUpdateProfile = (newProfileVal) => {
    setUserProfile(newProfileVal);
    localStorage.setItem('arise_user_profile', newProfileVal);
  };

  const handleAddTodo = (text) => {
    const newTodo = { id: Date.now().toString(), text, completed: false, createdAt: new Date() };
    setTodos(prev => [newTodo, ...prev]);
  };

  const mapToggleTodo = (id) => {
    setTodos(prev => prev.map(t => t.id === id ? { ...t, completed: !t.completed } : t));
  };

  const deleteTodo = (id) => {
    setTodos(prev => prev.filter(t => t.id !== id));
  };

  const handleNewSession = () => {
    const newSession = {
      id: Date.now().toString(),
      title: 'New Conversation',
      messages: []
    };
    setSessions(prev => [newSession, ...prev]);
    setActiveSessionId(newSession.id);
    setActiveView('chat');
  };

  const handleSelectSession = (id) => {
    setActiveSessionId(id);
    setActiveView('chat');
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
        activeView={activeView}
        onViewChange={setActiveView}
        onNewSession={handleNewSession}
        onSelectSession={handleSelectSession}
        onDeleteSession={handleDeleteSession}
        userProfile={userProfile}
        onUpdateProfile={handleUpdateProfile}
      />
      <main className="flex-1 flex overflow-hidden">
        {activeView === 'chat' ? (
          <ChatWindow 
            session={activeSession}
            onUpdateSession={handleUpdateSession}
            userProfile={userProfile}
            onAddTask={handleAddTodo}
          />
        ) : activeView === 'projects' ? (
          <ProjectHubView todos={todos} onAddTask={handleAddTodo} />
        ) : activeView === 'wellness' ? (
          <WellnessView 
            moodLog={moodLog} 
            onLogMood={logMood} 
            todos={todos}
            onAddTask={handleAddTodo}
            healthMetrics={healthMetrics}
            onUpdateMetrics={setHealthMetrics}
          />
        ) : (
          <TodoEngineView todos={todos} onAdd={handleAddTodo} onToggle={mapToggleTodo} onDelete={deleteTodo} />
        )}
      </main>
    </div>
  );
}

// ─── Execution HUB Data ──────────────────────────────────────────────────────
const PROJECT_CATEGORIES = [
  { label: 'Career', icon: '🚀', color: 'from-blue-600/20 to-blue-600/5', border: 'border-blue-500/20', accent: 'text-blue-400', desc: 'Jobs, promotions, skill building, side hustles.' },
  { label: 'Lifestyle', icon: '🌿', color: 'from-emerald-600/20 to-emerald-600/5', border: 'border-emerald-500/20', accent: 'text-emerald-400', desc: 'Health, fitness, habits, personal growth.' },
  { label: 'Relationships', icon: '🤝', color: 'from-pink-600/20 to-pink-600/5', border: 'border-pink-500/20', accent: 'text-pink-400', desc: 'Networking, family, friendships, mentors.' },
  { label: 'Forecasting', icon: '📈', color: 'from-purple-600/20 to-purple-600/5', border: 'border-purple-500/20', accent: 'text-purple-400', desc: 'Financial planning, trends, future goals.' },
  { label: 'Grant + Onboarding', icon: '🏆', color: 'from-yellow-600/20 to-yellow-600/5', border: 'border-yellow-500/20', accent: 'text-yellow-400', desc: 'Grants, scholarships, new opportunities.' },
  { label: 'Deep Search', icon: '🔍', color: 'from-cyan-600/20 to-cyan-600/5', border: 'border-cyan-500/20', accent: 'text-cyan-400', desc: 'Research, insights, live web intelligence.' },
];

function ProjectHubView({ todos, onAddTask }) {
  const [activeCategory, setActiveCategory] = useState(null);
  const [aiSteps, setAiSteps] = useState([]);
  const [loading, setLoading] = useState(false);
  const [addedSteps, setAddedSteps] = useState(new Set());

  const getCategoryTasks = (label) =>
    todos.filter(t => t.text.toLowerCase().includes(label.toLowerCase()) || (t.category === label));

  const generatePlan = async (cat) => {
    setActiveCategory(cat);
    setAiSteps([]);
    setAddedSteps(new Set());
    setLoading(true);
    try {
      const fd = new FormData();
      fd.append('message', `Create a practical, actionable 5-step execution plan to improve my ${cat.label} (${cat.desc}). Return ONLY a numbered list with exactly 5 concise action items. Each item must start with a number and period like "1. ". Nothing else — no intro, no outro.`);
      fd.append('mode', 'default');
      const res = await fetch('/api/chat', { method: 'POST', body: fd });
      const data = await res.json();
      const lines = (data.reply || '').split('\n')
        .map(l => l.trim())
        .filter(l => /^\d+\./.test(l))
        .map(l => l.replace(/^\d+\.\s*/, '').trim())
        .filter(Boolean);
      setAiSteps(lines.length > 0 ? lines : ['Could not generate plan. Try again.']);
    } catch (err) {
      console.error('Plan generation failed:', err);
      setAiSteps(['Backend error. Please ensure the server is running.']);
    }
    setLoading(false);
  };

  const handleAddToTasks = (step, index) => {
    onAddTask(`[${activeCategory.label}] ${step}`);
    setAddedSteps(prev => new Set([...prev, index]));
  };

  return (
    <div className="flex-1 flex overflow-hidden">
      {/* Left Panel — Category Grid */}
      <div className={`flex flex-col overflow-y-auto custom-scrollbar transition-all duration-300 ${activeCategory ? 'w-80 border-r border-white/5 shrink-0' : 'flex-1'}`}>
        <div className="p-8">
          <p className="text-xs font-bold uppercase tracking-[0.2em] text-blue-400 mb-2">Arise AI</p>
          <h1 className="text-3xl font-black text-white mb-2">Execution HUB</h1>
          <p className="text-gray-500 text-sm mb-8 max-w-md">Click a life category to generate an AI-powered action plan and track your execution.</p>

          <div className={`grid gap-4 ${activeCategory ? 'grid-cols-1' : 'grid-cols-1 md:grid-cols-2 lg:grid-cols-3'}`}>
            {PROJECT_CATEGORIES.map(cat => {
              const catTodos = getCategoryTasks(cat.label);
              const done = catTodos.filter(t => t.completed).length;
              const total = catTodos.length;
              const isActive = activeCategory?.label === cat.label;
              return (
                <div
                  key={cat.label}
                  onClick={() => generatePlan(cat)}
                  className={`relative bg-gradient-to-br ${cat.color} border rounded-2xl p-5 cursor-pointer overflow-hidden transition-all duration-300 ${
                    isActive
                      ? `${cat.border} ring-2 ring-white/20 scale-[1.02]`
                      : `${cat.border} hover:scale-[1.02] hover:ring-1 hover:ring-white/10`
                  }`}
                >
                  <div className="absolute top-3 right-3 text-2xl opacity-20">{cat.icon}</div>
                  <div className="text-xl mb-2">{cat.icon}</div>
                  <h2 className={`font-bold text-sm mb-1 ${cat.accent}`}>{cat.label}</h2>
                  {!activeCategory && <p className="text-gray-500 text-xs leading-relaxed mb-3">{cat.desc}</p>}
                  {total > 0 && (
                    <div className="mt-2">
                      <div className="flex justify-between text-[10px] text-gray-600 mb-1">
                        <span>Progress</span>
                        <span className={cat.accent}>{done}/{total}</span>
                      </div>
                      <div className="h-1 bg-white/5 rounded-full overflow-hidden">
                        <div className={`h-full bg-gradient-to-r ${cat.color.replace('/20', '/80')} rounded-full transition-all`} style={{width: `${total ? (done/total)*100 : 0}%`}}></div>
                      </div>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </div>
      </div>

      {/* Right Panel — AI Action Plan */}
      {activeCategory && (
        <div className="flex-1 flex flex-col overflow-hidden">
          <div className="flex items-center justify-between px-8 py-6 border-b border-white/5 shrink-0">
            <div className="flex items-center gap-4">
              <span className="text-3xl">{activeCategory.icon}</span>
              <div>
                <p className="text-xs font-bold uppercase tracking-widest text-gray-500 mb-0.5">Execution Plan</p>
                <h2 className={`text-2xl font-black ${activeCategory.accent}`}>{activeCategory.label}</h2>
              </div>
            </div>
            <div className="flex items-center gap-3">
              <button
                onClick={() => generatePlan(activeCategory)}
                className="text-xs text-gray-400 hover:text-white bg-white/5 hover:bg-white/10 border border-white/10 px-4 py-2 rounded-xl transition-all flex items-center gap-2"
              >
                <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" /></svg>
                Regenerate
              </button>
              <button onClick={() => setActiveCategory(null)} className="text-gray-500 hover:text-white p-2 hover:bg-white/5 rounded-xl transition-all">
                <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" /></svg>
              </button>
            </div>
          </div>

          <div className="flex-1 overflow-y-auto custom-scrollbar p-8">
            {loading ? (
              <div className="flex flex-col gap-4">
                {[1,2,3,4,5].map(i => (
                  <div key={i} className="flex items-center gap-4 p-5 rounded-2xl border border-white/5 bg-white/2 animate-pulse">
                    <div className="w-8 h-8 rounded-full bg-white/5 shrink-0"></div>
                    <div className="flex-1 space-y-2">
                      <div className="h-3 bg-white/5 rounded-full w-3/4"></div>
                      <div className="h-2 bg-white/5 rounded-full w-1/2"></div>
                    </div>
                  </div>
                ))}
                <p className="text-center text-gray-500 text-sm mt-4">AI is generating your {activeCategory.label} execution plan...</p>
              </div>
            ) : (
              <div className="space-y-4 max-w-2xl">
                {aiSteps.map((step, i) => (
                  <div key={i} className={`group flex items-start gap-4 p-5 rounded-2xl border transition-all ${
                    addedSteps.has(i)
                      ? 'border-emerald-500/30 bg-emerald-500/5 opacity-60'
                      : `border-white/5 bg-gradient-to-r ${activeCategory.color} hover:border-white/15`
                  }`}>
                    <div className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-black shrink-0 bg-gradient-to-br ${activeCategory.color} border ${activeCategory.border} ${activeCategory.accent}`}>
                      {i + 1}
                    </div>
                    <p className="flex-1 text-gray-200 text-sm leading-relaxed pt-1">{step}</p>
                    <button
                      onClick={() => handleAddToTasks(step, i)}
                      disabled={addedSteps.has(i)}
                      className={`shrink-0 transition-all text-xs px-3 py-1.5 rounded-lg font-bold flex items-center gap-1.5 ${
                        addedSteps.has(i)
                          ? 'text-emerald-400 bg-emerald-500/10 border border-emerald-500/20 cursor-default'
                          : 'text-gray-400 hover:text-white bg-white/5 hover:bg-white/15 border border-white/10 opacity-0 group-hover:opacity-100'
                      }`}
                    >
                      {addedSteps.has(i) ? (
                        <><svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="3" d="M5 13l4 4L19 7" /></svg>Added</>
                      ) : (
                        <><svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 4v16m8-8H4" /></svg>Add to Tasks</>
                      )}
                    </button>
                  </div>
                ))}

                {aiSteps.length > 0 && (
                  <button
                    onClick={() => aiSteps.forEach((s, i) => !addedSteps.has(i) && handleAddToTasks(s, i))}
                    className={`w-full py-3 rounded-xl border text-sm font-bold transition-all mt-2 ${activeCategory.accent} border-current bg-current/5 hover:bg-current/15`}
                  >
                    + Add All Steps to To-Do Engine
                  </button>
                )}
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}

// ─── To-Do Engine View ────────────────────────────────────────────────────────
function TodoEngineView({ todos, onAdd, onToggle, onDelete }) {
  const [input, setInput] = useState('');

  const handleSubmit = (e) => {
    e.preventDefault();
    if (input.trim()) {
      onAdd(input.trim());
      setInput('');
    }
  };

  const completed = todos.filter(t => t.completed).length;
  const total = todos.length;

  return (
    <div className="flex-1 overflow-y-auto custom-scrollbar">
      <div className="p-8 max-w-3xl mx-auto">
        <div className="mb-8">
          <p className="text-xs font-bold uppercase tracking-[0.2em] text-emerald-400 mb-2">Arise AI</p>
          <h1 className="text-4xl font-black text-white mb-3">AI To-Do Engine</h1>
          <p className="text-gray-400 text-sm">Your action list. The AI adds tasks automatically — or add them manually below.</p>
        </div>

        {total > 0 && (
          <div className="glassmorphism border border-white/5 rounded-2xl p-4 mb-6 flex items-center gap-4">
            <div className="flex-1">
              <div className="flex justify-between text-xs text-gray-500 mb-1">
                <span>Progress</span>
                <span className="text-emerald-400 font-bold">{completed}/{total} done</span>
              </div>
              <div className="h-1.5 bg-white/5 rounded-full overflow-hidden">
                <div className="h-full bg-gradient-to-r from-emerald-500 to-blue-500 rounded-full transition-all duration-500" style={{width: `${total ? (completed/total)*100 : 0}%`}}></div>
              </div>
            </div>
            {completed > 0 && (
              <button
                onClick={() => todos.filter(t => t.completed).forEach(t => onDelete(t.id))}
                className="text-xs font-semibold text-red-400 hover:text-red-300 border border-red-500/20 hover:border-red-500/40 px-3 py-1.5 rounded-lg bg-red-500/5 hover:bg-red-500/10 transition-all flex items-center gap-1.5 flex-shrink-0"
              >
                <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" /></svg>
                Clear Completed ({completed})
              </button>
            )}
          </div>
        )}

        <form onSubmit={handleSubmit} className="flex gap-3 mb-6">
          <input
            value={input}
            onChange={e => setInput(e.target.value)}
            placeholder="Add a new task or action item..."
            className="flex-1 bg-white/5 border border-white/10 text-white placeholder-gray-600 text-sm px-4 py-3 rounded-xl focus:outline-none focus:border-emerald-500/50 transition-all"
          />
          <button type="submit" className="bg-emerald-600 hover:bg-emerald-500 text-white px-5 py-3 rounded-xl text-sm font-bold transition-all active:scale-95 shadow-lg shadow-emerald-600/20">
            + Add
          </button>
        </form>

        <div className="space-y-2">
          {todos.length === 0 ? (
            <div className="text-center py-16">
              <div className="text-5xl mb-4">✅</div>
              <p className="text-gray-500 text-sm">No tasks yet. Ask the AI to create a plan for you!</p>
            </div>
          ) : (
            todos.map(todo => (
              <div key={todo.id} className={`group flex items-center gap-4 p-4 rounded-xl border transition-all ${
                todo.completed
                  ? 'bg-white/2 border-white/3 opacity-60'
                  : 'glassmorphism border-white/5 hover:border-white/10'
              }`}>
                <button
                  onClick={() => onToggle(todo.id)}
                  className={`w-5 h-5 rounded-full border-2 flex items-center justify-center flex-shrink-0 transition-all ${
                    todo.completed
                      ? 'bg-emerald-500 border-emerald-500'
                      : 'border-gray-600 hover:border-emerald-500'
                  }`}
                >
                  {todo.completed && (
                    <svg className="w-3 h-3 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="3" d="M5 13l4 4L19 7" /></svg>
                  )}
                </button>
                <span className={`flex-1 text-sm ${todo.completed ? 'line-through text-gray-600' : 'text-gray-200'}`}>{todo.text}</span>
                <button
                  onClick={() => onDelete(todo.id)}
                  className="flex-shrink-0 p-1.5 rounded-lg text-gray-600 hover:text-red-400 hover:bg-red-500/10 transition-all"
                  title="Delete task"
                >
                  <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" /></svg>
                </button>
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  );
}

// ─── Health & Wellness OS View ────────────────────────────────────────────────
const MOODS = [
  { emoji: '😄', label: 'Great', color: 'text-emerald-400', bg: 'bg-emerald-500/10 border-emerald-500/30' },
  { emoji: '🙂', label: 'Good', color: 'text-blue-400', bg: 'bg-blue-500/10 border-blue-500/30' },
  { emoji: '😐', label: 'Okay', color: 'text-yellow-400', bg: 'bg-yellow-500/10 border-yellow-500/30' },
  { emoji: '😔', label: 'Low', color: 'text-orange-400', bg: 'bg-orange-500/10 border-orange-500/30' },
  { emoji: '😰', label: 'Stressed', color: 'text-red-400', bg: 'bg-red-500/10 border-red-500/30' },
];

function WellnessView({ moodLog, onLogMood, todos, onAddTask, healthMetrics, onUpdateMetrics }) {
  const [symptom, setSymptom] = useState('');
  const [symptomResult, setSymptomResult] = useState('');
  const [symptomLoading, setSymptomLoading] = useState(false);
  const [medInput, setMedInput] = useState('');
  const [metrics, setMetrics] = useState(healthMetrics);
  const [todayMood, setTodayMood] = useState(null);

  const today = new Date().toLocaleDateString('en-IN');
  const todayEntry = moodLog.find(m => m.date === today);

  const calcBMI = () => {
    const w = parseFloat(metrics.weight);
    const h = parseFloat(metrics.height) / 100;
    if (!w || !h) return null;
    const bmi = (w / (h * h)).toFixed(1);
    const cat = bmi < 18.5 ? { label: 'Underweight', color: 'text-blue-400' }
               : bmi < 25 ? { label: 'Normal', color: 'text-emerald-400' }
               : bmi < 30 ? { label: 'Overweight', color: 'text-yellow-400' }
               : { label: 'Obese', color: 'text-red-400' };
    return { bmi, ...cat };
  };

  const checkSymptom = async () => {
    if (!symptom.trim()) return;
    setSymptomLoading(true);
    setSymptomResult('');
    try {
      const fd = new FormData();
      fd.append('message', symptom);
      fd.append('mode', 'symptom');
      const res = await fetch('/api/chat', { method: 'POST', body: fd });
      const data = await res.json();
      setSymptomResult(data.reply || 'No response received.');
    } catch (err) {
      setSymptomResult('Could not connect to health engine. Please check server.');
    }
    setSymptomLoading(false);
  };

  const addMedReminder = (e) => {
    e.preventDefault();
    if (medInput.trim()) {
      onAddTask(`💊 [Medication] ${medInput.trim()}`);
      setMedInput('');
    }
  };

  const saveMetrics = () => {
    onUpdateMetrics(metrics);
  };

  const bmiResult = calcBMI();
  const medTodos = todos.filter(t => t.text.includes('[Medication]'));

  return (
    <div className="flex-1 overflow-y-auto custom-scrollbar">
      <div className="p-8 max-w-5xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <p className="text-xs font-bold uppercase tracking-[0.2em] text-rose-400 mb-2">Arise AI</p>
          <h1 className="text-4xl font-black text-white mb-2">Health & Wellness OS</h1>
          <p className="text-gray-400 text-sm">Your personal AI health companion. Track mood, check symptoms, and stay on top of your wellness.</p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          
          {/* ── MOOD TRACKER ── */}
          <div className="glassmorphism border border-white/5 rounded-2xl p-6">
            <h2 className="text-white font-bold text-lg mb-1 flex items-center gap-2">
              <span>🌡️</span> Daily Mood Check-In
            </h2>
            <p className="text-gray-500 text-xs mb-5">How are you feeling right now?</p>
            
            {todayEntry ? (
              <div className="text-center py-4">
                <div className="text-5xl mb-2">{todayEntry.emoji}</div>
                <p className="text-gray-300 font-medium">Feeling <span className="text-white font-bold">{todayEntry.label}</span> today</p>
                <p className="text-gray-600 text-xs mt-1">Logged at {todayEntry.time}</p>
              </div>
            ) : (
              <div className="flex gap-3 justify-center flex-wrap">
                {MOODS.map(mood => (
                  <button
                    key={mood.label}
                    onClick={() => { onLogMood(mood.emoji, mood.label); }}
                    className={`flex flex-col items-center gap-1 p-3 rounded-2xl border transition-all hover:scale-110 ${mood.bg}`}
                  >
                    <span className="text-3xl">{mood.emoji}</span>
                    <span className={`text-xs font-semibold ${mood.color}`}>{mood.label}</span>
                  </button>
                ))}
              </div>
            )}

            {/* Mood History */}
            {moodLog.length > 0 && (
              <div className="mt-5 border-t border-white/5 pt-4">
                <p className="text-xs text-gray-600 font-bold uppercase tracking-widest mb-3">Recent History</p>
                <div className="flex gap-2 flex-wrap">
                  {moodLog.slice(0, 10).map((entry, i) => (
                    <div key={i} className="flex flex-col items-center gap-0.5" title={`${entry.label} on ${entry.date}`}>
                      <span className="text-xl">{entry.emoji}</span>
                      <span className="text-[9px] text-gray-700">{entry.date.slice(0,5)}</span>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>

          {/* ── HEALTH METRICS + BMI ── */}
          <div className="glassmorphism border border-white/5 rounded-2xl p-6">
            <h2 className="text-white font-bold text-lg mb-1 flex items-center gap-2">
              <span>📊</span> Health Metrics & BMI
            </h2>
            <p className="text-gray-500 text-xs mb-5">Enter your details to calculate BMI instantly</p>
            
            <div className="grid grid-cols-2 gap-3 mb-4">
              <div>
                <label className="text-xs text-gray-500 font-medium mb-1 block">Weight (kg)</label>
                <input value={metrics.weight} onChange={e => setMetrics({...metrics, weight: e.target.value})}
                  placeholder="e.g. 65" className="w-full bg-white/5 border border-white/10 text-white text-sm px-3 py-2 rounded-xl focus:outline-none focus:border-rose-500/50 transition-all" />
              </div>
              <div>
                <label className="text-xs text-gray-500 font-medium mb-1 block">Height (cm)</label>
                <input value={metrics.height} onChange={e => setMetrics({...metrics, height: e.target.value})}
                  placeholder="e.g. 170" className="w-full bg-white/5 border border-white/10 text-white text-sm px-3 py-2 rounded-xl focus:outline-none focus:border-rose-500/50 transition-all" />
              </div>
              <div>
                <label className="text-xs text-gray-500 font-medium mb-1 block">Age</label>
                <input value={metrics.age} onChange={e => setMetrics({...metrics, age: e.target.value})}
                  placeholder="e.g. 22" className="w-full bg-white/5 border border-white/10 text-white text-sm px-3 py-2 rounded-xl focus:outline-none focus:border-rose-500/50 transition-all" />
              </div>
              <div>
                <label className="text-xs text-gray-500 font-medium mb-1 block">Goal</label>
                <select value={metrics.goal} onChange={e => setMetrics({...metrics, goal: e.target.value})}
                  className="w-full bg-white/5 border border-white/10 text-gray-300 text-sm px-3 py-2 rounded-xl focus:outline-none transition-all">
                  <option value="general">General Fitness</option>
                  <option value="lose">Lose Weight</option>
                  <option value="gain">Gain Muscle</option>
                  <option value="maintain">Maintain</option>
                </select>
              </div>
            </div>

            <button onClick={saveMetrics} className="w-full bg-rose-600/20 hover:bg-rose-600/30 border border-rose-500/30 text-rose-400 font-bold py-2 rounded-xl text-sm transition-all mb-4">
              Calculate BMI
            </button>

            {bmiResult && (
              <div className="text-center bg-black/20 rounded-xl p-4 border border-white/5">
                <p className="text-4xl font-black text-white mb-1">{bmiResult.bmi}</p>
                <p className={`font-bold text-lg ${bmiResult.color}`}>{bmiResult.label}</p>
                <p className="text-xs text-gray-600 mt-1">BMI Index</p>
              </div>
            )}
          </div>

          {/* ── SYMPTOM CHECKER ── */}
          <div className="glassmorphism border border-white/5 rounded-2xl p-6">
            <h2 className="text-white font-bold text-lg mb-1 flex items-center gap-2">
              <span>🩺</span> AI Symptom Checker
            </h2>
            <p className="text-gray-500 text-xs mb-1">Describe your symptoms — AI will analyze them.</p>
            <p className="text-[10px] text-red-400 font-medium mb-4">⚠️ This is NOT a medical diagnosis. Always consult a doctor.</p>

            <textarea
              value={symptom}
              onChange={e => setSymptom(e.target.value)}
              placeholder="e.g. I have a headache, mild fever since 2 days, and throat pain..."
              rows={3}
              className="w-full bg-white/5 border border-white/10 text-white text-sm px-4 py-3 rounded-xl focus:outline-none focus:border-rose-500/50 transition-all resize-none mb-3"
            />
            <button onClick={checkSymptom} disabled={symptomLoading || !symptom.trim()}
              className="w-full bg-rose-600 hover:bg-rose-500 disabled:opacity-50 text-white font-bold py-2.5 rounded-xl text-sm transition-all flex items-center justify-center gap-2">
              {symptomLoading ? (
                <><svg className="w-4 h-4 animate-spin" fill="none" viewBox="0 0 24 24"><circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"/><path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"/></svg>Analyzing...</>
              ) : '🩺 Analyze Symptoms'}
            </button>

            {symptomResult && (
              <div className="mt-4 bg-black/30 border border-white/5 rounded-xl p-4 text-gray-300 text-sm leading-relaxed whitespace-pre-wrap max-h-48 overflow-y-auto custom-scrollbar">
                {symptomResult}
              </div>
            )}
          </div>

          {/* ── MEDICATION REMINDERS ── */}
          <div className="glassmorphism border border-white/5 rounded-2xl p-6">
            <h2 className="text-white font-bold text-lg mb-1 flex items-center gap-2">
              <span>💊</span> Medication Reminders
            </h2>
            <p className="text-gray-500 text-xs mb-5">Add your medicines/supplements — saved to your To-Do Engine</p>

            <form onSubmit={addMedReminder} className="flex gap-2 mb-4">
              <input
                value={medInput}
                onChange={e => setMedInput(e.target.value)}
                placeholder="e.g. Vitamin D 500mg - Morning"
                className="flex-1 bg-white/5 border border-white/10 text-white text-sm px-4 py-2.5 rounded-xl focus:outline-none focus:border-rose-500/50 transition-all"
              />
              <button type="submit" className="bg-rose-600 hover:bg-rose-500 text-white px-4 py-2.5 rounded-xl text-sm font-bold transition-all">+ Add</button>
            </form>

            <div className="space-y-2 max-h-48 overflow-y-auto custom-scrollbar">
              {medTodos.length === 0 ? (
                <p className="text-gray-600 text-sm text-center py-4">No medications added yet.</p>
              ) : (
                medTodos.map(todo => (
                  <div key={todo.id} className={`flex items-center gap-3 p-3 rounded-xl border text-sm ${todo.completed ? 'opacity-40 border-white/3' : 'border-white/5 bg-white/3'}`}>
                    <span className="text-lg">💊</span>
                    <span className={`flex-1 ${todo.completed ? 'line-through text-gray-600' : 'text-gray-300'}`}>
                      {todo.text.replace('💊 [Medication] ', '')}
                    </span> 
                    {todo.completed && <span className="text-emerald-400 text-xs font-bold">✓ Done</span>}
                  </div>
                ))
              )}
            </div>
            <p className="text-xs text-gray-700 mt-3">→ Mark as taken in the <span className="text-emerald-400">To-Do Engine</span></p>
          </div>

        </div>
      </div>
    </div>
  );
}

export default App;
