/**
 * Reusable form input with label + error state.
 */
export function Field({ label, id, error, className = '', ...props }) {
  return (
    <div className="flex flex-col gap-1.5">
      <label
        htmlFor={id}
        className="text-sm font-medium"
        style={{ color: 'var(--color-text-primary)' }}
      >
        {label}
      </label>
      <input
        id={id}
        className={`w-full px-3 py-2 text-sm rounded-[--radius-btn] outline-none transition-all duration-150 ${className}`}
        style={{
          border: `1px solid ${error ? 'hsl(0 72% 51%)' : 'var(--color-border)'}`,
          background: 'var(--color-surface-card)',
          color: 'var(--color-text-primary)',
        }}
        onFocus={(e) => {
          e.target.style.borderColor = error ? 'hsl(0 72% 51%)' : 'var(--color-brand-500)'
          e.target.style.boxShadow = error
            ? '0 0 0 3px hsl(0 72% 51% / 0.12)'
            : '0 0 0 3px hsl(221 83% 53% / 0.12)'
        }}
        onBlur={(e) => {
          e.target.style.borderColor = error ? 'hsl(0 72% 51%)' : 'var(--color-border)'
          e.target.style.boxShadow = 'none'
        }}
        {...props}
      />
      {error && (
        <p className="text-xs" style={{ color: 'hsl(0 72% 51%)' }}>
          {error}
        </p>
      )}
    </div>
  )
}

/**
 * Primary button with loading state.
 */
export function Button({ children, loading = false, variant = 'primary', className = '', ...props }) {
  const styles = {
    primary: {
      background: 'var(--color-brand-500)',
      color: '#fff',
      border: 'none',
    },
    secondary: {
      background: 'transparent',
      color: 'var(--color-brand-600)',
      border: '1px solid var(--color-brand-200)',
    },
    danger: {
      background: 'transparent',
      color: 'hsl(0 72% 51%)',
      border: '1px solid hsl(0 72% 90%)',
    },
  }

  return (
    <button
      disabled={loading || props.disabled}
      className={`relative flex items-center justify-center gap-2 px-4 py-2 text-sm font-medium rounded-[--radius-btn] transition-all duration-150 cursor-pointer disabled:opacity-60 disabled:cursor-not-allowed ${className}`}
      style={styles[variant]}
      onMouseOver={(e) => {
        if (!props.disabled && !loading) {
          if (variant === 'primary') e.currentTarget.style.background = 'var(--color-brand-600)'
          else e.currentTarget.style.background = 'var(--color-brand-50)'
        }
      }}
      onMouseOut={(e) => {
        e.currentTarget.style.background = styles[variant].background
      }}
      {...props}
    >
      {loading && (
        <span className="animate-spin block w-4 h-4 border-2 border-current border-t-transparent rounded-full" />
      )}
      {children}
    </button>
  )
}
