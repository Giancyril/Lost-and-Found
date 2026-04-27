import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { 
  FaArrowLeft, FaTag, FaPlus, FaTimes, FaGlobe, FaMapMarkerAlt, 
  FaInfoCircle, FaCheckCircle 
} from 'react-icons/fa';
import { toast, ToastContainer } from 'react-toastify';
import { useCreateThreadMutation } from '../../redux/api/threadsApi';

const ThreadCreate: React.FC = () => {
  const navigate = useNavigate();
  const [createThread, { isLoading }] = useCreateThreadMutation();

  const [formData, setFormData] = useState({
    title: '',
    content: '',
    category: 'general',
    tags: [] as string[]
  });
  const [currentTag, setCurrentTag] = useState('');

  const categories = [
    { value: 'general', label: 'General Discussion', icon: <FaGlobe />, desc: 'Ask questions or start general conversations.' },
    { value: 'location', label: 'Location-Based', icon: <FaMapMarkerAlt />, desc: 'Discuss sightings or incidents in specific areas.' },
    { value: 'trending', label: 'Trending', icon: <FaPlus />, desc: 'Start a discussion about something trending on campus.' }
  ];

  const handleAddTag = () => {
    if (currentTag && !formData.tags.includes(currentTag)) {
      setFormData(prev => ({ ...prev, tags: [...prev.tags, currentTag] }));
      setCurrentTag('');
    }
  };

  const removeTag = (tagToRemove: string) => {
    setFormData(prev => ({ ...prev, tags: prev.tags.filter(t => t !== tagToRemove) }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.title.trim() || !formData.content.trim()) {
      toast.error('Please fill in both title and content');
      return;
    }

    try {
      const thread = await createThread(formData).unwrap();
      toast.success('Discussion started successfully!');
      setTimeout(() => navigate(`/threads/${thread.id}`), 1500);
    } catch (error) {
      toast.error('Failed to create thread');
    }
  };

  return (
    <div className="min-h-screen bg-[#18191a] text-[#e4e6eb] pb-20">
      <ToastContainer theme="dark" />
      
      {/* Header */}
      <div className="bg-[#242526] border-b border-gray-800 sticky top-0 z-10">
        <div className="max-w-3xl mx-auto px-4 py-4 flex items-center justify-between">
          <div className="flex items-center gap-4">
            <Link to="/threads" className="p-2 hover:bg-gray-800 rounded-full transition-colors">
              <FaArrowLeft size={18} className="text-gray-400" />
            </Link>
            <h1 className="text-xl font-bold text-white">Start a Discussion</h1>
          </div>
          <button
            onClick={handleSubmit}
            disabled={isLoading || !formData.title.trim() || !formData.content.trim()}
            className="bg-blue-600 hover:bg-blue-700 disabled:opacity-50 text-white font-bold px-6 py-2 rounded-lg transition-colors flex items-center gap-2"
          >
            {isLoading ? 'Publishing...' : <><FaPlus /> Publish</>}
          </button>
        </div>
      </div>

      <div className="max-w-3xl mx-auto px-4 mt-8">
        <div className="bg-[#242526] rounded-xl border border-gray-800 shadow-xl overflow-hidden">
          {/* Category Selection */}
          <div className="p-6 border-b border-gray-800">
            <label className="block text-sm font-bold text-gray-400 uppercase tracking-wider mb-4">
              Select a Category
            </label>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
              {categories.map((cat) => (
                <button
                  key={cat.value}
                  type="button"
                  onClick={() => setFormData(prev => ({ ...prev, category: cat.value }))}
                  className={`p-4 rounded-xl border transition-all text-left flex flex-col gap-2 ${
                    formData.category === cat.value
                      ? 'bg-blue-500/10 border-blue-500/50 text-blue-400'
                      : 'bg-[#3a3b3c] border-transparent hover:bg-[#4a4b4c] text-gray-400'
                  }`}
                >
                  <span className="text-xl">{cat.icon}</span>
                  <span className="font-bold text-sm">{cat.label}</span>
                  <span className="text-[10px] opacity-70 leading-tight">{cat.desc}</span>
                  {formData.category === cat.value && <FaCheckCircle className="absolute top-2 right-2 text-blue-500" />}
                </button>
              ))}
            </div>
          </div>

          {/* Title & Content */}
          <div className="p-6 space-y-6">
            <div>
              <label className="block text-sm font-bold text-gray-400 uppercase tracking-wider mb-2">
                Discussion Title
              </label>
              <input
                type="text"
                value={formData.title}
                onChange={(e) => setFormData(prev => ({ ...prev, title: e.target.value }))}
                placeholder="What's on your mind? (e.g., Sighting near Library)"
                className="w-full bg-[#3a3b3c] border-none rounded-lg p-4 text-lg font-bold text-white placeholder-[#8a8d91] focus:ring-2 focus:ring-blue-500 transition-all"
              />
            </div>

            <div>
              <label className="block text-sm font-bold text-gray-400 uppercase tracking-wider mb-2">
                Content
              </label>
              <textarea
                value={formData.content}
                onChange={(e) => setFormData(prev => ({ ...prev, content: e.target.value }))}
                placeholder="Share more details about your discussion..."
                className="w-full bg-[#3a3b3c] border-none rounded-lg p-4 text-[#e4e6eb] placeholder-[#8a8d91] focus:ring-2 focus:ring-blue-500 resize-none min-h-[250px] transition-all"
              />
            </div>

            {/* Tags */}
            <div>
              <label className="block text-sm font-bold text-gray-400 uppercase tracking-wider mb-2">
                Tags (Optional)
              </label>
              <div className="flex flex-wrap gap-2 mb-3">
                {formData.tags.map((tag) => (
                  <span key={tag} className="flex items-center gap-2 bg-blue-500/10 text-blue-400 px-3 py-1.5 rounded-lg border border-blue-500/20 text-sm">
                    #{tag}
                    <button type="button" onClick={() => removeTag(tag)} className="hover:text-red-400">
                      <FaTimes size={12} />
                    </button>
                  </span>
                ))}
              </div>
              <div className="flex gap-2">
                <input
                  type="text"
                  value={currentTag}
                  onChange={(e) => setCurrentTag(e.target.value)}
                  onKeyDown={(e) => e.key === 'Enter' && (e.preventDefault(), handleAddTag())}
                  placeholder="Add a tag (press Enter)"
                  className="flex-1 bg-[#3a3b3c] border-none rounded-lg p-3 text-sm text-white placeholder-[#8a8d91] focus:ring-2 focus:ring-blue-500"
                />
                <button
                  type="button"
                  onClick={handleAddTag}
                  className="bg-gray-700 hover:bg-gray-600 px-4 rounded-lg text-sm font-bold transition-colors"
                >
                  Add
                </button>
              </div>
            </div>
          </div>

          {/* Guidelines info */}
          <div className="bg-[#3a3b3c] p-6 flex gap-4">
            <FaInfoCircle className="text-blue-400 mt-1 flex-shrink-0" size={18} />
            <div className="text-xs text-gray-400 leading-relaxed">
              <p className="font-bold text-gray-300 mb-1">Community Guidelines</p>
              By posting, you agree to our community guidelines. Keep discussions helpful and respectful. 
              Duplicate threads may be merged or removed by moderators.
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ThreadCreate;
