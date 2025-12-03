import React from 'react'

export default function Modal({open, title, children, onClose, footer}){
  if(!open) return null
  return (
    <div className="modal-backdrop" role="dialog" aria-modal="true">
      <div className="modal-card">
        <div className="modal-header">
          <div className="font-semibold">{title}</div>
          <button aria-label="Fechar" onClick={onClose} className="px-2 py-1">✕</button>
        </div>
        <div className="modal-body">{children}</div>
        {footer && <div className="modal-footer">{footer}</div>}
      </div>
    </div>
  )
}
