import { Modal, ModalProps } from '@mantine/core'
import styled from 'styled-components'
import { Border, Colors, Shadows } from '../../styles'
import { stopKeydownPropogation } from '../../utils/utils'

const ModalContentContainer = styled.div`
    height: 100%;
`
const MODAL_WIDTH = {
    sm: '625px',
    md: '720px',
    lg: '1004px',
}
type TModalSize = keyof typeof MODAL_WIDTH

const modalProps: Partial<ModalProps> = {
    withCloseButton: false,
    centered: true,
    overlayColor: Colors.background.white,
    overlayOpacity: 0.55,
    overlayBlur: 3,
    transition: 'fade',
    transitionDuration: 150,
    padding: 0,
    onKeyDown: (e) => stopKeydownPropogation(e, [], true),
    styles: {
        modal: {
            borderRadius: Border.radius.small,
            boxShadow: Shadows.medium,
            overflow: 'hidden',
        },
    },
}

export interface BaseModalProps {
    children?: React.ReactNode
    size?: TModalSize
    open: boolean
    onClose?: () => void
    setIsModalOpen: (isModalOpen: boolean) => void
}
const BaseModal = ({ children, size = 'sm', open, onClose, setIsModalOpen }: BaseModalProps) => {
    const onModalClose = () => {
        setIsModalOpen(false)
        onClose?.()
    }
    return (
        <Modal opened={open} onClose={() => onModalClose()} size={MODAL_WIDTH[size]} {...modalProps}>
            <ModalContentContainer>{children}</ModalContentContainer>
        </Modal>
    )
}

export default BaseModal
