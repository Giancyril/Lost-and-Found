import React, { useState, useRef } from 'react';
import { FaMapMarkerAlt, FaClock, FaSmile, FaPaperPlane, FaGhost, FaImage, FaUser, FaCalendar, FaPoll, FaEllipsisH } from 'react-icons/fa';
import { BsEmojiSmile } from 'react-icons/bs';
import { useUserVerification } from '../../auth/auth';

interface CommentInputProps {
  onSubmit: (data: any) => void;
  isLoading: boolean;
  onTyping: (isTyping: boolean) => void;
  isCompact?: boolean;
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
  const [showMoreOptions, setShowMoreOptions] = useState(false);

  const user: any = useUserVerification();
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const emojiRef    = useRef<HTMLDivElement>(null);
  const moreRef     = useRef<HTMLDivElement>(null);

  const emojis: Array<{ emoji: string; label: string }> = [
    { emoji: '👍', label: 'Like' },    { emoji: '❤️', label: 'Love' },
    { emoji: '😂', label: 'Haha' },    { emoji: '😮', label: 'Wow' },
    { emoji: '😢', label: 'Sad' },     { emoji: '😡', label: 'Angry' },
    { emoji: '🎉', label: 'Celebrate'},{ emoji: '🤔', label: 'Thinking' },
    { emoji: '👏', label: 'Clap' },    { emoji: '🙏', label: 'Pray' },
    { emoji: '💪', label: 'Strong' },  { emoji: '🔥', label: 'Fire' },
  ];

