import { forwardRef, type InputHTMLAttributes } from 'react'

interface FormFieldProps extends InputHTMLAttributes<HTMLInputElement> {
  label: string
  helperText?: string
  errorMessage?: string
  isRequired?: boolean
  isLoading?: boolean
  validator?: (value: string) => string | null
}

const FormField = forwardRef<HTMLInputElement, FormFieldProps>(
  (
    {
      label,
      helperText,
      errorMessage,
      isRequired = false,
      isLoading = false,
      validator,
      onChange,
      value,
      ...props
    },
    ref
  ) => {
    const hasError = !!errorMessage
    const fieldId = props.id || `field-${label.toLowerCase().replace(/\s+/g, '-')}`

    const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
      onChange?.(e)
      // Validação inline: se houver validator, executar
      if (validator && e.target.value) {
        validator(e.target.value)
        // Nota: A validação inline ocorre aqui, mas o state é gerenciado pelo pai
      }
    }

    return (
      <div className="flex flex-col gap-1.5">
        {/* Label */}
        <label
          htmlFor={fieldId}
          className="text-sm font-medium text-slate-200"
        >
          {label}
          {isRequired && <span className="text-red-500 ml-1">*</span>}
        </label>

        {/* Input */}
        <input
          ref={ref}
          id={fieldId}
          value={value}
          onChange={handleChange}
          disabled={isLoading}
          aria-label={label}
          aria-describedby={
            errorMessage ? `${fieldId}-error` : helperText ? `${fieldId}-helper` : undefined
          }
          aria-required={isRequired}
          aria-invalid={hasError}
          className={`
            px-3 py-2.5 rounded-md border transition-colors
            bg-slate-800 text-slate-100 placeholder-slate-500
            focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-offset-slate-900
            disabled:opacity-50 disabled:cursor-not-allowed
            ${
              hasError
                ? 'border-red-500 focus:ring-red-500'
                : 'border-slate-600 focus:border-slate-500 focus:ring-blue-500'
            }
          `}
          {...props}
        />

        {/* Helper Text */}
        {helperText && !hasError && (
          <p
            id={`${fieldId}-helper`}
            className="text-xs text-slate-400"
          >
            {helperText}
          </p>
        )}

        {/* Error Message */}
        {errorMessage && (
          <p
            id={`${fieldId}-error`}
            className="text-xs text-red-400 flex items-center gap-1"
            role="alert"
          >
            <span>⚠</span>
            {errorMessage}
          </p>
        )}
      </div>
    )
  }
)

FormField.displayName = 'FormField'

export default FormField
