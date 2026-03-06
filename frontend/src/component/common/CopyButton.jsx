import React, { useState } from "react";
import { FiCopy, FiCheck } from "react-icons/fi";

export const CopyButton = ({ text }) => {
    const [copied, setCopied] = useState(false);

    const handleCopy = () => {
        navigator.clipboard.writeText(text);
        setCopied(true);
        setTimeout(() => setCopied(false), 1500);
    };

    return (
        <div className="flex items-center gap-2">
            <span className="text-sm">{text}</span>

            <button
                type="button"
                onClick={handleCopy}
                className="text-zinc-400 hover:text-white transition-colors duration-200"
                title="Copy"
            >
                {copied
                    ? <FiCheck className="text-green-400 w-3.5 h-3.5" />
                    : <FiCopy className="w-3.5 h-3.5" />
                }
            </button>
        </div>
    );
};
