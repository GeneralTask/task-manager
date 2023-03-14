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
        background: ${Colors.background.hover};
    }
    ${({ forceShowHoverEffect }) => (forceShowHoverEffect ? `background: ${Colors.background.hover};` : '')}
`

interface GTIconButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
    icon: TIconType
    iconColor?: TIconColor
    forceShowHoverEffect?: boolean
    tooltipSide?: TTooltipSide
    asDiv?: boolean
}
// note: shortcutName takes precedence over tooltipText
type TooltipProps =
    | { tooltipText: string; shortcutName?: TShortcutName }
    | { tooltipText?: string; shortcutName: TShortcutName }
type GTIconButtonPropsWithTooltip = GTIconButtonProps & TooltipProps
const GTIconButton = forwardRef((props: GTIconButtonPropsWithTooltip, ref: React.Ref<HTMLButtonElement>) => {
    if (props.tooltipText || props.shortcutName)
        return (
            <Tip content={props.tooltipText} shortcutName={props.shortcutName} side={props.tooltipSide}>
                <Button
                    ref={ref}
                    onClick={props.onClick}
                    forceShowHoverEffect={props.forceShowHoverEffect}
                    as={props.asDiv ? 'div' : 'button'}
                    {...props}
                >
                    <Icon icon={props.icon} color={props.iconColor} />
                </Button>
            </Tip>
        )
    return (
        <Button
            ref={ref}
            onClick={props.onClick}
            forceShowHoverEffect={props.forceShowHoverEffect}
            as={props.asDiv ? 'div' : 'button'}
            {...props}
        >
            <Icon icon={props.icon} color={props.iconColor} />
        </Button>
    )
})

export default GTIconButton
