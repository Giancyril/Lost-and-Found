import React, { useState, useRef, useCallback, useEffect } from 'react';
import { createPortal } from 'react-dom';
import {
  FaThumbsUp,
  FaHeart,
  FaLaugh,
  FaSurprise,
  FaSadTear,
  FaAngry,
  FaTrash,
  FaCheckCircle,
  FaGhost,
  FaPaperPlane,
  FaReply,
  FaShare,
  FaEllipsisH
} from 'react-icons/fa';
import { formatDistanceToNow } from 'date-fns';
import { useUserVerification } from '../../auth/auth';

interface CommentItemProps {
  comment: any;
  onDeleteComment?: (id: string) => void;
  onVoteHelpful?: (id: string) => void;
  onReply?: (parentId: string, content: string) => void;
  isReply?: boolean;
  allCommenters?: { name: string; isAnonymous: boolean }[];
  itemId: string;
}

interface CommentListProps {
  comments: any[];
  onUpdateComment?: (id: string, data: any) => void;
  onDeleteComment?: (id: string) => void;
  onVoteHelpful?: (id: string) => void;
  onReply?: (parentId: string, content: string) => void;
  itemId: string;
}

const MentionPickerPortal: React.FC<{
  anchorRef: React.RefObject<HTMLDivElement | null>;
  suggestions: { name: string; isAnonymous: boolean }[];
  activeIndex: number;
  onSelect: (name: string) => void;
}> = ({ anchorRef, suggestions, activeIndex, onSelect }) => {
  const [pos, setPos] = useState<{
    top: number;
    left: number;
    width: number;
  } | null>(null);

  const recalc = useCallback(() => {
    if (!anchorRef.current) return;

    const rect = anchorRef.current.getBoundingClientRect();

    setPos({
      top: rect.top + window.scrollY - 8,
      left: rect.left + window.scrollX,
      width: rect.width,
    });
  }, [anchorRef]);

  useEffect(() => {
    recalc();

    window.addEventListener('scroll', recalc, true);
    window.addEventListener('resize', recalc);

    return () => {
      window.removeEventListener('scroll', recalc, true);
      window.removeEventListener('resize', recalc);
    };
  }, [recalc]);

  if (!pos) return null;

  return createPortal(
    <div
      style={{
        position: 'absolute',
        top: pos.top,
        left: pos.left,
        width: pos.width,
        zIndex: 999999,
        transform: 'translateY(-100%)',
      }}
    >
      <div
        style={{
          background: '#242526',
          border: '1px solid rgba(255,255,255,0.1)',
          borderRadius: 12,
          overflow: 'hidden',
          maxHeight: 200,
          overflowY: 'auto',
          boxShadow: '0 8px 32px rgba(0,0,0,0.6)',
        }}
      >
        <div
          style={{
            padding: '6px 12px 4px',
            fontSize: 10,
            fontWeight: 700,
            letterSpacing: '0.08em',
            textTransform: 'uppercase',
            color: '#6b7280',
            borderBottom: '1px solid rgba(255,255,255,0.06)',
          }}
        >
          Mention someone
        </div>

        {suggestions.map((s, i) => (
          <button
            key={s.name}
            onMouseDown={(e) => {
              e.preventDefault();
              onSelect(s.name);
            }}
            style={{
              width: '100%',
              display: 'flex',
              alignItems: 'center',
              gap: 8,
              padding: '8px 12px',
              background:
                i === activeIndex
                  ? 'rgba(59,130,246,0.15)'
                  : 'transparent',
              color: i === activeIndex ? '#93c5fd' : '#d1d5db',
              border: 'none',
              cursor: 'pointer',
              fontSize: 13,
            }}
          >
            <img
              src={`https://ui-avatars.com/api/?name=${encodeURIComponent(
                s.isAnonymous ? 'A' : s.name
              )}&background=${
                s.isAnonymous ? '4b5563' : 'random'
              }&color=fff&size=28`}
              style={{
                width: 28,
                height: 28,
                borderRadius: '50%',
              }}
              alt={s.name}
            />

            @{s.name}
          </button>
        ))}
      </div>
    </div>,
    document.body
  );
};

