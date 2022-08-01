import React, { ReactElement } from 'react'
import styled from 'styled-components'
import { Colors, Spacing, Typography, Border, Shadows, Dimensions } from '../../styles'
import NoStyleButton from './buttons/NoStyleButton'
import Modal from 'react-modal'
import { Icon } from './Icon'
import { icons } from '../../styles/images'
import { TModalSize } from '../../styles/dimensions'

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

const SHARED_MODAL_CONTENT_STYLE = {
    margin: 'auto',
    border: 'none',
    height: 'fit-content',
    boxShadow: Shadows.medium,
    padding: Spacing.padding._16,
    borderRadius: Border.radius.large,
}

const getModalStyle = (modalSize: TModalSize): Modal.Styles => ({
    content: {
        ...SHARED_MODAL_CONTENT_STYLE,
        maxHeight: Dimensions.modalSize[modalSize].max_height,
        minHeight: Dimensions.modalSize[modalSize].min_height,
        width: Dimensions.modalSize[modalSize].width,
    },
})

interface ModalTemplateProps {
    children?: React.ReactNode
    type: TModalSize
    title?: string
    leftButtons?: ReactElement | ReactElement[]
    rightButtons?: ReactElement | ReactElement[]
    isOpen: boolean
    canClose?: boolean
    onClose?: () => void
}
const ModalTemplate = (props: ModalTemplateProps) => {
    const handleClose = () => {
        if (props.onClose) {
            props.onClose()
        }
    }
    return (
        <Modal isOpen={props.isOpen} style={getModalStyle(props.type)} onRequestClose={handleClose}>
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
