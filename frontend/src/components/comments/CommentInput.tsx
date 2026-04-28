import React, { useState, useRef } from 'react';
import { FaMapMarkerAlt, FaClock, FaSmile, FaPaperPlane, FaGhost, FaImage, FaUser, FaVideo, FaCalendar, FaPoll, FaEllipsisH } from 'react-icons/fa';
import { BsEmojiSmile, BsImage, BsCameraVideo, BsGift } from 'react-icons/bs';
import { MdGif } from 'react-icons/md';
import { useUserVerification } from '../../auth/auth';

interface CommentInputProps {
  onSubmit: (data: any) => void;
  isLoading: boolean;
  onTyping: (isTyping: boolean) => void;
  isCompact?: boolean; // ← new
}

export const CommentInput: React.FC<CommentInputProps> = ({
  onSubmit, isLoading, onTyping, isCompact = false
}) => {
  const [content, setContent]                 = useState('');
  const [isAnonymous, setIsAnonymous]         = useState(false);
  const [location, setLocation]               = useState('');
  const [time, setTime]                       = useState('');
  const [showEmojiPicker, setShowEmojiPicker] = useState(false);
  const [expanded, setExpanded]               = useState(false);
  const [selectedImage, setSelectedImage]     = useState<File | null>(null);
  const [imagePreview, setImagePreview]       = useState<string | null>(null);
  const [showMoreOptions, setShowMoreOptions]   = useState(false);
  
  const user: any = useUserVerification();
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const inputRef    = useRef<HTMLInputElement>(null);
  const emojiRef    = useRef<HTMLDivElement>(null);
  const moreRef     = useRef<HTMLDivElement>(null);

  const emojis: Array<{ emoji: string; label: string }> = [
    { emoji: '👍', label: 'Like' },
    { emoji: '❤️', label: 'Love' },
    { emoji: '😂', label: 'Haha' },
    { emoji: '😮', label: 'Wow' },
    { emoji: '😢', label: 'Sad' },
    { emoji: '😡', label: 'Angry' },
    { emoji: '🎉', label: 'Celebrate' },
    { emoji: '🤔', label: 'Thinking' },
    { emoji: '👏', label: 'Clap' },
    { emoji: '🙏', label: 'Pray' },
    { emoji: '💪', label: 'Strong' },
    { emoji: '🔥', label: 'Fire' },
  ];

  const moreOptions = [
    { icon: <FaImage size={16} />, label: 'Photo', color: '#42b883' },
    { icon: <FaUser size={16} />, label: 'Tag', color: '#1877f2' },
    { icon: <FaCalendar size={16} />, label: 'Event', color: '#e4245b' },
    { icon: <FaPoll size={16} />, label: 'Poll', color: '#f7b125' },
  ];

  const handleSubmit = (e?: React.FormEvent) => {
    e?.preventDefault();
    if (!content.trim() || isLoading) return;
    onSubmit({ content: content.trim(), isAnonymous, location, time, image: selectedImage });
    setContent(''); setLocation(''); setTime('');
    setSelectedImage(null); setImagePreview(null);
    setExpanded(false);
    onTyping(false);
    if (textareaRef.current) textareaRef.current.style.height = 'auto';
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); handleSubmit(); }
  };

  const handleLocationClick = () => {
    if (location) { setLocation(''); return; }
    navigator.geolocation?.getCurrentPosition(
      pos => setLocation(`${pos.coords.latitude.toFixed(4)}, ${pos.coords.longitude.toFixed(4)}`),
      () => setLocation('Location unavailable'),
    );
  };

  const handleTimeClick = () => {
    setTime(t => t ? '' : new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }));
  };

  const handleTextareaChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    setContent(e.target.value);
    onTyping(e.target.value.length > 0);
    e.target.style.height = 'auto';
    e.target.style.height = `${Math.min(e.target.scrollHeight, 120)}px`;
  };

  const avatarSrc = isAnonymous
    ? null
    : (user?.userImg || `https://ui-avatars.com/api/?name=${encodeURIComponent(user?.name || 'U')}&background=1d4ed8&color=fff&bold=true`);

  const canSend = content.trim().length > 0 && !isLoading;
  const displayName = user?.name || 'Write a comment…';

  // ── Facebook-style compact layout ─────────────────────────────────────────
  if (isCompact) {
    return (
      <div className="px-4 py-3">
        <div className="flex items-start gap-3">
          {/* Avatar */}
          <div
            className="w-10 h-10 rounded-full overflow-hidden shrink-0 flex items-center justify-center"
            style={{ 
              background: isAnonymous 
                ? 'linear-gradient(135deg, #4b5563 0%, #6b7280 100%)' 
                : 'linear-gradient(135deg, rgba(59,130,246,0.1) 0%, rgba(147,197,253,0.05) 100%)', 
              border: '2px solid rgba(255,255,255,0.15)' 
            }}
          >
            {isAnonymous ? (
              <FaGhost size={16} className="text-gray-400" />
            ) : avatarSrc ? (
              <img src={avatarSrc} alt="avatar" className="w-full h-full object-cover" />
            ) : (
              <span className="text-sm font-bold text-blue-400">
                {(user?.name || 'U')[0].toUpperCase()}
              </span>
            )}
          </div>

          {/* Main input area */}
          <div className="flex-1 min-w-0">
            <div
              className="rounded-2xl overflow-hidden transition-all"
              style={{
                background: expanded ? 'rgba(255,255,255,0.08)' : 'rgba(255,255,255,0.06)',
                border: '1px solid rgba(255,255,255,0.12)',
                backdropFilter: 'blur(10px)',
              }}
            >
              {/* Text input */}
              {!expanded ? (
                <button
                  className="w-full text-left px-4 py-3"
                  style={{ 
                    color: '#b0b3b8', 
                    fontSize: 'clamp(14px, 4vw, 15px)', 
                    background: 'transparent', 
                    border: 'none', 
                    cursor: 'text',
                    fontWeight: 500,
                    whiteSpace: 'nowrap',
                    overflow: 'hidden',
                    textOverflow: 'ellipsis'
                  }}
                  onClick={() => { 
                    setExpanded(true); 
                    setTimeout(() => textareaRef.current?.focus(), 50); 
                  }}
                >
                  {window.innerWidth < 640 ? 'Write comment…' : 'Write a comment…'}
                </button>
              ) : (
                <textarea
                  ref={textareaRef}
                  value={content}
                  onChange={handleTextareaChange}
                  onKeyDown={handleKeyDown}
                  placeholder="Write a comment…"
                  rows={1}
                  autoFocus
                  className="w-full bg-transparent resize-none outline-none px-4 py-3"
                  style={{ 
                    fontSize: 'clamp(14px, 4vw, 15px)', 
                    color: '#e4e6eb', 
                    maxHeight: 120, 
                    lineHeight: 1.4,
                    fontWeight: 500,
                  }}
                />
              )}

              {/* Location/time chips */}
              {(location || time) && (
                <div className="flex flex-wrap gap-2 px-4 pb-2">
                  {location && (
                    <span className="inline-flex items-center gap-1.5 text-blue-400 rounded-full px-3 py-1"
                      style={{ 
                        fontSize: 11, 
                        background: 'rgba(59,130,246,0.12)', 
                        border: '1px solid rgba(59,130,246,0.25)',
                        fontWeight: 600,
                      }}>
                      <FaMapMarkerAlt size={10} /> 
                      {location}
                      <button 
                        onClick={() => setLocation('')} 
                        className="ml-1 opacity-70 hover:opacity-100 text-blue-300"
                      >
                        ×
                      </button>
                    </span>
                  )}
                  {time && (
                    <span className="inline-flex items-center gap-1.5 text-emerald-400 rounded-full px-3 py-1"
                      style={{ 
                        fontSize: 11, 
                        background: 'rgba(16,185,129,0.12)', 
                        border: '1px solid rgba(16,185,129,0.25)',
                        fontWeight: 600,
                      }}>
                      <FaClock size={10} /> 
                      {time}
                      <button 
                        onClick={() => setTime('')} 
                        className="ml-1 opacity-70 hover:opacity-100 text-emerald-300"
                      >
                        ×
                      </button>
                    </span>
                  )}
                </div>
              )}

              {/* Bottom toolbar */}
              <div
                className="flex items-center justify-between px-3 py-2"
                style={{ borderTop: expanded ? '1px solid rgba(255,255,255,0.08)' : 'none' }}
              >
                <div className="flex items-center gap-1">
                  {/* Location button */}
                  <button 
                    type="button" 
                    onClick={handleLocationClick}
                    className="w-8 h-8 rounded-lg flex items-center justify-center transition-all hover:bg-white/10"
                    style={{ 
                      color: location ? '#60a5fa' : 'rgba(156,163,175,0.7)', 
                      fontSize: 14 
                    }}
                    title="Add location"
                  >
                    <FaMapMarkerAlt />
                  </button>

                  {/* Time button */}
                  <button 
                    type="button" 
                    onClick={handleTimeClick}
                    className="w-8 h-8 rounded-lg flex items-center justify-center transition-all hover:bg-white/10"
                    style={{ 
                      color: time ? '#34d399' : 'rgba(156,163,175,0.7)', 
                      fontSize: 14 
                    }}
                    title="Add time"
                  >
                    <FaClock />
                  </button>

                  {/* Emoji picker */}
                  <div className="relative" ref={emojiRef}>
                    <button 
                      type="button" 
                      onClick={() => setShowEmojiPicker(p => !p)}
                      className="w-8 h-8 rounded-lg flex items-center justify-center transition-all hover:bg-white/10"
                      style={{ 
                        color: showEmojiPicker ? '#fbbf24' : 'rgba(156,163,175,0.7)', 
                        fontSize: 14 
                      }}
                      title="Add emoji"
                    >
                      <BsEmojiSmile />
                    </button>
                    {showEmojiPicker && (
                      <div className="absolute bottom-full left-0 mb-2 rounded-2xl p-3 flex flex-wrap gap-1.5 z-50"
                        style={{ 
                          background: 'linear-gradient(180deg, #2a2d33 0%, #1a1d23 100%)', 
                          border: '1px solid rgba(255,255,255,0.15)', 
                          boxShadow: '0 20px 60px rgba(0,0,0,0.7)', 
                          width: 280,
                          maxHeight: 200,
                          overflowY: 'auto',
                        }}
                      >
                        <div className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-2 px-1">
                          Reactions
                        </div>
                        {emojis.map((item, index) => (
                          <button 
                            key={`emoji-${index}`} 
                            type="button"
                            onClick={() => { 
                              setContent(p => p + item.emoji); 
                              setShowEmojiPicker(false); 
                              textareaRef.current?.focus(); 
                            }}
                            className="hover:scale-125 transition-all duration-200 text-lg leading-none p-1.5 rounded-lg hover:bg-white/10"
                            title={item.label}
                          >
                            {item.emoji}
                          </button>
                        ))}
                      </div>
                    )}
                  </div>

                  {/* More options */}
                  <div className="relative" ref={moreRef}>
                    <button 
                      type="button" 
                      onClick={() => setShowMoreOptions(p => !p)}
                      className="w-8 h-8 rounded-lg flex items-center justify-center transition-all hover:bg-white/10"
                      style={{ 
                        color: showMoreOptions ? '#60a5fa' : 'rgba(156,163,175,0.7)', 
                        fontSize: 14 
                      }}
                      title="More options"
                    >
                      <FaEllipsisH />
                    </button>
                    {showMoreOptions && (
                      <div className="absolute bottom-full left-0 mb-2 rounded-xl p-2 z-50"
                        style={{ 
                          background: '#2a2d33', 
                          border: '1px solid rgba(255,255,255,0.15)', 
                          boxShadow: '0 16px 40px rgba(0,0,0,0.6)', 
                          minWidth: 160,
                        }}
                      >
                        {moreOptions.map((option, index) => (
                          <button 
                            key={option.label}
                            type="button"
                            className="w-full flex items-center gap-3 px-3 py-2.5 rounded-lg transition-all hover:bg-white/10 text-left"
                            style={{ 
                              color: option.color,
                              fontSize: 13,
                              fontWeight: 500,
                            }}
                          >
                            <span style={{ color: option.color }}>
                              {option.icon}
                            </span>
                            {option.label}
                          </button>
                        ))}
                      </div>
                    )}
                  </div>

                  {/* Anonymous toggle */}
                  <button 
                    type="button" 
                    onClick={() => setIsAnonymous(p => !p)}
                    className="flex items-center gap-1.5 rounded-lg px-2 py-1.5 transition-all"
                    style={{
                      fontSize: 11, 
                      fontWeight: 700, 
                      letterSpacing: '0.05em',
                      color: isAnonymous ? '#60a5fa' : 'rgba(156,163,175,0.8)', 
                      background: isAnonymous ? 'rgba(59,130,246,0.15)' : 'transparent', 
                      border: isAnonymous ? '1px solid rgba(59,130,246,0.3)' : '1px solid transparent',
                    }}
                    title="Post anonymously"
                  >
                    <FaGhost size={10} /> 
                    ANON
                  </button>
                </div>

                {/* Send button */}
                <button 
                  type="button" 
                  onClick={() => handleSubmit()} 
                  disabled={!canSend}
                  className="w-8 h-8 rounded-full flex items-center justify-center transition-all"
                  style={{
                    background: canSend 
                      ? 'linear-gradient(135deg, #1877f2 0%, #42b883 100%)' 
                      : 'rgba(255,255,255,0.08)',
                    color: canSend ? '#fff' : 'rgba(156,163,175,0.5)', 
                    cursor: canSend ? 'pointer' : 'not-allowed',
                    boxShadow: canSend ? '0 4px 12px rgba(24,119,242,0.3)' : 'none',
                  }}
                  title="Post comment"
                >
                  {isLoading
                    ? <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                    : <FaPaperPlane size={12} style={{ transform: 'rotate(-30deg)' }} />
                  }
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  // ── Original full layout (non-modal/desktop) ───────────────────────────────
  return (
    <div className="px-4 py-3" style={{ borderTop: '1px solid rgba(255,255,255,0.05)' }}>
      {/* ...your existing full layout unchanged... */}
      <div className="flex gap-2.5 items-start">
        <div className="w-8 h-8 rounded-full overflow-hidden shrink-0 mt-0.5 flex items-center justify-center"
          style={{ background: 'rgba(255,255,255,0.06)', border: '1px solid rgba(255,255,255,0.1)' }}>
          {isAnonymous ? <FaGhost size={13} className="text-gray-500" />
            : avatarSrc ? <img src={avatarSrc} alt="avatar" className="w-full h-full object-cover" />
            : <span className="text-xs font-bold text-gray-400">{(user?.name || 'U')[0].toUpperCase()}</span>}
        </div>
        <div className="flex-1 min-w-0">
          <div className="rounded-xl transition-all"
            style={{ background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.08)' }}>
            <textarea ref={textareaRef} value={content} onChange={handleTextareaChange}
              onKeyDown={handleKeyDown} placeholder="Write a public comment…" rows={1}
              className="w-full bg-transparent resize-none outline-none px-3.5 pt-3 pb-2"
              style={{ fontSize: 13, color: '#e4e6eb', maxHeight: 120, lineHeight: 1.5 }} />
            {(location || time) && (
              <div className="flex flex-wrap gap-1.5 px-3.5 pb-2">
                {location && <span className="inline-flex items-center gap-1 text-blue-400 rounded-full px-2 py-0.5"
                  style={{ fontSize: 10, background: 'rgba(59,130,246,0.1)', border: '1px solid rgba(59,130,246,0.2)' }}>
                  <FaMapMarkerAlt size={8} /> {location}
                  <button onClick={() => setLocation('')} className="ml-0.5 opacity-60">×</button></span>}
                {time && <span className="inline-flex items-center gap-1 text-emerald-400 rounded-full px-2 py-0.5"
                  style={{ fontSize: 10, background: 'rgba(16,185,129,0.1)', border: '1px solid rgba(16,185,129,0.2)' }}>
                  <FaClock size={8} /> {time}
                  <button onClick={() => setTime('')} className="ml-0.5 opacity-60">×</button></span>}
              </div>
            )}
            <div className="flex items-center justify-between px-3 pb-2.5 pt-1"
              style={{ borderTop: content || location || time ? '1px solid rgba(255,255,255,0.05)' : 'none' }}>
              <div className="flex items-center gap-1">
                <button type="button" onClick={handleLocationClick}
                  className="w-7 h-7 rounded-lg flex items-center justify-center"
                  style={{ color: location ? '#60a5fa' : 'rgba(156,163,175,0.6)', background: location ? 'rgba(59,130,246,0.12)' : 'transparent' }}>
                  <FaMapMarkerAlt size={12} /></button>
                <button type="button" onClick={handleTimeClick}
                  className="w-7 h-7 rounded-lg flex items-center justify-center"
                  style={{ color: time ? '#34d399' : 'rgba(156,163,175,0.6)', background: time ? 'rgba(16,185,129,0.12)' : 'transparent' }}>
                  <FaClock size={12} /></button>
                <div className="relative" ref={emojiRef}>
                  <button type="button" onClick={() => setShowEmojiPicker(p => !p)}
                    className="w-7 h-7 rounded-lg flex items-center justify-center"
                    style={{ color: showEmojiPicker ? '#fbbf24' : 'rgba(156,163,175,0.6)' }}>
                    <FaSmile size={12} /></button>
                  {showEmojiPicker && (
                    <div className="absolute bottom-full left-0 mb-2 rounded-xl p-2 flex flex-wrap gap-1 z-50"
                      style={{ background: '#1a1d23', border: '1px solid rgba(255,255,255,0.1)', boxShadow: '0 16px 40px rgba(0,0,0,0.6)', width: 176 }}>
                      {emojis.map((item, index) => (
                        <button key={`emoji-${index}`} type="button"
                          onClick={() => { setContent(p => p + item.emoji); setShowEmojiPicker(false); textareaRef.current?.focus(); }}
                          className="hover:scale-125 transition-transform text-base leading-none p-0.5">{item.emoji}</button>
                      ))}
                    </div>
                  )}
                </div>
              </div>
              <div className="flex items-center gap-2">
                <button type="button" onClick={() => setIsAnonymous(p => !p)}
                  className="flex items-center gap-1.5 rounded-lg px-2 py-1"
                  style={{ fontSize: 10, fontWeight: 700, letterSpacing: '0.06em', color: isAnonymous ? '#60a5fa' : 'rgba(107,114,128,0.8)', background: isAnonymous ? 'rgba(59,130,246,0.1)' : 'transparent', border: isAnonymous ? '1px solid rgba(59,130,246,0.2)' : '1px solid transparent' }}>
                  <FaGhost size={9} /> ANON</button>
                <button type="button" onClick={() => handleSubmit()} disabled={!canSend}
                  className="w-7 h-7 rounded-lg flex items-center justify-center"
                  style={{ background: canSend ? 'rgba(59,130,246,0.9)' : 'rgba(255,255,255,0.05)', color: canSend ? '#fff' : 'rgba(107,114,128,0.4)', cursor: canSend ? 'pointer' : 'not-allowed' }}>
                  {isLoading ? <div className="w-3.5 h-3.5 border border-white border-t-transparent rounded-full animate-spin" />
                    : <FaPaperPlane size={11} />}</button>
              </div>
            </div>
          </div>
          {imagePreview && (
            <div className="mt-2 relative inline-block">
              <img src={imagePreview} alt="Preview" className="h-20 w-20 object-cover rounded-lg" style={{ border: '1px solid rgba(255,255,255,0.1)' }} />
              <button type="button" onClick={() => { setSelectedImage(null); setImagePreview(null); }}
                className="absolute -top-1.5 -right-1.5 w-5 h-5 rounded-full flex items-center justify-center text-xs font-bold"
                style={{ background: '#1a1d23', color: '#9ca3af', border: '1px solid rgba(255,255,255,0.15)' }}>×</button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};