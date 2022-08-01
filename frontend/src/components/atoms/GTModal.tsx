import React, { ReactElement } from 'react'
import ModalTemplate from './ModalTemplate'

interface GTModalProps {
    children?: React.ReactNode
    isOpen: boolean
    title?: string
    leftButtons?: ReactElement | ReactElement[]
    rightButtons?: ReactElement | ReactElement[]
    onClose?: () => void
}
const GTModal = (props: GTModalProps) => {
    const handleClose = () => {
        if (props.onClose) {
            props.onClose()
        }
    }
    return (
        <ModalTemplate
            type="default"
            isOpen={props.isOpen}
            canClose={true}
            onClose={handleClose}
            title={props.title}
            leftButtons={props.leftButtons}
            rightButtons={props.rightButtons}
        >
            {props.children}
        </ModalTemplate>
    )
}

export default GTModal
