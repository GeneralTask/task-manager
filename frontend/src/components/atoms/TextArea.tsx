import React, { forwardRef } from 'react'
import { Spacing, Typography } from '../../styles'

import styled from 'styled-components'

const TextAreaStyled = styled.textarea`
    box-sizing: border-box;
    flex: 1;
    width: 100%;
    height: 100%;
    resize: none;
    overflow: auto;
    border: none;
    box-shadow: none;
    outline: none;
    padding: ${Spacing.padding._8}px;
    font-style: normal;
    font-weight: normal;
    font-size: ${Typography.xSmall.fontSize};
    background-color: inherit;
    font-family: inherit;
`

interface TextAreaProps {
    value: string
    placeholder?: string
    setValue: (value: string) => void
}
const TextArea = forwardRef<HTMLTextAreaElement, TextAreaProps>((props, ref) => {
    const onChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
        props.setValue(e.target.value)
    }
    return (
        <TextAreaStyled
            ref={ref}
            value={props.value}
            placeholder={props.placeholder || ''}
            onChange={onChange}
            onKeyDown={(e) => e.stopPropagation()}
        />
    )
})

export default TextArea
