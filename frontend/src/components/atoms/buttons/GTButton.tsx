import { Border, Colors, Shadows, Spacing, Typography } from '../../../styles'
import React from 'react'
import styled from 'styled-components'
import { Icon } from '../Icon'
import { icons, TIconImage } from '../../../styles/images'

const RoundedButton = styled.button<{ styleType: 'primary' | 'secondary'; wrapText?: boolean }>`
    all: unset;
    display: flex;
    flex-direction: row;
    justify-content: center;
    align-items: center;
    gap: ${Spacing.margin._4};
    border-radius: ${Border.radius.large};
    background-color: ${(props) => props.color};
    padding: ${Spacing.padding._8} ${Spacing.padding._12};
    text-align: center;
    height: 100%;
    color: ${(props) => (props.styleType === 'primary' ? Colors.white : Colors.black)};
    box-shadow: ${Shadows.buttonShadow};
    font-weight: ${Typography.weight._600};
    font-size: ${Typography.xSmall.fontSize};
    line-height: ${Typography.xSmall.lineHeight};
    white-space: ${(props) => (props.wrapText ? 'normal' : 'nowrap')};
    overflow: hidden;
    text-overflow: ellipsis;
    cursor: pointer;
    &:hover {
        box-shadow: ${(props) =>
            props.styleType === 'primary' ? Shadows.buttonShadowPrimaryHover : Shadows.buttonShadowSecondaryHover};
    }
    &:active {
        box-shadow: ${(props) =>
            props.styleType === 'primary' ? Shadows.buttonShadowPrimaryActive : Shadows.buttonShadowSecondaryActive};
    }
`

interface GTButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
    color?: string
    styleType?: 'primary' | 'secondary'
    wrapText?: boolean
    iconSource?: TIconImage
}
const GTButton = (props: GTButtonProps) => {
    const color = props.disabled ? Colors.gray._400 : props.color || Colors.white
    return (
        <RoundedButton
            disabled={props.disabled}
            onClick={props.onClick}
            color={color}
            styleType={props.styleType || 'primary'}
            wrapText={props.wrapText}
        >
            {props.iconSource && <Icon size="small" source={icons[props.iconSource]} />}
            {props.value}
        </RoundedButton>
    )
}

export default GTButton
