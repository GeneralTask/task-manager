import { Modal } from '@mantine/core'
import styled from 'styled-components'
import { Colors, Spacing } from '../../styles'

const MODAL_WIDTH = '550px'

const ModalOuterContainer = styled.div`
    display: flex;
    flex-direction: column;
    gap: ${Spacing._8};
`

interface GTModalProps {
    open: boolean
    setOpen: (open: boolean) => void
    children: React.ReactNode | React.ReactNode[]
}
const GTModal = ({ open, setOpen, children }: GTModalProps) => {
    return (
        <Modal
            opened={open}
            onClose={() => setOpen(false)}
            withCloseButton={false}
            centered
            size={MODAL_WIDTH}
            overlayColor={Colors.background.white}
            overlayOpacity={0.55}
            overlayBlur={3}
            transition="pop"
            transitionDuration={100}
            transitionTimingFunction="ease"
        >
            <ModalOuterContainer>{children}</ModalOuterContainer>
        </Modal>
    )
}

export default GTModal
