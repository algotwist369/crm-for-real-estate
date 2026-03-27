/**
 * Parses budget strings like "₹20L - ₹50L", "$50k - $200k", "AED 500k" 
 * into numeric min and max values.
 */
function parseBudget(budgetString) {
    if (!budgetString || typeof budgetString !== 'string') return { min: 0, max: 0 };

    const clean = budgetString.replace(/,/g, '').toLowerCase();
    
    // Split range if present (e.g., " - " or "-")
    const parts = clean.split(/\s+-\s+|-\s+|\s+-|-/).map(p => p.trim());
    
    const parsePart = (part) => {
        if (!part) return 0;
        
        // Extract numeric part and suffix
        const matches = part.match(/([0-9.]+)\s*([a-z]+)?/);
        if (!matches) return 0;
        
        let val = parseFloat(matches[1]);
        const suffix = matches[2];
        
        if (suffix) {
            if (suffix === 'k') val *= 1000;
            else if (suffix === 'l' || suffix === 'lakh') val *= 100000;
            else if (suffix === 'cr' || suffix === 'crore') val *= 10000000;
            else if (suffix === 'm' || suffix === 'million') val *= 1000000;
        }
        
        return val;
    };

    const min = parsePart(parts[0]);
    const max = parts.length > 1 ? parsePart(parts[1]) : min;

    return { min, max };
}

module.exports = { parseBudget };
