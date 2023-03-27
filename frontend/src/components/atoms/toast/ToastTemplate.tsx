import { IconProp } from '@fortawesome/fontawesome-svg-core'
import styled from 'styled-components'
import { Spacing, Typography } from '../../../styles'
import GTButton from '../buttons/GTButton'

const ToastContainer = styled.div`
    display: flex;
    align-items: center;
    gap: ${Spacing._8};
    padding-right: 0;
    padding-left: ${Spacing._8};
    ${Typography.body.large};
    min-width: 0;
`
const MessageContainer = styled.div`
    min-width: 0;
    flex-shrink: 1;
    margin-right: auto;
    display: flex;
    align-items: center;
`
const TitleText = styled.div`
    margin-right: ${Spacing._4};
    ${Typography.bold};
    white-space: nowrap;
    overflow: hidden;
    text-overflow: ellipsis;
    height: fit-content;
`
const MessageText = styled.div`
    min-width: fit-content;
    height: fit-content;
`
const ButtonsContainer = styled.div`
    display: flex;
    align-items: center;
    justify-content: space-between;
    gap: ${Spacing._4};
    max-width: 75%;
`

const stopPropogationWrapper = (onClick: (e: React.MouseEvent) => void) => {
    return (event: React.MouseEvent) => {
        event.stopPropagation()
        onClick(event)
    }
}

interface ToastAction {
    label: string
    icon?: IconProp | string
    onClick: () => void
}
interface UndoableToastAction extends ToastAction {
    undoableAction?: () => void
}
export interface ToastTemplateProps {
    title?: string
    message: string
    actions?: React.ReactNode
    undoableButton?: UndoableToastAction
}
const ToastTemplate = ({ title, message, actions, undoableButton }: ToastTemplateProps) => {
    return (
        <ToastContainer>
            <MessageContainer>
                {title && <TitleText>{title}</TitleText>}
                <MessageText>{message}</MessageText>
            </MessageContainer>
            <ButtonsContainer>
                {actions}
                {undoableButton && (
                    <GTButton
                        icon={undoableButton.icon}
                        styleType="secondary"
                        onClick={stopPropogationWrapper(undoableButton.onClick)}
                        value={undoableButton.label}
                    />
                )}
            </ButtonsContainer>
        </ToastContainer>
    )
}
export default ToastTemplate
