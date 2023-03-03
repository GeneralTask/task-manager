import React from 'react'
import { IconProp } from '@fortawesome/fontawesome-svg-core'
import styled, { css } from 'styled-components'
import { Border, Colors, Spacing, Typography } from '../../../styles'
import { TIconColor, TTextColor } from '../../../styles/colors'
import { icons } from '../../../styles/images'
import { Icon } from '../Icon'
import NoStyleButton from './NoStyleButton'

type TButtonType = 'primary' | 'secondary' | 'destructive' | 'control' | 'icon'

const PrimaryButtonStyles = css`
    ${Typography.body};
    padding: ${Spacing._8} ${Spacing._16};
    color: ${Colors.control.primary.label};
    background-color: ${Colors.control.primary.bg};
    &:hover:enabled {
        background-color: ${Colors.control.primary.hover};
    }
    &:active:enabled {
        background-color: ${Colors.control.primary.highlight};
        box-shadow: inset 0px 0px 0px ${Border.stroke.medium} ${Colors.control.primary.hover};
    }
`
const SecondaryButtonStyles = css`
    ${Typography.body};
    padding: ${Spacing._8} ${Spacing._16};
    color: ${Colors.control.secondary.label};
    background-color: ${Colors.control.secondary.bg};
    box-shadow: inset 0px 0px 0px ${Border.stroke.medium} ${Colors.control.secondary.stroke};
    &:hover:enabled {
        background-color: ${Colors.control.secondary.hover};
        box-shadow: inset 0px 0px 0px ${Border.stroke.medium} ${Colors.control.secondary.stroke};
    }
    &:active:enabled {
        background-color: ${Colors.control.secondary.hover};
        box-shadow: inset 0px 0px 0px ${Border.stroke.medium} ${Colors.control.secondary.highlight};
    }
`
const DestructiveButtonStyles = css`
    ${Typography.body};
    padding: ${Spacing._8} ${Spacing._16};
    color: ${Colors.control.destructive.label};
    background-color: ${Colors.control.destructive.bg};
    &:hover:enabled {
        background-color: ${Colors.control.destructive.hover};
    }
    &:active:enabled {
        background-color: ${Colors.control.destructive.highlight};
        box-shadow: inset 0px 0px 0px ${Border.stroke.medium} ${Colors.control.destructive.hover};
    }
`
const ControlButtonStyles = css`
    ${Typography.bodySmall};
    padding: ${Spacing._4} ${Spacing._8};
    color: ${Colors.text.muted};
    &:hover:enabled {
        color: ${Colors.text.base};
        background-color: ${Colors.background.border};
    }
    &:active:enabled {
        color: ${Colors.text.base};
        background-color: ${Colors.background.border};
        box-shadow: inset 0px 0px 0px ${Border.stroke.medium} ${Colors.accent.pink};
    }
`
const IconButtonStyles = css`
    ${Typography.bodySmall};
    padding: ${Spacing._4};
    color: ${Colors.text.muted};
    &:hover:enabled {
        color: ${Colors.text.base};
        background-color: ${Colors.background.border};
    }
    &:active:enabled {
        color: ${Colors.text.base};
        background-color: ${Colors.background.border};
        box-shadow: inset 0px 0px 0px ${Border.stroke.medium} ${Colors.accent.pink};
    }
`

const Button = styled(NoStyleButton)<GTButtonProps>`
    box-sizing: border-box;
    display: flex;
    justify-content: center;
    align-items: center;
    gap: ${Spacing._8};
    border-radius: ${Border.radius.small};
    text-align: center;
    width: ${({ fitContent }) => (fitContent ? 'fit-content' : '100%')};
    white-space: ${(props) => (props.wrapText ? 'normal' : 'nowrap')};
    overflow: hidden;
    text-overflow: ellipsis;
    user-select: none;
    font-family: inherit;
    ${({ styleType }) => styleType === 'primary' && PrimaryButtonStyles};
    ${({ styleType }) => styleType === 'secondary' && SecondaryButtonStyles};
    ${({ styleType }) => styleType === 'destructive' && DestructiveButtonStyles};
    ${({ styleType }) => styleType === 'control' && ControlButtonStyles};
    ${({ styleType }) => styleType === 'icon' && IconButtonStyles};
    ${(props) => props.textColor && `color: ${Colors.text[props.textColor]};`}
    &:disabled {
        opacity: 0.5;
        cursor: default;
    }
`
const MarginLeftAuto = styled.div`
    margin-left: auto;
`
interface GTButtonProps extends Omit<React.ButtonHTMLAttributes<HTMLButtonElement>, 'value'> {
    styleType: TButtonType
    wrapText?: boolean
    icon?: IconProp | string
    iconColor?: TIconColor
    iconColorHex?: string
    textColor?: TTextColor
    value?: React.ReactNode
    fitContent?: boolean
    active?: boolean
    isDropdown?: boolean
    asDiv?: boolean
}
const GTButton = ({
    styleType,
    wrapText = false,
    fitContent = true,
    icon,
    iconColor,
    iconColorHex,
    textColor,
    value,
    active,
    isDropdown = false,
    asDiv = false,
    ...rest
}: GTButtonProps) => {
    return (
        <Button
            styleType={styleType}
            wrapText={wrapText}
            fitContent={fitContent}
            textColor={textColor}
            active={active}
            as={asDiv ? 'div' : 'button'}
            {...rest}
        >
            {icon && <Icon icon={icon} color={iconColor} colorHex={iconColorHex} />}
            {value}
            {isDropdown && (
                <MarginLeftAuto>
                    <Icon icon={icons.caret_down_solid} color="gray" />
                </MarginLeftAuto>
            )}
        </Button>
    )
}

export default GTButton
