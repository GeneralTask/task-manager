import { Border, Colors, Spacing, Typography } from '../../styles'

import React from 'react'
import styled from 'styled-components'

const TextAreaStyled = styled.textarea`
    box-sizing: border-box;
    flex: 1;
    width: 100%;
    height: 100%;
    resize: none;
    overflow: auto;
    border: 1px solid ${Colors.gray._200};
    border-radius: ${Border.radius.small};
    box-shadow: none;
    outline: none;
    padding: ${Spacing.padding._8}px;
    font-family: Switzer-Variable;
    font-style: normal;
    font-weight: normal;
    font-size: ${Typography.xSmall.fontSize}px;
`

interface TextAreaProps {
    value: string
    placeholder?: string
    setValue: (value: string) => void
}
const TextArea = (props: TextAreaProps) => {
    const onChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
        props.setValue(e.target.value)
    }
    return (
        <TextAreaStyled
            value={props.value}
            placeholder={props.placeholder || ''}
            onChange={onChange}
            onKeyDown={(e) => e.stopPropagation()}
        />
    )
}
export default TextArea
