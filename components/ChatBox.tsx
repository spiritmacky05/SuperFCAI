import React, { useState, useRef, useEffect } from 'react';
import { Send, Bot, User, Loader2, Sparkles, AlertCircle } from 'lucide-react';
import { generateContent } from '../services/geminiService';
import ReactMarkdown from 'react-markdown';

interface ChatBoxProps {
  reportContext: string;
}

interface Message {
  role: 'user' | 'model';
  content: string;
  timestamp: number;
}

const ChatBox: React.FC<ChatBoxProps> = ({ reportContext }) => {
  const [messages, setMessages] = useState<Message[]>([
    {
      role: 'model',
      content: "I am ready to clarify any details regarding the inspection report. What specific provision requires elaboration?",
      timestamp: Date.now()
    }
  ]);
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const handleSend = async () => {
    if (!input.trim() || isLoading) return;

    const userMessage: Message = {
      role: 'user',
      content: input,
      timestamp: Date.now()
    };

    setMessages(prev => [...prev, userMessage]);
    setInput('');
    setIsLoading(true);

    try {
      // Create a prompt that includes the report context
      const prompt = `
        Context: The user is asking about a fire safety inspection report generated based on the Fire Code of the Philippines (RA 9514).
        
        Report Content:
        ${reportContext}

        User Question: ${input}

        Answer the user's question based on the report content and the Fire Code. Be concise, professional, and cite specific provisions if applicable.
      `;

      const response = await generateContent(prompt);
      
      const botMessage: Message = {
        role: 'model',
        content: response,
        timestamp: Date.now()
      };

      setMessages(prev => [...prev, botMessage]);
    } catch (error) {
      console.error("Chat error:", error);
      const errorMessage: Message = {
        role: 'model',
        content: "I encountered a system error processing your request. Please try again.",
        timestamp: Date.now()
      };
      setMessages(prev => [...prev, errorMessage]);
    } finally {
      setIsLoading(false);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  return (
    <div className="glass-panel rounded-xl overflow-hidden border border-glass shadow-2xl flex flex-col h-[600px]">
      <div className="bg-glass border-b border-glass p-4 flex items-center justify-between relative overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-r from-cobalt/5 to-transparent opacity-50"></div>
        <div className="flex items-center gap-3 relative z-10">
          <div className="h-8 w-8 bg-cobalt/10 rounded-lg flex items-center justify-center border border-cobalt/30 shadow-[0_0_10px_rgba(0,242,255,0.2)]">
            <Bot className="w-5 h-5 text-cobalt" />
          </div>
          <div>
            <h3 className="text-sm font-display text-white tracking-widest uppercase">Neural Assistant</h3>
            <div className="flex items-center gap-1.5">
              <span className="h-1.5 w-1.5 rounded-full bg-green-500 animate-pulse shadow-[0_0_5px_#22c55e]"></span>
              <span className="text-[10px] text-green-400 font-mono uppercase tracking-wider">Online</span>
            </div>
          </div>
        </div>
      </div>

      <div className="flex-1 overflow-y-auto p-4 space-y-6 bg-obsidian/50 scrollbar-thin scrollbar-thumb-glass scrollbar-track-transparent">
        {messages.map((msg, index) => (
          <div
            key={index}
            className={`flex gap-3 ${msg.role === 'user' ? 'flex-row-reverse' : 'flex-row'}`}
          >
            <div className={`flex-shrink-0 h-8 w-8 rounded-lg flex items-center justify-center border ${
              msg.role === 'user' 
                ? 'bg-tangerine/10 border-tangerine/30 text-tangerine' 
                : 'bg-cobalt/10 border-cobalt/30 text-cobalt'
            }`}>
              {msg.role === 'user' ? <User className="w-4 h-4" /> : <Bot className="w-4 h-4" />}
            </div>
            
            <div className={`max-w-[80%] rounded-xl p-4 text-sm font-mono leading-relaxed border ${
              msg.role === 'user'
                ? 'bg-tangerine/5 border-tangerine/20 text-silver/90 rounded-tr-none'
                : 'bg-glass border-glass text-silver/90 rounded-tl-none'
            }`}>
              <ReactMarkdown 
                components={{
                  p: ({node, ...props}) => <p className="mb-2 last:mb-0" {...props} />,
                  ul: ({node, ...props}) => <ul className="list-disc ml-4 mb-2" {...props} />,
                  ol: ({node, ...props}) => <ol className="list-decimal ml-4 mb-2" {...props} />,
                  li: ({node, ...props}) => <li className="mb-1" {...props} />,
                  code: ({node, ...props}) => <code className="bg-obsidian/50 px-1 py-0.5 rounded text-xs border border-glass text-cobalt" {...props} />,
                  strong: ({node, ...props}) => <strong className="text-white font-bold" {...props} />,
                }}
              >
                {msg.content}
              </ReactMarkdown>
              <div className={`text-[9px] mt-2 opacity-50 uppercase tracking-wider ${
                msg.role === 'user' ? 'text-right' : 'text-left'
              }`}>
                {new Date(msg.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
              </div>
            </div>
          </div>
        ))}
        {isLoading && (
          <div className="flex gap-3">
            <div className="flex-shrink-0 h-8 w-8 rounded-lg bg-cobalt/10 border border-cobalt/30 flex items-center justify-center">
              <Bot className="w-4 h-4 text-cobalt" />
            </div>
            <div className="bg-glass border border-glass rounded-xl rounded-tl-none p-4 flex items-center gap-2">
              <Loader2 className="w-4 h-4 text-cobalt animate-spin" />
              <span className="text-xs font-mono text-cobalt animate-pulse">PROCESSING QUERY...</span>
            </div>
          </div>
        )}
        <div ref={messagesEndRef} />
      </div>

      <div className="p-4 bg-glass border-t border-glass">
        <div className="relative flex items-center gap-2">
          <textarea
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder="Input query regarding fire safety protocols..."
            className="w-full pl-4 pr-12 py-3 bg-obsidian/50 border border-glass rounded-lg text-sm font-mono text-silver placeholder-muted focus:ring-1 focus:ring-cobalt/50 focus:border-cobalt/50 resize-none h-12 min-h-[48px] max-h-32 scrollbar-hide"
            disabled={isLoading}
          />
          <button
            onClick={handleSend}
            disabled={!input.trim() || isLoading}
            className={`absolute right-2 p-2 rounded-md transition-all ${
              !input.trim() || isLoading
                ? 'text-muted cursor-not-allowed'
                : 'text-cobalt hover:bg-cobalt/10 hover:shadow-[0_0_10px_rgba(0,242,255,0.2)]'
            }`}
          >
            <Send className="w-4 h-4" />
          </button>
        </div>
        <div className="text-[10px] text-muted text-center mt-2 font-mono uppercase tracking-widest opacity-50">
          AI-Generated Response • Verify with Official Sources
        </div>
      </div>
    </div>
  );
};

export default ChatBox;
