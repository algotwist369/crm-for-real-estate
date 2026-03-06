import React from "react";

export const PremiumTextarea = ({
    label,
    placeholder,
    value,
    onChange,
    rows = 4,
}) => {
    return (
        <div className="w-full flex flex-col gap-2">
            {label && (
                <label className="text-sm font-medium text-zinc-400">
                    {label}
                </label>
            )}

            <textarea
                rows={rows}
                placeholder={placeholder}
                value={value}
                onChange={onChange}
                className="w-full px-4 py-3 bg-zinc-950 border border-zinc-800 rounded-md text-zinc-100 placeholder-zinc-500 focus:outline-none focus:border-zinc-600 resize-none"
            />
        </div>
    );
};