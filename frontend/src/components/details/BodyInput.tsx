import React, { useLayoutEffect, useRef, useState } from 'react'
import styled from 'styled-components'
import { Border, Spacing, Colors, Typography, Shadows } from '../../styles'

// This constant is used to shrink the task body so that the text is centered AND a scrollbar doesn't appear when typing.
const BODY_HEIGHT_OFFSET = 16
const BODY_MAX_HEIGHT = 200

const StyledBodyInput = styled.textarea<{ isFullHeight: boolean }>`
    ${({ isFullHeight }) => isFullHeight && `flex: 1;`}
    display: block;
    background-color: inherit;
    border: ${Border.stroke.medium} solid transparent;
    border-radius: ${Border.radius.large};
    resize: none;
    outline: none;
    overflow: auto;
    padding: ${Spacing.padding._12};
    font: inherit;
    color: ${Colors.text.light};
    ${Typography.bodySmall};
    :focus,
    :hover {
        border: ${Border.stroke.medium} solid ${Colors.background.dark};
        box-shadow: ${Shadows.medium};
    }
`

interface BodyInputProps extends React.TextareaHTMLAttributes<HTMLTextAreaElement> {
    initialValue: string
    isFullHeight: boolean
    onEdit: (newValue: string) => void
}
const BodyInput = ({ initialValue, isFullHeight, onEdit, ...rest }: BodyInputProps) => {
    const [bodyInputValue, setBodyInputValue] = useState(initialValue)
    const bodyInputRef = useRef<HTMLTextAreaElement>(null)

    const handleKeyDown: React.KeyboardEventHandler<HTMLTextAreaElement> = (e) => {
        if (bodyInputRef.current && (e.key === 'Enter' || e.key === 'Escape')) bodyInputRef.current.blur()
        e.stopPropagation()
    }

    useLayoutEffect(() => {
        if (bodyInputRef.current && !isFullHeight) {
            bodyInputRef.current.style.height = '0px'
            bodyInputRef.current.style.height =
                bodyInputRef.current.scrollHeight > BODY_MAX_HEIGHT
                    ? `${BODY_MAX_HEIGHT}px`
                    : `${bodyInputRef.current.scrollHeight - BODY_HEIGHT_OFFSET}px`
        }
    }, [bodyInputValue])

    useLayoutEffect(() => {
        setBodyInputValue(initialValue)
    }, [initialValue])

    return (
        <StyledBodyInput
            ref={bodyInputRef}
            placeholder="Add details"
            isFullHeight={isFullHeight}
            value={bodyInputValue}
            onKeyDown={handleKeyDown}
            onChange={(e) => {
                setBodyInputValue(e.target.value)
                onEdit(e.target.value)
            }}
            {...rest}
        />
    )
}

export default BodyInput
