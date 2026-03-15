import React, { useState } from 'react';
import { Plus, BookOpen, Save, Upload, Loader2, Trash2 } from 'lucide-react';
import { KnowledgeEntry } from '../../../../types';

interface AdminKnowledgeBaseProps {
  knowledgeEntries: KnowledgeEntry[];
  onFileUpload: (event: React.ChangeEvent<HTMLInputElement>) => Promise<void>;
  isAnalyzing: boolean;
  onSaveEntry: (entry: { title: string; content: string; category: 'provision' | 'interpretation' | 'correction' }) => Promise<void>;
  onDeleteEntry: (id: string) => Promise<void>;
}

const AdminKnowledgeBase: React.FC<AdminKnowledgeBaseProps> = ({
  knowledgeEntries,
  onFileUpload,
  isAnalyzing,
  onSaveEntry,
  onDeleteEntry
}) => {
  const [newEntry, setNewEntry] = useState({
    title: '',
    content: '',
    category: 'provision' as const
  });

  const handleManualSave = async () => {
    if (!newEntry.title || !newEntry.content) return;
    await onSaveEntry(newEntry);
    setNewEntry({ title: '', content: '', category: 'provision' });
  };

  return (
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
      {/* Training Form */}
      <div className="lg:col-span-1 space-y-6">
        <div className="glass-panel p-4 md:p-6 rounded-xl border border-glass sticky top-24">
          <h3 className="text-sm font-display text-white mb-4 flex items-center gap-2 uppercase tracking-wide">
            <Plus className="w-4 h-4 text-cobalt" />
            Add Knowledge
          </h3>
          
          <div className="space-y-4">
            <div className="border-2 border-dashed border-glass rounded-lg p-4 md:p-6 text-center hover:bg-glass/50 transition-colors relative group">
              <input 
                type="file" 
                accept=".txt,.md,.json,.csv,.pdf,.docx"
                onChange={onFileUpload}
                disabled={isAnalyzing}
                className="absolute inset-0 w-full h-full opacity-0 cursor-pointer disabled:cursor-not-allowed z-10"
              />
              {isAnalyzing ? (
                <div className="flex flex-col items-center text-cobalt">
                  <Loader2 className="w-8 h-8 animate-spin mb-2" />
                  <span className="text-xs font-mono">ANALYZING DATA...</span>
                </div>
              ) : (
                <div className="flex flex-col items-center text-muted group-hover:text-silver transition-colors">
                  <Upload className="w-8 h-8 mb-2" />
                  <span className="text-xs font-mono uppercase tracking-wider">Upload Document</span>
                  <span className="text-[10px] text-muted/50 mt-1 font-mono">PDF, DOCX, TXT, MD, JSON</span>
                </div>
              )}
            </div>

            <div className="relative">
              <div className="absolute inset-0 flex items-center">
                <div className="w-full border-t border-glass"></div>
              </div>
              <div className="relative flex justify-center text-[10px] uppercase font-mono">
                <span className="bg-obsidian px-2 text-muted">Or Inject Manually</span>
              </div>
            </div>

            <div>
              <label className="block text-xs font-mono text-muted mb-1 uppercase tracking-wider">Title / Section</label>
              <input 
                type="text" 
                value={newEntry.title}
                onChange={(e) => setNewEntry({...newEntry, title: e.target.value})}
                placeholder="e.g. Section 10.2.5.4"
                className="w-full px-4 py-2 rounded-lg glass-input font-mono text-sm focus:ring-1 focus:ring-cobalt/50"
              />
            </div>

            <div>
              <label className="block text-xs font-mono text-muted mb-1 uppercase tracking-wider">Category</label>
              <select 
                value={newEntry.category}
                onChange={(e) => setNewEntry({...newEntry, category: e.target.value as any})}
                className="w-full px-4 py-2 rounded-lg glass-input font-mono text-sm focus:ring-1 focus:ring-cobalt/50"
              >
                <option value="provision" className="bg-obsidian">Fire Code Provision</option>
                <option value="interpretation" className="bg-obsidian">Official Interpretation</option>
                <option value="correction" className="bg-obsidian">Correction to AI</option>
              </select>
            </div>

            <div>
              <label className="block text-xs font-mono text-muted mb-1 uppercase tracking-wider">Content / Rule</label>
              <textarea 
                value={newEntry.content}
                onChange={(e) => setNewEntry({...newEntry, content: e.target.value})}
                placeholder="Enter the specific provision text or rule..."
                rows={6}
                className="w-full px-4 py-2 rounded-lg glass-input font-mono text-sm focus:ring-1 focus:ring-cobalt/50"
              />
            </div>

            <button 
              onClick={handleManualSave}
              disabled={!newEntry.title || !newEntry.content}
              className="w-full py-3 cyber-button-primary rounded-lg font-display text-xs uppercase tracking-widest hover:scale-[1.02] active:scale-[0.98] transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2 shadow-[0_0_15px_rgba(0,242,255,0.2)]"
            >
              <Save className="w-4 h-4" />
              Inject Data
            </button>
          </div>
        </div>
      </div>

      {/* Knowledge List */}
      <div className="lg:col-span-2">
        <div className="glass-panel p-4 md:p-6 rounded-xl border border-glass">
          <h3 className="text-sm font-display text-white mb-6 flex items-center gap-2 uppercase tracking-wide">
            <BookOpen className="w-4 h-4 text-tangerine" />
            Active Neural Pathways
          </h3>

          {knowledgeEntries.length === 0 ? (
            <div className="text-center py-12 text-muted border border-dashed border-glass rounded-lg bg-glass/20">
              <p className="font-mono text-sm">No custom training data detected.</p>
              <p className="text-xs mt-1 font-mono opacity-50">Inject provisions to enhance AI citations.</p>
            </div>
          ) : (
            <div className="space-y-4">
              {knowledgeEntries.map((entry) => (
                <div key={entry.id} className="p-4 bg-glass/30 rounded-lg border border-glass hover:border-cobalt/30 transition-colors group">
                  <div className="flex justify-between items-start mb-2">
                    <div>
                      <h4 className="font-bold text-silver font-display text-sm">{entry.title}</h4>
                      <span className={`text-[9px] uppercase tracking-wider px-2 py-0.5 rounded-full font-mono mt-1 inline-block border ${
                        entry.category === 'provision' ? 'bg-cobalt/10 text-cobalt border-cobalt/20' :
                        entry.category === 'interpretation' ? 'bg-purple-500/10 text-purple-400 border-purple-500/20' :
                        'bg-tangerine/10 text-tangerine border-tangerine/20'
                      }`}>
                        {entry.category}
                      </span>
                    </div>
                    <button 
                      onClick={() => onDeleteEntry(entry.id)}
                      className="text-muted hover:text-red-400 transition-colors p-1 hover:bg-red-900/20 rounded"
                      title="Delete Entry"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                  <p className="text-xs text-silver/70 leading-relaxed whitespace-pre-wrap font-sans">{entry.content}</p>
                  <p className="text-[10px] text-muted/50 mt-3 font-mono uppercase">Timestamp: {new Date(entry.timestamp).toLocaleDateString()}</p>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default AdminKnowledgeBase;
