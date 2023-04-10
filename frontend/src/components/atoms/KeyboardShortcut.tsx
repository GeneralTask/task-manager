import styled from 'styled-components'
import KEYBOARD_SHORTCUTS from '../../constants/shortcuts'
import { TShortcutName } from '../../constants/shortcuts'
import { useKeyboardShortcut } from '../../hooks'
import { Border, Colors, Spacing, Typography } from '../../styles'

export const KeyboardShortcutContainer = styled.div<{ isSelected?: boolean }>`
    border-radius: ${Border.radius.small};
    display: flex;
    justify-content: center;
    align-items: center;
    background-color: ${Colors.background.sub};
    color: ${Colors.text.light};
    user-select: none;
    ${Typography.body.medium};
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
