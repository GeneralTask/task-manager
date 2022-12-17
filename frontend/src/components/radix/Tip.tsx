import React from 'react'
import * as Tooltip from '@radix-ui/react-tooltip'
import styled, { css } from 'styled-components'
import KEYBOARD_SHORTCUTS, { TShortcutName } from '../../constants/shortcuts'
import { Colors, Spacing, Typography } from '../../styles'
import Flex from '../atoms/Flex'
import { KeyboardShortcutContainer } from '../atoms/KeyboardShortcut'
import { MenuContentShared } from './RadixUIConstants'

const TOOLTIP_ARROW_SIZE = 5
const SharedTooltip = css`
    content: '';
    position: absolute;
    width: 0;
    height: 0;
    border: ${TOOLTIP_ARROW_SIZE}px solid transparent;
`

const TooltipContent = styled(Tooltip.Content)`
    ${MenuContentShared};
    padding: ${Spacing._8} ${Spacing._12};
    ${Typography.bodySmall};
    &[data-side='top'] {
        :before {
            ${SharedTooltip};
            bottom: -${TOOLTIP_ARROW_SIZE * 2}px;
            left: 50%;
            margin-left: -${TOOLTIP_ARROW_SIZE}px;
            border-top: ${TOOLTIP_ARROW_SIZE}px solid ${Colors.background.white};
        }
    }
    &[data-side='bottom'] {
        :before {
            ${SharedTooltip};
            top: -${TOOLTIP_ARROW_SIZE * 2}px;
            left: 50%;
            margin-left: -${TOOLTIP_ARROW_SIZE}px;
            border-bottom: ${TOOLTIP_ARROW_SIZE}px solid ${Colors.background.white};
        }
    }
    &[data-side='right'] {
        :before {
            ${SharedTooltip};
            top: 50%;
            left: -${TOOLTIP_ARROW_SIZE * 2}px;
            margin-top: -${TOOLTIP_ARROW_SIZE}px;
            border-right: ${TOOLTIP_ARROW_SIZE}px solid ${Colors.background.white};
        }
    }
    &[data-side='left'] {
        :before {
            ${SharedTooltip};
            top: 50%;
            right: -${TOOLTIP_ARROW_SIZE * 2}px;
            margin-top: -${TOOLTIP_ARROW_SIZE}px;
            border-left: ${TOOLTIP_ARROW_SIZE}px solid ${Colors.background.white};
        }
    }
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
            <Tooltip.Root defaultOpen={false}>
                <Tooltip.Trigger asChild>
                    <span>{children}</span>
                </Tooltip.Trigger>
                <Tooltip.Portal>
                    <TooltipContent side={side} sideOffset={10} align={align}>
                        {tooltipContent}
                    </TooltipContent>
                </Tooltip.Portal>
            </Tooltip.Root>
        </Tooltip.Provider>
    )
}

export default Tip
