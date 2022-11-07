import { ReactElement, forwardRef, useEffect } from 'react'
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
    shortcutName?: TShortcutName
    asDiv?: boolean
}
const GTIconButton = forwardRef(
    (
        { icon, iconColor, forceShowHoverEffect, shortcutName, asDiv = false, onClick, ...props }: GTIconButtonProps,
        ref: React.Ref<HTMLButtonElement>
    ) => {
        useEffect(() => {
            if (shortcutName) ReactTooltip.rebuild()
        }, [shortcutName])

        const Wrapper = ({ children }: { children: ReactElement }) =>
            shortcutName ? (
                <TooltipWrapper
                    inline
                    dataTip={
                        <TooltipContainer>
                            {KEYBOARD_SHORTCUTS[shortcutName].label}
                            {KEYBOARD_SHORTCUTS[shortcutName].keyLabel.split('+').map((keyLabel) => (
                                <KeyboardShortcutContainer key={keyLabel}>{keyLabel}</KeyboardShortcutContainer>
                            ))}
                        </TooltipContainer>
                    }
                    tooltipId="tooltip"
                >
                    {children}
                </TooltipWrapper>
            ) : (
                <>{children}</>
            )

        return (
            <Wrapper>
                <Button
                    ref={ref}
                    onClick={onClick}
                    forceShowHoverEffect={forceShowHoverEffect}
                    as={asDiv ? 'div' : 'button'}
                    {...props}
                >
                    <Icon icon={icon} color={iconColor} />
                </Button>
            </Wrapper>
        )
    }
)

export default GTIconButton
