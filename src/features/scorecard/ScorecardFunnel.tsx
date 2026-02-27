import React from 'react';
import { motion } from 'framer-motion';
import { Card, CardHeader, CardTitle, CardContent } from '../../components/ui/Card';

interface FunnelItem {
    id: string;
    label: string;
    amount: number;
    count: number;
}

export const ScorecardFunnel = ({ data }: { data: FunnelItem[] }) => {
    // Determine max value for scaling widths
    const maxAmount = Math.max(...data.map(d => d.amount), 1);

    const formatCurrency = (val: number) => {
        if (val >= 1000000) return `₺${(val / 1000000).toFixed(1)}M`;
        if (val >= 1000) return `₺${(val / 1000).toFixed(0)}k`;
        return `₺${val.toFixed(0)}`;
    };

    const colors = [
        'bg-blue-500', 'bg-indigo-500', 'bg-purple-500',
        'bg-fuchsia-500', 'bg-pink-500', 'bg-rose-500', 'bg-emerald-500'
    ];

    return (
        <Card className="h-full flex flex-col overflow-hidden bg-white/40 dark:bg-slate-700/40 backdrop-blur-md">
            <CardHeader className="border-b border-slate-100 dark:border-white/5 pb-4">
                <CardTitle className="text-sm font-semibold text-slate-800 dark:text-white flex items-center gap-2 text-center">
                    Operasyonel Dönüşüm Hunisi
                </CardTitle>
            </CardHeader>
            <CardContent className="flex-1 p-6">
                <div className="flex flex-col gap-4 h-full justify-center pb-2">
                    {data.map((item, i) => {
                        const prev = i > 0 ? data[i - 1].amount : item.amount;
                        const dropOff = prev > 0 ? ((prev - item.amount) / prev) * 100 : 0;
                        const conversion = maxAmount > 0 ? (item.amount / maxAmount) * 100 : 0;
                        const w = Math.max(conversion, 5); // min 5% width so text fits or just looks like a bar

                        return (
                            <div key={item.id} className="relative w-full flex flex-col items-center group">
                                <motion.div
                                    initial={{ width: 0, opacity: 0 }}
                                    animate={{ width: `${w}%`, opacity: 1 }}
                                transition={{ duration: 0.8, delay: i * 0.1, ease: 'easeOut' }}
                                className={`${colors[i % colors.length]} h-12 rounded-lg flex items-center justify-between px-4 shadow-sm relative`}
                                >
                                <span className="text-white text-xs font-bold whitespace-nowrap overflow-hidden text-ellipsis drop-shadow-sm z-10 hidden sm:block">
                                    {item.label}
                                </span>
                                <div className="flex items-center gap-2 z-10 text-right w-full sm:w-auto overflow-hidden">
                                    <span className="text-white/90 text-[10px] hidden md:inline-block">({item.count} adet)</span>
                                    <span className="text-white font-mono font-bold text-sm tracking-tight drop-shadow-sm">
                                        {formatCurrency(item.amount)}
                                    </span>
                                </div>
                                <div className="absolute inset-0 bg-gradient-to-r from-white/0 via-white/10 to-transparent rounded-lg mix-blend-overlay pointer-events-none" />
                            </motion.div>
                                
                                {
                            i < data.length - 1 && (
                                <div className="h-4 flex items-center justify-center -my-1 relative z-20">
                                    {dropOff > 0 ? (
                                        <span className="text-[10px] text-slate-400 dark:text-slate-500 bg-white dark:bg-slate-800 px-2 rounded-full border border-slate-100 dark:border-slate-700 shadow-sm">
                                            -%{dropOff.toFixed(1)}
                                        </span>
                                    ) : (
                                        <div className="w-[1px] h-full bg-slate-200 dark:bg-slate-600" />
                                    )}
                                </div>
                            )
                        }
                            </div>
                );
                    })}
            </div>
        </CardContent>
        </Card >
    );
};
