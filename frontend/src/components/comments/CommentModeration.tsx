import React, { useState } from 'react';
import { FaCheck, FaTimes, FaShieldAlt, FaFlag, FaUserShield } from 'react-icons/fa';

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

  const handleApprove = () => {
    onApprove?.(comment.id);
  };

  const handleReject = () => {
    if (rejectionReason.trim()) {
      onReject?.(comment.id, rejectionReason);
      setShowRejectForm(false);
      setRejectionReason('');
    }
  };

  const handleRejectClick = () => {
    setShowRejectForm(true);
  };

  const handleCancelReject = () => {
    setShowRejectForm(false);
    setRejectionReason('');
  };

  if (!showActions) {
    return (
      <div className="flex items-center gap-2 text-sm text-gray-500">
        <FaShieldAlt size={12} />
        <span>Under review</span>
      </div>
    );
  }

  return (
    <div className="border border-gray-200 rounded-lg p-4 bg-gray-50">
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center gap-2">
          <FaUserShield className="text-purple-600" />
          <h3 className="text-sm font-semibold text-gray-900">
            Moderation Required
          </h3>
        </div>
        <span className="px-2 py-1 bg-yellow-100 text-yellow-700 text-xs rounded-full">
          Pending
        </span>
      </div>

      <div className="mb-3">
        <p className="text-sm text-gray-700 mb-2">{comment.content}</p>
        <div className="flex items-center gap-2 text-xs text-gray-500">
          <span>By: {comment.user?.name || 'Anonymous'}</span>
          <span>•</span>
          <span>{new Date(comment.createdAt).toLocaleString()}</span>
        </div>
      </div>

      {!showRejectForm ? (
        <div className="flex items-center gap-2">
          <button
            onClick={handleApprove}
            className="flex items-center gap-2 px-4 py-2 bg-green-600 text-white rounded-lg text-sm font-medium hover:bg-green-700 transition-colors"
          >
            <FaCheck size={14} />
            Approve
          </button>
          <button
            onClick={handleRejectClick}
            className="flex items-center gap-2 px-4 py-2 bg-red-600 text-white rounded-lg text-sm font-medium hover:bg-red-700 transition-colors"
          >
            <FaTimes size={14} />
            Reject
          </button>
          <button
            onClick={handleCancelReject}
            className="px-4 py-2 bg-gray-200 text-gray-700 rounded-lg text-sm font-medium hover:bg-gray-300 transition-colors"
          >
            Cancel
          </button>
        </div>
      ) : (
        <div className="space-y-3">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Rejection Reason
            </label>
            <textarea
              value={rejectionReason}
              onChange={(e) => setRejectionReason(e.target.value)}
              placeholder="Please provide a reason for rejection..."
              className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              rows={3}
            />
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={handleReject}
              disabled={!rejectionReason.trim()}
              className="flex items-center gap-2 px-4 py-2 bg-red-600 text-white rounded-lg text-sm font-medium hover:bg-red-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <FaFlag size={14} />
              Reject Comment
            </button>
            <button
              onClick={handleCancelReject}
              className="px-4 py-2 bg-gray-200 text-gray-700 rounded-lg text-sm font-medium hover:bg-gray-300 transition-colors"
            >
              Cancel
            </button>
          </div>
        </div>
      )}
    </div>
  );
};
