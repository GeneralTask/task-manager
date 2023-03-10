import React from 'react'
import { IconProp } from '@fortawesome/fontawesome-svg-core'
import styled, { css } from 'styled-components'
import { Border, Colors, Spacing, Typography } from '../../../styles'
import { TIconColor, TTextColor } from '../../../styles/colors'
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
    &:active:enabled {
        background-color: ${Colors.control.primary.highlight};
        box-shadow: inset 0px 0px 0px ${Border.stroke.medium} ${Colors.control.primary.hover};
    }
    ${({ active }) =>
        active
            ? css`
                  background-color: ${Colors.control.primary.highlight};
                  box-shadow: inset 0px 0px 0px ${Border.stroke.medium} ${Colors.control.primary.hover};
              `
            : ''}
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
    &:active:enabled {
        background-color: ${Colors.control.secondary.hover};
        box-shadow: inset 0px 0px 0px ${Border.stroke.medium} ${Colors.control.secondary.highlight};
    }
    ${({ active }) =>
        active
            ? css`
                  background-color: ${Colors.control.secondary.hover};
                  box-shadow: inset 0px 0px 0px ${Border.stroke.medium} ${Colors.control.secondary.highlight};
              `
            : ''}
`
const DestructiveButtonStyles = css<GTButtonProps>`
    ${Typography.title.small};
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
    ${({ active }) =>
        active
            ? css`
                  background-color: ${Colors.control.destructive.highlight};
                  box-shadow: inset 0px 0px 0px ${Border.stroke.medium} ${Colors.control.destructive.hover};
              `
            : ''}
`
const ControlButtonStyles = css<GTButtonProps>`
    ${Typography.label.small};
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
    ${({ active }) =>
        active
            ? css`
                  color: ${Colors.text.base};
                  background-color: ${Colors.background.border};
                  box-shadow: inset 0px 0px 0px ${Border.stroke.medium} ${Colors.accent.pink};
              `
            : ''}
`
const IconButtonStyles = css<GTButtonProps>`
    ${Typography.label.small};
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
    ${({ active }) =>
        active
            ? css`
                  color: ${Colors.text.base};
                  background-color: ${Colors.background.border};
                  box-shadow: inset 0px 0px 0px ${Border.stroke.medium} ${Colors.accent.pink};
              `
            : ''}
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
    ${({ styleType }) =>
        styleType === 'primary'
            ? PrimaryButtonStyles
            : styleType === 'secondary'
            ? SecondaryButtonStyles
            : styleType === 'destructive'
            ? DestructiveButtonStyles
            : styleType === 'control'
            ? ControlButtonStyles
            : styleType === 'icon'
            ? IconButtonStyles
            : undefined};
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
    // misc
    fitContent?: boolean
    active?: boolean
}
const GTButton = React.forwardRef(
    (
        {
            styleType,
            value,
            textColor,
            icon,
            iconColor,
            iconColorHex,
            rightIcon,
            rightIconColor,
            rightIconColorHex,
            fitContent = true,
            active,
            ...rest
        }: GTButtonProps,
        ref: React.Ref<HTMLButtonElement>
    ) => {
        return (
            <Button
                styleType={styleType}
                fitContent={fitContent}
                textColor={textColor}
                active={active}
                ref={ref}
                {...rest}
            >
                {icon && <Icon icon={icon} color={iconColor} colorHex={iconColorHex} />}
                {value}
                {rightIcon && (
                    <MarginLeftAuto>
                        <Icon icon={rightIcon} color={rightIconColor} colorHex={rightIconColorHex} />
                    </MarginLeftAuto>
                )}
            </Button>
        )
    }
)

export default GTButton
