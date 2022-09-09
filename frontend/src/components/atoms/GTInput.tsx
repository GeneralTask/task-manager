import React, { forwardRef, useLayoutEffect, useRef, useState } from 'react'
import styled from 'styled-components'
import { Border, Colors, Shadows, Spacing, Typography } from '../../styles'

const StyledInput = styled.input<{ fontSize: 'small' | 'medium' | 'large' }>`
    background-color: inherit;
    color: ${Colors.text.black};
    font: inherit;
    border: none;
    resize: none;
    outline: none;
    overflow: auto;
    padding: ${Spacing._8};
    border-radius: ${Border.radius.small};
    :focus,
    :hover {
        ${({ disabled }) =>
            !disabled &&
            `
            outline: ${Border.stroke.medium} solid ${Colors.border.light};
            box-shadow: ${Shadows.light};
            background-color: ${Colors.background.white};`}
    }
    ${({ fontSize }) => fontSize === 'small' && Typography.bodySmall};
    ${({ fontSize }) => fontSize === 'medium' && Typography.subtitle};
    ${({ fontSize }) => fontSize === 'large' && Typography.title};
`

interface GTInputProps extends React.InputHTMLAttributes<HTMLInputElement> {
    initialValue: string
    onEdit: (newValue: string) => void
    fontSize: 'small' | 'medium' | 'large'
}
const GTInput = forwardRef(({ initialValue, onEdit, fontSize, ...rest }: GTInputProps, ref) => {
    const [inputValue, setInputValue] = useState(initialValue)
    const inputRef = useRef<HTMLInputElement | null>(null)

    const handleKeyDown: React.KeyboardEventHandler<HTMLInputElement> = (e) => {
        if (inputRef.current && (e.key === 'Escape' || e.key === 'Enter')) inputRef.current.blur()
        e.stopPropagation()
    }

    useLayoutEffect(() => {
        setInputValue(initialValue)
    }, [initialValue])

    return (
        <StyledInput
            ref={(node) => {
                inputRef.current = node
                if (typeof ref === 'function') {
                    ref(node)
                } else if (ref !== null) {
                    ref.current = node
                }
            }}
            onKeyDown={handleKeyDown}
            value={inputValue}
            fontSize={fontSize}
            onChange={(e) => {
                setInputValue(e.target.value)
                onEdit(e.target.value)
            }}
            {...rest}
        />
    )
})

export default GTInput
