import React from 'react'
import { Border, Colors, Spacing, Typography } from '../../styles'
import styled from 'styled-components'


const ModalTextArea = styled.textarea`
    box-sizing: border-box;
    flex: 1;
    width: 100%;
    resize: none;
    overflow: auto;
    border: 1px solid ${Colors.gray._200};
    border-radius: ${Border.radius.small};
    box-shadow: none;
    outline: none;
    padding: ${Spacing.padding.small}px;
    font-family: Switzer-Variable;
    font-style: normal;
    font-weight: normal;
    font-size: ${Typography.xSmall.fontSize}px;
`

interface TextAreaProps {
    value: string
    setValue: (value: string) => void
}
const TextArea = (props: TextAreaProps) => {
    const onChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
        props.setValue(e.target.value)
    }
    return (
        <ModalTextArea value={props.value} onChange={onChange} />
    )
}
export default TextArea
