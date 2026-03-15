import React from 'react';
import { AlertTriangle, Check, Trash2, Copy } from 'lucide-react';
import { ErrorReport, User } from '../../../../types';

interface AdminErrorReportsProps {
  errorReports: ErrorReport[];
  currentUser: User | undefined;
  onUpdateReportStatus: (id: number, status: 'pending' | 'evaluated') => Promise<void>;
  onDeleteReport: (id: number) => Promise<void>;
  onCopyToClipboard: (text: string) => void;
}

const AdminErrorReports: React.FC<AdminErrorReportsProps> = ({
  errorReports,
  currentUser,
  onUpdateReportStatus,
  onDeleteReport,
  onCopyToClipboard
}) => {
  return (
    <div className="glass-panel overflow-hidden rounded-xl border border-glass p-6">
      <h3 className="text-lg font-display text-white mb-6 flex items-center gap-2 uppercase tracking-wide">
        <AlertTriangle className="text-tangerine" size={20} />
        AI Error Reports
      </h3>
      
      {errorReports.length === 0 ? (
        <div className="text-center py-12 text-muted border border-dashed border-glass rounded-lg bg-glass/20">
          <p className="font-mono text-sm">No error reports received yet.</p>
        </div>
      ) : (
        <div className="space-y-6">
          {errorReports.map((report) => (
            <div key={report.id} className={`p-5 rounded-lg border transition-colors ${report.status === 'pending' ? 'bg-tangerine/5 border-tangerine/30' : 'bg-glass/30 border-glass'}`}>
              <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-4">
                <div>
                  <div className="flex items-center gap-2 mb-1">
                    <span className="text-xs font-mono text-muted uppercase">Reporter:</span>
                    <span className="text-sm font-mono text-cobalt break-all">{report.user_email}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="text-xs font-mono text-muted uppercase">Date:</span>
                    <span className="text-xs font-mono text-silver">{new Date(report.created_at).toLocaleString()}</span>
                  </div>
                </div>
                <div className="flex flex-wrap items-center gap-2 sm:gap-3 w-full sm:w-auto">
                  <span className={`px-2 py-1 rounded text-[10px] font-mono uppercase tracking-wider border ${
                    report.status === 'pending' 
                      ? 'bg-tangerine/10 text-tangerine border-tangerine/30' 
                      : 'bg-emerald-500/10 text-emerald-400 border-emerald-500/30'
                  }`}>
                    {report.status}
                  </span>
                  {report.status === 'pending' && (
                    <button 
                      onClick={() => onUpdateReportStatus(report.id, 'evaluated')}
                      className="px-3 py-1 bg-emerald-500/20 text-emerald-400 border border-emerald-500/50 rounded hover:bg-emerald-500/30 transition-colors text-[10px] font-bold uppercase tracking-wider flex items-center gap-1 flex-1 sm:flex-none justify-center"
                    >
                      <Check size={12} />
                      Mark Evaluated
                    </button>
                  )}
                  {currentUser?.role === 'super_admin' && (
                    <button 
                      onClick={() => onDeleteReport(report.id)}
                      className="p-1.5 bg-red-900/20 text-red-400 rounded hover:bg-red-900/40 border border-red-500/30 transition-colors flex-shrink-0"
                      title="Delete Report"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  )}
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="bg-obsidian/50 p-4 rounded-lg border border-red-500/20">
                  <h4 className="text-xs font-mono text-red-400 uppercase tracking-wider mb-2 flex items-center gap-2">
                    <AlertTriangle size={14} />
                    Cited Error
                  </h4>
                  <p className="text-sm text-silver/90 font-sans whitespace-pre-wrap">{report.cited_error}</p>
                </div>
                
                <div className="bg-obsidian/50 p-4 rounded-lg border border-emerald-500/20 relative group">
                  <div className="flex justify-between items-center mb-2">
                    <h4 className="text-xs font-mono text-emerald-400 uppercase tracking-wider flex items-center gap-2">
                      <Check size={14} />
                      Actual Correction
                    </h4>
                    <button 
                      onClick={() => onCopyToClipboard(report.actual_correction)}
                      className="text-muted hover:text-cobalt transition-colors p-1"
                      title="Copy Correction"
                    >
                      <Copy size={14} />
                    </button>
                  </div>
                  <p className="text-sm text-silver/90 font-sans whitespace-pre-wrap">{report.actual_correction}</p>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default AdminErrorReports;
