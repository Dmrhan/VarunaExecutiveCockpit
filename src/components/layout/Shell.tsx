import React from 'react';
import { Sidebar } from './Sidebar';
import { Header } from './Header';

interface ShellProps {
    children: React.ReactNode;
    activeView: string;
    onViewChange: (view: string) => void;
}

export function Shell({ children, activeView, onViewChange }: ShellProps) {
    return (
        <div className="flex min-h-screen bg-slate-50 dark:bg-slate-950 font-sans">
            <Sidebar activeView={activeView} onViewChange={onViewChange} />
            <div className="flex-1 flex flex-col min-w-0">
                <Header />
                <main className="flex-1 p-8 overflow-y-auto">
                    {children}
                </main>
            </div>
        </div>
    );
}
