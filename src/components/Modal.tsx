import React from 'react';

interface ModalProps {
  show: boolean;
  onClose: () => void;
  title: string;
  children: React.ReactNode;
  size?: 'sm' | 'md' | 'lg' | 'xl' | 'full';
}

const Modal: React.FC<ModalProps> = ({ show, onClose, title, children, size = 'lg' }) => {
  if (!show) {
    return null;
  }

  const sizeClasses = {
    sm: 'max-w-xl', // 36rem
    md: 'max-w-2xl', // 42rem
    lg: 'max-w-4xl', // 56rem
    xl: 'max-w-6xl', // 72rem
    full: 'max-w-full',
  };

  return (
    <div className="fixed inset-0 bg-black/40 flex justify-center items-center p-4">
      <div
        className={`
        rounded-lg p-6 w-full ${sizeClasses[size]}
        flex flex-col max-h-[80vh]
        bg-white dark:bg-gray-900
        border border-gray-200 dark:border-gray-700
        shadow-xl dark:shadow-2xl
        transition-colors z-20
      `}
      >
        {/* Header */}
        <div className="flex justify-between items-center border-b border-gray-300 dark:border-gray-700 pb-2 mb-4">
          <h2 className="text-xl font-semibold text-gray-800 dark:text-gray-100">
            {title}
          </h2>

          <button
            onClick={onClose}
            className="text-gray-500 dark:text-gray-400 hover:text-gray-800 dark:hover:text-gray-200 text-2xl transition"
          >
            &times;
          </button>
        </div>

        {/* Body */}
        <div className="overflow-y-auto text-gray-800 dark:text-gray-200">
          {children}
        </div>
      </div>
    </div>
  );
};

export default Modal;
