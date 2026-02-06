import { useState } from 'react';
import { Bot, X, Send } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { cn } from '../lib/utils';;

export function RunaAIBot() {
    const [isOpen, setIsOpen] = useState(false);
    const [messages, setMessages] = useState<{ type: 'user' | 'bot', text: string }[]>([
        { type: 'bot', text: 'Merhaba! Ben RUNA AI. Varuna CRM verilerine doğrudan erişimim var. Size nasıl yardımcı olabilirim?' }
    ]);
    const [input, setInput] = useState('');

    const handleSend = () => {
        if (!input.trim()) return;

        const newMessages = [...messages, { type: 'user' as const, text: input }];
        setMessages(newMessages);
        setInput('');

        // Mock response
        setTimeout(() => {
            setMessages(prev => [...prev, {
                type: 'bot',
                text: 'Şu an demo modundayım, ancak yakında tüm CRM verilerinizi analiz edip size anlık içgörüler sunabileceğim.'
            }]);
        }, 1000);
    };

    return (
        <>
            {/* Floating Action Button */}
            <motion.button
                initial={{ scale: 0, rotate: -180 }}
                animate={{ scale: 1, rotate: 0 }}
                whileHover={{ scale: 1.1 }}
                whileTap={{ scale: 0.9 }}
                onClick={() => setIsOpen(true)}
                className="fixed bottom-6 right-6 z-50 flex items-center justify-center p-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-full shadow-lg shadow-indigo-600/30 transition-all group"
            >
                <div className="absolute inset-0 rounded-full bg-indigo-400 animate-ping opacity-20 pointer-events-none"></div>
                <Bot size={20} className="animate-pulse-slow" />
                <span className="absolute right-full mr-4 bg-slate-900 text-white text-xs py-1 px-3 rounded-lg opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap pointer-events-none">
                    RUNA AI
                </span>
            </motion.button>

            {/* Chat Modal */}
            <AnimatePresence>
                {isOpen && (
                    <motion.div
                        initial={{ opacity: 0, y: 50, scale: 0.9 }}
                        animate={{ opacity: 1, y: 0, scale: 1 }}
                        exit={{ opacity: 0, y: 50, scale: 0.9 }}
                        className="fixed bottom-24 right-6 w-96 h-[500px] z-50 flex flex-col bg-white dark:bg-slate-800 rounded-2xl shadow-2xl border border-slate-200 dark:border-white/10 overflow-hidden font-sans"
                    >
                        {/* Header */}
                        <div className="p-4 bg-indigo-600 text-white flex justify-between items-center relative overflow-hidden">
                            <div className="absolute inset-0 bg-gradient-to-tr from-indigo-600 to-purple-600"></div>
                            <div className="flex items-center gap-3 relative z-10">
                                <div className="p-2 bg-white/20 rounded-lg backdrop-blur-sm">
                                    <Bot size={20} />
                                </div>
                                <div>
                                    <h3 className="font-bold text-sm">RUNA AI</h3>
                                    <p className="text-[10px] text-indigo-100 flex items-center gap-1">
                                        <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse"></span>
                                        Online
                                    </p>
                                </div>
                            </div>
                            <button
                                onClick={() => setIsOpen(false)}
                                className="p-2 hover:bg-white/20 rounded-lg transition-colors relative z-10"
                            >
                                <X size={18} />
                            </button>
                        </div>

                        {/* Messages Area */}
                        <div className="flex-1 overflow-y-auto p-4 space-y-4 bg-slate-50 dark:bg-slate-900/50">
                            {messages.map((msg, idx) => (
                                <div
                                    key={idx}
                                    className={cn(
                                        "max-w-[85%] p-3 rounded-2xl text-xs sm:text-sm leading-relaxed",
                                        msg.type === 'user'
                                            ? "ml-auto bg-indigo-600 text-white rounded-tr-none"
                                            : "bg-white dark:bg-slate-700 text-slate-700 dark:text-slate-200 rounded-tl-none border border-slate-200 dark:border-white/5 shadow-sm"
                                    )}
                                >
                                    {msg.text}
                                </div>
                            ))}
                        </div>

                        {/* Input Area */}
                        <div className="p-3 bg-white dark:bg-slate-800 border-t border-slate-200 dark:border-white/5">
                            <div className="relative">
                                <input
                                    type="text"
                                    value={input}
                                    onChange={(e) => setInput(e.target.value)}
                                    onKeyDown={(e) => e.key === 'Enter' && handleSend()}
                                    placeholder="Bir soru sorun..."
                                    className="w-full bg-slate-100 dark:bg-slate-900 border-none rounded-xl py-3 pl-4 pr-12 text-sm outline-none focus:ring-2 focus:ring-indigo-500/50"
                                />
                                <button
                                    onClick={handleSend}
                                    disabled={!input.trim()}
                                    className="absolute right-2 top-1/2 -translate-y-1/2 p-1.5 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                                >
                                    <Send size={14} />
                                </button>
                            </div>
                        </div>
                    </motion.div>
                )}
            </AnimatePresence>
        </>
    );
}
