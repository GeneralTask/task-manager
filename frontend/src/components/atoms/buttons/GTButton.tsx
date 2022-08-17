import { Border, Colors, Shadows, Spacing, Typography } from '../../../styles'
import React from 'react'
import styled, { css } from 'styled-components'
import { Icon } from '../Icon'
import { IconProp } from '@fortawesome/fontawesome-svg-core'
import NoStyleButton from './NoStyleButton'

type TButtonStyle = 'primary' | 'secondary'
type TButtonSize = 'small' | 'large'

const PrimaryButtonStyles = css`
    background-color: ${Colors.button.primary.default};
    color: ${Colors.text.white};
    &:hover {
        box-shadow: ${Shadows.button.primary.hover};
        background-color: ${Colors.button.primary.hover};
    }
    &:active {
        box-shadow: ${Shadows.button.primary.active};
        color: ${Colors.button.primary.active_text};
    }
`
const SecondaryButtonStyles = css`
    background-color: ${Colors.button.secondary.default};
    color: ${Colors.text.black};
    &:hover {
        box-shadow: ${Shadows.button.secondary.hover};
        background-color: ${Colors.button.secondary.hover};
    }
    &:active {
        box-shadow: ${Shadows.button.secondary.active};
        color: ${Colors.button.secondary.active_text};
    }
`
const LargeButtonStyle = css`
    padding: ${Spacing.padding._8} ${Spacing.padding._16};
    gap: ${Spacing.padding._8};
    ${Typography.body}
`
const SmallButtonStyle = css`
    padding: ${Spacing.padding._4} ${Spacing.padding._8};
    gap: ${Spacing.padding._4};
    ${Typography.bodySmall}
`

const Button = styled(NoStyleButton)<{
    styleType: TButtonStyle
    wrapText: boolean
    fitContent: boolean
    size: TButtonSize
}>`
    display: flex;
    justify-content: center;
    align-items: center;
    border-radius: ${Border.radius.small};
    text-align: center;
    height: 100%;
    width: ${(props) => (props.fitContent ? 'fit-content' : '100%')};
    box-shadow: ${Shadows.button.default};
    white-space: ${(props) => (props.wrapText ? 'normal' : 'nowrap')};
    overflow: hidden;
    text-overflow: ellipsis;
    transition: background 0.05s;
    transition: box-shadow 0.25s;
    user-select: none;
    font-family: inherit;
    ${Typography.body};
    ${(props) => props.styleType === 'primary' && PrimaryButtonStyles};
    ${(props) => props.styleType === 'secondary' && SecondaryButtonStyles};
    ${(props) => props.size === 'large' && LargeButtonStyle};
    ${(props) => props.size === 'small' && SmallButtonStyle};
`

interface GTButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
    styleType?: TButtonStyle
    size?: TButtonSize
    wrapText?: boolean
    icon?: IconProp
    iconColor?: string
    fitContent?: boolean
}
const GTButton = ({
    styleType = 'primary',
    size = 'large',
    wrapText = false,
    fitContent = true,
    icon,
    iconColor,
    value,
    ...rest
}: GTButtonProps) => {
    const iconSize = size === 'small' ? 'xSmall' : 'small'
    return (
        <Button styleType={styleType} size={size} wrapText={wrapText} fitContent={fitContent} {...rest}>
            {icon && <Icon size={iconSize} icon={icon} color={iconColor} />}
            {value}
        </Button>
    )
}

export default GTButton
