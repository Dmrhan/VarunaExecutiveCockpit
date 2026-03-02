
export const formatCurrency = (amount: number, currency: string | number = 'TRY'): string => {
    // Handle numeric codes (e.g., 949 for TRY)
    let currencyCode = String(currency);
    if (currencyCode === '949' || currencyCode === 'TL') {
        currencyCode = 'TRY';
    }

    try {
        return new Intl.NumberFormat('tr-TR', {
            style: 'currency',
            currency: currencyCode,
            minimumFractionDigits: 0,
            maximumFractionDigits: 0,
        }).format(amount);
    } catch (e) {
        console.warn(`Invalid currency code: ${currencyCode}, falling back to TRY`);
        return new Intl.NumberFormat('tr-TR', {
            style: 'currency',
            currency: 'TRY',
            minimumFractionDigits: 0,
            maximumFractionDigits: 0,
        }).format(amount);
    }
};

export const formatDate = (dateString: string): string => {
    return new Intl.DateTimeFormat('tr-TR', {
        day: 'numeric',
        month: 'short',
        year: 'numeric'
    }).format(new Date(dateString));
};
