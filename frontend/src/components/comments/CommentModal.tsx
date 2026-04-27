import React from 'react';
import { FaTimes, FaComments } from 'react-icons/fa';
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
      className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/70 backdrop-blur-md"
      style={{ animation: 'fadeIn 0.18s ease' }}
    >
      {/* Click-outside backdrop */}
      <div className="absolute inset-0" onClick={onClose} />

      <div
        className="relative w-full max-w-2xl flex flex-col max-h-[88vh] rounded-2xl overflow-hidden shadow-2xl"
        style={{
          background: 'linear-gradient(160deg, #0f1318 0%, #0d1117 100%)',
          border: '1px solid rgba(255,255,255,0.07)',
          boxShadow: '0 32px 80px rgba(0,0,0,0.7), 0 0 0 1px rgba(255,255,255,0.04)',
          animation: 'slideUp 0.2s cubic-bezier(0.16,1,0.3,1)',
        }}
        onClick={e => e.stopPropagation()}
      >
        {/* Header */}
        <div
          className="flex items-center justify-between px-5 py-4 shrink-0"
          style={{ borderBottom: '1px solid rgba(255,255,255,0.06)' }}
        >
          <div className="flex items-center gap-3 min-w-0">
            <div
              className="w-9 h-9 rounded-xl flex items-center justify-center shrink-0"
              style={{ background: 'rgba(59,130,246,0.12)', border: '1px solid rgba(59,130,246,0.2)' }}
            >
              <FaComments size={15} className="text-blue-400" />
            </div>
            <div className="min-w-0">
              <h3
                className="font-semibold text-white leading-tight truncate"
                style={{ fontSize: '14px', letterSpacing: '-0.01em' }}
              >
                {itemName}
              </h3>
              <p className="text-gray-500 mt-0.5" style={{ fontSize: '11px' }}>
                Community Discussion & Sightings
              </p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="shrink-0 w-8 h-8 rounded-full flex items-center justify-center text-gray-500 hover:text-white transition-all ml-4"
            style={{
              background: 'rgba(255,255,255,0.05)',
              border: '1px solid rgba(255,255,255,0.08)',
            }}
          >
            <FaTimes size={13} />
          </button>
        </div>

        {/* Scrollable content */}
        <div className="flex-1 overflow-y-auto" style={{ scrollbarWidth: 'thin', scrollbarColor: 'rgba(255,255,255,0.1) transparent' }}>
          <CommentSection itemId={itemId} itemType={itemType} isModalView={true} />
        </div>
      </div>

      <style>{`
        @keyframes fadeIn  { from { opacity: 0 } to { opacity: 1 } }
        @keyframes slideUp { from { opacity: 0; transform: translateY(16px) scale(0.98) } to { opacity: 1; transform: translateY(0) scale(1) } }
      `}</style>
    </div>
  );
};