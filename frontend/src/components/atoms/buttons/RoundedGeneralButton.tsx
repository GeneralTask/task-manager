import { Border, Colors, Spacing, Typography } from '../../../styles'
import React from 'react'
import styled from 'styled-components'
import { Icon } from '../Icon'
import { icons, TIconImage } from '../../../styles/images'

const RoundedButton = styled.button<{ hasBorder: boolean; textStyle: 'light' | 'dark'; wrapText?: boolean }>`
    display: flex;
    flex-direction: row;
    justify-content: center;
    gap: ${Spacing.margin._4};
    border-radius: ${Border.radius.large};
    border: ${(props) => (props.hasBorder ? `2px solid ${Colors.gray._100}` : 'none')};
    background-color: ${(props) => props.color};
    padding: ${Spacing.padding._8} ${Spacing.padding._12};
    text-align: center;
    border-radius: ${Border.radius.large};
    height: 100%;
    color: ${(props) => (props.textStyle === 'light' ? Colors.white : Colors.black)};
    font-weight: ${Typography.weight._600};
    font-size: ${Typography.xSmall.fontSize};
    line-height: ${Typography.xSmall.lineHeight};
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
    iconSource?: TIconImage
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
            {props.iconSource && <Icon size="small" source={icons[props.iconSource]} />}
            {props.value}
        </RoundedButton>
    )
}

export default RoundedGeneralButton
