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
    background-color: ${Colors.background.sub};
    height: ${Dimensions.TASK_HEIGHT};
    align-items: center;
    padding: 0px ${Spacing._8};
    border-radius: ${Border.radius.small};
    box-sizing: border-box;
    border: ${Border.stroke.medium} solid transparent;
    :focus-within {
        border: ${Border.stroke.medium} solid ${Colors.legacyColors.purple};
    }
    margin-bottom: ${Spacing._16};
    transition: border var(--animate-border-easing);
`
export const TaskInput = styled.input`
    border: none;
    outline: none;
    background-color: transparent;
    flex: 1;
    ${Typography.deprecated_bodySmall};
`

const blurShortcuts = [KEYBOARD_SHORTCUTS.close.key]

interface CreateNewItemInputProps {
    initialValue?: string
    placeholder: string
    shortcutName?: TShortcutName
    autoFocus?: boolean
    hideIcon?: boolean
    onChange?: (text: string) => void
    onSubmit?: (text: string) => void
    onBlur?: () => void
}
const CreateNewItemInput = ({
    initialValue = '',
    placeholder,
    shortcutName,
    autoFocus,
    hideIcon,
    onChange,
    onSubmit,
    onBlur,
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
        shortcutName,
        useCallback(() => setShouldFocus(true), []),
        !shortcutName
    )

    return (
        <Tip shortcutName={shortcutName} side="top" disabled={!shortcutName}>
            <CreateNewItemInputContainer>
                {!hideIcon && <Icon icon={icons.plus} />}
                <TaskInput
                    ref={inputRef}
                    value={text}
                    placeholder={placeholder}
                    onKeyDown={handleKeyDown}
                    onChange={(e) => {
                        setText(e.target.value)
                        onChange?.(e.target.value)
                    }}
                    data-autofocus={autoFocus}
                    onBlur={onBlur}
                />
            </CreateNewItemInputContainer>
        </Tip>
    )
}

export default CreateNewItemInput
