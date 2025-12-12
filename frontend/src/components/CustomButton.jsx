import React from 'react'

export default function CustomButton({
    children,
    onClick,
    type = 'button',
    variant = 'primary',
    size = 'medium',
    disabled = false,
    loading = false,
    icon,
    iconRight,
    className = '',
    ...props
}) {
    const variants = {
        primary: 'bg-cyan-600 hover:bg-cyan-700 text-white shadow-lg shadow-cyan-500/30',
        secondary: 'bg-white/10 hover:bg-white/20 text-white border border-white/20 backdrop-blur-sm',
        danger: 'bg-red-600 hover:bg-red-700 text-white shadow-lg shadow-red-500/30',
        success: 'bg-green-600 hover:bg-green-700 text-white shadow-lg shadow-green-500/30',
        ghost: 'hover:bg-white/10 text-white',
        glass: 'glass-button'
    }

    const sizes = {
        small: 'px-3 py-1.5 text-sm',
        medium: 'px-4 py-2 text-base',
        large: 'px-6 py-3 text-lg'
    }

    const baseClasses = 'rounded-xl font-semibold transition-all duration-200 flex items-center justify-center gap-2'
    const variantClass = variants[variant] || variants.primary
    const sizeClass = sizes[size] || sizes.medium
    const disabledClass = disabled || loading ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer'

    return (
        <button
            type={type}
            onClick={disabled || loading ? undefined : onClick}
            disabled={disabled || loading}
            className={`${baseClasses} ${variantClass} ${sizeClass} ${disabledClass} ${className}`}
            {...props}
        >
            {loading ? (
                <>
                    <span className="mi animate-spin">refresh</span>
                    Carregando...
                </>
            ) : (
                <>
                    {icon && <span className="mi">{icon}</span>}
                    {children}
                    {iconRight && <span className="mi">{iconRight}</span>}
                </>
            )}
        </button>
    )
}
