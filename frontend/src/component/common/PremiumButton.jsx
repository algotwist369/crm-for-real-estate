import React from "react";

export const PremiumButton = ({
    text,
    onClick,
    type = "button",
    variant = "primary"
}) => {

    const baseStyle =
        "w-full px-5 py-3 font-medium rounded-md border transition-all duration-200 active:scale-[0.98]";

    const variants = {
        primary:
            "bg-gray-800 text-white border-zinc-900 hover:bg-gray-900 hover:shadow-md",

        secondary:
            "bg-zinc-100 text-black border-zinc-200 hover:bg-zinc-200 hover:shadow-sm"
    };

    return (
        <button
            type={type}
            onClick={onClick}
            className={`${baseStyle} ${variants[variant]}`}
        >
            {text}
        </button>
    );
};