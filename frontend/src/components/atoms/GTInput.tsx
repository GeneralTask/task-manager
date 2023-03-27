import React, { forwardRef, useRef } from 'react'
import styled from 'styled-components'
import { Border, Colors, Spacing, Typography } from '../../styles'
import { icons } from '../../styles/images'
import { Icon } from './Icon'

const Container = styled.div`
    display: flex;
    align-items: center;
    gap: ${Spacing._8};
    padding: ${Spacing._8};
    border: ${Border.stroke.medium} solid ${Colors.background.border};
    border-radius: ${Border.radius.medium};
    width: 100%;
    box-sizing: border-box;
    :focus-within {
        border: ${Border.stroke.medium} solid ${Colors.legacyColors.purple};
    }
    transition: border var(--animate-border-easing);
`
const StyledInput = styled.input<{ fontSize: 'small' | 'medium' | 'large' }>`
    all: unset;
    width: 100%;
    box-sizing: border-box;
    ${({ fontSize }) => fontSize === 'small' && Typography.body.medium};
    ${({ fontSize }) => fontSize === 'medium' && Typography.title.medium};
    ${({ fontSize }) => fontSize === 'large' && Typography.headline.large};
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
        if (inputRef.current && e.key === 'Escape') inputRef.current.blur()
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
