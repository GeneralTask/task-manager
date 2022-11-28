import { forwardRef, useEffect, useLayoutEffect, useRef } from 'react'
import styled from 'styled-components'
import { useWindowSize } from '../../../hooks'
import { Border, Colors, Spacing, Typography } from '../../../styles'
import { useCalendarContext } from '../../calendar/CalendarContext'
import { FontSize, PlainTextEditorProps } from './types'

const PlainTextArea = styled.textarea<{ fontSize: FontSize }>`
    background-color: inherit;
    outline: none;
    border: none;
    border-radius: ${Border.radius.small};
    resize: none;
    width: 100%;
    box-sizing: border-box;
    height: 100%;
    padding: ${Spacing._8};
    white-space: pre-wrap;
    color: ${Colors.text.black};
    ${({ fontSize }) => fontSize === 'small' && Typography.bodySmall};
    ${({ fontSize }) => fontSize === 'medium' && Typography.subtitle};
    ${({ fontSize }) => fontSize === 'large' && Typography.title};
`

const PlainTextEditor = forwardRef((props: PlainTextEditorProps, textAreaRef) => {
    const { isFullHeight, maxHeight, value, onChange, ...rest } = props
    const ref = useRef<HTMLTextAreaElement | null>(null)
    const windowSize = useWindowSize()
    const { isCollapsed } = useCalendarContext()
    const resizeEditor = () => {
        if (!isFullHeight && ref.current) {
            ref.current.style.height = '0px'
            ref.current.style.height =
                maxHeight && ref.current.scrollHeight > maxHeight ? `${maxHeight}px` : `${ref.current.scrollHeight}px`
        }
    }

    useLayoutEffect(() => {
        if (ref.current) {
            ref.current.value = value
        }
    }, [value])

    useEffect(resizeEditor, [value, maxHeight, windowSize, isCollapsed])

    useEffect(() => {
        if (props.autoSelect && ref.current) {
            ref.current.select()
        }
    }, [])

    const handleKeyDown: React.KeyboardEventHandler<HTMLTextAreaElement> = (e) => {
        if (ref.current && (e.key === 'Escape' || (props.blurOnEnter && e.key === 'Enter'))) {
            ref.current.blur()
        }
    }

    return (
        <PlainTextArea
            ref={(node) => {
                ref.current = node
                if (typeof textAreaRef === 'function') {
                    textAreaRef(node)
                } else if (textAreaRef !== null) {
                    textAreaRef.current = node
                }
            }}
            onChange={(e) => {
                resizeEditor()
                onChange(e.target.value)
            }}
            onKeyDown={handleKeyDown}
            {...rest}
        />
    )
})

export default PlainTextEditor
