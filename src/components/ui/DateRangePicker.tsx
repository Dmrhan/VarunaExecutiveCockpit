import { useState, useMemo } from 'react';
import { ChevronLeft, ChevronRight, X } from 'lucide-react';
import { cn } from '../../lib/utils';

interface DateRangePickerProps {
    startDate: Date | null;
    endDate: Date | null;
    onChange: (start: Date | null, end: Date | null) => void;
    onClose: () => void;
}

export function DateRangePicker({ startDate, endDate, onChange, onClose }: DateRangePickerProps) {
    const [viewDate, setViewDate] = useState(new Date());
    const [hoverDate, setHoverDate] = useState<Date | null>(null);

    const secondMonthDate = useMemo(() => {
        const d = new Date(viewDate.getFullYear(), viewDate.getMonth() + 1, 1);
        return d;
    }, [viewDate]);

    const handleDateClick = (date: Date) => {
        if (!startDate || (startDate && endDate)) {
            onChange(date, null);
        } else if (startDate && !endDate) {
            if (date < startDate) {
                onChange(date, startDate);
            } else {
                onChange(startDate, date);
            }
        }
    };

    const isSelected = (date: Date) => {
        return (startDate && date.getTime() === startDate.getTime()) ||
            (endDate && date.getTime() === endDate.getTime());
    };

    const isInRange = (date: Date) => {
        if (!startDate) return false;
        if (endDate) {
            return date > startDate && date < endDate;
        }
        if (hoverDate) {
            const start = startDate < hoverDate ? startDate : hoverDate;
            const end = startDate < hoverDate ? hoverDate : startDate;
            return date > start && date < end;
        }
        return false;
    };

    const renderCalendar = (baseDate: Date) => {
        const year = baseDate.getFullYear();
        const month = baseDate.getMonth();
        const firstDayOfMonth = new Date(year, month, 1).getDay();
        const daysInMonth = new Date(year, month + 1, 0).getDate();
        const monthName = baseDate.toLocaleString('tr-TR', { month: 'long', year: 'numeric' });

        const days = [];
        // Empty cells for first week
        const startDay = firstDayOfMonth === 0 ? 6 : firstDayOfMonth - 1; // Adjust for Monday start
        for (let i = 0; i < startDay; i++) {
            days.push(<div key={`empty-${i}`} className="h-9 w-9" />);
        }

        for (let d = 1; d <= daysInMonth; d++) {
            const date = new Date(year, month, d);
            const selected = isSelected(date);
            const inRange = isInRange(date);

            days.push(
                <button
                    key={d}
                    onClick={() => handleDateClick(date)}
                    onMouseEnter={() => setHoverDate(date)}
                    className={cn(
                        "h-9 w-9 text-xs rounded-lg transition-all relative flex items-center justify-center",
                        selected ? "bg-indigo-600 text-white font-bold shadow-lg shadow-indigo-500/40 z-10" :
                            inRange ? "bg-indigo-500/20 text-indigo-700 dark:text-indigo-200 rounded-none first:rounded-l-lg last:rounded-r-lg" :
                                "text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-white/10"
                    )}
                >
                    {d}
                </button>
            );
        }

        return (
            <div className="flex-1 min-w-[280px]">
                <div className="text-center text-sm font-medium text-slate-900 dark:text-white mb-4">{monthName}</div>
                <div className="grid grid-cols-7 gap-y-1 text-center">
                    {['Pt', 'Sa', 'Ça', 'Pe', 'Cu', 'Ct', 'Pz'].map(d => (
                        <div key={d} className="text-[10px] uppercase text-slate-500 dark:text-slate-500 font-bold mb-2">{d}</div>
                    ))}
                    {days}
                </div>
            </div>
        );
    };

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40 dark:bg-black/60 backdrop-blur-sm animate-in fade-in duration-300">
            <div className="bg-white dark:bg-[#0B0C15]/95 border border-slate-200 dark:border-white/10 rounded-3xl p-8 shadow-2xl max-w-4xl w-full relative animate-in zoom-in-95 duration-300">
                <button
                    onClick={onClose}
                    className="absolute top-6 right-6 p-2 rounded-full hover:bg-slate-100 dark:hover:bg-white/10 text-slate-400 transition-colors"
                >
                    <X size={20} />
                </button>

                <div className="mb-8">
                    <h2 className="text-2xl font-light text-slate-900 dark:text-white mb-1">Tarih Aralığı Seçin</h2>
                    <p className="text-slate-500 dark:text-slate-400 text-sm">Analiz etmek istediğiniz özel tarih aralığını belirleyin.</p>
                </div>

                <div className="flex flex-col lg:flex-row gap-12 relative pb-8">
                    <button
                        onClick={() => setViewDate(new Date(viewDate.getFullYear(), viewDate.getMonth() - 1, 1))}
                        className="absolute left-[-12px] top-[40px] p-2 rounded-full hover:bg-slate-100 dark:hover:bg-white/5 text-slate-400 transition-colors"
                    >
                        <ChevronLeft size={24} />
                    </button>

                    {renderCalendar(viewDate)}
                    {renderCalendar(secondMonthDate)}

                    <button
                        onClick={() => setViewDate(new Date(viewDate.getFullYear(), viewDate.getMonth() + 1, 1))}
                        className="absolute right-[-12px] top-[40px] p-2 rounded-full hover:bg-slate-100 dark:hover:bg-white/5 text-slate-400 transition-colors"
                    >
                        <ChevronRight size={24} />
                    </button>
                </div>

                <div className="flex items-center justify-between pt-8 border-t border-slate-100 dark:border-white/5">
                    <div className="flex items-center gap-4">
                        <div className="flex flex-col">
                            <span className="text-[10px] uppercase text-slate-500 font-bold">Başlangıç</span>
                            <span className="text-sm text-slate-900 dark:text-white font-mono">{startDate ? startDate.toLocaleDateString('tr-TR') : '---'}</span>
                        </div>
                        <div className="w-8 h-[1px] bg-slate-200 dark:bg-white/10" />
                        <div className="flex flex-col">
                            <span className="text-[10px] uppercase text-slate-500 font-bold">Bitiş</span>
                            <span className="text-sm text-slate-900 dark:text-white font-mono">{endDate ? endDate.toLocaleDateString('tr-TR') : '---'}</span>
                        </div>
                    </div>

                    <div className="flex gap-3">
                        <button
                            onClick={onClose}
                            className="px-6 py-2.5 rounded-xl text-sm font-medium text-slate-500 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white transition-colors"
                        >
                            Vazgeç
                        </button>
                        <button
                            disabled={!startDate || !endDate}
                            onClick={onClose}
                            className="px-8 py-2.5 bg-indigo-600 hover:bg-indigo-500 disabled:opacity-50 disabled:cursor-not-allowed rounded-xl text-sm font-bold text-white shadow-lg shadow-indigo-600/20 transition-all"
                        >
                            Uygula
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
}
