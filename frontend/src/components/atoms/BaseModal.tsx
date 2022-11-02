import { Modal } from '@mantine/core'
import styled from 'styled-components'
import { MODAL_WIDTH, TModalSize, modalProps } from '../mantine/GTModal'

const MODAL_HEIGHT = '642px'

const ModalContentContainer = styled.div`
    height: ${MODAL_HEIGHT};
`

interface BaseModalProps {
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
