import React from 'react'
import styled from 'styled-components'
import { Colors, Spacing } from '../../../styles'
import GTButton from '../buttons/GTButton'

const ToastContainer = styled.div`
    display: flex;
    align-items: center;
    justify-content: space-between;
`
const MessageSpan = styled.span`
    white-space: nowrap;
    min-width: 0;
    overflow: hidden;
    text-overflow: ellipsis;
    flex-shrink: 1;
    margin-right: ${Spacing.margin._40};
`
const ButtonsContainer = styled.div`
    display: flex;
    align-items: center;
    justify-content: space-between;
    gap: ${Spacing.margin._4};
    max-width: 75%;
`

const stopPropogationWrapper = (onClick: (e: React.MouseEvent) => void) => {
    return (event: React.MouseEvent) => {
        event.stopPropagation()
        onClick(event)
    }
}

interface ToastTemplateProps {
    message: string
    leftAction?: {
        label: string
        onClick: () => void
    }
    rightAction?: {
        label: string
        onClick: () => void
    }
}
const ToastTemplate = ({ message, leftAction, rightAction }: ToastTemplateProps) => {
    return (
        <ToastContainer>
            <MessageSpan>{message}</MessageSpan>
            <ButtonsContainer>
                {leftAction && (
                    <GTButton
                        styleType="secondary"
                        onClick={stopPropogationWrapper(leftAction.onClick)}
                        value={leftAction.label}
                    />
                )}
                {rightAction && (
                    <GTButton
                        styleType="primary"
                        color={Colors.gtColor.primary}
                        onClick={stopPropogationWrapper(rightAction.onClick)}
                        value={rightAction.label}
                    />
                )}
            </ButtonsContainer>
        </ToastContainer>
    )
}
export default ToastTemplate
export { ToastTemplateProps }
