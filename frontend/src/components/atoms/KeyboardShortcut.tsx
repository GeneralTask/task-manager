import styled from 'styled-components'
import { KEYBOARD_SHORTCUTS, TKeyboardShortcuts } from '../../constants'
import { useKeyboardShortcut } from '../../hooks'
import { Border, Colors, Typography } from '../../styles'

export const KeyboardShortcutContainer = styled.div<{ isSelected?: boolean }>`
    border-radius: ${Border.radius.mini};
    display: flex;
    justify-content: center;
    align-items: center;
    background-color: ${Colors.background.medium};
    color: ${Colors.text.light};
    user-select: none;
    ${Typography.bodySmall};
    padding: 0 ${Spacing._8};
`

// gets triggered when the lowercase letter is pressed (including with CAPS LOCK, but not when you hit shift+key)
interface KeyboardShortcutProps {
    shortcut: TShortcutName
    onKeyPress: () => void
    disabled?: boolean
}
export default function KeyboardShortcut({ shortcut, onKeyPress, disabled }: KeyboardShortcutProps): JSX.Element {
    useKeyboardShortcut(shortcut, onKeyPress, !!disabled)
    return <KeyboardShortcutContainer>{KEYBOARD_SHORTCUTS[shortcut].keyLabel}</KeyboardShortcutContainer>
}
