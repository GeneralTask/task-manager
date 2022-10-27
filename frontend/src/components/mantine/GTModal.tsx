import { Modal, ModalProps } from '@mantine/core'
import styled from 'styled-components'
import { Border, Colors, Shadows, Spacing } from '../../styles'
import { stopKeydownPropogation } from '../../utils/utils'
import { TIconType } from '../atoms/Icon'

const MODAL_WIDTH = '550px'

const ModalOuterContainer = styled.div`
    display: flex;
    flex-direction: column;
    gap: ${Spacing._8};
`

const modalProps: Partial<ModalProps> = {
    withCloseButton: false,
    centered: true,
    size: MODAL_WIDTH,
    overlayColor: Colors.background.white,
    overlayOpacity: 0.55,
    overlayBlur: 3,
    transition: 'pop',
    transitionDuration: 100,
    transitionTimingFunction: 'ease',
    onKeyDown: (e) => stopKeydownPropogation(e, [], true),
    styles: {
        modal: {
            borderRadius: Border.radius.small,
            boxShadow: Shadows.medium,
        },
    },
}

interface GTModalTab {
    title?: string
    icon?: TIconType
    page: React.ReactNode
}
interface GTModalProps {
    open: boolean
    setOpen: (open: boolean) => void
    tabs: GTModalTab | GTModalTab[]
}
const GTModal = ({ open, setOpen, tabs }: GTModalProps) => {
    if (!Array.isArray(tabs))
        return (
            <Modal opened={open} onClose={() => setOpen(false)} {...modalProps}>
                <ModalOuterContainer>{tabs.page}</ModalOuterContainer>
            </Modal>
        )
    return (
        <Modal opened={open} onClose={() => setOpen(false)} {...modalProps}>
            <ModalOuterContainer>{tabs[0].page}</ModalOuterContainer>
        </Modal>
    )
}

export default GTModal