  const moreOptions = [
    { icon: <FaImage size={16} />,    label: 'Photo', color: '#42b883' },
    { icon: <FaUser size={16} />,     label: 'Tag',   color: '#1877f2' },
    { icon: <FaCalendar size={16} />, label: 'Event', color: '#e4245b' },
    { icon: <FaPoll size={16} />,     label: 'Poll',  color: '#f7b125' },
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

  const canSend = content.trim().length > 0 && !isLoading;

  // ── Shared toolbar ─────────────────────────────────────────────────────────
  const toolbar = (
    <div
      className="flex items-center justify-between px-3 py-2"
      style={{ borderTop: '1px solid rgba(255,255,255,0.05)' }}
    >
      <div className="flex items-center gap-1">
        {/* Location */}
        <button type="button" onClick={handleLocationClick}
          className="w-8 h-8 rounded-lg flex items-center justify-center transition-all hover:bg-white/10"
          style={{ color: location ? '#60a5fa' : 'rgba(156,163,175,0.7)' }}
          title="Add location">
          <FaMapMarkerAlt size={13} />
        </button>

        {/* Time */}
        <button type="button" onClick={handleTimeClick}
          className="w-8 h-8 rounded-lg flex items-center justify-center transition-all hover:bg-white/10"
          style={{ color: time ? '#34d399' : 'rgba(156,163,175,0.7)' }}
          title="Add time">
          <FaClock size={13} />
        </button>

        {/* Emoji */}
        <div className="relative" ref={emojiRef}>
          <button type="button" onClick={() => setShowEmojiPicker(p => !p)}
            className="w-8 h-8 rounded-lg flex items-center justify-center transition-all hover:bg-white/10"
            style={{ color: showEmojiPicker ? '#fbbf24' : 'rgba(156,163,175,0.7)' }}
            title="Add emoji">
            <BsEmojiSmile size={13} />
          </button>
          {showEmojiPicker && (
            <div className="absolute bottom-full left-0 mb-2 rounded-2xl p-3 flex flex-wrap gap-1.5 z-50"
              style={{
                background: 'linear-gradient(180deg, #2a2d33 0%, #1a1d23 100%)',
                border: '1px solid rgba(255,255,255,0.15)',
                boxShadow: '0 20px 60px rgba(0,0,0,0.7)',
                width: 280, maxHeight: 200, overflowY: 'auto',
              }}>
              <div className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-2 px-1 w-full">
                Reactions
              </div>
              {emojis.map((item, i) => (
                <button key={i} type="button"
                  onClick={() => { setContent(p => p + item.emoji); setShowEmojiPicker(false); textareaRef.current?.focus(); }}
                  className="hover:scale-125 transition-all duration-200 text-lg leading-none p-1.5 rounded-lg hover:bg-white/10"
                  title={item.label}>
                  {item.emoji}
                </button>
              ))}
            </div>
          )}
        </div>

        {/* Anonymous toggle */}
        <button type="button" onClick={() => setIsAnonymous(p => !p)}
          className="flex items-center gap-1.5 rounded-lg px-2 py-1.5 transition-all"
          style={{
            fontSize: 11, fontWeight: 700, letterSpacing: '0.05em',
            color: isAnonymous ? '#60a5fa' : 'rgba(156,163,175,0.8)',
            background: isAnonymous ? 'rgba(59,130,246,0.15)' : 'transparent',
            border: isAnonymous ? '1px solid rgba(59,130,246,0.3)' : '1px solid transparent',
          }}
          title="Post anonymously">
          <FaGhost size={10} /> ANON
        </button>
      </div>

      {/* Send */}
      <button type="button" onClick={() => handleSubmit()} disabled={!canSend}
        className="w-8 h-8 rounded-full flex items-center justify-center transition-all"
        style={{
          background: canSend ? 'rgba(59,130,246,0.9)' : 'rgba(255,255,255,0.06)',
          color: canSend ? '#fff' : 'rgba(156,163,175,0.4)',
          cursor: canSend ? 'pointer' : 'not-allowed',
        }}
        title="Post comment">
        {isLoading
          ? <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
          : <FaPaperPlane size={12} style={{ transform: 'rotate(-30deg)' }} />
        }
      </button>
    </div>
  );

  // ── Chips (location / time) ────────────────────────────────────────────────
  const chips = (location || time) && (
    <div className="flex flex-wrap gap-2 px-4 pb-2">
      {location && (
        <span className="inline-flex items-center gap-1.5 text-blue-400 rounded-full px-3 py-1"
          style={{ fontSize: 11, background: 'rgba(59,130,246,0.12)', border: '1px solid rgba(59,130,246,0.25)', fontWeight: 600 }}>
          <FaMapMarkerAlt size={10} /> {location}
          <button onClick={() => setLocation('')} className="ml-1 opacity-70 hover:opacity-100">×</button>
        </span>
      )}
      {time && (
        <span className="inline-flex items-center gap-1.5 text-emerald-400 rounded-full px-3 py-1"
          style={{ fontSize: 11, background: 'rgba(16,185,129,0.12)', border: '1px solid rgba(16,185,129,0.25)', fontWeight: 600 }}>
          <FaClock size={10} /> {time}
          <button onClick={() => setTime('')} className="ml-1 opacity-70 hover:opacity-100">×</button>
        </span>
      )}
    </div>
  );

  // ── Compact layout (modal) ─────────────────────────────────────────────────
  if (isCompact) {
    return (
      <div className="px-4 py-3">
        <div
          className="rounded-2xl overflow-hidden transition-all"
          style={{
            background: 'rgba(255,255,255,0.06)',
            border: '1px solid rgba(255,255,255,0.10)',
          }}
        >
          {!expanded ? (
            <button
              className="w-full text-left px-4 py-3"
              style={{
                color: '#b0b3b8', fontSize: 14, background: 'transparent',
                border: 'none', cursor: 'text', fontWeight: 500,
              }}
              onClick={() => { setExpanded(true); setTimeout(() => textareaRef.current?.focus(), 50); }}
            >
              Write a public comment…
            </button>
          ) : (
            <textarea
              ref={textareaRef}
              value={content}
              onChange={handleTextareaChange}
              onKeyDown={handleKeyDown}
              placeholder="Write a public comment…"
              rows={1}
              autoFocus
              className="w-full bg-transparent resize-none outline-none px-4 py-3"
              style={{ fontSize: 14, color: '#e4e6eb', maxHeight: 120, lineHeight: 1.4, fontWeight: 500 }}
            />
          )}
          {chips}
          {toolbar}
        </div>
      </div>
    );
  }

  // ── Full layout (non-modal) ────────────────────────────────────────────────
  return (
    <div className="px-4 py-3" style={{ borderTop: '1px solid rgba(255,255,255,0.05)' }}>
      <div
        className="rounded-xl transition-all"
        style={{ background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.08)' }}
      >
        <textarea
          ref={textareaRef}
          value={content}
          onChange={handleTextareaChange}
          onKeyDown={handleKeyDown}
          placeholder="Write a public comment…"
          rows={1}
          className="w-full bg-transparent resize-none outline-none px-3.5 pt-3 pb-2"
          style={{ fontSize: 13, color: '#e4e6eb', maxHeight: 120, lineHeight: 1.5 }}
        />
        {chips}
        {toolbar}
      </div>
      {imagePreview && (
        <div className="mt-2 relative inline-block">
          <img src={imagePreview} alt="Preview" className="h-20 w-20 object-cover rounded-lg"
            style={{ border: '1px solid rgba(255,255,255,0.1)' }} />
          <button type="button"
            onClick={() => { setSelectedImage(null); setImagePreview(null); }}
            className="absolute -top-1.5 -right-1.5 w-5 h-5 rounded-full flex items-center justify-center text-xs font-bold"
            style={{ background: '#1a1d23', color: '#9ca3af', border: '1px solid rgba(255,255,255,0.15)' }}>
            ×
          </button>
        </div>
      )}
    </div>
  );
};