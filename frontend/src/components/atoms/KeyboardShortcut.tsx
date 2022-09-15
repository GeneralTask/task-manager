import styled from 'styled-components'
import { KEYBOARD_SHORTCUTS, TKeyboardShortcuts } from '../../constants'
import { useKeyboardShortcut } from '../../hooks'
import { Border, Colors, Typography } from '../../styles'

export const KeyboardShortcutContainer = styled.div<{ isPressed?: boolean }>`
    border-radius: ${Border.radius.mini};
    display: flex;
    justify-content: center;
    align-items: center;
    width: 20px;
    height: 20px;
    background-color: ${(props) => (props.isPressed ? Colors.background.medium : Colors.background.medium)};
    color: ${Colors.text.light};
    user-select: none;
    ${Typography.bodySmall};
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
