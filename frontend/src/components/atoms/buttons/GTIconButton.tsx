import { forwardRef, useEffect } from 'react'
import ReactDOMServer from 'react-dom/server'
import ReactTooltip from 'react-tooltip'
import styled from 'styled-components'
import KEYBOARD_SHORTCUTS, { TShortcutName } from '../../../constants/shortcuts'
import { Colors, Spacing } from '../../../styles'
import { TIconColor } from '../../../styles/colors'
import { Icon, TIconType } from '../Icon'
import { KeyboardShortcutContainer } from '../KeyboardShortcut'
import TooltipWrapper from '../TooltipWrapper'
import NoStyleButton from './NoStyleButton'

const Button = styled(NoStyleButton)<{ forceShowHoverEffect?: boolean; active?: boolean }>`
    padding: ${Spacing._8};
    border-radius: 50%;
    :hover {
        background: ${Colors.background.dark};
    }
    ${({ forceShowHoverEffect }) => (forceShowHoverEffect ? `background: ${Colors.background.dark};` : '')}
`
const TooltipContainer = styled.div`
    display: flex;
    flex-direction: row;
    align-items: center;
    justify-content: center;
    gap: ${Spacing._8};
`

interface GTIconButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
    icon: TIconType
    iconColor?: TIconColor
    forceShowHoverEffect?: boolean
    tooltipText?: string // note: shortcutName takes precedence over tooltipText
    shortcutName?: TShortcutName
    asDiv?: boolean
    className?: string
}
const GTIconButton = forwardRef(
    (
        {
            icon,
            iconColor,
            forceShowHoverEffect,
            tooltipText,
            shortcutName,
            asDiv = false,
            onClick,
            className,
            ...props
        }: GTIconButtonProps,
        ref: React.Ref<HTMLButtonElement>
    ) => {
        const toolTipTextToUse = shortcutName ? (
            <>
                {KEYBOARD_SHORTCUTS[shortcutName].label}
                {KEYBOARD_SHORTCUTS[shortcutName].keyLabel.split('+').map((keyLabel) => (
                    <KeyboardShortcutContainer key={keyLabel}>{keyLabel}</KeyboardShortcutContainer>
                ))}
            </>
        ) : (
            tooltipText
        )
        const tooltipData =
            (shortcutName || tooltipText) &&
            ReactDOMServer.renderToString(<TooltipContainer>{toolTipTextToUse}</TooltipContainer>)

        useEffect(() => {
            if (tooltipData) ReactTooltip.rebuild()
        }, [tooltipData])

        if (tooltipData)
            return (
                <TooltipWrapper inline dataTip={tooltipData} tooltipId="tooltip">
                    <Button
                        ref={ref}
                        onClick={onClick}
                        forceShowHoverEffect={forceShowHoverEffect}
                        as={asDiv ? 'div' : 'button'}
                        className={className}
                        {...props}
                    >
                        <Icon icon={icon} color={iconColor} />
                    </Button>
                </TooltipWrapper>
            )
        return (
            <Button
                ref={ref}
                onClick={onClick}
                forceShowHoverEffect={forceShowHoverEffect}
                as={asDiv ? 'div' : 'button'}
                className={className}
                {...props}
            >
                <Icon icon={icon} color={iconColor} />
            </Button>
        )
    }
)

export default GTIconButton
