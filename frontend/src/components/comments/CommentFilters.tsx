import React from 'react';
import { FaThumbsUp, FaQuestion, FaEye, FaList } from 'react-icons/fa';

interface CommentFiltersProps {
  filter: string;
  onChange: (filter: string) => void;
}

export const CommentFilters: React.FC<CommentFiltersProps> = ({ filter, onChange }) => {
  const filters = [
    { value: 'all',       label: 'All',       icon: <FaList size={10} />      },
    { value: 'helpful',   label: 'Helpful',   icon: <FaThumbsUp size={10} />  },
    { value: 'questions', label: 'Questions', icon: <FaQuestion size={10} />  },
    { value: 'sightings', label: 'Sightings', icon: <FaEye size={10} />       },
  ];

  return (
    <div className="flex items-center gap-1.5 flex-wrap">
      {filters.map(f => (
        <button
          key={f.value}
          onClick={() => onChange(f.value)}
          className={`inline-flex items-center gap-1.5 text-[11px] px-3 py-1.5 rounded-full border font-bold transition-all ${
            filter === f.value
              ? 'bg-blue-600 text-white border-blue-600 shadow-md'
              : 'bg-[#3a3b3c] text-gray-300 border-transparent hover:bg-[#4a4b4c] hover:text-white'
          }`}
        >
          {f.icon}
          {f.label}
        </button>
      ))}
    </div>
  );
};