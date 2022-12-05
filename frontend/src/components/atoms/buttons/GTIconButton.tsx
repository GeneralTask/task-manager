import { forwardRef } from 'react'
import styled from 'styled-components'
import { TShortcutName } from '../../../constants/shortcuts'
import { Colors, Spacing } from '../../../styles'
import { TIconColor } from '../../../styles/colors'
import Tip, { TTooltipSide } from '../../radix/Tip'
import { Icon, TIconType } from '../Icon'
import NoStyleButton from './NoStyleButton'

const Button = styled(NoStyleButton)<{ forceShowHoverEffect?: boolean; active?: boolean }>`
    padding: ${Spacing._8};
    border-radius: 50%;
    :hover {
        background: ${Colors.background.dark};
    }
    ${({ forceShowHoverEffect }) => (forceShowHoverEffect ? `background: ${Colors.background.dark};` : '')}
`

interface GTIconButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
    icon: TIconType
    iconColor?: TIconColor
    forceShowHoverEffect?: boolean
    tooltipText?: string // note: shortcutName takes precedence over tooltipText
    tooltipSide?: TTooltipSide
    shortcutName?: TShortcutName
    asDiv?: boolean
}
const GTIconButton = forwardRef(
    (
        {
            icon,
            iconColor,
            forceShowHoverEffect,
            tooltipText,
            tooltipSide,
            shortcutName,
            asDiv = false,
            onClick,
            ...props
        }: GTIconButtonProps,
        ref: React.Ref<HTMLButtonElement>
    ) => {
        if (tooltipText || shortcutName)
            return (
                <Tip content={tooltipText} shortcutName={shortcutName} side={tooltipSide}>
                    <Button
                        ref={ref}
                        onClick={onClick}
                        forceShowHoverEffect={forceShowHoverEffect}
                        as={asDiv ? 'div' : 'button'}
                        {...props}
                    >
                        <Icon icon={icon} color={iconColor} />
                    </Button>
                </Tip>
            )
        return (
            <Button
                ref={ref}
                onClick={onClick}
                forceShowHoverEffect={forceShowHoverEffect}
                as={asDiv ? 'div' : 'button'}
                {...props}
            >
                <Icon icon={icon} color={iconColor} />
            </Button>
        )
    }
)

export default GTIconButton
