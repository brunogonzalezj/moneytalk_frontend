import React from 'react';

interface CardProps {
  children: React.ReactNode;
  title?: string;
  subtitle?: string;
  footer?: React.ReactNode;
  className?: string;
  bordered?: boolean;
  hoverable?: boolean;
}

const Card: React.FC<CardProps> = ({
  children,
  title,
  subtitle,
  footer,
  className = '',
  bordered = true,
  hoverable = false,
}) => {
  return (
    <div
      className={`
        bg-white dark:bg-gray-800 rounded-xl overflow-hidden
        shadow-[0_1px_2px_rgba(16,24,40,0.06),0_4px_12px_-2px_rgba(16,24,40,0.08)]
        dark:shadow-[0_1px_2px_rgba(0,0,0,0.3),0_6px_16px_-4px_rgba(0,0,0,0.4)]
        ${bordered ? 'border border-gray-200 dark:border-gray-700' : ''}
        ${hoverable ? 'transition-[box-shadow,transform] duration-200 hover:-translate-y-0.5 hover:shadow-[0_2px_4px_rgba(16,24,40,0.06),0_12px_24px_-6px_rgba(16,24,40,0.14)]' : ''}
        ${className}
      `}
    >
      {(title || subtitle) && (
        <div className="px-5 pt-5 pb-4 border-b border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800">
          {title && <h3 className="text-lg font-bold text-gray-900 dark:text-gray-50">{title}</h3>}
          {subtitle && <p className="text-sm text-gray-500 dark:text-gray-400 mt-0.5">{subtitle}</p>}
        </div>
      )}

      <div className="p-5 bg-white dark:bg-gray-800">
        {children}
      </div>

      {footer && (
        <div className="p-5 bg-base-200 dark:bg-gray-700 border-t border-gray-200 dark:border-gray-600">
          {footer}
        </div>
      )}
    </div>
  );
};

export default Card;
