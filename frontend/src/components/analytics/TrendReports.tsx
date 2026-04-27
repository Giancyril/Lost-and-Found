import React from 'react';
import { 
  AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, 
  ResponsiveContainer, BarChart, Bar, Legend 
} from 'recharts';
import { FaChartLine, FaFilter } from 'react-icons/fa';

interface TrendReportsProps {
  data?: any[];
  isLoading?: boolean;
}

const TrendReports: React.FC<TrendReportsProps> = ({ data = [], isLoading }) => {
  // Mock data for visualization if none provided
  const mockData = [
    { name: 'Mon', threads: 12, replies: 45, users: 4 },
    { name: 'Tue', threads: 19, replies: 52, users: 8 },
    { name: 'Wed', threads: 15, replies: 38, users: 5 },
    { name: 'Thu', threads: 22, replies: 65, users: 12 },
    { name: 'Fri', threads: 30, replies: 88, users: 15 },
    { name: 'Sat', threads: 18, replies: 42, users: 7 },
    { name: 'Sun', threads: 14, replies: 35, users: 3 },
  ];

  const chartData = data.length > 0 ? data : mockData;

  return (
    <div className="bg-[#121417] rounded-2xl border border-white/5 p-8 shadow-2xl">
      <div className="flex items-center justify-between mb-8">
        <div>
          <h3 className="text-lg font-bold text-white flex items-center gap-2">
            <FaChartLine className="text-blue-500" /> Platform Activity Trends
          </h3>
          <p className="text-xs text-gray-500 mt-1">Real-time interaction and growth metrics</p>
        </div>
        <div className="flex gap-2">
          <button className="px-3 py-1.5 bg-gray-800 border border-gray-700 rounded-lg text-xs text-gray-400 hover:text-white transition-colors flex items-center gap-2">
            <FaFilter size={10} /> Last 7 Days
          </button>
        </div>
      </div>

      <div className="h-[350px] w-full">
        {isLoading ? (
          <div className="h-full flex items-center justify-center text-gray-600">Loading chart data...</div>
        ) : (
          <ResponsiveContainer width="100%" height="100%">
            <AreaChart data={chartData} margin={{ top: 10, right: 10, left: 0, bottom: 0 }}>
              <defs>
                <linearGradient id="colorThreads" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#3b82f6" stopOpacity={0.3}/>
                  <stop offset="95%" stopColor="#3b82f6" stopOpacity={0}/>
                </linearGradient>
                <linearGradient id="colorReplies" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#a855f7" stopOpacity={0.3}/>
                  <stop offset="95%" stopColor="#a855f7" stopOpacity={0}/>
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" stroke="#374151" vertical={false} />
              <XAxis 
                dataKey="name" 
                stroke="#6b7280" 
                fontSize={12} 
                tickLine={false} 
                axisLine={false} 
              />
              <YAxis 
                stroke="#6b7280" 
                fontSize={12} 
                tickLine={false} 
                axisLine={false}
                tickFormatter={(value) => `${value}`}
              />
              <Tooltip 
                contentStyle={{ backgroundColor: '#1f2937', border: '1px solid #374151', borderRadius: '8px' }}
                itemStyle={{ fontSize: '12px', fontWeight: 'bold' }}
              />
              <Legend verticalAlign="top" height={36} iconType="circle" />
              <Area 
                type="monotone" 
                dataKey="threads" 
                name="New Threads"
                stroke="#3b82f6" 
                strokeWidth={3}
                fillOpacity={1} 
                fill="url(#colorThreads)" 
              />
              <Area 
                type="monotone" 
                dataKey="replies" 
                name="Community Replies"
                stroke="#a855f7" 
                strokeWidth={3}
                fillOpacity={1} 
                fill="url(#colorReplies)" 
              />
            </AreaChart>
          </ResponsiveContainer>
        )}
      </div>
      
      <div className="grid grid-cols-3 gap-4 mt-8 pt-6 border-t border-gray-800">
        <div className="text-center">
          <p className="text-[10px] text-gray-500 font-bold uppercase tracking-widest mb-1">Peak Day</p>
          <p className="text-lg font-bold text-white">Friday</p>
        </div>
        <div className="text-center">
          <p className="text-[10px] text-gray-500 font-bold uppercase tracking-widest mb-1">Avg. Replies</p>
          <p className="text-lg font-bold text-white">52.4</p>
        </div>
        <div className="text-center">
          <p className="text-[10px] text-gray-500 font-bold uppercase tracking-widest mb-1">Weekly Growth</p>
          <p className="text-lg font-bold text-green-400">+14.2%</p>
        </div>
      </div>
    </div>
  );
};

export default TrendReports;
