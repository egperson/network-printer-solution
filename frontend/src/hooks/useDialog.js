import { useState } from 'react'

export function useDialog() {
    const [confirmDialog, setConfirmDialog] = useState({ open: false })
    const [promptDialog, setPromptDialog] = useState({ open: false })
    const [alertDialog, setAlertDialog] = useState({ open: false })

    const showConfirm = (message, title = 'Confirmar') => {
        return new Promise((resolve) => {
            setConfirmDialog({
                open: true,
                title,
                message,
                onConfirm: () => {
                    setConfirmDialog({ open: false })
                    resolve(true)
                },
                onCancel: () => {
                    setConfirmDialog({ open: false })
                    resolve(false)
                }
            })
        })
    }

    const showPrompt = (message, title = 'Digite', defaultValue = '') => {
        return new Promise((resolve) => {
            setPromptDialog({
                open: true,
                title,
                message,
                defaultValue,
                onConfirm: (value) => {
                    setPromptDialog({ open: false })
                    resolve(value)
                },
                onCancel: () => {
                    setPromptDialog({ open: false })
                    resolve(null)
                }
            })
        })
    }

    const showAlert = (message, title = 'Aviso') => {
        return new Promise((resolve) => {
            setAlertDialog({
                open: true,
                title,
                message,
                onClose: () => {
                    setAlertDialog({ open: false })
                    resolve()
                }
            })
        })
    }

    return {
        showConfirm,
        showPrompt,
        showAlert,
        confirmDialog,
        promptDialog,
        alertDialog
    }
}
