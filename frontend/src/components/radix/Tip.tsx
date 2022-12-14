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

    const tooltipContent =
        overrideShortcutLabel || overrideShortcut ? (
            <Flex alignItems="center" justifyContent="center" gap={Spacing._8}>
                {overrideShortcutLabel}
                {overrideShortcut?.split('+').map((keyLabel) => (
                    <KeyboardShortcutContainer key={keyLabel}>{keyLabel}</KeyboardShortcutContainer>
                ))}
            </Flex>
        ) : shortcutName ? (
            <Flex alignItems="center" justifyContent="center" gap={Spacing._8}>
                {KEYBOARD_SHORTCUTS[shortcutName].label}
                {KEYBOARD_SHORTCUTS[shortcutName].keyLabel.split('+').map((keyLabel) => (
                    <KeyboardShortcutContainer key={keyLabel}>{keyLabel}</KeyboardShortcutContainer>
                ))}
            </Flex>
        ) : (
            content
        )

    return (
        <Tooltip.Provider delayDuration={250} skipDelayDuration={1000}>
            <Tooltip.Root defaultOpen={false}>
                <Tooltip.Trigger asChild>
                    <span>{children}</span>
                </Tooltip.Trigger>
                <Tooltip.Portal>
                    <TooltipContent sideOffset={5} side={side} align={align}>
                        {tooltipContent}
                        <TooltipArrow />
                    </TooltipContent>
                </Tooltip.Portal>
            </Tooltip.Root>
        </Tooltip.Provider>
    )
}

export default Tip
