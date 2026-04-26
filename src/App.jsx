import React, { useState, useEffect, useRef } from 'react';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import { Prism as SyntaxHighlighter } from 'react-syntax-highlighter';
import { vscDarkPlus, oneLight } from 'react-syntax-highlighter/dist/esm/styles/prism';
import {
  Menu, Plus, MessageSquare, Settings, HelpCircle,
  Moon, Sun, Send, Image as ImageIcon, Mic, Sparkles, User, Bot, Square, Trash2, X, Download, RefreshCw, Copy, Check, ArrowLeft, Monitor, Search, ChevronUp, ChevronDown,
  Cpu, Shield, ShieldCheck, Activity, Server
} from 'lucide-react';
import './index.css';

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

const SYSTEM_PROMPT = `Role: You are an expert AI Assistant specializing in high-clarity, aesthetically pleasing communication. Your goal is to provide responses that are visually organized, easy to scan, and sophisticated.

Formatting Guidelines:

Visual Hierarchy: Always start with a # Main Heading for the primary topic. Use ## Subheadings to break down different sections.

Structure: Never use walls of text. Use short paragraphs (2-3 sentences max).

Lists & Tables: Use bullet points for features and tables for comparisons or data-heavy information.

Visual Accents: Use relevant emojis at the start of headings to add a splash of color (e.g., 🟢, 💡, 🛠️, 📈). Use horizontal rules --- to separate distinct topics.

Emphasis: Use bolding for key terms and backticks for technical terms or variables.

Callouts: Use > Blockquotes for important notes, tips, or warnings to make them stand out visually.

Color Simulation: Since you output Markdown, use the "green" circle emoji 🟢 or green-themed headers to maintain a consistent "Gemini-style" color palette.

Tone: Professional, clear, and supportive. Ensure the layout looks as good as the information it contains.`;

const PERSONAS = [
  { id: 'default', name: 'General Assistant', icon: Bot, prompt: SYSTEM_PROMPT },
  { id: 'code', name: 'Code Architect', icon: Cpu, prompt: "Role: You are an expert Software Architect and Senior Developer. Provide high-quality, production-ready code with detailed explanations. Follow best practices and focus on performance and security." },
  { id: 'writer', name: 'Creative Writer', icon: Sparkles, prompt: "Role: You are a creative writer and storyteller. Use rich language, metaphors, and focus on engaging narrative and emotional resonance." },
  { id: 'tutor', name: 'Academic Tutor', icon: HelpCircle, prompt: "Role: You are a patient and knowledgeable tutor. Explain concepts clearly, using analogies, and check for understanding at each step." },
  { id: 'executive', name: 'Executive Suite', icon: ShieldCheck, prompt: "Role: You are a high-level executive assistant. Provide concise, actionable summaries, bulleted takeaways, and clear next steps. Focus on efficiency." }
];

