import React, { useState } from 'react';
import { FaFileExport, FaDownload, FaHistory, FaCheckCircle, FaSpinner, FaFileCsv, FaFilePdf, FaCalendarAlt } from 'react-icons/fa';
import { useCreateAnalyticsExportMutation, useGetAnalyticsExportsQuery } from '../../redux/api/analyticsApi';
import { toast } from 'react-toastify';

const ExportTools: React.FC = () => {
  const [exportType, setExportType] = useState('threads');
  const [format, setFormat] = useState('csv');
  const [range, setRange] = useState('month');

  const { data: exportHistory, isLoading: historyLoading } = useGetAnalyticsExportsQuery({ page: 1, limit: 5 });
  const [createExport, { isLoading: isCreating }] = useCreateAnalyticsExportMutation();

  const handleExport = async () => {
    try {
      await createExport({
        exportName: `Platform_${exportType}_${new Date().toISOString().split('T')[0]}`,
        exportType,
        exportFormat: format,
        dateRange: range
      }).unwrap();
      toast.success('Export job started successfully!');
    } catch (error) {
      toast.error('Failed to start export job');
    }
  };

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
      {/* Configuration */}
      <div className="bg-[#242526] rounded-2xl border border-gray-800 p-6 shadow-xl">
        <h3 className="text-lg font-bold text-white mb-6 flex items-center gap-2">
          <FaFileExport className="text-blue-500" /> New Data Export
        </h3>

        <div className="space-y-6">
          <div>
            <label className="block text-[10px] font-bold text-gray-500 uppercase tracking-widest mb-3">Data Category</label>
            <div className="grid grid-cols-2 gap-2">
              {['threads', 'users', 'reputation', 'items'].map(type => (
                <button
                  key={type}
                  onClick={() => setExportType(type)}
                  className={`py-2 px-3 rounded-lg text-xs font-bold capitalize transition-all border ${
                    exportType === type ? 'bg-blue-600 text-white border-blue-500' : 'bg-gray-800 text-gray-400 border-gray-700 hover:border-gray-600'
                  }`}
                >
                  {type}
                </button>
              ))}
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-[10px] font-bold text-gray-500 uppercase tracking-widest mb-2">Format</label>
              <div className="flex gap-2">
                <button onClick={() => setFormat('csv')} className={`flex-1 py-2 rounded-lg flex items-center justify-center gap-2 border ${format === 'csv' ? 'bg-gray-700 text-white border-blue-500' : 'bg-gray-800 text-gray-500 border-gray-700'}`}>
                  <FaFileCsv /> CSV
                </button>
                <button onClick={() => setFormat('pdf')} className={`flex-1 py-2 rounded-lg flex items-center justify-center gap-2 border ${format === 'pdf' ? 'bg-gray-700 text-white border-blue-500' : 'bg-gray-800 text-gray-500 border-gray-700'}`}>
                  <FaFilePdf /> PDF
                </button>
              </div>
            </div>
            <div>
              <label className="block text-[10px] font-bold text-gray-500 uppercase tracking-widest mb-2">Range</label>
              <select 
                value={range}
                onChange={(e) => setRange(e.target.value)}
                className="w-full bg-gray-800 border-gray-700 rounded-lg text-xs text-white p-2"
              >
                <option value="week">Last 7 Days</option>
                <option value="month">Last 30 Days</option>
                <option value="year">Last Year</option>
                <option value="all">All Time</option>
              </select>
            </div>
          </div>

          <button
            onClick={handleExport}
            disabled={isCreating}
            className="w-full bg-blue-600 hover:bg-blue-700 disabled:opacity-50 text-white font-bold py-3 rounded-xl transition-all shadow-lg flex items-center justify-center gap-2"
          >
            {isCreating ? <><FaSpinner className="animate-spin" /> Preparing...</> : <><FaFileExport /> Generate Export</>}
          </button>
        </div>
      </div>

      {/* History */}
      <div className="bg-[#242526] rounded-2xl border border-gray-800 p-6 shadow-xl">
        <h3 className="text-lg font-bold text-white mb-6 flex items-center gap-2">
          <FaHistory className="text-gray-400" /> Recent Exports
        </h3>

        <div className="space-y-3">
          {historyLoading ? (
            <div className="text-center py-10 text-gray-500">Loading history...</div>
          ) : exportHistory?.exports.length === 0 ? (
            <div className="text-center py-10 text-gray-600 italic text-sm">No recent export history found.</div>
          ) : (
            exportHistory?.exports.map((exp: any) => (
              <div key={exp.id} className="bg-gray-800/50 p-3 rounded-xl border border-gray-800 flex items-center justify-between hover:border-gray-700 transition-colors group">
                <div className="flex items-center gap-3">
                  <div className={`w-10 h-10 rounded-lg flex items-center justify-center text-lg ${
                    exp.exportStatus === 'completed' ? 'bg-green-500/10 text-green-400' : 'bg-yellow-500/10 text-yellow-400'
                  }`}>
                    {exp.exportStatus === 'completed' ? <FaCheckCircle /> : <FaSpinner className="animate-spin" />}
                  </div>
                  <div>
                    <p className="text-xs font-bold text-white">{exp.exportName}</p>
                    <div className="flex items-center gap-2 text-[10px] text-gray-500 mt-1">
                      <span className="uppercase">{exp.exportFormat}</span>
                      <span>•</span>
                      <span className="flex items-center gap-1"><FaCalendarAlt size={8} /> {new Date(exp.createdAt).toLocaleDateString()}</span>
                    </div>
                  </div>
                </div>
                {exp.exportStatus === 'completed' && (
                  <button className="w-8 h-8 rounded-lg bg-gray-700 hover:bg-gray-600 flex items-center justify-center text-gray-400 hover:text-white transition-colors">
                    <FaDownload size={12} />
                  </button>
                )}
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  );
};

export default ExportTools;
