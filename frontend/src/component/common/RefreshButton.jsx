import React, { useState } from "react";
import { FiRefreshCw } from "react-icons/fi";

export const RefreshButton = ({ onClick }) => {
    const [spinning, setSpinning] = useState(false);

    const handleClick = () => {
        setSpinning(true);
        if (onClick) onClick();
        setTimeout(() => setSpinning(false), 600);
    };

    return (
        <button
            type="button"
            onClick={handleClick}
            className="p-2 rounded-md border border-zinc-800 bg-zinc-900 hover:bg-zinc-800 transition-colors duration-200"
            title="Refresh"
        >
            <FiRefreshCw
                className={`w-4 h-4 text-zinc-400 ${spinning ? "animate-spin" : ""}`}
            />
        </button>
    );
};
