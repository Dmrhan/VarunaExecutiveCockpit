import React from 'react';
import { useTranslation } from 'react-i18next';
import { Card, CardHeader, CardTitle, CardContent } from '../ui/Card';
import { formatCurrency, formatDate } from '../../utils/formatters';
import type { PaymentInstallment } from '../../types/crm';
import { CheckCircle, Clock, AlertCircle } from 'lucide-react';

interface PaymentPlanTableProps {
    installments: PaymentInstallment[];
}

export const PaymentPlanTable = ({ installments }: PaymentPlanTableProps) => {
    const { t } = useTranslation();

    const getStatusBadge = (status: PaymentInstallment['status']) => {
        switch (status) {
            case 'Collected':
                return (
                    <span className="inline-flex items-center px-2 py-1 rounded-md bg-emerald-50 dark:bg-emerald-900/20 text-emerald-700 dark:text-emerald-400 text-xs font-medium border border-emerald-100 dark:border-emerald-800">
                        <CheckCircle size={12} className="mr-1" />
                        {t('status.Collected')}
                    </span>
                );
            case 'Overdue':
                return (
                    <span className="inline-flex items-center px-2 py-1 rounded-md bg-red-50 dark:bg-red-900/20 text-red-700 dark:text-red-400 text-xs font-medium border border-red-100 dark:border-red-800">
                        <AlertCircle size={12} className="mr-1" />
                        {t('status.Overdue')}
                    </span>
                );
            default:
                return (
                    <span className="inline-flex items-center px-2 py-1 rounded-md bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 text-xs font-medium border border-slate-200 dark:border-slate-700">
                        <Clock size={12} className="mr-1" />
                        {t('status.Pending')}
                    </span>
                );
        }
    };

    return (
        <Card className="bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 h-full">
            <CardHeader className="py-4 border-b border-slate-100 dark:border-white/5">
                <CardTitle className="text-sm font-bold text-slate-800 dark:text-slate-200 uppercase tracking-wider">
                    {t('contracts.paymentPlan.title')}
                </CardTitle>
            </CardHeader>
            <CardContent className="p-0 overflow-auto max-h-[400px]">
                <table className="w-full text-left text-xs">
                    <thead className="bg-slate-50 dark:bg-slate-700/50 sticky top-0 z-10 border-b border-slate-200 dark:border-white/5">
                        <tr>
                            <th className="px-4 py-3 font-medium text-slate-500 uppercase tracking-wider">{t('contracts.paymentPlan.date')}</th>
                            <th className="px-4 py-3 font-medium text-slate-500 uppercase tracking-wider">{t('contracts.paymentPlan.amount')}</th>
                            <th className="px-4 py-3 font-medium text-slate-500 uppercase tracking-wider">{t('contracts.paymentPlan.status')}</th>
                            <th className="px-4 py-3 font-medium text-slate-500 uppercase tracking-wider text-right">{t('contracts.paymentPlan.invoice')}</th>
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100 dark:divide-slate-700">
                        {installments.map((installment) => (
                            <tr key={installment.id} className="hover:bg-slate-50 dark:hover:bg-slate-800/40 transition-colors">
                                <td className="px-4 py-3 font-mono text-slate-600 dark:text-slate-300">
                                    {formatDate(installment.date)}
                                </td>
                                <td className="px-4 py-3 font-mono font-semibold text-slate-800 dark:text-slate-200">
                                    {formatCurrency(installment.amount, installment.currency)}
                                </td>
                                <td className="px-4 py-3">
                                    {getStatusBadge(installment.status)}
                                </td>
                                <td className="px-4 py-3 text-right text-slate-500">
                                    {installment.invoiceNumber || '-'}
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </CardContent>
        </Card>
    );
};
