import React from 'react'
import Modal from 'react-modal'
import styled from 'styled-components'
import { Border, Colors, Shadows, Spacing, Typography } from '../../styles'
import { icons } from '../../styles/images'
import NoStyleButton from './buttons/NoStyleButton'
import { Icon } from './Icon'
import { background } from '../../styles/colors'

const MODAL_MAX_HEIGHT = '75vh'
const MODAL_WIDTH = '50vw'

Modal.setAppElement('#root')

const ModalContainer = styled.div`
    max-height: ${MODAL_MAX_HEIGHT};
    box-sizing: border-box;
    display: flex;
    flex: auto;
    flex-direction: column;
    justify-content: space-between;
`
const Header = styled.div`
    color: ${Colors.gray._700};
    font-size: ${Typography.xLarge.fontSize};
    line-height: ${Typography.xLarge.lineHeight};
    font-weight: ${Typography.weight._600};
    margin-bottom: ${Spacing.margin._16};
    display: flex;
    justify-content: space-between;
    align-items: center;
`
const Body = styled.div`
    overflow: auto;
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
        background-color: ${Colors.gray._200};
    }
`

const modalStyles = {
    overlay: {
        background: background.modalOverlay,
    },
    content: {
        margin: 'auto',
        border: 'none',
        height: 'fit-content',
        maxHeight: MODAL_MAX_HEIGHT,
        width: MODAL_WIDTH,
        boxShadow: Shadows.medium,
        padding: Spacing.padding._16,
    },
}

interface GTModalProps {
    children: JSX.Element
    isOpen: boolean
    title?: string
    leftButtons?: JSX.Element
    rightButtons?: JSX.Element
    onClose?: () => void
}
const GTModal = (props: GTModalProps) => {
    const handleClose = () => {
        props.onClose?.()
    }
    return (
        <Modal isOpen={props.isOpen} style={modalStyles} onRequestClose={handleClose}>
            <ModalContainer>
                <Header>
                    <div>{props.title}</div>
                    <CloseButton onClick={handleClose}>
                        <Icon size="small" source={icons.x} />
                    </CloseButton>
                </Header>
                <Body>{props.children}</Body>
                {(props.leftButtons || props.rightButtons) && (
                    <Footer>
                        <div>{props.leftButtons}</div>
                        <div>{props.rightButtons}</div>
                    </Footer>
                )}
            </ModalContainer>
        </Modal>
    )
}

export default GTModal
