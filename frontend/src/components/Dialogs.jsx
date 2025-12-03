import React, { useState, useEffect } from 'react'

// Confirmation Dialog
export function ConfirmDialog({ open, title, message, onConfirm, onCancel }) {
    if (!open) return null

    return (
        <div className="modal-backdrop" onClick={onCancel}>
            <div className="modal-card" onClick={e => e.stopPropagation()}>
                <div className="modal-header">
                    <div className="font-semibold text-lg">{title || 'Confirmar'}</div>
                </div>
                <div className="modal-body">
                    <p className="text-white/80">{message}</p>
                </div>
                <div className="modal-footer">
                    <button onClick={onCancel} className="px-4 py-2 rounded border border-white/20 hover:bg-white/5">
                        Cancelar
                    </button>
                    <button onClick={onConfirm} className="px-4 py-2 rounded bg-cyan-600 hover:bg-cyan-700">
                        Confirmar
                    </button>
                </div>
            </div>
        </div>
    )
}

// Prompt Dialog
export function PromptDialog({ open, title, message, defaultValue, onConfirm, onCancel }) {
    const [value, setValue] = useState(defaultValue || '')

    useEffect(() => {
        setValue(defaultValue || '')
    }, [defaultValue, open])

    if (!open) return null

    const handleConfirm = () => {
        onConfirm(value)
        setValue('')
    }

    const handleKeyDown = (e) => {
        if (e.key === 'Enter') {
            handleConfirm()
        } else if (e.key === 'Escape') {
            onCancel()
        }
    }

    return (
        <div className="modal-backdrop" onClick={onCancel}>
            <div className="modal-card" onClick={e => e.stopPropagation()}>
                <div className="modal-header">
                    <div className="font-semibold text-lg">{title || 'Digite'}</div>
                </div>
                <div className="modal-body">
                    <p className="text-white/80 mb-3">{message}</p>
                    <input
                        type="text"
                        value={value}
                        onChange={e => setValue(e.target.value)}
                        onKeyDown={handleKeyDown}
                        className="w-full px-3 py-2 bg-white/5 border border-white/20 rounded focus:border-cyan-500"
                        autoFocus
                    />
                </div>
                <div className="modal-footer">
                    <button onClick={onCancel} className="px-4 py-2 rounded border border-white/20 hover:bg-white/5">
                        Cancelar
                    </button>
                    <button onClick={handleConfirm} className="px-4 py-2 rounded bg-cyan-600 hover:bg-cyan-700">
                        OK
                    </button>
                </div>
            </div>
        </div>
    )
}

// Alert Dialog
export function AlertDialog({ open, title, message, onClose }) {
    if (!open) return null

    return (
        <div className="modal-backdrop" onClick={onClose}>
            <div className="modal-card" onClick={e => e.stopPropagation()}>
                <div className="modal-header">
                    <div className="font-semibold text-lg">{title || 'Aviso'}</div>
                </div>
                <div className="modal-body">
                    <p className="text-white/80">{message}</p>
                </div>
                <div className="modal-footer">
                    <button onClick={onClose} className="px-4 py-2 rounded bg-cyan-600 hover:bg-cyan-700">
                        OK
                    </button>
                </div>
            </div>
        </div>
    )
}
