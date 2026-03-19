import React, { useEffect, useState } from 'react';
import { SavedReport } from '../../types';
import { storageService } from '../../services/storageService';
import { Clock, ArrowLeft, FileText, ChevronRight, Calendar, Building } from 'lucide-react';
import LoadingScreen from '../../components/LoadingScreen';

interface HistoryViewProps {
  onSelect: (report: SavedReport) => void;
  onBack: () => void;
}

const HistoryView: React.FC<HistoryViewProps> = ({ onSelect, onBack }) => {
  const [reports, setReports] = useState<SavedReport[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const fetchReports = async () => {
      setIsLoading(true);
      try {
        const data = await storageService.getReports();
        // Filter out background usage logs from history
        const filtered = data.filter((r: SavedReport) => r.result !== 'INTERNAL_USAGE_LOG');
        setReports(filtered);
      } catch (error) {
        console.error("Failed to fetch reports", error);
      } finally {
        setIsLoading(false);
      }
    };

    fetchReports();
  }, []);

  if (isLoading) {
    return (
      <LoadingScreen 
        message="RETRIVING ARCHIVES..." 
        subMessage="DATABASE QUERY IN PROGRESS" 
      />
    );
  }

  return (
    <div className="container mx-auto px-4 py-8 max-w-4xl">
      <button 
        onClick={onBack}
        className="mb-6 flex items-center gap-2 text-muted hover:text-cobalt transition-colors font-display font-bold text-xs uppercase tracking-widest group"
      >
        <ArrowLeft className="w-4 h-4 group-hover:-translate-x-1 transition-transform" />
        Return to Main Terminal
      </button>

      <div className="glass-panel rounded-xl overflow-hidden border border-glass shadow-2xl">
        <div className="p-6 border-b border-glass bg-glass/50 flex items-center gap-3">
          <div className="h-10 w-10 bg-tangerine/10 border border-tangerine/30 rounded-lg flex items-center justify-center shadow-[0_0_15px_rgba(255,140,0,0.2)]">
            <Clock className="w-6 h-6 text-tangerine" />
          </div>
          <div>
            <h2 className="text-xl font-display text-white tracking-widest uppercase">Inspection Logs</h2>
            <p className="text-xs font-mono text-tangerine tracking-wider">ARCHIVED DATA RECORDS</p>
          </div>
        </div>

        <div className="divide-y divide-glass">
          {reports.length === 0 ? (
            <div className="p-12 text-center text-muted border-2 border-dashed border-glass m-6 rounded-lg bg-glass/20">
              <Clock className="w-12 h-12 mx-auto mb-3 opacity-20" />
              <p className="font-mono text-sm">No inspection records found in database.</p>
            </div>
          ) : (
            reports.map((report) => (
              <button
                key={report.id}
                onClick={() => onSelect(report)}
                className="w-full p-6 flex items-center justify-between hover:bg-white/5 transition-all group text-left"
              >
                <div className="flex items-start gap-4">
                  <div className="mt-1 p-2 rounded-lg bg-cobalt/5 border border-cobalt/20 group-hover:border-cobalt/50 transition-colors">
                    <FileText className="w-5 h-5 text-cobalt" />
                  </div>
                  <div>
                    <h3 className="font-display text-sm text-silver mb-1 group-hover:text-white transition-colors uppercase tracking-wide">
                      {report.params.establishmentType}
                    </h3>
                    <div className="flex flex-wrap gap-4 text-xs font-mono text-muted mt-2">
                      <div className="flex items-center gap-1.5">
                        <Building className="w-3 h-3" />
                        <span>{report.params.area} SQM • {report.params.stories} FLR</span>
                      </div>
                      <div className="flex items-center gap-1.5">
                        <Calendar className="w-3 h-3" />
                        <span>{new Date(Number(report.timestamp)).toLocaleDateString()}</span>
                      </div>
                    </div>
                  </div>
                </div>
                <ChevronRight className="w-5 h-5 text-muted group-hover:text-cobalt group-hover:translate-x-1 transition-all" />
              </button>
            ))
          )}
        </div>
      </div>
    </div>
  );
};

export default HistoryView;
