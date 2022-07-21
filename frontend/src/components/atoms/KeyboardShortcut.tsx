import { Border, Colors, Shadows, Typography } from '../../styles'

import { KEYBOARD_SHORTCUTS, TKeyboardShortcuts } from '../../constants'
import React from 'react'
import styled from 'styled-components'
import useKeyboardShortcut from '../../hooks/useKeyboardShortcut'

export const KeyboardShortcutContainer = styled.div<{ isPressed: boolean }>`
    border-radius: ${Border.radius.xSmall};
    border: 2px solid ${({ isPressed }) => (isPressed ? Colors.background.dark : Colors.background.light)};
    display: flex;
    justify-content: center;
    align-items: center;
    width: 20px;
    height: 20px;
    background-color: ${Colors.background.light};
    box-shadow: ${Shadows.medium};
    color: ${Colors.text.light};
    font-size: ${Typography.xSmall.fontSize};
    line-height: ${Typography.xSmall.lineHeight};
    user-select: none;
`

// gets triggered when the lowercase letter is pressed (including with CAPS LOCK, but not when you hit shift+key)
interface KeyboardShortcutProps {
    shortcut: TKeyboardShortcuts
    onKeyPress: () => void
    disabled?: boolean
}
export default function KeyboardShortcut({ shortcut, onKeyPress, disabled }: KeyboardShortcutProps): JSX.Element {
    const isKeyDown = useKeyboardShortcut(shortcut, onKeyPress, !!disabled, true)
    return <KeyboardShortcutContainer isPressed={isKeyDown}>{KEYBOARD_SHORTCUTS[shortcut]}</KeyboardShortcutContainer>
}
