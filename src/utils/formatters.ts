
export const formatCurrency = (amount: number, currency: string = 'TL'): string => {
    return new Intl.NumberFormat('tr-TR', {
        style: 'currency',
        currency: currency === 'TL' ? 'TRY' : currency,
        minimumFractionDigits: 0,
        maximumFractionDigits: 0,
    }).format(amount);
};

export const formatDate = (dateString: string): string => {
    return new Intl.DateTimeFormat('tr-TR', {
        day: 'numeric',
        month: 'short',
        year: 'numeric'
    }).format(new Date(dateString));
};
