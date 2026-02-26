import React, { useState } from 'react';
import { SearchParams } from '../types';
import { generateNTC } from '../services/geminiService';
import ReactMarkdown from 'react-markdown';
import { AlertTriangle, Check, Copy, Loader2, FileWarning } from 'lucide-react';

interface NTCGeneratorProps {
  params: SearchParams;
}

const DEFECT_CATEGORIES = [
  {
    title: "Means of Egress",
    items: [
      "Obstruction in exit ways / corridors",
      "Locked exit doors during occupancy",
      "Exit door swings against flow of egress",
      "Insufficient exit width or capacity",
      "Dead-end corridor exceeds limit",
      "Defective or missing panic hardware",
      "Exit discharge not leading to public way"
    ]
  },
  {
    title: "Fire Protection Systems",
    items: [
      "Fire extinguisher expired/depressurized",
      "Fire extinguisher missing/not installed",
      "Fire extinguisher obstructed",
      "Sprinkler system control valve closed",
      "Sprinkler heads obstructed or painted",
      "Fire hose cabinet obstructed/incomplete"
    ]
  },
  {
    title: "Detection, Alarm & Communication",
    items: [
      "Fire alarm control panel in trouble mode",
      "Manual pull station obstructed/defective",
      "Smoke/Heat detectors missing or defective",
      "No integrated fire alarm system",
      "Alarm bell/horn not audible"
    ]
  },
  {
    title: "Illumination & Signs",
    items: [
      "Emergency lights non-functional",
      "Missing or defective exit signs",
      "Exit signs not illuminated",
      "No directional exit signage",
      "Improper placement of exit signs"
    ]
  },
  {
    title: "Electrical & Utilities",
    items: [
      "Octopus connections (Overloading)",
      "Exposed electrical wiring/splices",
      "Uncovered junction boxes",
      "Use of flat cord for permanent wiring",
      "Electrical panel obstructed"
    ]
  },
  {
    title: "General Safety",
    items: [
      "Poor housekeeping",
      "Improper storage of flammable liquids",
      "LPG tanks not secured/improperly stored",
      "No 'No Smoking' signs in hazard areas",
      "Failure to conduct fire drill",
      "No fire safety program/organization"
    ]
  }
];

