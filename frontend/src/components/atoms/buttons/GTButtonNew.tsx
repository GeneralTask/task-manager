import { IconProp } from '@fortawesome/fontawesome-svg-core'
import styled from 'styled-components'
import { Border } from '../../../styles'
import { TIconColor, TTextColor } from '../../../styles/colors'
import { icons } from '../../../styles/images'
import { Icon } from '../Icon'
import NoStyleButton from './NoStyleButton'

type TButtonType = 'primary' | 'secondary' | 'destructive' | 'control'

const Button = styled(NoStyleButton)<GTButtonProps>`
    display: flex;
    justify-content: center;
    align-items: center;
    border-radius: ${Border.radius.medium};
    text-align: center;
    width: ${({ fitContent }) => (fitContent ? 'fit-content' : '100%')};
    /* ${(props) => props.styleType !== 'simple' && `box-shadow: ${Shadows.deprecated_button.default};`}; */
    white-space: ${(props) => (props.wrapText ? 'normal' : 'nowrap')};
    overflow: hidden;
    text-overflow: ellipsis;
    transition: background 0.05s;
    transition: box-shadow 0.25s;
    user-select: none;
    font-family: inherit;
    box-sizing: border-box;
    /* ${(props) => props.styleType === 'primary' && PrimaryButtonStyles};
    ${(props) => props.styleType === 'secondary' && SecondaryButtonStyles};
    ${(props) => props.styleType === 'simple' && SimpleButtonStyles};
    ${(props) => props.size === 'large' && LargeButtonStyle};
    ${(props) => props.size === 'small' && SmallButtonStyle}; */
    opacity: ${(props) => (props.disabled ? '0.2' : '1')};
    &:hover {
        /* ${(props) =>
            props.disabled &&
            (props.styleType === 'primary' || props.styleType === 'secondary') &&
            `box-shadow: ${Shadows.deprecated_button.default}`};
        ${(props) =>
            props.disabled &&
            `background-color: ${
                props.type === 'primary' ? Colors.button.primary.default : Colors.button.secondary.default
            }`}; */
    }
    /* ${(props) => props.textColor && `color: ${Colors.text[props.textColor]};`} */
    ${(props) => props.disabled && `cursor: default;`}
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
