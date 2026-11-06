import React from 'react';

interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'primary' | 'secondary' | 'accent' | 'outline' | 'ghost';
  size?: 'sm' | 'md' | 'lg';
  isLoading?: boolean;
  fullWidth?: boolean;
  icon?: React.ReactNode;
  iconPosition?: 'left' | 'right';
}

const Button: React.FC<ButtonProps> = ({
  children,
  variant = 'primary',
  size = 'md',
  isLoading = false,
  fullWidth = false,
  icon,
  iconPosition = 'left',
  className = '',
  disabled,
  ...props
}) => {
  const baseClasses = 'btn flex-nowrap whitespace-nowrap rounded-lg font-semibold tracking-[-0.01em] transition duration-200 ease-out focus:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:ring-primary-500 active:scale-[0.97]';

  const solidDepth = 'shadow-[0_1px_2px_rgba(16,24,40,0.12),0_4px_10px_-2px_var(--btn-glow)] hover:shadow-[0_2px_4px_rgba(16,24,40,0.12),0_8px_16px_-4px_var(--btn-glow)] hover:-translate-y-px';

  const variantClasses = {
    primary: `btn-primary !bg-primary-600 hover:!bg-primary-700 !border-primary-600 hover:!border-primary-700 text-white [--btn-glow:rgba(5,150,105,0.45)] ${solidDepth}`,
    secondary: `btn-secondary text-white [--btn-glow:rgba(30,64,175,0.4)] ${solidDepth}`,
    accent: `btn-accent text-white [--btn-glow:rgba(231,61,62,0.4)] ${solidDepth}`,
    outline: 'btn-outline border border-gray-300 bg-white text-gray-800 shadow-[0_1px_2px_rgba(16,24,40,0.06)] hover:bg-primary-50 hover:border-primary-500 hover:text-primary-700',
    ghost: 'btn-ghost hover:bg-base-200',
  };
  
  const sizeClasses = {
    sm: 'btn-sm px-3 py-1 text-sm',
    md: 'px-4 py-2',
    lg: 'btn-lg px-6 py-3 text-lg',
  };
  
  const widthClass = fullWidth ? 'w-full' : '';
  const loadingClass = isLoading ? 'btn-disabled opacity-70' : '';
  const disabledClass = disabled ? 'btn-disabled opacity-70 cursor-not-allowed' : '';
  
  return (
    <button
      className={`
        ${baseClasses}
        ${variantClasses[variant]}
        ${sizeClasses[size]}
        ${widthClass}
        ${loadingClass}
        ${disabledClass}
        ${className}
      `}
      disabled={isLoading || disabled}
      {...props}
    >
      {isLoading && (
        <span className="loading loading-spinner loading-xs mr-2"></span>
      )}
      
      {icon && iconPosition === 'left' && !isLoading && (
        <span className="mr-2">{icon}</span>
      )}
      
      {children}
      
      {icon && iconPosition === 'right' && !isLoading && (
        <span className="ml-2">{icon}</span>
      )}
    </button>
  );
};

export default Button;