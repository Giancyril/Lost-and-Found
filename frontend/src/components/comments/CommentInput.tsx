import React, { useState, useRef } from 'react';
import { FaMapMarkerAlt, FaClock, FaCamera, FaSmile, FaPaperPlane, FaGhost } from 'react-icons/fa';
import { useUserVerification } from '../../auth/auth';

interface CommentInputProps {
  onSubmit: (data: any) => void;
  isLoading: boolean;
  onTyping: (isTyping: boolean) => void;
}

export const CommentInput: React.FC<CommentInputProps> = ({
  onSubmit,
  isLoading,
  onTyping
}) => {
  const [content, setContent] = useState('');
  const [isAnonymous, setIsAnonymous] = useState(false);
  const [location, setLocation] = useState('');
  const [time, setTime] = useState('');
  const [showEmojiPicker, setShowEmojiPicker] = useState(false);
  const [selectedImage, setSelectedImage] = useState<File | null>(null);
  const [imagePreview, setImagePreview] = useState<string | null>(null);
  const user: any = useUserVerification();
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const emojis = ['👍', '❤️', '😂', '😮', '😢', '😡', '🔥', '📍', '✅', '🙏'];

  const handleSubmit = (e?: React.FormEvent) => {
    e?.preventDefault();
    if (!content.trim() || isLoading) return;

    onSubmit({
      content: content.trim(),
      isAnonymous,
      location,
      time,
      image: selectedImage
    });

    setContent('');
    setLocation('');
    setTime('');
    setSelectedImage(null);
    setImagePreview(null);
    if (textareaRef.current) {
      textareaRef.current.style.height = 'auto';
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSubmit();
    }
  };

  const handleLocationClick = () => {
    if (location) {
      setLocation('');
      return;
    }
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (pos) => setLocation(`${pos.coords.latitude.toFixed(4)}, ${pos.coords.longitude.toFixed(4)}`),
        () => setLocation('Location unavailable')
      );
    }
  };

  const handleTimeClick = () => {
    if (time) {
      setTime('');
    } else {
      setTime(new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }));
    }
  };

  const handleEmojiClick = (emoji: string) => {
    setContent(prev => prev + emoji);
    setShowEmojiPicker(false);
    textareaRef.current?.focus();
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setSelectedImage(file);
      const reader = new FileReader();
      reader.onloadend = () => setImagePreview(reader.result as string);
      reader.readAsDataURL(file);
    }
  };

  const handleTextareaChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    setContent(e.target.value);
    onTyping(e.target.value.length > 0);
    e.target.style.height = 'auto';
    e.target.style.height = `${e.target.scrollHeight}px`;
  };

  return (
    <div className="py-3 border-t border-gray-800">
      <div className="flex gap-2">
        {/* Avatar */}
        <div className="flex-shrink-0">
          <div className="w-8 h-8 sm:w-9 sm:h-9 rounded-full overflow-hidden border border-gray-700 bg-gray-800">
            {isAnonymous ? (
              <div className="w-full h-full flex items-center justify-center bg-gray-700 text-gray-400">
                <FaGhost size={14} />
              </div>
            ) : (
              <img
                src={user?.userImg || `https://ui-avatars.com/api/?name=${encodeURIComponent(user?.name || 'User')}&background=random`}
                alt="Avatar"
                className="w-full h-full object-cover"
              />
            )}
          </div>
        </div>

        {/* Input column */}
        <div className="flex-1 min-w-0">
          {/* Main bubble input */}
          <div className="!bg-[#242526] rounded-[20px] px-3 py-2.5 focus-within:ring-1 focus-within:ring-blue-500/30 transition-all border border-transparent">
            <textarea
              ref={textareaRef}
              value={content}
              onChange={handleTextareaChange}
              onKeyDown={handleKeyDown}
              placeholder="Write a public comment..."
              className="w-full bg-transparent border-none focus:ring-0 text-[14px] p-1 resize-none max-h-40 !text-[#e4e6eb] placeholder-[#8a8d91] outline-none"
              rows={1}
            />

            {/* Action row */}
            <div className="flex items-center justify-between mt-1.5 px-1">
              {/* Left icons */}
              <div className="flex gap-2">
                <button
                  type="button"
                  onClick={handleLocationClick}
                  className={`transition-colors ${location ? 'text-blue-400' : 'text-[#8a8d91] hover:text-[#b0b3b8]'}`}
                  title={location ? 'Remove location' : 'Add location'}
                >
                  <FaMapMarkerAlt size={16} />
                </button>
                <button
                  type="button"
                  onClick={handleTimeClick}
                  className={`transition-colors ${time ? 'text-green-400' : 'text-[#8a8d91] hover:text-[#b0b3b8]'}`}
                  title={time ? 'Remove time' : 'Add current time'}
                >
                  <FaClock size={16} />
                </button>
                
                {/* Emoji picker */}
                <div className="relative">
                  <button
                    type="button"
                    onClick={() => setShowEmojiPicker(prev => !prev)}
                    className={`transition-colors ${showEmojiPicker ? 'text-yellow-400' : 'text-[#8a8d91] hover:text-[#b0b3b8]'}`}
                    title="Emoji"
                  >
                    <FaSmile size={16} />
                  </button>

                  {showEmojiPicker && (
                    <div className="absolute bottom-full left-0 mb-3 !bg-[#242526] border border-[#3e4042] rounded-xl p-2 shadow-2xl flex flex-wrap gap-1.5 z-[100] w-48 animate-in zoom-in-95 duration-100">
                      {emojis.map(emoji => (
                        <button
                          key={emoji}
                          type="button"
                          onClick={() => handleEmojiClick(emoji)}
                          className="hover:scale-125 transition-transform text-lg leading-none"
                        >
                          {emoji}
                        </button>
                      ))}
                    </div>
                  )}
                </div>
              </div>

              {/* Right: Anonymous toggle + Send */}
              <div className="flex items-center gap-4">
                <button
                  type="button"
                  onClick={() => setIsAnonymous(prev => !prev)}
                  className={`text-[11px] font-bold uppercase tracking-widest transition-colors ${isAnonymous ? 'text-blue-400' : 'text-[#8a8d91] hover:text-[#b0b3b8]'}`}
                >
                  Anonymous
                </button>
                <button
                  type="button"
                  onClick={() => handleSubmit()}
                  disabled={!content.trim() || isLoading}
                  className={`transition-colors ${content.trim() && !isLoading ? 'text-blue-500 hover:text-blue-400' : 'text-[#4e4f50] cursor-not-allowed'}`}
                >
                  {isLoading
                    ? <div className="w-4 h-4 border-2 border-blue-400 border-t-transparent rounded-full animate-spin" />
                    : <FaPaperPlane size={18} />
                  }
                </button>
              </div>
            </div>
          </div>{/* end input bubble */}

          {/* Image preview */}
          {imagePreview && (
            <div className="mt-2 relative inline-block">
              <img src={imagePreview} alt="Preview" className="h-20 w-20 object-cover rounded-lg border border-gray-600" />
              <button
                type="button"
                onClick={() => { setSelectedImage(null); setImagePreview(null); }}
                className="absolute -top-2 -right-2 bg-gray-900 text-white rounded-full w-5 h-5 flex items-center justify-center text-xs border border-gray-600 hover:bg-gray-800"
              >
                ×
              </button>
            </div>
          )}

          {/* Location / time chips */}
          {(location || time) && (
            <div className="flex flex-wrap gap-2 mt-2 ml-1">
              {location && (
                <div className="bg-blue-500/10 text-blue-400 text-[10px] px-2.5 py-1 rounded-full flex items-center gap-1.5 border border-blue-500/20">
                  <FaMapMarkerAlt size={9} /> {location}
                  <button type="button" onClick={() => setLocation('')} className="ml-1 hover:text-blue-300 font-bold leading-none">×</button>
                </div>
              )}
              {time && (
                <div className="bg-green-500/10 text-green-400 text-[10px] px-2.5 py-1 rounded-full flex items-center gap-1.5 border border-green-500/20">
                  <FaClock size={9} /> {time}
                  <button type="button" onClick={() => setTime('')} className="ml-1 hover:text-green-300 font-bold leading-none">×</button>
                </div>
              )}
            </div>
          )}
        </div>{/* end input column */}
      </div>
    </div>
  );
};
