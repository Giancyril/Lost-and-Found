import React, { useState } from 'react';
import { FaCheck, FaTimes, FaShieldAlt, FaFlag, FaUserShield, FaEye, FaTrash, FaExclamationTriangle, FaClock } from 'react-icons/fa';

interface CommentModerationProps {
  comment: any;
  onApprove?: (commentId: string) => void;
  onReject?: (commentId: string, reason: string) => void;
  showActions?: boolean;
}

export const CommentModeration: React.FC<CommentModerationProps> = ({
  comment,
  onApprove,
  onReject,
  showActions = false
}) => {
  const [rejectionReason, setRejectionReason] = useState('');
  const [showRejectForm, setShowRejectForm] = useState(false);
  const [selectedReason, setSelectedReason] = useState('');

  const rejectionReasons = [
    'Spam or misleading content',
    'Harassment or bullying',
    'Hate speech or discrimination',
    'Violence or dangerous content',
    'Inappropriate or offensive',
    'False information',
    'Off-topic',
    'Other'
  ];

  const handleApprove = () => {
    onApprove?.(comment.id);
  };

  const handleReject = () => {
    const reason = selectedReason || rejectionReason.trim();
    if (reason) {
      onReject?.(comment.id, reason);
      setShowRejectForm(false);
      setRejectionReason('');
      setSelectedReason('');
    }
  };

  const handleRejectClick = () => {
    setShowRejectForm(true);
  };

  const handleCancelReject = () => {
    setShowRejectForm(false);
    setRejectionReason('');
    setSelectedReason('');
  };

  const timeAgo = (d: string) => {
    try {
      const now = new Date();
      const commentTime = new Date(d);
      const diffInMinutes = Math.floor((now.getTime() - commentTime.getTime()) / (1000 * 60));
      
      if (diffInMinutes < 1) return 'Just now';
      if (diffInMinutes < 60) return `${diffInMinutes}m`;
      if (diffInMinutes < 1440) return `${Math.floor(diffInMinutes / 60)}h`;
      return `${Math.floor(diffInMinutes / 1440)}d`;
    } catch {
      return 'now';
    }
  };

  if (!showActions) {
    return (
      <div className="flex items-center gap-2 px-3 py-2 rounded-lg"
        style={{
          background: 'rgba(59,130,246,0.08)',
          border: '1px solid rgba(59,130,246,0.2)',
        }}
      >
        <FaShieldAlt size={12} className="text-blue-400" />
        <span className="text-sm text-blue-300 font-medium">Under review</span>
        <div className="flex items-center gap-1 text-xs text-blue-400">
          <FaClock size={8} />
          <span>{timeAgo(comment.createdAt)}</span>
        </div>
      </div>
    );
  }

  return (
    <div 
      className="rounded-2xl overflow-hidden"
      style={{
        background: 'linear-gradient(135deg, #1a1d23 0%, #2a2d33 100%)',
        border: '1px solid rgba(255,255,255,0.1)',
        boxShadow: '0 8px 32px rgba(0,0,0,0.4)',
      }}
    >
      {/* Header */}
      <div className="flex items-center justify-between px-5 py-4 border-b border-gray-700/50">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl flex items-center justify-center"
            style={{
              background: 'linear-gradient(135deg, rgba(168,85,247,0.15) 0%, rgba(196,181,253,0.1) 100%)',
              border: '1px solid rgba(168,85,247,0.3)',
            }}
          >
            <FaUserShield className="text-purple-400" size={18} />
          </div>
          <div>
            <h3 className="text-base font-bold text-white mb-1">Content Review</h3>
            <div className="flex items-center gap-3">
              <span className="px-2 py-1 bg-yellow-500/20 text-yellow-400 text-xs rounded-full font-medium">
                Pending Review
              </span>
              <span className="text-xs text-gray-500">
                {timeAgo(comment.createdAt)}
              </span>
            </div>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <button
            className="w-8 h-8 rounded-lg flex items-center justify-center text-gray-400 hover:text-white hover:bg-white/10 transition-all"
            title="View details"
          >
            <FaEye size={14} />
          </button>
          <button
            className="w-8 h-8 rounded-lg flex items-center justify-center text-gray-400 hover:text-red-400 hover:bg-red-500/20 transition-all"
            title="Delete comment"
          >
            <FaTrash size={14} />
          </button>
        </div>
      </div>

      {/* Content preview */}
      <div className="px-5 py-4">
        <div className="mb-4">
          <div className="flex items-center gap-2 mb-2">
            <span className="text-sm font-semibold text-white">
              {comment.user?.name || 'Anonymous'}
            </span>
            <span className="text-xs text-gray-500">•</span>
            <span className="text-xs text-gray-500">{new Date(comment.createdAt).toLocaleString()}</span>
          </div>
          <div className="p-3 rounded-lg" style={{ background: 'rgba(0,0,0,0.2)' }}>
            <p className="text-sm text-gray-300 leading-relaxed">{comment.content}</p>
          </div>
        </div>

        {/* Action buttons or rejection form */}
        {!showRejectForm ? (
          <div className="flex items-center gap-3">
            <button
              onClick={handleApprove}
              className="flex items-center gap-2 px-5 py-2.5 bg-green-600 text-white rounded-xl text-sm font-semibold hover:bg-green-700 transition-all shadow-lg shadow-green-600/25"
            >
              <FaCheck size={14} />
              Approve
            </button>
            <button
              onClick={handleRejectClick}
              className="flex items-center gap-2 px-5 py-2.5 bg-red-600 text-white rounded-xl text-sm font-semibold hover:bg-red-700 transition-all shadow-lg shadow-red-600/25"
            >
              <FaTimes size={14} />
              Reject
            </button>
            <button
              onClick={handleCancelReject}
              className="px-5 py-2.5 bg-gray-700 text-gray-300 rounded-xl text-sm font-medium hover:bg-gray-600 transition-all"
            >
              Cancel
            </button>
          </div>
        ) : (
          <div className="space-y-4">
            {/* Quick reason selection */}
            <div>
              <label className="block text-sm font-semibold text-white mb-3">Reason for rejection</label>
              <div className="grid grid-cols-2 gap-2">
                {rejectionReasons.map((reason) => (
                  <button
                    key={reason}
                    onClick={() => setSelectedReason(reason)}
                    className={`px-3 py-2 rounded-lg text-xs font-medium transition-all text-left ${
                      selectedReason === reason
                        ? 'bg-red-500/20 text-red-400 border border-red-500/30'
                        : 'bg-gray-700/50 text-gray-400 border border-gray-600/30 hover:bg-gray-700 hover:text-gray-300'
                    }`}
                  >
                    {reason}
                  </button>
                ))}
              </div>
            </div>

            {/* Custom reason */}
            {(selectedReason === 'Other' || !selectedReason) && (
              <div>
                <label className="block text-sm font-semibold text-white mb-2">
                  Additional details {selectedReason === 'Other' && '(required)'}
                </label>
                <textarea
                  value={rejectionReason}
                  onChange={(e) => setRejectionReason(e.target.value)}
                  placeholder="Please provide additional details about why this content should be rejected..."
                  className="w-full px-4 py-3 bg-gray-800/50 border border-gray-600/50 rounded-xl text-sm text-gray-300 placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-red-500/50 focus:border-red-500/50 resize-none"
                  rows={3}
                  style={{ backdropFilter: 'blur(10px)' }}
                />
              </div>
            )}

            {/* Form actions */}
            <div className="flex items-center gap-3 pt-2">
              <button
                onClick={handleReject}
                disabled={(!selectedReason && !rejectionReason.trim()) || (selectedReason === 'Other' && !rejectionReason.trim())}
                className="flex items-center gap-2 px-5 py-2.5 bg-red-600 text-white rounded-xl text-sm font-semibold hover:bg-red-700 transition-all shadow-lg shadow-red-600/25 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                <FaFlag size={14} />
                Reject Comment
              </button>
              <button
                onClick={handleCancelReject}
                className="px-5 py-2.5 bg-gray-700 text-gray-300 rounded-xl text-sm font-medium hover:bg-gray-600 transition-all"
              >
                Cancel
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
