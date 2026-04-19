import { useState, useEffect, useRef } from 'react';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import { Prism as SyntaxHighlighter } from 'react-syntax-highlighter';
import { vscDarkPlus } from 'react-syntax-highlighter/dist/esm/styles/prism';
import { 
  Menu, Plus, MessageSquare, Settings, HelpCircle, 
  Moon, Sun, Send, Image as ImageIcon, Mic, Sparkles, User, Bot, Square, Trash2, X, Download, RefreshCw, Copy, Check
} from 'lucide-react';

const ALL_SUGGESTIONS = [
  { text: "Create a beautiful React component for a weather card", icon: Sparkles },
  { text: "Explain how self-attention works in transformers", icon: MessageSquare },
  { text: "Write a Python script to scrape a website", icon: Bot },
  { text: "How do I center a div in CSS?", icon: Sparkles },
  { text: "Write a haiku about artificial intelligence", icon: Sparkles },
  { text: "What is the difference between a process and a thread?", icon: HelpCircle },
  { text: "Draft a polite email declining a job offer", icon: MessageSquare },
  { text: "Give me a 3-day itinerary for visiting Tokyo", icon: Sparkles },
  { text: "Explain quantum entanglement to a 5-year old", icon: HelpCircle },
  { text: "Write a SQL query to find the second highest salary", icon: Bot },
  { text: "Suggest some healthy dinner recipes under 30 minutes", icon: Sparkles },
  { text: "How do I fix a merge conflict in Git?", icon: HelpCircle },
];