const NTCGenerator: React.FC<NTCGeneratorProps> = ({ params }) => {
  const [selectedDefects, setSelectedDefects] = useState<Set<string>>(new Set());
  const [otherDefects, setOtherDefects] = useState('');
  const [ntcContent, setNtcContent] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');

  const toggleDefect = (defect: string) => {
    const newSelected = new Set(selectedDefects);
    if (newSelected.has(defect)) {
      newSelected.delete(defect);
    } else {
      newSelected.add(defect);
    }
    setSelectedDefects(newSelected);
  };

  const handleGenerate = async () => {
    const defectsList = Array.from(selectedDefects);
    if (otherDefects.trim()) {
      defectsList.push(otherDefects.trim());
    }

    if (defectsList.length === 0) {
      setError('Please select at least one defect or add observations.');
      return;
    }
    
    setIsLoading(true);
    setError('');
    setNtcContent('');

    const violationsContext = defectsList.map((d, i) => `${i + 1}. ${d}`).join('\n');

    try {
      const result = await generateNTC(params, violationsContext);
      setNtcContent(result);
    } catch (err: any) {
      console.error("NTC Gen Error:", err);
      setError(err instanceof Error ? err.message : 'Failed to generate legal basis list. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="glass-panel rounded-xl overflow-hidden border border-glass shadow-2xl mt-8">
      <div className="bg-glass border-b border-glass p-4 flex items-center gap-3 relative overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-r from-red-900/20 to-transparent opacity-50"></div>
        <div className="h-10 w-10 bg-red-900/20 border border-red-500/30 rounded-lg flex items-center justify-center shadow-[0_0_15px_rgba(239,68,68,0.2)] relative z-10">
          <FileWarning className="w-6 h-6 text-red-500" />
        </div>
        <div className="relative z-10">
          <h3 className="text-lg font-display text-white tracking-widest uppercase">NTC Generator</h3>
          <p className="text-xs font-mono text-red-400 tracking-wider">VIOLATION REPORTING MODULE</p>
        </div>
      </div>

      <div className="p-6">
        <p className="text-xs font-mono text-muted mb-6 bg-glass/30 p-4 rounded-lg border border-glass flex items-center gap-3">
          <AlertTriangle className="w-4 h-4 text-tangerine flex-shrink-0" />
          SELECT OBSERVED VIOLATIONS TO GENERATE NOTICE TO COMPLY DETAILS.
        </p>

        <div className="space-y-6 mb-8">
          {DEFECT_CATEGORIES.map((category, idx) => (
            <div key={idx} className="border border-glass rounded-lg overflow-hidden bg-glass/10">
              <div className="bg-glass/50 px-4 py-2 font-display text-xs text-silver uppercase tracking-wider border-b border-glass flex items-center gap-2">
                <div className="h-1.5 w-1.5 rounded-full bg-cobalt shadow-[0_0_5px_#00f2ff]"></div>
                {category.title}
              </div>
              <div className="p-4 grid grid-cols-1 md:grid-cols-2 gap-3">
                {category.items.map((item, i) => (
                  <label key={i} className="flex items-start gap-3 cursor-pointer group p-2 hover:bg-white/5 rounded transition-colors border border-transparent hover:border-glass/30">
                    <div className="relative flex items-center mt-0.5">
                      <input 
                        type="checkbox" 
                        className="peer h-4 w-4 cursor-pointer appearance-none rounded border border-glass bg-obsidian checked:border-red-500 checked:bg-red-500/20 transition-all"
                        checked={selectedDefects.has(item)}
                        onChange={() => toggleDefect(item)}
                      />
                      <Check className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 w-3 h-3 pointer-events-none opacity-0 peer-checked:opacity-100 text-red-500 transition-opacity" />
                    </div>
                    <span className={`text-xs font-mono select-none transition-colors ${selectedDefects.has(item) ? 'text-white' : 'text-muted group-hover:text-silver'}`}>
                      {item}
                    </span>
                  </label>
                ))}
              </div>
            </div>
          ))}
        </div>

        <div className="mb-6">
          <label className="block text-xs font-mono text-muted mb-2 uppercase tracking-wider">
            Other Observations (Optional)
          </label>
          <textarea
            className="w-full p-4 glass-input rounded-lg font-mono text-sm focus:ring-1 focus:ring-red-500/50 min-h-[80px]"
            placeholder="Type any other defects not listed above..."
            value={otherDefects}
            onChange={(e) => setOtherDefects(e.target.value)}
          ></textarea>
        </div>

        {error && (
          <div className="bg-red-900/20 border border-red-500/30 text-red-400 p-3 rounded-lg mb-4 text-xs font-mono flex items-center shadow-[0_0_15px_rgba(239,68,68,0.1)]">
            <AlertTriangle className="w-4 h-4 mr-2" />
            {error}
          </div>
        )}

        <button
          onClick={handleGenerate}
          disabled={isLoading || (selectedDefects.size === 0 && !otherDefects.trim())}
          className="w-full sm:w-auto bg-red-600/20 hover:bg-red-600/40 text-red-400 border border-red-500/50 px-8 py-3 rounded-lg font-display text-xs uppercase tracking-widest disabled:opacity-50 disabled:cursor-not-allowed transition-all shadow-[0_0_15px_rgba(220,38,38,0.2)] hover:shadow-[0_0_25px_rgba(220,38,38,0.4)] active:scale-[0.98] flex items-center justify-center gap-2"
        >
          {isLoading ? (
            <>
              <Loader2 className="w-4 h-4 animate-spin" />
              PROCESSING VIOLATIONS...
            </>
          ) : (
            'Match Selected Defects to Fire Code'
          )}
        </button>

        {ntcContent && (
          <div className="mt-8 border-t border-glass pt-6 animate-fade-in">
            <h4 className="text-sm font-display text-white mb-4 flex items-center gap-2 uppercase tracking-wide">
              <span className="text-red-500">⚠</span> Defects, Legal Basis & Explanation
            </h4>
            <div className="glass-panel p-6 rounded-lg border border-glass font-mono text-sm text-silver leading-relaxed shadow-inner bg-obsidian/30">
              <ReactMarkdown 
                components={{
                  h3: ({node, ...props}) => <h3 className="text-red-400 font-bold mt-4 mb-2 uppercase tracking-wider text-xs" {...props} />,
                  h4: ({node, ...props}) => <h4 className="text-white font-bold mt-2 mb-1" {...props} />,
                  p: ({node, ...props}) => <p className="mb-4 last:mb-0 text-muted" {...props} />,
                  strong: ({node, ...props}) => <strong className="text-white" {...props} />,
                  hr: ({node, ...props}) => <hr className="border-glass my-6" {...props} />,
                }}
              >
                {ntcContent}
              </ReactMarkdown>
            </div>
            <div className="mt-4 flex justify-end">
              <button 
                onClick={() => {navigator.clipboard.writeText(ntcContent); alert('Copied to clipboard!');}}
                className="flex items-center gap-2 text-xs font-mono text-cobalt hover:text-white hover:bg-cobalt/20 px-4 py-2 rounded-lg transition-colors border border-cobalt/30 hover:border-cobalt/50"
              >
                <Copy className="w-4 h-4" />
                COPY TO CLIPBOARD
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default NTCGenerator;
