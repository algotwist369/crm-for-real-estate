import React from "react";

export const PremiumInput = ({
    label,
    type = "text",
    placeholder,
    value,
    onChange,
}) => {
    return (
        <div className="w-full flex flex-col gap-2">

            {label && (
                <label className="text-sm font-medium text-zinc-400">
                    {label}
                </label>
            )}

            <input
                type={type}
                placeholder={placeholder}
                value={value}
                onChange={onChange}
                className="
          w-full
          px-4
          py-3
          bg-zinc-900
          border
          border-zinc-700
          rounded-lg
          text-zinc-100
          placeholder-zinc-500
          focus:outline-none
          focus:border-zinc-500
        "
            />
        </div>
    );
};