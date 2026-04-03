'use client';

const Input = ({ 
  label, 
  name, 
  value, 
  onChange, 
  type = 'text', 
  placeholder, 
  required = false, 
  disabled = false,
  textarea = false,
  icon,
  rows = 3,
  className = '',
  ...props 
}) => {
  const baseClasses = "w-full rounded-lg border border-gray-700 bg-slate-800 px-3 py-2 text-white placeholder-gray-500 transition focus:outline-none focus:ring-2 focus:ring-red-600 focus:border-transparent disabled:cursor-not-allowed disabled:opacity-50 sm:px-4 sm:py-2";
  
  const iconClasses = icon ? "pl-8 sm:pl-10" : "";

  return (
    <div className="w-full">
      {label && (
        <label htmlFor={name} className="mb-1 block text-xs font-medium text-gray-300 sm:mb-2 sm:text-sm">
          {label} {required && <span className="text-red-500">*</span>}
        </label>
      )}
      <div className="relative">
        {icon && (
          <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-2 sm:pl-3">
            {icon}
          </div>
        )}
        {textarea ? (
          <textarea
            id={name}
            name={name}
            value={value}
            onChange={onChange}
            placeholder={placeholder}
            required={required}
            disabled={disabled}
            rows={rows}
            className={`${baseClasses} ${iconClasses} ${className}`}
            {...props}
          />
        ) : (
          <input
            type={type}
            id={name}
            name={name}
            value={value}
            onChange={onChange}
            placeholder={placeholder}
            required={required}
            disabled={disabled}
            className={`${baseClasses} ${iconClasses} ${className}`}
            {...props}
          />
        )}
      </div>
    </div>
  );
};

export default Input;