
import React, { useState, useRef, useEffect } from 'react';
import { sendMessage } from '../services/geminiService';
import { ChatMessage } from '../types';
import Logo from './Logo';
import ReactMarkdown from 'react-markdown';
import { Bot, Send, X, Sparkles, Loader2, User } from 'lucide-react';

interface AssistantModalProps {
  isOpen: boolean;
  onClose: () => void;
}

const AssistantModal: React.FC<AssistantModalProps> = ({ isOpen, onClose }) => {
  const [messages, setMessages] = useState<ChatMessage[]>([
    { role: 'model', text: '# Welcome to Super FC AI Expert Mode\nI am your advanced assistant for RA 9514. You can ask me anything about the Fire Code of the Philippines, specific occupancy requirements, or technical safety standards.\n\nHow can I help your inspection today?' }
  ]);
  const [input, setInput] = useState('');
  const [isTyping, setIsTyping] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  if (!isOpen) return null;

  const handleSend = async () => {
    if (!input.trim()) return;

    const userMsg = input;
    const currentHistory = [...messages];
    setInput('');
    setMessages(prev => [...prev, { role: 'user', text: userMsg }]);
    setIsTyping(true);

    try {
      const responseText = await sendMessage(userMsg, currentHistory);
      setMessages(prev => [...prev, { role: 'model', text: responseText }]);
    } catch (error) {
      setMessages(prev => [...prev, { role: 'model', text: "Sorry, I encountered an error connecting to the expert assistant." }]);
    } finally {
      setIsTyping(false);
    }
  };

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 sm:p-6 bg-obsidian/80 backdrop-blur-md animate-fade-in">
      <div className="glass-panel w-full max-w-4xl h-[85vh] rounded-2xl shadow-[0_0_50px_rgba(0,0,0,0.5)] overflow-hidden flex flex-col border border-glass">
        {/* Header */}
        <div className="bg-glass/50 border-b border-glass p-4 flex items-center justify-between relative overflow-hidden">
          <div className="absolute inset-0 bg-gradient-to-r from-cobalt/10 to-transparent opacity-50"></div>
          <div className="flex items-center gap-4 relative z-10">
            <Logo size="md" />
            <div>
              <h3 className="font-display text-lg text-white tracking-widest uppercase">Super FC AI Expert Mode</h3>
              <div className="flex items-center gap-2">
                <Sparkles className="w-3 h-3 text-tangerine" />
                <p className="text-xs font-mono text-silver/70 tracking-wider">DEEP NEURAL NETWORK • RA 9514 KNOWLEDGE BASE</p>
              </div>
            </div>
          </div>
          <button 
            onClick={onClose}
            className="p-2 hover:bg-white/10 rounded-lg transition-colors border border-transparent hover:border-glass text-muted hover:text-white relative z-10"
          >
            <X className="w-6 h-6" />
          </button>
        </div>

        {/* Chat Area */}
        <div className="flex-grow overflow-y-auto p-6 space-y-6 scrollbar-thin scrollbar-thumb-glass scrollbar-track-transparent bg-obsidian/50">
          {messages.map((msg, idx) => (
            <div key={idx} className={`flex gap-4 ${msg.role === 'user' ? 'flex-row-reverse' : 'flex-row'}`}>
              <div className={`flex-shrink-0 h-8 w-8 rounded-lg flex items-center justify-center border ${
                msg.role === 'user' 
                  ? 'bg-tangerine/10 border-tangerine/30 text-tangerine' 
                  : 'bg-cobalt/10 border-cobalt/30 text-cobalt'
              }`}>
                {msg.role === 'user' ? <User className="w-4 h-4" /> : <Bot className="w-4 h-4" />}
              </div>

              <div className={`max-w-[85%] rounded-xl p-5 shadow-lg border ${
                msg.role === 'user' 
                  ? 'bg-tangerine/5 border-tangerine/20 text-silver rounded-tr-none' 
                  : 'bg-glass border-glass text-silver rounded-tl-none'
              }`}>
                <div className="font-mono text-sm leading-relaxed">
                  <ReactMarkdown
                    components={{
                      h1: ({node, ...props}) => <h1 className="text-lg font-display text-white mb-3 uppercase tracking-wider" {...props} />,
                      h2: ({node, ...props}) => <h2 className="text-base font-display text-white mb-2 uppercase tracking-wide" {...props} />,
                      h3: ({node, ...props}) => <h3 className="text-sm font-display text-cobalt mb-2 uppercase tracking-wide" {...props} />,
                      p: ({node, ...props}) => <p className="mb-3 last:mb-0" {...props} />,
                      ul: ({node, ...props}) => <ul className="list-disc ml-4 mb-3 space-y-1" {...props} />,
                      ol: ({node, ...props}) => <ol className="list-decimal ml-4 mb-3 space-y-1" {...props} />,
                      li: ({node, ...props}) => <li className="pl-1" {...props} />,
                      code: ({node, ...props}) => <code className="bg-obsidian/50 px-1.5 py-0.5 rounded text-xs border border-glass text-tangerine font-mono" {...props} />,
                      strong: ({node, ...props}) => <strong className="text-white font-bold" {...props} />,
                      blockquote: ({node, ...props}) => <blockquote className="border-l-2 border-cobalt/50 pl-4 italic text-muted my-3" {...props} />,
                    }}
                  >
                    {msg.text}
                  </ReactMarkdown>
                </div>
              </div>
            </div>
          ))}
          {isTyping && (
            <div className="flex gap-4">
              <div className="flex-shrink-0 h-8 w-8 rounded-lg bg-cobalt/10 border border-cobalt/30 flex items-center justify-center">
                <Bot className="w-4 h-4 text-cobalt" />
              </div>
              <div className="bg-glass border border-glass rounded-xl rounded-tl-none p-4 shadow-lg flex items-center gap-3">
                <Loader2 className="w-4 h-4 text-cobalt animate-spin" />
                <span className="text-xs font-mono text-cobalt animate-pulse uppercase tracking-wider">ANALYZING FIRE CODE DATA...</span>
              </div>
            </div>
          )}
          <div ref={messagesEndRef} />
        </div>

        {/* Input Area */}
        <div className="p-6 bg-glass border-t border-glass">
          <div className="flex gap-3 relative">
            <input
              type="text"
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && !e.shiftKey && (e.preventDefault(), handleSend())}
              placeholder="Ask anything about RA 9514 (e.g., 'What are the travel distance limits for schools?')"
              className="flex-grow px-5 py-4 glass-input rounded-xl focus:ring-1 focus:ring-cobalt/50 font-mono text-sm text-white placeholder-muted transition-all"
              disabled={isTyping}
            />
            <button
              onClick={handleSend}
              disabled={isTyping || !input.trim()}
              className="bg-cobalt/10 text-cobalt border border-cobalt/30 px-6 py-3 rounded-xl hover:bg-cobalt/20 hover:shadow-[0_0_15px_rgba(0,242,255,0.2)] disabled:opacity-50 disabled:cursor-not-allowed transition-all active:scale-95 flex items-center justify-center"
            >
              <Send className="w-5 h-5" />
            </button>
          </div>
          <p className="text-[10px] text-muted/50 mt-3 text-center uppercase tracking-widest font-mono">
            Powered by Super FC AI Knowledge Engine • Verify Critical Information
          </p>
        </div>
      </div>
    </div>
  );
};

export default AssistantModal;
