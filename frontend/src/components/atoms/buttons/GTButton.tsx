import React from 'react'
import { IconProp } from '@fortawesome/fontawesome-svg-core'
import styled, { css } from 'styled-components'
import { TShortcutName } from '../../../constants/shortcuts'
import { Border, Colors, Spacing, Typography } from '../../../styles'
import { TIconColor, TTextColor } from '../../../styles/colors'
import Tip, { TTooltipSide } from '../../radix/Tip'
import { Icon } from '../Icon'
import NoStyleButton from './NoStyleButton'

type TButtonType = 'primary' | 'secondary' | 'destructive' | 'control' | 'icon'

const PrimaryButtonStyles = css<GTButtonProps>`
    ${Typography.title.small};
    padding: ${Spacing._8} ${Spacing._16};
    color: ${Colors.control.primary.label};
    background-color: ${Colors.control.primary.bg};
    &:hover:enabled {
        background-color: ${Colors.control.primary.hover};
    }
    &:active:enabled,
    &:focus:enabled {
        background-color: ${Colors.control.primary.highlight};
        box-shadow: inset 0px 0px 0px ${Border.stroke.large} ${Colors.control.primary.hover};
    }
    ${({ active }) =>
        active &&
        css`
            background-color: ${Colors.control.primary.highlight};
            box-shadow: inset 0px 0px 0px ${Border.stroke.large} ${Colors.control.primary.hover};
        `}
`
const SecondaryButtonStyles = css<GTButtonProps>`
    ${Typography.title.small};
    padding: ${Spacing._8} ${Spacing._16};
    color: ${Colors.control.secondary.label};
    background-color: ${Colors.control.secondary.bg};
    box-shadow: inset 0px 0px 0px ${Border.stroke.medium} ${Colors.control.secondary.stroke};
    &:hover:enabled {
        background-color: ${Colors.control.secondary.hover};
        box-shadow: inset 0px 0px 0px ${Border.stroke.medium} ${Colors.control.secondary.stroke};
    }
    &:active:enabled,
    &:focus:enabled {
        background-color: ${Colors.control.secondary.bg};
        box-shadow: inset 0px 0px 0px ${Border.stroke.large} ${Colors.control.secondary.highlight};
    }
    ${({ active }) =>
        active &&
        css`
            background-color: ${Colors.control.secondary.bg};
            box-shadow: inset 0px 0px 0px ${Border.stroke.large} ${Colors.control.secondary.highlight};
        `}
`
const DestructiveButtonStyles = css<GTButtonProps>`
    ${Typography.title.small};
    padding: ${Spacing._8} ${Spacing._16};
    color: ${Colors.control.destructive.label};
    background-color: ${Colors.control.destructive.bg};
    &:hover:enabled {
        background-color: ${Colors.control.destructive.hover};
    }
    &:active:enabled,
    &:focus:enabled {
        background-color: ${Colors.control.destructive.highlight};
        box-shadow: inset 0px 0px 0px ${Border.stroke.medium} ${Colors.control.destructive.hover};
    }
    ${({ active }) =>
        active &&
        css`
            background-color: ${Colors.control.destructive.highlight};
            box-shadow: inset 0px 0px 0px ${Border.stroke.medium} ${Colors.control.destructive.hover};
        `}
`
const ControlButtonStyles = css<GTButtonProps>`
    ${Typography.label.small};
    padding: ${Spacing._4} ${Spacing._8};
    color: ${Colors.text.muted};
    &:hover:enabled {
        color: ${Colors.text.base};
        background-color: ${Colors.background.border};
    }
    &:active:enabled,
    &:focus:enabled {
        color: ${Colors.text.base};
        box-shadow: inset 0px 0px 0px ${Border.stroke.medium} ${Colors.background.hover};
    }
    ${({ active }) =>
        active &&
        css`
            color: ${Colors.text.base};
            box-shadow: inset 0px 0px 0px ${Border.stroke.medium} ${Colors.background.hover};
        `}
`
const IconButtonStyles = css<GTButtonProps>`
    ${Typography.label.small};
    padding: ${Spacing._4};
    color: ${Colors.text.muted};
    &:hover:enabled {
        color: ${Colors.text.base};
        background-color: ${Colors.background.border};
    }
    &:active:enabled,
    &:focus:enabled {
        color: ${Colors.text.base};
        box-shadow: inset 0px 0px 0px ${Border.stroke.medium} ${Colors.background.hover};
    }
    ${({ active }) =>
        active &&
        css`
            color: ${Colors.text.base};
            box-shadow: inset 0px 0px 0px ${Border.stroke.medium} ${Colors.background.hover};
        `}
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
    white-space: nowrap;
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
    // style
    styleType: TButtonType
    // text
    value?: React.ReactNode
    textColor?: TTextColor
    // left icon
    icon?: IconProp | string
    iconColor?: TIconColor
    iconColorHex?: string
    // right icon
    rightIcon?: IconProp | string
    rightIconColor?: TIconColor
    rightIconColorHex?: string
    // tooltip
    shortcutName?: TShortcutName
    overrideShortcut?: string
    overrideShortcutLabel?: string
    tooltipText?: string
    tooltipSide?: TTooltipSide
    // misc
    fitContent?: boolean
    active?: boolean
}
const GTButton = React.forwardRef((props: GTButtonProps, ref: React.Ref<HTMLButtonElement>) => {
    const { value, fitContent, ...rest } = props
    const button = (
        <Button fitContent={fitContent ?? true} ref={ref} {...rest}>
            {props.icon && <Icon icon={props.icon} color={props.iconColor} colorHex={props.iconColorHex} />}
            {props.styleType !== 'icon' ? value : ''}
            {props.rightIcon && props.styleType !== 'icon' && (
                <MarginLeftAuto>
                    <Icon icon={props.rightIcon} color={props.rightIconColor} colorHex={props.rightIconColorHex} />
                </MarginLeftAuto>
            )}
        </Button>
    )
    if (props.tooltipText || props.shortcutName) {
        return (
            <Tip
                content={props.tooltipText}
                shortcutName={props.shortcutName}
                side={props.tooltipSide}
                overrideShortcut={props.overrideShortcut}
                overrideShortcutLabel={props.overrideShortcutLabel}
            >
                {button}
            </Tip>
        )
    }
    return button
})

export default GTButton
