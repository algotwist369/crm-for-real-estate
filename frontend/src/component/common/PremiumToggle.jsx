import React from "react";

export const PremiumToggle = ({
    label,
    enabled,
    onChange,
}) => {
    return (
        <div className="flex items-center justify-between w-full">

            {label && (
                <span className="text-sm text-zinc-300">
                    {label}
                </span>
            )}

            <button
                type="button"
                onClick={() => onChange(!enabled)}
                className={`relative w-12 h-6 flex items-center rounded-full border px-1 transition-colors duration-300
                ${enabled ? "bg-zinc-200 border-zinc-200" : "bg-zinc-900 border-zinc-700"}`}
            >
                <div
                    className={`w-4 h-4 rounded-full transition-all duration-300 transform
                    ${enabled ? "translate-x-6 bg-black" : "translate-x-0 bg-zinc-500"}`}
                />
            </button>

        </div>
    );
};