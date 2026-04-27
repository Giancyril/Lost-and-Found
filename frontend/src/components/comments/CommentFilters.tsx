import React from 'react';
import { FaThumbsUp, FaQuestion, FaEye, FaBars } from 'react-icons/fa';

interface CommentFiltersProps {
  filter: string;
  onChange: (filter: string) => void;
}

export const CommentFilters: React.FC<CommentFiltersProps> = ({ filter, onChange }) => {
  const filters = [
    { value: 'all',       label: 'All',       icon: <FaBars     size={9} /> },
    { value: 'helpful',   label: 'Helpful',   icon: <FaThumbsUp size={9} /> },
    { value: 'questions', label: 'Questions', icon: <FaQuestion size={9} /> },
    { value: 'sightings', label: 'Sightings', icon: <FaEye      size={9} /> },
  ];

  return (
    <div
      className="flex items-center p-0.5 gap-0.5 rounded-lg"
      style={{ background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.06)' }}
    >
      {filters.map(f => {
        const active = filter === f.value;
        return (
          <button
            key={f.value}
            onClick={() => onChange(f.value)}
            className="inline-flex items-center gap-1.5 rounded-md font-medium transition-all whitespace-nowrap"
            style={{
              fontSize: '11px',
              padding: '5px 10px',
              background: active ? 'rgba(59,130,246,0.18)' : 'transparent',
              color: active ? '#93c5fd' : 'rgba(156,163,175,0.8)',
              border: active ? '1px solid rgba(59,130,246,0.25)' : '1px solid transparent',
              letterSpacing: '0.01em',
            }}
          >
            <span style={{ opacity: active ? 1 : 0.6 }}>{f.icon}</span>
            {f.label}
          </button>
        );
      })}
    </div>
  );
};