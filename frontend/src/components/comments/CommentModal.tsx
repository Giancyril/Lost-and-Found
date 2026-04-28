import React from 'react';
import { FaTimes, FaComments, FaUsers, FaShare } from 'react-icons/fa';
import { CommentSection } from './CommentSection';

interface CommentModalProps {
  isOpen: boolean;
  onClose: () => void;
  itemId: string;
  itemType: 'lost' | 'found';
  itemName: string;
}

export const CommentModal: React.FC<CommentModalProps> = ({
  isOpen,
  onClose,
  itemId,
  itemType,
  itemName,
}) => {
  if (!isOpen) return null;

  return (
    <div
      className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm"
      style={{ animation: 'fadeIn 0.15s ease-out' }}
    >
      {/* Click-outside backdrop */}
      <div className="absolute inset-0" onClick={onClose} />

      <div
        className="relative w-full max-w-3xl flex flex-col max-h-[90vh] rounded-2xl shadow-2xl overflow-hidden border border-white/10"
        style={{
          background: 'linear-gradient(180deg, #1a1d23 0%, #0f1318 100%)',
          boxShadow: '0 40px 120px rgba(0,0,0,0.8), 0 0 0 1px rgba(255,255,255,0.08)',
          animation: 'slideUp 0.25s cubic-bezier(0.34,1.56,0.64,1)',
        }}
        onClick={e => e.stopPropagation()}
      >
        {/* Header */}
        <div
          className="flex items-center justify-between px-6 py-4 shrink-0"
          style={{ borderBottom: '1px solid rgba(255,255,255,0.08)' }}
        >
          <div className="flex items-center gap-4 min-w-0">
            <div
              className="w-10 h-10 rounded-2xl flex items-center justify-center shrink-0"
              style={{ 
                background: 'linear-gradient(135deg, rgba(59,130,246,0.15) 0%, rgba(147,197,253,0.1) 100%)', 
                border: '1px solid rgba(59,130,246,0.25)',
                backdropFilter: 'blur(10px)'
              }}
            >
              <FaComments size={18} className="text-blue-400" />
            </div>
            <div className="min-w-0">
              <h3
                className="font-bold text-white leading-tight truncate"
                style={{ fontSize: '16px', letterSpacing: '-0.02em' }}
              >
                {itemName}
              </h3>
              <div className="flex items-center gap-3 mt-1">
                <p className="text-gray-400" style={{ fontSize: '12px' }}>
                  Community Discussion
                </p>
                <div className="flex items-center gap-2 text-gray-500" style={{ fontSize: '11px' }}>
                  <FaUsers size={10} />
                  <span>Active</span>
                </div>
              </div>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              className="shrink-0 w-8 h-8 rounded-full flex items-center justify-center text-gray-400 hover:text-white hover:bg-white/10 transition-all"
              style={{
                background: 'transparent',
                border: '1px solid rgba(255,255,255,0.1)',
              }}
              title="Share discussion"
            >
              <FaShare size={12} />
            </button>
            <button
              onClick={onClose}
              className="shrink-0 w-9 h-9 rounded-full flex items-center justify-center text-gray-400 hover:text-white hover:bg-red-500/20 transition-all"
              style={{
                background: 'rgba(255,255,255,0.05)',
                border: '1px solid rgba(255,255,255,0.1)',
              }}
              title="Close"
            >
              <FaTimes size={14} />
            </button>
          </div>
        </div>

        {/* Body — let CommentSection own scroll + pinned input */}
        <div className="flex-1 min-h-0 flex flex-col">
          <CommentSection itemId={itemId} itemType={itemType} isModalView={true} />
        </div>
      </div>

      <style>{`
        @keyframes fadeIn { 
          from { opacity: 0 } 
          to { opacity: 1 } 
        }
        @keyframes slideUp { 
          from { 
            opacity: 0; 
            transform: translateY(20px) scale(0.96) 
          } 
          to { 
            opacity: 1; 
            transform: translateY(0) scale(1) 
          } 
        }
      `}</style>
    </div>
  );
};