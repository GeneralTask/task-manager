import React, { useLayoutEffect, useRef, useState } from 'react'
import styled from 'styled-components'
import { Border, Colors, Shadows, Spacing, Typography } from '../../styles'

const StyledTextArea = styled.textarea<{ isFullHeight: boolean; fontSize: 'small' | 'large' }>`
    ${({ isFullHeight }) => isFullHeight && `flex: 1;`}
    background-color: inherit;
    color: ${Colors.text.black};
    font: inherit;
    border: none;
    resize: none;
    outline: none;
    overflow: auto;
    padding: ${Spacing._8} ${Spacing._8} 0;
    border-radius: ${Border.radius.small};
    :focus,
    :hover {
        outline: ${Border.stroke.medium} solid ${Colors.border.light};
        box-shadow: ${Shadows.light};
        background-color: ${Colors.background.white};
    }
    ${({ fontSize }) => (fontSize === 'small' ? Typography.bodySmall : Typography.subtitle)};
`

interface GTTextAreaProps extends React.TextareaHTMLAttributes<HTMLTextAreaElement> {
    initialValue: string
    onEdit: (newValue: string) => void
    maxHeight?: number
    isFullHeight?: boolean
    fontSize: 'small' | 'large'
}
const GTTextArea = ({ initialValue, onEdit, maxHeight, isFullHeight = false, fontSize, ...rest }: GTTextAreaProps) => {
    const [textAreaValue, setTextAreaValue] = useState(initialValue)
    const textAreaRef = useRef<HTMLTextAreaElement>(null)

    const handleKeyDown: React.KeyboardEventHandler<HTMLTextAreaElement> = (e) => {
        if (textAreaRef.current && e.key === 'Escape') textAreaRef.current.blur()
        e.stopPropagation()
    }

    useLayoutEffect(() => {
        if (textAreaRef.current) {
            textAreaRef.current.style.height = '0px'
            textAreaRef.current.style.height =
                maxHeight && textAreaRef.current.scrollHeight > maxHeight
                    ? `${maxHeight}px`
                    : `${textAreaRef.current.scrollHeight}px`
        }
    }, [textAreaValue])

    useLayoutEffect(() => {
        setTextAreaValue(initialValue)
    }, [initialValue])

    return (
        <StyledTextArea
            ref={textAreaRef}
            onKeyDown={handleKeyDown}
            value={textAreaValue}
            isFullHeight={isFullHeight}
            fontSize={fontSize}
            onChange={(e) => {
                setTextAreaValue(e.target.value)
                onEdit(e.target.value)
            }}
            {...rest}
        />
    )
}

export default GTTextArea
