import React from "react";

export const PremiumToggle = ({
    label,
    description,
    enabled,
    checked,
    onChange,
    icon
}) => {
    const isEnabled = enabled !== undefined ? enabled : checked;

    return (
        <div className="flex items-center justify-between w-full">
            <div className="flex items-center gap-3">
                {icon && <div className="text-zinc-400">{icon}</div>}
                <div className="flex flex-col">
                    {label && (
                        <span className="text-sm font-medium text-zinc-300">
                            {label}
                        </span>
                    )}
                    {description && (
                        <span className="text-[10px] text-zinc-500 uppercase tracking-wider">
                            {description}
                        </span>
                    )}
                </div>
            </div>

            <button
                type="button"
                onClick={() => onChange(!isEnabled)}
                className={`relative w-10 h-5 flex items-center rounded-full border px-0.5 transition-all duration-300
                ${isEnabled ? "bg-yellow-600 border-yellow-600 shadow-[0_0_10px_rgba(202,138,4,0.2)]" : "bg-zinc-950 border-zinc-800"}`}
            >
                <div
                    className={`w-3.5 h-3.5 rounded-full transition-all duration-300 transform
                    ${isEnabled ? "translate-x-5 bg-white shadow-sm" : "translate-x-0 bg-zinc-700"}`}
                />
            </button>
        </div>
    );
};