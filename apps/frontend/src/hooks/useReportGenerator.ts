import { useState } from 'react';
import { SearchParams, SavedReport, User } from '../types';
import { generateFireSafetyReport } from '../services/geminiService';
import { storageService } from '../services/storageService';

export const useReportGenerator = (user: User | null) => {
  const [params, setParams] = useState<SearchParams>({
    establishmentType: '',
    area: '',
    stories: ''
  });
  const [result, setResult] = useState<string>('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const generateReport = async () => {
    if (!user) return;
    
    setIsLoading(true);
    setError(null);
    setResult('');
    
    try {
      // Increment usage count
      const currentCount = parseInt(localStorage.getItem('gemini_usage_count') || '0', 10);
      localStorage.setItem('gemini_usage_count', (currentCount + 1).toString());

      const response = await generateFireSafetyReport(params);
      setResult(response.markdown);
      
      const report: SavedReport = {
        id: Date.now().toString(),
        timestamp: Date.now(),
        params: { ...params },
        result: response.markdown
      };
      await storageService.saveReport(user.email, report);
    } catch (err: any) {
      console.error(err);
      setError(err instanceof Error ? err.message : "Unable to generate report. Please check your connection and API key.");
    } finally {
      setIsLoading(false);
    }
  };

  const reset = () => {
    setResult('');
    setParams({ establishmentType: '', area: '', stories: '' });
  };

  const loadReport = (report: SavedReport) => {
    setParams(report.params);
    setResult(report.result);
  };

  return {
    params,
    setParams,
    result,
    setResult,
    isLoading,
    error,
    generateReport,
    reset,
    loadReport
  };
};
