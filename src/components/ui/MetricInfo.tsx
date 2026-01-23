import { Info } from 'lucide-react';

interface MetricInfoProps {
    description: string;
    formula: string;
}

export function MetricInfo({ description, formula }: MetricInfoProps) {
    return (
        <div className="group relative inline-flex items-center ml-2 cursor-help">
            <Info size={14} className="text-slate-400 hover:text-indigo-500 transition-colors" />
            <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 w-64 p-3 bg-slate-900 text-white text-xs rounded-xl shadow-xl opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all duration-200 z-50 pointer-events-none">
                <div className="font-semibold mb-1 text-slate-200">Logic</div>
                <p className="mb-2 text-slate-300 leading-relaxed">{description}</p>
                <div className="font-semibold mb-1 text-slate-200">Formula</div>
                <code className="block bg-slate-800 p-1.5 rounded text-indigo-300 font-mono text-[10px]">
                    {formula}
                </code>
                <div className="absolute bottom-[-6px] left-1/2 -translate-x-1/2 w-3 h-3 bg-slate-900 rotate-45" />
            </div>
        </div>
    );
}
