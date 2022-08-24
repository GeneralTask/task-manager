import { IconProp } from '@fortawesome/fontawesome-svg-core'
import React from 'react'
import styled from 'styled-components'
import { Spacing, Typography } from '../../../styles'
import GTButton from '../buttons/GTButton'

const ToastContainer = styled.div`
    display: flex;
    align-items: center;
    gap: ${Spacing.margin._8};
    padding: 0 ${Spacing.padding._8};
    ${Typography.body};
`
const MessageContainer = styled.div`
    min-width: 0;
    flex-shrink: 1;
    margin-right: auto;
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

interface ToastAction {
    label: string
    icon?: IconProp | string
    onClick: () => void
}
interface ToastTemplateProps {
    message: string
    leftAction?: ToastAction
    rightAction?: ToastAction
}
const ToastTemplate = ({ message, leftAction, rightAction }: ToastTemplateProps) => {
    return (
        <ToastContainer>
            <MessageContainer>{message}</MessageContainer>
            <ButtonsContainer>
                {leftAction && (
                    <GTButton
                        icon={leftAction.icon}
                        styleType="secondary"
                        onClick={stopPropogationWrapper(leftAction.onClick)}
                        value={leftAction.label}
                    />
                )}
                {rightAction && (
                    <GTButton
                        icon={rightAction.icon}
                        styleType="secondary"
                        size="small"
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
