import React from 'react'
import * as Tooltip from '@radix-ui/react-tooltip'
import styled, { css } from 'styled-components'
import KEYBOARD_SHORTCUTS, { TShortcutName } from '../../constants/shortcuts'
import { Colors, Spacing, Typography } from '../../styles'
import Flex from '../atoms/Flex'
import { KeyboardShortcutContainer } from '../atoms/KeyboardShortcut'
import { MenuContentShared } from './RadixUIConstants'

const SharedTooltip = css`
    content: '';
    position: absolute;
    width: 0;
    height: 0;
    border: 5px solid transparent;
`

const TooltipContent = styled(Tooltip.Content)`
    ${MenuContentShared};
    padding: ${Spacing._8} ${Spacing._12};
    ${Typography.bodySmall};
    &[data-side='top'] {
        :before {
            ${SharedTooltip};
            bottom: -10px;
            left: 50%;
            margin-left: -5px;
            border-top: 5px solid ${Colors.background.white};
        }
    }
    &[data-side='bottom'] {
        :before {
            ${SharedTooltip};
            top: -10px;
            left: 50%;
            margin-left: -5px;
            border-bottom: 5px solid ${Colors.background.white};
        }
    }
    &[data-side='right'] {
        :before {
            ${SharedTooltip};
            top: 50%;
            left: -10px;
            margin-top: -5px;
            border-right: 5px solid ${Colors.background.white};
        }
    }
    &[data-side='left'] {
        :before {
            ${SharedTooltip};
            top: 50%;
            right: -10px;
            margin-top: -5px;
            border-left: 5px solid ${Colors.background.white};
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
