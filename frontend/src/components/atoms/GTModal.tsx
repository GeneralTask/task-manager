import React, { ReactElement } from 'react'
import Modal from 'react-modal'
import styled from 'styled-components'
import { Border, Colors, Shadows, Spacing, Typography } from '../../styles'
import { icons } from '../../styles/images'
import NoStyleButton from './buttons/NoStyleButton'
import { Icon } from './Icon'

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
        <Modal isOpen={props.isOpen} style={modalStyles} onRequestClose={handleClose}>
            <ModalContainer>
                <Header>
                    <div>{props.title}</div>
                    <CloseButton onClick={handleClose}>
                        <Icon size="small" source={icons.x} />
                    </CloseButton>
                </Header>
                {props.children && <Body>{props.children}</Body>}
                {(props.leftButtons || props.rightButtons) && (
                    <Footer>
                        <ButtonsGroup>{props.leftButtons}</ButtonsGroup>
                        {props.rightButtons && <ButtonsGroup>{props.rightButtons}</ButtonsGroup>}
                    </Footer>
                )}
            </ModalContainer>
        </Modal>
    )
}

export default GTModal
