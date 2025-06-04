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
        bg-white rounded-lg overflow-hidden
        ${bordered ? 'border border-base-300' : ''}
        ${hoverable ? 'transition-shadow hover:shadow-md' : 'shadow-sm'}
        ${className}
      `}
    >
      {(title || subtitle) && (
        <div className="p-4 border-b border-base-300">
          {title && <h3 className="text-lg font-semibold text-gray-800">{title}</h3>}
          {subtitle && <p className="text-sm text-gray-500 mt-1">{subtitle}</p>}
        </div>
      )}
      
      <div className="p-4">
        {children}
      </div>
      
      {footer && (
        <div className="p-4 bg-base-200 border-t border-base-300">
          {footer}
        </div>
      )}
    </div>
  );
};

export default Card;