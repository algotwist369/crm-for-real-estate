import React from "react";

export const PremiumTabs = ({ 
    label, 
    options, 
    value, 
    onChange, 
    variant = "blue", // blue, indigo, priority
    showLabel = true
}) => {
    const getActiveStyles = (opt) => {
        if (value !== opt) return "text-zinc-500 hover:text-zinc-300";
        
        switch (variant) {
            case "indigo":
                return "bg-indigo-600 text-white shadow-lg";
            case "priority":
                if (opt === "High") return "bg-red-500 text-white shadow-lg shadow-red-500/20";
                if (opt === "Medium") return "bg-yellow-500 text-black shadow-lg shadow-yellow-500/20";
                return "bg-blue-600 text-white shadow-lg shadow-blue-600/20";
            default: // blue
                return "bg-blue-600 text-white shadow-[0_0_20px_rgba(37,99,235,0.4)] scale-[1.02]";
        }
    };

    return (
        <div className="w-full">
            {label && showLabel && (
                <label className="text-xs font-bold text-zinc-500 uppercase tracking-widest mb-2 block text-center">
                    {label}
                </label>
            )}
            <div className="flex bg-zinc-900/50 p-1 rounded-xl border border-zinc-800 backdrop-blur-sm overflow-x-auto scrollbar-hide">
                {options.map((option) => (
                    <button
                        key={option}
                        type="button"
                        onClick={() => onChange(option)}
                        className={`flex-1 min-w-fit flex-shrink-0 py-1.5 px-3 text-[10px] font-bold uppercase tracking-wider rounded-lg transition-all duration-300 ${getActiveStyles(option)}`}
                    >
                        {option}
                    </button>
                ))}
            </div>
        </div>
    );
};
