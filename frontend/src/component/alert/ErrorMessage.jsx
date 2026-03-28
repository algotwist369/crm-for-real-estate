import React from 'react';

const ErrorMessage = ({
  message = "Something went wrong",
  fullPage = false,
}) => {
  return (
    <div
      className={`text-center text-red-500 ${fullPage ? "min-h-screen flex items-center justify-center" : "py-0"
        }`}
    >
      {message}
    </div>
  );
};

export default ErrorMessage;