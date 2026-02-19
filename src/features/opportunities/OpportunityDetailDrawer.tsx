
import React, { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { OpportunityService } from '../../services/OpportunityService';
import { X, User, FileText, Info, Loader2, Calendar, DollarSign, Briefcase } from 'lucide-react';
import type { Contact, OpportunityNote } from '../../types/crm';

interface OpportunityDetailDrawerProps {
    opportunityId: string;
    onClose: () => void;
}

type Tab = 'overview' | 'contacts' | 'notes';

export const OpportunityDetailDrawer: React.FC<OpportunityDetailDrawerProps> = ({ opportunityId, onClose }) => {
    const [activeTab, setActiveTab] = useState<Tab>('overview');

    // 1. Fetch Main Details
    const { data: opportunity, isLoading: isLoadingDetails } = useQuery({
        queryKey: ['opportunity', opportunityId],
        queryFn: () => OpportunityService.getById(opportunityId),
        enabled: !!opportunityId
    });

    // 2. Fetch Contacts (Lazy: Only when tab is contacts)
    const { data: contacts, isLoading: isLoadingContacts } = useQuery({
        queryKey: ['opportunity', opportunityId, 'contacts'],
        queryFn: () => OpportunityService.getContacts(opportunityId),
        enabled: activeTab === 'contacts' && !!opportunityId
    });

    // 3. Fetch Notes (Lazy: Only when tab is notes)
    const { data: notes, isLoading: isLoadingNotes } = useQuery({
        queryKey: ['opportunity', opportunityId, 'notes'],
        queryFn: () => OpportunityService.getNotes(opportunityId),
        enabled: activeTab === 'notes' && !!opportunityId
    });

    if (!opportunityId) return null;

    return (
        <div className="fixed inset-0 z-50 flex justify-end">
            {/* Backdrop */}
            <div
                className="absolute inset-0 bg-slate-900/20 backdrop-blur-sm transition-opacity"
                onClick={onClose}
            />

            {/* Drawer Panel */}
            <div className="relative w-full max-w-2xl bg-white h-full shadow-2xl flex flex-col transform transition-transform duration-300">

                {/* Header */}
                <div className="px-6 py-4 border-b border-slate-200 flex justify-between items-start bg-slate-50">
                    <div>
                        {isLoadingDetails ? (
                            <div className="h-8 w-48 bg-slate-200 animate-pulse rounded mb-2"></div>
                        ) : (
                            <>
                                <h2 className="text-xl font-bold text-slate-900">{opportunity?.title}</h2>
                                <p className="text-sm text-slate-500">{opportunity?.customerName}</p>
                            </>
                        )}
                    </div>
                    <button
                        onClick={onClose}
                        className="p-2 hover:bg-slate-200 rounded-full text-slate-500 transition-colors"
                    >
                        <X size={20} />
                    </button>
                </div>

                {/* Tabs */}
                <div className="flex border-b border-slate-200 px-6">
                    <button
                        onClick={() => setActiveTab('overview')}
                        className={`py-3 px-4 text-sm font-medium border-b-2 transition-colors flex items-center gap-2 ${activeTab === 'overview'
                                ? 'border-indigo-600 text-indigo-600'
                                : 'border-transparent text-slate-500 hover:text-slate-700'
                            }`}
                    >
                        <Info size={16} /> Overview
                    </button>
                    <button
                        onClick={() => setActiveTab('contacts')}
                        className={`py-3 px-4 text-sm font-medium border-b-2 transition-colors flex items-center gap-2 ${activeTab === 'contacts'
                                ? 'border-indigo-600 text-indigo-600'
                                : 'border-transparent text-slate-500 hover:text-slate-700'
                            }`}
                    >
                        <User size={16} /> Contacts
                    </button>
                    <button
                        onClick={() => setActiveTab('notes')}
                        className={`py-3 px-4 text-sm font-medium border-b-2 transition-colors flex items-center gap-2 ${activeTab === 'notes'
                                ? 'border-indigo-600 text-indigo-600'
                                : 'border-transparent text-slate-500 hover:text-slate-700'
                            }`}
                    >
                        <FileText size={16} /> Notes
                    </button>
                </div>

                {/* Content */}
                <div className="flex-1 overflow-y-auto p-6">
                    {activeTab === 'overview' && (
                        <div className="space-y-6">
                            {isLoadingDetails ? (
                                <div className="flex justify-center p-8"><Loader2 className="animate-spin text-indigo-600" /></div>
                            ) : opportunity ? (
                                <>
                                    <div className="grid grid-cols-2 gap-6">
                                        <div className="bg-slate-50 p-4 rounded-lg">
                                            <label className="text-xs font-semibold text-slate-500 uppercase tracking-wider block mb-1">Value</label>
                                            <div className="flex items-center gap-2 text-lg font-medium text-slate-900">
                                                <DollarSign size={18} className="text-green-600" />
                                                {new Intl.NumberFormat('tr-TR', { style: 'currency', currency: opportunity.currency }).format(opportunity.value)}
                                            </div>
                                        </div>
                                        <div className="bg-slate-50 p-4 rounded-lg">
                                            <label className="text-xs font-semibold text-slate-500 uppercase tracking-wider block mb-1">Stage</label>
                                            <div className="flex items-center gap-2 text-lg font-medium text-slate-900">
                                                <Briefcase size={18} className="text-blue-600" />
                                                {opportunity.stage}
                                            </div>
                                        </div>
                                        <div className="bg-slate-50 p-4 rounded-lg">
                                            <label className="text-xs font-semibold text-slate-500 uppercase tracking-wider block mb-1">Expected Close</label>
                                            <div className="flex items-center gap-2 text-lg font-medium text-slate-900">
                                                <Calendar size={18} className="text-orange-600" />
                                                {new Date(opportunity.expectedCloseDate).toLocaleDateString('tr-TR')}
                                            </div>
                                        </div>
                                        <div className="bg-slate-50 p-4 rounded-lg">
                                            <label className="text-xs font-semibold text-slate-500 uppercase tracking-wider block mb-1">Probability</label>
                                            <div className="text-lg font-medium text-slate-900">
                                                {opportunity.probability}%
                                            </div>
                                        </div>
                                    </div>

                                    <div>
                                        <h3 className="text-sm font-semibold text-slate-900 mb-2">Description / Notes</h3>
                                        <div className="bg-slate-50 p-4 rounded-lg text-slate-600 min-h-[100px]">
                                            {opportunity.notes || 'No description provided.'}
                                        </div>
                                    </div>
                                </>
                            ) : null}
                        </div>
                    )}

                    {activeTab === 'contacts' && (
                        <div className="space-y-4">
                            {isLoadingContacts ? (
                                <div className="flex justify-center p-8"><Loader2 className="animate-spin text-indigo-600" /></div>
                            ) : contacts && contacts.length > 0 ? (
                                contacts.map((contact: Contact) => (
                                    <div key={contact.id} className="flex items-center p-4 bg-white border border-slate-200 rounded-lg hover:shadow-sm transition-shadow">
                                        <div className="w-10 h-10 bg-indigo-100 text-indigo-600 rounded-full flex items-center justify-center font-bold mr-4">
                                            {contact.name.charAt(0)}
                                        </div>
                                        <div>
                                            <h4 className="font-medium text-slate-900">{contact.name}</h4>
                                            <p className="text-sm text-slate-500">{contact.role}</p>
                                        </div>
                                        <div className="ml-auto text-right text-sm text-slate-500">
                                            <div>{contact.email}</div>
                                            <div>{contact.phone}</div>
                                        </div>
                                    </div>
                                ))
                            ) : (
                                <div className="text-center py-12 text-slate-500 bg-slate-50 rounded-lg border border-dashed border-slate-300">
                                    <User className="mx-auto mb-2 text-slate-400" size={32} />
                                    <p>No contacts found for this opportunity.</p>
                                </div>
                            )}
                        </div>
                    )}

                    {activeTab === 'notes' && (
                        <div className="space-y-4">
                            {isLoadingNotes ? (
                                <div className="flex justify-center p-8"><Loader2 className="animate-spin text-indigo-600" /></div>
                            ) : notes && notes.length > 0 ? (
                                notes.map((note: OpportunityNote) => (
                                    <div key={note.id} className="p-4 bg-yellow-50 border border-yellow-100 rounded-lg">
                                        <p className="text-slate-800 mb-2">{note.content}</p>
                                        <div className="flex justify-between items-center text-xs text-slate-500">
                                            <span>Added by {note.createdBy}</span>
                                            <span>{new Date(note.createdAt).toLocaleString('tr-TR')}</span>
                                        </div>
                                    </div>
                                ))
                            ) : (
                                <div className="text-center py-12 text-slate-500 bg-slate-50 rounded-lg border border-dashed border-slate-300">
                                    <FileText className="mx-auto mb-2 text-slate-400" size={32} />
                                    <p>No notes found for this opportunity.</p>
                                </div>
                            )}
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
};
