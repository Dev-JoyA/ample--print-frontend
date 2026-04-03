const Textarea = ({
  label,
  placeholder,
  value,
  onChange,
  error,
  className = '',
  required = false,
  rows = 4,
  disabled = false,
  ...props
}) => {
  return (
    <div className={`w-full ${className}`}>
      {label && (
        <label className="mb-1 block text-xs font-medium text-gray-300 sm:mb-2 sm:text-sm">
          {label}
          {required && <span className="ml-1 text-primary">*</span>}
        </label>
      )}
      <textarea
        placeholder={placeholder}
        value={value}
        onChange={onChange}
        rows={rows}
        disabled={disabled}
        className={`w-full rounded-xl border bg-slate-900 px-3 py-2 text-sm text-white placeholder-gray-400 transition-colors focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent sm:px-4 sm:py-2.5 sm:text-base ${
          error ? 'border-red-500' : 'border-gray-700'
        } resize-none disabled:cursor-not-allowed disabled:opacity-50`}
        required={required}
        {...props}
      />
      {error && (
        <p className="mt-1 text-xs text-red-400 sm:text-sm">{error}</p>
      )}
    </div>
  );
};

export default Textarea;