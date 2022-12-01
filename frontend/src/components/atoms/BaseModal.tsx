import { Modal, ModalProps } from '@mantine/core'
import styled from 'styled-components'
import { Border, Colors, Shadows } from '../../styles'
import { stopKeydownPropogation } from '../../utils/utils'

const ModalContentContainer = styled.div`
    height: 100%;
`
const MODAL_WIDTH = {
    sm: '502px',
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
    setIsModalOpen: (isModalOpen: boolean) => void
}
const BaseModal = ({ children, size = 'sm', open, setIsModalOpen }: BaseModalProps) => {
    return (
        <Modal opened={open} onClose={() => setIsModalOpen(false)} size={MODAL_WIDTH[size]} {...modalProps}>
            <ModalContentContainer>{children}</ModalContentContainer>
        </Modal>
    )
}

export default BaseModal
