import React from 'react';
import { EstablishmentType, SearchParams } from '../types';
import { ESTABLISHMENT_TYPES } from '../constants';
import { Search, Building2, Ruler, Layers, FileText } from 'lucide-react';

interface SearchFormProps {
  params: SearchParams;
  setParams: React.Dispatch<React.SetStateAction<SearchParams>>;
  onSubmit: () => void;
  isLoading: boolean;
}

const SearchForm: React.FC<SearchFormProps> = ({ params, setParams, onSubmit, isLoading }) => {
  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setParams(prev => ({ ...prev, [name]: value }));
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!params.establishmentType || !params.area || !params.stories) return;
    onSubmit();
  };

  return (
    <form onSubmit={handleSubmit} className="glass-panel p-6 rounded-xl shadow-2xl relative overflow-hidden">
      <div className="absolute top-0 right-0 p-2 opacity-20">
        <div className="w-20 h-20 border border-cobalt rounded-full border-dashed animate-spin-slow"></div>
      </div>

      <div className="space-y-6 relative z-10">
        <div>
          <label className="block text-xs font-mono text-cobalt mb-2 uppercase tracking-widest">Establishment Type</label>
          <div className="relative group">
            <Building2 className="absolute left-3 top-3 h-5 w-5 text-muted group-focus-within:text-cobalt transition-colors" />
            <select
              name="establishmentType"
              value={params.establishmentType}
              onChange={handleChange}
              className="w-full pl-10 pr-4 py-3 rounded-lg glass-input focus:ring-1 focus:ring-cobalt/50 font-mono text-sm appearance-none cursor-pointer"
              required
            >
              <option value="" className="bg-obsidian text-muted">SELECT CLASSIFICATION</option>
              {ESTABLISHMENT_TYPES.map((type) => (
                <option key={type} value={type} className="bg-obsidian text-silver">{type}</option>
              ))}
            </select>
            <div className="absolute right-3 top-3 pointer-events-none text-muted">▼</div>
          </div>
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="block text-xs font-mono text-cobalt mb-2 uppercase tracking-widest">Area (SQM)</label>
            <div className="relative group">
              <Ruler className="absolute left-3 top-3 h-5 w-5 text-muted group-focus-within:text-cobalt transition-colors" />
              <input
                type="number"
                name="area"
                value={params.area}
                onChange={handleChange}
                placeholder="0.00"
                className="w-full pl-10 pr-4 py-3 rounded-lg glass-input focus:ring-1 focus:ring-cobalt/50 font-mono text-sm placeholder-muted/30"
                required
                min="0"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-mono text-cobalt mb-2 uppercase tracking-widest">Storey</label>
            <div className="relative group">
              <Layers className="absolute left-3 top-3 h-5 w-5 text-muted group-focus-within:text-cobalt transition-colors" />
              <input
                type="number"
                name="stories"
                value={params.stories}
                onChange={handleChange}
                placeholder="0"
                className="w-full pl-10 pr-4 py-3 rounded-lg glass-input focus:ring-1 focus:ring-cobalt/50 font-mono text-sm placeholder-muted/30"
                required
                min="1"
              />
            </div>
          </div>
        </div>

        <div>
          <label className="block text-xs font-mono text-cobalt mb-2 uppercase tracking-widest">Additional Details</label>
          <div className="relative group">
            <FileText className="absolute left-3 top-3 h-5 w-5 text-muted group-focus-within:text-cobalt transition-colors" />
            <textarea
              name="additional_details"
              value={params.additional_details || ''}
              onChange={handleChange}
              placeholder="Enter any specific details, materials, or conditions to help Super FC AI generate more accurate requirements..."
              className="w-full pl-10 pr-4 py-3 rounded-lg glass-input focus:ring-1 focus:ring-cobalt/50 font-mono text-sm placeholder-muted/30 min-h-[100px] resize-y"
            />
          </div>
        </div>

        <button
          type="submit"
          disabled={isLoading}
          className={`w-full py-4 rounded-lg font-display text-sm tracking-widest uppercase transition-all flex items-center justify-center gap-2 relative overflow-hidden ${
            isLoading 
              ? 'bg-glass cursor-not-allowed text-muted border border-glass' 
              : 'cyber-button-primary hover:scale-[1.02] active:scale-[0.98]'
          }`}
        >
          {isLoading ? (
            <>
              <div className="w-4 h-4 border-2 border-cobalt border-t-transparent rounded-full animate-spin"></div>
              <span>PROCESSING DATA...</span>
            </>
          ) : (
            <>
              <Search className="w-4 h-4" />
              <span>INITIATE ANALYSIS</span>
            </>
          )}
        </button>
      </div>
    </form>
  );
};

export default SearchForm;