export const CommentList: React.FC<CommentListProps> = ({
  comments,
  onDeleteComment,
  onVoteHelpful,
  onReply,
  itemId,
}) => {
  if (!comments.length) return null;

  const allCommenters = React.useMemo(() => {
    const seen = new Set<string>();

    const result: {
      name: string;
      isAnonymous: boolean;
    }[] = [];

    const push = (c: any) => {
      const name = c.isAnonymous
        ? 'Anonymous Student'
        : c.user?.name || 'Unknown';

      if (!seen.has(name)) {
        seen.add(name);

        result.push({
          name,
          isAnonymous: !!c.isAnonymous,
        });
      }
    };

    comments.forEach((c) => {
      push(c);
      (c.replies || []).forEach(push);
    });

    return result;
  }, [comments]);

  return (
    <div
      style={{
        display: 'flex',
        flexDirection: 'column',
        gap: 16,
        marginTop: 8,
      }}
    >
      {comments.map((c) => (
        <CommentItem
          key={c.id}
          comment={c}
          onDeleteComment={onDeleteComment}
          onVoteHelpful={onVoteHelpful}
          onReply={onReply}
          itemId={itemId}
          allCommenters={allCommenters}
        />
      ))}
    </div>
  );
};

const CommentItem: React.FC<CommentItemProps> = ({
  comment,
  onDeleteComment,
  onVoteHelpful,
  onReply,
  isReply = false,
  allCommenters = [],
  itemId,
}) => {
  const [liked, setLiked] = useState(false);
  const [showReply, setShowReply] = useState(false);
  const [replyText, setReplyText] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [showMention, setShowMention] = useState(false);
  const [mentionIdx, setMentionIdx] = useState(0);
  const [mentionQuery, setMentionQuery] = useState('');
  const [showReactions, setShowReactions] = useState(false);
  const [selectedReaction, setSelectedReaction] = useState<string | null>(null);
  const [showMoreOptions, setShowMoreOptions] = useState(false);

  const inputRef = useRef<HTMLInputElement>(null);
  const wrapRef = useRef<HTMLDivElement>(null);
  const replyWrapperRef = useRef<HTMLDivElement>(null);
  const reactionsRef = useRef<HTMLDivElement>(null);

  const currentUser: any = useUserVerification();

  const AVATAR_SIZE = isReply ? 28 : 32;

  const reactions = [
    { icon: <FaThumbsUp size={16} />, label: 'Like', color: '#1877f2' },
    { icon: <FaHeart size={16} />, label: 'Love', color: '#f33b58' },
    { icon: <FaLaugh size={16} />, label: 'Haha', color: '#f7b125' },
    { icon: <FaSurprise size={16} />, label: 'Wow', color: '#f7b125' },
    { icon: <FaSadTear size={16} />, label: 'Sad', color: '#f7b125' },
    { icon: <FaAngry size={16} />, label: 'Angry', color: '#e4245b' },
  ];

  const likeCount = (comment.helpfulCount || 0) + (liked ? 1 : 0);
  const isOwner = currentUser?.id === comment.userId || currentUser?.role === 'ADMIN';
  const isAnon = comment.isAnonymous;
  const displayName = isAnon ? 'Anonymous Student' : comment.user?.name || 'Unknown';

  const avatarSrc = isAnon
    ? `https://ui-avatars.com/api/?name=A&background=4b5563&color=fff&size=${AVATAR_SIZE}`
    : comment.user?.userImg ||
      `https://ui-avatars.com/api/?name=${encodeURIComponent(
        displayName
      )}&background=random&size=${AVATAR_SIZE}`;

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

  const mentionSuggestions = mentionQuery
    ? allCommenters.filter((c) =>
        c.name.toLowerCase().includes(mentionQuery.toLowerCase())
      )
    : allCommenters;

  const handleReactionSelect = (reactionType: string) => {
    setSelectedReaction(reactionType);
    setLiked(true);
    setShowReactions(false);
    onVoteHelpful?.(comment.id);
  };

  const handleInputChange = (
    e: React.ChangeEvent<HTMLInputElement>
  ) => {
    const val = e.target.value;
    setReplyText(val);

    const atIdx = val.lastIndexOf('@');
    if (
      atIdx !== -1 &&
      (atIdx === 0 || val[atIdx - 1] === ' ')
    ) {
      setMentionQuery(val.slice(atIdx + 1));
      setShowMention(true);
      setMentionIdx(0);
    } else {
      setShowMention(false);
      setMentionQuery('');
    }
  };

  const handleMentionSelect = (name: string) => {
    const atIdx = replyText.lastIndexOf('@');

    setReplyText(
      `${replyText.slice(0, atIdx)}@${name} `
    );

    setShowMention(false);

    inputRef.current?.focus();
  };

  const handleSubmit = async () => {
    if (!replyText.trim() || submitting) return;

    setSubmitting(true);
    setShowMention(false);

    try {
      await onReply?.(comment.id, replyText.trim());

      setReplyText('');
      setShowReply(false);
    } finally {
      setSubmitting(false);
    }
  };

  const handleKeyDown = (
    e: React.KeyboardEvent
  ) => {
    if (showMention) {
      if (e.key === 'ArrowDown') {
        e.preventDefault();

        setMentionIdx((i) =>
          Math.min(i + 1, mentionSuggestions.length - 1)
        );

        return;
      }

      if (e.key === 'ArrowUp') {
        e.preventDefault();

        setMentionIdx((i) => Math.max(i - 1, 0));

        return;
      }

      if (
        e.key === 'Enter' &&
        mentionSuggestions.length > 0
      ) {
        e.preventDefault();

        handleMentionSelect(
          mentionSuggestions[mentionIdx].name
        );

        return;
      }

      if (e.key === 'Escape') {
        setShowMention(false);
        return;
      }
    }

    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSubmit();
    }

    if (e.key === 'Escape') {
      setShowReply(false);
      setReplyText('');
    }
  };

  return (
    <div
      className="group"
      style={{
        display: 'flex',
        gap: 12,
        marginLeft: isReply ? 40 : 0,
        padding: isReply ? '4px 0' : '8px 0',
        borderRadius: 8,
        transition: 'background-color 0.2s',
      }}
      onMouseEnter={() => setShowMoreOptions(true)}
      onMouseLeave={() => setShowMoreOptions(false)}
    >
      {/* Avatar */}
      <div style={{ flexShrink: 0, marginTop: 2 }}>
        {isAnon ? (
          <div
            style={{
              width: AVATAR_SIZE,
              height: AVATAR_SIZE,
              borderRadius: '50%',
              background: 'linear-gradient(135deg, #4b5563 0%, #6b7280 100%)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              border: '2px solid rgba(255,255,255,0.1)',
            }}
          >
            <FaGhost
              size={isReply ? 10 : 12}
              color="#9ca3af"
            />
          </div>
        ) : (
          <img
            src={avatarSrc}
            alt={displayName}
            style={{
              width: AVATAR_SIZE,
              height: AVATAR_SIZE,
              borderRadius: '50%',
              border: '2px solid rgba(255,255,255,0.15)',
              display: 'block',
            }}
          />
        )}
      </div>

      <div style={{ flex: 1, minWidth: 0 }}>
        {/* Comment bubble */}
        <div
          style={{
            position: 'relative',
            display: 'inline-block',
            maxWidth: '100%',
          }}
        >
          <div
            style={{
              background: isReply ? '#2a2d33' : '#3a3b3c',
              borderRadius: isReply ? 16 : 18,
              padding: '10px 14px',
              border: '1px solid rgba(255,255,255,0.05)',
              boxShadow: '0 1px 3px rgba(0,0,0,0.12)',
            }}
          >
            {/* User name and verification */}
            <div
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: 6,
                marginBottom: 4,
              }}
            >
              <span
                style={{
                  color: '#e4e6eb',
                  fontSize: 13,
                  fontWeight: 700,
                  letterSpacing: '-0.01em',
                }}
              >
                {displayName}
              </span>

              {comment.user?.role === 'ADMIN' && (
                <FaCheckCircle
                  size={11}
                  color="#60a5fa"
                  style={{ marginTop: 1 }}
                />
              )}
              
              <span
                style={{
                  color: '#8a8d91',
                  fontSize: 11,
                  fontWeight: 500,
                  marginLeft: 4,
                }}
              >
                · {timeAgo(comment.createdAt)}
              </span>
            </div>

            {/* Comment content */}
            <p
              style={{
                color: '#e4e6eb',
                fontSize: 15,
                lineHeight: 1.5,
                margin: 0,
                wordBreak: 'break-word',
                whiteSpace: 'pre-wrap',
              }}
            >
              {comment.content}
            </p>

            {/* Location and time tags */}
            {(comment.location || comment.time) && (
              <div
                style={{
                  display: 'flex',
                  flexWrap: 'wrap',
                  gap: 6,
                  marginTop: 8,
                }}
              >
                {comment.location && (
                  <span
                    style={{
                      fontSize: 10,
                      background: 'rgba(59,130,246,0.15)',
                      color: '#93c5fd',
                      padding: '3px 8px',
                      borderRadius: 12,
                      border: '1px solid rgba(59,130,246,0.25)',
                      fontWeight: 500,
                    }}
                  >
                    📍 {comment.location}
                  </span>
                )}
                {comment.time && (
                  <span
                    style={{
                      fontSize: 10,
                      background: 'rgba(16,185,129,0.15)',
                      color: '#6ee7b7',
                      padding: '3px 8px',
                      borderRadius: 12,
                      border: '1px solid rgba(16,185,129,0.25)',
                      fontWeight: 500,
                    }}
                  >
                    ⏰ {comment.time}
                  </span>
                )}
              </div>
            )}
          </div>

          {/* Like count badge */}
          {likeCount > 0 && (
            <div
              style={{
                position: 'absolute',
                bottom: -8,
                right: -4,
                background: '#3a3b3c',
                border: '1px solid rgba(255,255,255,0.08)',
                borderRadius: 20,
                padding: '4px 8px',
                display: 'flex',
                alignItems: 'center',
                gap: 4,
                zIndex: 2,
                boxShadow: '0 2px 8px rgba(0,0,0,0.4)',
              }}
            >
              <div
                style={{
                  width: 16,
                  height: 16,
                  background: selectedReaction ? reactions.find(r => r.label === selectedReaction)?.color || '#1877f2' : '#1877f2',
                  borderRadius: '50%',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                }}
              >
                <FaThumbsUp size={8} color="white" />
              </div>
              <span
                style={{
                  fontSize: 12,
                  color: '#e4e6eb',
                  fontWeight: 600,
                }}
              >
                {likeCount}
              </span>
            </div>
          )}
        </div>

        {/* Action buttons */}
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: 16,
            marginTop: 8,
            marginLeft: 4,
          }}
        >
          {/* Like button with reactions */}
          <div className="relative" ref={reactionsRef}>
            <button
              onClick={() => setShowReactions(!showReactions)}
              style={{
                background: 'none',
                border: 'none',
                color: liked ? '#4a9eff' : '#8a8d91',
                fontSize: 13,
                fontWeight: 600,
                cursor: 'pointer',
                padding: '4px 8px',
                borderRadius: 6,
                transition: 'all 0.2s',
                display: 'flex',
                alignItems: 'center',
                gap: 4,
              }}
              onMouseEnter={() => setShowReactions(true)}
            >
              <FaThumbsUp size={12} />
              Like
            </button>

            {/* Reactions popup */}
            {showReactions && (
              <div
                style={{
                  position: 'absolute',
                  bottom: '100%',
                  left: 0,
                  marginBottom: 8,
                  background: '#2a2d33',
                  border: '1px solid rgba(255,255,255,0.1)',
                  borderRadius: 20,
                  padding: '6px',
                  display: 'flex',
                  gap: 2,
                  boxShadow: '0 8px 32px rgba(0,0,0,0.6)',
                  zIndex: 1000,
                }}
                onMouseLeave={() => setShowReactions(false)}
              >
                {reactions.map((reaction, index) => (
                  <button
                    key={reaction.label}
                    onClick={() => handleReactionSelect(reaction.label)}
                    style={{
                      width: 36,
                      height: 36,
                      borderRadius: '50%',
                      border: 'none',
                      cursor: 'pointer',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      transition: 'transform 0.2s',
                      transform: `scale(${index === 0 ? 1.2 : 1})`,
                    }}
                    onMouseEnter={(e) => {
                      e.currentTarget.style.transform = 'scale(1.3)';
                    }}
                    onMouseLeave={(e) => {
                      e.currentTarget.style.transform = `scale(${index === 0 ? 1.2 : 1})`;
                    }}
                  >
                    <div style={{ color: reaction.color }}>
                      {reaction.icon}
                    </div>
                  </button>
                ))}
              </div>
            )}
          </div>

          {/* Reply button */}
          {onReply && (
            <button
              onClick={() => {
                setShowReply(true);
                setTimeout(() => {
                  inputRef.current?.focus();
                  replyWrapperRef.current?.scrollIntoView({
                    behavior: 'smooth',
                    block: 'nearest',
                  });
                }, 80);
              }}
              style={{
                background: 'none',
                border: 'none',
                color: '#8a8d91',
                fontSize: 13,
                fontWeight: 600,
                cursor: 'pointer',
                padding: '4px 8px',
                borderRadius: 6,
                transition: 'all 0.2s',
                display: 'flex',
                alignItems: 'center',
                gap: 4,
              }}
            >
              <FaReply size={12} />
              Reply
            </button>
          )}

          {/* Share button */}
          <button
            style={{
              background: 'none',
              border: 'none',
              color: '#8a8d91',
              fontSize: 13,
              fontWeight: 600,
              cursor: 'pointer',
              padding: '4px 8px',
              borderRadius: 6,
              transition: 'all 0.2s',
              display: 'flex',
              alignItems: 'center',
              gap: 4,
            }}
          >
            <FaShare size={12} />
            Share
          </button>

          {/* More options */}
          {showMoreOptions && (
            <div
              style={{
                position: 'absolute',
                right: 0,
                top: 0,
                background: '#2a2d33',
                border: '1px solid rgba(255,255,255,0.1)',
                borderRadius: 8,
                padding: '4px',
                boxShadow: '0 4px 16px rgba(0,0,0,0.4)',
                zIndex: 100,
              }}
            >
              <button
                onClick={() => {
                  if (window.confirm('Delete this comment?')) {
                    onDeleteComment?.(comment.id);
                  }
                }}
                style={{
                  background: 'none',
                  border: 'none',
                  color: '#e4e6eb',
                  fontSize: 12,
                  cursor: 'pointer',
                  padding: '6px 12px',
                  borderRadius: 4,
                  display: 'flex',
                  alignItems: 'center',
                  gap: 6,
                  transition: 'background 0.2s',
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.background = 'rgba(255,255,255,0.1)';
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.background = 'transparent';
                }}
              >
                <FaTrash size={10} />
                Delete
              </button>
            </div>
          )}
        </div>

        {/* ✅ UPDATED REPLY INPUT */}
        {showReply && (
          <div
            ref={replyWrapperRef}
            style={{
              display: 'flex',
              gap: 8,
              marginTop: 10,
              alignItems: 'center',
              marginLeft: isReply ? -40 : 0,
              paddingBottom: 8,
              width: 'calc(100% + 40px)', // Ensure full width for nested replies
            }}
          >
            <img
              src={
                currentUser?.userImg ||
                `https://ui-avatars.com/api/?name=${encodeURIComponent(
                  currentUser?.name || 'U'
                )}&background=random&size=32`
              }
              alt="You"
              style={{
                width: 32,
                height: 32,
                borderRadius: '50%',
                flexShrink: 0,
                border:
                  '1px solid rgba(255,255,255,0.08)',
              }}
            />

            <div
              ref={wrapRef}
              style={{
                flex: 1,
                position: 'relative',
                minWidth: 0, // Ensure minimum width
              }}
            >
              <div
                style={{
                  background:
                    'rgba(255,255,255,0.07)',
                  border:
                    '1px solid rgba(255,255,255,0.1)',
                  borderRadius: 20,
                  padding: '7px 12px',
                  display: 'flex',
                  alignItems: 'center',
                  gap: 8,
                  minWidth: '200px', // Ensure minimum width for input
                }}
              >
                <input
                  ref={inputRef}
                  value={replyText}
                  onChange={handleInputChange}
                  onKeyDown={handleKeyDown}
                  onBlur={() =>
                    setTimeout(
                      () => setShowMention(false),
                      150
                    )
                  }
                  placeholder={`Reply to ${
                    isAnon
                      ? 'Anonymous'
                      : comment.user?.name || 'Anonymous'
                  }…`}
                  style={{
                    flex: 1,
                    background: 'transparent',
                    border: 'none',
                    outline: 'none',
                    color: '#e4e6eb',
                    fontSize: 'clamp(11px, 2.5vw, 12.5px)',
                    minWidth: '100px',
                  }}
                  autoFocus
                />

                <button
                  onClick={handleSubmit}
                  disabled={
                    !replyText.trim() || submitting
                  }
                  style={{
                    width: 24,
                    height: 24,
                    borderRadius: '50%',
                    background: replyText.trim()
                      ? '#1877f2'
                      : 'transparent',
                    border: 'none',
                    cursor: replyText.trim()
                      ? 'pointer'
                      : 'default',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    flexShrink: 0,
                  }}
                >
                  {submitting
                    ? <div style={{ width: 10, height: 10, border: '1.5px solid white', borderTopColor: 'transparent', borderRadius: '50%', animation: 'spin 0.6s linear infinite' }} />
                    : <FaPaperPlane size={9} color={replyText.trim() ? 'white' : '#606770'} />}
                </button>
              </div>

              {showMention &&
                mentionSuggestions.length > 0 && (
                  <MentionPickerPortal
                    anchorRef={wrapRef}
                    suggestions={mentionSuggestions}
                    activeIndex={mentionIdx}
                    onSelect={handleMentionSelect}
                  />
                )}
            </div>
          </div>
        )}

        {(comment.replies || []).length > 0 && (
          <div
            style={{
              marginTop: 10,
              borderLeft:
                '2px solid rgba(255,255,255,0.06)',
              paddingLeft: 12,
              display: 'flex',
              flexDirection: 'column',
              gap: 10,
            }}
          >
            {(comment.replies || []).map((r: any) => (
              <CommentItem
                key={r.id}
                comment={r}
                onDeleteComment={onDeleteComment}
                onVoteHelpful={onVoteHelpful}
                onReply={onReply}
                isReply
                itemId={itemId}
                allCommenters={allCommenters}
              />
            ))}
          </div>
        )}
      </div>

      <style>{`
        @keyframes spin {
          to {
            transform: rotate(360deg)
          }
        }
      `}</style>
    </div>
  );
};