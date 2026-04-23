const Button = ({
  children,
  variant = 'primary',
  size = 'md',
  className = '',
  onClick,
  type = 'button',
  disabled = false,
  icon,
  iconPosition = 'right',
  ...props
}) => {
  const baseStyles =
    'inline-flex items-center justify-center font-medium rounded-lg transition-colors focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-offset-dark disabled:opacity-50 disabled:cursor-not-allowed';

  const variants = {
    primary: 'bg-primary text-white hover:bg-primary-dark focus:ring-primary',
    secondary: 'bg-slate-950 text-white hover:bg-dark-lighter focus:ring-dark-light',
    outline:
      'border-2 border-primary text-primary hover:bg-primary hover:text-white focus:ring-primary',
    ghost: 'text-gray-300 hover:bg-dark-light hover:text-white',
    danger: 'bg-red-600 text-white hover:bg-red-700 focus:ring-red-600',
    explore: 'text-red-600 font-semibold text-xs sm:text-sm',
    click: 'border border-gray-300 text-white hover:bg-gray-700 focus:ring-gray-300',
    warning: 'bg-orange-500 text-white hover:bg-orange-600 focus:ring-orange-500',
  };

  const sizes = {
    sm: 'px-3 py-1.5 text-xs sm:text-sm',
    md: 'px-4 py-2 text-sm sm:text-base',
    lg: 'px-5 py-2.5 text-base sm:text-lg',
    xl: 'px-6 py-3 text-lg sm:text-xl',
  };

  const iconSizes = {
    sm: 'w-3 h-3 sm:w-4 sm:h-4',
    md: 'w-4 h-4 sm:w-5 sm:h-5',
    lg: 'w-5 h-5 sm:w-6 sm:h-6',
    xl: 'w-6 h-6 sm:w-7 sm:h-7',
  };

  return (
    <button
      type={type}
      className={`${baseStyles} ${variants[variant]} ${sizes[size]} ${className}`}
      onClick={onClick}
      disabled={disabled}
      {...props}
    >
      {icon && iconPosition === 'left' && (
        <span className={`mr-1 sm:mr-2 ${iconSizes[size]}`}>{icon}</span>
      )}
      {children}
      {icon && iconPosition === 'right' && (
        <span className={`ml-1 sm:ml-2 ${iconSizes[size]}`}>{icon}</span>
      )}
    </button>
  );
};

export default Button;
