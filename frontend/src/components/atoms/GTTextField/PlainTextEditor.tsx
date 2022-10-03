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
    height: 100%;
`

const PlainTextEditor = (props: GTTextFieldProps) => {
    const { isFullHeight, maxHeight, value, onChange } = props
    const ref = useRef<HTMLTextAreaElement>(null)
    useLayoutEffect(() => {
        if (!isFullHeight && ref.current) {
            ref.current.style.height = '0px'
            ref.current.style.height =
                maxHeight && ref.current.scrollHeight > maxHeight ? `${maxHeight}px` : `${ref.current.scrollHeight}px`
            console.log({ sh: ref.current.scrollHeight, h: ref.current.style.height, maxHeight })
        }
    }, [value, maxHeight])
    return (
        <PlainTextArea
            ref={ref}
            value={value}
            onChange={(e) => {
                console.log({ whytho: e.target.value })
                onChange(e.target.value)
            }}
            fontSize={props.fontSize}
            // {...rest}
        />
    )
}

export default PlainTextEditor
