import React from 'react';
import { FaBell, FaExclamationTriangle, FaPlus, FaTrash, FaCheckCircle, FaChartBar } from 'react-icons/fa';
import { toast } from 'react-toastify';

const AlertSystem: React.FC = () => {
  // Mock active alerts
  const alerts = [
    { id: '1', name: 'Low Engagement', metric: 'User Engagement', threshold: '< 30%', status: 'Active', severity: 'warning' },
    { id: '2', name: 'Spike in Reports', metric: 'Lost Items', threshold: '> 50/day', status: 'Active', severity: 'danger' },
  ];

  const handleAddAlert = () => {
    toast.info('Alert configuration coming soon');
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between px-2">
        <div>
          <h3 className="text-lg font-bold text-white flex items-center gap-2">
            <FaBell className="text-yellow-500" /> Platform Monitoring Alerts
          </h3>
          <p className="text-xs text-gray-500 mt-1">Automated threshold-based monitoring</p>
        </div>
        <button
          onClick={handleAddAlert}
          className="bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold px-4 py-2 rounded-lg flex items-center gap-2 transition-all shadow-lg"
        >
          <FaPlus /> Configure Alert
        </button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Active Alerts List */}
        <div className="lg:col-span-2 space-y-4">
          {alerts.map(alert => (
            <div key={alert.id} className="bg-[#242526] p-5 rounded-2xl border border-gray-800 flex items-center gap-4 hover:border-gray-700 transition-all shadow-lg group">
              <div className={`w-12 h-12 rounded-xl flex items-center justify-center text-xl ${
                alert.severity === 'danger' ? 'bg-red-500/10 text-red-500' : 'bg-yellow-500/10 text-yellow-500'
              }`}>
                {alert.severity === 'danger' ? <FaExclamationTriangle /> : <FaExclamationTriangle />}
              </div>
              
              <div className="flex-1">
                <div className="flex items-center gap-2">
                  <h4 className="text-white font-bold">{alert.name}</h4>
                  <span className="px-2 py-0.5 bg-green-500/10 text-green-400 text-[8px] font-bold uppercase rounded-full border border-green-500/20">
                    {alert.status}
                  </span>
                </div>
                <div className="flex items-center gap-4 mt-1">
                  <p className="text-xs text-gray-400 flex items-center gap-1"><FaChartBar size={10} /> {alert.metric}</p>
                  <p className="text-xs text-gray-500 font-bold">{alert.threshold}</p>
                </div>
              </div>

              <div className="flex items-center gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                <button className="w-8 h-8 rounded-lg bg-gray-700 hover:bg-gray-600 flex items-center justify-center text-gray-400 hover:text-white">
                  <FaTrash size={12} />
                </button>
              </div>
            </div>
          ))}
        </div>

        {/* Status Card */}
        <div className="bg-[#242526] p-6 rounded-2xl border border-gray-800 shadow-xl flex flex-col justify-between">
          <div>
            <h4 className="text-sm font-bold text-white mb-4 uppercase tracking-widest opacity-60">System Health</h4>
            <div className="space-y-6">
              <div className="flex items-center justify-between">
                <span className="text-sm text-gray-400">Monitoring Status</span>
                <span className="text-green-400 font-bold flex items-center gap-1"><FaCheckCircle /> Online</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-sm text-gray-400">Active Sensors</span>
                <span className="text-white font-bold">12/12</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-sm text-gray-400">Last Scan</span>
                <span className="text-gray-500 text-xs">2 mins ago</span>
              </div>
            </div>
          </div>
          
          <div className="mt-8 p-4 bg-blue-500/5 rounded-xl border border-blue-500/10">
            <p className="text-[10px] text-blue-400 leading-relaxed font-medium">
              Your system is currently monitoring 4 key metrics across all campus locations. No critical failures detected.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default AlertSystem;
