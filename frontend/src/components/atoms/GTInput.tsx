import React, { forwardRef, useRef } from 'react'
import styled from 'styled-components'
import { Border, Colors, Spacing, Typography } from '../../styles'
import { icons } from '../../styles/images'
import { Icon } from './Icon'

const Container = styled.div`
    display: flex;
    align-items: center;
    gap: ${Spacing._16};
    padding: ${Spacing._8} ${Spacing._12};
    border: ${Border.stroke.medium} solid ${Colors.border.extra_light};
    border-radius: ${Border.radius.small};
    width: 100%;
`
const StyledInput = styled.input<{ fontSize: 'small' | 'medium' | 'large' }>`
    all: unset;
    width: 100%;
    box-sizing: border-box;
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
    showSearchIcon?: boolean
}
const GTInput = forwardRef(({ value, onChange, fontSize = 'small', showSearchIcon, ...rest }: GTInputProps, ref) => {
    const inputRef = useRef<HTMLInputElement | null>(null)

    const handleKeyDown: React.KeyboardEventHandler<HTMLInputElement> = (e) => {
        if (inputRef.current && (e.key === 'Escape' || e.key === 'Enter')) inputRef.current.blur()
        e.stopPropagation()
    }

    return (
        <Container>
            {showSearchIcon && <Icon icon={icons.magnifying_glass} />}
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
        </Container>
    )
})

export default GTInput