const CodeBlock = ({ language, codeString, isDark, ...props }) => {
  const [copied, setCopied] = useState(false);

  const handleCopy = () => {
    navigator.clipboard.writeText(codeString);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleDownload = () => {
    const element = document.createElement("a");
    const file = new Blob([codeString], { type: 'text/plain' });
    element.href = URL.createObjectURL(file);
    element.download = `code-${Date.now()}.${language || 'txt'}`;
    document.body.appendChild(element);
    element.click();
    document.body.removeChild(element);
  };

  const handlePreview = () => {
    const previewWindow = window.open('', '_blank');
    let content = codeString;
    
    if (language === 'html' || !language) {
      // Direct HTML
    } else if (language === 'css') {
      content = `<style>${codeString}</style><h1>CSS Preview</h1><p>The styles have been applied.</p>`;
    } else if (language === 'javascript' || language === 'js') {
      content = `<h1>JavaScript Preview</h1><p>Check the console (F12) for output.</p><script>${codeString}<\/script>`;
    } else {
      content = `<h1>${language} Code</h1><pre>${codeString}</pre>`;
    }

    previewWindow.document.write(`
      <!DOCTYPE html>
      <html>
        <head>
          <title>Dolphin Code Preview</title>
          <style>
            body { font-family: sans-serif; padding: 20px; background: #fff; color: #333; }
            pre { background: #f4f4f4; padding: 15px; border-radius: 8px; overflow: auto; }
          </style>
        </head>
        <body>${content}</body>
      </html>
    `);
    previewWindow.document.close();
  };

  const showPreview = ['html', 'css', 'javascript', 'js'].includes(language?.toLowerCase());

  return (
    <div className={`code-block-container ${isDark ? 'dark-code' : 'light-code'}`}>
      <div className="code-block-header">
        <span className="code-lang">{language || 'text'}</span>
        <div className="code-header-actions">
          {showPreview && (
            <button onClick={handlePreview} className="code-block-action-btn" title="Live Preview">
              <Sparkles size={14} />
            </button>
          )}
          <button onClick={handleDownload} className="code-block-action-btn" title="Download">
            <Download size={14} />
          </button>

          <button
            onClick={handleCopy}
            className={`code-block-action-btn ${copied ? 'copied' : ''}`}
            title="Copy"
          >
            {copied ? <Check size={14} /> : <Copy size={14} />}
          </button>
        </div>
      </div>
      <SyntaxHighlighter
        style={isDark ? vscDarkPlus : oneLight}
        language={language}
        PreTag="div"
        customStyle={{
          margin: 0,
          padding: '20px',
          backgroundColor: 'transparent',
          fontSize: '0.95rem',
          lineHeight: '1.7',
          fontFamily: 'var(--font-mono)'
        }}
        {...props}
      >
        {codeString}
      </SyntaxHighlighter>
    </div>
  );
};

const HighlightText = ({ text, query }) => {
  const safeText = text ? String(text) : '';
  const searchTerm = query ? String(query).trim() : '';

  if (!searchTerm || !safeText) return <span>{safeText}</span>;

  let parts = [];
  try {
    const escaped = searchTerm.replace(/[-[\]{}()*+?.,\\^$|#\s]/g, '\\$&');
    const regex = new RegExp(`(${escaped})`, 'gi');
    parts = safeText.split(regex);
  } catch (err) {
    return <span>{safeText}</span>;
  }

  return (
    <span>
      {parts.map((part, i) => {
        const isMatch = part.toLowerCase() === searchTerm.toLowerCase();
        return isMatch ? (
          <span key={i} className="search-highlight">{part}</span>
        ) : (
          <span key={i}>{part}</span>
        );
      })}
    </span>
  );
};

const ProcessChildren = (children, query) => {
  if (!children) return children;
  return React.Children.map(children, (child) => {
    if (typeof child === 'string') {
      return <HighlightText text={child} query={query} />;
    }
    return child;
  });
};

const MessageActions = ({ text, onRegenerate, onReact, onEdit, reactions = [], showRegenerate = true, showEdit = false }) => {
  const [copied, setCopied] = useState(false);
  const [showPicker, setShowPicker] = useState(false);
  const [isSpeaking, setIsSpeaking] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [editValue, setEditValue] = useState(text);

  const handleCopy = () => {
    navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleSaveEdit = () => {
    onEdit(editValue);
    setIsEditing(false);
  };


  const handleSpeak = () => {
    if (isSpeaking) {
      window.speechSynthesis.cancel();
      setIsSpeaking(false);
      return;
    }

    const utterance = new SpeechSynthesisUtterance(text);
    utterance.onend = () => setIsSpeaking(false);
    utterance.onerror = () => setIsSpeaking(false);
    setIsSpeaking(true);
    window.speechSynthesis.speak(utterance);
  };

  const emojiList = ['👍', '❤️', '🔥', '👏', '💡', '🤔', '🚀'];

  return (
    <div className="message-actions">
      {isEditing ? (
        <div className="edit-message-container">
          <textarea 
            className="edit-message-input" 
            value={editValue} 
            onChange={(e) => setEditValue(e.target.value)}
            rows={Math.max(2, editValue.split('\n').length)}
          />
          <div className="edit-actions">
            <button className="save-btn" onClick={handleSaveEdit}>Save & Submit</button>
            <button className="cancel-btn" onClick={() => setIsEditing(false)}>Cancel</button>
          </div>
        </div>
      ) : (
        <>
          <div className="reactions-display">
            {reactions.map((r, i) => (
              <span key={i} className="reaction-badge" title="Remove reaction" onClick={() => onReact(r)}>
                {r}
              </span>
            ))}
          </div>
          <div className="action-buttons-group">
            {showEdit && (
              <button className="icon-btn" onClick={() => setIsEditing(true)} title="Edit message">
                <Plus size={14} style={{ transform: 'rotate(45deg)' }} />
              </button>
            )}
            <button 
              className={`icon-btn ${isSpeaking ? 'active-accent' : ''}`} 
              onClick={handleSpeak} 
              title={isSpeaking ? "Stop reading" : "Read aloud"}
            >
              {isSpeaking ? <Bot size={16} className="spin" /> : <Mic size={16} />}
            </button>
            <div className="reaction-picker-container">


          <button className="icon-btn" onClick={() => setShowPicker(!showPicker)} title="Add reaction">
            <Plus size={14} />
          </button>
          {showPicker && (
            <div className="emoji-picker">
              {emojiList.map(emoji => (
                <button 
                  key={emoji} 
                  className="emoji-btn" 
                  onClick={() => { onReact(emoji); setShowPicker(false); }}
                >
                  {emoji}
                </button>
              ))}
            </div>
          )}
        </div>
        <button className={`icon-btn ${copied ? 'copied' : ''}`} title="Copy text" onClick={handleCopy}>
          {copied ? <Check size={16} color="#4ade80" /> : <Copy size={16} />}
        </button>
        {showRegenerate && onRegenerate && (
          <button className="icon-btn" title="Regenerate" onClick={onRegenerate}>
            <RefreshCw size={16} />
          </button>
        )}
      </div>
    </div>
  );
};


function App() {
  const [themeMode, setThemeMode] = useState(() => localStorage.getItem('dolphin_theme_mode') || 'system');
  const [pullingModel, setPullingModel] = useState('');
  const [isDark, setIsDark] = useState(true);
  const [isSidebarCollapsed, setIsSidebarCollapsed] = useState(false);

  useEffect(() => {
    localStorage.setItem('dolphin_theme_mode', themeMode);

    const applyTheme = () => {
      if (themeMode === 'system') {
        setIsDark(window.matchMedia('(prefers-color-scheme: dark)').matches);
      } else {
        setIsDark(themeMode === 'dark');
      }
    };

    applyTheme();

    if (themeMode === 'system') {
      const mediaQuery = window.matchMedia('(prefers-color-scheme: dark)');
      const listener = (e) => setIsDark(e.matches);
      mediaQuery.addEventListener('change', listener);
      return () => mediaQuery.removeEventListener('change', listener);
    }
  }, [themeMode]);


  // Chat History State
  const [chats, setChats] = useState(() => {
    const saved = localStorage.getItem('dolphin_chats');
    if (saved) {
      try { return JSON.parse(saved); } catch (_e) { }
    }
    return [];
  });
  const [currentChatId, setCurrentChatId] = useState(() => {
    return localStorage.getItem('dolphin_current_chat') || null;
  });
  const [messages, setMessages] = useState([]);

  const [chatSearchQuery, setChatSearchQuery] = useState('');
  const [searchMatchIndex, setSearchMatchIndex] = useState(0);
  const [totalMatches, setTotalMatches] = useState(0);
  const [isHeaderSearchActive, setIsHeaderSearchActive] = useState(false);
  const [input, setInput] = useState('');
  const searchInputRef = useRef(null);

  useEffect(() => {
    if (isHeaderSearchActive && searchInputRef.current) {
      setTimeout(() => searchInputRef.current.focus(), 50);
    }
  }, [isHeaderSearchActive]);

  useEffect(() => {
    setSearchMatchIndex(0);
  }, [chatSearchQuery, currentChatId]);

  const [isTyping, setIsTyping] = useState(false);
  const [model, setModel] = useState('Detecting...');
  const [models, setModels] = useState([]);
  const modelRef = useRef(model);

  // Keep modelRef in sync with model state
  useEffect(() => {
    modelRef.current = model;
  }, [model]);

  const [randomSuggestions, setRandomSuggestions] = useState([]);
  const [isRefreshingSuggestions, setIsRefreshingSuggestions] = useState(false);
  const [suggestionsHistory, setSuggestionsHistory] = useState([]);
  const [historyIndex, setHistoryIndex] = useState(-1);
  
  // Phase 1 States
  const [currentPersonaId, setCurrentPersonaId] = useState(() => localStorage.getItem('dolphin_current_persona') || 'default');
  const [isPersonaDropdownOpen, setIsPersonaDropdownOpen] = useState(false);
  const [generationStats, setGenerationStats] = useState({ tps: 0, words: 0, time: 0 });
  const [isListening, setIsListening] = useState(false);
  const [attachedFiles, setAttachedFiles] = useState([]);
  
  // Phase 4 States
  const [folders, setFolders] = useState(() => {
    const saved = localStorage.getItem('dolphin_folders');
    return saved ? JSON.parse(saved) : [];
  });
  const [activeFolderId, setActiveFolderId] = useState(null);

  useEffect(() => {
    localStorage.setItem('dolphin_folders', JSON.stringify(folders));
  }, [folders]);

  const createFolder = () => {
    const name = prompt("Enter folder name:");
    if (!name) return;
    const newFolder = { id: Date.now().toString(), name, chatIds: [] };
    setFolders(prev => [...prev, newFolder]);
  };

  const moveChatToFolder = (chatId, folderId) => {
    setFolders(prev => prev.map(f => {
      // Remove from all folders first
      const updatedChatIds = f.chatIds.filter(id => id !== chatId);
      // Add to target folder
      if (f.id === folderId) {
        return { ...f, chatIds: [...updatedChatIds, chatId] };
      }
      return { ...f, chatIds: updatedChatIds };
    }));
  };


  const exportChat = () => {
    if (!messages.length) return;
    const content = messages.map(m => `**${m.role.toUpperCase()}**: ${m.content}`).join('\n\n---\n\n');
    const blob = new Blob([content], { type: 'text/markdown' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `dolphin-chat-${Date.now()}.md`;
    a.click();
  };

  const handleMessageEdit = (index, newContent) => {
    const updatedMessages = messages.slice(0, index);
    handleSubmit(newContent, updatedMessages);
  };


  const startListening = () => {
    const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
    if (!SpeechRecognition) {
      alert("Your browser does not support Speech Recognition.");
      return;
    }

    const recognition = new SpeechRecognition();
    recognition.lang = 'en-US';
    recognition.interimResults = false;
    recognition.maxAlternatives = 1;

    recognition.onstart = () => setIsListening(true);
    recognition.onend = () => setIsListening(false);
    recognition.onerror = () => setIsListening(false);

    recognition.onresult = (event) => {
      const transcript = event.results[0][0].transcript;
      setInput(prev => prev + (prev ? ' ' : '') + transcript);
    };

    recognition.start();
  };


  useEffect(() => {
    localStorage.setItem('dolphin_current_persona', currentPersonaId);
  }, [currentPersonaId]);

  const activePersona = PERSONAS.find(p => p.id === currentPersonaId) || PERSONAS[0];

  const handleReaction = (chatId, messageIndex, emoji) => {
    setChats(prev => prev.map(chat => {
      if (chat.id === chatId) {
        const newMessages = [...chat.messages];
        const msg = { ...newMessages[messageIndex] };
        const reactions = msg.reactions || [];
        
        if (reactions.includes(emoji)) {
          msg.reactions = reactions.filter(r => r !== emoji);
        } else {
          msg.reactions = [...reactions, emoji];
        }
        
        newMessages[messageIndex] = msg;
        return { ...chat, messages: newMessages };
      }
      return chat;
    }));
  };


  const goBackSuggestions = () => {
    if (historyIndex > 0) {
      const prevIndex = historyIndex - 1;
      setHistoryIndex(prevIndex);
      setRandomSuggestions(suggestionsHistory[prevIndex]);
    }
  };



  // Helper to add history and update state
  const updateSuggestions = (newSugg) => {
    setRandomSuggestions(newSugg);
    setSuggestionsHistory(prev => [...prev, newSugg]);
    setHistoryIndex(prev => prev + 1);
  };

  // Refined refreshSuggestions to use helper
  const refreshSuggestions = async () => {
    if (isRefreshingSuggestions) return;
    setIsRefreshingSuggestions(true);

    try {
      if (model && !['Detecting...', 'No model running', 'Ollama not running'].includes(model)) {
        const themes = ["productivity", "creative writing", "coding", "philosophy", "science", "daily life", "future tech", "humor", "learning"];
        const randomTheme = themes[Math.floor(Math.random() * themes.length)];
        
        const response = await fetch('http://127.0.0.1:11434/api/generate', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            model: model,
            prompt: `Generate 3 unique, creative, and very short (max 12 words) conversation starters or tasks for an AI assistant. Focus on the theme: ${randomTheme}. Avoid repeats. Return ONLY a JSON array of 3 strings.`,
            stream: false,
            format: 'json',
            options: {
              temperature: 0.9,
              top_p: 0.95
            }
          })
        });

        if (response.ok) {
          const data = await response.json();
          let suggestions;
          try { suggestions = JSON.parse(data.response); } catch (e) { suggestions = data.response; }

          if (Array.isArray(suggestions) && suggestions.length >= 3) {
            const icons = [Sparkles, MessageSquare, Bot, HelpCircle];
            const formatted = suggestions.slice(0, 3).map(text => ({
              text: typeof text === 'string' ? text : text.text || "New Suggestion",
              icon: icons[Math.floor(Math.random() * icons.length)]
            }));
            updateSuggestions(formatted);
            setIsRefreshingSuggestions(false);
            return;
          }
        }
      }
    } catch (error) {
      console.error('Error generating suggestions:', error);
    }

    const shuffled = [...ALL_SUGGESTIONS].sort(() => 0.5 - Math.random());
    const final = shuffled.slice(0, 3);
    updateSuggestions(final);
    setIsRefreshingSuggestions(false);
  };

  useEffect(() => {
    refreshSuggestions();
  }, []);

  // Settings View State
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);
  const [settingsTab, setSettingsTab] = useState('profile');
  const [userName, setUserName] = useState(() => localStorage.getItem('dolphin_user_name') || 'User');
  const [userRole, setUserRole] = useState(() => localStorage.getItem('dolphin_user_role') || 'AI Enthusiast');
  const [userBio, setUserBio] = useState(() => localStorage.getItem('dolphin_user_bio') || 'Passionate about exploring the frontiers of artificial intelligence.');
  const [userEmail, setUserEmail] = useState(() => localStorage.getItem('dolphin_user_email') || 'user@example.com');
  const [userAvatar, setUserAvatar] = useState(() => localStorage.getItem('dolphin_user_avatar') || null);
  const [assistantAvatar, setAssistantAvatar] = useState(() => localStorage.getItem('dolphin_assistant_avatar') || null);

  useEffect(() => {
    localStorage.setItem('dolphin_user_name', userName);
    localStorage.setItem('dolphin_user_role', userRole);
    localStorage.setItem('dolphin_user_bio', userBio);
    localStorage.setItem('dolphin_user_email', userEmail);
    if (userAvatar) localStorage.setItem('dolphin_user_avatar', userAvatar);
    if (assistantAvatar) localStorage.setItem('dolphin_assistant_avatar', assistantAvatar);
  }, [userName, userRole, userBio, userEmail, userAvatar, assistantAvatar]);

  const [isModelDropdownOpen, setIsModelDropdownOpen] = useState(false);
  const [pullProgress, setPullProgress] = useState(null);
  // Intelligence & Settings States
  const [temperature, setTemperature] = useState(() => Number(localStorage.getItem('dolphin_temp')) || 0.7);
  const [contextLimit, setContextLimit] = useState(() => Number(localStorage.getItem('dolphin_context')) || 2048);
  const [ollamaVersion, setOllamaVersion] = useState('Checking...');
  const [apiStatus, setApiStatus] = useState('checking'); // 'online', 'offline'

  useEffect(() => {
    localStorage.setItem('dolphin_temp', temperature);
    localStorage.setItem('dolphin_context', contextLimit);
  }, [temperature, contextLimit]);

  useEffect(() => {
    const checkSystem = async () => {
      try {
        const res = await fetch('http://localhost:11434/api/tags');
        if (res.ok) {
          setApiStatus('online');
          // Ollama version isn't in /tags usually, but we can assume connection is good.
          // For real version, we'd use /api/version if available.
          const verRes = await fetch('http://localhost:11434/api/version');
          if (verRes.ok) {
            const verData = await verRes.json();
            setOllamaVersion(verData.version);
          }
        } else {
          setApiStatus('offline');
        }
      } catch (e) {
        setApiStatus('offline');
      }
    };
    checkSystem();
  }, []);
  const [accentColor, setAccentColor] = useState(() => {
    return localStorage.getItem('dolphin_accent_color') || '#34a853';
  });

  const hexToRgb = (hex) => {
    const result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
    return result ? `${parseInt(result[1], 16)}, ${parseInt(result[2], 16)}, ${parseInt(result[3], 16)}` : '52, 168, 83';
  };

  useEffect(() => {
    localStorage.setItem('dolphin_accent_color', accentColor);
    document.documentElement.style.setProperty('--accent-theme-color', accentColor);
    document.documentElement.style.setProperty('--accent-color-rgb', hexToRgb(accentColor));
  }, [accentColor]);

  // Auto-switch to first matching chat when searching
  useEffect(() => {
    if (chatSearchQuery.trim() && chats.length > 0) {
      const query = chatSearchQuery.toLowerCase();

      // Check if current chat already has a match
      const currentChat = chats.find(c => c.id === currentChatId);
      const currentHasMatch = currentChat && (
        (currentChat.title || '').toLowerCase().includes(query) ||
        (currentChat.messages || []).some(m => (m.content || '').toLowerCase().includes(query))
      );

      if (!currentHasMatch) {
        // Find first chat that HAS a match
        const firstMatch = chats.find(c =>
          (c.title || '').toLowerCase().includes(query) ||
          (c.messages || []).some(m => (m.content || '').toLowerCase().includes(query))
        );
        if (firstMatch && firstMatch.id !== currentChatId) {
          setCurrentChatId(firstMatch.id);
        }
      }
    }
  }, [chatSearchQuery]);

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

  const isModelValid = model && !['Detecting...', 'No model running', 'Ollama not running'].includes(model);

  const handleFileUpload = (e) => {
    const files = Array.from(e.target.files);
    files.forEach(file => {
      if (file.type.startsWith('image/')) {
        const reader = new FileReader();
        reader.onload = (event) => {
          const dataUrl = event.target.result;
          const base64 = dataUrl.split(',')[1];
          setSelectedImage({ dataUrl, base64 });
        };
        reader.readAsDataURL(file);
      } else {
        const reader = new FileReader();
        reader.onload = (event) => {
          setAttachedFiles(prev => [...prev, { name: file.name, content: event.target.result }]);
        };
        reader.readAsText(file);
      }
    });
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

  // Auto-scroll to search matches
  useEffect(() => {
    if (chatSearchQuery.trim()) {
      const timer = setTimeout(() => {
        const matches = document.querySelectorAll('.messages-list .search-highlight');
        setTotalMatches(matches.length);

        if (matches.length > 0) {
          // Remove active class from all
          matches.forEach(m => m.classList.remove('active'));

          // Get safe index
          const idx = Math.abs(searchMatchIndex % matches.length);
          const currentMatch = matches[idx];

          if (currentMatch) {
            currentMatch.classList.add('active');
            currentMatch.scrollIntoView({ behavior: 'smooth', block: 'center' });
          }
        }
      }, 100);
      return () => clearTimeout(timer);
    } else {
      setTotalMatches(0);
    }
  }, [chatSearchQuery, currentChatId, searchMatchIndex]);

  // Apply dark mode
  useEffect(() => {
    if (isDark) {
      document.body.classList.add('dark');
    } else {
      document.body.classList.remove('dark');
    }
  }, [isDark]);

  // Fetch models — defined before the useEffect that calls it
  const fetchModels = async () => {
    try {
      const response = await fetch('http://127.0.0.1:11434/api/tags');
      if (response.ok) {
        const data = await response.json();
        const modelNames = (data.models || []).map(m => m.name);
        setModels(modelNames);

        if (modelNames.length > 0) {
          const currentModel = modelRef.current;
          if (currentModel === 'Detecting...' || !modelNames.includes(currentModel)) {
            setModel(modelNames[0]);
          }
        } else {
          setModel('No model running');
        }
      } else {
        setModels([]);
        setModel('No model running');
      }
    } catch (error) {
      console.error('Error fetching models:', error);
      setModels([]);
      setModel('Ollama not running');
    }
  };

  // Fetch available models and system info on mount
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
    } catch (_gpuErr) { /* silent */ }

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

  const handleScroll = () => {
    if (chatContainerRef.current) {
      const { scrollTop, scrollHeight, clientHeight } = chatContainerRef.current;
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
    // eslint-disable-next-line react-hooks/exhaustive-deps
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
    let finalInput = textToSubmit.trim();
    
    if (attachedFiles.length > 0) {
      const fileContext = attachedFiles.map(f => `FILE: ${f.name}\nCONTENT: ${f.content}`).join('\n\n');
      finalInput = `Document Context:\n${fileContext}\n\nUser Question: ${finalInput}`;
    }

    const userMessage = { role: 'user', content: overrideInput !== null ? overrideInput : input.trim() };


    if (selectedImage && overrideMessages === null) {
      userMessage.images = [selectedImage.base64];
      userMessage.displayImage = selectedImage.dataUrl;
    }

    const newMessagesContext = [...currentMessages, userMessage];
    setMessages(newMessagesContext);
    saveMessageToChat(activeChatId, newMessagesContext);

    setInput('');
    setSelectedImage(null);
    setAttachedFiles([]);
    setIsTyping(true);


    if (textareaRef.current) {
      textareaRef.current.style.height = '44px';
    }

    abortControllerRef.current = new AbortController();

    try {
      const dynamicSystemPrompt = `${activePersona.prompt}\n\nUser Context:\n- Name: ${userName}\n- Role: ${userRole}\n- Bio: ${userBio}`;
      const apiMessages = [
        { role: 'system', content: dynamicSystemPrompt },

        ...newMessagesContext.map(msg => {
          const out = { role: msg.role, content: msg.content };
          if (msg.images) {
            out.images = msg.images;
          }
          return out;
        })
      ];

      const response = await fetch('http://127.0.0.1:11434/api/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          model: modelRef.current,
          messages: apiMessages,
          stream: true,
        }),
        signal: abortControllerRef.current.signal
      });

      if (!response.ok) throw new Error('Network response was not ok');

      const reader = response.body.getReader();
      const decoder = new TextDecoder();
      let botContent = '';
      let startTime = Date.now();
      let chunkCount = 0;

      setMessages(prev => {
        const appended = [...prev, { role: 'assistant', content: '', stats: { tps: 0, words: 0 } }];
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
              chunkCount++;
              
              const elapsed = (Date.now() - startTime) / 1000;
              const tps = elapsed > 0 ? (chunkCount / elapsed).toFixed(1) : 0;
              const words = botContent.trim().split(/\s+/).length;

              setMessages(prev => {
                const updated = [...prev];
                updated[updated.length - 1] = { 
                  role: 'assistant', 
                  content: botContent,
                  stats: { tps, words, time: elapsed.toFixed(1) }
                };
                saveMessageToChat(activeChatId, updated);
                return updated;
              });
              
              setGenerationStats({ tps, words, time: elapsed.toFixed(1) });
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
          } catch (_parseErr) { /* silent JSON parse error */ }
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
      {/* Animated Brand */}
      <div className={`animated-brand ${isSidebarCollapsed ? 'brand-chat' : 'brand-sidebar'}`}>
        <img src="/logo.jpg" alt="Logo" className="logo-img" onError={(e) => { e.target.style.display = 'none'; }} style={{ width: '24px', height: '24px', objectFit: 'contain', borderRadius: '50%' }} />
        <span className="dolphin-logo-text">DOLPHIN</span>
      </div>

      {/* Sidebar Overlay for Mobile */}
      <div className={`sidebar-overlay ${isSidebarCollapsed ? 'hidden' : ''}`} onClick={() => setIsSidebarCollapsed(true)}></div>

      {/* Sidebar */}
      <div className={`sidebar ${isSidebarCollapsed ? 'collapsed' : ''}`}>
        <div className="sidebar-header">
          <button className="menu-btn" onClick={() => setIsSidebarCollapsed(!isSidebarCollapsed)}>
            <Menu size={20} />
          </button>
        </div>

        <button className="new-chat-btn" onClick={() => { createNewChat(); setIsSettingsOpen(false); }}>
          <Plus size={20} />
          <span className="new-chat-text">New chat</span>
        </button>

        <div className={`animated-search ${isSidebarCollapsed ? (isHeaderSearchActive ? 'search-header' : 'search-collapsed') : 'search-sidebar'}`} onClick={() => isSidebarCollapsed && !isHeaderSearchActive && setIsHeaderSearchActive(true)}>
          <Search size={16} className="search-icon-sidebar" />
          <input
            ref={searchInputRef}
            type="text"
            placeholder="Search chats..."
            value={chatSearchQuery}
            onChange={(e) => setChatSearchQuery(e.target.value)}
            className="sidebar-search-input"
            onFocus={() => isSidebarCollapsed && setIsHeaderSearchActive(true)}
          />
          {isHeaderSearchActive && (
            <button className="close-search-btn" onClick={(e) => { e.stopPropagation(); setIsHeaderSearchActive(false); setChatSearchQuery(''); }}>
              <X size={14} />
            </button>
          )}
          {chatSearchQuery && totalMatches > 0 && (
            <div className="search-nav-controls">
              <span className="search-count">{searchMatchIndex + 1} / {totalMatches}</span>
              <button
                className="search-nav-btn"
                onClick={(e) => { e.stopPropagation(); setSearchMatchIndex(prev => (prev - 1 + totalMatches) % totalMatches); }}
                title="Previous match"
              >
                <ChevronUp size={14} />
              </button>
              <button
                className="search-nav-btn"
                onClick={(e) => { e.stopPropagation(); setSearchMatchIndex(prev => (prev + 1) % totalMatches); }}
                title="Next match"
              >
                <ChevronDown size={14} />
              </button>
            </div>
          )}
          {isHeaderSearchActive && chatSearchQuery && (
            <div className="search-results-pills">
              {chats.filter(c => {
                const query = chatSearchQuery.toLowerCase();
                return (c.title || '').toLowerCase().includes(query) ||
                  (c.messages || []).some(m => (m.content || '').toLowerCase().includes(query));
              }).slice(0, 5).map(chat => (
                <div
                  key={chat.id}
                  className="search-result-pill"
                  onClick={(e) => {
                    e.stopPropagation();
                    setCurrentChatId(chat.id);
                    // Search remains active and expanded as requested
                  }}
                >
                  <MessageSquare size={14} />
                  <span className="pill-text">
                    <HighlightText text={chat.title} query={chatSearchQuery} />
                  </span>
                </div>
              ))}
            </div>
          )}
        </div>

        <div className="recent-chats">
          <div className="recent-chats-header">
            <div className="recent-chats-title">Recent</div>
            <button className="icon-btn tiny-btn" onClick={createFolder} title="Create Folder">
              <Plus size={14} />
            </button>
          </div>

          {/* Folders */}
          {folders.map(folder => (
            <div key={folder.id} className="folder-container">
              <div 
                className={`sidebar-item folder-item ${activeFolderId === folder.id ? 'active' : ''}`}
                onClick={() => setActiveFolderId(activeFolderId === folder.id ? null : folder.id)}
              >
                <Plus size={16} style={{ transform: activeFolderId === folder.id ? 'rotate(45deg)' : 'none' }} />
                <span className="chat-title">{folder.name}</span>
                <span className="folder-count">{folder.chatIds.length}</span>
              </div>
              
              {activeFolderId === folder.id && (
                <div className="folder-contents">
                  {chats.filter(c => folder.chatIds.includes(c.id)).map(chat => (
                    <div
                      key={chat.id}
                      className={`sidebar-item sub-item ${currentChatId === chat.id ? 'active' : ''}`}
                      onClick={() => { setCurrentChatId(chat.id); setIsSettingsOpen(false); }}
                    >
                      <MessageSquare size={16} />
                      <span className="chat-title">{chat.title}</span>
                      <button className="delete-btn" onClick={(e) => moveChatToFolder(chat.id, null)}>
                        <X size={14} />
                      </button>
                    </div>
                  ))}
                </div>
              )}
            </div>
          ))}

          {/* Uncategorized Chats */}
          {chats.filter(c => {
            const query = chatSearchQuery.toLowerCase();
            const isInFolder = folders.some(f => f.chatIds.includes(c.id));
            if (isInFolder) return false;
            
            const titleMatch = (c.title || '').toLowerCase().includes(query);
            const contentMatch = (c.messages || []).some(m => (m.content || '').toLowerCase().includes(query));
            return titleMatch || contentMatch;
          }).map(chat => (
            <div
              key={chat.id}
              className={`sidebar-item ${currentChatId === chat.id ? 'active' : ''}`}
              onClick={() => { setCurrentChatId(chat.id); setIsSettingsOpen(false); }}
              onDragOver={(e) => e.preventDefault()}
              onDrop={(e) => {
                const folderId = e.target.closest('.folder-item')?.dataset.id;
                if (folderId) moveChatToFolder(chat.id, folderId);
              }}
            >
              <MessageSquare size={18} />
              <span className="chat-title">
                <HighlightText text={chat.title} query={chatSearchQuery} />
              </span>
              <div className="sidebar-item-actions">
                <select 
                  className="folder-move-select"
                  onChange={(e) => moveChatToFolder(chat.id, e.target.value)}
                  onClick={(e) => e.stopPropagation()}
                  defaultValue=""
                >
                  <option value="" disabled>Move</option>
                  {folders.map(f => <option key={f.id} value={f.id}>{f.name}</option>)}
                </select>
                <button className="delete-btn" onClick={(e) => deleteChat(e, chat.id)}>
                  <Trash2 size={16} />
                </button>
              </div>
            </div>
          ))}
        </div>


        <div className="sidebar-bottom">
          <div className={`sidebar-item ${isSettingsOpen ? 'active' : ''}`} onClick={() => setIsSettingsOpen(!isSettingsOpen)}>
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
            <div className={`brand-spacer ${isSidebarCollapsed ? 'expanded' : 'collapsed'}`}></div>
          </div>

            <div className="top-bar-center">
              <div className="model-selector-group">
                <div className="model-selector-wrapper">
                  <div className="model-selector" onClick={() => setIsModelDropdownOpen(!isModelDropdownOpen)}>
                    <Bot size={14} className="model-icon-small" />
                    <span className="model-name">{model}</span>
                  </div>

                  {isModelDropdownOpen && (
                    <>
                      <div className="dropdown-overlay" onClick={() => setIsModelDropdownOpen(false)}></div>
                      <div className="model-dropdown-menu">
                        <div className="dropdown-header">Select Model</div>
                        <div className="dropdown-list">
                          {models.length > 0 ? (
                            models.map(m => (
                              <div
                                key={m}
                                className={`dropdown-item ${m === model ? 'active' : ''}`}
                                onClick={() => {
                                  modelRef.current = m;
                                  setModel(m);
                                  setIsModelDropdownOpen(false);
                                }}
                              >
                                <Sparkles size={14} className="item-icon" />
                                <span className="item-name">{m}</span>
                                {m === model && <Check size={14} className="active-check" />}
                              </div>
                            ))
                          ) : (
                            <div className="dropdown-no-models">No models installed</div>
                          )}
                        </div>
                        <div className="dropdown-footer" onClick={() => { setIsSettingsOpen(true); setSettingsTab('models'); setIsModelDropdownOpen(false); }}>
                          <Settings size={14} />
                          <span>Manage Models</span>
                        </div>
                      </div>
                    </>
                  )}
                </div>
                <button className="icon-btn refresh-top-btn" onClick={fetchModels} title="Refresh models">
                  <RefreshCw size={16} />
                </button>
              </div>

              <div className="persona-selector-wrapper">
                <div className="persona-selector" onClick={() => setIsPersonaDropdownOpen(!isPersonaDropdownOpen)}>
                  <activePersona.icon size={14} className="persona-icon-small" />
                  <span className="persona-name">{activePersona.name}</span>
                </div>

                {isPersonaDropdownOpen && (
                  <>
                    <div className="dropdown-overlay" onClick={() => setIsPersonaDropdownOpen(false)}></div>
                    <div className="persona-dropdown-menu">
                      <div className="dropdown-header">AI Persona</div>
                      <div className="dropdown-list">
                        {PERSONAS.map(p => (
                          <div
                            key={p.id}
                            className={`dropdown-item ${p.id === currentPersonaId ? 'active' : ''}`}
                            onClick={() => {
                              setCurrentPersonaId(p.id);
                              setIsPersonaDropdownOpen(false);
                            }}
                          >
                            <p.icon size={14} className="item-icon" />
                            <span className="item-name">{p.name}</span>
                            {p.id === currentPersonaId && <Check size={14} className="active-check" />}
                          </div>
                        ))}
                      </div>
                    </div>
                  </>
                )}
              </div>
            </div>


          <div className="top-bar-right">
            <button className="icon-btn" onClick={exportChat} title="Export chat (Markdown)">
              <Download size={20} />
            </button>
            <button className="theme-toggle" onClick={() => {

              if (themeMode === 'light') setThemeMode('dark');
              else if (themeMode === 'dark') setThemeMode('system');
              else setThemeMode('light');
            }} title={`Switch to ${themeMode === 'light' ? 'Dark' : themeMode === 'dark' ? 'System' : 'Light'} mode`}>
              {themeMode === 'light' ? <Sun size={20} /> : themeMode === 'dark' ? <Moon size={20} /> : <Monitor size={20} />}
            </button>
            <button className="icon-btn settings-top-btn" onClick={() => setIsSettingsOpen(true)} title="Open Settings">
              <Settings size={20} />
            </button>
          </div>
        </div>

        {isSettingsOpen ? (
          <div className="settings-view">
            <div className="settings-sidebar">
              <div className="settings-sidebar-header">
                <button className="icon-btn back-btn" onClick={() => setIsSettingsOpen(false)}>
                  <ArrowLeft size={20} />
                </button>
                <h2>Settings</h2>
              </div>
              <nav className="settings-nav">
                <button
                  className={`nav-item ${settingsTab === 'profile' ? 'active' : ''}`}
                  onClick={() => setSettingsTab('profile')}
                >
                  <User size={18} />
                  <span>Profile</span>
                </button>
                <button
                  className={`nav-item ${settingsTab === 'general' ? 'active' : ''}`}
                  onClick={() => setSettingsTab('general')}
                >
                  <Sparkles size={18} />
                  <span>General</span>
                </button>
                <button
                  className={`nav-item ${settingsTab === 'models' ? 'active' : ''}`}
                  onClick={() => setSettingsTab('models')}
                >
                  <Bot size={18} />
                  <span>Models</span>
                </button>
                <button
                  className={`nav-item ${settingsTab === 'advanced' ? 'active' : ''}`}
                  onClick={() => setSettingsTab('advanced')}
                >
                  <Cpu size={18} />
                  <span>Intelligence</span>
                </button>
                <button
                  className={`nav-item ${settingsTab === 'privacy' ? 'active' : ''}`}
                  onClick={() => setSettingsTab('privacy')}
                >
                  <Shield size={18} />
                  <span>Privacy</span>
                </button>
                <button
                  className={`nav-item ${settingsTab === 'system' ? 'active' : ''}`}
                  onClick={() => setSettingsTab('system')}
                >
                  <Monitor size={18} />
                  <span>System</span>
                </button>
              </nav>
              <div className="settings-sidebar-footer">
                <button
                  className="reset-app-btn"
                  onClick={() => {
                    if (confirm('Reset all chats and settings?')) {
                      localStorage.clear();
                      window.location.reload();
                    }
                  }}
                >
                  <Trash2 size={16} />
                  <span>Reset App</span>
                </button>
              </div>
            </div>

            <div className="settings-content">
              {settingsTab === 'profile' && (
                <div className="settings-pane">
                  <div className="pane-header">
                    <h3>User Profile</h3>
                    <p>Manage your identity and how the assistant addresses you.</p>
                  </div>

                  <div className="profile-header-section">
                    <div className="avatar-upload-row">
                      <div className="avatar-upload-item">
                        <div className="avatar-preview">
                          {userAvatar ? (
                            <img src={userAvatar} alt="User Avatar" />
                          ) : (
                            <div className="avatar-placeholder">
                              <User size={40} />
                            </div>
                          )}
                          <label className="avatar-edit-overlay">
                            <ImageIcon size={20} />
                            <input
                              type="file"
                              accept="image/png, image/jpeg, image/gif, image/webp"
                              hidden
                              onChange={(e) => {
                                const file = e.target.files[0];
                                if (file) {
                                  if (file.size > 2 * 1024 * 1024) {
                                    alert("File is too large. Please select an image under 2MB.");
                                    return;
                                  }
                                  const reader = new FileReader();
                                  reader.onloadend = () => setUserAvatar(reader.result);
                                  reader.readAsDataURL(file);
                                }
                              }}
                            />
                          </label>
                        </div>
                        <div className="avatar-info">
                          <h4>User Avatar</h4>
                          <p>Your personal identity.</p>
                        </div>
                      </div>

                      <div className="avatar-upload-item">
                        <div className="avatar-preview assistant-preview">
                          {assistantAvatar ? (
                            <img src={assistantAvatar} alt="Assistant Avatar" />
                          ) : (
                            <div className="avatar-placeholder">
                              <Bot size={40} />
                            </div>
                          )}
                          <label className="avatar-edit-overlay">
                            <ImageIcon size={20} />
                            <input
                              type="file"
                              accept="image/png, image/jpeg, image/gif, image/webp"
                              hidden
                              onChange={(e) => {
                                const file = e.target.files[0];
                                if (file) {
                                  if (file.size > 2 * 1024 * 1024) {
                                    alert("File is too large. Please select an image under 2MB.");
                                    return;
                                  }
                                  const reader = new FileReader();
                                  reader.onloadend = () => setAssistantAvatar(reader.result);
                                  reader.readAsDataURL(file);
                                }
                              }}
                            />
                          </label>
                        </div>
                        <div className="avatar-info">
                          <h4>Assistant Avatar</h4>
                          <p>The AI's personality (GIF support).</p>
                        </div>
                      </div>
                    </div>
                  </div>

                  <div className="settings-group">
                    <div className="profile-grid">
                      <div className="profile-field">
                        <label className="group-label">Display Name</label>
                        <input
                          type="text"
                          value={userName}
                          onChange={(e) => setUserName(e.target.value)}
                          placeholder="Your Name"
                          className="modern-input"
                        />
                      </div>
                      <div className="profile-field">
                        <label className="group-label">Role / Title</label>
                        <input
                          type="text"
                          value={userRole}
                          onChange={(e) => setUserRole(e.target.value)}
                          placeholder="e.g. Developer, Student"
                          className="modern-input"
                        />
                      </div>
                    </div>
                  </div>

                  <div className="settings-group">
                    <label className="group-label">Email Address</label>
                    <input
                      type="email"
                      value={userEmail}
                      onChange={(e) => setUserEmail(e.target.value)}
                      placeholder="email@example.com"
                      className="modern-input"
                    />
                  </div>

                  <div className="settings-group">
                    <label className="group-label">Short Bio</label>
                    <textarea
                      value={userBio}
                      onChange={(e) => setUserBio(e.target.value)}
                      placeholder="Tell us a bit about yourself..."
                      className="modern-textarea"
                      rows={4}
                    />
                  </div>
                </div>
              )}

              {settingsTab === 'general' && (
                <div className="settings-pane">
                  <div className="pane-header">
                    <h3>Appearance</h3>
                    <p>Customize how the assistant looks and feels.</p>
                  </div>
                  <div className="settings-group">
                    <label className="group-label">Accent Color</label>
                    <p className="group-desc">Choose the color for bullet points, markers, and callouts.</p>
                    <div className="color-palette">
                      {['#34a853', '#4285f4', '#ea4335', '#fbbc05', '#9b72cb', '#00c897', '#d96570'].map(c => (
                        <button
                          key={c}
                          className={`color-swatch ${accentColor === c ? 'active' : ''}`}
                          style={{ backgroundColor: c }}
                          onClick={() => setAccentColor(c)}
                        />
                      ))}
                      <div className="custom-color-container" title="Choose custom color">
                        <input
                          type="color"
                          value={accentColor}
                          onChange={(e) => setAccentColor(e.target.value)}
                          className="custom-color-input"
                        />
                      </div>
                    </div>
                  </div>
                  <div className="settings-group">
                    <label className="group-label">Theme Mode</label>
                    <p className="group-desc">Choose between light, dark, or follow your system settings.</p>
                    <div className="theme-selector-group">
                      <button
                        className={`theme-opt-btn ${themeMode === 'light' ? 'active' : ''}`}
                        onClick={() => setThemeMode('light')}
                      >
                        <Sun size={18} />
                        <span>Light</span>
                      </button>
                      <button
                        className={`theme-opt-btn ${themeMode === 'dark' ? 'active' : ''}`}
                        onClick={() => setThemeMode('dark')}
                      >
                        <Moon size={18} />
                        <span>Dark</span>
                      </button>
                      <button
                        className={`theme-opt-btn ${themeMode === 'system' ? 'active' : ''}`}
                        onClick={() => setThemeMode('system')}
                      >
                        <Monitor size={18} />
                        <span>System</span>
                      </button>
                    </div>
                  </div>
                </div>
              )}

              {settingsTab === 'models' && (
                <div className="settings-pane">
                  <div className="pane-header">
                    <h3>Model Management</h3>
                    <p>Manage installed AI models and download new ones from Ollama.</p>
                  </div>

                  <div className="settings-group">
                    <div className="group-header-row">
                      <label className="group-label">Installed Models</label>
                      <button className="icon-btn small-btn" onClick={fetchModels}>
                        <RefreshCw size={14} />
                      </button>
                    </div>
                    <div className="installed-models-grid">
                      {Array.isArray(models) && models.length > 0 ? (
                        models.map(m => (
                          <div key={m} className={`model-card ${m === model ? 'active' : ''}`}>
                            <div className="model-card-main" onClick={() => { modelRef.current = m; setModel(m); }}>
                              <span className="model-name">{m}</span>
                              {m === model && <span className="active-tag">Active</span>}
                            </div>
                            <button className="delete-btn" onClick={() => deleteModel(m)}>
                              <Trash2 size={14} />
                            </button>
                          </div>
                        ))
                      ) : (
                        <div className="empty-state">No models installed or detected.</div>
                      )}
                    </div>
                  </div>

                  <div className="settings-group">
                    <label className="group-label">Install New Model</label>
                    <div className="pull-form-modern">
                      <input
                        type="text"
                        id="modelNameInput"
                        placeholder="e.g. llama3, mistral..."
                        className="modern-input"
                      />
                      <button
                        className="modern-pull-btn"
                        disabled={!!pullingModel}
                        onClick={() => {
                          const val = document.getElementById('modelNameInput').value;
                          if (val) pullModel(val);
                        }}
                      >
                        <Download size={16} />
                        <span>Pull</span>
                      </button>
                    </div>
                    {pullProgress && (
                      <div className="pull-progress-bar">
                        <div className="progress-text">{pullProgress}</div>
                        {pullingModel && <button onClick={stopPulling} className="cancel-pull-btn"><X size={14} /></button>}
                      </div>
                    )}
                  </div>
                </div>
              )}

              {settingsTab === 'advanced' && (
                <div className="settings-pane">
                  <div className="pane-header">
                    <h3>Intelligence Config</h3>
                    <p>Fine-tune the neural parameters of your local assistant.</p>
                  </div>

                  <div className="settings-group">
                    <label className="group-label">Creativity (Temperature)</label>
                    <p className="group-desc">Higher values make the AI more creative but less predictable.</p>
                    <div className="slider-container-premium">
                      <input
                        type="range"
                        min="0"
                        max="2"
                        step="0.1"
                        value={temperature}
                        onChange={(e) => setTemperature(parseFloat(e.target.value))}
                        className="premium-slider"
                      />
                      <span className="slider-value">{temperature.toFixed(1)}</span>
                    </div>
                  </div>

                  <div className="settings-group">
                    <label className="group-label">Memory Limit (Context)</label>
                    <p className="group-desc">Sets how many tokens the model can remember in a single session.</p>
                    <div className="slider-container-premium">
                      <input
                        type="range"
                        min="512"
                        max="32768"
                        step="512"
                        value={contextLimit}
                        onChange={(e) => setContextLimit(parseInt(e.target.value))}
                        className="premium-slider"
                      />
                      <span className="slider-value">{contextLimit} tokens</span>
                    </div>
                  </div>
                </div>
              )}

              {settingsTab === 'privacy' && (
                <div className="settings-pane">
                  <div className="pane-header">
                    <h3>Privacy & Storage</h3>
                    <p>Manage your local footprint and conversation logs.</p>
                  </div>

                  <div className="settings-group">
                    <div className="privacy-card">
                      <div className="privacy-card-info">
                        <h4>Local-Only Guarantee</h4>
                        <p>All data is stored exclusively in your browser's LocalStorage. No data is ever sent to external servers except your Ollama host.</p>
                      </div>
                      <ShieldCheck size={32} className="privacy-icon" />
                    </div>
                  </div>

                  <div className="settings-group">
                    <label className="group-label">Destructive Actions</label>
                    <button className="danger-action-btn" onClick={() => {
                      if (confirm('Wipe all conversation history? This cannot be undone.')) {
                        setChats([]);
                        setCurrentChatId(null);
                        localStorage.removeItem('dolphin_chats');
                      }
                    }}>
                      <Trash2 size={16} />
                      <span>Clear All Conversation History</span>
                    </button>
                  </div>
                </div>
              )}

              {settingsTab === 'system' && (
                <div className="settings-pane">
                  <div className="pane-header">
                    <h3>System Engine</h3>
                    <p>Hardware information and local API connectivity.</p>
                  </div>

                  <div className="system-status-grid">
                    <div className={`status-card ${apiStatus}`}>
                      <div className="status-indicator"></div>
                      <div className="status-info">
                        <span className="status-label">Ollama API</span>
                        <span className="status-val">{apiStatus === 'online' ? 'Connected' : 'Disconnected'}</span>
                      </div>
                    </div>

                    <div className="status-card info">
                      <Activity size={20} className="status-icon" />
                      <div className="status-info">
                        <span className="status-label">Engine Version</span>
                        <span className="status-val">{ollamaVersion}</span>
                      </div>
                    </div>

                    <div className="status-card info">
                      <Server size={20} className="status-icon" />
                      <div className="status-info">
                        <span className="status-label">Host</span>
                        <span className="status-val">localhost:11434</span>
                      </div>
                    </div>
                  </div>
                  <div className="system-grid-modern">
                    <div className="system-item">
                      <span className="item-label">CPU Cores</span>
                      <span className="item-value">{hardwareInfo.cpu}</span>
                    </div>
                    <div className="system-item">
                      <span className="item-label">Memory (RAM)</span>
                      <span className="item-value">{hardwareInfo.ram}</span>
                    </div>
                    <div className="system-item wide">
                      <span className="item-label">Graphics Card (GPU)</span>
                      <span className="item-value">{hardwareInfo.gpu}</span>
                    </div>
                    <div className="system-item">
                      <span className="item-label">Storage Quota</span>
                      <span className="item-value">{hardwareInfo.storageTotal}</span>
                    </div>
                    <div className="system-item">
                      <span className="item-label">Storage Used</span>
                      <span className="item-value">{hardwareInfo.storageUsed}</span>
                    </div>
                    <div className="system-item wide">
                      <span className="item-label">Ollama Connection</span>
                      <span className="item-value">http://127.0.0.1:11434</span>
                    </div>
                  </div>
                  <div className="version-info">
                    Dolphin AI v1.0.0 • Connected to Ollama Engine
                  </div>
                </div>
              )}
            </div>
          </div>
        ) : (
          <>
            <div className="chat-container" ref={chatContainerRef} onScroll={handleScroll}>
              {messages.length === 0 ? (
                <div className="welcome-screen">
                  <div style={{ marginBottom: '1rem' }}>
                    <img src="/logo.jpg" alt="Dolphin Logo" className="logo-img" style={{ width: '64px', height: '64px' }} onError={(e) => { e.target.style.display = 'none'; e.target.nextSibling.style.display = 'block'; }} />
                    <svg style={{ display: 'none', width: '64px', height: '64px', color: 'var(--accent-color)' }} viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                      <path d="M18.5 7.5C18.5 7.5 16 5 12 5C8 5 4.5 8 4.5 12C4.5 12 4.5 15.5 8 18L10 20.5L12 18.5C14 16.5 16.5 14.5 18 12C19.5 9.5 18.5 7.5 18.5 7.5Z" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                    </svg>
                  </div>
                  <h1 className="greeting">
                    <span className="greeting-hello">Hello, {userName}.</span>
                  </h1>
                  <h2 className="greeting-sub">How can I help you today?</h2>
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.5rem', marginTop: '2rem' }}>
                    {historyIndex > 0 && (
                      <button
                        onClick={goBackSuggestions}
                         style={{ background: 'transparent', border: 'none', color: 'var(--text-secondary)', cursor: 'pointer', display: 'flex', alignItems: 'center' }}
                        title="Previous suggestions"
                      >
                        <ArrowLeft size={16} />
                      </button>
                    )}
                    <span style={{ color: 'var(--text-secondary)' }}>Try asking about...</span>
                    <button
                      onClick={refreshSuggestions}
                      style={{ background: 'transparent', border: 'none', color: 'var(--text-secondary)', cursor: 'pointer', display: 'flex', alignItems: 'center' }}
                      title="Refresh suggestions"
                    >
                      <RefreshCw size={16} className={isRefreshingSuggestions ? 'spin' : ''} />
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
                  {(messages || []).map((msg, index) => (
                    <div key={index} className={`message ${msg.role === 'user' ? 'message-user' : 'message-bot'}`}>
                      {msg.role === 'assistant' && (
                        <div className="message-avatar bot-avatar">
                          {assistantAvatar ? (
                            <img src={assistantAvatar} alt="Assistant" className="chat-avatar-img" />
                          ) : (
                            <>
                              <img src="/logo.jpg" alt="Dolphin" className="logo-img" onError={(e) => { e.target.style.display = 'none'; e.target.nextSibling.style.display = 'block'; }} />
                              <svg style={{ display: 'none', width: '24px', height: '24px' }} viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                                <path d="M18.5 7.5C18.5 7.5 16 5 12 5C8 5 4.5 8 4.5 12C4.5 12 4.5 15.5 8 18L10 20.5L12 18.5C14 16.5 16.5 14.5 18 12C19.5 9.5 18.5 7.5 18.5 7.5Z" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                              </svg>
                            </>
                          )}
                        </div>
                      )}
                      {msg.role === 'user' && (
                        <div className="message-avatar user-avatar-right">
                          {userAvatar ? (
                            <img src={userAvatar} alt="User" className="chat-avatar-img" />
                          ) : (
                            <User size={20} color="var(--text-secondary)" />
                          )}
                        </div>
                      )}
                      <div className="message-content">
                        {msg.displayImage && (
                          <div style={{ marginBottom: '8px' }}>
                            <img src={msg.displayImage} alt="Attached" style={{ maxWidth: '100%', maxHeight: '300px', borderRadius: '8px' }} />
                          </div>
                        )}
                        {msg.role === 'user' ? (
                          <div className="message-text-bubble">
                            <HighlightText text={msg.content} query={chatSearchQuery} />
                          </div>
                        ) : (
                          <div className="markdown-body">
                            <ReactMarkdown
                              remarkPlugins={[remarkGfm]}
                              components={{
                                p: ({ children }) => <p>{ProcessChildren(children, chatSearchQuery)}</p>,
                                li: ({ children }) => <li>{ProcessChildren(children, chatSearchQuery)}</li>,
                                h1: ({ children }) => <h1>{ProcessChildren(children, chatSearchQuery)}</h1>,
                                h2: ({ children }) => <h2>{ProcessChildren(children, chatSearchQuery)}</h2>,
                                h3: ({ children }) => <h3>{ProcessChildren(children, chatSearchQuery)}</h3>,
                                code({ node: _node, inline, className, children, ...props }) {
                                  const match = /language-(\w+)/.exec(className || '');
                                  const codeString = String(children).replace(/\n$/, '');
                                  return !inline && match ? (
                                    <CodeBlock language={match[1]} codeString={codeString} isDark={isDark} {...props} />
                                  ) : (
                                    <code className={className} {...props}>
                                      <HighlightText text={String(children)} query={chatSearchQuery} />
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
                            {msg.role === 'assistant' && (
                              <div className="message-footer">
                                {msg.stats && msg.stats.tps > 0 && (
                                  <div className="generation-stats" title="Performance metrics">
                                    <Activity size={12} />
                                    <span>{msg.stats.tps} t/s</span>
                                    <span className="stats-divider">•</span>
                                    <span>{msg.stats.words} words</span>
                                    <span className="stats-divider">•</span>
                                    <span>{msg.stats.time}s</span>
                                  </div>
                                )}
                                <MessageActions
                                  text={msg.content}
                                  reactions={msg.reactions}
                                  onReact={(emoji) => handleReaction(currentChatId, index, emoji)}
                                  onRegenerate={() => regenerateMessage(index)}
                                  showRegenerate={!isTyping}
                                />
                              </div>
                            )}

                          </div>
                        )}
                      </div>
                      {msg.role === 'user' && (
                        <MessageActions 
                          text={msg.content} 
                          reactions={msg.reactions}
                          onReact={(emoji) => handleReaction(currentChatId, index, emoji)}
                          onEdit={(newVal) => handleMessageEdit(index, newVal)}
                          showRegenerate={false} 
                          showEdit={true}
                        />
                      )}
                    </div>
                  ))}
                  <div ref={messagesEndRef} />
                </div>
              )}
            </div>

            <div className="input-area">
              <div className="input-box" style={{ flexDirection: (selectedImage || attachedFiles.length > 0) ? 'column' : 'row', alignItems: (selectedImage || attachedFiles.length > 0) ? 'stretch' : 'flex-end' }}>
                {(selectedImage || attachedFiles.length > 0) && (
                  <div className="attachments-preview">
                    {selectedImage && (
                      <div className="attachment-item">
                        <img src={selectedImage.dataUrl} alt="Preview" />
                        <button onClick={() => setSelectedImage(null)}><X size={12} /></button>
                      </div>
                    )}
                    {attachedFiles.map((file, i) => (
                      <div key={i} className="attachment-item doc-attachment">
                        <MessageSquare size={14} />
                        <span>{file.name}</span>
                        <button onClick={() => setAttachedFiles(prev => prev.filter((_, idx) => idx !== i))}><X size={12} /></button>
                      </div>
                    ))}
                  </div>
                )}
                <div style={{ display: 'flex', width: '100%', alignItems: 'center', paddingTop: (selectedImage || attachedFiles.length > 0) ? '8px' : '0' }}>
                  <input
                    type="file"
                    multiple
                    ref={fileInputRef}
                    style={{ display: 'none' }}
                    onChange={handleFileUpload}
                  />
                  <button className="icon-btn" title="Add files or images" onClick={() => fileInputRef.current?.click()}>
                    <Plus size={20} />
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
                    <button 
                      className={`icon-btn mic-btn ${isListening ? 'active-recording' : ''}`} 
                      title="Use microphone"
                      onClick={startListening}
                    >
                      <Mic size={20} />
                      {isListening && <span className="mic-wave"></span>}
                    </button>
                    {isTyping ? (

                      <button className="icon-btn stop-btn active" onClick={stopGeneration} title="Stop generating">
                        <Square fill="currentColor" size={16} />
                      </button>
                    ) : (
                      <button
                        className={`icon-btn send-btn ${input.trim() ? 'active' : ''}`}
                        onClick={() => handleSubmit()}
                        disabled={!input.trim() || !isModelValid}
                      >
                        <Send size={20} />
                      </button>
                    )}
                  </div>
                </div>
              </div>
            </div>
          </>
        )}
      </div>
    </div>
  );
}

export default App;
