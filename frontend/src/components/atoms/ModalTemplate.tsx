import React from 'react'
import styled from 'styled-components'
import { Colors, Spacing, Typography, Border, Shadows } from '../../styles'
import NoStyleButton from './buttons/NoStyleButton'
import Modal from 'react-modal'

const MODAL_MAX_HEIGHT = '75vh'
const MODAL_MIN_HEIGHT = '50vh'
const MODAL_WIDTH = '50vw'

Modal.setAppElement('#root')

const ModalContainer = styled.div`
    min-height: ${MODAL_MIN_HEIGHT};
    max-height: ${MODAL_MAX_HEIGHT};
    box-sizing: border-box;
    display: flex;
    flex: auto;
    flex-direction: column;
    justify-content: space-between;
`
const Header = styled.div`
    color: ${Colors.text.light};
    margin-bottom: ${Spacing.margin._16};
    display: flex;
    justify-content: space-between;
    align-items: center;
    ${Typography.title};
`
const Body = styled.div`
    overflow: auto;
    display: flex;
    flex-direction: column;
    flex: 1;
`
const Footer = styled.div`
    margin-top: ${Spacing.margin._16};
    display: flex;
    justify-content: space-between;
`
const CloseButton = styled(NoStyleButton)`
    padding: ${Spacing.padding._8};
    border-radius: ${Border.radius.small};
    &:hover {
        background-color: ${Colors.background.dark};
    }
`
const ButtonsGroup = styled.div`
    display: flex;
    gap: ${Spacing.margin._8};
`

const modalStyles = {
    content: {
        margin: 'auto',
        border: 'none',
        height: 'fit-content',
        minHeight: MODAL_MIN_HEIGHT,
        maxHeight: MODAL_MAX_HEIGHT,
        width: MODAL_WIDTH,
        boxShadow: Shadows.medium,
        padding: Spacing.padding._16,
        borderRadius: Border.radius.large,
    },
}

interface ModalTemplateProps {
    children: React.ReactNode
    type: 'dialog' | 'modal'
    isOpen: boolean
    canClose?: boolean
    onClose?: () => void
}
const ModalTemplate = (props: ModalTemplateProps) => {
    const { children, type, isOpen, canClose, onClose } = props
    const handleClose = () => {
        if (onClose) {
            onClose()
        }
    }
    return (
        <Modal isOpen={isOpen} style={modalStyles} onRequestClose={handleClose}>
            {children}
        </Modal>
    )
}
