import React, { useState, useEffect } from 'react';
import { User } from '../types';
import { Shield, Zap, BarChart, Settings as SettingsIcon, CreditCard, Check } from 'lucide-react';

interface AccountViewProps {
  user: User;
}

const AccountView: React.FC<AccountViewProps> = ({ user }) => {
  const [usageCount, setUsageCount] = useState(0);

  useEffect(() => {
    const count = localStorage.getItem('gemini_usage_count');
    if (count) {
      setUsageCount(parseInt(count, 10));
    }
  }, []);

  const handleUpgrade = async () => {
    try {
      // Use PayMongo for GCash
      const response = await fetch('/api/paymongo/create-checkout', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
      });
      
      const data = await response.json();
      
      if (data.url) {
        window.location.href = data.url;
      } else {
        alert(data.error || 'Payment gateway not configured. Please contact admin.');
      }
    } catch (error) {
      console.error('Payment error:', error);
      alert('Failed to initiate payment.');
    }
  };

  return (
    <div className="container mx-auto px-4 py-8 max-w-4xl animate-fade-in-up">
      <h2 className="text-2xl font-display text-white mb-6 tracking-wider flex items-center gap-3">
        <SettingsIcon className="text-cobalt" />
        ACCOUNT SETTINGS
      </h2>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        
        {/* Analytics Section */}
        <div className="glass-panel p-6 rounded-xl border border-glass relative overflow-hidden group">
          <div className="absolute top-0 right-0 p-4 opacity-10 group-hover:opacity-20 transition-opacity">
            <BarChart size={100} />
          </div>
          <h3 className="text-lg font-display text-white mb-4 flex items-center gap-2">
            <BarChart className="text-tangerine" size={20} />
            USAGE ANALYTICS
          </h3>
          
          <div className="flex items-end gap-2 mb-2">
            <span className="text-5xl font-mono font-bold text-white">{usageCount}</span>
            <span className="text-sm text-muted mb-2 font-mono">GENERATIONS</span>
          </div>
          <p className="text-xs text-muted font-mono">Total AI analyses initiated.</p>
          
          <div className="mt-6 w-full bg-glass h-2 rounded-full overflow-hidden">
            <div 
              className="bg-tangerine h-full rounded-full" 
              style={{ width: `${Math.min(usageCount, 100)}%` }}
            ></div>
          </div>
          <p className="text-[10px] text-right text-muted mt-1 font-mono">Monthly Limit: 50</p>
        </div>

        {/* Profile Section */}
        <div className="glass-panel p-6 rounded-xl border border-glass">
          <h3 className="text-lg font-display text-white mb-4 flex items-center gap-2">
            <Shield className="text-cobalt" size={20} />
            PROFILE
          </h3>
          
          <div className="space-y-4">
            <div>
              <label className="block text-xs text-muted font-mono uppercase mb-1">Display Name</label>
              <input 
                type="text" 
                value={user.name} 
                readOnly 
                className="w-full bg-obsidian/50 border border-glass rounded-lg px-4 py-2 text-white font-mono text-sm focus:border-cobalt outline-none"
              />
            </div>
            <div>
              <label className="block text-xs text-muted font-mono uppercase mb-1">Email Address</label>
              <input 
                type="email" 
                value={user.email} 
                readOnly 
                className="w-full bg-obsidian/50 border border-glass rounded-lg px-4 py-2 text-muted font-mono text-sm focus:border-cobalt outline-none cursor-not-allowed"
              />
            </div>
            <div className="pt-2">
              <span className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-cobalt/10 border border-cobalt/30 text-cobalt text-xs font-bold uppercase tracking-wider">
                {user.role} PLAN
              </span>
            </div>
          </div>
        </div>

        {/* Pro Upgrade Gateway */}
        <div className="md:col-span-2 glass-panel p-8 rounded-xl border border-cobalt/30 relative overflow-hidden">
          <div className="absolute inset-0 bg-gradient-to-r from-cobalt/5 via-transparent to-transparent"></div>
          <div className="relative z-10 flex flex-col md:flex-row items-center justify-between gap-8">
            <div className="flex-1">
              <h3 className="text-2xl font-display text-white mb-2 flex items-center gap-2">
                <Zap className="text-yellow-400 fill-yellow-400" />
                UPGRADE TO PRO
              </h3>
              <p className="text-muted mb-6">Unlock advanced features and higher usage limits for only ₱199.00/month.</p>
              
              <ul className="space-y-2 mb-6">
                {[
                  'Unlimited AI Generations',
                  'Advanced Code Citations',
                  'Priority Support',
                  'Export to PDF/Word (Soon)'
                ].map((feature, i) => (
                  <li key={i} className="flex items-center gap-2 text-sm text-silver">
                    <Check size={16} className="text-cobalt" />
                    {feature}
                  </li>
                ))}
              </ul>
            </div>

            <div className="flex-shrink-0">
              <button 
                onClick={handleUpgrade}
                className="cyber-button-primary px-8 py-4 rounded-lg flex items-center gap-3 text-obsidian font-bold text-lg shadow-[0_0_20px_rgba(0,242,255,0.3)] hover:scale-105 transition-transform"
              >
                <CreditCard size={20} />
                PAY WITH GCASH
              </button>
              <p className="text-[10px] text-center text-muted mt-3 font-mono">SECURE PAYMENT via PayMongo</p>
            </div>
          </div>
        </div>

      </div>
    </div>
  );
};

export default AccountView;
