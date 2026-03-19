import React from 'react';
import { User, SearchParams, SavedReport } from '../../types';
import SearchForm from '../../components/SearchForm';
import ResultDisplay from '../../components/ResultDisplay';
import ChatBox from '../../components/ChatBox';
import NTCGenerator from '../../components/NTCGenerator';
import AdBanner from '../../components/AdBanner';
import LoadingScreen from '../../components/LoadingScreen';

interface ReportGenProps {
  params: SearchParams;
  setParams: React.Dispatch<React.SetStateAction<SearchParams>>;
  result: string;
  isLoading: boolean;
  error: string | null;
  generateReport: () => Promise<void>;
}

interface MainViewProps {
  user: User;
  reportGen: ReportGenProps;
  setIsAssistantOpen: React.Dispatch<React.SetStateAction<boolean>>;
}

export const MainView: React.FC<MainViewProps> = ({ user, reportGen, setIsAssistantOpen }) => {
  const { params, setParams, result, isLoading, error, generateReport } = reportGen;

  const ui = {
    mainContainer: 'mx-auto px-3 sm:px-4 py-6 sm:py-8 w-full max-w-[1400px]',
    contentGrid: 'grid grid-cols-1 lg:flex lg:items-start lg:gap-8 gap-6 w-full',
    leftColumn: 'space-y-6 lg:w-[360px] xl:w-[390px] lg:min-w-[320px] lg:sticky lg:top-6 xl:top-8',
    rightColumn: 'space-y-6 sm:space-y-8 min-w-0 w-full lg:flex-1',
    idlePanel: 'w-full flex flex-col items-center justify-center h-56 sm:h-64 glass-panel rounded-xl border border-dashed border-glass text-muted p-6 sm:p-8 text-center',
  };

  return (
    <div className={ui.mainContainer}>
      <div className={ui.contentGrid}>
        {/* Left Column: Form */}
        <div className={ui.leftColumn}>
          <div className="glass-panel p-5 rounded-xl relative overflow-hidden group">
            <div className="absolute inset-0 bg-gradient-to-r from-cobalt/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500"></div>
            <h3 className="text-cobalt font-display text-sm mb-3 flex items-center gap-2 tracking-widest">
              <span className="text-xl">🛡️</span> SYSTEM STATUS: ONLINE
            </h3>
            <div className="bg-obsidian/50 p-3 rounded-lg border border-cobalt/20 mb-2">
              <p className="text-xs text-silver/80 leading-relaxed font-mono wrap-break-word whitespace-normal">
                <strong className="text-cobalt">DISCLAIMER:</strong> Super Fire Code AI serves as a specialized aide for Fire Safety Enforcement. Please note that the digital guidance is a supplement to, not a replacement for, physical and actual inspections, which remain the final authority on standard compliance.
              </p>
            </div>
          </div>

          <AdBanner userRole={user.role} position="sidebar" />

          <SearchForm 
            params={params} 
            setParams={setParams} 
            onSubmit={generateReport}
            isLoading={isLoading}
          />

          <div className="glass-panel p-6 rounded-xl hidden lg:block">
            <h4 className="font-display text-white text-sm mb-2 tracking-widest">EXPERT MODE</h4>
            <p className="text-xs text-muted mb-4 font-mono">Access deep neural network for specific code citations and penalty calculations.</p>
            <button 
              onClick={() => setIsAssistantOpen(true)}
              className="w-full py-3 cyber-button rounded-lg text-xs font-bold hover:bg-cobalt/20 transition-all shadow-[0_0_10px_rgba(0,242,255,0.1)]"
            >
              INITIALIZE ASSISTANT
            </button>
          </div>
        </div>

        {/* Right Column: Results & Chat */}
        <div className={ui.rightColumn}>
          {error && (
            <div className="bg-red-900/20 border-l-2 border-red-500 p-4 rounded-r-lg backdrop-blur-sm">
              <div className="flex items-center">
                <svg className="w-6 h-6 text-red-500 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"></path></svg>
                <p className="text-sm text-red-400 font-mono">{error}</p>
              </div>
            </div>
          )}

          {result ? (
            <div className="animate-fade-in-up space-y-8">
              <ResultDisplay content={result} />
              <ChatBox reportContext={result} user={user} />
              <NTCGenerator params={params} user={user} />
            </div>
          ) : (
            !isLoading && (
              <div className={ui.idlePanel}>
                <div className="bg-glass h-20 w-20 rounded-full flex items-center justify-center mb-4 border border-glass shadow-[0_0_20px_rgba(0,0,0,0.5)]">
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-10 w-10 text-cobalt opacity-50" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                  </svg>
                </div>
                <p className="text-lg font-display text-silver tracking-widest">SYSTEM IDLE</p>
                <p className="text-xs font-mono text-muted mt-2">Awaiting establishment parameters...</p>
              </div>
            )
          )}
          
          {isLoading && (
            <div className="fixed inset-0 z-[100]">
              <LoadingScreen 
                message="ANALYZING PARAMETERS..." 
                subMessage="CONSULTING FIRE CODE NEURAL NETWORK" 
              />
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
