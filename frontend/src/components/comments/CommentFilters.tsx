import React from 'react';
import { FaThumbsUp, FaQuestion, FaEye, FaBars, FaFire, FaClock, FaStar } from 'react-icons/fa';

interface CommentFiltersProps {
  filter: string;
  onChange: (filter: string) => void;
}

export const CommentFilters: React.FC<CommentFiltersProps> = ({ filter, onChange }) => {
  const filters = [
    { 
      value: 'all', 
      label: 'All', 
      icon: <FaBars size={10} />,
      color: '#8a8d91',
      bgActive: 'rgba(138,141,145,0.15)',
      borderActive: 'rgba(138,141,145,0.3)'
    },
    { 
      value: 'helpful', 
      label: 'Helpful', 
      icon: <FaThumbsUp size={10} />,
      color: '#1877f2',
      bgActive: 'rgba(24,119,242,0.15)',
      borderActive: 'rgba(24,119,242,0.3)'
    },
    { 
      value: 'questions', 
      label: 'Questions', 
      icon: <FaQuestion size={10} />,
      color: '#f7b125',
      bgActive: 'rgba(247,177,37,0.15)',
      borderActive: 'rgba(247,177,37,0.3)'
    },
    { 
      value: 'sightings', 
      label: 'Sightings', 
      icon: <FaEye size={10} />,
      color: '#42b883',
      bgActive: 'rgba(66,184,131,0.15)',
      borderActive: 'rgba(66,184,131,0.3)'
    },
  ];

  return (
    <div
      className="flex items-center p-1 gap-1 rounded-xl overflow-x-auto"
      style={{ 
        background: 'rgba(255,255,255,0.06)', 
        border: '1px solid rgba(255,255,255,0.08)',
        backdropFilter: 'blur(10px)',
        scrollbarWidth: 'none',
        msOverflowStyle: 'none'
      }}
    >
      {filters.map(f => {
        const active = filter === f.value;
        return (
          <button
            key={f.value}
            onClick={() => onChange(f.value)}
            className="inline-flex items-center gap-2 rounded-xl font-medium transition-all duration-200 whitespace-nowrap relative flex-shrink-0"
            style={{
              fontSize: 'clamp(10px, 2.5vw, 12px)',
              padding: 'clamp(4px, 1vw, 6px) clamp(8px, 2vw, 14px)',
              fontWeight: 600,
              letterSpacing: '0.01em',
              background: active 
                ? f.bgActive 
                : 'transparent',
              color: active 
                ? f.color 
                : 'rgba(156,163,175,0.8)',
              border: active 
                ? `1px solid ${f.borderActive}` 
                : '1px solid transparent',
              transform: active ? 'scale(1.02)' : 'scale(1)',
              boxShadow: active 
                ? `0 2px 8px ${f.color}20` 
                : 'none',
              minWidth: 'fit-content'
            }}
            onMouseEnter={(e) => {
              if (!active) {
                e.currentTarget.style.background = 'rgba(255,255,255,0.05)';
                e.currentTarget.style.color = 'rgba(229,231,235,0.9)';
              }
            }}
            onMouseLeave={(e) => {
              if (!active) {
                e.currentTarget.style.background = 'transparent';
                e.currentTarget.style.color = 'rgba(156,163,175,0.8)';
              }
            }}
          >
            <span 
              style={{ 
                opacity: active ? 1 : 0.7,
                transition: 'opacity 0.2s',
                fontSize: 'clamp(8px, 2vw, 10px)'
              }}
            >
              {f.icon}
            </span>
            <span className="relative" style={{ fontSize: 'clamp(10px, 2.5vw, 12px)' }}>
              {f.label}
              {active && (
                <span 
                  className="absolute -top-1 -right-2 w-1.5 h-1.5 rounded-full animate-pulse"
                  style={{ background: f.color }}
                />
              )}
            </span>
            {active && (
              <div 
                className="absolute inset-0 rounded-xl"
                style={{
                  background: `linear-gradient(135deg, ${f.color}15 0%, transparent 100%)`,
                  pointerEvents: 'none',
                }}
              />
            )}
          </button>
        );
      })}
    </div>
  );
};