import { useLayoutEffect, useRef } from 'react'
import styled from 'styled-components'
import { Typography } from '../../../styles'
import { FontSize, GTTextFieldProps } from './types'

const PlainTextArea = styled.textarea<{ fontSize: FontSize }>`
    outline: none;
    border: none;
    resize: none;
    box-sizing: border-box;
    width: 100%;
    height: 100%;
    padding: 0;
    ${({ fontSize }) => fontSize === 'small' && Typography.bodySmall};
    ${({ fontSize }) => fontSize === 'medium' && Typography.subtitle};
    ${({ fontSize }) => fontSize === 'large' && Typography.title};
`

const PlainTextEditor = (props: GTTextFieldProps) => {
    const { isFullHeight, maxHeight, initialValue, onChange, ...rest } = props
    const ref = useRef<HTMLTextAreaElement>(null)
    useLayoutEffect(() => {
        if (!isFullHeight && ref.current) {
            ref.current.style.height = '0px'
            ref.current.style.height =
                maxHeight && ref.current.scrollHeight > maxHeight ? `${maxHeight}px` : `${ref.current.scrollHeight}px`
        }
    }, [initialValue, maxHeight])

    useLayoutEffect(() => {
        if (ref.current) {
            ref.current.value = initialValue
        }
    }, [initialValue])

    const handleKeyDown: React.KeyboardEventHandler<HTMLTextAreaElement> = (e) => {
        if (ref.current && (e.key === 'Escape' || (props.blurOnEnter && e.key === 'Enter'))) {
            ref.current.blur()
        }
    }

    return <PlainTextArea ref={ref} onChange={(e) => onChange(e.target.value)} onKeyDown={handleKeyDown} {...rest} />
}

export default PlainTextEditor
