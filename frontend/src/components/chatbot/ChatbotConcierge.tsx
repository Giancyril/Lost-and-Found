import React, { useState, useEffect, useRef } from 'react';
import { FaPaperPlane, FaSearch, FaBoxOpen, FaTrash } from 'react-icons/fa';
import { useAiChatMutation } from '../../redux/api/api';
import { useNavigate, useLocation } from 'react-router-dom';
import { IoCloseOutline } from 'react-icons/io5';
import { useUserVerification } from '../../auth/auth';
import ReactMarkdown from 'react-markdown';

interface Message {
  id: string;
  role: 'user' | 'model';
  content: string;
  searchResults?: {
    foundItems: any[];
    lostItems: any[];
  };
}

// ── Aura AI Fluid Wave Logo ─────────────────────────────────────────────────
// size="sm"  → 18×18  navbar trigger button
// size="md"  → 36×36  chat panel header
function AuraLogo({ size = 'sm' }: { size?: 'sm' | 'md' }) {
  const sm = size === 'sm';

  return (
    <svg
      width={sm ? 18 : 36}
      height={sm ? 18 : 36}
      viewBox="-28 -22 56 44"
      fill="none"
      aria-hidden="true"
    >
      {/* Top wave — sky blue */}
      <path
        d="M-24 -6 C-14 -20, 0 8, 10 -4 C18 -14, 24 -2, 24 -6"
        stroke="#38bdf8"
        strokeWidth={sm ? 2.2 : 3.2}
        strokeLinecap="round"
      />
      {/* Mid wave — indigo */}
      <path
        d="M-24 2 C-12 -12, 2 16, 12 2 C20 -8, 24 4, 24 2"
        stroke="#818cf8"
        strokeWidth={sm ? 1.8 : 2.6}
        strokeLinecap="round"
        opacity="0.85"
      />
      {/* Bottom wave — teal */}
      <path
        d="M-18 10 C-6 0, 6 18, 18 10"
        stroke="#2dd4bf"
        strokeWidth={sm ? 1.4 : 2}
        strokeLinecap="round"
        opacity="0.7"
      />
      {/* Crest dot */}
      <circle cx="0" cy="-8" r={sm ? 2.2 : 3.2} fill="#e0f2fe" />
    </svg>
  );
}

