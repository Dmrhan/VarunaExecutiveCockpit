import React, { useState, useRef, useEffect } from 'react';
import { Check, ChevronDown, X } from 'lucide-react';
import { cn } from '../../lib/utils';
import { useTranslation } from 'react-i18next';

export interface MultiSelectOption {
    label: string;
    value: string;
}

export interface MultiSelectProps {
    options: MultiSelectOption[];
    selectedValues: string[];
    onChange: (values: string[]) => void;
    placeholder?: string;
    icon?: React.ReactNode;
    className?: string;
    allLabel?: string;
}

export function MultiSelect({ options, selectedValues, onChange, placeholder, icon, className, allLabel = 'Tümü' }: MultiSelectProps) {
    const { t } = useTranslation();
    const [isOpen, setIsOpen] = useState(false);
    const containerRef = useRef<HTMLDivElement>(null);

    // Kapanma kontrolü (Outside click)
    useEffect(() => {
        const handleOutsideClick = (event: MouseEvent) => {
            if (containerRef.current && !containerRef.current.contains(event.target as Node)) {
                setIsOpen(false);
            }
        };
        document.addEventListener('mousedown', handleOutsideClick);
        return () => document.removeEventListener('mousedown', handleOutsideClick);
    }, []);

    const toggleOption = (value: string) => {
        if (value === 'all') {
            onChange(['all']);
            return;
        }

        let newSelected = [...selectedValues];

        // Eğer 'all' seçiliyse ve başka bir şey seçildiyse, 'all'u çıkar
        if (newSelected.includes('all')) {
            newSelected = [value];
        }
        // Zaten seçiliyse, listeden çıkar
        else if (newSelected.includes(value)) {
            newSelected = newSelected.filter(v => v !== value);
            // Hiçbir şey kalmadıysa 'all'a dön
            if (newSelected.length === 0) {
                newSelected = ['all'];
            }
        }
        // Yeni seçim ekle
        else {
            newSelected.push(value);
        }

        onChange(newSelected);
    };

    const isAllSelected = selectedValues.length === 0 || selectedValues.includes('all');

    // Gösterilecek Metin
    const getDisplayText = () => {
        if (isAllSelected) return allLabel;
        if (selectedValues.length === 1) {
            return options.find(o => o.value === selectedValues[0])?.label || allLabel;
        }
        return t('common.selectedCount', { count: selectedValues.length, defaultValue: `${selectedValues.length} Seçildi` });
    };

    return (
        <div className={cn("relative min-w-[170px]", className)} ref={containerRef}>
            <button
                type="button"
                onClick={() => setIsOpen(!isOpen)}
                className={cn(
                    "w-full flex items-center justify-between gap-2 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-200 font-medium rounded-xl px-4 py-2.5 shadow-sm transition-all focus:outline-none focus:ring-2 focus:ring-indigo-500/50",
                    isOpen ? "ring-2 ring-indigo-500/50 border-indigo-300 dark:border-indigo-600" : "hover:border-slate-300 dark:hover:border-slate-600"
                )}
            >
                <div className="flex items-center gap-2 truncate">
                    {icon && <span className="text-slate-400">{icon}</span>}
                    <span className="truncate">{getDisplayText()}</span>
                </div>
                <ChevronDown size={16} className={cn("text-slate-400 transition-transform duration-200", isOpen && "rotate-180")} />
            </button>

            {isOpen && (
                <div className="absolute z-50 top-full left-0 mt-1.5 w-full min-w-[200px] bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 shadow-xl rounded-xl py-1 transform origin-top animate-in fade-in slide-in-from-top-2">
                    <div className="max-h-60 overflow-y-auto p-1 custom-scrollbar">
                        {/* Tümünü Seç Opsiyonu */}
                        <button
                            onClick={() => toggleOption('all')}
                            className="w-full flex items-center gap-2 px-3 py-2 text-sm text-left rounded-lg transition-colors hover:bg-slate-50 dark:hover:bg-slate-700/50"
                        >
                            <div className={cn(
                                "flex items-center justify-center w-4 h-4 rounded border transition-colors",
                                isAllSelected
                                    ? "bg-indigo-500 border-indigo-500 text-white"
                                    : "border-slate-300 dark:border-slate-600 bg-transparent"
                            )}>
                                {isAllSelected && <Check size={12} strokeWidth={3} />}
                            </div>
                            <span className={cn("font-medium", isAllSelected ? "text-slate-900 dark:text-white" : "text-slate-600 dark:text-slate-300")}>
                                {allLabel}
                            </span>
                        </button>

                        <div className="h-px bg-slate-100 dark:bg-slate-700/50 my-1 mx-2"></div>

                        {/* Diğer Opsiyonlar */}
                        {options.map((option) => {
                            const isSelected = !isAllSelected && selectedValues.includes(option.value);
                            return (
                                <button
                                    key={option.value}
                                    onClick={() => toggleOption(option.value)}
                                    className="w-full flex items-center gap-2 px-3 py-2 text-sm text-left rounded-lg transition-colors hover:bg-slate-50 dark:hover:bg-slate-700/50"
                                >
                                    <div className={cn(
                                        "flex items-center justify-center w-4 h-4 rounded border transition-colors",
                                        isSelected
                                            ? "bg-indigo-500 border-indigo-500 text-white"
                                            : "border-slate-300 dark:border-slate-600 bg-transparent"
                                    )}>
                                        {isSelected && <Check size={12} strokeWidth={3} />}
                                    </div>
                                    <span className={cn("truncate", isSelected ? "text-slate-900 dark:text-white font-medium" : "text-slate-600 dark:text-slate-300")}>
                                        {option.label}
                                    </span>
                                </button>
                            );
                        })}
                    </div>
                </div>
            )}
        </div>
    );
}
