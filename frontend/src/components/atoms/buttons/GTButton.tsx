import { IconProp } from '@fortawesome/fontawesome-svg-core'
import styled, { css } from 'styled-components'
import { Border, Colors, Shadows, Spacing, Typography } from '../../../styles'
import { TIconColor, TTextColor } from '../../../styles/colors'
import { icons } from '../../../styles/images'
import { Icon } from '../Icon'
import NoStyleButton from './NoStyleButton'

type TButtonStyle = 'primary' | 'secondary' | 'simple'
type TButtonSize = 'small' | 'large'

const PrimaryButtonStyles = css`
    background-color: ${Colors.button.primary.default};
    color: ${Colors.text.white};
    &:hover {
        box-shadow: ${Shadows.button.hover};
        background-color: ${Colors.button.primary.hover};
    }
    &:active {
        box-shadow: ${Shadows.button.active};
        color: ${Colors.button.primary.active_text};
    }
`
const SecondaryButtonStyles = css`
    background-color: ${Colors.button.secondary.default};
    color: ${Colors.text.black};
    &:hover {
        box-shadow: ${Shadows.button.hover};
        background-color: ${Colors.button.secondary.hover};
    }
    &:active {
        box-shadow: ${Shadows.button.active};
        color: ${Colors.button.secondary.active_text};
    }
`
const SimpleButtonStyles = css<{ active?: boolean; disabled?: boolean }>`
    background-color: inherit;
    color: ${Colors.text.light};
    &:hover {
        ${({ disabled }) => !disabled && `outline: ${Border.stroke.small} solid ${Colors.background.border};`}
    }
    &:active {
        background-color: ${Colors.background.light};
        outline: ${Border.stroke.small} solid ${Colors.background.border};
    }
    ${({ active }) =>
        active &&
        `background-color: ${Colors.background.light};
        outline: ${Border.stroke.small} solid ${Colors.background.border};`}
    ${Typography.label};
`
const LargeButtonStyle = css`
    padding: ${Spacing._8} ${Spacing._16};
    gap: ${Spacing._8};
    ${Typography.body};
`
const SmallButtonStyle = css`
    padding: ${Spacing._4} ${Spacing._8};
    gap: ${Spacing._8};
    ${Typography.bodySmall};
`

const Button = styled(NoStyleButton)<{
    styleType: TButtonStyle
    wrapText: boolean
    fitContent: boolean
    size: TButtonSize
    textColor?: TTextColor
    active?: boolean
}>`
    display: flex;
    justify-content: center;
    align-items: center;
    border-radius: ${Border.radius.small};
    text-align: center;
    width: ${({ fitContent }) => (fitContent ? 'fit-content' : '100%')};
    ${(props) => props.styleType !== 'simple' && `box-shadow: ${Shadows.button.default};`};
    white-space: ${(props) => (props.wrapText ? 'normal' : 'nowrap')};
    overflow: hidden;
    text-overflow: ellipsis;
    transition: background 0.05s;
    transition: box-shadow 0.25s;
    user-select: none;
    font-family: inherit;
    box-sizing: border-box;
    ${(props) => props.styleType === 'primary' && PrimaryButtonStyles};
    ${(props) => props.styleType === 'secondary' && SecondaryButtonStyles};
    ${(props) => props.styleType === 'simple' && SimpleButtonStyles};
    ${(props) => props.size === 'large' && LargeButtonStyle};
    ${(props) => props.size === 'small' && SmallButtonStyle};
    opacity: ${(props) => (props.disabled ? '0.2' : '1')};
    &:hover {
        ${(props) =>
            props.disabled &&
            (props.styleType === 'primary' || props.styleType === 'secondary') &&
            `box-shadow: ${Shadows.button.default}`};
        ${(props) =>
            props.disabled &&
            `background-color: ${
                props.styleType === 'primary' ? Colors.button.primary.default : Colors.button.secondary.default
            }`};
    }
    ${(props) => props.textColor && `color: ${Colors.text[props.textColor]};`}
    ${(props) => props.disabled && `cursor: default;`}
`
const MarginLeftAuto = styled.div`
    margin-left: auto;
`

interface GTButtonProps extends Omit<React.ButtonHTMLAttributes<HTMLButtonElement>, 'value'> {
    styleType?: TButtonStyle
    size?: TButtonSize
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
    styleType = 'primary',
    size = 'large',
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
            size={size}
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
