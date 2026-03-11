import React, { useMemo } from 'react';
import { Package } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { HorizontalBarChart } from '../../components/ui/HorizontalBarChart';
import type { Order, ProductGroup } from '../../types/crm';
import { PRODUCT_COLORS } from '../../data/mockData';

const formatCurrency = (value: number) => {
    if (value >= 1000000) return `${(value / 1000000).toFixed(1)}M₺`;
    if (value >= 1000) return `${(value / 1000).toFixed(0)}k₺`;
    return `${value}₺`;
};

interface ProductSalesDistributionProps {
    orders: Order[];
    selectedProduct?: string | null;
    onProductSelect?: (product: string | null) => void;
}

export function ProductSalesDistribution({ orders, selectedProduct, onProductSelect }: ProductSalesDistributionProps) {
    const { t } = useTranslation();

    const chartData = useMemo(() => {
        const closedOrders = orders.filter(o => o.status === 'Closed');
        const grouped = closedOrders.reduce((acc, order) => {
            if (!acc[order.product]) {
                acc[order.product] = { product: order.product, amount: 0, count: 0 };
            }
            acc[order.product].amount += order.amount;
            acc[order.product].count += 1;
            return acc;
        }, {} as Record<string, { product: ProductGroup; amount: number; count: number }>);

        return Object.values(grouped).sort((a, b) => b.amount - a.amount).map(item => ({
            id: item.product,
            name: item.product,
            value: item.amount,
            formattedValue: formatCurrency(item.amount),
            color: PRODUCT_COLORS[item.product] || '#64748b'
        }));
    }, [orders]);

    return (
        <div className="h-full">
            <HorizontalBarChart
                title={t('dashboardV2.productBalance.title')}
                data={chartData}
                color="#10b981"
                icon={Package}
                activeId={selectedProduct}
                onBarClick={(item) => onProductSelect && onProductSelect(selectedProduct === item.id ? null : item.id)}
            />
        </div>
    );
}

