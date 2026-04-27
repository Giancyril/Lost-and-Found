import React from 'react';
import { FaTimes } from 'react-icons/fa';
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
  itemName
}) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-in fade-in duration-200">
      <div 
        className="relative w-full max-w-2xl bg-gray-900 border border-gray-800 rounded-2xl shadow-2xl flex flex-col max-h-[90vh] overflow-hidden animate-in zoom-in-95 duration-200"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-gray-800 bg-gray-900/50">
          <div>
            <h3 className="text-lg font-bold text-white leading-tight">
              {itemName}'s Post
            </h3>
            <p className="text-[12px] text-gray-500 mt-0.5">Community Discussion & Sightings</p>
          </div>
          <button 
            onClick={onClose}
            className="w-9 h-9 rounded-full bg-gray-800 hover:bg-gray-700 text-gray-400 hover:text-white flex items-center justify-center transition-all border border-gray-700"
          >
            <FaTimes size={16} />
          </button>
        </div>

        {/* Content Area */}
        <div className="flex-1 overflow-y-auto custom-scrollbar bg-gray-900 p-4 sm:p-6">
          <CommentSection itemId={itemId} itemType={itemType} isModalView={true} />
        </div>
      </div>
      
      {/* Click outside to close */}
      <div className="absolute inset-0 -z-10" onClick={onClose} />
    </div>
  );
};
