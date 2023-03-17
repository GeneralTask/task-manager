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
    &:active:enabled,
    &:focus:enabled,
    &[data-state='open'] {
        background-color: ${Colors.control.primary.highlight};
        outline: ${Border.stroke.large} solid ${Colors.control.primary.hover};
        outline-offset: -${Border.stroke.large};
    }
    &:hover:enabled {
        background-color: ${Colors.control.primary.hover};
    }
`
const SecondaryButtonStyles = css<GTButtonProps>`
    ${Typography.title.small};
    padding: ${Spacing._8} ${Spacing._16};
    color: ${Colors.control.secondary.label};
    background-color: ${Colors.control.secondary.bg};
    outline: ${Border.stroke.medium} solid ${Colors.control.secondary.stroke};
    outline-offset: -${Border.stroke.medium};
    &:active:enabled,
    &:focus:enabled,
    &[data-state='open'] {
        background-color: ${Colors.control.secondary.bg};
        outline: ${Border.stroke.large} solid ${Colors.control.secondary.highlight};
        outline-offset: -${Border.stroke.large};
    }
    &:hover:enabled {
        background-color: ${Colors.control.secondary.hover};
        outline: ${Border.stroke.medium} solid ${Colors.control.secondary.stroke};
        outline-offset: -${Border.stroke.medium};
    }
`
const DestructiveButtonStyles = css<GTButtonProps>`
    ${Typography.title.small};
    padding: ${Spacing._8} ${Spacing._16};
    color: ${Colors.control.destructive.label};
    background-color: ${Colors.control.destructive.bg};
    &:active:enabled,
    &:focus:enabled,
    &[data-state='open'] {
        background-color: ${Colors.control.destructive.highlight};
        outline: ${Border.stroke.medium} solid ${Colors.control.destructive.hover};
        outline-offset: -${Border.stroke.medium};
    }
    &:hover:enabled {
        background-color: ${Colors.control.destructive.hover};
    }
`
const ControlButtonStyles = css<GTButtonProps>`
    ${Typography.label.small};
    padding: ${Spacing._4} ${Spacing._8};
    color: ${Colors.text.muted};
    &:active:enabled,
    &:focus:enabled,
    &[data-state='open'] {
        color: ${Colors.text.base};
        outline: ${Border.stroke.medium} solid ${Colors.background.hover};
        outline-offset: -${Border.stroke.medium};
    }
    &:hover:enabled {
        color: ${Colors.text.base};
        background-color: ${Colors.background.border};
    }
`
const IconButtonStyles = css<GTButtonProps>`
    ${Typography.label.small};
    padding: ${Spacing._4};
    color: ${Colors.text.muted};
    &:active:enabled,
    &:focus:enabled,
    &[data-state='open'] {
        color: ${Colors.text.base};
        outline: ${Border.stroke.medium} solid ${Colors.background.hover};
        outline-offset: -${Border.stroke.medium};
    }
    &:hover:enabled {
        color: ${Colors.text.base};
        background-color: ${Colors.background.border};
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
    ${(props) => props.textColor && `color: ${Colors.text[props.textColor]} !important;`}
    &:disabled {
        opacity: 0.5;
        ${({ overrideDisabledStyle }) => overrideDisabledStyle && 'opacity: 1;'}
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
    overrideDisabledStyle?: boolean
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
