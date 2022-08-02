import React from 'react'
import GTButton from '../atoms/buttons/GTButton'
import GTDialog from '../atoms/GTDialog'

interface ConfirmDialogProps {
    isOpen: boolean
    onClose: () => void
    onConfirm: () => void
    promptText: string
    confirmText: string
    cancelText: string
}
const ConfirmDialog = (props: ConfirmDialogProps) => {
    const { isOpen, onClose, onConfirm, promptText, confirmText, cancelText } = props

    return (
        <GTDialog
            isOpen={isOpen}
            title={promptText}
            onClose={onClose}
            leftButtons={<GTButton value={cancelText} styleType="secondary" onClick={onClose} />}
            rightButtons={<GTButton value={confirmText} styleType="primary" onClick={onConfirm} />}
        />
    )
}

export default ConfirmDialog
