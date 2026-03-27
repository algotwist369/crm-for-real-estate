/**
 * Static currency conversion rates.
 * Base: INR (₹)
 */
const EXCHANGE_RATES = {
    '₹': 1,
    'INR': 1,
    '$': 83,
    'USD': 83,
    'AED': 22.6,
    'EUR': 90,
    'GBP': 105,
    'JPY': 0.55
};

/**
 * Converts a value from a source currency to a target currency.
 */
function convertCurrency(value, fromCurrency, toCurrency = 'INR') {
    if (!value) return 0;
    
    const fromRate = EXCHANGE_RATES[fromCurrency] || EXCHANGE_RATES[String(fromCurrency).toUpperCase()] || 1;
    const toRate = EXCHANGE_RATES[toCurrency] || EXCHANGE_RATES[String(toCurrency).toUpperCase()] || 1;
    
    // Convert to INR first, then to target
    const valueInBase = value * fromRate;
    return valueInBase / toRate;
}

/**
 * Returns a human-readable formatted string for a value in a given currency.
 */
function formatCurrency(value, currency = 'INR') {
    if (currency === 'INR' || currency === '₹') {
        if (value >= 10000000) return `₹${(value / 10000000).toFixed(2)} Cr`;
        if (value >= 100000) return `₹${(value / 100000).toFixed(2)} L`;
        return `₹${Math.round(value).toLocaleString('en-IN')}`;
    }
    
    return `${currency} ${Math.round(value).toLocaleString()}`;
}

module.exports = { 
    convertCurrency, 
    formatCurrency,
    EXCHANGE_RATES 
};
