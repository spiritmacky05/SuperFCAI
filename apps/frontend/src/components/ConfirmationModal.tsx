import React from 'react';
import { X, AlertCircle } from 'lucide-react';

interface ConfirmationModalProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: () => void;
  onCancel?: () => void;
  title: string;
  message: string;
  confirmLabel?: string;
  cancelLabel?: string;
  variant?: 'primary' | 'danger' | 'warning';
}

const ConfirmationModal: React.FC<ConfirmationModalProps> = ({
  isOpen,
  onClose,
  onConfirm,
  onCancel,
  title,
  message,
  confirmLabel = 'YES',
  cancelLabel = 'NO',
  variant = 'primary'
}) => {
  if (!isOpen) return null;

  const handleCancel = () => {
    if (onCancel) onCancel();
    onClose();
  };

  const getVariantStyles = () => {
    switch (variant) {
      case 'danger':
        return 'bg-red-500/20 text-red-400 border-red-500/50 hover:bg-red-500/30 shadow-[0_0_15px_rgba(239,68,68,0.2)]';
      case 'warning':
        return 'bg-tangerine/20 text-tangerine border-tangerine/50 hover:bg-tangerine/30 shadow-[0_0_15px_rgba(255,165,0,0.2)]';
      default:
        return 'bg-cobalt/20 text-cobalt border-cobalt/50 hover:bg-cobalt/30 shadow-[0_0_15px_rgba(0,242,255,0.2)]';
    }
  };

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-obsidian/90 backdrop-blur-sm animate-in fade-in duration-200">
      <div 
        className="glass-panel w-full max-w-md overflow-hidden rounded-xl border border-glass shadow-2xl animate-in zoom-in-95 duration-200"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="p-4 border-b border-glass flex items-center justify-between bg-glass/30">
          <div className="flex items-center gap-2">
            <AlertCircle className={`w-5 h-5 ${variant === 'danger' ? 'text-red-400' : variant === 'warning' ? 'text-tangerine' : 'text-cobalt'}`} />
            <h3 className="font-display text-sm text-white tracking-widest uppercase">{title}</h3>
          </div>
          <button 
            onClick={onClose}
            className="text-muted hover:text-white transition-colors p-1"
          >
            <X className="w-5 h-5" />
          </button>
        </div>
        
        <div className="p-6">
          <p className="text-silver font-mono text-sm leading-relaxed mb-8">
            {message}
          </p>
          
          <div className="flex gap-3 justify-end">
            <button
              onClick={handleCancel}
              className="px-6 py-2 rounded-lg border border-glass text-muted hover:text-white hover:bg-white/5 transition-all font-display text-xs tracking-wider uppercase"
            >
              {cancelLabel}
            </button>
            <button
              onClick={() => {
                onConfirm();
                onClose();
              }}
              className={`px-6 py-2 rounded-lg border transition-all font-display text-xs tracking-wider uppercase font-bold ${getVariantStyles()}`}
            >
              {confirmLabel}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ConfirmationModal;
