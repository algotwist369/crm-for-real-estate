import React from 'react';

const ErrorMessage = ({
  message = "Something went wrong",
  onRetry,
  fullPage = false,
}) => {
  return (
    <div
      className={`flex flex-col items-center justify-center text-center ${fullPage ? "min-h-screen" : "py-10"
        }`}
    >
      {/* Icon */}
      <div className="text-red-500 text-5xl mb-4">
        ⚠️
      </div>

      {/* Message */}
      <h2 className="text-lg md:text-xl font-semibold text-gray-700">
        {message}
      </h2>

      {/* Retry Button */}
      {onRetry && (
        <button
          onClick={onRetry}
          className="mt-4 px-5 py-2 bg-black text-white rounded-lg hover:bg-gray-800 transition"
        >
          Try Again
        </button>
      )}
    </div>
  );
};

export default ErrorMessage;