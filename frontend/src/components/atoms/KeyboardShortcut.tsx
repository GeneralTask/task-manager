import { Border, Colors, Shadows, Typography } from '../../styles'

import { KEYBOARD_SHORTCUTS, TKeyboardShortcuts } from '../../constants'
import React from 'react'
import styled from 'styled-components'
import useKeyboardShortcut from '../../hooks/useKeyboardShortcut'

export const KeyboardShortcutContainer = styled.div<{ isPressed: boolean }>`
    border-radius: ${Border.radius.small};
    border: ${Border.stroke.large} solid ${(props) => (props.isPressed ? Colors.border.gray : 'transparent')};
    display: flex;
    justify-content: center;
    align-items: center;
    width: 20px;
    height: 20px;
    background-color: ${Colors.background.light};
    box-shadow: ${Shadows.medium};
    color: ${Colors.text.light};
    user-select: none;
    ${Typography.body};
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
