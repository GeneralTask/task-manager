import { ReactElement } from 'react'
import Modal from 'react-modal'
import styled from 'styled-components'
import { Border, Colors, Dimensions, Shadows, Spacing, Typography } from '../../styles'
import { TModalSize } from '../../styles/dimensions'
import { icons } from '../../styles/images'
import { Icon } from './Icon'
import NoStyleButton from './buttons/NoStyleButton'

Modal.setAppElement('#root')

const ModalContainer = styled.div<{ type: TModalSize }>`
    min-height: ${(props) => Dimensions.modalSize[props.type].min_height};
    max-height: ${(props) => Dimensions.modalSize[props.type].max_height};
    box-sizing: border-box;
    display: flex;
    flex: auto;
    flex-direction: column;
    justify-content: space-between;
`
const Header = styled.div`
    color: ${Colors.text.black};
    margin-bottom: ${Spacing._16};
    display: flex;
    justify-content: space-between;
    align-items: center;
    ${Typography.title};
`
const Body = styled.div`
    overflow-y: auto;
    overflow-x: hidden;
    padding: ${Spacing._16};
    display: flex;
    flex-direction: column;
    flex: 1;
`
const Footer = styled.div`
    display: flex;
    justify-content: space-between;
    gap: ${Spacing._8};
`
const CloseButton = styled(NoStyleButton)`
    padding: ${Spacing._8};
    border-radius: ${Border.radius.small};
    &:hover {
        background-color: ${Colors.background.dark};
    }
`
const ButtonsGroup = styled.div`
    display: flex;
    gap: ${Spacing._8};
`

const SHARED_MODAL_CONTENT_STYLE = {
    margin: 'auto',
    border: 'none',
    height: 'fit-content',
    boxShadow: Shadows.medium,
    padding: Spacing._16,
    borderRadius: Border.radius.large,
}

const getModalStyle = (modalSize: TModalSize): Modal.Styles => ({
    overlay: {
        zIndex: 1000,
    },
    content: {
        ...SHARED_MODAL_CONTENT_STYLE,
        maxHeight: Dimensions.modalSize[modalSize].max_height,
        minHeight: Dimensions.modalSize[modalSize].min_height,
        width: Dimensions.modalSize[modalSize].width,
    },
})

interface GTModalProps {
    children?: React.ReactNode
    type: TModalSize
    title?: string
    leftButtons?: ReactElement | ReactElement[]
    rightButtons?: ReactElement | ReactElement[]
    isOpen: boolean
    canClose?: boolean
    onClose?: () => void
}
const GTModal = (props: GTModalProps) => {
    const handleClose = () => {
        if (props.onClose) {
            props.onClose()
        }
    }
    return (
        // ignoring TS warning here because react-modal typing does not support react 18, even though the library does
        // eslint-disable-next-line @typescript-eslint/ban-ts-comment
        // @ts-ignore
        <Modal isOpen={props.isOpen} style={getModalStyle(props.type)} onRequestClose={handleClose}>
            <ModalContainer type={props.type}>
                <Header>
                    <div>{props.title}</div>
                    {props.canClose && (
                        <CloseButton onClick={handleClose}>
                            <Icon icon={icons.x} />
                        </CloseButton>
                    )}
                </Header>
                {props.children && <Body>{props.children}</Body>}
                <Footer>
                    {props.leftButtons && <ButtonsGroup>{props.leftButtons}</ButtonsGroup>}
                    {props.rightButtons && <ButtonsGroup>{props.rightButtons}</ButtonsGroup>}
                </Footer>
            </ModalContainer>
        </Modal>
    )
}

export default GTModal
