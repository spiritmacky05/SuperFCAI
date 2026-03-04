import React, { useState, useEffect } from 'react';
import { KnowledgeEntry, User, UserRole } from '../types';
import { storageService } from '../services/storageService';
import { analyzeTrainingDocument } from '../services/geminiService';
import { Trash2, Plus, BookOpen, Save, Upload, FileText, Loader2, Users, Edit2, Check, Shield, Database, X } from 'lucide-react';

const AdminView: React.FC = () => {
  const [activeTab, setActiveTab] = useState<'dashboard' | 'training' | 'users'>('dashboard');
  const [knowledgeEntries, setKnowledgeEntries] = useState<KnowledgeEntry[]>([]);
  const [users, setUsers] = useState<User[]>([]);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [newEntry, setNewEntry] = useState({
    title: '',
    content: '',
    category: 'provision' as const
  });
  const [editingUser, setEditingUser] = useState<string | null>(null);

  useEffect(() => {
    const fetchData = async () => {
      setKnowledgeEntries(await storageService.getKnowledge());
      setUsers(await storageService.getUsers());
    };
    fetchData();
  }, []);

  const handleUpdateRole = async (email: string, newRole: UserRole) => {
    const user = users.find(u => u.email === email);
    if (user) {
      const updatedUser = { ...user, role: newRole };
      await storageService.saveUser(updatedUser);
      setUsers(await storageService.getUsers());
      setEditingUser(null);
    }
  };

  const handleFileUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    setIsAnalyzing(true);
    try {
      let extractedData: any[] = [];

      if (file.type === 'application/pdf' || file.type === 'application/vnd.openxmlformats-officedocument.wordprocessingml.document') {
        // Handle PDF and DOCX via base64
        const reader = new FileReader();
        const base64Promise = new Promise<string>((resolve, reject) => {
          reader.onload = () => {
            const result = reader.result as string;
            // Remove data URL prefix (e.g., "data:application/pdf;base64,")
            const base64 = result.split(',')[1];
            resolve(base64);
          };
          reader.onerror = reject;
          reader.readAsDataURL(file);
        });

        const base64Data = await base64Promise;
        extractedData = await analyzeTrainingDocument({ data: base64Data, mimeType: file.type });
      } else {
        // Handle text-based files
        const text = await file.text();
        extractedData = await analyzeTrainingDocument(text);
      }
      
      if (Array.isArray(extractedData)) {
        for (const item of extractedData) {
          const entry: KnowledgeEntry = {
            id: Date.now().toString() + Math.random().toString(36).substr(2, 9),
            timestamp: Date.now(),
            title: item.title || "Untitled Section",
            content: item.content || "",
            category: item.category || "provision"
          };
          await storageService.saveKnowledge(entry);
        }
        setKnowledgeEntries(await storageService.getKnowledge());
        alert(`Successfully extracted ${extractedData.length} entries from ${file.name}`);
      }
    } catch (error) {
      console.error("File analysis failed:", error);
      alert("Failed to analyze file. Please try again.");
    } finally {
      setIsAnalyzing(false);
      // Reset file input
      event.target.value = '';
    }
  };

  const handleSaveEntry = async () => {
    if (!newEntry.title || !newEntry.content) return;

    const entry: KnowledgeEntry = {
      id: Date.now().toString(),
      timestamp: Date.now(),
      ...newEntry
    };

    await storageService.saveKnowledge(entry);
    setKnowledgeEntries(await storageService.getKnowledge());
    setNewEntry({ title: '', content: '', category: 'provision' });
  };

  const handleDeleteEntry = async (id: string) => {
    await storageService.deleteKnowledge(id);
    setKnowledgeEntries(await storageService.getKnowledge());
  };

  const handleDeleteUser = async (email: string) => {
    if (window.confirm('Are you sure you want to delete this user?')) {
      await storageService.deleteUser(email);
      setUsers(await storageService.getUsers());
      setEditingUser(null);
    }
  };

  return (
    <div className="container mx-auto px-4 py-8 max-w-6xl">
      <div className="glass-panel rounded-xl overflow-hidden border border-glass shadow-2xl">
        <div className="p-4 md:p-6 border-b border-glass bg-glass/50 flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="h-10 w-10 bg-purple-500/10 border border-purple-500/30 rounded-lg flex items-center justify-center shadow-[0_0_15px_rgba(168,85,247,0.2)]">
              <Shield className="w-6 h-6 text-purple-400" />
            </div>
            <div>
              <h1 className="text-xl font-display text-white tracking-widest uppercase">Admin Nexus</h1>
              <p className="text-xs font-mono text-purple-400 tracking-wider">SYSTEM CONFIGURATION & OVERSIGHT</p>
            </div>
          </div>
          
          <div className="w-full md:w-auto grid grid-cols-3 md:flex bg-obsidian/50 p-1 rounded-lg border border-glass gap-1">
            <button
              onClick={() => setActiveTab('dashboard')}
              className={`px-2 md:px-4 py-2 rounded-md text-[10px] md:text-xs font-display font-bold uppercase tracking-wider transition-all text-center ${
                activeTab === 'dashboard' 
                  ? 'bg-cobalt/20 text-cobalt shadow-[0_0_10px_rgba(0,242,255,0.1)]' 
                  : 'text-muted hover:text-white'
              }`}
            >
              Dashboard
            </button>
            <button
              onClick={() => setActiveTab('training')}
              className={`px-2 md:px-4 py-2 rounded-md text-[10px] md:text-xs font-display font-bold uppercase tracking-wider transition-all flex items-center justify-center gap-2 ${
                activeTab === 'training' 
                  ? 'bg-cobalt/20 text-cobalt shadow-[0_0_10px_rgba(0,242,255,0.1)]' 
                  : 'text-muted hover:text-white'
              }`}
            >
              <Database className="w-3 h-3 hidden sm:block" />
              AI Training
            </button>
            <button
              onClick={() => setActiveTab('users')}
              className={`px-2 md:px-4 py-2 rounded-md text-[10px] md:text-xs font-display font-bold uppercase tracking-wider transition-all flex items-center justify-center gap-2 ${
                activeTab === 'users' 
                  ? 'bg-cobalt/20 text-cobalt shadow-[0_0_10px_rgba(0,242,255,0.1)]' 
                  : 'text-muted hover:text-white'
              }`}
            >
              <Users className="w-3 h-3 hidden sm:block" />
              User Mgmt
            </button>
          </div>
        </div>

        <div className="p-4 md:p-6">
          {activeTab === 'dashboard' ? (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="glass-panel p-6 rounded-lg border border-glass">
                <h3 className="font-display text-sm text-silver mb-2 uppercase tracking-wide">System Status</h3>
                <div className="flex items-center gap-2 text-green-400 font-mono text-sm">
                  <span className="h-2 w-2 rounded-full bg-green-500 animate-pulse shadow-[0_0_10px_#22c55e]"></span>
                  OPERATIONAL
                </div>
                <p className="text-xs text-muted mt-2 font-mono">Last check: Just now</p>
              </div>

              <div className="glass-panel p-6 rounded-lg border border-glass">
                <h3 className="font-display text-sm text-silver mb-2 uppercase tracking-wide">Total Users</h3>
                <div className="text-3xl font-display text-white">{users.length}</div>
                <p className="text-xs text-muted font-mono uppercase tracking-wider">Registered Accounts</p>
              </div>
            </div>
          ) : activeTab === 'users' ? (
            <div className="glass-panel overflow-hidden rounded-xl border border-glass">
              <div className="overflow-x-auto">
                <table className="w-full text-left border-collapse min-w-[600px]">
                  <thead className="bg-glass text-cobalt uppercase text-xs tracking-wider font-display">
                    <tr>
                      <th className="p-4 border-b border-glass">Identity Name</th>
                      <th className="p-4 border-b border-glass">Access ID (Email)</th>
                      <th className="p-4 border-b border-glass">Clearance Level</th>
                      <th className="p-4 border-b border-glass text-right">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-glass">
                    {users.map((user) => (
                      <tr key={user.email} className="hover:bg-white/5 transition-colors">
                        <td className="p-4 text-silver font-mono text-sm">{user.name}</td>
                        <td className="p-4 text-muted font-mono text-xs">{user.email}</td>
                        <td className="p-4">
                          {editingUser === user.email ? (
                            <select
                              value={user.role}
                              onChange={(e) => handleUpdateRole(user.email, e.target.value as UserRole)}
                              className="bg-obsidian border border-glass rounded px-2 py-1 text-xs font-mono text-white focus:border-cobalt outline-none"
                            >
                              <option value="free">FREE</option>
                              <option value="pro">PRO</option>
                              <option value="admin">ADMIN</option>
                              <option value="super_admin">SUPER ADMIN</option>
                            </select>
                          ) : (
                            <span className={`px-2 py-1 rounded text-[10px] font-mono uppercase tracking-wider border ${
                              user.role === 'super_admin'
                                ? 'bg-red-900/20 text-red-400 border-red-500/30'
                                : user.role === 'admin' 
                                  ? 'bg-purple-900/20 text-purple-400 border-purple-500/30' 
                                  : user.role === 'pro' 
                                    ? 'bg-cobalt/10 text-cobalt border-cobalt/30' 
                                    : 'bg-glass text-muted border-glass'
                            }`}>
                              {user.role}
                            </span>
                          )}
                        </td>
                        <td className="p-4 text-right">
                          {editingUser === user.email ? (
                            <div className="flex items-center justify-end gap-2">
                              <button 
                                onClick={() => handleDeleteUser(user.email)}
                                className="p-1.5 bg-red-900/20 text-red-400 rounded hover:bg-red-900/40 border border-red-500/30"
                                title="Delete User"
                              >
                                <Trash2 className="w-4 h-4" />
                              </button>
                              <button 
                                onClick={() => setEditingUser(null)}
                                className="p-1.5 text-muted hover:text-white hover:bg-white/10 rounded transition-colors"
                                title="Cancel"
                              >
                                <X className="w-4 h-4" />
                              </button>
                            </div>
                          ) : (
                            <button 
                              onClick={() => setEditingUser(user.email)}
                              className="p-1.5 text-muted hover:text-white hover:bg-white/10 rounded transition-colors"
                              title="Edit Role"
                            >
                              <Edit2 className="w-4 h-4" />
                            </button>
                          )}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          ) : (
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
                        onChange={handleFileUpload}
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
                      onClick={handleSaveEntry}
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
                              onClick={() => handleDeleteEntry(entry.id)}
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
          )}
        </div>
      </div>
    </div>
  );
};

export default AdminView;
