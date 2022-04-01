import React from 'react'
import styled from 'styled-components/native'
import { KEYBOARD_SHORTCUTS } from '../../constants'
import useKeyboardShortcut from '../../hooks/useKeyboardShortcut'
import { Border, Colors, Typography } from '../../styles'

const KeyboardShortcutContainer = styled.View<{ isPressed: boolean }>`
    border-radius: ${Border.radius.xSmall};
    border: 2px solid ${({ isPressed }) => (isPressed ? Colors.gray._400 : Colors.gray._50)};
    display: flex;
    justify-content: center;
    align-items: center;
    width: 20px;
    height: 20px;
    left: 0px;
    top: 0px;
    background-color: ${Colors.gray._50};
    box-shadow: 0px 1px 3px rgba(0, 0, 0, 0.1);
    margin-right: 12px;
`
const KeyboardShortcutText = styled.Text`
    color: ${Colors.gray._400};
    font-size: ${Typography.xSmall.fontSize}px;
    line-height: ${Typography.xSmall.lineHeight}px;
`

// gets triggered when the lowercase letter is pressed (including with CAPS LOCK, but not when you hit shift+key)
interface KeyboardShortcutProps {
    shortcut: KEYBOARD_SHORTCUTS
    onKeyPress: () => void
    disabled?: boolean
}
export default function KeyboardShortcut({ shortcut, onKeyPress, disabled }: KeyboardShortcutProps): JSX.Element {
    const isKeyDown = useKeyboardShortcut(shortcut, onKeyPress, !!disabled, true)
    return (
        <KeyboardShortcutContainer isPressed={isKeyDown}>
            <KeyboardShortcutText>{shortcut}</KeyboardShortcutText>
        </KeyboardShortcutContainer>
    )
}
