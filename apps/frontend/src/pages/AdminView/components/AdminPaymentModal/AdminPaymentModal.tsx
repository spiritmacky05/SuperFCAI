import React from 'react';
import { X, DollarSign, ThumbsDown, ThumbsUp } from 'lucide-react';
import { User } from '../../../../types';

interface AdminPaymentModalProps {
  user: User;
  onClose: () => void;
  onApprove: () => Promise<void>;
  onDisapprove: () => Promise<void>;
  onZoomImage: (url: string) => void;
}

const AdminPaymentModal: React.FC<AdminPaymentModalProps> = ({
  user,
  onClose,
  onApprove,
  onDisapprove,
  onZoomImage
}) => {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-obsidian/80 backdrop-blur-sm">
      <div className="glass-panel p-6 rounded-2xl w-full max-w-md border border-glass shadow-[0_0_40px_rgba(0,0,0,0.5)] relative max-h-[90vh] overflow-y-auto">
        <button 
          onClick={onClose}
          className="absolute top-4 right-4 text-muted hover:text-white transition-colors p-1 hover:bg-white/10 rounded-full"
        >
          <X className="w-5 h-5" />
        </button>
        <h2 className="text-xl font-display text-white uppercase tracking-widest flex items-center gap-2 mb-4">
          <DollarSign className="w-5 h-5 text-yellow-400" />
          Verify Payment
        </h2>
        <div className="space-y-4 font-mono text-sm">
          <div>
            <span className="text-muted text-xs uppercase tracking-wider block mb-1">User</span>
            <span className="text-silver">{user.name} ({user.email})</span>
          </div>
          <div>
            <span className="text-muted text-xs uppercase tracking-wider block mb-2">Proof of Payment</span>
            <img 
              src={user.proof_of_payment_url} 
              alt="Proof of Payment" 
              className="w-full rounded-lg border border-glass cursor-pointer hover:opacity-80 transition-opacity" 
              onClick={() => onZoomImage(user.proof_of_payment_url!)}
            />
          </div>
          <div className="flex gap-4 mt-6 pt-4 border-t border-glass">
            <button
              onClick={onDisapprove}
              className="flex-1 py-3 bg-red-900/20 text-red-400 border border-red-500/50 rounded-lg hover:bg-red-900/40 transition-colors text-sm font-bold uppercase tracking-wider flex items-center justify-center gap-2"
            >
              <ThumbsDown className="w-5 h-5" />
              Disapprove
            </button>
            <button
              onClick={onApprove}
              className="flex-1 py-3 bg-emerald-500/20 text-emerald-400 border border-emerald-500/50 rounded-lg hover:bg-emerald-500/30 transition-colors text-sm font-bold uppercase tracking-wider flex items-center justify-center gap-2"
            >
              <ThumbsUp className="w-5 h-5" />
              Approve
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default AdminPaymentModal;
