import { useCallback, useEffect, useRef, useState } from 'react'
import styled from 'styled-components'
import KEYBOARD_SHORTCUTS, { TShortcutName } from '../../constants/shortcuts'
import { useKeyboardShortcut } from '../../hooks'
import { Border, Colors, Dimensions, Spacing, Typography } from '../../styles'
import { icons } from '../../styles/images'
import { stopKeydownPropogation } from '../../utils/utils'
import { Icon } from '../atoms/Icon'
import Tip from '../radix/Tip'

export const CreateNewItemInputContainer = styled.div`
    display: flex;
    flex-shrink: 0;
    flex-direction: row;
    gap: ${Spacing._8};
    background-color: ${Colors.background.medium};
    height: ${Dimensions.TASK_HEIGHT};
    align-items: center;
    padding: 0px ${Spacing._8};
    border-radius: ${Border.radius.mini};
    box-sizing: border-box;
    border: ${Border.stroke.medium} solid transparent;
    :focus-within {
        border: ${Border.stroke.medium} solid ${Colors.border.purple};
    }
    margin-bottom: ${Spacing._8};
`
export const TaskInput = styled.input`
    border: none;
    outline: none;
    background-color: transparent;
    flex: 1;
    ${Typography.bodySmall};
`

const blurShortcuts = [KEYBOARD_SHORTCUTS.close.key]

interface CreateNewItemInputProps {
    initialValue?: string
    placeholder: string
    shortcutName?: TShortcutName
    autoFocus?: boolean
    onChange?: (text: string) => void
    onSubmit?: (text: string) => void
}
const CreateNewItemInput = ({
    initialValue = '',
    placeholder,
    shortcutName,
    autoFocus,
    onChange,
    onSubmit,
}: CreateNewItemInputProps) => {
    const [text, setText] = useState(initialValue)
    const [shouldFocus, setShouldFocus] = useState(autoFocus ?? false)
    const inputRef = useRef<HTMLInputElement>(null)

    const handleKeyDown = (e: React.KeyboardEvent) => {
        stopKeydownPropogation(e, blurShortcuts)
        if (blurShortcuts.includes(e.key)) {
            inputRef.current?.blur()
        }
        const trimmedText = text.trim()
        if (onSubmit && e.key === 'Enter' && trimmedText !== '') {
            setText('')
            onSubmit(trimmedText)
        }
    }

    useEffect(() => {
        if (shouldFocus) {
            inputRef.current?.focus()
            setShouldFocus(false)
        }
    }, [shouldFocus])

    useKeyboardShortcut(
        shortcutName ?? 'createTask', // shortcut will be disabled if shortcutName is undefined
        useCallback(() => setShouldFocus(true), []),
        !shortcutName
    )

    return (
        <Tip shortcutName={shortcutName} side="top" align="end" disabled={!shortcutName}>
            <CreateNewItemInputContainer>
                <Icon icon={icons.plus} />
                <TaskInput
                    ref={inputRef}
                    value={text}
                    placeholder={placeholder}
                    onKeyDown={handleKeyDown}
                    onChange={(e) => {
                        setText(e.target.value)
                        onChange?.(e.target.value)
                    }}
                />
            </CreateNewItemInputContainer>
        </Tip>
    )
}

export default CreateNewItemInput
