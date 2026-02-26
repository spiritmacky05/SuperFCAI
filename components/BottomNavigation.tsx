import React from 'react';
import { Search, History, Settings, Shield } from 'lucide-react';
import { User } from '../types';

interface BottomNavigationProps {
  activeView: 'main' | 'history' | 'admin';
  setView: (view: 'main' | 'history' | 'admin') => void;
  user: User;
}

const BottomNavigation: React.FC<BottomNavigationProps> = ({ activeView, setView, user }) => {
  const menuItems = [
    { id: 'main', label: 'Search', icon: Search },
    { id: 'history', label: 'History', icon: History },
  ] as const;

  return (
    <div className="md:hidden fixed bottom-0 left-0 right-0 glass-panel border-t border-glass z-50 backdrop-blur-xl">
      <div className="flex justify-around items-center h-16">
        {menuItems.map((item) => {
          const Icon = item.icon;
          const isActive = activeView === item.id;
          return (
            <button
              key={item.id}
              onClick={() => setView(item.id)}
              className={`flex flex-col items-center justify-center w-full h-full transition-all ${
                isActive 
                  ? 'text-cobalt bg-cobalt/5 shadow-[0_-4px_10px_rgba(0,242,255,0.1)]' 
                  : 'text-muted hover:text-white hover:bg-white/5'
              }`}
            >
              <Icon className={`w-5 h-5 mb-1 ${isActive ? 'animate-pulse drop-shadow-[0_0_5px_rgba(0,242,255,0.8)]' : ''}`} />
              <span className="text-[9px] font-mono tracking-widest uppercase">{item.label}</span>
            </button>
          );
        })}

        {user.role === 'admin' && (
          <button
            onClick={() => setView('admin')}
            className={`flex flex-col items-center justify-center w-full h-full transition-all ${
              activeView === 'admin'
                ? 'text-purple-400 bg-purple-500/5 shadow-[0_-4px_10px_rgba(168,85,247,0.1)]' 
                : 'text-muted hover:text-white hover:bg-white/5'
            }`}
          >
            <Shield className={`w-5 h-5 mb-1 ${activeView === 'admin' ? 'animate-pulse drop-shadow-[0_0_5px_rgba(168,85,247,0.8)]' : ''}`} />
            <span className="text-[9px] font-mono tracking-widest uppercase">Admin</span>
          </button>
        )}
      </div>
    </div>
  );
};

export default BottomNavigation;