export default function ChatbotConcierge() {
  const [isOpen, setIsOpen] = useState(false);
  const user = useUserVerification() as any;
  const userId = user?.id || 'guest';
  const storageKey = `chatConciergeMessages_${userId}`;

  const [messages, setMessages] = useState<Message[]>(() => {
    const saved = sessionStorage.getItem(storageKey);
    if (saved) {
      try {
        return JSON.parse(saved);
      } catch (e) {}
    }
    return [
      {
        id: 'welcome',
        role: 'model',
        content: 'Hi there! I am Aura AI. Have you lost or found something? Tell me about it!'
      }
    ];
  });

  const lastStorageKey = useRef(storageKey);

  useEffect(() => {
    if (lastStorageKey.current !== storageKey) {
      const saved = sessionStorage.getItem(storageKey);
      if (saved) {
        try {
          setMessages(JSON.parse(saved));
        } catch (e) {}
      } else {
        setMessages([{
          id: 'welcome',
          role: 'model',
          content: 'Hi there! I am Aura AI. Have you lost or found something? Tell me about it!'
        }]);
      }
      lastStorageKey.current = storageKey;
    } else {
      sessionStorage.setItem(storageKey, JSON.stringify(messages));
    }
  }, [messages, storageKey]);

  const [inputValue, setInputValue] = useState('');
  const [aiChat, { isLoading }] = useAiChatMutation();
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const navigate = useNavigate();
  const location = useLocation();

  useEffect(() => { setIsOpen(false); }, [location.pathname]);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, isLoading]);

  const handleSend = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    if (!inputValue.trim() || isLoading) return;

    const userText = inputValue.trim();
    const newUserMsg: Message = { id: Date.now().toString(), role: 'user', content: userText };
    const updatedMessages = [...messages, newUserMsg];
    setMessages(updatedMessages);
    setInputValue('');

    try {
      const historyForApi = updatedMessages.map(m => ({ role: m.role, content: m.content }));
      const response = await aiChat({ messages: historyForApi }).unwrap();
      setMessages(prev => [...prev, {
        id: (Date.now() + 1).toString(),
        role: 'model',
        content: response.data.reply,
        searchResults: response.data.searchResults
      }]);
    } catch (error) {
      console.error('Chat Error:', error);
      setMessages(prev => [...prev, {
        id: (Date.now() + 1).toString(),
        role: 'model',
        content: "I'm sorry, I encountered an error connecting to the system. Please try again later."
      }]);
    }
  };

  const isDashboard = location.pathname.startsWith('/dashboard');

  return (
    <div className="relative font-sans z-50">

      {/* ── Trigger Button ─────────────────────────────────────────────────── */}
      <button
        onClick={() => setIsOpen(!isOpen)}
        className={isDashboard
          ? `relative w-9 h-9 flex items-center justify-center rounded-full transition-all border duration-200 ${isOpen
              ? 'bg-indigo-500/10 border-indigo-500/30'
              : 'bg-white/5 border-white/5 hover:bg-white/10 hover:border-indigo-500/20'
            }`
          : `relative w-9 h-9 flex items-center justify-center rounded-full border transition-all duration-200 ${isOpen
              ? 'bg-indigo-500/10 border-indigo-500/30'
              : 'bg-gray-800 border-gray-700 hover:border-indigo-500/40 hover:bg-gray-700'
            }`
        }
      >
        <AuraLogo size="sm" />
      </button>

      {isOpen && (
        <>
          {/* Backdrop */}
          <div className="fixed inset-0 z-40" onClick={() => setIsOpen(false)} />

          {/* ── Chat Panel ───────────────────────────────────────────────── */}
          <div
            className="fixed sm:absolute left-2 right-2 sm:left-auto sm:right-0 top-[68px] sm:top-12 w-auto sm:w-96 h-[500px] bg-gray-900 border border-white/10 rounded-2xl shadow-2xl shadow-black/50 flex flex-col overflow-hidden backdrop-blur-xl transition-all duration-300 transform origin-top-right z-50"
            style={{ borderTop: '2px solid #818cf8' }}
          >

            {/* Header */}
            <div className="bg-[#0a1628] border-b border-white/5 p-4 flex items-center justify-between z-10 relative overflow-hidden">
              <div className="absolute inset-0 bg-gradient-to-r from-sky-500/5 to-indigo-500/5 pointer-events-none" />

              {/* Logo + name */}
              <div className="flex items-center gap-3 relative z-10">
                <AuraLogo size="md" />
                <div>
                  <h3 className="font-black text-transparent bg-clip-text bg-gradient-to-r from-sky-400 to-indigo-400 text-[15px] tracking-wide">
                    Aura AI
                  </h3>
                  <p className="text-white/40 text-[11px] font-medium mt-0.5">
                    Ready to assist you
                  </p>
                </div>
              </div>

              {/* Close */}
              <div className="relative z-10">
                <button
                  onClick={() => setIsOpen(false)}
                  className="w-8 h-8 rounded-lg flex items-center justify-center bg-white/5 hover:bg-white/10 text-white/70 hover:text-white transition-all border border-white/5"
                >
                  <IoCloseOutline size={20} />
                </button>
              </div>
            </div>

            {/* Chat Area */}
            <div className="flex-1 overflow-y-auto p-4 space-y-4 bg-gray-900 custom-scrollbar">
              {messages.map((msg) => (
                <div key={msg.id} className={`flex flex-col ${msg.role === 'user' ? 'items-end' : 'items-start'}`}>
                  <div
                    className={`max-w-[85%] p-3 rounded-2xl text-sm ${
                      msg.role === 'user'
                        ? 'bg-blue-600 text-white rounded-tr-sm'
                        : 'bg-white/10 text-gray-200 rounded-tl-sm border border-white/5'
                    }`}
                  >
                    <div className="[&>p]:mb-1 [&>p:last-child]:mb-0">
                      <ReactMarkdown>{msg.content}</ReactMarkdown>
                    </div>
                  </div>

                  {/* Found item cards */}
                  {msg.searchResults && msg.searchResults.foundItems?.length > 0 && (
                    <div className="mt-2 w-full max-w-[90%] space-y-2">
                      {msg.searchResults.foundItems.map((item: any) => (
                        <div
                          key={`found-${item.id}`}
                          onClick={() => { setIsOpen(false); navigate(`/foundItems/${item.id}`); }}
                          className="bg-cyan-900/30 border border-cyan-500/30 p-2 rounded-lg cursor-pointer hover:bg-cyan-900/50 transition-colors flex items-center gap-3"
                        >
                          <div className="w-8 h-8 rounded bg-cyan-500/20 flex items-center justify-center text-cyan-400">
                            <FaBoxOpen size={14} />
                          </div>
                          <div className="flex-1 min-w-0">
                            <p className="text-xs font-bold text-white truncate">Found: {item.foundItemName}</p>
                            <p className="text-[10px] text-cyan-200 truncate">{item.location}</p>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}

                  {/* Lost item cards */}
                  {msg.searchResults && msg.searchResults.lostItems?.length > 0 && (
                    <div className="mt-2 w-full max-w-[90%] space-y-2">
                      {msg.searchResults.lostItems.map((item: any) => (
                        <div
                          key={`lost-${item.id}`}
                          onClick={() => { setIsOpen(false); navigate(`/lostItems/${item.id}`); }}
                          className="bg-red-900/30 border border-red-500/30 p-2 rounded-lg cursor-pointer hover:bg-red-900/50 transition-colors flex items-center gap-3"
                        >
                          <div className="w-8 h-8 rounded bg-red-500/20 flex items-center justify-center text-red-400">
                            <FaSearch size={14} />
                          </div>
                          <div className="flex-1 min-w-0">
                            <p className="text-xs font-bold text-white truncate">Lost: {item.lostItemName}</p>
                            <p className="text-[10px] text-red-200 truncate">{item.location}</p>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              ))}

              {/* Typing indicator */}
              {isLoading && (
                <div className="flex items-start">
                  <div className="bg-white/10 text-gray-300 p-3 rounded-2xl rounded-tl-sm border border-white/5 text-sm flex items-center gap-2">
                    <div className="w-1.5 h-1.5 bg-sky-400 rounded-full animate-bounce" style={{ animationDelay: '0ms' }} />
                    <div className="w-1.5 h-1.5 bg-indigo-400 rounded-full animate-bounce" style={{ animationDelay: '150ms' }} />
                    <div className="w-1.5 h-1.5 bg-teal-400 rounded-full animate-bounce" style={{ animationDelay: '300ms' }} />
                  </div>
                </div>
              )}
              <div ref={messagesEndRef} />
            </div>

            {/* Input Area */}
            <div className="p-3 border-t border-white/10 bg-gray-900">
              <form onSubmit={handleSend} className="relative flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => setMessages([{
                    id: 'welcome',
                    role: 'model',
                    content: 'Hi there! I am Aura AI. Have you lost or found something? Tell me about it!'
                  }])}
                  className="w-10 h-10 flex items-center justify-center rounded-full bg-white/5 text-white/40 hover:text-red-400 hover:bg-red-500/10 transition-all shrink-0 border border-transparent hover:border-red-500/20"
                  title="Clear Chat"
                >
                  <FaTrash size={12} />
                </button>
                <div className="relative flex-1">
                  <input
                    type="text"
                    value={inputValue}
                    onChange={(e) => setInputValue(e.target.value)}
                    placeholder="Ask me anything..."
                    className="w-full bg-black/30 border border-white/10 rounded-full pl-4 pr-12 py-3 text-sm text-white placeholder-gray-500 focus:outline-none focus:border-indigo-500 transition-colors"
                  />
                  <button
                    type="submit"
                    disabled={!inputValue.trim() || isLoading}
                    className="absolute right-1.5 top-1.5 p-2 bg-gradient-to-r from-sky-600 to-indigo-500 rounded-full text-white disabled:opacity-50 hover:shadow-lg transition-all"
                  >
                    <FaPaperPlane size={12} />
                  </button>
                </div>
              </form>
            </div>

          </div>
        </>
      )}
    </div>
  );
}