import React, { useLayoutEffect, useRef, useState } from 'react'
import styled from 'styled-components'
import { Border, Colors, Shadows, Spacing } from '../../../styles'
import { stopKeydownPropogation } from '../../../utils/utils'
import MarkdownEditor from './MarkdownEditor/MarkdownEditor'
import PlainTextEditor from './PlainTextEditor'
import { GTTextFieldProps } from './types'

const Container = styled.div<{ isFullHeight: boolean; disabled?: boolean; maxHeight?: number }>`
    background-color: inherit;
    padding: ${Spacing._8};
    border: ${Border.stroke.medium} solid transparent;
    border-radius: ${Border.radius.small};
    :hover,
    :focus-within {
        box-shadow: ${Shadows.light};
        background-color: ${Colors.background.white};
    }
    :hover {
        border-color: ${Colors.border.light};
    }
    :focus-within {
        border-color: ${Colors.gtColor.primary};
    }
    ${({ isFullHeight }) => isFullHeight && `height: 100%;`}
`

const GTTextField = ({
    initialValue,
    onChange,
    fontSize,
    type = 'plaintext',
    maxHeight,
    isFullHeight = false,
    blurOnEnter,
    ...rest
}: GTTextFieldProps) => {
    const [value, setValue] = useState(initialValue)
    const containerRef = useRef<HTMLDivElement>(null)

    const handleKeyDown: React.KeyboardEventHandler<HTMLDivElement> = (e) => {
        if (containerRef.current && (e.key === 'Escape' || (blurOnEnter && e.key === 'Enter'))) {
            containerRef.current.blur()
        }
        stopKeydownPropogation(e)
    }

    useLayoutEffect(() => {
        setValue(value)
    }, [initialValue])

    const Editor = type === 'markdown' ? MarkdownEditor : PlainTextEditor

    return (
        <Container ref={containerRef} onKeyDown={handleKeyDown} isFullHeight={isFullHeight} maxHeight={maxHeight}>
            <Editor
                fontSize={fontSize}
                initialValue={initialValue}
                value={value}
                onChange={(val) => {
                    setValue(val)
                    onChange(val)
                }}
                maxHeight={maxHeight}
                {...rest}
            />
        </Container>
    )
}

export default GTTextField