const CodeBlock = ({ language, codeString, ...props }) => {
  const [copied, setCopied] = useState(false);

  const handleCopy = () => {
    navigator.clipboard.writeText(codeString);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div style={{ position: 'relative', margin: '1.5rem 0', borderRadius: '12px', overflow: 'hidden', border: '1px solid var(--border-color)', boxShadow: 'var(--shadow-sm)' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', backgroundColor: 'var(--sidebar-bg)', padding: '8px 16px', color: 'var(--text-secondary)', fontSize: '0.85rem', borderBottom: '1px solid var(--border-color)', alignItems: 'center' }}>
        <span style={{ fontWeight: '600', letterSpacing: '0.5px', textTransform: 'uppercase' }}>{language || 'text'}</span>
        <button 
          onClick={handleCopy}
          style={{ background: 'transparent', border: 'none', color: copied ? 'var(--accent-color)' : 'var(--text-secondary)', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '6px', fontWeight: '500', transition: 'color 0.2s' }}
        >
          {copied ? <><Check size={14} /> Copied!</> : <><Copy size={14} /> Copy</>}
        </button>
      </div>
      <SyntaxHighlighter
        style={vscDarkPlus}
        language={language}
        PreTag="div"
        customStyle={{ margin: 0, padding: '16px', backgroundColor: 'var(--input-bg)', borderTopLeftRadius: 0, borderTopRightRadius: 0, fontSize: '0.9rem', lineHeight: '1.5', fontFamily: '"JetBrains Mono", "Fira Code", Consolas, Monaco, monospace' }}
        {...props}
      >
        {codeString}
      </SyntaxHighlighter>
    </div>
  );
};

const MessageActions = ({ text, onRegenerate }) => {
  const [copied, setCopied] = useState(false);

  const handleCopy = () => {
    navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="message-actions">
      <button className="icon-btn" title="Copy text" onClick={handleCopy}>
        {copied ? <Check size={16} color="var(--accent-color)" /> : <Copy size={16} />}
      </button>
      <button className="icon-btn" title="Regenerate" onClick={onRegenerate}>
        <RefreshCw size={16} />
      </button>
    </div>
  );
};

import './index.css';

function App() {
  const [isDark, setIsDark] = useState(true);
  const [isSidebarCollapsed, setIsSidebarCollapsed] = useState(false);
  const [input, setInput] = useState('');
  
  // Chat History State
  const [chats, setChats] = useState(() => {
    const saved = localStorage.getItem('dolphin_chats');
    if (saved) {
      try { return JSON.parse(saved); } catch (e) {}
    }
    return [];
  });
  const [currentChatId, setCurrentChatId] = useState(() => {
    return localStorage.getItem('dolphin_current_chat') || null;
  });
  const [messages, setMessages] = useState([]);
  
  const [isTyping, setIsTyping] = useState(false);
  const [model, setModel] = useState('gemma4:e2b-it-q8_0');
  const [models, setModels] = useState(['gemma4:e2b-it-q8_0']);
  
  const [randomSuggestions, setRandomSuggestions] = useState([]);

  const refreshSuggestions = () => {
    const shuffled = [...ALL_SUGGESTIONS].sort(() => 0.5 - Math.random());
    setRandomSuggestions(shuffled.slice(0, 3));
  };

  useEffect(() => {
    refreshSuggestions();
  }, []);
  
  // Settings Modal State
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);
  const [pullProgress, setPullProgress] = useState(null);
  const [pullingModel, setPullingModel] = useState('');
  
  const [selectedImage, setSelectedImage] = useState(null);

  const [hardwareInfo, setHardwareInfo] = useState({
    cpu: navigator.hardwareConcurrency || 'Unknown',
    ram: navigator.deviceMemory ? `${navigator.deviceMemory} GB+` : 'Unknown',
    gpu: 'Detecting...',
    os: navigator.platform || 'Unknown',
    storageTotal: 'Unknown',
    storageUsed: 'Unknown',
    screen: `${window.screen?.width || 0}x${window.screen?.height || 0} (x${window.devicePixelRatio || 1})`
  });

  const messagesEndRef = useRef(null);
  const chatContainerRef = useRef(null);
  const textareaRef = useRef(null);
  const abortControllerRef = useRef(null);
  const pullAbortControllerRef = useRef(null);
  const fileInputRef = useRef(null);
  
  const [userHasScrolledUp, setUserHasScrolledUp] = useState(false);

  const handleImageUpload = (e) => {
    const file = e.target.files[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (event) => {
      const dataUrl = event.target.result;
      const base64 = dataUrl.split(',')[1];
      setSelectedImage({ dataUrl, base64 });
    };
    reader.readAsDataURL(file);
    e.target.value = null; // reset
  };

  const MODEL_SIZES = {
    'llama3': '~4.7 GB',
    'mistral': '~4.1 GB',
    'phi3': '~2.3 GB',
    'gemma': '~5.2 GB',
    'qwen': '~4.5 GB',
    'mixtral': '~26.0 GB',
    'llava': '~4.7 GB',
    'codellama': '~4.8 GB'
  };

  // Save chats to local storage whenever they change
  useEffect(() => {
    localStorage.setItem('dolphin_chats', JSON.stringify(chats));
  }, [chats]);

  // Save current chat ID
  useEffect(() => {
    if (currentChatId) {
      localStorage.setItem('dolphin_current_chat', currentChatId);
    } else {
      localStorage.removeItem('dolphin_current_chat');
    }
  }, [currentChatId]);

  // Sync current messages with current chat
  useEffect(() => {
    if (currentChatId) {
      const chat = chats.find(c => c.id === currentChatId);
      if (chat) {
        setMessages(chat.messages);
      }
    } else {
      setMessages([]);
    }
  }, [currentChatId, chats]);

  // Apply dark mode
  useEffect(() => {
    if (isDark) {
      document.body.classList.add('dark');
    } else {
      document.body.classList.remove('dark');
    }
  }, [isDark]);

  // Fetch available models and system info
  useEffect(() => {
    fetchModels();
    
    // Get GPU info
    try {
      const canvas = document.createElement('canvas');
      const gl = canvas.getContext('webgl') || canvas.getContext('experimental-webgl');
      let gpu = 'Unknown GPU';
      if (gl) {
        const debugInfo = gl.getExtension('WEBGL_debug_renderer_info');
        if (debugInfo) gpu = gl.getParameter(debugInfo.UNMASKED_RENDERER_WEBGL);
      }
      setHardwareInfo(prev => ({ ...prev, gpu }));
    } catch(e) {}

    // Get storage info
    if (navigator.storage && navigator.storage.estimate) {
      navigator.storage.estimate().then(est => {
        setHardwareInfo(prev => ({
          ...prev,
          storageTotal: est.quota ? (est.quota / (1024 ** 3)).toFixed(2) + ' GB' : 'Unknown',
          storageUsed: est.usage ? (est.usage / (1024 ** 3)).toFixed(2) + ' GB' : 'Unknown'
        }));
      });
    }
  }, []);

  const fetchModels = async () => {
    try {
      const response = await fetch('http://127.0.0.1:11434/api/tags');
      if (response.ok) {
        const data = await response.json();
        if (data.models && data.models.length > 0) {
          const modelNames = data.models.map(m => m.name);
          setModels(modelNames);
          if (!modelNames.includes(model) && modelNames.length > 0) {
            setModel(modelNames[0]);
          }
        }
      }
    } catch (error) {
      console.error('Error fetching models:', error);
    }
  };

  const handleScroll = () => {
    if (chatContainerRef.current) {
      const { scrollTop, scrollHeight, clientHeight } = chatContainerRef.current;
      // If the user scrolls up more than 100px from the bottom, they have scrolled up manually
      const isNearBottom = scrollHeight - scrollTop - clientHeight < 100;
      setUserHasScrolledUp(!isNearBottom);
    }
  };

  const scrollToBottom = () => {
    if (!userHasScrolledUp) {
      messagesEndRef.current?.scrollIntoView({ behavior: 'auto' });
    }
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages, isTyping]);

  const handleInput = (e) => {
    setInput(e.target.value);
    if (textareaRef.current) {
      textareaRef.current.style.height = 'auto';
      textareaRef.current.style.height = `${Math.min(textareaRef.current.scrollHeight, 200)}px`;
    }
  };

  const saveMessageToChat = (chatId, newMessages) => {
    setChats(prevChats => {
      const existing = prevChats.find(c => c.id === chatId);
      if (existing) {
        return prevChats.map(c => c.id === chatId ? { ...c, messages: newMessages } : c);
      } else {
        const title = newMessages[0]?.content.substring(0, 30) || 'New Chat';
        return [{ id: chatId, title, messages: newMessages }, ...prevChats];
      }
    });
  };

  const stopGeneration = () => {
    if (abortControllerRef.current) {
      abortControllerRef.current.abort();
      abortControllerRef.current = null;
      setIsTyping(false);
    }
  };

  const regenerateMessage = (index) => {
    if (index === 0) return;
    const userPrompt = messages[index - 1].content;
    const context = messages.slice(0, index - 1);
    handleSubmit(userPrompt, context);
  };

  const handleSubmit = async (overrideInput = null, overrideMessages = null) => {
    const textToSubmit = overrideInput !== null ? overrideInput : input;
    if (!textToSubmit.trim() || isTyping) return;

    let activeChatId = currentChatId;
    if (!activeChatId) {
      activeChatId = Date.now().toString();
      setCurrentChatId(activeChatId);
    }

    const currentMessages = overrideMessages !== null ? overrideMessages : messages;
    const userMessage = { role: 'user', content: textToSubmit.trim() };
    
    if (selectedImage && overrideMessages === null) {
      userMessage.images = [selectedImage.base64];
      userMessage.displayImage = selectedImage.dataUrl;
    }
    
    const newMessagesContext = [...currentMessages, userMessage];
    setMessages(newMessagesContext);
    saveMessageToChat(activeChatId, newMessagesContext);
    
    setInput('');
    setSelectedImage(null);
    setIsTyping(true);
    
    if (textareaRef.current) {
      textareaRef.current.style.height = '44px';
    }

    abortControllerRef.current = new AbortController();

    try {
      // Use current message history for context
      const apiMessages = newMessagesContext.map(msg => {
        const out = { role: msg.role, content: msg.content };
        if (msg.images) {
          out.images = msg.images;
        }
        return out;
      });

      const response = await fetch('http://127.0.0.1:11434/api/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          model: model,
          messages: apiMessages,
          stream: true,
        }),
        signal: abortControllerRef.current.signal
      });

      if (!response.ok) throw new Error('Network response was not ok');

      const reader = response.body.getReader();
      const decoder = new TextDecoder();
      let botContent = '';

      setMessages(prev => {
        const appended = [...prev, { role: 'assistant', content: '' }];
        saveMessageToChat(activeChatId, appended);
        return appended;
      });

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;
        
        const chunk = decoder.decode(value, { stream: true });
        const lines = chunk.split('\n').filter(line => line.trim() !== '');
        
        for (const line of lines) {
          try {
            const data = JSON.parse(line);
            if (data.message && data.message.content) {
              botContent += data.message.content;
              setMessages(prev => {
                const updated = [...prev];
                updated[updated.length - 1] = { role: 'assistant', content: botContent };
                saveMessageToChat(activeChatId, updated);
                return updated;
              });
            }
          } catch (e) {
            console.error('Error parsing JSON:', e);
          }
        }
      }
    } catch (error) {
      if (error.name === 'AbortError') {
        console.log('Generation stopped by user');
      } else {
        console.error('Error:', error);
        setMessages(prev => {
          const updated = [...prev];
          if (updated[updated.length - 1].role === 'assistant' && !updated[updated.length - 1].content) {
            updated[updated.length - 1].content = '**Error:** Failed to connect to local LLM. Ensure Ollama is running.';
          } else if (updated[updated.length - 1].role === 'user') {
            updated.push({ role: 'assistant', content: '**Error:** Failed to connect.' });
          }
          saveMessageToChat(activeChatId, updated);
          return updated;
        });
      }
    } finally {
      setIsTyping(false);
      abortControllerRef.current = null;
    }
  };

  const handleKeyDown = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSubmit();
    }
  };

  const createNewChat = () => {
    setCurrentChatId(null);
    setMessages([]);
    setInput('');
  };

  const deleteChat = (e, id) => {
    e.stopPropagation();
    const updatedChats = chats.filter(c => c.id !== id);
    setChats(updatedChats);
    if (currentChatId === id) {
      setCurrentChatId(null);
      setMessages([]);
    }
  };

  const pullModel = async (modelName) => {
    if (!modelName.trim() || pullingModel) return;
    
    let baseModel = modelName.split(':')[0];
    let sizeEstimate = MODEL_SIZES[baseModel] || 'Unknown size (could be several GBs)';
    
    const confirmPull = window.confirm(`Are you sure you want to pull "${modelName}"?\nStorage required: ${sizeEstimate}\n\nDo you want to continue?`);
    if (!confirmPull) return;

    setPullingModel(modelName);
    setPullProgress('Starting download...');
    
    pullAbortControllerRef.current = new AbortController();
    
    try {
      const response = await fetch('http://127.0.0.1:11434/api/pull', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name: modelName, stream: true }),
        signal: pullAbortControllerRef.current.signal
      });
      
      const reader = response.body.getReader();
      const decoder = new TextDecoder();
      
      while (true) {
        const { done, value } = await reader.read();
        if (done) break;
        
        const chunk = decoder.decode(value, { stream: true });
        const lines = chunk.split('\n').filter(line => line.trim() !== '');
        
        for (const line of lines) {
          try {
            const data = JSON.parse(line);
            if (data.status) {
              let prog = data.status;
              if (data.total && data.completed) {
                const pct = Math.round((data.completed / data.total) * 100);
                const totalGB = (data.total / (1024 * 1024 * 1024)).toFixed(2);
                const completedGB = (data.completed / (1024 * 1024 * 1024)).toFixed(2);
                prog += ` - ${completedGB} GB / ${totalGB} GB (${pct}%)`;
              }
              setPullProgress(prog);
            }
          } catch(e) {}
        }
      }
      setPullProgress('Download complete!');
      setTimeout(() => {
        setPullProgress(null);
        setPullingModel('');
        fetchModels();
      }, 3000);
    } catch (e) {
      if (e.name === 'AbortError') {
        setPullProgress('Pull cancelled by user.');
      } else {
        console.error(e);
        setPullProgress('Error pulling model.');
      }
      setTimeout(() => {
        setPullProgress(null);
        setPullingModel('');
      }, 3000);
    } finally {
      pullAbortControllerRef.current = null;
    }
  };

  const stopPulling = () => {
    if (pullAbortControllerRef.current) {
      pullAbortControllerRef.current.abort();
    }
  };

  const deleteModel = async (modelName) => {
    const confirmDelete = window.confirm(`Are you sure you want to completely delete the model "${modelName}"?`);
    if (!confirmDelete) return;

    try {
      const response = await fetch('http://127.0.0.1:11434/api/delete', {
        method: 'DELETE',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name: modelName })
      });
      if (response.ok) {
        fetchModels();
      } else {
        alert('Failed to delete model.');
      }
    } catch (e) {
      console.error(e);
      alert('Error communicating with local LLM.');
    }
  };

  return (
    <div className="app-container">
      {/* Sidebar Overlay for Mobile */}
      <div className={`sidebar-overlay ${isSidebarCollapsed ? 'hidden' : ''}`} onClick={() => setIsSidebarCollapsed(true)}></div>

      {/* Sidebar */}
      <div className={`sidebar ${isSidebarCollapsed ? 'collapsed' : ''}`}>
        <div className="sidebar-header">
          <button className="menu-btn" onClick={() => setIsSidebarCollapsed(!isSidebarCollapsed)}>
            <Menu size={20} />
          </button>
          {!isSidebarCollapsed && (
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <img src="/logo.jpg" alt="Logo" style={{ width: '24px', height: '24px', objectFit: 'contain', borderRadius: '50%' }} onError={(e) => { e.target.style.display='none'; }} />
              <span className="dolphin-logo-text">DOLPHIN</span>
            </div>
          )}
        </div>

        <button className="new-chat-btn" onClick={createNewChat}>
          <Plus size={20} />
          <span className="new-chat-text">New chat</span>
        </button>

        <div className="recent-chats">
          <div className="recent-chats-title">Recent</div>
          {chats.map(chat => (
            <div 
              key={chat.id} 
              className={`sidebar-item ${currentChatId === chat.id ? 'active' : ''}`}
              onClick={() => setCurrentChatId(chat.id)}
            >
              <MessageSquare size={18} />
              <span className="chat-title">{chat.title}</span>
              <button className="delete-btn" onClick={(e) => deleteChat(e, chat.id)}>
                <Trash2 size={16} />
              </button>
            </div>
          ))}
        </div>

        <div className="sidebar-bottom">
          <div className="sidebar-item" onClick={() => setIsSettingsOpen(true)}>
            <Settings size={18} />
            <span>Settings</span>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="main-content">
        <div className="top-bar">
          <div className="top-bar-left">
            <button 
              className="mobile-menu-btn" 
              onClick={() => setIsSidebarCollapsed(false)}
            >
              <Menu size={20} />
            </button>
            <span className="dolphin-logo-text">DOLPHIN</span>
            <div className="model-selector" onClick={() => setIsSettingsOpen(true)}>
              <span className="model-name">{model}</span>
            </div>
          </div>
          <button className="theme-toggle" onClick={() => setIsDark(!isDark)}>
            {isDark ? <Sun size={20} /> : <Moon size={20} />}
          </button>
        </div>

        <div className="chat-container" ref={chatContainerRef} onScroll={handleScroll}>
          {messages.length === 0 ? (
            <div className="welcome-screen">
              <div style={{ marginBottom: '1rem' }}>
                <img src="/logo.jpg" alt="Dolphin Logo" className="logo-img" style={{ width: '64px', height: '64px' }} onError={(e) => { e.target.style.display='none'; e.target.nextSibling.style.display='block'; }}/>
                <svg style={{ display: 'none', width: '64px', height: '64px', color: 'var(--accent-color)' }} viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                  <path d="M18.5 7.5C18.5 7.5 16 5 12 5C8 5 4.5 8 4.5 12C4.5 12 4.5 15.5 8 18L10 20.5L12 18.5C14 16.5 16.5 14.5 18 12C19.5 9.5 18.5 7.5 18.5 7.5Z" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                </svg>
              </div>
              <h1 className="greeting">
                <span className="greeting-hello">Hello, User.</span>
              </h1>
              <h2 className="greeting-sub">How can I help you today?</h2>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.5rem', marginTop: '2rem' }}>
                <span style={{color: 'var(--text-secondary)'}}>Try asking about...</span>
                <button 
                  onClick={refreshSuggestions}
                  style={{ background: 'transparent', border: 'none', color: 'var(--text-secondary)', cursor: 'pointer', display: 'flex', alignItems: 'center' }}
                  title="Refresh suggestions"
                >
                  <RefreshCw size={16} />
                </button>
              </div>
              <div className="suggestions" style={{ marginTop: '1rem' }}>
                {randomSuggestions.map((sugg, i) => {
                  const Icon = sugg.icon;
                  return (
                    <div key={i} className="suggestion-card" onClick={() => handleSubmit(sugg.text)}>
                      <p>{sugg.text}</p>
                      <div className="suggestion-icon"><Icon size={18} /></div>
                    </div>
                  );
                })}
              </div>
            </div>
          ) : (
            <div className="messages-list">
              {messages.map((msg, index) => (
                <div key={index} className={`message ${msg.role === 'user' ? 'message-user' : 'message-bot'}`}>
                  {msg.role === 'assistant' && (
                    <div className="message-avatar bot-avatar">
                      <img src="/logo.jpg" alt="Dolphin" className="logo-img" onError={(e) => { e.target.style.display='none'; e.target.nextSibling.style.display='block'; }}/>
                      <svg style={{ display: 'none', width: '24px', height: '24px' }} viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                        <path d="M18.5 7.5C18.5 7.5 16 5 12 5C8 5 4.5 8 4.5 12C4.5 12 4.5 15.5 8 18L10 20.5L12 18.5C14 16.5 16.5 14.5 18 12C19.5 9.5 18.5 7.5 18.5 7.5Z" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                      </svg>
                    </div>
                  )}
                  <div className="message-content">
                    {msg.displayImage && (
                      <div style={{ marginBottom: '8px' }}>
                        <img src={msg.displayImage} alt="Attached" style={{ maxWidth: '100%', maxHeight: '300px', borderRadius: '8px' }} />
                      </div>
                    )}
                    {msg.role === 'user' ? (
                      <div>{msg.content}</div>
                    ) : (
                      <div className="markdown-body">
                        <ReactMarkdown 
                          remarkPlugins={[remarkGfm]}
                          components={{
                            code({node, inline, className, children, ...props}) {
                              const match = /language-(\w+)/.exec(className || '');
                              const codeString = String(children).replace(/\n$/, '');
                              return !inline && match ? (
                                <CodeBlock language={match[1]} codeString={codeString} {...props} />
                              ) : (
                                <code className={className} {...props}>
                                  {children}
                                </code>
                              )
                            }
                          }}
                        >
                          {msg.content}
                        </ReactMarkdown>
                        {isTyping && index === messages.length - 1 && (
                          <span className="cursor-blink"></span>
                        )}
                        {!isTyping && msg.role === 'assistant' && (
                          <MessageActions 
                            text={msg.content} 
                            onRegenerate={() => regenerateMessage(index)} 
                          />
                        )}
                      </div>
                    )}
                  </div>
                  {msg.role === 'user' && (
                    <div className="message-avatar">
                      <User size={20} color="var(--text-secondary)" />
                    </div>
                  )}
                </div>
              ))}
              <div ref={messagesEndRef} />
            </div>
          )}
        </div>

        <div className="input-area">
          <div className="input-box" style={{ flexDirection: selectedImage ? 'column' : 'row', alignItems: selectedImage ? 'stretch' : 'flex-end' }}>
            {selectedImage && (
              <div style={{ position: 'relative', alignSelf: 'flex-start', margin: '16px 0 0 16px' }}>
                <img src={selectedImage.dataUrl} alt="Preview" style={{ height: '60px', borderRadius: '8px', border: '1px solid var(--border-color)' }} />
                <button 
                  onClick={() => setSelectedImage(null)}
                  style={{ position: 'absolute', top: '-8px', right: '-8px', background: 'var(--bg-color)', border: '1px solid var(--border-color)', borderRadius: '50%', padding: '2px', cursor: 'pointer', color: 'var(--text-primary)', display: 'flex' }}
                >
                  <X size={14} />
                </button>
              </div>
            )}
            <div style={{ display: 'flex', width: '100%', alignItems: 'center', paddingTop: selectedImage ? '8px' : '0' }}>
              <input 
                type="file" 
                accept="image/*" 
                ref={fileInputRef} 
                style={{ display: 'none' }} 
                onChange={handleImageUpload} 
              />
              <button className="icon-btn" title="Add image" onClick={() => fileInputRef.current?.click()}>
                <ImageIcon size={20} />
              </button>
              <textarea
                ref={textareaRef}
                className="input-field"
                placeholder="Enter a prompt here"
                value={input}
                onChange={handleInput}
                onKeyDown={handleKeyDown}
                rows={1}
              />
              <div className="input-actions">
                <button className="icon-btn" title="Use microphone">
                  <Mic size={20} />
                </button>
              {isTyping ? (
                <button className="icon-btn stop-btn active" onClick={stopGeneration} title="Stop generating">
                  <Square fill="currentColor" size={16} />
                </button>
              ) : (
                <button 
                  className={`icon-btn send-btn ${input.trim() ? 'active' : ''}`} 
                  onClick={() => handleSubmit()}
                  disabled={!input.trim()}
                >
                  <Send size={20} />
                </button>
              )}
            </div>
            </div>
          </div>
        </div>
      </div>

      {/* Settings Modal */}
      {isSettingsOpen && (
        <div className="modal-overlay" onClick={() => setIsSettingsOpen(false)}>
          <div className="modal-content" onClick={e => e.stopPropagation()}>
            <div className="modal-header">
              <h2>Settings</h2>
              <button className="icon-btn" onClick={() => setIsSettingsOpen(false)}>
                <X size={20} />
              </button>
            </div>
            
            <div className="modal-body">
              <div className="settings-section">
                <h3>Installed Models</h3>
                <div className="installed-models-list">
                  {models.map(m => (
                    <div key={m} className={`installed-model-item ${m === model ? 'active' : ''}`}>
                      <span onClick={() => setModel(m)} style={{cursor: 'pointer', flexGrow: 1, fontWeight: m === model ? '500' : 'normal', color: m === model ? 'var(--accent-color)' : 'inherit'}}>{m} {m === model && '(Active)'}</span>
                      <button className="icon-btn delete-model-btn" title="Delete model" onClick={() => deleteModel(m)}>
                        <Trash2 size={16} />
                      </button>
                    </div>
                  ))}
                  {models.length === 0 && <span style={{color: 'var(--text-secondary)'}}>No models installed.</span>}
                </div>
              </div>

              <div className="settings-section">
                <h3>Hardware & System Information</h3>
                <div className="info-grid">
                  <div className="info-item">
                    <span className="info-label">Logical CPU Cores</span>
                    <span className="info-value">{hardwareInfo.cpu}</span>
                  </div>
                  <div className="info-item">
                    <span className="info-label">Estimated RAM</span>
                    <span className="info-value">{hardwareInfo.ram}</span>
                  </div>
                  <div className="info-item" style={{ gridColumn: 'span 2' }}>
                    <span className="info-label">Graphics (GPU)</span>
                    <span className="info-value" style={{fontSize: '0.9rem'}}>{hardwareInfo.gpu}</span>
                  </div>
                  <div className="info-item">
                    <span className="info-label">OS Platform</span>
                    <span className="info-value">{hardwareInfo.os}</span>
                  </div>
                  <div className="info-item">
                    <span className="info-label">Screen Resolution</span>
                    <span className="info-value">{hardwareInfo.screen}</span>
                  </div>
                  <div className="info-item">
                    <span className="info-label">Web Storage Quota</span>
                    <span className="info-value">{hardwareInfo.storageTotal}</span>
                  </div>
                  <div className="info-item">
                    <span className="info-label">Web Storage Used</span>
                    <span className="info-value">{hardwareInfo.storageUsed}</span>
                  </div>
                  <div className="info-item" style={{ gridColumn: 'span 2' }}>
                    <span className="info-label">Ollama Connection</span>
                    <span className="info-value">http://127.0.0.1:11434</span>
                  </div>
                </div>
              </div>

              <div className="settings-section">
                <h3>Install New Models</h3>
                <p className="settings-desc">
                  Pull models directly from Ollama registry. Browse all at <a href="https://ollama.com/library" target="_blank" rel="noreferrer" style={{color: 'var(--accent-color)'}}>ollama.com/library</a>.
                </p>
                
                <div className="pull-model-form">
                  <input 
                    type="text" 
                    id="modelNameInput"
                    placeholder="Enter model name (e.g. llama3)" 
                    className="model-input"
                  />
                  <button 
                    className="pull-btn"
                    disabled={!!pullingModel}
                    onClick={() => {
                      const val = document.getElementById('modelNameInput').value;
                      if(val) pullModel(val);
                    }}
                  >
                    <Download size={16} /> Pull
                  </button>
                </div>

                <div className="popular-models">
                  {['llama3', 'mistral', 'phi3', 'gemma', 'qwen', 'mixtral', 'llava', 'codellama'].map(mName => (
                    <button 
                      key={mName} 
                      className="popular-btn"
                      disabled={!!pullingModel || models.includes(mName + ':latest')}
                      onClick={() => pullModel(mName)}
                    >
                      {mName} {models.includes(mName + ':latest') && '(Installed)'}
                    </button>
                  ))}
                </div>
                
                {pullProgress && (
                  <div className="pull-progress" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <span>{pullProgress}</span>
                    {pullingModel && (
                      <button 
                        onClick={stopPulling} 
                        style={{ background: 'transparent', border: 'none', color: '#d93025', cursor: 'pointer', padding: '4px' }}
                        title="Stop pulling"
                      >
                        <Square fill="currentColor" size={16} />
                      </button>
                    )}
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default App;
