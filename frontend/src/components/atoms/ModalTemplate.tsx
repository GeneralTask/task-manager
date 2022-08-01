import React, { ReactElement } from 'react'
import styled from 'styled-components'
import { Colors, Spacing, Typography, Border, Shadows } from '../../styles'
import NoStyleButton from './buttons/NoStyleButton'
import Modal from 'react-modal'
import { modalTemplateSize } from '../../styles/dimensions'
import { Icon } from './Icon'
import { icons } from '../../styles/images'

Modal.setAppElement('#root')

const ModalContainer = styled.div<{ type: 'dialog' | 'default' }>`
    min-height: ${(props) => modalTemplateSize[props.type].min_height};
    max-height: ${(props) => modalTemplateSize[props.type].max_height};
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
    display: flex;
    justify-content: space-between;
    gap: ${Spacing.margin._8};
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

const modalStylesDefault = {
    content: {
        margin: 'auto',
        border: 'none',
        height: 'fit-content',
        minHeight: modalTemplateSize.default.min_height,
        maxHeight: modalTemplateSize.default.max_height,
        width: modalTemplateSize.default.width,
        boxShadow: Shadows.medium,
        padding: Spacing.padding._16,
        borderRadius: Border.radius.large,
    },
}
const modalStylesDialog = {
    content: {
        margin: 'auto',
        border: 'none',
        height: 'fit-content',
        minHeight: modalTemplateSize.dialog.min_height,
        maxHeight: modalTemplateSize.dialog.max_height,
        width: modalTemplateSize.dialog.width,
        boxShadow: Shadows.medium,
        padding: Spacing.padding._16,
        borderRadius: Border.radius.large,
    },
}

interface ModalTemplateProps {
    children?: React.ReactNode
    type: 'dialog' | 'default'
    title?: string
    leftButtons?: ReactElement | ReactElement[]
    rightButtons?: ReactElement | ReactElement[]
    isOpen: boolean
    canClose?: boolean
    onClose?: () => void
}
const ModalTemplate = (props: ModalTemplateProps) => {
    const modalStyles = props.type === 'dialog' ? modalStylesDialog : modalStylesDefault

    const handleClose = () => {
        if (props.onClose) {
            props.onClose()
        }
    }
    return (
        <Modal isOpen={props.isOpen} style={modalStyles} onRequestClose={handleClose}>
            <ModalContainer type={props.type}>
                <Header>
                    <div>{props.title}</div>
                    {props.canClose && (
                        <CloseButton onClick={handleClose}>
                            <Icon size="small" source={icons.x} />
                        </CloseButton>
                    )}
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

export default ModalTemplate
