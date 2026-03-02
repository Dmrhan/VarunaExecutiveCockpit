import React, { useMemo } from 'react';
import { Users } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { HorizontalBarChart } from '../../components/ui/HorizontalBarChart';
import type { Deal } from '../../types/crm';

const formatCurrency = (value: number) => {
    if (value >= 1000000) return `${(value / 1000000).toFixed(1)}M₺`;
    if (value >= 1000) return `${(value / 1000).toFixed(0)}k₺`;
    return `${value}₺`;
};

interface CustomerPotentialChartProps {
    deals: Deal[];
    selectedCustomer?: string | null;
    onCustomerSelect?: (customer: string | null) => void;
}

export function CustomerPotentialChart({ deals, selectedCustomer, onCustomerSelect }: CustomerPotentialChartProps) {
    const { t } = useTranslation();

    const chartData = useMemo(() => {
        // Only include open deals for "Potential"
        const openDeals = deals.filter(d => !['Won', 'Lost', 'Kazanıldı', 'Kaybedildi'].includes(d.stage));

        const grouped = openDeals.reduce((acc, deal) => {
            const customer = deal.customerName || 'Unknown';
            if (!acc[customer]) {
                acc[customer] = { customer, amount: 0, count: 0 };
            }
            acc[customer].amount += deal.value;
            acc[customer].count += 1;
            return acc;
        }, {} as Record<string, { customer: string; amount: number; count: number }>);

        return Object.values(grouped)
            .sort((a, b) => b.amount - a.amount)
            .slice(0, 8)
            .map(item => ({
                id: item.customer,
                name: item.customer,
                value: item.amount,
                formattedValue: formatCurrency(item.amount)
            }));
    }, [deals]);

    return (
        <div className="h-full">
            <HorizontalBarChart
                title={t('dashboardV2.customerPotential.title')}
                data={chartData}
                color="#8b5cf6"
                icon={Users}
                insight={t('dashboardV2.customerPotential.subtitle')}
                activeId={selectedCustomer}
                onBarClick={(item) => onCustomerSelect && onCustomerSelect(selectedCustomer === item.id ? null : item.id)}
            />
        </div>
    );
}

