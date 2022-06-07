import { Border, Colors, Shadows, Spacing, Typography } from '../../../styles'
import React from 'react'
import styled from 'styled-components'

const RoundedButton = styled.button<{ hasBorder: boolean; textStyle: 'light' | 'dark'; wrapText?: boolean }>`
    border-radius: ${Border.radius.large};
    box-shadow: ${Shadows.medium};
    border: ${(props) => (props.hasBorder ? `1px solid ${Colors.gray._200}` : 'none')};
    background-color: ${(props) => props.color};
    padding: ${Spacing.padding._8};
    text-align: center;
    border-radius: ${Border.radius.large};
    height: 100%;
    color: ${(props) => (props.textStyle === 'light' ? Colors.white : Colors.black)};
    font-weight: ${Typography.weight._600};
    font-size: ${Typography.xSmall.fontSize};
    white-space: ${(props) => (props.wrapText ? 'normal' : 'nowrap')};
    overflow: hidden;
    text-overflow: ellipsis;
    cursor: pointer;
`

interface RoundedGeneralButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
    color?: string
    textStyle?: 'light' | 'dark'
    wrapText?: boolean
    hasBorder?: boolean
}
const RoundedGeneralButton = (props: RoundedGeneralButtonProps) => {
    const color = props.disabled ? Colors.gray._400 : props.color || Colors.white
    return (
        <RoundedButton
            disabled={props.disabled}
            onClick={props.onClick}
            hasBorder={!!props.hasBorder}
            color={color}
            textStyle={props.textStyle || 'light'}
            wrapText={props.wrapText}
        >
            {props.value}
        </RoundedButton>
    )
}

export default RoundedGeneralButton
