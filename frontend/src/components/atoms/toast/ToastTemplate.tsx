import { IconProp } from '@fortawesome/fontawesome-svg-core'
import React from 'react'
import styled from 'styled-components'
import { Spacing, Typography } from '../../../styles'
import GTButton from '../buttons/GTButton'

const ToastContainer = styled.div`
    display: flex;
    align-items: center;
    gap: ${Spacing.margin._8};
    padding-right: 0;
    padding-left: ${Spacing.padding._8};
    ${Typography.body};
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
    margin-right: ${Spacing.margin._4};
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
    title?: string
    message: string
    leftAction?: ToastAction
    rightAction?: ToastAction
}
const ToastTemplate = ({ title, message, leftAction, rightAction }: ToastTemplateProps) => {
    return (
        <ToastContainer>
            <MessageContainer>
                {title && <TitleText>{title}</TitleText>}
                <MessageText>{message}</MessageText>
            </MessageContainer>
            <ButtonsContainer>
                {leftAction && (
                    <GTButton
                        icon={leftAction.icon}
                        iconColor="black"
                        styleType="secondary"
                        onClick={stopPropogationWrapper(leftAction.onClick)}
                        value={leftAction.label}
                    />
                )}
                {rightAction && (
                    <GTButton
                        icon={rightAction.icon}
                        iconColor="black"
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
