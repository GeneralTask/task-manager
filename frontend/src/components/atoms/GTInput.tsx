import React, { forwardRef, useRef } from 'react'
import styled from 'styled-components'
import { Border, Colors, Spacing, Typography } from '../../styles'

const StyledInput = styled.input<{ fontSize: 'small' | 'medium' | 'large' }>`
    background-color: inherit;
    color: ${Colors.text.black};
    font: inherit;
    border: ${Border.stroke.medium} solid ${Colors.border.extra_light};
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
            border-color: ${Colors.border.light};
            background-color: ${Colors.background.white};`}
    }
    ${({ fontSize }) => fontSize === 'small' && Typography.bodySmall};
    ${({ fontSize }) => fontSize === 'medium' && Typography.subtitle};
    ${({ fontSize }) => fontSize === 'large' && Typography.title};
`

interface GTInputProps extends Omit<React.InputHTMLAttributes<HTMLInputElement>, 'value' | 'onChange'> {
    value: string
    onChange: (value: string) => void
    fontSize?: 'small' | 'medium' | 'large'
}
const GTInput = forwardRef(({ value, onChange, fontSize = 'small', ...rest }: GTInputProps, ref) => {
    const inputRef = useRef<HTMLInputElement | null>(null)

    const handleKeyDown: React.KeyboardEventHandler<HTMLInputElement> = (e) => {
        if (inputRef.current && (e.key === 'Escape' || e.key === 'Enter')) inputRef.current.blur()
        e.stopPropagation()
    }

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
            value={value}
            fontSize={fontSize}
            onChange={(e) => onChange(e.target.value)}
            {...rest}
        />
    )
})

export default GTInput
