import React, { ReactElement } from 'react'
import ModalTemplate from './ModalTemplate'
interface GTDialogProps {
    isOpen: boolean
    title?: string
    leftButtons?: ReactElement | ReactElement[]
    rightButtons?: ReactElement | ReactElement[]
    onClose?: () => void
}
const GTDialog = (props: GTDialogProps) => {
    const handleClose = () => {
        if (props.onClose) {
            props.onClose()
        }
    }
    return (
        <ModalTemplate
            type="dialog"
            isOpen={props.isOpen}
            canClose={false}
            onClose={handleClose}
            title={props.title}
            leftButtons={props.leftButtons}
            rightButtons={props.rightButtons}
        />
    )
}

export default GTDialog
