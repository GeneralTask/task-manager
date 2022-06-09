import { Border, Colors, Shadows, Typography } from '../../styles'

import { KEYBOARD_SHORTCUTS } from '../../constants'
import React from 'react'
import styled from 'styled-components'
import useKeyboardShortcut from '../../hooks/useKeyboardShortcut'

export const KeyboardShortcutContainer = styled.div<{ isPressed: boolean }>`
    border-radius: ${Border.radius.xSmall};
    border: 2px solid ${({ isPressed }) => (isPressed ? Colors.gray._400 : Colors.gray._50)};
    display: flex;
    justify-content: center;
    align-items: center;
    width: 20px;
    height: 20px;
    background-color: ${Colors.gray._50};
    box-shadow: ${Shadows.medium};
    color: ${Colors.gray._400};
    font-size: ${Typography.xSmall.fontSize};
    line-height: ${Typography.xSmall.lineHeight};
`

// gets triggered when the lowercase letter is pressed (including with CAPS LOCK, but not when you hit shift+key)
interface KeyboardShortcutProps {
    shortcut: KEYBOARD_SHORTCUTS
    onKeyPress: () => void
    disabled?: boolean
}
export default function KeyboardShortcut({ shortcut, onKeyPress, disabled }: KeyboardShortcutProps): JSX.Element {
    const isKeyDown = useKeyboardShortcut(shortcut, onKeyPress, !!disabled, true)
    return <KeyboardShortcutContainer isPressed={isKeyDown}>{shortcut}</KeyboardShortcutContainer>
}
