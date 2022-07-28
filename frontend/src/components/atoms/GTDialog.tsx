import React, { ReactElement } from 'react'
import Modal from 'react-modal'
import styled from 'styled-components'
import { Border, Colors, Shadows, Spacing, Typography } from '../../styles'

const MODAL_MAX_HEIGHT = '75vh'
const MODAL_MIN_HEIGHT = 'fit-content'
const MODAL_WIDTH = 'fit-content'

Modal.setAppElement('#root')

const ModalContainer = styled.div`
    min-height: ${MODAL_MIN_HEIGHT};
    max-height: ${MODAL_MAX_HEIGHT};
    box-sizing: border-box;
    display: flex;
    flex: auto;
    flex-direction: column;
`
const Header = styled.div`
    color: ${Colors.text.light};
    margin-bottom: ${Spacing.margin._16};
    align-items: center;
    ${Typography.title};
`
const Footer = styled.div`
    display: flex;
    justify-content: space-between;
    gap: ${Spacing.margin._8};
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

interface GTDialogProps {
    isOpen: boolean
    title?: string
    leftButtons?: ReactElement | ReactElement[]
    rightButtons?: ReactElement | ReactElement[]
    onClose?: () => void
}
const GTDialog = (props: GTDialogProps) => {
    const handleClose = () => {
        if (props.onClose) {
            props.onClose()
        }
    }
    return (
        <Modal isOpen={props.isOpen} style={modalStyles} onRequestClose={handleClose}>
            <ModalContainer>
                <Header>{props.title}</Header>
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

export default GTDialog
