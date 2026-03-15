import React from "react";

export const PremiumInput = ({
    label,
    icon,
    type = "text",
    placeholder,
    value,
    onChange,
    className = "",
    inputClassName = "",
    ...props
}) => {
    const id = props.id ?? props.name;
    const renderedIcon = React.isValidElement(icon) ? React.cloneElement(icon, { size: 16 }) : icon;

    return (
        <div className={`w-full flex flex-col gap-1 ${className}`}>
            {label && (
                <label
                    htmlFor={id}
                    className="text-[10px] font-bold text-zinc-500 uppercase tracking-widest ml-1"
                >
                    {label}
                </label>
            )}

            <div className="relative">
                {icon && (
                    <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-zinc-500">
                        {renderedIcon}
                    </div>
                )}

                <input
                    id={id}
                    name={props.name}
                    type={type}
                    placeholder={placeholder}
                    value={value}
                    onChange={onChange}
                    className={`w-full bg-zinc-900 border border-zinc-800 text-white text-sm rounded-xl pr-4 py-3 focus:outline-none focus:border-zinc-500/70 transition-colors ${icon ? "pl-10" : "px-4"} ${inputClassName}`}
                    {...props}
                />
            </div>
        </div>
    );
};
