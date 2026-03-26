import React from "react";

const SuccessMessage = ({
  message = "Action completed successfully!",
  onAction,
  actionText = "Continue",
  fullPage = false,
}) => {
  return (
    <div
      className={`flex flex-col items-center justify-center text-center ${fullPage ? "min-h-screen" : "py-10"
        }`}
    >
      {/* Icon */}
      <div className="text-green-500 text-5xl mb-4">
        ✅
      </div>

      {/* Message */}
      <h2 className="text-lg md:text-xl font-semibold text-gray-700">
        {message}
      </h2>

      {/* Optional Button */}
      {onAction && (
        <button
          onClick={onAction}
          className="mt-4 px-5 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition"
        >
          {actionText}
        </button>
      )}
    </div>
  );
};

export default SuccessMessage;