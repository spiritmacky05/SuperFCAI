
import React, { useState } from 'react';

interface EmbedModalProps {
  isOpen: boolean;
  onClose: () => void;
}

const EmbedModal: React.FC<EmbedModalProps> = ({ isOpen, onClose }) => {
  const [copied, setCopied] = useState(false);
  
  if (!isOpen) return null;

  // Safe check for window
  const currentUrl = typeof window !== 'undefined' ? window.location.href : '';
  const embedCode = `<iframe 
  src="${currentUrl}" 
  width="100%" 
  height="800px" 
  style="border:none; border-radius:12px; box-shadow: 0 10px 15px -3px rgba(0,0,0,0.1);"
  title="Super FC AI - Fire Code Assistant">
</iframe>`;

  const handleCopy = () => {
    navigator.clipboard.writeText(embedCode);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="fixed inset-0 z-[110] flex items-center justify-center p-4 bg-slate-900/80 backdrop-blur-md animate-fade-in">
      <div className="bg-white w-full max-w-2xl rounded-2xl shadow-2xl overflow-hidden border border-slate-200">
        <div className="p-6 border-b border-slate-100 flex items-center justify-between bg-slate-50">
          <div className="flex items-center gap-3 text-slate-900">
            <div className="bg-blue-600 p-2 rounded-lg text-white">
              <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 20l4-16m4 4l4 4-4 4M6 16l-4-4 4-4" />
              </svg>
            </div>
            <div>
              <h3 className="font-bold text-lg leading-none">Embed this Application</h3>
              <p className="text-xs text-slate-500 mt-1">Copy this code to add the assistant to your website</p>
            </div>
          </div>
          <button onClick={onClose} className="text-slate-400 hover:text-slate-600 transition-colors">
            <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        <div className="p-8 space-y-6">
          <div className="space-y-3">
            <label className="text-sm font-bold text-slate-700 flex items-center gap-2">
              HTML Snippet
              <span className="text-[10px] bg-slate-200 text-slate-600 px-2 py-0.5 rounded uppercase">Recommended</span>
            </label>
            <div className="relative group">
              <pre className="bg-slate-900 text-blue-300 p-5 rounded-xl text-xs sm:text-sm overflow-x-auto custom-scrollbar font-mono leading-relaxed border border-slate-800 whitespace-pre-wrap break-all">
                {embedCode}
              </pre>
              <button 
                onClick={handleCopy}
                className={`absolute top-3 right-3 px-4 py-2 rounded-lg text-xs font-bold transition-all flex items-center gap-2 ${
                  copied 
                  ? 'bg-green-500 text-white shadow-lg scale-105' 
                  : 'bg-white/10 text-white hover:bg-white/20 border border-white/10'
                }`}
              >
                {copied ? (
                  <>
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-3.5 w-3.5" viewBox="0 0 20 20" fill="currentColor">
                      <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                    </svg>
                    Copied!
                  </>
                ) : (
                  <>
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-3.5 w-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 5H6a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2v-1M8 5a2 2 0 002 2h2a2 2 0 002-2M8 5a2 2 0 012-2h2a2 2 0 012 2m2 4h6m-6 4h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                    </svg>
                    Copy Snippet
                  </>
                )}
              </button>
            </div>
          </div>

          <div className="bg-blue-50 border border-blue-100 p-5 rounded-xl space-y-2">
            <h4 className="text-sm font-bold text-blue-900 flex items-center gap-2">
              <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
              Pro Tip
            </h4>
            <p className="text-xs text-blue-800 leading-relaxed">
              If your website uses a Content Management System (CMS) like WordPress or Wix, look for a <strong>"Custom HTML"</strong> or <strong>"Embed"</strong> widget to paste this code into. You can adjust the <code className="bg-blue-200/50 px-1 rounded">height</code> and <code className="bg-blue-200/50 px-1 rounded">width</code> to fit your layout perfectly.
            </p>
          </div>
        </div>

        <div className="p-6 bg-slate-50 border-t border-slate-100 flex justify-end">
          <button 
            onClick={onClose}
            className="px-6 py-2 bg-slate-800 text-white rounded-lg font-bold hover:bg-slate-700 transition-colors shadow-md text-sm"
          >
            Got it, thanks!
          </button>
        </div>
      </div>
    </div>
  );
};

export default EmbedModal;
