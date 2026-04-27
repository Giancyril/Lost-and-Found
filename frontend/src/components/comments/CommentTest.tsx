import React from 'react';
import { CommentSection } from './CommentSection';

// Test component to verify comment system works
export const CommentTest: React.FC = () => {
  return (
    <div className="max-w-4xl mx-auto p-8">
      <h2 className="text-2xl font-bold mb-6">Community Features Test</h2>
      
      {/* Test with a sample item */}
      <CommentSection 
        itemId="test-item-123" 
        itemType="found"
      />
      
      <div className="mt-8 p-4 bg-yellow-50 border border-yellow-200 rounded-lg">
        <h3 className="text-lg font-semibold mb-2">Test Status</h3>
        <p className="text-sm text-gray-700">
          • Dependencies: Installed ✅<br />
          • WebSocket Server: Created ✅<br />
          • Components: Created ✅<br />
          • Integration: In Progress ⏳
        </p>
        <p className="text-xs text-gray-600 mt-2">
          Next: Integrate with FoundItems page and test real-time functionality
        </p>
      </div>
    </div>
  );
};
