import React, { useLayoutEffect, useRef, useState } from 'react'
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
    width: fit-content;
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

interface GTTextAreaProps extends React.TextareaHTMLAttributes<HTMLInputElement> {
    initialValue: string
    onEdit: (newValue: string) => void
    fontSize: 'small' | 'medium' | 'large'
}
const GTInput = ({ initialValue, onEdit, fontSize, ...rest }: GTTextAreaProps) => {
    const [inputValue, setInputValue] = useState(initialValue)
    const inputRef = useRef<HTMLInputElement>(null)

    const handleKeyDown: React.KeyboardEventHandler<HTMLInputElement> = (e) => {
        if (inputRef.current && e.key === 'Escape') inputRef.current.blur()
        e.stopPropagation()
    }

    useLayoutEffect(() => {
        setInputValue(initialValue)
    }, [initialValue])

    return (
        <StyledInput
            ref={inputRef}
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
}

export default GTInput
