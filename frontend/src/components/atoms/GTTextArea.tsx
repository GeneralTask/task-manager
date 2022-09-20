import React, { forwardRef, useLayoutEffect, useRef, useState } from 'react'
import styled from 'styled-components'
import { Border, Colors, Shadows, Spacing, Typography } from '../../styles'
import { stopKeydownPropogation } from '../../utils/utils'

const StyledTextArea = styled.textarea<{ isFullHeight: boolean; fontSize: 'small' | 'medium' | 'large' }>`
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
        ${({ disabled }) =>
            !disabled &&
            `
            outline: ${Border.stroke.medium} solid ${Colors.border.light};
            box-shadow: ${Shadows.light};
            background-color: ${Colors.background.white};`}
    }
    ${({ isFullHeight }) => isFullHeight && `height: 100%;`}
    ${({ fontSize }) => fontSize === 'small' && Typography.bodySmall};
    ${({ fontSize }) => fontSize === 'medium' && Typography.subtitle};
    ${({ fontSize }) => fontSize === 'large' && Typography.title};
`

interface GTTextAreaProps extends React.TextareaHTMLAttributes<HTMLTextAreaElement> {
    initialValue: string
    onEdit: (newValue: string) => void
    maxHeight?: number
    isFullHeight?: boolean
    blurOnEnter?: boolean
    fontSize: 'small' | 'medium' | 'large'
}
const GTTextArea = forwardRef(
    (
        { initialValue, onEdit, maxHeight, isFullHeight = false, blurOnEnter, fontSize, ...rest }: GTTextAreaProps,
        ref
    ) => {
        const [textAreaValue, setTextAreaValue] = useState(initialValue)
        const textAreaRef = useRef<HTMLTextAreaElement | null>(null)

        const handleKeyDown: React.KeyboardEventHandler<HTMLTextAreaElement> = (e) => {
            if (textAreaRef.current && (e.key === 'Escape' || (blurOnEnter && e.key === 'Enter'))) {
                textAreaRef.current.blur()
            }
            stopKeydownPropogation(e)
        }

        useLayoutEffect(() => {
            if (!isFullHeight && textAreaRef.current) {
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
                ref={(node) => {
                    textAreaRef.current = node
                    if (typeof ref === 'function') {
                        ref(node)
                    } else if (ref !== null) {
                        ref.current = node
                    }
                }}
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
)

export default GTTextArea
