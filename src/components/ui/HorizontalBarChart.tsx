import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from './Card';
import { motion } from 'framer-motion';
import { Info } from 'lucide-react';
import { cn } from '../../lib/utils';

export interface HorizontalBarData {
    id: string;
    name: string;
    value: number;
    count?: number;
    formattedValue?: string;
}

interface HorizontalBarChartProps {
    title: string;
    subtitle?: string;
    icon?: React.ElementType;
    data: HorizontalBarData[];
    color?: string;
    insight?: string;
    className?: string;
    onBarClick?: (item: HorizontalBarData) => void;
    activeId?: string | null;
}

export function HorizontalBarChart({
    title,
    subtitle,
    icon: Icon,
    data,
    color = "#6366f1",
    insight,
    className,
    onBarClick,
    activeId
}: HorizontalBarChartProps) {
    const maxValue = Math.max(...data.map(item => item.value), 1);

    return (
        <Card className={cn("bg-white/40 dark:bg-slate-800/40 backdrop-blur-md border border-slate-200 dark:border-white/10 shadow-sm flex flex-col h-full", className)}>
            <CardHeader className="py-4 border-b border-slate-100 dark:border-white/5 bg-white/30 dark:bg-white/5 flex flex-row items-center gap-3">
                {Icon && (
                    <div className="p-2 rounded-lg bg-indigo-500/10 dark:bg-indigo-500/20 text-indigo-600 dark:text-indigo-400">
                        <Icon size={18} />
                    </div>
                )}
                <div>
                    <CardTitle className="text-xs uppercase tracking-[0.2em] text-slate-500 dark:text-slate-400 font-bold">
                        {title}
                    </CardTitle>
                    {subtitle && (
                        <p className="text-[10px] text-slate-400 dark:text-slate-500 mt-0.5">
                            {subtitle}
                        </p>
                    )}
                </div>
            </CardHeader>
            <CardContent className="p-6 flex-1 flex flex-col overflow-hidden">
                <div className="space-y-4 overflow-y-auto flex-1 pr-2 pb-2">
                    {data.map((item, idx) => {
                        const percentage = (item.value / maxValue) * 100;
                        const isActive = activeId === item.id;
                        const isClickable = !!onBarClick;

                        return (
                            <div
                                key={item.id || idx}
                                className={cn(
                                    "group transition-all flex flex-col gap-1",
                                    isClickable ? "cursor-pointer" : "",
                                    activeId && !isActive ? "opacity-40 grayscale" : "opacity-100 hover:opacity-90"
                                )}
                                onClick={() => isClickable && onBarClick(item)}
                            >
                                <div className="px-1">
                                    <span className={cn(
                                        "text-xs font-bold uppercase tracking-tight truncate transition-colors",
                                        isActive ? "text-indigo-600 dark:text-indigo-400" : "text-slate-700 dark:text-slate-200"
                                    )}>
                                        {item.name}
                                    </span>
                                </div>
                                <div className="flex items-center gap-3 w-full">
                                    <div className="h-6 flex-1 bg-slate-100 dark:bg-slate-800 rounded-full overflow-hidden">
                                        <motion.div
                                            initial={{ width: 0 }}
                                            animate={{ width: `${percentage}%` }}
                                            transition={{ duration: 1, delay: idx * 0.05 }}
                                            className={cn(
                                                "h-full rounded-full transition-all shadow-[0_1px_3px_rgba(0,0,0,0.1)] relative",
                                                isActive && "ring-2 ring-indigo-500 ring-offset-2 ring-offset-white dark:ring-offset-slate-900"
                                            )}
                                            style={{ backgroundColor: color }}
                                        >
                                            <div className="absolute inset-0 bg-white/20 opacity-0 group-hover:opacity-100 transition-opacity" />
                                        </motion.div>
                                    </div>
                                    <span className={cn(
                                        "text-base font-mono font-bold transition-colors text-right min-w-[70px]",
                                        isActive ? "text-indigo-600 dark:text-indigo-400" : "text-slate-900 dark:text-white"
                                    )}>
                                        {item.formattedValue || item.value}
                                    </span>
                                    {item.count !== undefined && (
                                        <span className="text-[10px] font-bold text-slate-400 dark:text-slate-500 min-w-[30px] text-right">
                                            {item.count} adet
                                        </span>
                                    )}
                                </div>
                            </div>
                        );
                    })}
                    {data.length === 0 && (
                        <div className="text-center py-6 text-slate-400 text-xs italic">
                            Veri bulunamadı.
                        </div>
                    )}
                </div>

                {insight && (
                    <div className="mt-6 p-3 rounded-xl bg-gradient-to-tr from-indigo-500/5 to-white/5 dark:from-indigo-500/10 dark:to-transparent border border-indigo-500/10 flex gap-2.5 items-start">
                        <Info size={14} className="text-indigo-500 mt-0.5 shrink-0" />
                        <p className="text-[10px] text-slate-500 dark:text-slate-400 font-medium leading-relaxed italic">
                            {insight}
                        </p>
                    </div>
                )}
            </CardContent>
        </Card>
    );
}
