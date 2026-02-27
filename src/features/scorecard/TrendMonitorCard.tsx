import React from 'react';
import { Card, CardHeader, CardTitle, CardContent } from '../../components/ui/Card';
import { AreaChart, Area, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid, Legend } from 'recharts';

interface TrendItem {
    name: string;
    contractRevenue: number;
    invoiceRevenue: number;
    collectionRevenue: number;
    target: number;
}

export const TrendMonitorCard = ({ data }: { data: TrendItem[] }) => {

    // Sort chronological: oldest to newest assuming the data passed is new-to-old.
    // Wait, the API returns it latest to oldest? No, it pushes oldest first because loop goes 5 to 0.
    const chartData = [...data];

    const YAxisFormatter = (value: number) => {
        if (value >= 1000000) return `${(value / 1000000).toFixed(1)}M`;
        if (value >= 1000) return `${(value / 1000).toFixed(0)}k`;
        return value.toString();
    };

    const CustomTooltip = ({ active, payload, label }: any) => {
        if (active && payload && payload.length) {
            return (
                <div className="bg-white/90 dark:bg-slate-800/90 backdrop-blur-md border border-slate-200 dark:border-slate-700 p-3 rounded-lg shadow-xl">
                    <p className="font-bold text-slate-800 dark:text-white mb-2">{label}</p>
                    {payload.map((entry: any, index: number) => (
                        <div key={index} className="flex items-center justify-between gap-4 mb-1">
                            <div className="flex items-center gap-1.5">
                                <span className="w-2 h-2 rounded-full" style={{ backgroundColor: entry.color }} />
                                <span className="text-xs text-slate-600 dark:text-slate-300">{entry.name}</span>
                            </div>
                            <span className="font-mono font-bold text-xs">
                                ₺{entry.value.toLocaleString(undefined, { maximumFractionDigits: 0 })}
                            </span>
                        </div>
                    ))}
                </div>
            );
        }
        return null;
    };

    return (
        <Card className="h-full flex flex-col bg-white/40 dark:bg-slate-700/40 backdrop-blur-md overflow-hidden">
            <CardHeader className="border-b border-slate-100 dark:border-white/5 pb-4">
                <CardTitle className="text-sm font-semibold text-slate-800 dark:text-white">
                    Gelir & Tahsilat Trendi (Son 6 Ay)
                </CardTitle>
            </CardHeader>
            <CardContent className="flex-1 p-0 pt-4 px-2 pb-2 h-64">
                <ResponsiveContainer width="100%" height="100%">
                    <AreaChart data={chartData} margin={{ top: 10, right: 10, left: 10, bottom: 0 }}>
                        <defs>
                            <linearGradient id="colorContract" x1="0" y1="0" x2="0" y2="1">
                                <stop offset="5%" stopColor="#8b5cf6" stopOpacity={0.3}/>
                                <stop offset="95%" stopColor="#8b5cf6" stopOpacity={0}/>
                            </linearGradient>
                            <linearGradient id="colorInvoice" x1="0" y1="0" x2="0" y2="1">
                                <stop offset="5%" stopColor="#3b82f6" stopOpacity={0.3}/>
                                <stop offset="95%" stopColor="#3b82f6" stopOpacity={0}/>
                            </linearGradient>
                            <linearGradient id="colorCollection" x1="0" y1="0" x2="0" y2="1">
                                <stop offset="5%" stopColor="#10b981" stopOpacity={0.3}/>
                                <stop offset="95%" stopColor="#10b981" stopOpacity={0}/>
                            </linearGradient>
                        </defs>
                        <XAxis 
                            dataKey="name" 
                            axisLine={false} 
                            tickLine={false} 
                            tick={{ fontSize: 10, fill: '#64748b' }}
                            dy={10}
                        />
                        <YAxis 
                            axisLine={false} 
                            tickLine={false} 
                            tick={{ fontSize: 10, fill: '#64748b' }}
                            tickFormatter={YAxisFormatter}
                            width={40}
                        />
                        <CartesianGrid vertical={false} strokeDasharray="3 3" strokeOpacity={0.1} />
                        <Tooltip content={<CustomTooltip />} />
                        <Legend iconType="circle" wrapperStyle={{ fontSize: '11px' }} />
                        <Area 
                            type="monotone" 
                            dataKey="contractRevenue" 
                            name="Sözleşme (ARR)" 
                            stroke="#8b5cf6" 
                            fillOpacity={1} 
                            fill="url(#colorContract)" 
                            strokeWidth={3} 
                        />
                        <Area 
                            type="monotone" 
                            dataKey="invoiceRevenue" 
                            name="Fatura" 
                            stroke="#3b82f6" 
                            fillOpacity={1} 
                            fill="url(#colorInvoice)" 
                            strokeWidth={2} 
                        />
                        <Area 
                            type="monotone" 
                            dataKey="collectionRevenue" 
                            name="Tahsilat" 
                            stroke="#10b981" 
                            fillOpacity={1} 
                            fill="url(#colorCollection)" 
                            strokeWidth={2} 
                        />
                    </AreaChart>
                </ResponsiveContainer>
            </CardContent>
        </Card>
    );
};
