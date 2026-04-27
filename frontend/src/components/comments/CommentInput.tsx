import React, { useState, useRef } from 'react';
import { FaMapMarkerAlt, FaClock, FaSmile, FaPaperPlane, FaGhost } from 'react-icons/fa';
import { useUserVerification } from '../../auth/auth';

interface CommentInputProps {
  onSubmit: (data: any) => void;
  isLoading: boolean;
  onTyping: (isTyping: boolean) => void;
}

export const CommentInput: React.FC<CommentInputProps> = ({ onSubmit, isLoading, onTyping }) => {
  const [content, setContent]           = useState('');
  const [isAnonymous, setIsAnonymous]   = useState(false);
  const [location, setLocation]         = useState('');
  const [time, setTime]                 = useState('');
  const [showEmojiPicker, setShowEmojiPicker] = useState(false);
  const [selectedImage, setSelectedImage]     = useState<File | null>(null);
  const [imagePreview, setImagePreview]       = useState<string | null>(null);
  const user: any = useUserVerification();
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const emojiRef    = useRef<HTMLDivElement>(null);

  const emojis = ['👍', '❤️', '😂', '😮', '😢', '😡', '🔥', '📍', '✅', '🙏'];

  const handleSubmit = (e?: React.FormEvent) => {
    e?.preventDefault();
    if (!content.trim() || isLoading) return;
    onSubmit({ content: content.trim(), isAnonymous, location, time, image: selectedImage });
    setContent(''); setLocation(''); setTime('');
    setSelectedImage(null); setImagePreview(null);
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

  return (
    <div
      className="px-4 py-3"
      style={{ borderTop: '1px solid rgba(255,255,255,0.05)' }}
    >
      <div className="flex gap-2.5 items-start">

        {/* Avatar */}
        <div
          className="w-8 h-8 rounded-full overflow-hidden shrink-0 mt-0.5 flex items-center justify-center"
          style={{ background: 'rgba(255,255,255,0.06)', border: '1px solid rgba(255,255,255,0.1)' }}
        >
          {isAnonymous ? (
            <FaGhost size={13} className="text-gray-500" />
          ) : avatarSrc ? (
            <img src={avatarSrc} alt="avatar" className="w-full h-full object-cover" />
          ) : (
            <span className="text-xs font-bold text-gray-400">
              {(user?.name || 'U')[0].toUpperCase()}
            </span>
          )}
        </div>

        {/* Input box */}
        <div className="flex-1 min-w-0">
          <div
            className="rounded-xl transition-all"
            style={{
              background: 'rgba(255,255,255,0.04)',
              border: '1px solid rgba(255,255,255,0.08)',
            }}
          >
            <textarea
              ref={textareaRef}
              value={content}
              onChange={handleTextareaChange}
              onKeyDown={handleKeyDown}
              placeholder="Write a public comment…"
              rows={1}
              className="w-full bg-transparent resize-none outline-none px-3.5 pt-3 pb-2"
              style={{
                fontSize: '13px',
                color: '#e4e6eb',
                maxHeight: '120px',
                lineHeight: '1.5',
              }}
            />

            {/* Location/time chips inside box */}
            {(location || time) && (
              <div className="flex flex-wrap gap-1.5 px-3.5 pb-2">
                {location && (
                  <span
                    className="inline-flex items-center gap-1 text-blue-400 rounded-full px-2 py-0.5"
                    style={{ fontSize: '10px', background: 'rgba(59,130,246,0.1)', border: '1px solid rgba(59,130,246,0.2)' }}
                  >
                    <FaMapMarkerAlt size={8} /> {location}
                    <button onClick={() => setLocation('')} className="ml-0.5 opacity-60 hover:opacity-100">×</button>
                  </span>
                )}
                {time && (
                  <span
                    className="inline-flex items-center gap-1 text-emerald-400 rounded-full px-2 py-0.5"
                    style={{ fontSize: '10px', background: 'rgba(16,185,129,0.1)', border: '1px solid rgba(16,185,129,0.2)' }}
                  >
                    <FaClock size={8} /> {time}
                    <button onClick={() => setTime('')} className="ml-0.5 opacity-60 hover:opacity-100">×</button>
                  </span>
                )}
              </div>
            )}

            {/* Action row */}
            <div
              className="flex items-center justify-between px-3 pb-2.5 pt-1"
              style={{ borderTop: content || location || time ? '1px solid rgba(255,255,255,0.05)' : 'none', marginTop: content ? '0' : undefined }}
            >
              {/* Left tools */}
              <div className="flex items-center gap-1">
                <button
                  type="button"
                  onClick={handleLocationClick}
                  title={location ? 'Remove location' : 'Add location'}
                  className="w-7 h-7 rounded-lg flex items-center justify-center transition-all"
                  style={{
                    color: location ? '#60a5fa' : 'rgba(156,163,175,0.6)',
                    background: location ? 'rgba(59,130,246,0.12)' : 'transparent',
                  }}
                >
                  <FaMapMarkerAlt size={12} />
                </button>
                <button
                  type="button"
                  onClick={handleTimeClick}
                  title={time ? 'Remove time' : 'Add time'}
                  className="w-7 h-7 rounded-lg flex items-center justify-center transition-all"
                  style={{
                    color: time ? '#34d399' : 'rgba(156,163,175,0.6)',
                    background: time ? 'rgba(16,185,129,0.12)' : 'transparent',
                  }}
                >
                  <FaClock size={12} />
                </button>

                {/* Emoji */}
                <div className="relative" ref={emojiRef}>
                  <button
                    type="button"
                    onClick={() => setShowEmojiPicker(p => !p)}
                    className="w-7 h-7 rounded-lg flex items-center justify-center transition-all"
                    style={{ color: showEmojiPicker ? '#fbbf24' : 'rgba(156,163,175,0.6)' }}
                  >
                    <FaSmile size={12} />
                  </button>
                  {showEmojiPicker && (
                    <div
                      className="absolute bottom-full left-0 mb-2 rounded-xl p-2 flex flex-wrap gap-1 z-50"
                      style={{
                        background: '#1a1d23',
                        border: '1px solid rgba(255,255,255,0.1)',
                        boxShadow: '0 16px 40px rgba(0,0,0,0.6)',
                        width: '176px',
                      }}
                    >
                      {emojis.map(emoji => (
                        <button
                          key={emoji}
                          type="button"
                          onClick={() => { setContent(p => p + emoji); setShowEmojiPicker(false); textareaRef.current?.focus(); }}
                          className="hover:scale-125 transition-transform text-base leading-none p-0.5"
                        >
                          {emoji}
                        </button>
                      ))}
                    </div>
                  )}
                </div>
              </div>

              {/* Right: anon + send */}
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => setIsAnonymous(p => !p)}
                  className="flex items-center gap-1.5 rounded-lg px-2 py-1 transition-all"
                  style={{
                    fontSize: '10px',
                    fontWeight: 700,
                    letterSpacing: '0.06em',
                    color: isAnonymous ? '#60a5fa' : 'rgba(107,114,128,0.8)',
                    background: isAnonymous ? 'rgba(59,130,246,0.1)' : 'transparent',
                    border: isAnonymous ? '1px solid rgba(59,130,246,0.2)' : '1px solid transparent',
                  }}
                >
                  <FaGhost size={9} />
                  ANON
                </button>

                <button
                  type="button"
                  onClick={() => handleSubmit()}
                  disabled={!canSend}
                  className="w-7 h-7 rounded-lg flex items-center justify-center transition-all"
                  style={{
                    background: canSend ? 'rgba(59,130,246,0.9)' : 'rgba(255,255,255,0.05)',
                    color: canSend ? '#fff' : 'rgba(107,114,128,0.4)',
                    cursor: canSend ? 'pointer' : 'not-allowed',
                  }}
                >
                  {isLoading
                    ? <div className="w-3.5 h-3.5 border border-white border-t-transparent rounded-full animate-spin" />
                    : <FaPaperPlane size={11} />
                  }
                </button>
              </div>
            </div>
          </div>

          {/* Image preview */}
          {imagePreview && (
            <div className="mt-2 relative inline-block">
              <img src={imagePreview} alt="Preview" className="h-20 w-20 object-cover rounded-lg" style={{ border: '1px solid rgba(255,255,255,0.1)' }} />
              <button
                type="button"
                onClick={() => { setSelectedImage(null); setImagePreview(null); }}
                className="absolute -top-1.5 -right-1.5 w-5 h-5 rounded-full flex items-center justify-center text-xs font-bold"
                style={{ background: '#1a1d23', color: '#9ca3af', border: '1px solid rgba(255,255,255,0.15)' }}
              >×</button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};