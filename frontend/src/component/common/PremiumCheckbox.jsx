import React from "react";

export const PremiumCheckbox = ({
    label,
    checked,
    onChange,
}) => {
    return (
        <label className="flex items-center gap-3 cursor-pointer">

            <input
                type="checkbox"
                checked={checked}
                onChange={onChange}
                className="w-4 h-4 bg-zinc-950 border border-zinc-700 rounded-sm accent-zinc-200 cursor-pointer"
            />

            {label && (
                <span className="text-sm text-zinc-300">
                    {label}
                </span>
            )}

        </label>
    );
};