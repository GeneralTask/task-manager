import { Modal, ModalProps } from '@mantine/core'
import styled from 'styled-components'
import { Border, Colors, Shadows } from '../../styles'
import { stopKeydownPropogation } from '../../utils/utils'

const MODAL_HEIGHT = '642px'

const ModalContentContainer = styled.div`
    height: ${MODAL_HEIGHT};
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
    transition: 'pop',
    transitionDuration: 100,
    transitionTimingFunction: 'ease',
    padding: 0,
    onKeyDown: (e) => stopKeydownPropogation(e, [], true),
    styles: {
        modal: {
            borderRadius: Border.radius.small,
            boxShadow: Shadows.medium,
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
