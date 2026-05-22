import React, { useState, useEffect, useRef } from 'react';
import { FaRobot, FaTimes, FaPaperPlane, FaSearch, FaBoxOpen, FaTrash } from 'react-icons/fa';
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
      } catch (e) {
        // Fallback to default
      }
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
      // Storage key changed (e.g. user logged in or out). Load new messages, do NOT save old ones.
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
      // Normal state update, save to storage
      sessionStorage.setItem(storageKey, JSON.stringify(messages));
    }
  }, [messages, storageKey]);

  const [inputValue, setInputValue] = useState('');
  const [aiChat, { isLoading }] = useAiChatMutation();
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const navigate = useNavigate();
  const location = useLocation();

  // Close on route change
  useEffect(() => { setIsOpen(false); }, [location.pathname]);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages, isLoading]);

  const handleSend = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    if (!inputValue.trim() || isLoading) return;

    const userText = inputValue.trim();
    const newUserMsg: Message = { id: Date.now().toString(), role: 'user', content: userText };
    
    // Optimistic UI
    const updatedMessages = [...messages, newUserMsg];
    setMessages(updatedMessages);
    setInputValue('');

    try {
      const historyForApi = updatedMessages.map(m => ({ role: m.role, content: m.content }));
      const response = await aiChat({ messages: historyForApi }).unwrap();

      const aiMsg: Message = {
        id: (Date.now() + 1).toString(),
        role: 'model',
        content: response.data.reply,
        searchResults: response.data.searchResults
      };

      setMessages(prev => [...prev, aiMsg]);
    } catch (error) {
      console.error("Chat Error:", error);
      setMessages(prev => [...prev, {
        id: (Date.now() + 1).toString(),
        role: 'model',
        content: "I'm sorry, I encountered an error connecting to the system. Please try again later."
      }]);
    }
  };

  return (
    <div className="relative font-sans z-50">
      {/* Header Button */}
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="relative w-9 h-9 flex items-center justify-center rounded-full bg-gray-800 border border-gray-700 hover:border-blue-500/50 hover:bg-gray-700 transition-all duration-200 text-gray-400 hover:text-blue-400"
      >
        <FaRobot size={14} />
      </button>

      {isOpen && (
        <>
          {/* Invisible backdrop */}
          <div className="fixed inset-0 z-40" onClick={() => setIsOpen(false)} />

          <div
            className="fixed sm:absolute left-2 right-2 sm:left-auto sm:right-0 top-[68px] sm:top-12 w-auto sm:w-96 h-[500px] bg-gray-900 border border-white/10 rounded-2xl shadow-2xl shadow-black/50 flex flex-col overflow-hidden backdrop-blur-xl transition-all duration-300 transform origin-top-right z-50"
            style={{ borderTop: "2px solid #3b82f6" }}
          >
            {/* Header */}
            <div className="bg-[#0f1523] border-b border-white/5 p-4 flex items-center justify-between z-10 relative overflow-hidden">
              {/* Subtle background glow */}
              <div className="absolute top-0 left-0 w-full h-full bg-gradient-to-r from-blue-500/5 to-violet-500/5 pointer-events-none" />
              
              <div className="flex items-center gap-3 relative z-10">
                
                <div>
                  <h3 className="font-black text-transparent bg-clip-text bg-gradient-to-r from-blue-400 to-violet-400 text-[15px] tracking-wide">
                    Aura AI
                  </h3>
                  <p className="text-white/50 text-[11px] font-medium flex items-center gap-1.5 mt-0.5">
                    
                    Ready to assist you
                  </p>
                </div>
              </div>

              <div className="flex items-center gap-3 relative z-10">
                <button 
                  onClick={() => setIsOpen(false)}
                  className="w-8 h-8 rounded-lg flex items-center justify-center bg-white/5 hover:bg-white/10 text-white/70 hover:text-white transition-all border border-white/5 shadow-sm"
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
                  
                  {/* Render Search Results mini-cards if available */}
                  {msg.searchResults && (msg.searchResults.foundItems?.length > 0 || msg.searchResults.lostItems?.length > 0) && (
                    <div className="mt-2 w-full max-w-[90%] space-y-2">
                      {msg.searchResults.foundItems?.map((item: any) => (
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

                  {/* Render Search Results for lost items */}
                  {msg.searchResults && msg.searchResults.lostItems?.length > 0 && (
                    <div className="mt-2 w-full max-w-[90%] space-y-2">
                      {msg.searchResults.lostItems?.map((item: any) => (
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
              
              {isLoading && (
                <div className="flex items-start">
                  <div className="bg-white/10 text-gray-300 p-3 rounded-2xl rounded-tl-sm border border-white/5 text-sm flex items-center gap-2">
                    <div className="w-1.5 h-1.5 bg-cyan-400 rounded-full animate-bounce" style={{ animationDelay: '0ms' }} />
                    <div className="w-1.5 h-1.5 bg-cyan-400 rounded-full animate-bounce" style={{ animationDelay: '150ms' }} />
                    <div className="w-1.5 h-1.5 bg-cyan-400 rounded-full animate-bounce" style={{ animationDelay: '300ms' }} />
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
                  onClick={() => setMessages([{ id: 'welcome', role: 'model', content: 'Hi there! I am Aura AI. Have you lost or found something? Tell me about it!' }])}
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
                    className="w-full bg-black/30 border border-white/10 rounded-full pl-4 pr-12 py-3 text-sm text-white placeholder-gray-500 focus:outline-none focus:border-cyan-500 transition-colors"
                  />
                  <button 
                    type="submit"
                    disabled={!inputValue.trim() || isLoading}
                    className="absolute right-1.5 top-1.5 p-2 bg-gradient-to-r from-blue-600 to-cyan-500 rounded-full text-white disabled:opacity-50 hover:shadow-lg transition-all"
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
