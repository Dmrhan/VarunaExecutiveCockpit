
import React, { useState } from 'react';
import { ArrowLeft, Save, Calendar as CalendarIcon, DollarSign, Building2, Package, TrendingUp } from 'lucide-react';
import { OpportunityService } from '../../services/OpportunityService';
import { PRODUCTS, CORPORATE_CUSTOMERS, STAGES } from '../../data/mockData';
import { useData } from '../../context/DataContext';

interface OpportunityFormProps {
    onClose: () => void;
}

export const OpportunityForm: React.FC<OpportunityFormProps> = ({ onClose }) => {
    const { refreshData, users } = useData();
    const [isSubmitting, setIsSubmitting] = useState(false);

    // Form State
    const [formData, setFormData] = useState({
        title: '',
        customerName: '',
        product: '',
        value: '',
        stage: 'Lead',
        probability: '20',
        expectedCloseDate: '',
        ownerId: users[0]?.id || '', // Default to first user found
        notes: ''
    });

    const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
        const { name, value } = e.target;
        setFormData(prev => ({ ...prev, [name]: value }));
    };

    const calculateWeightedValue = () => {
        const val = parseFloat(formData.value) || 0;
        const prob = parseFloat(formData.probability) || 0;
        return (val * prob) / 100;
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setIsSubmitting(true);

        try {
            await OpportunityService.create({
                title: formData.title,
                customerName: formData.customerName,
                product: formData.product as any,
                value: parseFloat(formData.value),
                stage: formData.stage as any,
                probability: parseFloat(formData.probability),
                ownerId: formData.ownerId,
                source: 'Univera Satış', // Default for manual entry
                topic: `${formData.product} - ${formData.title}`,
                expectedCloseDate: new Date(formData.expectedCloseDate).toISOString(),
                currency: 'TRY', // Default currency
                weightedValue: calculateWeightedValue(),
                notes: formData.notes,
            });

            // Refresh global data context to show new item in list
            refreshData();
            onClose();

        } catch (error) {
            console.error('Error creating opportunity:', error);
            alert('Failed to create opportunity. Please try again.');
        } finally {
            setIsSubmitting(false);
        }
    };

    return (
        <div className="bg-white dark:bg-slate-900 h-full flex flex-col animate-in fade-in slide-in-from-bottom-4 duration-300">
            {/* Header */}
            <div className="flex items-center justify-between px-8 py-6 border-b border-slate-200 dark:border-slate-800">
                <div className="flex items-center gap-4">
                    <button
                        onClick={onClose}
                        className="p-2 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-full transition-colors"
                    >
                        <ArrowLeft className="w-6 h-6 text-slate-500" />
                    </button>
                    <div>
                        <h1 className="text-2xl font-bold text-slate-900 dark:text-white">Yeni Fırsat Ekle</h1>
                        <p className="text-sm text-slate-500 dark:text-slate-400">Yeni bir satış fırsatı oluşturun ve takip edin</p>
                    </div>
                </div>
                <div className="flex items-center gap-3">
                    <button
                        type="button"
                        onClick={onClose}
                        className="px-4 py-2 text-sm font-medium text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-lg transition-colors"
                    >
                        İptal
                    </button>
                    <button
                        onClick={handleSubmit}
                        disabled={isSubmitting || !formData.title || !formData.customerName}
                        className="flex items-center gap-2 px-4 py-2 text-sm font-medium text-white bg-indigo-600 hover:bg-indigo-700 rounded-lg shadow-sm transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                        <Save className="w-4 h-4" />
                        {isSubmitting ? 'Kaydediliyor...' : 'Kaydet'}
                    </button>
                </div>
            </div>

            {/* Form Content */}
            <div className="flex-1 overflow-y-auto p-8">
                <div className="max-w-4xl mx-auto space-y-8">

                    {/* General Info Section */}
                    <div className="bg-slate-50 dark:bg-slate-800/50 p-6 rounded-xl border border-slate-200 dark:border-slate-800">
                        <h2 className="text-lg font-semibold text-slate-900 dark:text-white mb-4 flex items-center gap-2">
                            <Building2 className="w-5 h-5 text-indigo-500" />
                            Genel Bilgiler
                        </h2>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">

                            <div className="space-y-2">
                                <label className="text-sm font-medium text-slate-700 dark:text-slate-300">Fırsat Başlığı *</label>
                                <input
                                    type="text"
                                    name="title"
                                    value={formData.title}
                                    onChange={handleChange}
                                    placeholder="Örn: Yıllık Lisans Yenileme"
                                    className="w-full px-4 py-2.5 rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 text-slate-900 dark:text-white focus:ring-2 focus:ring-indigo-500 focus:border-transparent outline-none transition-all"
                                />
                            </div>

                            <div className="space-y-2">
                                <label className="text-sm font-medium text-slate-700 dark:text-slate-300">Müşteri *</label>
                                <div className="relative">
                                    <select
                                        name="customerName"
                                        value={formData.customerName}
                                        onChange={handleChange}
                                        className="w-full px-4 py-2.5 rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 text-slate-900 dark:text-white focus:ring-2 focus:ring-indigo-500 focus:border-transparent outline-none transition-all appearance-none"
                                    >
                                        <option value="">Seçiniz...</option>
                                        {CORPORATE_CUSTOMERS.map((customer) => (
                                            <option key={customer} value={customer}>{customer}</option>
                                        ))}
                                    </select>
                                    <div className="absolute right-4 top-3 pointer-events-none text-slate-500">
                                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 9l-7 7-7-7"></path></svg>
                                    </div>
                                </div>
                            </div>

                            <div className="space-y-2">
                                <label className="text-sm font-medium text-slate-700 dark:text-slate-300">Ürün / Çözüm</label>
                                <div className="relative">
                                    <select
                                        name="product"
                                        value={formData.product}
                                        onChange={handleChange}
                                        className="w-full px-4 py-2.5 rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 text-slate-900 dark:text-white focus:ring-2 focus:ring-indigo-500 focus:border-transparent outline-none transition-all appearance-none"
                                    >
                                        <option value="">Seçiniz...</option>
                                        {PRODUCTS.map((prod) => (
                                            <option key={prod} value={prod}>{prod}</option>
                                        ))}
                                    </select>
                                    <div className="absolute right-4 top-3 pointer-events-none text-slate-500">
                                        <Package className="w-4 h-4" />
                                    </div>
                                </div>
                            </div>

                            <div className="space-y-2">
                                <label className="text-sm font-medium text-slate-700 dark:text-slate-300">Satış Temsilcisi</label>
                                <div className="relative">
                                    <select
                                        name="ownerId"
                                        value={formData.ownerId}
                                        onChange={handleChange}
                                        className="w-full px-4 py-2.5 rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 text-slate-900 dark:text-white focus:ring-2 focus:ring-indigo-500 focus:border-transparent outline-none transition-all appearance-none"
                                    >
                                        {users.map((user) => (
                                            <option key={user.id} value={user.id}>{user.name} ({user.role})</option>
                                        ))}
                                    </select>
                                    <div className="absolute right-4 top-3 pointer-events-none text-slate-500">
                                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 9l-7 7-7-7"></path></svg>
                                    </div>
                                </div>
                            </div>

                        </div>
                    </div>

                    {/* Financials Section */}
                    <div className="bg-slate-50 dark:bg-slate-800/50 p-6 rounded-xl border border-slate-200 dark:border-slate-800">
                        <h2 className="text-lg font-semibold text-slate-900 dark:text-white mb-4 flex items-center gap-2">
                            <TrendingUp className="w-5 h-5 text-emerald-500" />
                            Finansal Detaylar & Öngörü
                        </h2>
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">

                            <div className="space-y-2">
                                <label className="text-sm font-medium text-slate-700 dark:text-slate-300">Beklenen Tutar (₺)</label>
                                <div className="relative">
                                    <input
                                        type="number"
                                        name="value"
                                        value={formData.value}
                                        onChange={handleChange}
                                        placeholder="0.00"
                                        className="w-full px-4 py-2.5 pl-10 rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 text-slate-900 dark:text-white focus:ring-2 focus:ring-emerald-500 focus:border-transparent outline-none transition-all"
                                    />
                                    <div className="absolute left-3 top-3 pointer-events-none text-slate-500">
                                        <DollarSign className="w-4 h-4" />
                                    </div>
                                </div>
                            </div>

                            <div className="space-y-2">
                                <label className="text-sm font-medium text-slate-700 dark:text-slate-300">Aşama</label>
                                <div className="relative">
                                    <select
                                        name="stage"
                                        value={formData.stage}
                                        onChange={handleChange}
                                        className="w-full px-4 py-2.5 rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 text-slate-900 dark:text-white focus:ring-2 focus:ring-emerald-500 focus:border-transparent outline-none transition-all appearance-none"
                                    >
                                        {STAGES.map((stage) => (
                                            <option key={stage} value={stage}>{stage}</option>
                                        ))}
                                    </select>
                                    <div className="absolute right-4 top-3 pointer-events-none text-slate-500">
                                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 9l-7 7-7-7"></path></svg>
                                    </div>
                                </div>
                            </div>

                            <div className="space-y-2">
                                <label className="text-sm font-medium text-slate-700 dark:text-slate-300">Olasılık (%)</label>
                                <input
                                    type="number"
                                    min="0"
                                    max="100"
                                    name="probability"
                                    value={formData.probability}
                                    onChange={handleChange}
                                    className="w-full px-4 py-2.5 rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 text-slate-900 dark:text-white focus:ring-2 focus:ring-emerald-500 focus:border-transparent outline-none transition-all"
                                />
                            </div>

                            <div className="space-y-2">
                                <label className="text-sm font-medium text-slate-700 dark:text-slate-300">Tahmini Kapanış Tarihi</label>
                                <div className="relative">
                                    <input
                                        type="date"
                                        name="expectedCloseDate"
                                        value={formData.expectedCloseDate}
                                        onChange={handleChange}
                                        className="w-full px-4 py-2.5 pl-10 rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 text-slate-900 dark:text-white focus:ring-2 focus:ring-emerald-500 focus:border-transparent outline-none transition-all"
                                    />
                                    <div className="absolute left-3 top-3 pointer-events-none text-slate-500">
                                        <CalendarIcon className="w-4 h-4" />
                                    </div>
                                </div>
                            </div>

                            <div className="space-y-2 col-span-2">
                                <label className="text-sm font-medium text-slate-700 dark:text-slate-300">Notlar</label>
                                <textarea
                                    name="notes"
                                    rows={3}
                                    value={formData.notes}
                                    onChange={handleChange}
                                    placeholder="Fırsat ile ilgili ek notlar..."
                                    className="w-full px-4 py-2.5 rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 text-slate-900 dark:text-white focus:ring-2 focus:ring-indigo-500 focus:border-transparent outline-none transition-all"
                                />
                            </div>

                        </div>
                    </div>

                    <div className="flex justify-end pt-4">
                        <div className="text-sm text-slate-500 dark:text-slate-400">
                            * Zorunlu alanlar
                        </div>
                    </div>

                </div>
            </div>
        </div>
    );
};
