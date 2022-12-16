import React from 'react'
import * as Tooltip from '@radix-ui/react-tooltip'
import styled from 'styled-components'
import KEYBOARD_SHORTCUTS, { TShortcutName } from '../../constants/shortcuts'
import { Colors, Spacing, Typography } from '../../styles'
import Flex from '../atoms/Flex'
import { KeyboardShortcutContainer } from '../atoms/KeyboardShortcut'
import { MenuContentShared } from './RadixUIConstants'

const TooltipContent = styled(Tooltip.Content)`
    ${MenuContentShared};
    padding: ${Spacing._8} ${Spacing._12};
    ${Typography.bodySmall};
    :before {
        content: '';
        position: absolute;
        width: 0;
        height: 0;
        border-style: solid;
        border-bottom: 10px solid ${Colors.background.white};
        border-top: 10px solid transparent;
        border-left: 10px solid transparent;
        border-right: 10px solid transparent;
        bottom: -20px;
        left: 50%;
        margin-left: -5px;
        transform: rotate(180deg);
    }
`
const TooltipArrow = styled(Tooltip.Arrow)`
    fill: ${Colors.background.white};
`

export type TTooltipSide = 'top' | 'right' | 'bottom' | 'left'
export type TTooltipAlign = 'start' | 'center' | 'end'

interface TooltipProps {
    content?: React.ReactNode
    shortcutName?: TShortcutName
    overrideShortcutLabel?: string
    overrideShortcut?: string
    side?: TTooltipSide
    align?: TTooltipAlign
    children?: React.ReactNode
    disabled?: boolean
}
const Tip = ({
    content,
    shortcutName,
    overrideShortcutLabel,
    overrideShortcut,
    side,
    align,
    children,
    disabled,
}: TooltipProps) => {
    if (disabled) return <>{children}</>

    const shortcutLabel = overrideShortcutLabel ?? (shortcutName ? KEYBOARD_SHORTCUTS[shortcutName].label : null)
    const shortcut = overrideShortcut ?? (shortcutName ? KEYBOARD_SHORTCUTS[shortcutName].keyLabel : null)

    const tooltipContent =
        shortcutLabel || shortcut ? (
            <Flex alignItems="center" justifyContent="center" gap={Spacing._8}>
                {shortcutLabel}
                {shortcut?.split('+').map((keyLabel) => (
                    <KeyboardShortcutContainer key={keyLabel}>{keyLabel}</KeyboardShortcutContainer>
                ))}
            </Flex>
        ) : (
            content
        )

    return (
        <Tooltip.Provider delayDuration={250} skipDelayDuration={1000}>
            <Tooltip.Root open defaultOpen={true}>
                <Tooltip.Trigger asChild>
                    <span>{children}</span>
                </Tooltip.Trigger>
                <Tooltip.Portal>
                    <TooltipContent side={side} align={align}>
                        {tooltipContent}
                    </TooltipContent>
                </Tooltip.Portal>
            </Tooltip.Root>
        </Tooltip.Provider>
    )
}

export default Tip
