import React from 'react';
interface CommentFiltersProps {
  filter: string;
  onChange: (filter: string) => void;
}

export const CommentFilters: React.FC<CommentFiltersProps> = ({ filter, onChange }) => {
  const filters = [
    { value: 'all',       label: 'All'       },
    { value: 'helpful',   label: 'Helpful'   },
    { value: 'questions', label: 'Questions' },
    { value: 'sightings', label: 'Sightings' },
  ];

  return (
    <div
      className="inline-flex items-center gap-1 p-1 rounded-2xl"
      style={{
        background: 'rgba(255,255,255,0.04)',
        border: '1px solid rgba(255,255,255,0.07)',
      }}
    >
      {filters.map(f => {
        const active = filter === f.value;
        return (
          <button
            key={f.value}
            onClick={() => onChange(f.value)}
            className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl
              text-[11px] font-semibold whitespace-nowrap transition-all duration-150
              focus:outline-none select-none"
            style={{
              background:  active ? 'rgba(59,130,246,0.15)' : 'transparent',
              color:       active ? '#93c5fd'               : 'rgba(156,163,175,0.8)',
              border:      active ? '1px solid rgba(59,130,246,0.25)' : '1px solid transparent',
            }}
            onMouseEnter={e => {
              if (!active) {
                e.currentTarget.style.background = 'rgba(255,255,255,0.05)';
                e.currentTarget.style.color = 'rgba(229,231,235,0.9)';
              }
            }}
            onMouseLeave={e => {
              if (!active) {
                e.currentTarget.style.background = 'transparent';
                e.currentTarget.style.color = 'rgba(156,163,175,0.8)';
              }
            }}
          >
            {f.label}
          </button>
        );
      })}
    </div>
  );
};